// @convex-poc/convex-client - Main export for Convex client wrapper

export { createConvexClient, getConvexClient, closeConvexClient } from "./client.js";

// Export all task functions
export * from "./tasks.js";

// Export all subtask functions
export * from "./subtasks.js";

// Create a structured convex object for easy access (matching the pattern used in ParallelOrchestrator)
import { getConvexClient } from "./client.js";

export const convex = {
  mutations: {
    tasks: {
      create: async (args: any) => {
        const { create } = await import("./tasks.js");
        return create(args, getConvexClient());
      },
      updateStatus: async (args: any) => {
        const { updateStatus } = await import("./tasks.js");
        return updateStatus(args, getConvexClient());
      },
      updateClassification: async (args: any) => {
        const { updateClassification } = await import("./tasks.js");
        return updateClassification(args, getConvexClient());
      },
    },
    subtasks: {
      create: async (args: any) => {
        const { create } = await import("./subtasks.js");
        return create(args, getConvexClient());
      },
      updateProgress: async (args: any) => {
        const { updateProgress } = await import("./subtasks.js");
        return updateProgress(args, getConvexClient());
      },
    },
  },
  queries: {
    tasks: {
      listByStatus: async (args: any) => {
        const { listByStatus } = await import("./tasks.js");
        return listByStatus(args.status, getConvexClient());
      },
    },
    subtasks: {
      listByTask: async (args: any) => {
        const { listByTask } = await import("./subtasks.js");
        return listByTask(args.taskId, getConvexClient());
      },
    },
  },
};
