import { BaseAgent } from "./BaseAgent.js";
import type { AgentConfig } from "../types/agent.js";
import type { CodeResult, FileChange } from "../types/code.js";
import { validateCodeResult } from "../types/code.js";
import type { Id } from "../../convex/_generated/dataModel.js";
import { parseJson } from "../utils/parseJson.js";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

/**
 * Configuration options specific to CoderAgent.
 *
 * @property maxChanges - Maximum number of file changes to generate (default: 10)
 * @property allowedPaths - Optional array of allowed file paths (restricts where agent can write)
 */
export interface CoderConfig extends AgentConfig {
  maxChanges?: number;
  allowedPaths?: string[];
}

/**
 * CoderAgent specializes in code implementation and file operations.
 *
 * This agent extends BaseAgent to implement code changes based on plan steps,
 * producing structured file modification instructions with change tracking.
 *
 * Key features:
 * - Code implementation from plan descriptions
 * - Structured file change operations (create, update, delete)
 * - Path restriction for safety
 * - Change limit control
 * - Integration with Convex workflows
 *
 * Example usage:
 * ```typescript
 * const coder = new CoderAgent({ agentType: "coder" });
 * const result = await coder.executeCode("Create a user model with email and password fields");
 * console.log(result.changes); // Array of FileChange objects
 * ```
 */
export class CoderAgent extends BaseAgent {
  protected readonly maxChanges: number;
  protected readonly allowedPaths?: string[];

  /**
   * Creates a new CoderAgent instance.
   *
   * @param config - Agent configuration with optional coder-specific settings
   */
  constructor(config: CoderConfig) {
    super({
      agentType: config.agentType || "coder",
      model: config.model,
      workflowId: config.workflowId,
    });
    this.maxChanges = config.maxChanges || 10;
    this.allowedPaths = config.allowedPaths;
  }

  /**
   * Returns the coding-focused system prompt.
   *
   * The prompt instructs Claude to:
   * - Implement code changes based on the input description
   * - Output structured JSON with FileChange arrays
   * - Respect change limits and path restrictions
   * - Provide clear summaries of modifications
   *
   * @returns The system prompt for code implementation
   */
  protected getSystemPrompt(): string {
    let pathGuidance = "";
    if (this.allowedPaths && this.allowedPaths.length > 0) {
      pathGuidance = `\nAllowed paths: ${this.allowedPaths.join(", ")}\nOnly modify files in these paths.`;
    }

    return `You are a Coding Agent that implements code changes based on plan steps.

Your responsibilities:
1. Analyze the input task and identify necessary code changes
2. Determine which files to create, modify, or delete
3. Generate complete, working code for each file
4. Output structured JSON matching CodeResult interface
5. Provide a clear summary of what was changed${pathGuidance}

Output format requirements:
- Return ONLY valid JSON wrapped in a markdown code block with the format \`\`\`json ... \`\`\`
- Do NOT include any explanations outside the code block
- Each change should be complete and working code
- Use "create" for new files, "update" for existing files, "delete" for removal
- Include full file content in the content field
- Keep changes between 1-${this.maxChanges} items
- Group related changes together (e.g., create model and its migration together)

JSON structure:
{
  "changes": [
    {
      "path": "src/models/User.ts",
      "content": "export class User { ... }",
      "operation": "create"
    },
    {
      "path": "src/models/User.ts",
      "content": "export class User { ... updated ... }",
      "operation": "update"
    }
  ],
  "summary": "Created User model with email and password fields",
  "filesModified": ["src/models/User.ts"]
}

Example output format:
\`\`\`json
{
  "changes": [...],
  "summary": "...",
  "filesModified": [...]
}
\`\`\`

Remember: Output ONLY the JSON code block, nothing else.

Best practices:
- Write clean, readable code with proper formatting
- Include necessary imports and exports
- Follow TypeScript best practices
- Add helpful comments where appropriate
- Ensure code compiles without errors
- Handle edge cases and validation`;
  }

  /**
   * Executes the coder and returns a structured CodeResult.
   *
   * This method wraps BaseAgent.execute() to parse and validate
   * the JSON response from Claude, returning a typed CodeResult.
   *
   * Optionally applies file changes to workspace if workspacePath is provided.
   *
   * @param input - The task description to implement
   * @param workspacePath - Optional workspace path to write files to
   * @returns Structured code changes with file operations and summary
   * @throws Error if JSON parsing fails or result is invalid
   */
  public async executeCode(input: string, workspacePath?: string): Promise<CodeResult> {
    const rawResponse = await super.execute(input);

    const code = this.parseCodeResult(rawResponse);

    this.validateCodeResult(code);

    // Apply file changes if workspace path provided
    if (workspacePath) {
      const filesWritten = await this.applyFileChanges(workspacePath, code.changes);
      // Update filesWritten field
      code.filesWritten = filesWritten;
      console.log(`[CoderAgent] Wrote ${filesWritten.length} files to workspace: ${workspacePath}`);
    }

    return code;
  }

  /**
   * Applies file changes to the workspace directory.
   *
   * Handles create, update, and delete operations:
   * - create/update: Writes file content, creates parent directories if needed
   * - delete: Removes the file from workspace
   *
   * @param workspacePath - Root workspace directory path
   * @param changes - Array of file change operations to apply
   * @returns List of file paths that were written
   * @throws Error if file operations fail
   */
  public async applyFileChanges(
    workspacePath: string,
    changes: FileChange[]
  ): Promise<string[]> {
    const filesWritten: string[] = [];

    for (const change of changes) {
      const fullPath = join(workspacePath, change.path);

      switch (change.operation) {
        case "create":
        case "update":
          // Create parent directories if they don't exist
          const dirPath = join(workspacePath, change.path, "..");
          await mkdir(dirPath, { recursive: true });

          // Write the file content
          await writeFile(fullPath, change.content, "utf-8");
          console.log(`[CoderAgent] ${change.operation}: ${change.path}`);
          filesWritten.push(change.path);
          break;

        case "delete":
          // Remove the file
          await rm(fullPath, { force: true });
          console.log(`[CoderAgent] delete: ${change.path}`);
          filesWritten.push(change.path);
          break;

        default:
          throw new Error(`Unknown operation: ${(change as any).operation}`);
      }
    }

    return filesWritten;
  }

  /**
   * Executes the coder with Convex workflow integration.
   *
   * This method creates an association between the coding session
   * and a Convex workflow for state tracking and persistence.
   *
   * @param input - The task description to implement
   * @param workflowId - The Convex workflow ID to associate with this session
   * @returns Structured code changes with file operations and summary
   */
  public async executeWithWorkflow(
    input: string,
    workflowId: Id<"workflows">
  ): Promise<CodeResult> {
    const agentWithWorkflow = new CoderAgent({
      agentType: this.agentType,
      model: this.config.model,
      workflowId,
      maxChanges: this.maxChanges,
      allowedPaths: this.allowedPaths,
    });

    return agentWithWorkflow.executeCode(input);
  }

  /**
   * Parses raw response string into CodeResult using robust JSON parsing.
   *
   * Uses the parseJson utility which handles multiple fallback strategies
   * including fixing common escaping issues found in LLM responses.
   *
   * @param rawResponse - Raw string response from LLM
   * @returns Parsed CodeResult object
   * @throws Error if JSON cannot be parsed after all strategies
   */
  private parseCodeResult(rawResponse: string): CodeResult {
    return parseJson(rawResponse);
  }

  /**
   * Validates that the CodeResult meets requirements.
   *
   * Ensures:
   * - Changes array exists and has 1-10 items
   * - Each change has required fields (path, content, operation)
   * - Operation is valid ('create', 'update', 'delete')
   * - No duplicate paths in changes
   * - Summary is non-empty
   * - filesModified matches changes
   *
   * @param code - The CodeResult to validate
   * @throws Error if validation fails
   */
  private validateCodeResult(code: CodeResult): void {
    validateCodeResult(code);

    if (code.changes.length > this.maxChanges) {
      throw new Error(
        `Code changes exceed maxChanges limit of ${this.maxChanges}, got ${code.changes.length}`
      );
    }

    if (this.allowedPaths && this.allowedPaths.length > 0) {
      for (const change of code.changes) {
        const isAllowed = this.allowedPaths.some((allowedPath) =>
          change.path.startsWith(allowedPath)
        );
        if (!isAllowed) {
          throw new Error(
            `Path "${change.path}" is not in allowed paths: ${this.allowedPaths.join(
              ", "
            )}`
          );
        }
      }
    }
  }
}
