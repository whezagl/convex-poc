import { GLMBaseAgent } from "./GLMBaseAgent.js";
import type { AgentConfig } from "../types/agent.js";
import type { ReviewResult, ReviewIssue } from "../types/review.js";
import { validateReviewResult } from "../types/review.js";
import type { Id } from "../../convex/_generated/dataModel.js";

/**
 * Configuration options specific to GLMReviewerAgent.
 *
 * @property maxIssues - Maximum number of issues to report (default: 20)
 * @property severity - Minimum severity level to report (default: undefined = all)
 */
export interface GLMReviewerConfig extends AgentConfig {
  maxIssues?: number;
  severity?: "error" | "warning" | "info";
}

/**
 * GLMReviewerAgent specializes in code validation and review using GLM-4.7.
 *
 * This agent extends GLMBaseAgent to review implementations and code changes,
 * producing structured feedback with issue tracking and approval status.
 *
 * Key features:
 * - Code review with severity-based issue tracking
 * - Structured feedback with actionable suggestions
 * - Overall approval status determination
 * - Issue limit control
 * - Integration with Convex workflows
 * - Powered by Z.AI's GLM-4.7 model with thinking mode
 *
 * Example usage:
 * ```typescript
 * const reviewer = new GLMReviewerAgent({ agentType: "glm-reviewer" });
 * const result = await reviewer.executeReview("Review this User model for security issues");
 * console.log(result.issues); // Array of ReviewIssue objects
 * ```
 */
export class GLMReviewerAgent extends GLMBaseAgent {
  protected readonly maxIssues: number;
  protected readonly severity?: "error" | "warning" | "info";

  /**
   * Creates a new GLMReviewerAgent instance.
   *
   * @param config - Agent configuration with optional reviewer-specific settings
   * @throws Error if ZAI_API_KEY is not set
   */
  constructor(config: GLMReviewerConfig) {
    super({
      agentType: config.agentType || "glm-reviewer",
      model: config.model,
      workflowId: config.workflowId,
    });
    this.maxIssues = config.maxIssues || 20;
    this.severity = config.severity;
  }

  /**
   * Returns the review-focused system prompt.
   *
   * The prompt instructs GLM-4.7 to:
   * - Review code for correctness, security, and best practices
   * - Output structured JSON with ReviewIssue arrays
   * - Provide actionable suggestions for each issue
   * - Determine overall approval status
   *
   * @returns The system prompt for code review
   */
  protected getSystemPrompt(): string {
    let severityGuidance = "";
    if (this.severity) {
      severityGuidance = `\nFocus on ${this.severity} and higher severity issues (ignore ${this.severity === "error" ? "warnings and info" : this.severity === "warning" ? "info" : "lower severity"}).`;
    }

    return `You are a Code Review Agent that validates implementations and identifies issues.

Your responsibilities:
1. Review the code for correctness, security, and best practices
2. Identify issues with appropriate severity levels
3. Provide clear, actionable suggestions for each issue
4. Output structured JSON matching ReviewResult interface
5. Determine overall approval status based on issues found${severityGuidance}

Severity levels:
- error: Blocking issues that must be fixed (security vulnerabilities, crashes, data loss)
- warning: Non-blocking issues that should be addressed (code quality, performance, maintainability)
- info: Observations and suggestions for improvement (style, minor optimizations)

Output format requirements:
- Return valid JSON only (no markdown formatting, no explanations outside JSON)
- Each issue should have a specific file location (file path and line number)
- Suggestions should be actionable and specific
- Keep issues between 0-${this.maxIssues} items
- Group related issues together when possible

JSON structure:
{
  "issues": [
    {
      "severity": "error",
      "file": "src/models/User.ts",
      "line": 15,
      "message": "Missing input validation on email field",
      "suggestion": "Add email format validation using a regex or validator library"
    },
    {
      "severity": "warning",
      "file": "src/api/auth.ts",
      "line": 42,
      "message": "Function lacks error handling",
      "suggestion": "Wrap in try-catch and return appropriate error response"
    }
  ],
  "summary": "Found 1 error and 1 warning that should be addressed",
  "overallStatus": "needs-changes",
  "filesReviewed": ["src/models/User.ts", "src/api/auth.ts"]
}

Overall status determination:
- approved: No issues, or only info-level issues
- needs-changes: Has warnings but no errors
- rejected: Has one or more errors

Remember: Output ONLY valid JSON, nothing else.

Best practices:
- Check for common security vulnerabilities (SQL injection, XSS, CSRF, etc.)
- Verify error handling and edge cases
- Check for proper TypeScript typing and null safety
- Review code clarity and maintainability
- Verify adherence to coding standards
- Check for performance issues (N+1 queries, missing indexes, etc.)
- Ensure proper input validation and output encoding`;
  }

  /**
   * Executes the reviewer and returns a structured ReviewResult.
   *
   * This method wraps GLMBaseAgent.execute() to parse and validate
   * the JSON response from GLM-4.7, returning a typed ReviewResult.
   *
   * @param input - The code or task to review
   * @returns Structured review with issues, summary, and approval status
   * @throws Error if JSON parsing fails or result is invalid
   */
  public async executeReview(input: string): Promise<ReviewResult> {
    // Call parent execute to get raw response
    const rawResponse = await super.execute(input);

    // Parse JSON from the response
    const review = this.parseReviewResult(rawResponse);

    // Validate the review structure
    this.validateReviewResult(review);

    return review;
  }

  /**
   * Executes the reviewer with Convex workflow integration.
   *
   * This method creates an association between the review session
   * and a Convex workflow for state tracking and persistence.
   *
   * @param input - The code or task to review
   * @param workflowId - The Convex workflow ID to associate with this session
   * @returns Structured review with issues, summary, and approval status
   */
  public async executeWithWorkflow(
    input: string,
    workflowId: Id<"workflows">
  ): Promise<ReviewResult> {
    // Update workflowId for this execution
    // Note: This creates a new instance with the workflowId
    const agentWithWorkflow = new GLMReviewerAgent({
      agentType: this.agentType,
      model: this.config.model,
      workflowId,
      maxIssues: this.maxIssues,
      severity: this.severity,
    });

    // Execute with workflow tracking
    return agentWithWorkflow.executeReview(input);
  }

  /**
   * Parses raw response string into ReviewResult.
   *
   * Handles JSON extraction from response that may contain
   * markdown code blocks or extra text.
   *
   * @param rawResponse - Raw string response from GLM-4.7
   * @returns Parsed ReviewResult object
   * @throws Error if JSON cannot be parsed
   */
  private parseReviewResult(rawResponse: string): ReviewResult {
    try {
      // Try to parse as-is first
      return JSON.parse(rawResponse);
    } catch (error) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e) {
          throw new Error(
            `Failed to parse JSON from code block: ${
              (e as Error).message
            }`
          );
        }
      }

      // Try to find first valid JSON object in response
      const objectMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch (e) {
          // Fall through to error
        }
      }

      throw new Error(
        `Could not extract valid JSON from response: ${rawResponse.slice(
          0,
          100
        )}...`
      );
    }
  }

  /**
   * Validates that the ReviewResult meets requirements.
   *
   * Ensures:
   * - Issues array exists and has 0-20 items
   * - Each issue has required fields (severity, file, line, message, suggestion)
   * - Severity is valid ('error', 'warning', 'info')
   * - No duplicate (file, line, message) triples
   * - Summary is non-empty
   * - overallStatus is valid
   * - filesReviewed contains unique paths
   *
   * @param review - The ReviewResult to validate
   * @throws Error if validation fails
   */
  private validateReviewResult(review: ReviewResult): void {
    // Use the imported validation function
    validateReviewResult(review);

    // Additional GLMReviewerAgent-specific validation
    if (review.issues.length > this.maxIssues) {
      throw new Error(
        `Review issues exceed maxIssues limit of ${this.maxIssues}, got ${review.issues.length}`
      );
    }

    // Filter by severity if configured
    if (this.severity) {
      const severityLevels = ["error", "warning", "info"];
      const minLevel = severityLevels.indexOf(this.severity);
      for (const issue of review.issues) {
        const issueLevel = severityLevels.indexOf(issue.severity);
        if (issueLevel > minLevel) {
          throw new Error(
            `Issue with severity "${issue.severity}" found but only "${this.severity}" and higher requested`
          );
        }
      }
    }
  }
}
