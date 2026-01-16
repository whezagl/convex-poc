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

    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.z.ai/api/paas/v4/",
    });

    console.log(`[GLMBaseAgent] Initialized ${this.agentType} with Z.AI API`);
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
    // Store input for Convex tracking
    this.currentInput = input;
    this.currentOutput = null;

    // Create session if workflowId is provided
    await this.createSession(input);

    try {
      console.log(`[GLMBaseAgent] Calling GLM-4.7 with input: ${input.substring(0, 50)}...`);

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
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        const reasoning = chunk.choices[0]?.delta?.reasoning_content || "";

        // GLM-4.7 returns both reasoning_content and content
        if (reasoning) {
          // Optional: You can capture reasoning if needed
          // console.log(`[Reasoning]: ${reasoning}`);
        }
        if (content) {
          chunks.push(content);
        }
      }

      // Store output for Convex tracking
      this.currentOutput = chunks.join("");

      // Update session with successful result
      await this.updateSession(this.currentOutput, "completed");

      console.log(`[GLMBaseAgent] GLM-4.7 response received: ${this.currentOutput.length} chars`);

      return this.currentOutput;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[GLMBaseAgent] GLM-4.7 call failed:`, error);

      // Update session with error status
      await this.updateSession(
        `Error: ${errorMessage}`,
        "failed"
      );

      throw new Error(`GLM-4.7 execution failed: ${errorMessage}`);
    }
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
