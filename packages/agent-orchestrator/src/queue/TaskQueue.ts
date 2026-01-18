// @convex-poc/agent-orchestrator/queue/TaskQueue - Priority queue with concurrency control

import PQueue from "p-queue";
import type { QueueOptions, TaskOptions, QueueStats } from "../types/queue.js";

export class TaskQueue {
  private queue: PQueue;
  private taskCount = 0;

  constructor(options: QueueOptions = {}) {
    const {
      concurrency = 5, // Max 5 concurrent tasks per research
      autoStart = true,
      timeout = 300000, // 5 minutes
      throwOnTimeout = true,
    } = options;

    this.queue = new PQueue({
      concurrency,
      autoStart,
      timeout,
      throwOnTimeout,
    });

    // Log queue events for monitoring
    this.queue.on("active", () => {
      console.log(`[TaskQueue] Task started. Pending: ${this.queue.size}, Running: ${this.queue.pending}`);
    });

    this.queue.on("next", () => {
      console.log(`[TaskQueue] Task completed. Pending: ${this.queue.size}, Running: ${this.queue.pending}`);
    });

    this.queue.on("idle", () => {
      console.log(`[TaskQueue] Queue is idle. Total tasks processed: ${this.taskCount}`);
    });
  }

  /**
   * Adds a task to the queue with priority.
   *
   * @param taskFn - Async function to execute
   * @param options - Task options with priority (1=low, 10=high)
   * @returns Promise that resolves when task completes
   */
  async add<T>(
    taskFn: () => Promise<T>,
    options: TaskOptions
  ): Promise<T> {
    const { priority } = options;

    this.taskCount++;

    return this.queue.add(taskFn, {
      priority, // Higher priority = executes first
    }) as Promise<T>;
  }

  /**
   * Adds multiple tasks to the queue.
   * Tasks execute in parallel up to concurrency limit.
   *
   * @param tasks - Array of task functions and options
   * @returns Array of results in the same order as input
   */
  async addMany<T>(
    tasks: Array<{
      taskFn: () => Promise<T>;
      options: TaskOptions;
    }>
  ): Promise<T[]> {
    const promises = tasks.map(({ taskFn, options }) =>
      this.add(taskFn, options)
    );
    return Promise.all(promises);
  }

  /**
   * Waits for all tasks in the queue to complete.
   *
   * @returns Promise that resolves when queue is idle
   */
  async onIdle(): Promise<void> {
    return this.queue.onIdle();
  }

  /**
   * Pauses the queue (no new tasks will start).
   * Currently running tasks continue to completion.
   */
  pause(): void {
    this.queue.pause();
    console.log("[TaskQueue] Queue paused");
  }

  /**
   * Starts the queue after pausing.
   */
  start(): void {
    this.queue.start();
    console.log("[TaskQueue] Queue started");
  }

  /**
   * Clears all pending tasks from the queue.
   * Currently running tasks are not affected.
   */
  clear(): void {
    this.queue.clear();
    console.log("[TaskQueue] Queue cleared");
  }

  /**
   * Gets current queue statistics.
   *
   * @returns Queue stats with size, pending count, and concurrency
   */
  getStats(): QueueStats {
    return {
      size: this.queue.size,
      pending: this.queue.pending,
      concurrency: this.queue.concurrency,
    };
  }

  /**
   * Gets the total number of tasks processed.
   */
  getTotalProcessed(): number {
    return this.taskCount;
  }

  /**
   * Checks if the queue is empty (no pending or running tasks).
   */
  isEmpty(): boolean {
    return this.queue.size === 0 && this.queue.pending === 0;
  }
}
