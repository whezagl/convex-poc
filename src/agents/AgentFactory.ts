import type { AgentProvider } from "../types/agent.js";
import type { CoderConfig } from "./CoderAgent.js";
import type { PlannerConfig } from "./PlannerAgent.js";
import type { ReviewerConfig } from "./ReviewerAgent.js";
import type { GLMCoderConfig } from "./GLMCoderAgent.js";
import type { GLMPlannerConfig } from "./GLMPlannerAgent.js";
import type { GLMReviewerConfig } from "./GLMReviewerAgent.js";

// Import Claude SDK agents
import { CoderAgent } from "./CoderAgent.js";
import { PlannerAgent } from "./PlannerAgent.js";
import { ReviewerAgent } from "./ReviewerAgent.js";

// Import GLM SDK agents
import { GLMCoderAgent } from "./GLMCoderAgent.js";
import { GLMPlannerAgent } from "./GLMPlannerAgent.js";
import { GLMReviewerAgent } from "./GLMReviewerAgent.js";

/**
 * Combined agent interface that includes both Claude and GLM agent methods.
 * This allows the factory to return either type while maintaining type safety.
 */
export interface CoderAgentInterface {
  executeCode(input: string): Promise<ReturnType<typeof CoderAgent.prototype.executeCode>>;
  executeWithWorkflow(input: string, workflowId: string): Promise<ReturnType<typeof CoderAgent.prototype.executeWithWorkflow>>;
}

export interface PlannerAgentInterface {
  executePlan(input: string): Promise<ReturnType<typeof PlannerAgent.prototype.executePlan>>;
  executeWithWorkflow(input: string, workflowId: string): Promise<ReturnType<typeof PlannerAgent.prototype.executeWithWorkflow>>;
}

export interface ReviewerAgentInterface {
  executeReview(input: string): Promise<ReturnType<typeof ReviewerAgent.prototype.executeReview>>;
  executeWithWorkflow(input: string, workflowId: string): Promise<ReturnType<typeof ReviewerAgent.prototype.executeWithWorkflow>>;
}

/**
 * Factory class for creating agent instances based on environment configuration.
 *
 * The factory checks the BASE_AGENT environment variable to determine which
 * SDK provider to use:
 * - "claude" or unset: Uses Claude Agent SDK (BaseAgent)
 * - "glm": Uses OpenAI SDK with GLM-4.7 (GLMBaseAgent)
 *
 * Individual agent configurations can override the global setting via the
 * `provider` property in the config object.
 *
 * Example usage:
 * ```typescript
 * // Uses BASE_AGENT env var or defaults to "claude"
 * const coder = AgentFactory.createCoder({ agentType: "coder" });
 *
 * // Override to use GLM regardless of env var
 * const planner = AgentFactory.createPlanner({
 *   agentType: "planner",
 *   provider: "glm"
 * });
 * ```
 */
export class AgentFactory {
  /**
   * Gets the default agent provider from the BASE_AGENT environment variable.
   * Defaults to "claude" if not set or if an invalid value is provided.
   *
   * @returns The agent provider ("claude" or "glm")
   */
  private static getDefaultProvider(): AgentProvider {
    const envProvider = process.env.BASE_AGENT as AgentProvider;
    if (envProvider === "claude" || envProvider === "glm") {
      return envProvider;
    }
    return "claude"; // Default to Claude SDK
  }

  /**
   * Resolves the provider to use, checking both the config override and environment variable.
   *
   * @param configProvider - Optional provider override from config
   * @returns The agent provider to use
   */
  private static resolveProvider(configProvider?: AgentProvider): AgentProvider {
    if (configProvider === "claude" || configProvider === "glm") {
      return configProvider;
    }
    return this.getDefaultProvider();
  }

  /**
   * Creates a CoderAgent instance (Claude or GLM based on configuration).
   *
   * @param config - Coder configuration with optional provider override
   * @returns A CoderAgent instance (Claude SDK or GLM SDK)
   * @throws Error if provider is invalid
   *
   * @example
   * ```typescript
   * const coder = AgentFactory.createCoder({
   *   agentType: "coder",
   *   maxChanges: 5
   * });
   * const result = await coder.executeCode("Create a User model");
   * ```
   */
  static createCoder(config: CoderConfig | GLMCoderConfig): CoderAgent {
    const provider = this.resolveProvider(config.provider);

    if (provider === "glm") {
      return new GLMCoderAgent(config as GLMCoderConfig);
    }
    return new CoderAgent(config as CoderConfig);
  }

  /**
   * Creates a PlannerAgent instance (Claude or GLM based on configuration).
   *
   * @param config - Planner configuration with optional provider override
   * @returns A PlannerAgent instance (Claude SDK or GLM SDK)
   * @throws Error if provider is invalid
   *
   * @example
   * ```typescript
   * const planner = AgentFactory.createPlanner({
   *   agentType: "planner",
   *   detailLevel: "detailed"
   * });
   * const plan = await planner.executePlan("Create a REST API");
   * ```
   */
  static createPlanner(config: PlannerConfig | GLMPlannerConfig): PlannerAgent {
    const provider = this.resolveProvider(config.provider);

    if (provider === "glm") {
      return new GLMPlannerAgent(config as GLMPlannerConfig);
    }
    return new PlannerAgent(config as PlannerConfig);
  }

  /**
   * Creates a ReviewerAgent instance (Claude or GLM based on configuration).
   *
   * @param config - Reviewer configuration with optional provider override
   * @returns A ReviewerAgent instance (Claude SDK or GLM SDK)
   * @throws Error if provider is invalid
   *
   * @example
   * ```typescript
   * const reviewer = AgentFactory.createReviewer({
   *   agentType: "reviewer",
   *   severity: "warning"
   * });
   * const review = await reviewer.executeReview("Review this code");
   * ```
   */
  static createReviewer(config: ReviewerConfig | GLMReviewerConfig): ReviewerAgent {
    const provider = this.resolveProvider(config.provider);

    if (provider === "glm") {
      return new GLMReviewerAgent(config as GLMReviewerConfig);
    }
    return new ReviewerAgent(config as ReviewerConfig);
  }

  /**
   * Gets the current default provider setting.
   * Useful for logging and debugging.
   *
   * @returns The current default provider ("claude" or "glm")
   */
  static getCurrentProvider(): AgentProvider {
    return this.getDefaultProvider();
  }
}
