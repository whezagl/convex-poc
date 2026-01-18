// @convex-poc/shared-types/task - Task type definitions
// This file contains TypeScript types and Zod schemas for Task entities

import { z } from "zod";

export const TaskStatusSchema = z.union([
  z.literal("pending"),
  z.literal("running"),
  z.literal("paused"),
  z.literal("done"),
]);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskPrioritySchema = z.union([
  z.literal("low"),
  z.literal("medium"),
  z.literal("high"),
]);

export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

export const TaskSchema = z.object({
  _id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Task = z.infer<typeof TaskSchema>;
