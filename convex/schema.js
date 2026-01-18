import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
    // === EXISTING: Keep for agent orchestration ===
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
    // === NEW: For Kanban board task management ===
    tasks: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        status: v.union(v.literal("pending"), v.literal("running"), v.literal("paused"), v.literal("done"), v.literal("cancelled")),
        priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
        workspacePath: v.optional(v.string()),
        pauseReason: v.optional(v.union(v.literal("user"), v.literal("auto"))),
        // Sub-task IDs for parallel execution visualization
        subTaskIds: v.array(v.id("subtasks")),
        // Embedded logs for streaming (max size TBD, 1MB limit per Convex docs)
        logs: v.array(v.object({
            timestamp: v.number(),
            message: v.string(),
            level: v.union(v.literal("info"), v.literal("warning"), v.literal("error")),
            source: v.optional(v.string()),
        })),
    })
        .index("by_status", ["status"])
        .index("by_priority", ["priority"]),
    subtasks: defineTable({
        taskId: v.id("tasks"), // Reference to parent task
        title: v.string(),
        status: v.union(v.literal("pending"), v.literal("running"), v.literal("done"), v.literal("failed")),
        agentType: v.string(), // "BE Boilerplate", "BE CRUD APIs", etc.
        stepNumber: v.number(),
        totalSteps: v.number(),
        // Embedded logs for sub-task streaming
        logs: v.array(v.object({
            timestamp: v.number(),
            message: v.string(),
            level: v.union(v.literal("info"), v.literal("warning"), v.literal("error")),
            source: v.optional(v.string()),
        })),
    })
        .index("by_task", ["taskId"])
        .index("by_status", ["status"]),
});
