/**
 * Type definitions for plan generation and task decomposition.
 */

/**
 * A single step in a generated plan.
 *
 * @property description - Clear, actionable description of what this step accomplishes
 * @property agent - Type of agent responsible for executing this step (e.g., "coder", "reviewer")
 * @property dependencies - Array of step descriptions that must complete before this step can start
 */
export interface PlanStep {
  description: string;
  agent: string;
  dependencies: string[];
}

/**
 * Result of plan generation by PlannerAgent.
 *
 * Provides structured task decomposition with step-by-step execution plan,
 * agent assignments, dependency tracking, and risk assessment.
 *
 * @property steps - Array of 3-7 actionable steps (not too granular, not too vague)
 * @property estimatedDuration - Optional human-readable estimate of total execution time
 * @property risks - Optional array of potential risks or blockers to execution
 */
export interface PlanResult {
  steps: PlanStep[];
  estimatedDuration?: string;
  risks?: string[];
}
