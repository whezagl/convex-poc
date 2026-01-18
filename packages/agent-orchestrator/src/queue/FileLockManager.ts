// @convex-poc/agent-orchestrator/queue/FileLockManager - File locking for parallel writes

import lock from "proper-lockfile";
import { promises as fs } from "fs";

/**
 * FileLockManager provides file locking to prevent write conflicts during parallel execution.
 *
 * Uses proper-lockfile library with:
 * - Automatic retry on lock acquisition
 * - Stale lock detection (locks expire after 10s)
 * - Graceful cleanup on process exit
 *
 * Example:
 * ```typescript
 * const lockManager = new FileLockManager();
 * await lockManager.withLock("/path/to/file", async () => {
 *   await fs.writeFile("/path/to/file", "content");
 * });
 * await lockManager.releaseAll();
 * ```
 */
export class FileLockManager {
  private locks: Map<string, () => Promise<boolean>> = new Map();

  /**
   * Executes a function while holding a file lock.
   * Prevents concurrent writes to the same file.
   *
   * @param filePath - Path to file to lock
   * @param fn - Async function to execute while holding lock
   */
  async withLock<T>(filePath: string, fn: () => Promise<T>): Promise<T> {
    // Acquire lock
    const release = await lock.lock(filePath, {
      retries: {
        retries: 10,
        minTimeout: 50,
        maxTimeout: 200,
      },
      stale: 10000, // 10 seconds
    });

    // Store release function for cleanup
    this.locks.set(filePath, release);

    try {
      // Execute function while holding lock
      return await fn();
    } finally {
      // Always release lock
      await this.releaseLock(filePath);
    }
  }

  /**
   * Releases a specific file lock.
   *
   * @param filePath - Path to file to unlock
   */
  async releaseLock(filePath: string): Promise<void> {
    const release = this.locks.get(filePath);
    if (release) {
      try {
        await release();
        this.locks.delete(filePath);
      } catch (error) {
        console.error(`[FileLockManager] Failed to release lock for ${filePath}:`, error);
      }
    }
  }

  /**
   * Releases all held locks.
   * Call this when agent is done (even if it failed).
   */
  async releaseAll(): Promise<void> {
    const releasePromises = Array.from(this.locks.entries()).map(
      async ([filePath, release]) => {
        try {
          await release();
        } catch (error) {
          console.error(`[FileLockManager] Failed to release lock for ${filePath}:`, error);
        }
      }
    );

    await Promise.all(releasePromises);
    this.locks.clear();
  }

  /**
   * Checks if a file is currently locked.
   *
   * @param filePath - Path to file to check
   * @returns True if file is locked
   */
  async isLocked(filePath: string): Promise<boolean> {
    const locked = await lock.check(filePath);
    return locked;
  }
}
