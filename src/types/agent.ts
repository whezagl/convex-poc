import type { Id } from "../../convex/_generated/dataModel.js";

/**
 * Configuration for creating an agent instance.
 *
 * @property agentType - Type identifier for the agent (e.g., "planner", "coder", "reviewer")
 * @property model - Optional model name to use (defaults to "sonnet")
 * @property workflowId - Optional associated workflow ID for session tracking
 */
export interface AgentConfig {
  agentType: string;
  model?: string;
  workflowId?: Id<"workflows">;
}
