import type { Id } from "../../convex/_generated/dataModel.js";

/**
 * Configuration for creating an agent instance.
 *
 * @property agentType - Type identifier for the agent (e.g., "planner", "coder", "reviewer")
 * @property model - Optional model name to use (defaults to "sonnet" for Claude, "glm-4.7" for GLM)
 * @property workflowId - Optional associated workflow ID for session tracking
 */
export interface AgentConfig {
  agentType: string;
  model?: string;
  workflowId?: Id<"workflows">;
}

/**
 * Common interface for all agent implementations.
 * Both Claude SDK agents and GLM-4.7 agents implement this contract.
 *
 * @interface AgentInterface
 */
export interface AgentInterface {
  /**
   * Execute the agent with the given input prompt.
   *
   * @param input - The input prompt for the agent
   * @returns Promise<string> - The agent's response
   */
  execute(input: string): Promise<string>;

  /**
   * Get the current Convex session ID if a session is active.
   *
   * @returns The session ID or null if no session is active
   */
  getSessionId(): Id<"agentSessions"> | null;
}
