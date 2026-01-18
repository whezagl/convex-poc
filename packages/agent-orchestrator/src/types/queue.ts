// @convex-poc/agent-orchestrator/types/queue - Queue type definitions

export interface TaskOptions {
  taskId: string;
  priority: number; // 1 (low) to 10 (high)
  timeout?: number; // milliseconds, default 300000 (5 min)
}

export interface QueueOptions {
  concurrency?: number; // Max concurrent tasks, default 5
  autoStart?: boolean; // Auto-start queue, default true
  timeout?: number; // Default timeout per task, default 300000
  throwOnTimeout?: boolean; // Throw when timeout, default true
}

export interface FileLockOptions {
  retries?: number; // Retry attempts, default 10
  stale?: number; // ms before lock is considered stale, default 10000
  update?: number; // ms to update lockfile mtime, default 2000
}

export interface QueueStats {
  size: number; // Pending tasks
  pending: number; // Running tasks
  concurrency: number; // Max concurrency
}
