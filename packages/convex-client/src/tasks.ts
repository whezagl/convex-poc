// @convex-poc/convex-client/tasks - Type-safe task query/mutation wrappers
// This module provides type-safe wrappers for all task-related Convex functions

import type { ConvexClient } from "convex/browser";

import type { Task, TaskStatus, TaskPriority } from "@convex-poc/shared-types/task";

import { getConvexClient } from "./client.js";

/**
 * Get all tasks (for Kanban board)
 */
export async function getTasks(client?: ConvexClient): Promise<Task[]> {
  const convex = client || getConvexClient();
  return await convex.query("api/tasks:getTasks" as any, {});
}

/**
 * Get tasks by status (for Kanban columns)
 */
export async function getTasksByStatus(
  status: TaskStatus,
  client?: ConvexClient
): Promise<Task[]> {
  const convex = client || getConvexClient();
  return await convex.query("api/tasks:getTasksByStatus" as any, { status });
}

/**
 * Create a new task
 */
export async function createTask(
  args: {
    title: string;
    description?: string;
    priority: TaskPriority;
    workspacePath?: string;
  },
  client?: ConvexClient
): Promise<string> {
  const convex = client || getConvexClient();
  const taskId = await convex.mutation("api/tasks:createTask" as any, args);
  return taskId;
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  args: {
    taskId: string;
    status: TaskStatus;
    pauseReason?: "user" | "auto";
  },
  client?: ConvexClient
): Promise<void> {
  const convex = client || getConvexClient();
  await convex.mutation("api/tasks:updateTaskStatus" as any, args);
}

/**
 * Add log to task
 */
export async function addTaskLog(
  args: {
    taskId: string;
    message: string;
    level: "info" | "warning" | "error";
    source?: string;
  },
  client?: ConvexClient
): Promise<void> {
  const convex = client || getConvexClient();
  await convex.mutation("api/tasks:addTaskLog" as any, args);
}

/**
 * Get task by ID
 */
export async function getTask(
  taskId: string,
  client?: ConvexClient
): Promise<Task | null> {
  const convex = client || getConvexClient();
  const task = await convex.query("api/tasks:getTask" as any, { taskId });
  return task;
}

/**
 * Create a new task (for ParallelOrchestrator)
 */
export async function create(
  args: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    workspacePath?: string;
    createdAt: number;
    updatedAt: number;
  },
  client?: ConvexClient
): Promise<string> {
  const convex = client || getConvexClient();
  const taskId = await convex.mutation("api/tasks:create" as any, args);
  return taskId;
}

/**
 * Update task status (for ParallelOrchestrator)
 */
export async function updateStatus(
  args: {
    taskId: string;
    status: TaskStatus;
    subTaskIds?: string[];
    progress?: {
      completed: number;
      total: number;
      failed?: number;
    };
    updatedAt: number;
  },
  client?: ConvexClient
): Promise<void> {
  const convex = client || getConvexClient();
  await convex.mutation("api/tasks:updateStatus" as any, args);
}

/**
 * Update task with classification result (for AgentDispatcher)
 */
export async function updateClassification(
  args: {
    taskId: string;
    agentType: string;
    confidence: number;
    method: string;
    keywords: string[];
    reasoning?: string;
    timestamp: number;
  },
  client?: ConvexClient
): Promise<void> {
  const convex = client || getConvexClient();
  await convex.mutation("api/tasks:updateClassification" as any, args);
}

/**
 * List tasks by status (for ParallelOrchestrator)
 */
export async function listByStatus(
  status: TaskStatus,
  client?: ConvexClient
): Promise<Task[]> {
  const convex = client || getConvexClient();
  return await convex.query("api/tasks:listByStatus" as any, { status });
}
