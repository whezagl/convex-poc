// @convex-poc/convex-client - Main export for Convex client wrapper

export { createConvexClient, getConvexClient, closeConvexClient } from "./client.js";

// Export task functions with renamed create to avoid conflicts
export {
  create as createTask,
  createTask as createTaskLegacy,
  getTasks,
  getTasksByStatus,
  updateTaskStatus,
  addTaskLog,
  getTask,
  updateStatus,
  updateClassification,
  listByStatus,
} from "./tasks.js";

// Export subtask functions with renamed create to avoid conflicts
export {
  create as createSubTask,
  createSubTask as createSubTaskLegacy,
  getSubTasksByTask,
  updateSubTaskStatus,
  updateSubTaskProgress,
  addSubTaskLog,
  getSubTask,
  updateProgress,
  listByTask,
} from "./subtasks.js";

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
        const { create: createSubTask } = await import("./subtasks.js");
        return createSubTask(args, getConvexClient());
      },
      updateProgress: async (args: any) => {
        const { updateProgress } = await import("./subtasks.js");
        return updateProgress(args, getConvexClient());
      },
      updateStatus: async (args: any) => {
        const { updateSubTaskStatus } = await import("./subtasks.js");
        return updateSubTaskStatus(args, getConvexClient());
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
