/**
 * Workflow artifact verification utility.
 *
 * This script validates and displays workflow execution artifacts
 * (plan.json, code.json, review.json) produced by the SequentialOrchestrator.
 *
 * Usage:
 *   npx tsx examples/verify-output.ts <workspace-path>
 *
 * Example:
 *   npx tsx examples/verify-output.ts ./workspace-email-validator
 *
 * The script will:
 * 1. Check that all required artifacts exist
 * 2. Validate JSON structure against expected types
 * 3. Display a summary of the workflow execution
 * 4. Show any issues found during review
 */

import { readFile, readdir } from "fs/promises";
import { join } from "path";
import type { PlanResult } from "../src/types/plan.js";
import type { CodeResult } from "../src/types/code.js";
import type { ReviewResult } from "../src/types/review.js";

/**
 * Result of artifact validation.
 */
interface ValidationResult {
  artifact: string;
  exists: boolean;
  valid: boolean;
  error?: string;
}

/**
 * Workflow summary containing data from all artifacts.
 */
interface WorkflowSummary {
  plan?: PlanResult;
  code?: CodeResult;
  review?: ReviewResult;
  stepsCompleted: number;
  filesCreated: number;
  reviewStatus?: string;
  issuesCount: number;
}

/**
 * Validates a single artifact file.
 *
 * @param workspace - Path to the workspace directory
 * @param filename - Name of the artifact file
 * @returns Validation result
 */
async function validateArtifact(
  workspace: string,
  filename: string
): Promise<ValidationResult> {
  const filePath = join(workspace, filename);

  try {
    const content = await readFile(filePath, "utf-8");

    // Try to parse JSON
    JSON.parse(content);

    return {
      artifact: filename,
      exists: true,
      valid: true,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        artifact: filename,
        exists: false,
        valid: false,
        error: "File not found",
      };
    }

    return {
      artifact: filename,
      exists: true,
      valid: false,
      error: String(error),
    };
  }
}

/**
 * Loads and parses the plan.json artifact.
 *
 * @param workspace - Path to the workspace directory
 * @returns Parsed PlanResult or undefined
 */
async function loadPlanArtifact(workspace: string): Promise<PlanResult | undefined> {
  try {
    const content = await readFile(join(workspace, "plan.json"), "utf-8");
    return JSON.parse(content) as PlanResult;
  } catch {
    return undefined;
  }
}

/**
 * Loads and parses the code.json artifact.
 *
 * @param workspace - Path to the workspace directory
 * @returns Parsed CodeResult or undefined
 */
async function loadCodeArtifact(workspace: string): Promise<CodeResult | undefined> {
  try {
    const content = await readFile(join(workspace, "code.json"), "utf-8");
    return JSON.parse(content) as CodeResult;
  } catch {
    return undefined;
  }
}

/**
 * Loads and parses the review.json artifact.
 *
 * @param workspace - Path to the workspace directory
 * @returns Parsed ReviewResult or undefined
 */
async function loadReviewArtifact(workspace: string): Promise<ReviewResult | undefined> {
  try {
    const content = await readFile(join(workspace, "review.json"), "utf-8");
    return JSON.parse(content) as ReviewResult;
  } catch {
    return undefined;
  }
}

/**
 * Displays a summary of the plan artifact.
 *
 * @param plan - PlanResult to display
 */
function displayPlanSummary(plan: PlanResult): void {
  console.log("\n┌─ Plan Artifact (plan.json)");
  console.log("│");
  console.log(`│  Steps defined: ${plan.steps.length}`);
  console.log("│");
  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];
    const deps = step.dependencies.length > 0
      ? `\n│     Depends on: ${step.dependencies.join(", ")}`
      : "";
    console.log(`│  ${i + 1}. ${step.description}`);
    console.log(`│     Agent: ${step.agent}${deps}`);
  }
  if (plan.estimatedDuration) {
    console.log("│");
    console.log(`│  Estimated duration: ${plan.estimatedDuration}`);
  }
  if (plan.risks && plan.risks.length > 0) {
    console.log("│");
    console.log("│  Risks identified:");
    for (const risk of plan.risks) {
      console.log(`│    - ${risk}`);
    }
  }
  console.log("│");
  console.log("└─────────────────────────────────────────────────────────────");
}

/**
 * Displays a summary of the code artifact.
 *
 * @param code - CodeResult to display
 */
function displayCodeSummary(code: CodeResult): void {
  console.log("\n┌─ Code Artifact (code.json)");
  console.log("│");
  console.log(`│  Changes made: ${code.changes.length}`);
  console.log("│");
  for (let i = 0; i < code.changes.length; i++) {
    const change = code.changes[i];
    const icon = change.operation === "create" ? "✨" : change.operation === "update" ? "📝" : "🗑️";
    console.log(`│  ${i + 1}. ${icon} ${change.path} (${change.operation})`);
  }
  console.log("│");
  console.log(`│  Summary: ${code.summary}`);
  console.log("│");
  console.log(`│  Files modified: ${code.filesModified.length}`);
  for (const file of code.filesModified) {
    console.log(`│    - ${file}`);
  }
  console.log("│");
  console.log("└─────────────────────────────────────────────────────────────");
}

/**
 * Displays a summary of the review artifact.
 *
 * @param review - ReviewResult to display
 */
function displayReviewSummary(review: ReviewResult): void {
  console.log("\n┌─ Review Artifact (review.json)");
  console.log("│");
  const statusIcon = review.overallStatus === "approved"
    ? "✅"
    : review.overallStatus === "needs-changes"
    ? "⚠️"
    : "❌";
  console.log(`│  Overall Status: ${statusIcon} ${review.overallStatus}`);
  console.log("│");
  console.log(`│  Issues found: ${review.issues.length}`);
  if (review.issues.length > 0) {
    console.log("│");
    for (let i = 0; i < review.issues.length; i++) {
      const issue = review.issues[i];
      const severityIcon = issue.severity === "error"
        ? "❌"
        : issue.severity === "warning"
        ? "⚠️"
        : "ℹ️";
      console.log(`│  ${i + 1}. ${severityIcon} ${issue.file}:${issue.line}`);
      console.log(`│     ${issue.message}`);
      console.log(`│     Suggestion: ${issue.suggestion}`);
    }
  } else {
    console.log("│  No issues found! 🎉");
  }
  console.log("│");
  console.log(`│  Files reviewed: ${review.filesReviewed.length}`);
  for (const file of review.filesReviewed) {
    console.log(`│    - ${file}`);
  }
  console.log("│");
  console.log(`│  Summary: ${review.summary}`);
  console.log("│");
  console.log("└─────────────────────────────────────────────────────────────");
}

/**
 * Displays overall workflow summary.
 *
 * @param summary - Workflow summary to display
 */
function displayWorkflowSummary(summary: WorkflowSummary): void {
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║  Workflow Summary                                        ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  console.log(`Steps planned: ${summary.plan?.steps.length ?? 0}`);
  console.log(`Files created/modified: ${summary.filesCreated}`);
  console.log(`Review status: ${summary.reviewStatus ?? "N/A"}`);
  console.log(`Issues found: ${summary.issuesCount}`);

  if (summary.reviewStatus === "approved" && summary.issuesCount === 0) {
    console.log("\n✅ Workflow completed successfully with no issues!");
  } else if (summary.reviewStatus === "needs-changes") {
    console.log("\n⚠️  Workflow completed but changes are recommended.");
  } else if (summary.reviewStatus === "rejected") {
    console.log("\n❌ Workflow failed review. Please address the issues above.");
  } else {
    console.log("\n⏳ Workflow incomplete or review not available.");
  }
}

/**
 * Main verification function.
 *
 * @param workspace - Path to the workspace directory
 */
async function verifyWorkspace(workspace: string): Promise<void> {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║  Workflow Artifact Verification                           ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  console.log(`Workspace: ${workspace}\n`);

  // Validate all artifacts
  console.log("Validating artifacts...");
  console.log("─────────────────────────────────────────────────────────────");

  const planValidation = await validateArtifact(workspace, "plan.json");
  const codeValidation = await validateArtifact(workspace, "code.json");
  const reviewValidation = await validateArtifact(workspace, "review.json");

  console.log(
    `${planValidation.exists ? "✓" : "✗"} plan.json ${planValidation.valid ? "(valid)" : planValidation.exists ? "(invalid)" : "(missing)"}`
  );
  console.log(
    `${codeValidation.exists ? "✓" : "✗"} code.json ${codeValidation.valid ? "(valid)" : codeValidation.exists ? "(invalid)" : "(missing)"}`
  );
  console.log(
    `${reviewValidation.exists ? "✓" : "✗"} review.json ${reviewValidation.valid ? "(valid)" : reviewValidation.exists ? "(invalid)" : "(missing)"}`
  );

  // Show validation errors if any
  const validationErrors = [
    planValidation.error,
    codeValidation.error,
    reviewValidation.error,
  ].filter(Boolean);

  if (validationErrors.length > 0) {
    console.log("\nValidation errors:");
    for (const error of validationErrors) {
      console.log(`  - ${error}`);
    }
    console.log();
  }

  // Load artifacts
  const plan = await loadPlanArtifact(workspace);
  const code = await loadCodeArtifact(workspace);
  const review = await loadReviewArtifact(workspace);

  // Display artifact summaries
  if (plan) {
    displayPlanSummary(plan);
  }

  if (code) {
    displayCodeSummary(code);
  }

  if (review) {
    displayReviewSummary(review);
  }

  // Build and display workflow summary
  const summary: WorkflowSummary = {
    plan,
    code,
    review,
    stepsCompleted: plan?.steps.length ?? 0,
    filesCreated: code?.changes.length ?? 0,
    reviewStatus: review?.overallStatus,
    issuesCount: review?.issues.length ?? 0,
  };

  displayWorkflowSummary(summary);

  // List all files in workspace
  try {
    const files = await readdir(workspace);
    console.log("\nAll files in workspace:");
    console.log("─────────────────────────────────────────────────────────────");
    for (const file of files) {
      console.log(`  - ${file}`);
    }
  } catch {
    console.log("\nUnable to list workspace files.");
  }

  console.log();
}

/**
 * CLI entry point.
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: npx tsx examples/verify-output.ts <workspace-path>");
    console.log("\nExample:");
    console.log("  npx tsx examples/verify-output.ts ./workspace-email-validator");
    process.exit(1);
  }

  const workspace = args[0];

  try {
    await verifyWorkspace(workspace);
  } catch (error) {
    console.error("\n✗ Verification failed:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  validateArtifact,
  loadPlanArtifact,
  loadCodeArtifact,
  loadReviewArtifact,
  verifyWorkspace,
};
