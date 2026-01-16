/**
 * Placeholder Convex client configuration.
 *
 * CONVEX INTEGRATION STATUS:
 * This is an intentional placeholder for POC scope. The Convex backend integration
 * was fully designed and schema defined (see .planning/ROADMAP.md Phase 2), but
 * the self-hosted Convex deployment was not implemented for this proof-of-concept.
 *
 * DESIGN COMPLETE:
 * - Agent session schema with workflow tracking (Phase 02-01)
 * - Helper functions for session management (Phase 02-02)
 * - BaseAgent SDK hooks integration (Phase 03-01)
 * - SequentialOrchestrator workflow tracking (Phase 07-01)
 *
 * PLACEHOLDER PURPOSE:
 * - Provides type-safe API surface for Convex operations
 * - Prevents import errors in BaseAgent.ts and orchestrator
 * - Logs operations for debugging (visible in console output)
 * - Ready for real Convex deployment when needed
 *
 * FUTURE DEPLOYMENT (Optional):
 * Replace this placeholder with actual Convex client:
 * - Deploy self-hosted Convex via Docker Compose (Phase 01-02)
 * - Replace functions with real convex.mutations and convex.queries
 * - No changes needed to BaseAgent or Orchestrator (API compatible)
 *
 * See .planning/PATTERNS.md for patterns that support Convex integration.
 */

export const convex = {
  mutations: {
    agents: {
      createAgentSession: async (args: any) => {
        console.log("[Convex] Placeholder: createAgentSession", args);
        return null as any;
      },
      updateAgentSession: async (args: any) => {
        console.log("[Convex] Placeholder: updateAgentSession", args);
      },
    },
  },
  queries: {
    agents: {
      getAgentSession: async (args: any) => {
        console.log("[Convex] Placeholder: getAgentSession", args);
        return null;
      },
    },
  },
};
