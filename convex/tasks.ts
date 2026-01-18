import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new task (for ParallelOrchestrator)
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("paused"),
      v.literal("done"),
      v.literal("cancelled")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    workspacePath: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: args.status,
      priority: args.priority,
      workspacePath: args.workspacePath,
      subTaskIds: [],
      logs: [],
    });
    return taskId;
  },
});

// Create a new task (legacy, for Kanban board)
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
      createdAt: Date.now(),
      updatedAt: Date.now(),
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

// Update task status (for ParallelOrchestrator)
export const updateStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("paused"),
      v.literal("done"),
      v.literal("cancelled")
    ),
    subTaskIds: v.optional(v.array(v.id("subtasks"))),
    progress: v.optional(v.object({
      completed: v.number(),
      total: v.number(),
      failed: v.optional(v.number()),
    })),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { taskId, subTaskIds, progress, ...updates } = args;
    await ctx.db.patch(taskId, {
      ...updates,
      ...(subTaskIds && { subTaskIds }),
    });
  },
});

// Update task with classification result (for AgentDispatcher)
export const updateClassification = mutation({
  args: {
    taskId: v.id("tasks"),
    agentType: v.string(),
    confidence: v.number(),
    method: v.string(),
    keywords: v.array(v.string()),
    reasoning: v.optional(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const { taskId, timestamp, ...classification } = args;

    // Store classification in task
    await ctx.db.patch(taskId, {
      classification,
      classifiedAt: timestamp,
    });
  },
});

// List tasks by status (for ParallelOrchestrator)
export const listByStatus = query({
  args: {
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("paused"),
      v.literal("done"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
    return tasks;
  },
});
