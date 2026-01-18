// @convex-poc/agent-orchestrator/orchestrator/ParallelOrchestrator - Parallel task orchestration

import type { AgentType } from "@convex-poc/shared-types/agent";
import { convex } from "@convex-poc/convex-client";
import { TaskQueue } from "../queue/TaskQueue.js";
import { AgentDispatcher } from "../dispatcher/AgentDispatcher.js";
import * as Agents from "../agents/index.js";
import { SubTaskManager } from "./SubTaskManager.js";
import { parseDDL } from "@convex-poc/template-engine/parser";
import type { TableDefinition } from "../agents/types.js";

/**
 * ParallelOrchestrator coordinates multi-agent task execution with parallel sub-tasks.
 *
 * Replaces SequentialOrchestrator with:
 * - Priority-based task queue (max 5 concurrent tasks)
 * - Keyword-based agent routing with LLM fallback
 * - Sub-task spawning (N sub-tasks for CRUD operations)
 * - Real-time Convex progress streaming
 * - File locking for parallel writes
 *
 * Workflow:
 * 1. Classify task description -> Agent type
 * 2. Spawn appropriate sub-tasks (1 for boilerplate, N for CRUD)
 * 3. Execute sub-tasks in parallel with concurrency limits
 * 4. Track progress in Convex for real-time UI updates
 */
export class ParallelOrchestrator {
  private readonly taskQueue: TaskQueue;
  private readonly dispatcher: AgentDispatcher;

  constructor(config?: {
    dispatcher?: {
      apiKey?: string;
      enableLLM?: boolean;
    };
  }) {
    // Create task queue with max 5 concurrent tasks
    this.taskQueue = new TaskQueue({
      concurrency: 5,
      autoStart: true,
      timeout: 600000, // 10 minutes per task (boilerplate takes longer)
    });

    // Create agent dispatcher
    this.dispatcher = new AgentDispatcher({
      llmConfig: config?.dispatcher?.apiKey
        ? { apiKey: config.dispatcher.apiKey }
        : undefined,
      enableLLM: config?.dispatcher?.enableLLM ?? true,
    });

    console.log("[ParallelOrchestrator] Initialized with max 5 concurrent tasks");
  }

  /**
   * Executes a task with parallel sub-task coordination.
   *
   * @param taskInput - Task input with description, workspace, DDL path
   * @returns Task execution result
   */
  async executeTask(taskInput: {
    description: string;
    workspacePath: string;
    ddlPath?: string;
    priority?: number; // 1-10, default 5
  }): Promise<{
    success: boolean;
    taskId: string;
    subTaskCount: number;
  }> {
    const { description, workspacePath, ddlPath, priority = 5 } = taskInput;

    console.log(`[ParallelOrchestrator] Executing task: ${description}`);

    // Step 1: Create task in Convex
    const taskId = await convex.mutations.tasks.create({
      title: description,
      description,
      status: "pending",
      priority: this.mapPriority(priority),
      workspacePath,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log(`[ParallelOrchestrator] Created task: ${taskId}`);

    // Step 2: Classify task to determine agent type
    const classification = await this.dispatcher.classifyTask(description, taskId);
    console.log(
      `[ParallelOrchestrator] Classified as ${classification.agentType} (confidence: ${classification.confidence})`
    );

    // Step 3: Add task to queue for execution
    await this.taskQueue.add(
      () => this.coordinateExecution(taskId, classification.agentType, workspacePath, ddlPath),
      { taskId, priority }
    );

    return {
      success: true,
      taskId,
      subTaskCount: 0, // Will be updated by coordinateExecution
    };
  }

  /**
   * Coordinates task execution with sub-task spawning and agent coordination.
   *
   * @param taskId - Task ID
   * @param agentType - Determined agent type
   * @param workspacePath - Workspace path for code generation
   * @param ddlPath - Optional DDL path for CRUD operations
   */
  private async coordinateExecution(
    taskId: string,
    agentType: AgentType,
    workspacePath: string,
    ddlPath?: string
  ): Promise<void> {
    console.log(`[ParallelOrchestrator] Coordinating ${agentType} for task ${taskId}`);

    try {
      // Update task status to running
      await convex.mutations.tasks.updateStatus({
        taskId,
        status: "running",
        updatedAt: Date.now(),
      });

      // Create sub-task manager
      const subTaskManager = new SubTaskManager({
        parentTaskId: taskId,
        workspacePath,
        ddlPath,
      });

      // Route to appropriate agent
      if (agentType === "BE Boilerplate" || agentType === "FE Boilerplate") {
        // Boilerplate: Spawn 1 sub-task
        await subTaskManager.executeBoilerplateSubTask(
          agentType,
          async (subTaskId: string) => {
            const AgentClass = agentType === "BE Boilerplate"
              ? Agents.BEBoilerplateAgent
              : Agents.FEBoilerplateAgent;

            const agent = new AgentClass({
              agentType,
              subTaskId,
              workspacePath,
              templateType: agentType === "BE Boilerplate" ? "be/boilerplate" : "fe/boilerplate",
              totalSteps: 5,
            });

            await agent.execute();
            await agent.cleanup();
          }
        );

      } else {
        // CRUD: Parse DDL and spawn N sub-tasks (one per table)
        if (!ddlPath) {
          throw new Error(`DDL path required for ${agentType}`);
        }

        const tables = await this.parseTables(ddlPath);
        console.log(`[ParallelOrchestrator] Parsed ${tables.length} tables from DDL`);

        const subTaskIds = await subTaskManager.spawnSubTasks(tables, agentType);

        // Execute sub-tasks with appropriate agent
        const AgentClass = this.getAgentClass(agentType);

        await subTaskManager.executeSubTasks(
          subTaskIds,
          tables,
          async (subTaskId: string, table: TableDefinition) => {
            const agent = new AgentClass({
              agentType,
              subTaskId,
              workspacePath,
              ddlPath,
              templateType: this.getTemplateType(agentType),
              totalSteps: 5,
            });

            await agent.execute(table);
            await agent.cleanup();
          }
        );
      }

      // Cleanup
      await subTaskManager.cleanup();

      console.log(`[ParallelOrchestrator] Task ${taskId} completed successfully`);

    } catch (error) {
      console.error(`[ParallelOrchestrator] Task ${taskId} failed: ${error}`);

      // Update task status to cancelled (using "cancelled" for failed tasks)
      await convex.mutations.tasks.updateStatus({
        taskId,
        status: "cancelled",
        updatedAt: Date.now(),
      });

      throw error;
    }
  }

  /**
   * Parses DDL file to extract table definitions.
   */
  private async parseTables(ddlPath: string): Promise<TableDefinition[]> {
    const { readFile } = await import("fs/promises");
    const ddlContent = await readFile(ddlPath, "utf-8");
    const parseResult = parseDDL(ddlContent);

    if (!parseResult.success) {
      throw new Error(`DDL parsing failed: ${parseResult.errors.join(", ")}`);
    }

    return parseResult.tables;
  }

  /**
   * Gets agent class for agent type.
   */
  private getAgentClass(agentType: AgentType): typeof Agents.BECRUDAgent {
    switch (agentType) {
      case "BE CRUD APIs":
        return Agents.BECRUDAgent;
      case "FE CRUD Services":
        return Agents.FECRUDAgent;
      case "UI CRUD Pages":
        return Agents.UICRUDAgent;
      default:
        throw new Error(`Unknown CRUD agent type: ${agentType}`);
    }
  }

  /**
   * Gets template type for agent type.
   */
  private getTemplateType(agentType: AgentType): string {
    switch (agentType) {
      case "BE CRUD APIs":
        return "crud/be";
      case "FE CRUD Services":
        return "crud/fe";
      case "UI CRUD Pages":
        return "crud/ui";
      default:
        throw new Error(`Unknown CRUD agent type: ${agentType}`);
    }
  }

  /**
   * Maps priority number to Convex priority enum.
   */
  private mapPriority(priority: number): "low" | "medium" | "high" {
    if (priority >= 8) return "high";
    if (priority >= 4) return "medium";
    return "low";
  }

  /**
   * Gets queue statistics for monitoring.
   */
  getQueueStats() {
    return this.taskQueue.getStats();
  }

  /**
   * Waits for all tasks to complete.
   */
  async onIdle(): Promise<void> {
    return this.taskQueue.onIdle();
  }

  /**
   * Pauses task queue (no new tasks start).
   */
  pause(): void {
    this.taskQueue.pause();
  }

  /**
   * Starts task queue after pausing.
   */
  start(): void {
    this.taskQueue.start();
  }

  /**
   * Clears all pending tasks.
   */
  clear(): void {
    this.taskQueue.clear();
  }
}
