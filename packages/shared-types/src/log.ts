// @convex-poc/shared-types/log - Log type definitions
// This file contains TypeScript types and Zod schemas for Log entities

import { z } from "zod";

export const LogLevelSchema = z.union([
  z.literal("info"),
  z.literal("warning"),
  z.literal("error"),
]);

export type LogLevel = z.infer<typeof LogLevelSchema>;

export const LogSchema = z.object({
  timestamp: z.number(),
  message: z.string(),
  level: LogLevelSchema,
  source: z.string().optional(), // "agent" or "system"
});

export type Log = z.infer<typeof LogSchema>;
