// @convex-poc/shared-types/agent - Agent type definitions
// This file contains TypeScript types and Zod schemas for Agent entities

import { z } from "zod";

export const AgentTypeSchema = z.union([
  z.literal("BE Boilerplate"),
  z.literal("FE Boilerplate"),
  z.literal("BE CRUD APIs"),
  z.literal("FE CRUD Services"),
  z.literal("UI CRUD Pages"),
]);

export type AgentType = z.infer<typeof AgentTypeSchema>;

export const AgentSchema = z.object({
  agentType: AgentTypeSchema,
  currentStep: z.number(),
  totalSteps: z.number(),
  status: z.union([
    z.literal("idle"),
    z.literal("running"),
    z.literal("done"),
    z.literal("failed"),
  ]),
});

export type Agent = z.infer<typeof AgentSchema>;
