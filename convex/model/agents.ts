import { MutationCtx, QueryCtx, Doc } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Helper functions for agent session operations.
 * These functions encapsulate business logic for agent state management
 * and can be called from public API functions (queries/mutations).
 *
 * Follows Pattern 3 from research: Separating Public API from Helper Functions.
 */

/**
 * Create a new agent session with "running" status.
 *
 * @param ctx - Mutation context for database operations
 * @param args - Agent session creation parameters
 * @returns The ID of the created agent session
 */
export async function createAgentSession(
  ctx: MutationCtx,
  args: {
    agentType: string;
    input: string;
    workflowId: Id<"workflows">;
  }
): Promise<Id<"agentSessions">> {
  const sessionId = await ctx.db.insert("agentSessions", {
    agentType: args.agentType,
    status: "running",
    input: args.input,
    metadata: {
      workflowId: args.workflowId,
      startedAt: Date.now(),
    },
  });
  return sessionId;
}

/**
 * Update an existing agent session with output, error, or status.
 *
 * @param ctx - Mutation context for database operations
 * @param sessionId - The ID of the agent session to update
 * @param updates - Optional updates for output, error, and status
 */
export async function updateAgentSession(
  ctx: MutationCtx,
  sessionId: Id<"agentSessions">,
  updates: {
    output?: string;
    error?: string;
    status?: string;
  }
): Promise<void> {
  const currentSession = await ctx.db.get(sessionId);
  if (!currentSession) {
    throw new Error(`Agent session ${sessionId} not found`);
  }

  await ctx.db.patch(sessionId, {
    ...updates,
    metadata: {
      ...currentSession.metadata,
      workflowId: currentSession.metadata?.workflowId,
      startedAt: currentSession.metadata?.startedAt ?? Date.now(),
      completedAt: Date.now(),
    },
  });
}

/**
 * Get an agent session by ID.
 *
 * @param ctx - Query context for database operations
 * @param sessionId - The ID of the agent session to retrieve
 * @returns The agent session document or null if not found
 */
export async function getAgentSession(
  ctx: QueryCtx,
  sessionId: Id<"agentSessions">
): Promise<Doc<"agentSessions"> | null> {
  return await ctx.db.get(sessionId);
}
