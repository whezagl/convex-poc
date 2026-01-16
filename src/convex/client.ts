/**
 * Placeholder Convex client configuration.
 *
 * This will be implemented when the Convex backend is fully deployed (ISS-001).
 * For now, this file exists to prevent import errors in BaseAgent.ts.
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
