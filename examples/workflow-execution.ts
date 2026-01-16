/**
 * Workflow execution example for SequentialOrchestrator.
 *
 * This example demonstrates how to:
 * 1. Create a SequentialOrchestrator instance
 * 2. Configure workspace and error handling
 * 3. Execute a multi-agent workflow (Planner → Coder → Reviewer)
 * 4. Handle results and errors
 * 5. Use continueOnError for resilient workflows
 *
 * Note: This example requires a running Convex backend and valid
 * Anthropic API credentials to execute fully.
 */

import { SequentialOrchestrator } from "../src/orchestrator/index.js";
import type { ExecuteWorkflowConfig, WorkflowContext, WorkflowResult } from "../src/types/workflow.js";

/**
 * Example 1: Basic workflow execution with default settings.
 *
 * This demonstrates the simplest workflow execution:
 * - Workspace is set to ./workspace
 * - continueOnError defaults to false (workflow stops on first error)
 * - No Convex workflow tracking
 */
async function basicWorkflowExecution() {
  console.log("=== Example 1: Basic Workflow Execution ===\n");

  // Configure the orchestrator
  const config: ExecuteWorkflowConfig = {
    workspace: "./workspace",
  };

  // Create orchestrator instance
  const orchestrator = new SequentialOrchestrator(config);

  // Define the workflow context
  const context: WorkflowContext = {
    task: "Create a User model with authentication",
    workspace: "./workspace",
  };

  try {
    console.log(`Task: ${context.task}`);
    console.log(`Workspace: ${context.workspace}\n`);

    // Execute the workflow
    // Note: This will make real API calls to Claude
    // const result = await orchestrator.executeWorkflow(context);

    console.log("(Skipped actual execution - requires API credentials)");
    console.log("\nExpected workflow flow:");
    console.log("1. PlannerAgent breaks down task into steps");
    console.log("2. CoderAgent implements the User model");
    console.log("3. ReviewerAgent validates the implementation");
    console.log("\nArtifacts created:");
    console.log("- workspace/plan.json (planner output)");
    console.log("- workspace/code.json (coder output)");
    console.log("- workspace/review.json (reviewer output)");

    /*
    // Handle the result
    if (result.success) {
      console.log("\n✓ Workflow completed successfully!");
      console.log(`Steps executed: ${result.steps.length}`);
      console.log(`Artifacts created: ${result.artifacts.length}`);

      // Display final review if available
      if (result.finalReview) {
        console.log(`\nOverall Status: ${result.finalReview.overallStatus}`);
        console.log(`Issues found: ${result.finalReview.issues.length}`);
      }
    } else {
      console.log("\n✗ Workflow failed");
      console.log(`Completed steps: ${result.steps.filter(s => s.status === 'completed').length}`);
      console.log(`Failed steps: ${result.steps.filter(s => s.status === 'failed').length}`);
    }
    */

  } catch (error) {
    console.error("\nWorkflow execution error:", error);
    console.error("\nTroubleshooting:");
    console.error("- Check Anthropic API credentials are set");
    console.error("- Verify Convex backend is running");
    console.error("- Ensure workspace directory is writable");
  }
}

/**
 * Example 2: Workflow with continueOnError enabled.
 *
 * This demonstrates resilient workflow execution:
 * - continueOnError: true allows workflow to continue after non-fatal errors
 * - Reviewer will run even if Coder fails
 * - Useful for getting partial results or feedback
 */
async function resilientWorkflowExecution() {
  console.log("\n=== Example 2: Resilient Workflow (continueOnError=true) ===\n");

  // Configure with continueOnError enabled
  const config: ExecuteWorkflowConfig = {
    workspace: "./workspace-resilient",
    continueOnError: true,
  };

  const orchestrator = new SequentialOrchestrator(config);

  const context: WorkflowContext = {
    task: "Implement a REST API endpoint for user authentication",
    workspace: "./workspace-resilient",
  };

  console.log(`Task: ${context.task}`);
  console.log(`Workspace: ${context.workspace}`);
  console.log(`Continue on error: ${config.continueOnError}\n`);

  console.log("With continueOnError=true:");
  console.log("- If Planner fails, workflow stops (no plan to execute)");
  console.log("- If Coder fails, Reviewer still runs (reviews partial implementation)");
  console.log("- Workflow succeeds if Reviewer completes, even if Coder failed");
  console.log("\nUse case: Get feedback on partial work or debug failures");

  /*
  try {
    const result = await orchestrator.executeWorkflow(context);

    if (result.success) {
      console.log("\n✓ Workflow completed");
    } else {
      console.log("\n✗ Workflow failed (reviewer did not complete)");
    }

    // Show step results
    for (const step of result.steps) {
      const status = step.status === "completed" ? "✓" : "✗";
      const timing = step.endTime ? `${step.endTime - step.startTime}ms` : "N/A";
      console.log(`${status} ${step.name}: ${timing}`);

      if (step.error) {
        console.log(`  Error: ${step.error}`);
      }
    }
  } catch (error) {
    console.error("\nWorkflow execution error:", error);
  }
  */
}

/**
 * Example 3: Workflow with Convex integration.
 *
 * This demonstrates workflow tracking with Convex:
 * - workflowId associates the execution with a Convex workflow document
 * - Sessions are tracked for each agent execution
 * - Workflow status is updated on completion
 */
async function workflowWithConvexTracking() {
  console.log("\n=== Example 3: Workflow with Convex Tracking ===\n");

  const config: ExecuteWorkflowConfig = {
    workspace: "./workspace-convex",
    continueOnError: false,
  };

  const orchestrator = new SequentialOrchestrator(config);

  // In a real application, workflowId would come from Convex
  // For this example, we'll use a placeholder
  const mockWorkflowId = "mock-workflow-id" as any;

  const context: WorkflowContext = {
    task: "Create a database migration for users table",
    workspace: "./workspace-convex",
    workflowId: mockWorkflowId,
  };

  console.log(`Task: ${context.task}`);
  console.log(`Workspace: ${context.workspace}`);
  console.log(`Workflow ID: ${mockWorkflowId}\n`);

  console.log("Convex integration provides:");
  console.log("- Session tracking for each agent execution");
  console.log("- Persistent workflow state across restarts");
  console.log("- Queryable workflow history");
  console.log("\nWorkflow document in Convex tracks:");
  console.log("- Overall status (pending/in_progress/completed/failed)");
  console.log("- Current step (planning/coding/review)");
  console.log("- Artifact references (plan.json, code.json, review.json)");

  /*
  try {
    const result = await orchestrator.executeWorkflow(context);

    console.log("\nWorkflow completed");
    console.log(`Status in Convex: ${result.success ? 'completed' : 'failed'}`);
    console.log(`Query workflow with ID: ${mockWorkflowId}`);
  } catch (error) {
    console.error("\nWorkflow execution error:", error);
  }
  */
}

/**
 * Example 4: Error handling patterns.
 *
 * This demonstrates common error handling scenarios:
 * - Catching and handling specific errors
 * - Providing user-friendly error messages
 * - Implementing retry logic
 */
async function errorHandlingExample() {
  console.log("\n=== Example 4: Error Handling Patterns ===\n");

  const config: ExecuteWorkflowConfig = {
    workspace: "./workspace-errors",
    continueOnError: false,
  };

  const orchestrator = new SequentialOrchestrator(config);

  const context: WorkflowContext = {
    task: "Create a unit test for User model",
    workspace: "./workspace-errors",
  };

  console.log("Common error scenarios:\n");

  console.log("1. API Authentication Error");
  console.log("   Error: 'Invalid API key'");
  console.log("   Fix: Check ANTHROPIC_API_KEY environment variable\n");

  console.log("2. Convex Connection Error");
  console.log("   Error: 'Failed to connect to Convex'");
  console.log("   Fix: Start Convex backend with 'npx convex dev'\n");

  console.log("3. Filesystem Permission Error");
  console.log("   Error: 'Permission denied'");
  console.log("   Fix: Check workspace directory permissions\n");

  console.log("4. Agent Execution Timeout");
  console.log("   Error: 'Request timeout'");
  console.log("   Fix: Break task into smaller steps or increase timeout\n");

  /*
  try {
    const result = await orchestrator.executeWorkflow(context);

    if (!result.success) {
      // Find the first failed step
      const failedStep = result.steps.find(s => s.status === "failed");

      if (failedStep) {
        console.log(`\nWorkflow failed at: ${failedStep.name}`);
        console.log(`Error: ${failedStep.error}`);

        // Provide specific guidance based on step
        switch (failedStep.agent) {
          case "planner":
            console.log("\nTroubleshooting planner:");
            console.log("- Task may be too vague or complex");
            console.log("- Try breaking into smaller, specific tasks");
            break;
          case "coder":
            console.log("\nTroubleshooting coder:");
            console.log("- Plan may be ambiguous or incomplete");
            console.log("- Check plan.json for issues");
            break;
          case "reviewer":
            console.log("\nTroubleshooting reviewer:");
            console.log("- Code output may be malformed");
            console.log("- Check code.json for syntax errors");
            break;
        }
      }
    }
  } catch (error) {
    // Handle unexpected errors
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        console.error("\nAuthentication error: Check your API credentials");
      } else if (error.message.includes("Convex")) {
        console.error("\nConvex error: Ensure backend is running");
      } else {
        console.error("\nUnexpected error:", error.message);
      }
    }
  }
  */
}

/**
 * Example 5: Inspecting workflow artifacts.
 *
 * This demonstrates how to inspect and use workflow artifacts:
 * - Reading plan.json to understand the decomposition
 * - Reading code.json to see what was generated
 * - Reading review.json to get feedback
 */
async function inspectArtifactsExample() {
  console.log("\n=== Example 5: Inspecting Workflow Artifacts ===\n");

  console.log("After workflow execution, artifacts are saved to workspace:\n");

  console.log("1. plan.json - Planner output");
  console.log('   {');
  console.log('     "steps": [');
  console.log('       { "description": "Create User model", "agent": "coder", "dependencies": [] },');
  console.log('       { "description": "Add validation", "agent": "coder", "dependencies": ["Create User model"] }');
  console.log('     ],');
  console.log('     "estimatedDuration": "2-3 hours"');
  console.log('   }\n');

  console.log("2. code.json - Coder output");
  console.log('   {');
  console.log('     "changes": [');
  console.log('       { "path": "src/models/User.ts", "content": "...", "operation": "create" }');
  console.log('     ],');
  console.log('     "summary": "Created User model with email and password fields"');
  console.log('   }\n');

  console.log("3. review.json - Reviewer output");
  console.log('   {');
  console.log('     "issues": [');
  console.log('       { "severity": "warning", "file": "src/models/User.ts", "line": 15, "message": "..." }');
  console.log('     ],');
  console.log('     "overallStatus": "needs-changes"');
  console.log('   }\n');

  console.log("Reading artifacts (example):");
  console.log(`
import { readFile } from 'fs/promises';
import { join } from 'path';

// Read plan
const planContent = await readFile(join('./workspace', 'plan.json'), 'utf-8');
const plan = JSON.parse(planContent);
console.log(\`Plan has \${plan.steps.length} steps\`);

// Read code
const codeContent = await readFile(join('./workspace', 'code.json'), 'utf-8');
const code = JSON.parse(codeContent);
console.log(\`Code has \${code.changes.length} file changes\`);

// Read review
const reviewContent = await readFile(join('./workspace', 'review.json'), 'utf-8');
const review = JSON.parse(reviewContent);
console.log(\`Review status: \${review.overallStatus}\`);
`);
}

/**
 * Run all examples.
 */
async function main() {
  console.log("SequentialOrchestrator - Workflow Execution Examples\n");
  console.log("=".repeat(60));

  await basicWorkflowExecution();
  await resilientWorkflowExecution();
  await workflowWithConvexTracking();
  await errorHandlingExample();
  await inspectArtifactsExample();

  console.log("\n" + "=".repeat(60));
  console.log("\nKey takeaways:");
  console.log("1. SequentialOrchestrator coordinates Planner→Coder→Reviewer workflow");
  console.log("2. Filesystem artifacts enable inspection and debugging");
  console.log("3. continueOnError provides resilient execution");
  console.log("4. Convex integration enables persistent workflow tracking");
  console.log("5. Error handling patterns ensure graceful degradation");
  console.log("\nNext steps:");
  console.log("- Set up ANTHROPIC_API_KEY environment variable");
  console.log("- Start Convex backend with 'npx convex dev'");
  console.log("- Run workflow with: node examples/workflow-execution.ts");
  console.log("- Inspect artifacts in workspace directory");
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  basicWorkflowExecution,
  resilientWorkflowExecution,
  workflowWithConvexTracking,
  errorHandlingExample,
  inspectArtifactsExample,
};
