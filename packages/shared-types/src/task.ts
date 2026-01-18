// @convex-poc/shared-types/task - Task type definitions
// This file contains TypeScript types and Zod schemas for Task entities

import { z } from "zod";

// Union types (not enums) per CONTEXT.md decision
export const TaskStatusSchema = z.union([
  z.literal("pending"),
  z.literal("running"),
  z.literal("paused"),
  z.literal("done"),
  z.literal("cancelled"),
]);

export const TaskPrioritySchema = z.union([
  z.literal("low"),
  z.literal("medium"),
  z.literal("high"),
]);

export const PauseReasonSchema = z.union([
  z.literal("user"),
  z.literal("auto"),
]);

// TypeScript types derived from schemas
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type PauseReason = z.infer<typeof PauseReasonSchema>;

// Document schema
export const TaskSchema = z.object({
  _id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  workspacePath: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  // For pause state
  pauseReason: PauseReasonSchema.optional(),
});

export type Task = z.infer<typeof TaskSchema>;
