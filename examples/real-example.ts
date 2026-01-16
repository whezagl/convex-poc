/**
 * Real-world demonstration of multi-agent workflow execution.
 *
 * This example demonstrates the full Planner → Coder → Reviewer pipeline
 * with a concrete, practical coding task.
 *
 * Task: Create a TypeScript utility function for validating email addresses
 *
 * Requirements:
 * - Function should return boolean (true for valid, false for invalid)
 * - Handle edge cases (empty, null, undefined, invalid format)
 * - Use regex pattern for email validation
 * - Include comprehensive error handling
 *
 * Expected workflow demonstration:
 * - Planning: Task decomposition into implementation steps
 * - Coding: Implementation of the email validation utility
 * - Reviewing: Validation and feedback on the implementation
 *
 * Prerequisites:
 * - ANTHROPIC_API_KEY environment variable must be set
 * - Convex backend should be running (optional, for tracking)
 *
 * To execute with real API calls:
 * 1. Set ANTHROPIC_API_KEY: export ANTHROPIC_API_KEY=your_key_here
 * 2. Uncomment the executeWorkflow() call in main()
 * 3. Run: npx tsx examples/real-example.ts
 */

import { SequentialOrchestrator } from "../src/orchestrator/index.js";
import type { ExecuteWorkflowConfig, WorkflowContext, WorkflowResult } from "../src/types/workflow.js";

/**
 * Demonstrates the full multi-agent workflow with a real coding task.
 *
 * This is the primary example showing:
 * 1. How to configure SequentialOrchestrator
 * 2. How to define a concrete task for agents to execute
 * 3. What the workflow produces (plan.json, code.json, review.json)
 * 4. How to inspect and verify workflow results
 */
async function demonstrateEmailValidationWorkflow() {
  console.log("=== Multi-Agent Workflow: Email Validation Utility ===\n");

  // Configure the orchestrator
  const config: ExecuteWorkflowConfig = {
    workspace: "./workspace-email-validator",
    continueOnError: false, // Stop on first error for strict validation
  };

  // Create orchestrator instance
  const orchestrator = new SequentialOrchestrator(config);

  // Define the concrete task for the agents
  const task = `Create a TypeScript utility function for validating email addresses with regex.

Requirements:
- Function name: validateEmail
- Input: email (string | null | undefined)
- Output: boolean (true for valid email, false otherwise)
- Handle edge cases:
  * null or undefined input → return false
  * empty string → return false
  * invalid format (no @, invalid domain) → return false
- Use a practical email regex pattern (not overly strict, but catches common errors)
- Include JSDoc documentation
- Include basic unit tests

Location: Create the function in src/utils/emailValidator.ts

Export the function so it can be imported by other modules.`;

  const context: WorkflowContext = {
    task,
    workspace: config.workspace,
    // workflowId: optional - add if you have Convex backend running
  };

  console.log("Task Definition:");
  console.log("─────────────────────────────────────────────────────────────");
  console.log(task);
  console.log("─────────────────────────────────────────────────────────────\n");

  console.log("Configuration:");
  console.log(`  Workspace: ${context.workspace}`);
  console.log(`  Continue on error: ${config.continueOnError}`);
  console.log(`  Convex tracking: ${context.workflowId ? "enabled" : "disabled"}\n`);

  // ============================================
  // ⚠️  IMPORTANT: Uncomment to execute
  // ============================================
  //
  // The workflow is commented out to prevent accidental API calls.
  // To execute:
  // 1. Set ANTHROPIC_API_KEY environment variable
  // 2. Uncomment the lines below
  // 3. Run: npx tsx examples/real-example.ts
  //
  // ============================================

  console.log("Workflow Execution (SIMULATED - not actually calling APIs)\n");

  console.log("Expected Workflow Steps:");
  console.log("─────────────────────────────────────────────────────────────");

  // Step 1: Planning
  console.log("\n[Step 1/3] Planning (PlannerAgent)");
  console.log("  → Analyzes task and decomposes into steps");
  console.log("  → Expected output:");
  console.log("    - Step 1: Create directory structure (src/utils/)");
  console.log("    - Step 2: Implement validateEmail function with regex");
  console.log("    - Step 3: Add JSDoc documentation");
  console.log("    - Step 4: Create unit tests for edge cases");
  console.log("  → Artifact: workspace-email-validator/plan.json");

  // Step 2: Coding
  console.log("\n[Step 2/3] Coding (CoderAgent)");
  console.log("  → Reads plan.json and implements the code");
  console.log("  → Expected output:");
  console.log("    - src/utils/emailValidator.ts (created)");
  console.log("    - src/utils/emailValidator.test.ts (created)");
  console.log("  → Artifact: workspace-email-validator/code.json");

  // Step 3: Reviewing
  console.log("\n[Step 3/3] Reviewing (ReviewerAgent)");
  console.log("  → Reads plan.json and code.json");
  console.log("  → Validates implementation against requirements");
  console.log("  → Expected output:");
  console.log("    - Issues found (if any)");
  console.log("    - Overall status (approved/needs-changes/rejected)");
  console.log("  → Artifact: workspace-email-validator/review.json");

  console.log("\n─────────────────────────────────────────────────────────────\n");

  // UNCOMMENT BELOW TO EXECUTE FOR REAL:
  /*
  try {
    console.log("Starting workflow execution...\n");

    const result: WorkflowResult = await orchestrator.executeWorkflow(context);

    // Display results
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("Workflow Complete");
    console.log("═══════════════════════════════════════════════════════════\n");

    console.log(`Success: ${result.success ? "✓ YES" : "✗ NO"}`);
    console.log(`Steps completed: ${result.steps.filter(s => s.status === 'completed').length}/${result.steps.length}`);
    console.log(`Artifacts created: ${result.artifacts.length}\n`);

    // Display step details
    console.log("Step Details:");
    console.log("─────────────────────────────────────────────────────────────");
    for (const step of result.steps) {
      const status = step.status === "completed" ? "✓" : step.status === "failed" ? "✗" : "○";
      const timing = step.endTime ? `${step.endTime - step.startTime}ms` : "N/A";

      console.log(`\n${status} ${step.name} (${timing})`);
      console.log(`  Agent: ${step.agent}`);
      console.log(`  Status: ${step.status}`);

      if (step.error) {
        console.log(`  Error: ${step.error}`);
      }

      if (step.output) {
        const preview = step.output.slice(0, 100);
        console.log(`  Output: ${preview}${step.output.length > 100 ? "..." : ""}`);
      }
    }

    // Display final review
    if (result.finalReview) {
      console.log("\n─────────────────────────────────────────────────────────────");
      console.log("Final Review:");
      console.log("─────────────────────────────────────────────────────────────");
      console.log(`Overall Status: ${result.finalReview.overallStatus}`);
      console.log(`Issues Found: ${result.finalReview.issues.length}`);
      console.log(`Files Reviewed: ${result.finalReview.filesReviewed.length}`);
      console.log(`\nSummary: ${result.finalReview.summary}`);

      if (result.finalReview.issues.length > 0) {
        console.log("\nIssues:");
        for (const issue of result.finalReview.issues) {
          const severityIcon = issue.severity === "error" ? "✗" : issue.severity === "warning" ? "⚠" : "ℹ";
          console.log(`\n  ${severityIcon} ${issue.file}:${issue.line}`);
          console.log(`    ${issue.message}`);
          console.log(`    Suggestion: ${issue.suggestion}`);
        }
      }
    }

    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("Artifacts saved to workspace:");
    console.log("  - workspace-email-validator/plan.json");
    console.log("  - workspace-email-validator/code.json");
    console.log("  - workspace-email-validator/review.json");
    console.log("═══════════════════════════════════════════════════════════\n");

    if (result.success) {
      console.log("✓ Workflow completed successfully!");
      console.log("  You can now inspect the artifacts in the workspace directory.");
      console.log("  Use: npx tsx examples/verify-output.ts ./workspace-email-validator");
    } else {
      console.log("✗ Workflow failed");
      console.log("  Check the artifacts above for details on what went wrong.");
      console.log("  You can still inspect plan.json, code.json, review.json to debug.");
    }

  } catch (error) {
    console.error("\n✗ Workflow execution error:", error);
    console.error("\nTroubleshooting:");
    console.error("  1. Check that ANTHROPIC_API_KEY is set: echo $ANTHROPIC_API_KEY");
    console.error("  2. Verify the key is valid and has API credits");
    console.error("  3. Check network connectivity");
    console.error("  4. Ensure workspace directory is writable");
  }
  */

  console.log("⚠️  To execute for real:");
  console.log("    1. Set ANTHROPIC_API_KEY environment variable");
  console.log("    2. Uncomment the executeWorkflow() call above");
  console.log("    3. Run: npx tsx examples/real-example.ts\n");
}

/**
 * Demonstrates what a successful workflow produces.
 *
 * This shows the expected structure of artifacts without making
 * actual API calls. Useful for understanding the workflow flow.
 */
async function showExpectedArtifacts() {
  console.log("\n=== Expected Artifacts Structure ===\n");

  console.log("After successful execution, the workspace will contain:\n");

  console.log("1. plan.json (PlannerAgent output)");
  console.log("   {");
  console.log('     "steps": [');
  console.log('       {');
  console.log('         "description": "Create src/utils directory structure",');
  console.log('         "agent": "coder",');
  console.log('         "dependencies": []');
  console.log('       },');
  console.log('       {');
  console.log('         "description": "Implement validateEmail function with regex",');
  console.log('         "agent": "coder",');
  console.log('         "dependencies": ["Create src/utils directory structure"]');
  console.log('       },');
  console.log('       {');
  console.log('         "description": "Add comprehensive JSDoc documentation",');
  console.log('         "agent": "coder",');
  console.log('         "dependencies": ["Implement validateEmail function with regex"]');
  console.log('       },');
  console.log('       {');
  console.log('         "description": "Create unit tests for edge cases",');
  console.log('         "agent": "coder",');
  console.log('         "dependencies": ["Implement validateEmail function with regex"]');
  console.log('       }');
  console.log('     ],');
  console.log('     "estimatedDuration": "30-45 minutes"');
  console.log('   }\n');

  console.log("2. code.json (CoderAgent output)");
  console.log("   {");
  console.log('     "changes": [');
  console.log('       {');
  console.log('         "path": "src/utils/emailValidator.ts",');
  console.log('         "operation": "create",');
  console.log('         "content": "..."');
  console.log('       },');
  console.log('       {');
  console.log('         "path": "src/utils/emailValidator.test.ts",');
  console.log('         "operation": "create",');
  console.log('         "content": "..."');
  console.log('       }');
  console.log('     ],');
  console.log('     "summary": "Created validateEmail utility function with regex pattern and comprehensive edge case handling. Includes JSDoc documentation and unit tests.",');
  console.log('     "filesModified": ["src/utils/emailValidator.ts", "src/utils/emailValidator.test.ts"]');
  console.log('   }\n');

  console.log("3. review.json (ReviewerAgent output)");
  console.log("   {");
  console.log('     "issues": [],');
  console.log('     "summary": "Email validation utility meets all requirements. Regex pattern is practical and handles common edge cases correctly. Tests cover null, undefined, empty string, and invalid formats.",');
  console.log('     "overallStatus": "approved",');
  console.log('     "filesReviewed": ["src/utils/emailValidator.ts", "src/utils/emailValidator.test.ts"]');
  console.log('   }\n');

  console.log("═══════════════════════════════════════════════════════════");
  console.log("Expected Generated Code (src/utils/emailValidator.ts)");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`
/**
 * Validates an email address using regex pattern.
 *
 * @param email - The email address to validate (can be null/undefined)
 * @returns true if email is valid, false otherwise
 *
 * @example
 * validateEmail("user@example.com") // true
 * validateEmail("invalid-email")    // false
 * validateEmail(null)               // false
 */
export function validateEmail(email: string | null | undefined): boolean {
  // Handle edge cases
  if (email === null || email === undefined) {
    return false;
  }

  if (email.trim() === "") {
    return false;
  }

  // Practical email regex (catches common errors without being overly strict)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;

  return emailRegex.test(email);
}
`);

  console.log("═══════════════════════════════════════════════════════════");
  console.log("Expected Tests (src/utils/emailValidator.test.ts)");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`
import { validateEmail } from "./emailValidator";

describe("validateEmail", () => {
  test("returns false for null", () => {
    expect(validateEmail(null)).toBe(false);
  });

  test("returns false for undefined", () => {
    expect(validateEmail(undefined)).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(validateEmail("")).toBe(false);
  });

  test("returns false for invalid email (no @)", () => {
    expect(validateEmail("invalidemail")).toBe(false);
  });

  test("returns false for invalid email (no domain)", () => {
    expect(validateEmail("user@")).toBe(false);
  });

  test("returns true for valid email", () => {
    expect(validateEmail("user@example.com")).toBe(true);
  });

  test("returns true for email with subdomain", () => {
    expect(validateEmail("user@mail.example.com")).toBe(true);
  });

  test("returns true for email with plus sign", () => {
    expect(validateEmail("user+tag@example.com")).toBe(true);
  });
});
`);
}

/**
 * Main entry point.
 */
async function main() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║  Multi-Agent Workflow: Real-World Demonstration           ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  await demonstrateEmailValidationWorkflow();
  await showExpectedArtifacts();

  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║  Next Steps                                               ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");
  console.log("1. Set up API credentials:");
  console.log("   export ANTHROPIC_API_KEY=your_key_here\n");
  console.log("2. Uncomment the executeWorkflow() call in demonstrateEmailValidationWorkflow()");
  console.log("3. Run the example:");
  console.log("   npx tsx examples/real-example.ts\n");
  console.log("4. Verify the artifacts:");
  console.log("   npx tsx examples/verify-output.ts ./workspace-email-validator\n");
  console.log("5. Inspect generated files in workspace-email-validator/\n");
  console.log("For more information, see examples/README.md\n");
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  demonstrateEmailValidationWorkflow,
  showExpectedArtifacts,
};
