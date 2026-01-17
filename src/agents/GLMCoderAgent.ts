import { GLMBaseAgent } from "./GLMBaseAgent.js";
import type { AgentConfig } from "../types/agent.js";
import type { CodeResult, FileChange } from "../types/code.js";
import { validateCodeResult } from "../types/code.js";
import type { Id } from "../../convex/_generated/dataModel.js";

/**
 * Configuration options specific to GLMCoderAgent.
 *
 * @property maxChanges - Maximum number of file changes to generate (default: 10)
 * @property allowedPaths - Optional array of allowed file paths (restricts where agent can write)
 */
export interface GLMCoderConfig extends AgentConfig {
  maxChanges?: number;
  allowedPaths?: string[];
}

/**
 * GLMCoderAgent specializes in code implementation and file operations using GLM-4.7.
 *
 * This agent extends GLMBaseAgent to implement code changes based on plan steps,
 * producing structured file modification instructions with change tracking.
 *
 * Key features:
 * - Code implementation from plan descriptions
 * - Structured file change operations (create, update, delete)
 * - Path restriction for safety
 * - Change limit control
 * - Integration with Convex workflows
 * - Powered by Z.AI's GLM-4.7 model with thinking mode
 *
 * Example usage:
 * ```typescript
 * const coder = new GLMCoderAgent({ agentType: "glm-coder" });
 * const result = await coder.executeCode("Create a user model with email and password fields");
 * console.log(result.changes); // Array of FileChange objects
 * ```
 */
export class GLMCoderAgent extends GLMBaseAgent {
  protected readonly maxChanges: number;
  protected readonly allowedPaths?: string[];

  /**
   * Creates a new GLMCoderAgent instance.
   *
   * @param config - Agent configuration with optional coder-specific settings
   * @throws Error if ZAI_API_KEY is not set
   */
  constructor(config: GLMCoderConfig) {
    super({
      agentType: config.agentType || "glm-coder",
      model: config.model,
      workflowId: config.workflowId,
    });
    this.maxChanges = config.maxChanges || 10;
    this.allowedPaths = config.allowedPaths;
  }

  /**
   * Returns the coding-focused system prompt.
   *
   * The prompt instructs GLM-4.7 to:
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
- Return valid JSON only (no markdown formatting, no explanations outside JSON)
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

Remember: Output ONLY valid JSON, nothing else.

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
   * This method wraps GLMBaseAgent.execute() to parse and validate
   * the JSON response from GLM-4.7, returning a typed CodeResult.
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
    const agentWithWorkflow = new GLMCoderAgent({
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
   * Parses raw response string into CodeResult.
   *
   * Handles JSON extraction from response that may contain
   * markdown code blocks or extra text.
   *
   * Also handles common LLM JSON issues like:
   * - Unescaped newlines in string values (especially in code content)
   * - Unescaped quotes in strings
   * - Trailing commas
   *
   * @param rawResponse - Raw string response from GLM-4.7
   * @returns Parsed CodeResult object
   * @throws Error if JSON cannot be parsed
   */
  private parseCodeResult(rawResponse: string): CodeResult {
    const parseAttempts: Array<{name: string, attempt: () => CodeResult}> = [
      {
        name: 'Direct parse',
        attempt: () => JSON.parse(rawResponse)
      },
      {
        name: 'Markdown code block',
        attempt: () => {
          const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (!jsonMatch) throw new Error('No code block found');
          return JSON.parse(jsonMatch[1]);
        }
      },
      {
        name: 'First JSON object',
        attempt: () => {
          const objectMatch = rawResponse.match(/\{[\s\S]*\}/);
          if (!objectMatch) throw new Error('No JSON object found');
          return JSON.parse(objectMatch[0]);
        }
      },
      {
        name: 'Sanitized JSON (handle unescaped newlines)',
        attempt: () => this.parseWithSanitization(rawResponse)
      }
    ];

    for (const {name, attempt} of parseAttempts) {
      try {
        const result = attempt();
        console.log(`[GLMCoderAgent] Parsed JSON using: ${name}`);
        return result;
      } catch (e) {
        console.log(`[GLMCoderAgent] ${name} failed: ${(e as Error).message}`);
        // Try next method
      }
    }

    // Log raw response for debugging (show first 500 chars)
    console.error('[GLMCoderAgent] Raw response preview:');
    console.error(rawResponse.slice(0, 500));
    if (rawResponse.length > 500) {
      console.error('... (truncated)');
    }

    throw new Error(
      `Could not extract valid JSON from response after ${parseAttempts.length} attempts. ` +
      `Check console output for raw response preview.`
    );
  }

  /**
   * Attempts to parse JSON by sanitizing common LLM output issues.
   *
   * This handles:
   * - Unescaped newlines within string values (common in code content)
   * - Unescaped quotes in strings
   * - Trailing commas
   *
   * @param rawResponse - Raw response string
   * @returns Parsed CodeResult
   * @throws Error if parsing fails
   */
  private parseWithSanitization(rawResponse: string): CodeResult {
    // Extract JSON from code block if present
    let jsonStr = rawResponse;

    const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      // Try to find first JSON object
      const objectMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }
    }

    // Remove trailing commas before closing brackets/braces
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

    // Remove JSON-style comments
    jsonStr = jsonStr.replace(/\/\/.*$/gm, '');
    jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '');

    // Try parsing with a more lenient approach
    // The issue is usually unescaped newlines/quotes in "content" fields
    try {
      return JSON.parse(jsonStr);
    } catch {
      // If still failing, try to fix the content field specifically
      return this.fixContentFields(jsonStr);
    }
  }

  /**
   * Fixes common issues in the "content" field of JSON.
   *
   * GLM often returns JSON where the content field contains unescaped
   * code with newlines and quotes. This method attempts to fix that.
   *
   * @param jsonStr - JSON string that failed to parse
   * @returns Parsed CodeResult
   * @throws Error if parsing fails
   */
  private fixContentFields(jsonStr: string): CodeResult {
    // The problem: GLM returns JSON like:
    // "content": "export function foo() {
    //   return true;
    // }"
    //
    // Where the content has unescaped newlines and quotes.
    // The regex won't match because the " in the code breaks it.
    //
    // Solution: Use a state machine to parse character-by-character
    // and fix content fields specifically.

    return this.parseAndFixContent(jsonStr);
  }

  /**
   * State machine to parse and fix content fields in malformed JSON.
   *
   * This handles the specific case where GLM returns content with
   * unescaped newlines and quotes by using a character-by-character
   * parser that tracks JSON structure.
   */
  private parseAndFixContent(jsonStr: string): CodeResult {
    const result: string[] = [];
    let i = 0;

    const parseValue = (): string => {
      if (jsonStr[i] === '"') {
        // String value
        let value = '"';
        i++; // skip opening quote

        while (i < jsonStr.length) {
          const ch = jsonStr[i];

          if (ch === '\\' && i + 1 < jsonStr.length) {
            // Already escaped - keep as is
            value += ch + jsonStr[i + 1];
            i += 2;
          } else if (ch === '"') {
            // Closing quote - but check if this is actually the end
            // or an unescaped quote inside content
            const nextClosingQuote = jsonStr.indexOf('"', i + 1);
            const nextComma = jsonStr.indexOf(',', i + 1);
            const nextBrace = jsonStr.indexOf('}', i + 1);

            // If we're in a content field and there's questionable content ahead,
            // we might be dealing with an unescaped string
            // For now, let's assume this quote ends the string
            value += ch;
            i++;
            break;
          } else if (ch === '\n' || ch === '\r' || ch === '\t') {
            // Unescaped control character - escape it
            if (ch === '\n') value += '\\n';
            else if (ch === '\r') value += '\\r';
            else if (ch === '\t') value += '\\t';
            i++;
          } else {
            value += ch;
            i++;
          }
        }

        return value;
      } else if (jsonStr[i] === '{') {
        // Object
        let value = '{';
        i++; // skip opening brace
        let depth = 1;

        while (i < jsonStr.length && depth > 0) {
          if (jsonStr[i] === '{') depth++;
          else if (jsonStr[i] === '}') depth--;

          value += jsonStr[i];
          i++;
        }

        return value;
      } else if (jsonStr[i] === '[') {
        // Array
        let value = '[';
        i++; // skip opening bracket
        let depth = 1;

        while (i < jsonStr.length && depth > 0) {
          if (jsonStr[i] === '[') depth++;
          else if (jsonStr[i] === ']') depth--;

          value += jsonStr[i];
          i++;
        }

        return value;
      } else {
        // Number, boolean, or null
        let value = '';
        while (i < jsonStr.length && jsonStr[i] !== ',' && jsonStr[i] !== '}' && jsonStr[i] !== ']') {
          value += jsonStr[i];
          i++;
        }
        return value;
      }
    };

    // Parse the JSON character by character, looking for content fields
    while (i < jsonStr.length) {
      // Check if we're at a "content" key
      if (jsonStr.slice(i, i + 10) === '"content"' && (i === 0 || /\s*,\s*/.test(jsonStr.slice(Math.max(0, i - 3), i)))) {
        // Found "content" key
        result.push('"content"');
        i += 8;

        // Skip whitespace
        while (i < jsonStr.length && /\s/.test(jsonStr[i])) i++;

        // Skip colon
        if (i < jsonStr.length && jsonStr[i] === ':') {
          result.push(':');
          i++;

          // Skip whitespace
          while (i < jsonStr.length && /\s/.test(jsonStr[i])) i++;

          // Now we should be at the string value
          if (i < jsonStr.length && jsonStr[i] === '"') {
            // Extract the entire content string, including any unescaped stuff
            let content = '';
            i++; // skip opening quote

            while (i < jsonStr.length) {
              const ch = jsonStr[i];

              if (ch === '\\' && i + 1 < jsonStr.length) {
                // Already escaped
                content += ch + jsonStr[i + 1];
                i += 2;
              } else if (ch === '\n') {
                content += '\\n';
                i++;
              } else if (ch === '\r') {
                content += '\\r';
                i++;
              } else if (ch === '\t') {
                content += '\\t';
                i++;
              } else if (ch === '"') {
                // Check if this is the real closing quote by looking ahead
                const ahead = jsonStr.slice(i + 1).trim();

                // If next non-whitespace is comma, closing brace, or closing bracket, this is the end
                if (ahead.startsWith(',') || ahead.startsWith('}') || ahead.startsWith(']')) {
                  i++; // skip closing quote
                  break;
                }

                // Otherwise, this is an unescaped quote in the content
                content += '\\"';
                i++;
              } else {
                content += ch;
                i++;
              }
            }

            result.push('"');
            result.push(content);
            result.push('"');
            continue;
          }
        }
      }

      result.push(jsonStr[i]);
      i++;
    }

    const fixedJson = result.join('');
    return JSON.parse(fixedJson);
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

    // Additional GLMCoderAgent-specific validation
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
