import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new task
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    workspacePath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: "pending",
      priority: args.priority,
      workspacePath: args.workspacePath,
      subTaskIds: [],
      logs: [],
    });
    return taskId;
  },
});

// Get all tasks (for Kanban board)
export const getTasks = query({
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    return tasks;
  },
});

// Get tasks by status (for Kanban columns)
export const getTasksByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
    return tasks;
  },
});

// Update task status
export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("paused"),
      v.literal("done"),
      v.literal("cancelled")
    ),
    pauseReason: v.optional(v.union(v.literal("user"), v.literal("auto"))),
  },
  handler: async (ctx, args) => {
    const { taskId, status, pauseReason } = args;
    await ctx.db.patch(taskId, {
      status,
      ...(pauseReason && { pauseReason }),
    });
  },
});

// Add log to task
export const addTaskLog = mutation({
  args: {
    taskId: v.id("tasks"),
    message: v.string(),
    level: v.union(v.literal("info"), v.literal("warning"), v.literal("error")),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const newLog = {
      timestamp: Date.now(),
      message: args.message,
      level: args.level,
      source: args.source,
    };

    await ctx.db.patch(args.taskId, {
      logs: [...task.logs, newLog],
    });
  },
});

// Get task by ID
export const getTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    return task;
  },
});
