import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agentSessions: defineTable({
    agentType: v.string(),
    status: v.string(),
    sessionId: v.optional(v.string()),
    input: v.string(),
    output: v.optional(v.string()),
    error: v.optional(v.string()),
    metadata: v.optional(v.object({
      workflowId: v.id("workflows"),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
    })),
  })
    .index("by_workflow", ["metadata.workflowId"])
    .index("by_status", ["status"]),

  workflows: defineTable({
    task: v.string(),
    status: v.string(),
    currentStep: v.string(),
    artifacts: v.array(v.string()),
    metadata: v.object({
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  })
    .index("by_status", ["status"]),
});
