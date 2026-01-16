import { MutationCtx, QueryCtx, Doc } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Helper functions for workflow operations.
 * These functions encapsulate business logic for workflow orchestration
 * and can be called from public API functions (queries/mutations).
 *
 * Follows same pattern as model/agents.ts: Separating Public API from Helper Functions.
 */

/**
 * Create a new workflow with "pending" status.
 *
 * @param ctx - Mutation context for database operations
 * @param task - The task description for this workflow
 * @returns The ID of the created workflow
 */
export async function createWorkflow(
  ctx: MutationCtx,
  task: string
): Promise<Id<"workflows">> {
  const workflowId = await ctx.db.insert("workflows", {
    task,
    status: "pending",
    currentStep: "planner",
    artifacts: [],
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  });
  return workflowId;
}

/**
 * Update workflow status and optionally current step.
 *
 * @param ctx - Mutation context for database operations
 * @param workflowId - The ID of the workflow to update
 * @param status - The new status value
 * @param currentStep - Optional new current step value
 */
export async function updateWorkflowStatus(
  ctx: MutationCtx,
  workflowId: Id<"workflows">,
  status: string,
  currentStep?: string
): Promise<void> {
  const currentWorkflow = await ctx.db.get(workflowId);
  if (!currentWorkflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  await ctx.db.patch(workflowId, {
    status,
    ...(currentStep !== undefined && { currentStep }),
    metadata: {
      ...currentWorkflow.metadata,
      createdAt: currentWorkflow.metadata.createdAt,
      updatedAt: Date.now(),
    },
  });
}

/**
 * Get a workflow by ID.
 *
 * @param ctx - Query context for database operations
 * @param workflowId - The ID of the workflow to retrieve
 * @returns The workflow document or null if not found
 */
export async function getWorkflow(
  ctx: QueryCtx,
  workflowId: Id<"workflows">
): Promise<Doc<"workflows"> | null> {
  return await ctx.db.get(workflowId);
}
