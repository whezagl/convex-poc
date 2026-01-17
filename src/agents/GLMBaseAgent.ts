import type { Id } from "../../convex/_generated/dataModel.js";
import { convex } from "../convex/client.js";
import type { AgentConfig } from "../types/agent.js";

/**
 * Abstract base class for GLM-4.7 agents using Z.AI's API directly via fetch.
 *
 * This class provides:
 * - Automatic session creation and tracking via Convex
 * - GLM-4.7 integration using native fetch (no OpenAI SDK dependency)
 * - Streaming response support via Server-Sent Events
 * - Rate limiting with exponential backoff for 429 errors
 * - Verbose logging mode for debugging
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

  private readonly apiKey: string;
  private readonly baseURL: string;
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

    this.apiKey = apiKey;
    this.baseURL = "https://api.z.ai/api/coding/paas/v4/";

    this.verbose = config.verbose ?? false;
    this.rateLimitConfig = {
      minDelay: config.rateLimit?.minDelay ?? 1000,
      maxRetries: config.rateLimit?.maxRetries ?? 3,
      initialBackoff: config.rateLimit?.initialBackoff ?? 1000,
    };

    if (this.verbose) {
      console.log(`[GLMBaseAgent] Initialized ${this.agentType} with native fetch`);
      console.log(`[GLMBaseAgent] Base URL: ${this.baseURL}`);
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
   * Defaults to "glm-4.7" for the coding endpoint.
   *
   * @returns The model name
   */
  protected getModel(): string {
    return this.config.model || "glm-4.7";
  }

  /**
   * Returns the temperature setting for the model.
   *
   * @returns The temperature value (0.0 to 1.0)
   */
  protected getTemperature(): number {
    return 0.6;
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
   */
  protected async createSession(input: string): Promise<void> {
    if (!this.workflowId) {
      if (this.verbose) {
        console.warn(`[GLMBaseAgent] No workflowId provided, skipping session creation`);
      }
      return;
    }

    try {
      const session = await convex.mutations.agents.createAgentSession({
        agentType: this.agentType,
        input: input,
        workflowId: this.workflowId,
      });
      this.sessionId = session as Id<"agentSessions">;
      if (this.verbose) {
        console.log(`[GLMBaseAgent] Created session ${this.sessionId} for ${this.agentType}`);
      }
    } catch (error) {
      console.error("[GLMBaseAgent] Failed to create session:", error);
    }
  }

  /**
   * Updates the existing agent session in Convex.
   */
  protected async updateSession(output: string, status: string): Promise<void> {
    if (!this.sessionId) {
      if (this.verbose) {
        console.warn(`[GLMBaseAgent] No sessionId to update`);
      }
      return;
    }

    try {
      await convex.mutations.agents.updateAgentSession({
        sessionId: this.sessionId,
        status: status,
        output: output,
      });
      if (this.verbose) {
        console.log(`[GLMBaseAgent] Updated session ${this.sessionId} with status: ${status}`);
      }
    } catch (error) {
      console.error("[GLMBaseAgent] Failed to update session:", error);
    }
  }

  /**
   * Main execution entry point for the agent.
   */
  public async execute(input: string): Promise<string> {
    await this.applyRateLimitDelay();
    return this.executeWithRetry(input);
  }

  /**
   * Applies rate limiting delay between requests.
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

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Executes the API call with retry logic for 429 errors.
   */
  private async executeWithRetry(
    input: string,
    attempt: number = 1
  ): Promise<string> {
    this.currentInput = input;
    this.currentOutput = null;

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

      const errorMessage = this.getErrorMessage(error);
      console.error(`[GLMBaseAgent] GLM call failed after ${attempt} attempts:`, error);

      await this.updateSession(`Error: ${errorMessage}`, "failed");

      throw new Error(`GLM execution failed after ${attempt} attempts: ${errorMessage}`);
    }
  }

  /**
   * Checks if an error is a 429 rate limit error.
   */
  private is429Error(error: unknown): boolean {
    if (error instanceof Error) {
      if ("status" in error && (error as { status: number }).status === 429) {
        return true;
      }
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
   * Calls the GLM-4.7 API directly via fetch with streaming support.
   */
  private async callGLMAPI(input: string): Promise<string> {
    const startTime = Date.now();

    const requestBody = {
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
      stream: false, // Use non-streaming for simplicity
      temperature: this.getTemperature(),
      max_tokens: this.getMaxTokens(),
    };

    if (this.verbose) {
      console.log(`[GLMBaseAgent] API Request - Model: ${this.getModel()}`);
      console.log(`[GLMBaseAgent] API Request - URL: ${this.baseURL}chat/completions`);
      console.log(`[GLMBaseAgent] API Request - Input: ${input.substring(0, 100)}...`);
      console.log(`[GLMBaseAgent] API Request - Body:`, JSON.stringify(requestBody, null, 2));
    } else {
      console.log(`[GLMBaseAgent] Calling GLM (${this.getModel()}) with input: ${input.substring(0, 50)}...`);
    }

    const response = await fetch(`${this.baseURL}chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      const errorData = this.tryParseJSON(errorText);

      if (this.verbose) {
        console.error(`[GLMBaseAgent] API Error - Status: ${response.status}`);
        console.error(`[GLMBaseAgent] API Error - Response:`, errorData);
      }

      const error = new Error(
        `GLM API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      );
      (error as { status: number }).status = response.status;
      throw error;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    if (this.verbose) {
      console.log(`[GLMBaseAgent] API Response - Duration: ${duration}ms`);
      console.log(`[GLMBaseAgent] API Response - Output length: ${content.length} chars`);
      console.log(`[GLMBaseAgent] API Response - Output preview: ${content.substring(0, 100)}...`);
      console.log(`[GLMBaseAgent] API Response - Full data:`, JSON.stringify(data, null, 2));
    } else {
      console.log(`[GLMBaseAgent] GLM-4.7 response received: ${content.length} chars (${duration}ms)`);
    }

    this.currentOutput = content;
    await this.updateSession(this.currentOutput, "completed");

    return this.currentOutput;
  }

  /**
   * Helper to safely parse JSON.
   */
  private tryParseJSON(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  /**
   * Returns the current session ID if a session is active.
   */
  public getSessionId(): Id<"agentSessions"> | null {
    return this.sessionId;
  }

  /**
   * Returns the current output from the last execution.
   */
  public getOutput(): string | null {
    return this.currentOutput;
  }
}
