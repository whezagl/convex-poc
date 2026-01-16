/**
 * Type definitions for workflow orchestration and multi-agent coordination.
 */

import type { Id } from "../../convex/_generated/dataModel.js";
import type { PlanResult } from "./plan.js";
import type { CodeResult } from "./code.js";
import type { ReviewResult } from "./review.js";

/**
 * Workflow context for execution.
 *
 * @property task - The task description to execute
 * @property workspace - The filesystem path for artifact storage
 * @property workflowId - Optional Convex workflow ID for state tracking
 */
export interface WorkflowContext {
  task: string;
  workspace: string;
  workflowId?: Id<"workflows">;
}

/**
 * Status of a workflow step.
 */
export type StepStatus = "pending" | "in_progress" | "completed" | "failed";

/**
 * A single step in a workflow execution.
 *
 * @property name - Human-readable name of the step
 * @property agent - Type of agent that executes this step
 * @property status - Current status of the step
 * @property startTime - Timestamp when the step started (milliseconds since epoch)
 * @property endTime - Optional timestamp when the step completed
 * @property output - Optional output from the agent execution
 * @property error - Optional error message if the step failed
 */
export interface WorkflowStep {
  name: string;
  agent: string;
  status: StepStatus;
  startTime: number;
  endTime?: number;
  output?: string;
  error?: string;
}

/**
 * An artifact produced during workflow execution.
 *
 * Artifacts are the outputs from each agent, persisted to the filesystem
 * as JSON files for inspection and debugging.
 *
 * @property type - Type of artifact (plan, code, or review)
 * @property path - Filesystem path where the artifact is stored
 * @property content - String content of the artifact (typically JSON stringified)
 */
export interface Artifact {
  type: "plan" | "code" | "review";
  path: string;
  content: string;
}

/**
 * Result of a workflow execution.
 *
 * Contains the complete execution history, all artifacts produced,
 * and the final review result if available.
 *
 * @property success - Whether the workflow completed successfully
 * @property steps - Array of all workflow steps with their results
 * @property artifacts - Array of artifacts produced during execution
 * @property finalReview - Optional final review result from ReviewerAgent
 */
export interface WorkflowResult {
  success: boolean;
  steps: WorkflowStep[];
  artifacts: Artifact[];
  finalReview?: ReviewResult;
}

/**
 * Configuration for executing a workflow.
 *
 * @property workspace - Filesystem path for artifact storage
 * @property continueOnError - Whether to continue workflow execution after non-fatal errors
 */
export interface ExecuteWorkflowConfig {
  workspace: string;
  continueOnError?: boolean;
}

/**
 * Helper type for typed artifacts containing structured data.
 */
export interface TypedArtifact<T> extends Artifact {
  data: T;
}

/**
 * Artifact containing plan data.
 */
export type PlanArtifact = TypedArtifact<PlanResult>;

/**
 * Artifact containing code data.
 */
export type CodeArtifact = TypedArtifact<CodeResult>;

/**
 * Artifact containing review data.
 */
export type ReviewArtifact = TypedArtifact<ReviewResult>;
