import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import * as Workflows from "./model/workflows";

/**
 * Public API for workflow operations.
 *
 * These functions provide the external interface for workflow orchestration,
 * with argument validators for security and type safety.
 *
 * Follows same pattern as agents.ts: Public API functions are thin wrappers
 * that call helper functions from model/ directory.
 */

/**
 * Create a new workflow.
 *
 * @param task - The task description for this workflow
 * @returns The ID of the created workflow
 */
export const createWorkflow = mutation({
  args: {
    task: v.string(),
  },
  handler: async (ctx, args) => {
    return await Workflows.createWorkflow(ctx, args.task);
  },
});

/**
 * Update workflow status and optionally current step.
 *
 * @param workflowId - The ID of the workflow to update
 * @param status - The new status value
 * @param currentStep - Optional new current step value
 */
export const updateWorkflowStatus = mutation({
  args: {
    workflowId: v.id("workflows"),
    status: v.string(),
    currentStep: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await Workflows.updateWorkflowStatus(
      ctx,
      args.workflowId,
      args.status,
      args.currentStep
    );
  },
});

/**
 * Get a workflow by ID.
 *
 * @param workflowId - The ID of the workflow to retrieve
 * @returns The workflow document or null if not found
 */
export const getWorkflow = query({
  args: {
    workflowId: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    return await Workflows.getWorkflow(ctx, args.workflowId);
  },
});
