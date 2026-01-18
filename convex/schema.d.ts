declare const _default: import("convex/server").SchemaDefinition<{
    agentSessions: import("convex/server").TableDefinition<import("convex/values").VObject<{
        sessionId?: string | undefined;
        output?: string | undefined;
        error?: string | undefined;
        metadata?: {
            completedAt?: number | undefined;
            workflowId: import("convex/values").GenericId<"workflows">;
            startedAt: number;
        } | undefined;
        agentType: string;
        status: string;
        input: string;
    }, {
        agentType: import("convex/values").VString<string, "required">;
        status: import("convex/values").VString<string, "required">;
        sessionId: import("convex/values").VString<string | undefined, "optional">;
        input: import("convex/values").VString<string, "required">;
        output: import("convex/values").VString<string | undefined, "optional">;
        error: import("convex/values").VString<string | undefined, "optional">;
        metadata: import("convex/values").VObject<{
            completedAt?: number | undefined;
            workflowId: import("convex/values").GenericId<"workflows">;
            startedAt: number;
        } | undefined, {
            workflowId: import("convex/values").VId<import("convex/values").GenericId<"workflows">, "required">;
            startedAt: import("convex/values").VFloat64<number, "required">;
            completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
        }, "optional", "workflowId" | "startedAt" | "completedAt">;
    }, "required", "agentType" | "status" | "sessionId" | "input" | "output" | "error" | "metadata" | "metadata.workflowId" | "metadata.startedAt" | "metadata.completedAt">, {
        by_workflow: ["metadata.workflowId", "_creationTime"];
        by_status: ["status", "_creationTime"];
    }, {}, {}>;
    workflows: import("convex/server").TableDefinition<import("convex/values").VObject<{
        status: string;
        metadata: {
            createdAt: number;
            updatedAt: number;
        };
        task: string;
        currentStep: string;
        artifacts: string[];
    }, {
        task: import("convex/values").VString<string, "required">;
        status: import("convex/values").VString<string, "required">;
        currentStep: import("convex/values").VString<string, "required">;
        artifacts: import("convex/values").VArray<string[], import("convex/values").VString<string, "required">, "required">;
        metadata: import("convex/values").VObject<{
            createdAt: number;
            updatedAt: number;
        }, {
            createdAt: import("convex/values").VFloat64<number, "required">;
            updatedAt: import("convex/values").VFloat64<number, "required">;
        }, "required", "createdAt" | "updatedAt">;
    }, "required", "status" | "metadata" | "task" | "currentStep" | "artifacts" | "metadata.createdAt" | "metadata.updatedAt">, {
        by_status: ["status", "_creationTime"];
    }, {}, {}>;
    tasks: import("convex/server").TableDefinition<import("convex/values").VObject<{
        description?: string | undefined;
        workspacePath?: string | undefined;
        pauseReason?: "user" | "auto" | undefined;
        status: "pending" | "running" | "paused" | "done" | "cancelled";
        title: string;
        priority: "low" | "medium" | "high";
        subTaskIds: import("convex/values").GenericId<"subtasks">[];
        logs: {
            source?: string | undefined;
            timestamp: number;
            message: string;
            level: "error" | "info" | "warning";
        }[];
    }, {
        title: import("convex/values").VString<string, "required">;
        description: import("convex/values").VString<string | undefined, "optional">;
        status: import("convex/values").VUnion<"pending" | "running" | "paused" | "done" | "cancelled", [import("convex/values").VLiteral<"pending", "required">, import("convex/values").VLiteral<"running", "required">, import("convex/values").VLiteral<"paused", "required">, import("convex/values").VLiteral<"done", "required">, import("convex/values").VLiteral<"cancelled", "required">], "required", never>;
        priority: import("convex/values").VUnion<"low" | "medium" | "high", [import("convex/values").VLiteral<"low", "required">, import("convex/values").VLiteral<"medium", "required">, import("convex/values").VLiteral<"high", "required">], "required", never>;
        workspacePath: import("convex/values").VString<string | undefined, "optional">;
        pauseReason: import("convex/values").VUnion<"user" | "auto" | undefined, [import("convex/values").VLiteral<"user", "required">, import("convex/values").VLiteral<"auto", "required">], "optional", never>;
        subTaskIds: import("convex/values").VArray<import("convex/values").GenericId<"subtasks">[], import("convex/values").VId<import("convex/values").GenericId<"subtasks">, "required">, "required">;
        logs: import("convex/values").VArray<{
            source?: string | undefined;
            timestamp: number;
            message: string;
            level: "error" | "info" | "warning";
        }[], import("convex/values").VObject<{
            source?: string | undefined;
            timestamp: number;
            message: string;
            level: "error" | "info" | "warning";
        }, {
            timestamp: import("convex/values").VFloat64<number, "required">;
            message: import("convex/values").VString<string, "required">;
            level: import("convex/values").VUnion<"error" | "info" | "warning", [import("convex/values").VLiteral<"info", "required">, import("convex/values").VLiteral<"warning", "required">, import("convex/values").VLiteral<"error", "required">], "required", never>;
            source: import("convex/values").VString<string | undefined, "optional">;
        }, "required", "timestamp" | "message" | "level" | "source">, "required">;
    }, "required", "status" | "title" | "description" | "priority" | "workspacePath" | "pauseReason" | "subTaskIds" | "logs">, {
        by_status: ["status", "_creationTime"];
        by_priority: ["priority", "_creationTime"];
    }, {}, {}>;
    subtasks: import("convex/server").TableDefinition<import("convex/values").VObject<{
        agentType: string;
        status: "pending" | "running" | "done" | "failed";
        title: string;
        logs: {
            source?: string | undefined;
            timestamp: number;
            message: string;
            level: "error" | "info" | "warning";
        }[];
        taskId: import("convex/values").GenericId<"tasks">;
        stepNumber: number;
        totalSteps: number;
    }, {
        taskId: import("convex/values").VId<import("convex/values").GenericId<"tasks">, "required">;
        title: import("convex/values").VString<string, "required">;
        status: import("convex/values").VUnion<"pending" | "running" | "done" | "failed", [import("convex/values").VLiteral<"pending", "required">, import("convex/values").VLiteral<"running", "required">, import("convex/values").VLiteral<"done", "required">, import("convex/values").VLiteral<"failed", "required">], "required", never>;
        agentType: import("convex/values").VString<string, "required">;
        stepNumber: import("convex/values").VFloat64<number, "required">;
        totalSteps: import("convex/values").VFloat64<number, "required">;
        logs: import("convex/values").VArray<{
            source?: string | undefined;
            timestamp: number;
            message: string;
            level: "error" | "info" | "warning";
        }[], import("convex/values").VObject<{
            source?: string | undefined;
            timestamp: number;
            message: string;
            level: "error" | "info" | "warning";
        }, {
            timestamp: import("convex/values").VFloat64<number, "required">;
            message: import("convex/values").VString<string, "required">;
            level: import("convex/values").VUnion<"error" | "info" | "warning", [import("convex/values").VLiteral<"info", "required">, import("convex/values").VLiteral<"warning", "required">, import("convex/values").VLiteral<"error", "required">], "required", never>;
            source: import("convex/values").VString<string | undefined, "optional">;
        }, "required", "timestamp" | "message" | "level" | "source">, "required">;
    }, "required", "agentType" | "status" | "title" | "logs" | "taskId" | "stepNumber" | "totalSteps">, {
        by_task: ["taskId", "_creationTime"];
        by_status: ["status", "_creationTime"];
    }, {}, {}>;
}, true>;
export default _default;
