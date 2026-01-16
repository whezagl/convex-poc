/**
 * Basic usage example for the Agent Framework.
 *
 * This example demonstrates how to:
 * 1. Create an agent instance
 * 2. Execute the agent with input
 * 3. Retrieve the session ID for tracking
 *
 * Note: This example requires a running Convex backend to fully function.
 * Currently, Convex integration is a placeholder (tracked in ISS-001).
 */

import { DummyAgent } from "../src/agents/index.js";
import type { AgentConfig } from "../src/types/agent.js";

/**
 * Example 1: Basic agent execution
 */
async function basicExecution() {
  console.log("=== Example 1: Basic Agent Execution ===\n");

  // Create agent configuration
  const config: AgentConfig = {
    agentType: "dummy",
    model: "sonnet", // Optional, defaults to "sonnet"
  };

  // Instantiate the agent
  const agent = new DummyAgent(config);

  // Execute the agent with input
  try {
    const input = "Hello, world!";
    console.log(`Input: ${input}`);
    console.log(`Agent type: ${config.agentType}`);
    console.log(`Model: ${config.model}\n`);

    // Note: This will make a real Claude API call
    // const result = await agent.execute(input);
    // console.log(`Result: ${result}`);

    // Get the session ID for tracking
    // const sessionId = agent.getSessionId();
    // console.log(`Session ID: ${sessionId}`);

    console.log("(Skipped actual execution - requires Convex backend deployment)");
  } catch (error) {
    console.error("Agent execution failed:", error);
  }
}

/**
 * Example 2: Agent with workflow association
 */
async function executionWithWorkflow() {
  console.log("\n=== Example 2: Agent with Workflow Association ===\n");

  // Mock workflow ID (in practice, this would come from Convex)
  const mockWorkflowId = "mock-workflow-id" as any;

  const config: AgentConfig = {
    agentType: "dummy",
    workflowId: mockWorkflowId,
  };

  const agent = new DummyAgent(config);

  console.log(`Agent type: ${config.agentType}`);
  console.log(`Workflow ID: ${mockWorkflowId}`);
  console.log(`Session ID: ${agent.getSessionId()}`); // Initially null

  console.log("\n(Session would be created in Convex on execution)");
  console.log("(Skipped actual execution - requires Convex backend deployment)");
}

/**
 * Example 3: Custom agent extending BaseAgent
 */
async function customAgentExample() {
  console.log("\n=== Example 3: Custom Agent ===\n");

  // Import BaseAgent
  const { BaseAgent } = await import("../src/agents/index.js");

  // Define a custom agent
  class CodeReviewer extends BaseAgent {
    protected getSystemPrompt(): string {
      return (
        "You are a code review expert. " +
        "Analyze the provided code for bugs, security issues, and best practices."
      );
    }
  }

  // Create and configure the custom agent
  const reviewer = new CodeReviewer({
    agentType: "reviewer",
    model: "sonnet",
  });

  console.log(`Custom agent type: reviewer`);
  console.log(`System prompt: ${(reviewer as any).getSystemPrompt().substring(0, 50)}...`);

  console.log("\n(Custom agent successfully extends BaseAgent)");
}

/**
 * Example 4: Error handling
 */
async function errorHandlingExample() {
  console.log("\n=== Example 4: Error Handling ===\n");

  const config: AgentConfig = {
    agentType: "dummy",
  };

  const agent = new DummyAgent(config);

  console.log("Agent framework handles errors at two levels:");
  console.log("1. Hook Level: Convex errors don't crash the agent");
  console.log("2. Execution Level: Claude SDK errors are rethrown to caller");

  console.log("\nExample error handling:");
  console.log(`
try {
  const result = await agent.execute("Help me");
} catch (error) {
  console.error("Agent execution failed:", error);
  // Handle Claude SDK errors here
}
  `);
}

/**
 * Run all examples
 */
async function main() {
  console.log("Agent Framework - Basic Usage Examples\n");
  console.log("=" .repeat(50));

  await basicExecution();
  await executionWithWorkflow();
  await customAgentExample();
  await errorHandlingExample();

  console.log("\n" + "=".repeat(50));
  console.log("\nNote: These examples demonstrate the API structure.");
  console.log("Full execution requires:");
  console.log("- Convex backend deployment (ISS-001)");
  console.log("- Valid Anthropic API credentials");
  console.log("- Real workflow IDs from Convex");
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { basicExecution, executionWithWorkflow, customAgentExample, errorHandlingExample };
