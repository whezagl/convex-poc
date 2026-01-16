/**
 * Type definitions for code review and validation.
 */

/**
 * A single issue found during code review.
 *
 * @property severity - Impact level: error (blocking), warning (non-blocking), info (observation)
 * @property file - File path where the issue was found
 * @property line - Line number where the issue occurs (0 for file-level issues)
 * @property message - Clear description of the issue
 * @property suggestion - Recommended fix or improvement
 */
export interface ReviewIssue {
  severity: "error" | "warning" | "info";
  file: string;
  line: number;
  message: string;
  suggestion: string;
}

/**
 * Result of code review by ReviewerAgent.
 *
 * Provides structured validation feedback with issue tracking
 * and overall approval status.
 *
 * @property issues - Array of 0-20 review issues found
 * @property summary - Human-readable summary of the review
 * @property overallStatus - Final decision: approved, needs-changes, or rejected
 * @property filesReviewed - Array of file paths that were reviewed
 */
export interface ReviewResult {
  issues: ReviewIssue[];
  summary: string;
  overallStatus: "approved" | "needs-changes" | "rejected";
  filesReviewed: string[];
}

/**
 * Validates that a ReviewResult meets requirements.
 *
 * Ensures:
 * - Issues array exists and has 0-20 items
 * - Each issue has required fields (severity, file, line, message, suggestion)
 * - Severity is valid ('error', 'warning', 'info')
 * - No duplicate (file, line, message) triples
 * - Summary is a non-empty string
 * - overallStatus is valid ('approved', 'needs-changes', 'rejected')
 * - filesReviewed contains unique file paths
 *
 * @param result - The ReviewResult to validate
 * @throws Error if validation fails
 */
export function validateReviewResult(result: ReviewResult): void {
  if (!result.issues || !Array.isArray(result.issues)) {
    throw new Error("ReviewResult must have an issues array");
  }

  if (result.issues.length < 0 || result.issues.length > 20) {
    throw new Error(
      `ReviewResult must have 0-20 issues, got ${result.issues.length}`
    );
  }

  const issueKeys = new Set<string>();

  for (let i = 0; i < result.issues.length; i++) {
    const issue: ReviewIssue = result.issues[i];

    if (!issue.file || typeof issue.file !== "string") {
      throw new Error(`Issue ${i} must have a file`);
    }

    if (issue.file.trim().length === 0) {
      throw new Error(`Issue ${i} file cannot be empty`);
    }

    if (typeof issue.line !== "number" || issue.line < 0) {
      throw new Error(`Issue ${i} must have a valid line number (>= 0)`);
    }

    if (!issue.message || typeof issue.message !== "string") {
      throw new Error(`Issue ${i} must have a message`);
    }

    if (issue.message.trim().length === 0) {
      throw new Error(`Issue ${i} message cannot be empty`);
    }

    if (!issue.suggestion || typeof issue.suggestion !== "string") {
      throw new Error(`Issue ${i} must have a suggestion`);
    }

    if (
      !issue.severity ||
      typeof issue.severity !== "string" ||
      !["error", "warning", "info"].includes(issue.severity)
    ) {
      throw new Error(
        `Issue ${i} must have valid severity: 'error', 'warning', or 'info'`
      );
    }

    // Check for duplicate (file, line, message) triples
    const issueKey = `${issue.file}:${issue.line}:${issue.message}`;
    if (issueKeys.has(issueKey)) {
      throw new Error(
        `Issue ${i} has duplicate (file, line, message): ${issueKey}`
      );
    }
    issueKeys.add(issueKey);
  }

  if (!result.summary || typeof result.summary !== "string") {
    throw new Error("ReviewResult must have a summary string");
  }

  if (result.summary.trim().length === 0) {
    throw new Error("Summary cannot be empty");
  }

  if (
    !result.overallStatus ||
    typeof result.overallStatus !== "string" ||
    !["approved", "needs-changes", "rejected"].includes(result.overallStatus)
  ) {
    throw new Error(
      "ReviewResult must have valid overallStatus: 'approved', 'needs-changes', or 'rejected'"
    );
  }

  if (!result.filesReviewed || !Array.isArray(result.filesReviewed)) {
    throw new Error("ReviewResult must have a filesReviewed array");
  }

  // Verify filesReviewed contains unique paths
  const uniqueFiles = new Set(result.filesReviewed);
  if (uniqueFiles.size !== result.filesReviewed.length) {
    throw new Error("filesReviewed array must contain unique file paths");
  }
}
