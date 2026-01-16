/**
 * SequentialOrchestrator - Coordinates multi-agent workflow execution.
 *
 * This orchestrator manages the sequential execution of specialized agents:
 * PlannerAgent → CoderAgent → ReviewerAgent
 *
 * Key features:
 * - Sequential workflow with state passing via filesystem
 * - Convex workflow tracking for persistence
 * - Error handling with continueOnError option
 * - Artifact collection and management
 * - Step timing and status tracking
 */

import { PlannerAgent } from "../agents/PlannerAgent.js";
import { CoderAgent } from "../agents/CoderAgent.js";
import { ReviewerAgent } from "../agents/ReviewerAgent.js";
import type { WorkflowContext, WorkflowResult, WorkflowStep, Artifact, ExecuteWorkflowConfig } from "../types/workflow.js";
import type { PlanResult } from "../types/plan.js";
import type { CodeResult } from "../types/code.js";
import type { ReviewResult } from "../types/review.js";
import { convex } from "../convex/client.js";
import {
  createWorkspace,
  saveArtifact,
  loadArtifact,
  planToJson,
  codeToJson,
  reviewToJson,
} from "./state.js";

/**
 * SequentialOrchestrator manages the execution of a multi-agent workflow.
 *
 * The workflow executes agents in sequence:
 * 1. PlannerAgent - Creates a plan from the task
 * 2. CoderAgent - Implements code based on the plan
 * 3. ReviewerAgent - Reviews the implementation
 *
 * Each agent's output is saved to the filesystem as a JSON artifact,
 * enabling state passing between agents and workflow inspection.
 */
export class SequentialOrchestrator {
  private readonly config: ExecuteWorkflowConfig;

  /**
   * Creates a new SequentialOrchestrator instance.
   *
   * @param config - Configuration for workflow execution
   */
  constructor(config: ExecuteWorkflowConfig) {
    this.config = {
      workspace: config.workspace,
      continueOnError: config.continueOnError ?? false,
    };
  }

  /**
   * Executes the full workflow: Planner → Coder → Reviewer.
   *
   * @param context - Workflow context with task and optional workflowId
   * @returns Complete workflow result with all steps and artifacts
   */
  public async executeWorkflow(context: WorkflowContext): Promise<WorkflowResult> {
    const { task, workspace, workflowId } = context;

    // Create workspace directory
    await createWorkspace(workspace);

    // Initialize workflow result
    const result: WorkflowResult = {
      success: false,
      steps: [],
      artifacts: [],
    };

    // Initialize Convex workflow if workflowId provided
    if (workflowId) {
      try {
        await convex.mutations.agents.createAgentSession({
          agentType: "orchestrator",
          input: task,
          workflowId,
        });
      } catch (error) {
        console.error(`[Orchestrator] Failed to create workflow session: ${error}`);
        // Continue without Convex tracking
      }
    }

    try {
      // Step 1: Planning
      const plannerStep = await this.executePlanner(task, workflowId);
      result.steps.push(plannerStep);

      if (!plannerStep.error) {
        // Step 2: Coding (only if planning succeeded)
        const coderStep = await this.executeCoder(task, workflowId);
        result.steps.push(coderStep);

        if (!coderStep.error || this.config.continueOnError) {
          // Step 3: Review (continue if coder succeeded or continueOnError is true)
          const reviewerStep = await this.executeReviewer(task, workflowId);
          result.steps.push(reviewerStep);

          if (reviewerStep.output) {
            try {
              result.finalReview = JSON.parse(reviewerStep.output) as ReviewResult;
            } catch (error) {
              console.error(`[Orchestrator] Failed to parse review result: ${error}`);
            }
          }
        }
      }

      // Determine overall success
      result.success = this.determineSuccess(result.steps);

    } catch (error) {
      console.error(`[Orchestrator] Workflow execution failed: ${error}`);
      result.success = false;
    }

    // Update workflow status in Convex
    if (workflowId) {
      try {
        await convex.mutations.agents.updateAgentSession({
          sessionId: workflowId as any,
          status: result.success ? "completed" : "failed",
          output: JSON.stringify(result),
        });
      } catch (error) {
        console.error(`[Orchestrator] Failed to update workflow status: ${error}`);
      }
    }

    return result;
  }

  /**
   * Executes the PlannerAgent step.
   *
   * @param task - The task to plan
   * @param workflowId - Optional Convex workflow ID
   * @returns Workflow step with planner results
   */
  private async executePlanner(
    task: string,
    workflowId?: string
  ): Promise<WorkflowStep> {
    const step: WorkflowStep = {
      name: "Planning",
      agent: "planner",
      status: "in_progress",
      startTime: Date.now(),
    };

    try {
      console.log(`[Orchestrator] Step 1: Planning...`);

      const planner = new PlannerAgent({
        agentType: "planner",
        workflowId: workflowId as any,
      });

      const plan: PlanResult = await planner.executePlan(task);

      // Save plan artifact
      const planJson = planToJson(plan);
      await saveArtifact(this.config.workspace, {
        type: "plan",
        path: "plan.json",
        content: planJson,
      });

      step.status = "completed";
      step.endTime = Date.now();
      step.output = planJson;

      console.log(`[Orchestrator] Planning completed in ${step.endTime - step.startTime}ms`);

    } catch (error) {
      step.status = "failed";
      step.endTime = Date.now();
      step.error = String(error);
      console.error(`[Orchestrator] Planning failed: ${error}`);
    }

    return step;
  }

  /**
   * Executes the CoderAgent step.
   *
   * @param task - The original task (for context)
   * @param workflowId - Optional Convex workflow ID
   * @returns Workflow step with coder results
   */
  private async executeCoder(
    task: string,
    workflowId?: string
  ): Promise<WorkflowStep> {
    const step: WorkflowStep = {
      name: "Coding",
      agent: "coder",
      status: "in_progress",
      startTime: Date.now(),
    };

    try {
      console.log(`[Orchestrator] Step 2: Coding...`);

      // Load plan artifact for context
      const planJson = await loadArtifact(this.config.workspace, "plan.json");
      const planInput = `Task: ${task}\n\nPlan:\n${planJson}`;

      const coder = new CoderAgent({
        agentType: "coder",
        workflowId: workflowId as any,
      });

      const code: CodeResult = await coder.executeCode(planInput);

      // Save code artifact
      const codeJson = codeToJson(code);
      await saveArtifact(this.config.workspace, {
        type: "code",
        path: "code.json",
        content: codeJson,
      });

      step.status = "completed";
      step.endTime = Date.now();
      step.output = codeJson;

      console.log(`[Orchestrator] Coding completed in ${step.endTime - step.startTime}ms`);

    } catch (error) {
      step.status = "failed";
      step.endTime = Date.now();
      step.error = String(error);
      console.error(`[Orchestrator] Coding failed: ${error}`);
    }

    return step;
  }

  /**
   * Executes the ReviewerAgent step.
   *
   * @param task - The original task (for context)
   * @param workflowId - Optional Convex workflow ID
   * @returns Workflow step with reviewer results
   */
  private async executeReviewer(
    task: string,
    workflowId?: string
  ): Promise<WorkflowStep> {
    const step: WorkflowStep = {
      name: "Review",
      agent: "reviewer",
      status: "in_progress",
      startTime: Date.now(),
    };

    try {
      console.log(`[Orchestrator] Step 3: Review...`);

      // Load plan and code artifacts for context
      const planJson = await loadArtifact(this.config.workspace, "plan.json");
      const codeJson = await loadArtifact(this.config.workspace, "code.json");

      const reviewInput = `Task: ${task}\n\nPlan:\n${planJson}\n\nCode:\n${codeJson}`;

      const reviewer = new ReviewerAgent({
        agentType: "reviewer",
        workflowId: workflowId as any,
      });

      const review: ReviewResult = await reviewer.executeReview(reviewInput);

      // Save review artifact
      const reviewJson = reviewToJson(review);
      await saveArtifact(this.config.workspace, {
        type: "review",
        path: "review.json",
        content: reviewJson,
      });

      step.status = "completed";
      step.endTime = Date.now();
      step.output = reviewJson;

      console.log(`[Orchestrator] Review completed in ${step.endTime - step.startTime}ms`);

    } catch (error) {
      step.status = "failed";
      step.endTime = Date.now();
      step.error = String(error);
      console.error(`[Orchestrator] Review failed: ${error}`);
    }

    return step;
  }

  /**
   * Determines whether the workflow was successful.
   *
   * A workflow is successful if:
   * - All steps completed successfully, OR
   * - continueOnError is true and the reviewer completed (even if earlier steps failed)
   *
   * @param steps - All workflow steps
   * @returns Whether the workflow is considered successful
   */
  private determineSuccess(steps: WorkflowStep[]): boolean {
    // If continueOnError is enabled, success depends on reviewer completing
    if (this.config.continueOnError) {
      const reviewerStep = steps.find((s) => s.agent === "reviewer");
      return reviewerStep?.status === "completed" || false;
    }

    // Otherwise, all steps must complete successfully
    return steps.every((step) => step.status === "completed");
  }
}
