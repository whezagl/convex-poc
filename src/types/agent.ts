import type { Id } from "../../convex/_generated/dataModel.js";

/**
 * Supported agent providers (LLM backends).
 *
 * - "claude": Anthropic's Claude via Claude Agent SDK (default)
 * - "glm": Z.AI's GLM-4.7 via OpenAI SDK
 */
export type AgentProvider = "claude" | "glm";

/**
 * Configuration for creating an agent instance.
 *
 * @property agentType - Type identifier for the agent (e.g., "planner", "coder", "reviewer")
 * @property model - Optional model name to use (defaults to "sonnet" for Claude, "glm-4.7" for GLM)
 * @property workflowId - Optional associated workflow ID for session tracking
 * @property provider - Optional provider override (defaults to BASE_AGENT env var or "claude")
 * @property verbose - Enable verbose logging for API calls (default: false)
 * @property rateLimit - Rate limiting configuration (primarily for GLM)
 */
export interface AgentConfig {
  agentType: string;
  model?: string;
  workflowId?: Id<"workflows">;
  provider?: AgentProvider;
  verbose?: boolean;
  rateLimit?: {
    /** Minimum delay between requests in milliseconds (default: 1000) */
    minDelay?: number;
    /** Maximum number of retry attempts for 429 errors (default: 3) */
    maxRetries?: number;
    /** Initial backoff delay in milliseconds for retries (default: 1000) */
    initialBackoff?: number;
  };
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
