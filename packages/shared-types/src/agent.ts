// @convex-poc/shared-types/agent - Agent type definitions
// This file contains TypeScript types and Zod schemas for Agent entities

import { z } from "zod";

export const AgentRoleSchema = z.union([
  z.literal("planner"),
  z.literal("coder"),
  z.literal("reviewer"),
]);

export type AgentRole = z.infer<typeof AgentRoleSchema>;

export const AgentStatusSchema = z.union([
  z.literal("idle"),
  z.literal("working"),
  z.literal("error"),
]);

export type AgentStatus = z.infer<typeof AgentStatusSchema>;

export const AgentSchema = z.object({
  id: z.string(),
  role: AgentRoleSchema,
  status: AgentStatusSchema,
  model: z.string(),
});

export type Agent = z.infer<typeof AgentSchema>;
