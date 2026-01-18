import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create sub-task (for SubTaskManager)
export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("done"),
      v.literal("failed")
    ),
    agentType: v.string(),
    stepNumber: v.number(),
    totalSteps: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const subTaskId = await ctx.db.insert("subtasks", {
      taskId: args.taskId,
      title: args.title,
      status: args.status,
      agentType: args.agentType,
      stepNumber: args.stepNumber,
      totalSteps: args.totalSteps,
      logs: [],
    });
    return subTaskId;
  },
});

// Create a new subtask (legacy, for Kanban board)
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
      createdAt: Date.now(),
      updatedAt: Date.now(),
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

// Update sub-task progress (for SubTaskManager)
export const updateProgress = mutation({
  args: {
    subTaskId: v.id("subtasks"),
    stepNumber: v.number(),
    totalSteps: v.number(),
    message: v.string(),
    status: v.optional(v.union(
      v.literal("running"),
      v.literal("done"),
      v.literal("failed")
    )),
    error: v.optional(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const { subTaskId, timestamp, ...updates } = args;
    await ctx.db.patch(subTaskId, {
      ...updates,
      updatedAt: timestamp,
    });
  },
});

// List sub-tasks by task (for SubTaskManager)
export const listByTask = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const subTasks = await ctx.db
      .query("subtasks")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    return subTasks;
  },
});
