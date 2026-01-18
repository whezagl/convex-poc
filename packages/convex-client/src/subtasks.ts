// @convex-poc/convex-client/subtasks - Type-safe subtask query/mutation wrappers
// This module provides type-safe wrappers for all subtask-related Convex functions

import type { ConvexClient } from "convex/browser";

import type { SubTask, SubTaskStatus } from "@convex-poc/shared-types/subtask";

import { getConvexClient } from "./client.js";

/**
 * Get subtasks by task ID (for "Sub-tasks" column)
 */
export async function getSubTasksByTask(
  taskId: string,
  client?: ConvexClient
): Promise<SubTask[]> {
  const convex = client || getConvexClient();
  return await convex.query("api/subtasks:getSubTasksByTask" as any, { taskId });
}

/**
 * Create a new subtask
 */
export async function createSubTask(
  args: {
    taskId: string;
    title: string;
    agentType: string;
    totalSteps: number;
  },
  client?: ConvexClient
): Promise<string> {
  const convex = client || getConvexClient();
  const subtaskId = await convex.mutation("api/subtasks:createSubTask" as any, args);
  return subtaskId;
}

/**
 * Update subtask status
 */
export async function updateSubTaskStatus(
  args: {
    subtaskId: string;
    status: SubTaskStatus;
  },
  client?: ConvexClient
): Promise<void> {
  const convex = client || getConvexClient();
  await convex.mutation("api/subtasks:updateSubTaskStatus" as any, args);
}

/**
 * Update subtask progress (stepNumber)
 */
export async function updateSubTaskProgress(
  args: {
    subtaskId: string;
    stepNumber: number;
  },
  client?: ConvexClient
): Promise<void> {
  const convex = client || getConvexClient();
  await convex.mutation("api/subtasks:updateSubTaskProgress" as any, args);
}

/**
 * Add log to subtask
 */
export async function addSubTaskLog(
  args: {
    subtaskId: string;
    message: string;
    level: "info" | "warning" | "error";
    source?: string;
  },
  client?: ConvexClient
): Promise<void> {
  const convex = client || getConvexClient();
  await convex.mutation("api/subtasks:addSubTaskLog" as any, args);
}

/**
 * Get subtask by ID
 */
export async function getSubTask(
  subtaskId: string,
  client?: ConvexClient
): Promise<SubTask | null> {
  const convex = client || getConvexClient();
  const subtask = await convex.query("api/subtasks:getSubTask" as any, { subtaskId });
  return subtask;
}

/**
 * Create sub-task (for SubTaskManager)
 */
export async function create(
  args: {
    taskId: string;
    title: string;
    status: SubTaskStatus;
    agentType: string;
    stepNumber: number;
    totalSteps: number;
    createdAt: number;
    updatedAt: number;
  },
  client?: ConvexClient
): Promise<string> {
  const convex = client || getConvexClient();
  const subtaskId = await convex.mutation("api/subtasks:create" as any, args);
  return subtaskId;
}

/**
 * Update sub-task progress (for SubTaskManager)
 */
export async function updateProgress(
  args: {
    subTaskId: string;
    stepNumber: number;
    totalSteps: number;
    message: string;
    status?: "running" | "done" | "failed";
    error?: string;
    timestamp: number;
  },
  client?: ConvexClient
): Promise<void> {
  const convex = client || getConvexClient();
  await convex.mutation("api/subtasks:updateProgress" as any, args);
}

/**
 * List sub-tasks by task (for SubTaskManager)
 */
export async function listByTask(
  taskId: string,
  client?: ConvexClient
): Promise<SubTask[]> {
  const convex = client || getConvexClient();
  return await convex.query("api/subtasks:listByTask" as any, { taskId });
}
