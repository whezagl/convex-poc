import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new subtask
export const createSubTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.string(),
    agentType: v.string(),
    totalSteps: v.number(),
  },
  handler: async (ctx, args) => {
    const subtaskId = await ctx.db.insert("subtasks", {
      taskId: args.taskId,
      title: args.title,
      status: "pending",
      agentType: args.agentType,
      stepNumber: 1,
      totalSteps: args.totalSteps,
      logs: [],
    });

    // Add subtask ID to parent task
    const task = await ctx.db.get(args.taskId);
    if (task) {
      await ctx.db.patch(args.taskId, {
        subTaskIds: [...task.subTaskIds, subtaskId],
      });
    }

    return subtaskId;
  },
});

// Get subtasks by task ID (for "Sub-tasks" column)
export const getSubTasksByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const subtasks = await ctx.db
      .query("subtasks")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    return subtasks;
  },
});

// Update subtask status
export const updateSubTaskStatus = mutation({
  args: {
    subtaskId: v.id("subtasks"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("done"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subtaskId, {
      status: args.status,
    });
  },
});

// Update subtask progress (stepNumber)
export const updateSubTaskProgress = mutation({
  args: {
    subtaskId: v.id("subtasks"),
    stepNumber: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subtaskId, {
      stepNumber: args.stepNumber,
    });
  },
});

// Add log to subtask
export const addSubTaskLog = mutation({
  args: {
    subtaskId: v.id("subtasks"),
    message: v.string(),
    level: v.union(v.literal("info"), v.literal("warning"), v.literal("error")),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const subtask = await ctx.db.get(args.subtaskId);
    if (!subtask) throw new Error("SubTask not found");

    const newLog = {
      timestamp: Date.now(),
      message: args.message,
      level: args.level,
      source: args.source,
    };

    await ctx.db.patch(args.subtaskId, {
      logs: [...subtask.logs, newLog],
    });
  },
});

// Get subtask by ID
export const getSubTask = query({
  args: { subtaskId: v.id("subtasks") },
  handler: async (ctx, args) => {
    const subtask = await ctx.db.get(args.subtaskId);
    return subtask;
  },
});
