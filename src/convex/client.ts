/**
 * Real Convex client configuration for self-hosted deployment.
 *
 * CONVEX INTEGRATION STATUS: DEPLOYED ✓
 *
 * This client connects to the self-hosted Convex backend running locally:
 * - Backend: http://127.0.0.1:3210
 * - Dashboard: http://localhost:6791
 *
 * DEPLOYMENT COMPLETE (Phase 10):
 * - Self-hosted Convex backend running via Docker Compose
 * - Schema deployed: agentSessions, workflows tables
 * - Functions deployed: 6 functions (3 mutations, 3 queries)
 * - TypeScript types generated via codegen
 *
 * CONFIGURATION:
 * - CONVEX_SELF_HOSTED_URL: Backend URL (from .env.local)
 * - CONVEX_SELF_HOSTED_ADMIN_KEY: Admin authentication key (from .env.local)
 *
 * API FUNCTIONS:
 * Mutations:
 * - createAgentSession: Creates new agent session with workflow tracking
 * - updateAgentSession: Updates session with output, error, status
 *
 * Queries:
 * - getAgentSession: Retrieves agent session by ID
 */

import { ConvexClient } from "convex/browser";

// Get configuration from environment
const CONVEX_URL = process.env.CONVEX_SELF_HOSTED_URL || "http://127.0.0.1:3210";
const CONVEX_ADMIN_KEY = process.env.CONVEX_SELF_HOSTED_ADMIN_KEY || "";

if (!CONVEX_ADMIN_KEY) {
  throw new Error("CONVEX_SELF_HOSTED_ADMIN_KEY is required but not set");
}

/**
 * Real Convex client connected to self-hosted backend.
 * Uses server-side client for Node.js environment.
 */
const client = new ConvexClient(CONVEX_URL, {
  adminKey: CONVEX_ADMIN_KEY,
});

/**
 * Closes the Convex client connection.
 * Call this when shutting down the application to prevent hanging processes.
 */
export async function closeConvexClient(): Promise<void> {
  await client.close();
}

/**
 * Convex client API with typed mutations and queries.
 * Provides type-safe access to deployed Convex functions.
 */
export const convex = {
  mutations: {
    agents: {
      /**
       * Create a new agent session in Convex.
       * @param args - Session creation parameters
       * @returns The created session ID
       */
      createAgentSession: async (args: {
        agentType: string;
        input: string;
        workflowId: string;
      }) => {
        console.log("[Convex] Creating agent session", args);
        return await client.mutation("agents.js:createAgentSession", args);
      },

      /**
       * Update an existing agent session.
       * @param args - Session update parameters
       */
      updateAgentSession: async (args: {
        sessionId: string;
        status: string;
        output?: string;
        error?: string;
      }) => {
        console.log("[Convex] Updating agent session", args);
        return await client.mutation("agents.js:updateAgentSession", args);
      },
    },
    workflows: {
      /**
       * Create a new workflow in Convex.
       * @param args - Workflow creation parameters
       * @returns The created workflow ID
       */
      createWorkflow: async (args: {
        task: string;
      }) => {
        console.log("[Convex] Creating workflow", args);
        return await client.mutation("workflows.js:createWorkflow", args);
      },

      /**
       * Update workflow status.
       * @param args - Workflow update parameters
       */
      updateWorkflowStatus: async (args: {
        workflowId: string;
        status: string;
        currentStep?: string;
      }) => {
        console.log("[Convex] Updating workflow status", args);
        return await client.mutation("workflows.js:updateWorkflowStatus", args);
      },
    },
  },

  queries: {
    agents: {
      /**
       * Get an agent session by ID.
       * @param args - Query parameters
       * @returns The agent session or null
       */
      getAgentSession: async (args: { sessionId: string }) => {
        console.log("[Convex] Getting agent session", args);
        return await client.query("agents.js:getAgentSession", args);
      },
    },
    workflows: {
      /**
       * Get a workflow by ID.
       * @param args - Query parameters
       * @returns The workflow or null
       */
      getWorkflow: async (args: { workflowId: string }) => {
        console.log("[Convex] Getting workflow", args);
        return await client.query("workflows.js:getWorkflow", args);
      },
    },
  },
};
