/**
 * Type definitions for code generation and file operations.
 */

/**
 * A single file change operation.
 *
 * @property path - File path relative to project root
 * @property content - File content (for create/update operations)
 * @property operation - Type of operation: create (new file), update (modify existing), delete (remove file)
 */
export interface FileChange {
  path: string;
  content: string;
  operation: "create" | "update" | "delete";
}

/**
 * Result of code generation by CoderAgent.
 *
 * Provides structured file modification plan with change tracking
 * and summary documentation.
 *
 * @property changes - Array of 1-10 file change operations
 * @property summary - Human-readable description of what was changed
 * @property filesModified - Array of file paths that were modified
 */
export interface CodeResult {
  changes: FileChange[];
  summary: string;
  filesModified: string[];
}

/**
 * Validates that a CodeResult meets requirements.
 *
 * Ensures:
 * - Changes array exists and has 1-10 items
 * - Each change has required fields (path, content, operation)
 * - Operation is valid ('create', 'update', 'delete')
 * - No duplicate paths in changes
 * - Summary is a non-empty string
 * - filesModified matches paths from changes
 *
 * @param result - The CodeResult to validate
 * @throws Error if validation fails
 */
export function validateCodeResult(result: CodeResult): void {
  if (!result.changes || !Array.isArray(result.changes)) {
    throw new Error("CodeResult must have a changes array");
  }

  if (result.changes.length < 1 || result.changes.length > 10) {
    throw new Error(
      `CodeResult must have 1-10 changes, got ${result.changes.length}`
    );
  }

  const paths = new Set<string>();

  for (let i = 0; i < result.changes.length; i++) {
    const change: FileChange = result.changes[i];

    if (!change.path || typeof change.path !== "string") {
      throw new Error(`Change ${i} must have a path`);
    }

    if (change.path.trim().length === 0) {
      throw new Error(`Change ${i} path cannot be empty`);
    }

    // Check for duplicate paths
    if (paths.has(change.path)) {
      throw new Error(`Change ${i} has duplicate path: ${change.path}`);
    }
    paths.add(change.path);

    if (typeof change.content !== "string") {
      throw new Error(`Change ${i} must have content (string)`);
    }

    if (
      !change.operation ||
      typeof change.operation !== "string" ||
      !["create", "update", "delete"].includes(change.operation)
    ) {
      throw new Error(
        `Change ${i} must have valid operation: 'create', 'update', or 'delete'`
      );
    }
  }

  if (!result.summary || typeof result.summary !== "string") {
    throw new Error("CodeResult must have a summary string");
  }

  if (result.summary.trim().length === 0) {
    throw new Error("Summary cannot be empty");
  }

  if (!result.filesModified || !Array.isArray(result.filesModified)) {
    throw new Error("CodeResult must have a filesModified array");
  }

  // Verify filesModified matches the paths from changes
  const changesPaths = Array.from(paths).sort();
  const modifiedPaths = result.filesModified.sort();

  if (JSON.stringify(changesPaths) !== JSON.stringify(modifiedPaths)) {
    throw new Error(
      "filesModified array must match the paths from changes array"
    );
  }
}
