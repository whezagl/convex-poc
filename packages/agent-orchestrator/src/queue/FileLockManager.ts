// @convex-poc/agent-orchestrator/queue/FileLockManager - File locking for parallel operations

import lock from "proper-lockfile";
import type { FileLockOptions } from "../types/queue.js";
import { promises as fs } from "fs";

export class FileLockManager {
  private locks = new Map<string, () => Promise<void>>();

  /**
   * Acquires a lock for the specified file path.
   *
   * @param filePath - Absolute path to the file
   * @param options - Lock options with retries and stale detection
   * @returns Release function that must be called when done
   */
  async acquireLock(
    filePath: string,
    options: FileLockOptions = {}
  ): Promise<() => Promise<void>> {
    const {
      retries = 10,
      stale = 10000, // 10 seconds
      update = 2000, // Update every 2 seconds
    } = options;

    // Ensure file exists before locking
    try {
      await fs.access(filePath);
    } catch {
      // File doesn't exist, create empty file
      await fs.writeFile(filePath, "");
    }

    // Acquire lock
    const release = await lock(filePath, {
      retries,
      stale,
      update,
    });

    this.locks.set(filePath, release);
    return release;
  }

  /**
   * Releases a lock for the specified file path.
   *
   * @param filePath - Absolute path to the file
   */
  async releaseLock(filePath: string): Promise<void> {
    const release = this.locks.get(filePath);
    if (release) {
      await release();
      this.locks.delete(filePath);
    }
  }

  /**
   * Executes a function while holding a file lock.
   * The lock is always released, even if the function throws.
   *
   * @param filePath - Absolute path to the file
   * @param fn - Async function to execute while holding lock
   * @param options - Lock options
   * @returns Result of the function
   */
  async withLock<T>(
    filePath: string,
    fn: () => Promise<T>,
    options?: FileLockOptions
  ): Promise<T> {
    await this.acquireLock(filePath, options);
    try {
      return await fn();
    } finally {
      await this.releaseLock(filePath);
    }
  }

  /**
   * Releases all active locks.
   * Useful for cleanup on shutdown.
   */
  async releaseAll(): Promise<void> {
    const releasePromises = Array.from(this.locks.values()).map(release =>
      release().catch(err => console.error(`[FileLockManager] Failed to release lock: ${err}`))
    );
    await Promise.all(releasePromises);
    this.locks.clear();
  }

  /**
   * Gets the count of active locks.
   * Useful for monitoring potential deadlocks.
   */
  getLockCount(): number {
    return this.locks.size;
  }
}
