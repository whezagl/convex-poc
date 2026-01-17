import { query, Options, HookInput } from "@anthropic-ai/claude-agent-sdk";
import type { Id } from "../../convex/_generated/dataModel.js";
import { convex } from "../convex/client.js";
import type { AgentConfig } from "../types/agent.js";

/**
 * Abstract base class for Claude Agent SDK integration with Convex state management.
 *
 * This class provides:
 * - Automatic session creation and tracking via Convex
 * - Hook-based lifecycle management (SessionStart, SessionEnd)
 * - Manual state persistence pattern (subclasses call execute() explicitly)
 * - Protected methods for Convex integration details
 *
 * Subclasses must implement:
 * - getSystemPrompt(): Returns the agent's system prompt
 *
 * Example usage:
 * ```typescript
 * class MyAgent extends BaseAgent {
 *   protected getSystemPrompt(): string {
 *     return "You are a helpful assistant.";
 *   }
 * }
 *
 * const agent = new MyAgent({ agentType: "my-agent" });
 * const result = await agent.execute("Hello, world!");
 * ```
 */
export abstract class BaseAgent {
  protected sessionId: Id<"agentSessions"> | null = null;
  protected readonly agentType: string;
  protected readonly workflowId?: Id<"workflows">;
  protected readonly config: AgentConfig;
  protected currentInput: string | null = null;
  protected currentOutput: string | null = null;

  /**
   * Creates a new BaseAgent instance.
   *
   * @param config - Agent configuration including type, model, and optional workflow ID
   */
  constructor(config: AgentConfig) {
    this.agentType = config.agentType;
    this.workflowId = config.workflowId;
    this.config = config;
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
   * Defaults to "sonnet" if not specified in config.
   *
   * @returns The model name
   */
  protected getModel(): string {
    return this.config.model || "sonnet";
  }

  /**
   * Builds the Convex context object for mutations and queries.
   * Returns session metadata for Convex integration.
   *
   * @returns Convex context object with session metadata
   */
  protected buildConvexContext(): Record<string, unknown> {
    return {
      sessionId: this.sessionId,
      agentType: this.agentType,
      workflowId: this.workflowId,
    };
  }

  /**
   * Builds the SDK options with hooks for Convex integration and GLM support.
   *
   * When GLM_API_KEY is set, this method configures the agent SDK to route
   * requests to GLM's compatible endpoint via the env option. The spawned
   * Claude Code process receives ANTHROPIC_API_KEY and ANTHROPIC_BASE_URL
   * pointing to GLM, enabling model-agnostic operation.
   *
   * @returns SDK options object with hooks and optional GLM env configuration
   */
  protected buildOptions(): Options {
    const options: Options = {
      systemPrompt: this.getSystemPrompt(),
      model: this.getModel(),
      hooks: {
        SessionStart: [
          {
            hooks: [
              async (input: HookInput) => {
                try {
                  if (this.workflowId) {
                    const sessionId = (input as any).session_id || "unknown";
                    const source = (input as any).source || "startup";

                    const session = await convex.mutations.agents.createAgentSession({
                      agentType: this.agentType,
                      input: `Session ${sessionId} started (${source})`,
                      workflowId: this.workflowId,
                    });
                    this.sessionId = session as Id<"agentSessions">;
                    console.log(`[BaseAgent] Created session ${this.sessionId} for ${this.agentType}`);
                  }
                } catch (error) {
                  console.error("[BaseAgent] SessionStart error:", error);
                }
                return { continue: true };
              },
            ],
          },
        ],
        SessionEnd: [
          {
            hooks: [
              async (input: HookInput) => {
                try {
                  if (this.sessionId) {
                    const reason = (input as any).reason || "completed";
                    const output = this.currentOutput || `Session ended: ${reason}`;

                    await convex.mutations.agents.updateAgentSession({
                      sessionId: this.sessionId,
                      status: "completed",
                      output: output,
                    });
                    console.log(`[BaseAgent] Updated session ${this.sessionId} with completion status`);
                  }
                } catch (error) {
                  console.error("[BaseAgent] SessionEnd error:", error);
                }
                return { continue: true };
              },
            ],
          },
        ],
      },
    };

    const glmApiKey = process.env.GLM_API_KEY;
    const glmBaseUrl = process.env.GLM_BASE_URL;

    if (glmApiKey) {
      console.log(`[BaseAgent] GLM_API_KEY detected, configuring agent SDK to use GLM-4.7`);

      const glmAnthropicUrl = 'https://api.z.ai/api/anthropic';

      let baseUrl = glmAnthropicUrl;
      if (glmBaseUrl && !glmBaseUrl.includes('/v4') && !glmBaseUrl.includes('/chat/completions')) {
        baseUrl = glmBaseUrl;
        console.log(`[BaseAgent] Using custom GLM endpoint from GLM_BASE_URL: ${baseUrl}`);
      } else {
        if (glmBaseUrl) {
          console.log(`[BaseAgent] Ignoring GLM_BASE_URL (${glmBaseUrl}) - using Anthropic-compatible endpoint instead`);
        }
        console.log(`[BaseAgent] Using GLM Anthropic-compatible endpoint: ${baseUrl}`);
      }

      options.env = {
        ...process.env,
        ANTHROPIC_API_KEY: glmApiKey,
        ANTHROPIC_BASE_URL: baseUrl,
      };

      if (!this.config.model) {
        options.model = "glm-4.7";
      }
    }

    return options;
  }

  /**
   * Extracts the output from a HookInput.
   * The HookInput for SessionEnd contains the exit reason.
   *
   * @param input - The hook input containing execution results
   * @returns The extracted output string
   */
  protected extractOutput(input: HookInput): string {
    // SessionEnd hook has reason property
    const reason = (input as any).reason;
    if (reason) {
      return this.currentOutput || `Session ended: ${reason}`;
    }
    return this.currentOutput || "Session completed";
  }

  /**
   * Main execution entry point for the agent.
   * Calls the Claude Agent SDK query() function with configured hooks.
   *
   * @param input - The input prompt for the agent
   * @returns The agent's response as a string
   */
  public async execute(input: string): Promise<string> {
    this.currentInput = input;
    this.currentOutput = null;

    const options = this.buildOptions();

    try {
      const result = await query({ prompt: input, options });

      const messages: string[] = [];
      for await (const message of result) {
        if (message && typeof message === "object") {
          if (message.type === "result" && "result" in message && typeof message.result === "string") {
            messages.push(message.result);
          }
        }
      }

      this.currentOutput = messages.join("\n");

      return this.currentOutput;
    } catch (error) {
      console.error(`[BaseAgent] SDK error:`, error);
      throw error;
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
}
