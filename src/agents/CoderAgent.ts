import { BaseAgent } from "./BaseAgent.js";
import type { AgentConfig } from "../types/agent.js";
import type { CodeResult, FileChange } from "../types/code.js";
import { validateCodeResult } from "../types/code.js";
import type { Id } from "../../convex/_generated/dataModel.js";
import { parseJson } from "../utils/parseJson.js";

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
   * @param input - The task description to implement
   * @returns Structured code changes with file operations and summary
   * @throws Error if JSON parsing fails or result is invalid
   */
  public async executeCode(input: string): Promise<CodeResult> {
    // Call parent execute to get raw response
    const rawResponse = await super.execute(input);

    // Parse JSON from the response
    const code = this.parseCodeResult(rawResponse);

    // Validate the code structure
    this.validateCodeResult(code);

    return code;
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
    // Update workflowId for this execution
    // Note: This creates a new instance with the workflowId
    const agentWithWorkflow = new CoderAgent({
      agentType: this.agentType,
      model: this.config.model,
      workflowId,
      maxChanges: this.maxChanges,
      allowedPaths: this.allowedPaths,
    });

    // Execute with workflow tracking
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
    // Use the imported validation function
    validateCodeResult(code);

    // Additional CoderAgent-specific validation
    if (code.changes.length > this.maxChanges) {
      throw new Error(
        `Code changes exceed maxChanges limit of ${this.maxChanges}, got ${code.changes.length}`
      );
    }

    // Validate path restrictions if configured
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
