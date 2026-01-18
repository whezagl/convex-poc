// @convex-poc/shared-types/subtask - Subtask type definitions
// This file contains TypeScript types and Zod schemas for SubTask entities

import { z } from "zod";

export const SubTaskStatusSchema = z.union([
  z.literal("pending"),
  z.literal("running"),
  z.literal("done"),
  z.literal("failed"),
]);

export type SubTaskStatus = z.infer<typeof SubTaskStatusSchema>;

export const SubTaskSchema = z.object({
  _id: z.string(),
  taskId: z.string(), // Reference to parent task
  title: z.string(),
  status: SubTaskStatusSchema,
  agentType: z.string(), // "BE Boilerplate", "BE CRUD APIs", etc.
  stepNumber: z.number(),
  totalSteps: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type SubTask = z.infer<typeof SubTaskSchema>;
