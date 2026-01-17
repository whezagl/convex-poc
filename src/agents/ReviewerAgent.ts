import { BaseAgent } from "./BaseAgent.js";
import type { AgentConfig } from "../types/agent.js";
import type { ReviewResult, ReviewIssue } from "../types/review.js";
import { validateReviewResult } from "../types/review.js";
import type { Id } from "../../convex/_generated/dataModel.js";
import { parseJson } from "../utils/parseJson.js";

/**
 * Configuration options specific to ReviewerAgent.
 *
 * @property maxIssues - Maximum number of issues to report (default: 20)
 * @property severity - Minimum severity level to report (default: undefined = all)
 */
export interface ReviewerConfig extends AgentConfig {
  maxIssues?: number;
  severity?: "error" | "warning" | "info";
}

/**
 * ReviewerAgent specializes in code validation and review.
 *
 * This agent extends BaseAgent to review implementations and code changes,
 * producing structured feedback with issue tracking and approval status.
 *
 * Key features:
 * - Code review with severity-based issue tracking
 * - Structured feedback with actionable suggestions
 * - Overall approval status determination
 * - Issue limit control
 * - Integration with Convex workflows
 *
 * Example usage:
 * ```typescript
 * const reviewer = new ReviewerAgent({ agentType: "reviewer" });
 * const result = await reviewer.executeReview("Review this User model for security issues");
 * console.log(result.issues); // Array of ReviewIssue objects
 * ```
 */
export class ReviewerAgent extends BaseAgent {
  protected readonly maxIssues: number;
  protected readonly severity?: "error" | "warning" | "info";

  /**
   * Creates a new ReviewerAgent instance.
   *
   * @param config - Agent configuration with optional reviewer-specific settings
   */
  constructor(config: ReviewerConfig) {
    super({
      agentType: config.agentType || "reviewer",
      model: config.model,
      workflowId: config.workflowId,
    });
    this.maxIssues = config.maxIssues || 20;
    this.severity = config.severity;
  }

  /**
   * Returns the review-focused system prompt.
   *
   * The prompt instructs Claude to:
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
- Return ONLY valid JSON wrapped in a markdown code block with the format \`\`\`json ... \`\`\`
- Do NOT include any explanations outside the code block
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

Example output format:
\`\`\`json
{
  "issues": [...],
  "summary": "...",
  "overallStatus": "...",
  "filesReviewed": [...]
}
\`\`\`

Overall status determination:
- approved: No issues, or only info-level issues
- needs-changes: Has warnings but no errors
- rejected: Has one or more errors

Remember: Output ONLY the JSON code block, nothing else.

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
   * This method wraps BaseAgent.execute() to parse and validate
   * the JSON response from Claude, returning a typed ReviewResult.
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
    const agentWithWorkflow = new ReviewerAgent({
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
   * Parses raw response string into ReviewResult using robust JSON parsing.
   *
   * Uses the parseJson utility which handles multiple fallback strategies
   * including fixing common escaping issues found in LLM responses.
   *
   * @param rawResponse - Raw string response from LLM
   * @returns Parsed ReviewResult object
   * @throws Error if JSON cannot be parsed after all strategies
   */
  private parseReviewResult(rawResponse: string): ReviewResult {
    return parseJson(rawResponse);
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

    // Additional ReviewerAgent-specific validation
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
