import OpenAI from "openai";
import type { Id } from "../../convex/_generated/dataModel.js";
import { convex } from "../convex/client.js";
import type { AgentConfig } from "../types/agent.js";

/**
 * Abstract base class for GLM-4.7 agents using Z.AI's OpenAI-compatible API.
 *
 * This class provides:
 * - Automatic session creation and tracking via Convex
 * - GLM-4.7 integration with thinking mode enabled
 * - Streaming response support
 * - Protected methods for Convex integration details
 *
 * Subclasses must implement:
 * - getSystemPrompt(): Returns the agent's system prompt
 *
 * Example usage:
 * ```typescript
 * class MyGLMAgent extends GLMBaseAgent {
 *   protected getSystemPrompt(): string {
 *     return "You are a helpful TypeScript developer.";
 *   }
 * }
 *
 * const agent = new MyGLMAgent({ agentType: "my-glm-agent" });
 * const result = await agent.execute("Write a function to validate emails");
 * ```
 */
export abstract class GLMBaseAgent {
  protected sessionId: Id<"agentSessions"> | null = null;
  protected readonly agentType: string;
  protected readonly workflowId?: Id<"workflows">;
  protected readonly config: AgentConfig;
  protected currentInput: string | null = null;
  protected currentOutput: string | null = null;

  private readonly client: OpenAI;
  private readonly verbose: boolean;
  private readonly rateLimitConfig: Required<
    NonNullable<AgentConfig["rateLimit"]>
  >;
  private lastRequestTime: number = 0;

  /**
   * Creates a new GLMBaseAgent instance.
   *
   * @param config - Agent configuration including type and optional workflow ID
   * @throws Error if ZAI_API_KEY is not set
   */
  constructor(config: AgentConfig) {
    this.agentType = config.agentType;
    this.workflowId = config.workflowId;
    this.config = config;

    const apiKey = process.env.ZAI_API_KEY;
    if (!apiKey) {
      throw new Error("ZAI_API_KEY environment variable is required for GLMBaseAgent");
    }

    this.verbose = config.verbose ?? false;
    this.rateLimitConfig = {
      minDelay: config.rateLimit?.minDelay ?? 1000,
      maxRetries: config.rateLimit?.maxRetries ?? 3,
      initialBackoff: config.rateLimit?.initialBackoff ?? 1000,
    };

    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.z.ai/api/paas/v4/",
    });

    if (this.verbose) {
      console.log(`[GLMBaseAgent] Initialized ${this.agentType} with Z.AI API`);
      console.log(`[GLMBaseAgent] Rate limiting: minDelay=${this.rateLimitConfig.minDelay}ms, maxRetries=${this.rateLimitConfig.maxRetries}`);
    }
  }

  /**
   * Abstract method that subclasses must implement.
   * Returns the system prompt for this agent type.
   *
   * @returns The system prompt string
   */
  protected abstract getSystemPrompt(): string;

  /**
   * Returns the model name to use for this agent.
   * Defaults to "glm-4.7" if not specified in config.
   *
   * @returns The model name
   */
  protected getModel(): string {
    return this.config.model || "glm-4.7";
  }

  /**
   * Returns the temperature setting for the model.
   * Lower values (0.1-0.3) for deterministic output
   * Higher values (0.7-1.0) for creative output
   *
   * @returns The temperature value (0.0 to 1.0)
   */
  protected getTemperature(): number {
    return 0.6; // Balanced temperature for code generation
  }

  /**
   * Returns the max tokens setting for the model.
   *
   * @returns The max tokens value
   */
  protected getMaxTokens(): number {
    return 4096;
  }

  /**
   * Creates a new agent session in Convex.
   *
   * @param input - The input prompt for the session
   */
  protected async createSession(input: string): Promise<void> {
    if (!this.workflowId) {
      console.warn(`[GLMBaseAgent] No workflowId provided, skipping session creation`);
      return;
    }

    try {
      const session = await convex.mutations.agents.createAgentSession({
        agentType: this.agentType,
        input: input,
        workflowId: this.workflowId,
      });
      this.sessionId = session as Id<"agentSessions">;
      console.log(`[GLMBaseAgent] Created session ${this.sessionId} for ${this.agentType}`);
    } catch (error) {
      console.error("[GLMBaseAgent] Failed to create session:", error);
      // Don't throw - allow execution to proceed even if tracking fails
    }
  }

  /**
   * Updates the existing agent session in Convex.
   *
   * @param output - The output content to store
   * @param status - The status of the session (completed, failed, etc.)
   */
  protected async updateSession(output: string, status: string): Promise<void> {
    if (!this.sessionId) {
      console.warn(`[GLMBaseAgent] No sessionId to update`);
      return;
    }

    try {
      await convex.mutations.agents.updateAgentSession({
        sessionId: this.sessionId,
        status: status,
        output: output,
      });
      console.log(`[GLMBaseAgent] Updated session ${this.sessionId} with status: ${status}`);
    } catch (error) {
      console.error("[GLMBaseAgent] Failed to update session:", error);
      // Don't throw - allow execution to complete gracefully
    }
  }

  /**
   * Main execution entry point for the agent.
   * Calls the GLM-4.7 API via OpenAI SDK with streaming enabled.
   *
   * @param input - The input prompt for the agent
   * @returns The agent's response as a string
   */
  public async execute(input: string): Promise<string> {
    // Apply rate limiting delay before making the request
    await this.applyRateLimitDelay();

    return this.executeWithRetry(input);
  }

  /**
   * Applies rate limiting delay between requests.
   * Ensures minimum time gap between consecutive API calls.
   */
  private async applyRateLimitDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitConfig.minDelay) {
      const delay = this.rateLimitConfig.minDelay - timeSinceLastRequest;
      if (this.verbose) {
        console.log(`[GLMBaseAgent] Rate limiting: waiting ${delay}ms before request`);
      }
      await this.sleep(delay);
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Sleep helper for delays.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Executes the API call with retry logic for 429 errors.
   * Implements exponential backoff for rate limit handling.
   */
  private async executeWithRetry(
    input: string,
    attempt: number = 1
  ): Promise<string> {
    // Store input for Convex tracking
    this.currentInput = input;
    this.currentOutput = null;

    // Create session if workflowId is provided
    await this.createSession(input);

    try {
      return await this.callGLMAPI(input);
    } catch (error) {
      const is429Error = this.is429Error(error);

      if (is429Error && attempt < this.rateLimitConfig.maxRetries) {
        const backoffDelay = this.rateLimitConfig.initialBackoff * Math.pow(2, attempt - 1);
        console.warn(
          `[GLMBaseAgent] 429 error detected (attempt ${attempt}/${this.rateLimitConfig.maxRetries}), ` +
            `retrying after ${backoffDelay}ms...`
        );
        await this.sleep(backoffDelay);
        return this.executeWithRetry(input, attempt + 1);
      }

      // Max retries exceeded or non-429 error
      const errorMessage = this.getErrorMessage(error);
      console.error(`[GLMBaseAgent] GLM call failed after ${attempt} attempts:`, error);

      // Update session with error status
      await this.updateSession(`Error: ${errorMessage}`, "failed");

      throw new Error(`GLM execution failed after ${attempt} attempts: ${errorMessage}`);
    }
  }

  /**
   * Checks if an error is a 429 rate limit error.
   */
  private is429Error(error: unknown): boolean {
    if (error instanceof Error) {
      // Check for 429 status code in error message or custom status property
      if ("status" in error && (error as { status: number }).status === 429) {
        return true;
      }
      // Check for common 429 error messages
      const message = error.message.toLowerCase();
      return (
        message.includes("429") ||
        message.includes("rate limit") ||
        message.includes("too many requests") ||
        message.includes("insufficient balance")
      );
    }
    return false;
  }

  /**
   * Extracts error message from various error types.
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * Calls the GLM-4.7 API with streaming enabled.
   */
  private async callGLMAPI(input: string): Promise<string> {
    const startTime = Date.now();

    if (this.verbose) {
      console.log(`[GLMBaseAgent] API Request - Model: ${this.getModel()}`);
      console.log(`[GLMBaseAgent] API Request - Input: ${input.substring(0, 100)}...`);
      console.log(`[GLMBaseAgent] API Request - Temperature: ${this.getTemperature()}, MaxTokens: ${this.getMaxTokens()}`);
    } else {
      console.log(`[GLMBaseAgent] Calling GLM-4.7 with input: ${input.substring(0, 50)}...`);
    }

    // Call GLM-4.7 with streaming enabled
    const stream = await this.client.chat.completions.create({
      model: this.getModel(),
      messages: [
        {
          role: "system",
          content: this.getSystemPrompt(),
        },
        {
          role: "user",
          content: input,
        },
      ],
      thinking: {
        type: "enabled", // Enable GLM-4.7's reasoning mode
      },
      stream: true,
      temperature: this.getTemperature(),
      max_tokens: this.getMaxTokens(),
    });

    // Collect streaming response
    const chunks: string[] = [];
    let chunkCount = 0;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      const reasoning = chunk.choices[0]?.delta?.reasoning_content || "";

      // GLM-4.7 returns both reasoning_content and content
      if (reasoning && this.verbose) {
        // Capture reasoning in verbose mode
        console.log(`[GLMBaseAgent] Reasoning chunk: ${reasoning.substring(0, 50)}...`);
      }
      if (content) {
        chunks.push(content);
        chunkCount++;
        if (this.verbose && chunkCount % 10 === 0) {
          console.log(`[GLMBaseAgent] Received ${chunkCount} chunks...`);
        }
      }
    }

    // Store output for Convex tracking
    this.currentOutput = chunks.join("");

    // Update session with successful result
    await this.updateSession(this.currentOutput, "completed");

    const duration = Date.now() - startTime;
    if (this.verbose) {
      console.log(`[GLMBaseAgent] API Response - Duration: ${duration}ms`);
      console.log(`[GLMBaseAgent] API Response - Chunks received: ${chunkCount}`);
      console.log(`[GLMBaseAgent] API Response - Output length: ${this.currentOutput.length} chars`);
      console.log(`[GLMBaseAgent] API Response - Output preview: ${this.currentOutput.substring(0, 100)}...`);
    } else {
      console.log(`[GLMBaseAgent] GLM-4.7 response received: ${this.currentOutput.length} chars (${duration}ms)`);
    }

    return this.currentOutput;
  }

  /**
   * Returns the current session ID if a session is active.
   *
   * @returns The session ID or null if no session is active
   */
  public getSessionId(): Id<"agentSessions"> | null {
    return this.sessionId;
  }

  /**
   * Returns the current output from the last execution.
   *
   * @returns The current output or null if no execution has occurred
   */
  public getOutput(): string | null {
    return this.currentOutput;
  }
}
