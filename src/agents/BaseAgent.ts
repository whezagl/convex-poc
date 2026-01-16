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
   * This is a placeholder for future Convex client integration.
   *
   * @returns Convex context object
   */
  protected buildConvexContext(): any {
    // TODO: Integrate with actual Convex client when backend is deployed
    // For now, this is a placeholder that will be updated in ISS-001
    return {};
  }

  /**
   * Builds the SDK options with hooks for Convex integration.
   *
   * @returns SDK options object with hooks configured
   */
  protected buildOptions(): Options {
    return {
      systemPrompt: this.getSystemPrompt(),
      model: this.getModel(),
      hooks: {
        SessionStart: [
          {
            hooks: [
              async (input: HookInput) => {
                try {
                  // Create agent session in Convex
                  // Note: This will be fully functional once Convex backend is deployed (ISS-001)
                  if (this.workflowId) {
                    // Placeholder for Convex integration
                    // const session = await convex.mutations.agents.createAgentSession({
                    //   agentType: this.agentType,
                    //   input: input.prompt || "Starting session",
                    //   workflowId: this.workflowId,
                    // });
                    // this.sessionId = session;
                    console.log(`[BaseAgent] SessionStart: Would create session for ${this.agentType}`);
                  }
                } catch (error) {
                  console.error("[BaseAgent] SessionStart error:", error);
                  // Don't throw - allow session to proceed even if tracking fails
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
                  // Update final state in Convex
                  if (this.sessionId) {
                    // Placeholder for Convex integration
                    // await convex.mutations.agents.updateAgentSession({
                    //   sessionId: this.sessionId,
                    //   status: "completed",
                    //   output: this.extractOutput(input),
                    // });
                    console.log(`[BaseAgent] SessionEnd: Would update session ${this.sessionId}`);
                  }
                } catch (error) {
                  console.error("[BaseAgent] SessionEnd error:", error);
                  // Don't throw - allow session to complete gracefully
                }
                return { continue: true };
              },
            ],
          },
        ],
      },
    };
  }

  /**
   * Extracts the output from a HookInput.
   *
   * @param input - The hook input
   * @returns The extracted output string
   */
  protected extractOutput(input: HookInput): string {
    // Extract relevant output from the hook input
    // This will be refined based on actual SDK hook input structure
    return "Session completed";
  }

  /**
   * Main execution entry point for the agent.
   * Calls the Claude Agent SDK query() function with configured hooks.
   *
   * @param input - The input prompt for the agent
   * @returns The agent's response as a string
   */
  public async execute(input: string): Promise<string> {
    const options = this.buildOptions();
    const result = await query({ prompt: input, options });

    // Collect all messages from the async generator
    const messages: string[] = [];
    for await (const message of result) {
      // Process each message
      // For now, convert to string; this can be refined based on message structure
      messages.push(JSON.stringify(message));
    }

    // Return the final result
    // TODO: Extract actual output from messages based on SDK response structure
    return messages.join("\n");
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
