// @convex-poc/agent-orchestrator/orchestrator/SubTaskManager - Sub-task coordination

import type { AgentType } from "@convex-poc/shared-types/agent";
import { convex } from "@convex-poc/convex-client";
import { TaskQueue } from "../queue/TaskQueue.js";
import type { TableDefinition } from "../agents/types.js";

/**
 * SubTaskManager coordinates sub-task spawning and execution.
 *
 * Responsibilities:
 * - Create N sub-tasks in Convex (one per table for CRUD agents)
 * - Execute sub-tasks in parallel with max 5 concurrent
 * - Track aggregate progress and update parent task status
 * - Handle sub-task failures with proper error propagation
 */
export class SubTaskManager {
  private readonly subTaskQueue: TaskQueue;
  private readonly parentTaskId: string;
  private readonly workspacePath: string;
  private readonly ddlPath?: string;

  constructor(config: {
    parentTaskId: string;
    workspacePath: string;
    ddlPath?: string;
  }) {
    this.parentTaskId = config.parentTaskId;
    this.workspacePath = config.workspacePath;
    this.ddlPath = config.ddlPath;

    // Create sub-task queue with max 5 concurrent
    this.subTaskQueue = new TaskQueue({
      concurrency: 5,
      autoStart: true,
      timeout: 300000, // 5 minutes per sub-task
    });
  }

  /**
   * Spawns sub-tasks for CRUD operations (one per table).
   *
   * @param tables - Array of table definitions
   * @param agentType - Agent type for all sub-tasks
   * @returns Array of created sub-task IDs
   */
  async spawnSubTasks(
    tables: TableDefinition[],
    agentType: AgentType
  ): Promise<string[]> {
    // Create sub-tasks in Convex (batch insert)
    const subTasks = await Promise.all(
      tables.map((table, index) =>
        convex.mutations.subtasks.create({
          taskId: this.parentTaskId,
          title: `${agentType}: ${table.name}`,
          status: "pending",
          agentType,
          stepNumber: 0,
          totalSteps: 5, // Standard 5-step workflow
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      )
    );

    console.log(
      `[SubTaskManager] Spawned ${subTasks.length} sub-tasks for ${agentType}`
    );

    return subTasks;
  }

  /**
   * Executes sub-tasks in parallel using TaskQueue.
   *
   * @param subTaskIds - Array of sub-task IDs
   * @param tables - Array of table definitions (same order as subTaskIds)
   * @param agentFactory - Factory function to create agent instances
   */
  async executeSubTasks(
    subTaskIds: string[],
    tables: TableDefinition[],
    agentFactory: (subTaskId: string, table: TableDefinition) => Promise<void>
  ): Promise<void> {
    if (subTaskIds.length !== tables.length) {
      throw new Error("Sub-task count must match table count");
    }

    // Add all sub-tasks to queue (parallel execution)
    const tasks = subTaskIds.map((subTaskId, index) => ({
      taskFn: () => agentFactory(subTaskId, tables[index]),
      options: {
        taskId: subTaskId,
        priority: 5, // Medium priority for CRUD sub-tasks
      },
    }));

    // Execute with progress tracking
    await this.subTaskQueue.addMany(tasks);

    // Wait for all sub-tasks to complete
    await this.subTaskQueue.onIdle();

    // Update parent task status
    await this.updateParentTaskStatus();
  }

  /**
   * Executes boilerplate sub-task (single sub-task, no tables).
   *
   * @param agentType - Agent type (BE/FE Boilerplate)
   * @param agentFactory - Factory function to create agent instance
   */
  async executeBoilerplateSubTask(
    agentType: AgentType,
    agentFactory: (subTaskId: string) => Promise<void>
  ): Promise<void> {
    // Create single sub-task
    const [subTaskId] = await convex.mutations.subtasks.create({
      taskId: this.parentTaskId,
      title: `${agentType}: Project setup`,
      status: "pending",
      agentType,
      stepNumber: 0,
      totalSteps: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log(`[SubTaskManager] Spawned boilerplate sub-task: ${subTaskId}`);

    // Execute sub-task
    await this.subTaskQueue.add(() => agentFactory(subTaskId), {
      taskId: subTaskId,
      priority: 10, // High priority for boilerplate
    });

    // Wait for completion
    await this.subTaskQueue.onIdle();

    // Update parent task status
    await this.updateParentTaskStatus();
  }

  /**
   * Updates parent task status based on sub-task completion.
   * Aggregates sub-task statuses and updates Convex.
   */
  private async updateParentTaskStatus(): Promise<void> {
    // Fetch all sub-tasks for parent task
    const subTasks = await convex.queries.subtasks.listByTask({
      taskId: this.parentTaskId,
    });

    if (!subTasks || subTasks.length === 0) {
      console.warn(`[SubTaskManager] No sub-tasks found for parent ${this.parentTaskId}`);
      return;
    }

    // Calculate aggregate status
    const total = subTasks.length;
    const done = subTasks.filter(st => st.status === "done").length;
    const failed = subTasks.filter(st => st.status === "failed").length;
    const running = subTasks.filter(st => st.status === "running").length;

    let parentStatus: "pending" | "running" | "done" | "cancelled";
    if (done === total) {
      parentStatus = failed > 0 ? "cancelled" : "done";
    } else if (running > 0 || done > 0) {
      parentStatus = "running";
    } else {
      parentStatus = "pending";
    }

    // Update parent task in Convex
    await convex.mutations.tasks.updateStatus({
      taskId: this.parentTaskId,
      status: parentStatus,
      subTaskIds: subTasks.map(st => st._id),
      progress: {
        completed: done,
        total,
        failed,
      },
      updatedAt: Date.now(),
    });

    console.log(
      `[SubTaskManager] Parent task status: ${parentStatus} (${done}/${total} sub-tasks done)`
    );
  }

  /**
   * Gets queue statistics for monitoring.
   */
  getQueueStats() {
    return this.subTaskQueue.getStats();
  }

  /**
   * Cleans up resources (queues, locks).
   */
  async cleanup(): Promise<void> {
    this.subTaskQueue.clear();
  }
}
