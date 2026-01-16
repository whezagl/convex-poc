import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import * as Agents from "./model/agents";

/**
 * Public API for agent session operations.
 *
 * These functions provide the external interface for agent state management,
 * with argument validators for security and type safety.
 *
 * Follows Pattern 3 from research: Public API functions are thin wrappers
 * that call helper functions from model/ directory.
 */

/**
 * Create a new agent session.
 *
 * @param agentType - Type of agent ("planner" | "coder" | "reviewer")
 * @param input - Task or input prompt for the agent
 * @param workflowId - Associated workflow ID
 * @returns The ID of the created agent session
 */
export const createAgentSession = mutation({
  args: {
    agentType: v.string(),
    input: v.string(),
    workflowId: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    return await Agents.createAgentSession(ctx, args);
  },
});

/**
 * Update an agent session with output, error, or status.
 *
 * @param sessionId - The ID of the agent session to update
 * @param output - Optional output from the agent
 * @param error - Optional error message if the agent failed
 * @param status - Optional new status value
 */
export const updateAgentSession = mutation({
  args: {
    sessionId: v.id("agentSessions"),
    output: v.optional(v.string()),
    error: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { sessionId, output, error, status } = args;
    await Agents.updateAgentSession(ctx, sessionId, {
      output,
      error,
      status,
    });
  },
});

/**
 * Get an agent session by ID.
 *
 * @param sessionId - The ID of the agent session to retrieve
 * @returns The agent session document or null if not found
 */
export const getAgentSession = query({
  args: {
    sessionId: v.id("agentSessions"),
  },
  handler: async (ctx, args) => {
    return await Agents.getAgentSession(ctx, args.sessionId);
  },
});
