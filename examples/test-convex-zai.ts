/**
 * Test Convex integration with GLM-4.7 from z.ai
 *
 * Purpose: Verify Phase 10 Convex deployment works end-to-end
 *
 * Prerequisites:
 * 1. ZAI_API_KEY environment variable set (get from https://platform.z.ai/)
 * 2. Convex backend running (docker compose up)
 *
 * To run:
 *   export ZAI_API_KEY="your-key-here"
 *   npx tsx examples/test-convex-zai.ts
 */

import "dotenv/config.js";
import { config as dotenvConfig } from "dotenv";

// Load .env.local explicitly
dotenvConfig({ path: ".env.local" });

import { convex } from "../src/convex/client.js";

/**
 * Test Convex integration with GLM-4.7
 *
 * This test verifies:
 * 1. Workflow creation in Convex
 * 2. Agent session creation linked to workflow
 * 3. GLM-4.7 API call via z.ai (OpenAI-compatible)
 * 4. Session update with LLM response
 * 5. Workflow status update
 */
async function testConvexWithZAI() {
  console.log("=== Convex + GLM-4.7 Integration Test ===\n");

  // Verify environment
  if (!process.env.ZAI_API_KEY) {
    console.error("✗ ZAI_API_KEY environment variable is required.");
    console.error("  Get your key from: https://platform.z.ai/");
    console.error("  Then run: export ZAI_API_KEY='your-key-here'");
    throw new Error("ZAI_API_KEY environment variable is required. Get it from https://platform.z.ai/");
  }

  console.log("Configuration:");
  console.log(`  ZAI_API_KEY: ${process.env.ZAI_API_KEY.substring(0, 10)}...`);
  console.log(`  Convex URL: ${process.env.CONVEX_SELF_HOSTED_URL || "http://127.0.0.1:3210"}`);
  console.log(`  Convex Admin Key: ${process.env.CONVEX_SELF_HOSTED_ADMIN_KEY?.substring(0, 20)}...\n`);

  try {
    // Step 1: Create workflow in Convex
    console.log("[1/5] Creating workflow in Convex...");
    const workflow = await convex.mutations.workflows.createWorkflow({
      task: "Test GLM-4.7 integration - create email validation function",
    });
    console.log(`  ✓ Workflow created: ${workflow}\n`);

    // Step 2: Create agent session linked to workflow
    console.log("[2/5] Creating agent session...");
    const session = await convex.mutations.agents.createAgentSession({
      agentType: "planner",
      input: "Create a simple email validation function in TypeScript",
      workflowId: workflow,
    });
    console.log(`  ✓ Session created: ${session}\n`);

    // Step 3: Call z.ai API (GLM-4.7 via OpenAI SDK)
    console.log("[3/5] Calling GLM-4.7 via z.ai...");
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({
      apiKey: process.env.ZAI_API_KEY,
      baseURL: "https://api.z.ai/api/paas/v4/"
    });

    const response = await client.chat.completions.create({
      model: "glm-4.7",
      messages: [
        {
          role: "system",
          content: "You are a helpful TypeScript developer. Provide concise, working code."
        },
        {
          role: "user",
          content: "Create a simple email validation function in TypeScript. Return only the function code with JSDoc."
        }
      ],
      max_tokens: 500,
    });

    const llmOutput = response.choices[0].message.content || "No response";
    console.log(`  ✓ GLM-4.7 response received (${llmOutput.length} chars)`);
    console.log(`  Preview: ${llmOutput.substring(0, 100)}...\n`);

    // Step 4: Update session with LLM response
    console.log("[4/5] Updating agent session with response...");
    await convex.mutations.agents.updateAgentSession({
      sessionId: session,
      status: "completed",
      output: llmOutput,
    });
    console.log(`  ✓ Session updated\n`);

    // Step 5: Update workflow status
    console.log("[5/5] Updating workflow status...");
    await convex.mutations.workflows.updateWorkflowStatus({
      workflowId: workflow,
      status: "completed",
    });
    console.log(`  ✓ Workflow updated\n`);

    // Success summary
    console.log("═══════════════════════════════════════════════════════════");
    console.log("✓ Test Complete!");
    console.log("═══════════════════════════════════════════════════════════\n");

    console.log("Created Records:");
    console.log(`  Workflow ID: ${workflow}`);
    console.log(`  Session ID:  ${session}\n`);

    console.log("Dashboard Verification:");
    console.log(`  Visit: http://localhost:6791`);
    console.log(`  Check tables: agentSessions, workflows`);
    console.log(`  Look for workflow ID: ${workflow}\n`);

    console.log("GLM-4.7 Response:");
    console.log("─────────────────────────────────────────────────────────────");
    console.log(llmOutput);
    console.log("─────────────────────────────────────────────────────────────\n");

  } catch (error) {
    console.error("\n✗ Test failed:", error);
    throw error;
  }
}

/**
 * Main entry point
 */
async function main() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║  Convex + GLM-4.7 Integration Test                        ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  try {
    await testConvexWithZAI();
    console.log("✓ All checks passed!");
  } catch (error) {
    console.error("\n✗ Test failed. Check error above.");
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { testConvexWithZAI };
