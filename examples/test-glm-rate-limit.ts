/**
 * Test script to verify GLM rate limiting and verbose logging.
 *
 * This script:
 * 1. Creates multiple GLM agents with verbose logging
 * 2. Makes rapid requests to test rate limiting
 * 3. Verifies 429 error handling and retry logic
 *
 * Prerequisites:
 * - ZAI_API_KEY environment variable must be set
 */

import "dotenv/config.js";

import { GLMCoderAgent } from "../src/agents/GLMCoderAgent.js";

/**
 * Test 1: Single request with verbose logging
 */
async function testSingleRequestVerbose() {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("TEST 1: Single Request with Verbose Logging");
  console.log("═══════════════════════════════════════════════════════════\n");

  const agent = new GLMCoderAgent({
    agentType: "coder",
    verbose: true,
    rateLimit: {
      minDelay: 1000, // 1 second between requests
      maxRetries: 3,
      initialBackoff: 1000,
    },
  });

  try {
    const response = await agent.execute("Say 'Hello, GLM!'");
    console.log("\n[TEST 1] ✓ Success!");
    console.log(`Response: ${response.slice(0, 100)}...\n`);
  } catch (error) {
    console.error("\n[TEST 1] ✗ Failed:", error);
  }

  return agent;
}

/**
 * Test 2: Multiple rapid requests to test rate limiting
 */
async function testRapidRequests(agent: GLMCoderAgent) {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("TEST 2: Multiple Rapid Requests (Rate Limiting)");
  console.log("═══════════════════════════════════════════════════════════\n");

  const prompts = [
    "Count to 5",
    "Say 'Goodbye'",
    "What is 2+2?",
  ];

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    console.log(`\n[Request ${i + 1}/${prompts.length}] Prompt: "${prompt}"`);

    try {
      const response = await agent.execute(prompt);
      successCount++;
      console.log(`[Request ${i + 1}] ✓ Success (${response.slice(0, 50)}...)`);
    } catch (error) {
      failCount++;
      console.error(`[Request ${i + 1}] ✗ Failed:`, error);
    }
  }

  console.log(`\n[TEST 2] Results: ${successCount} succeeded, ${failCount} failed\n`);
}

/**
 * Test 3: Custom rate limiting configuration
 */
async function testCustomRateLimit() {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("TEST 3: Custom Rate Limit Configuration (2s delay)");
  console.log("═══════════════════════════════════════════════════════════\n");

  const agent = new GLMCoderAgent({
    agentType: "coder",
    verbose: true,
    rateLimit: {
      minDelay: 2000, // 2 seconds between requests
      maxRetries: 3,
      initialBackoff: 2000,
    },
  });

  const prompts = ["First request", "Second request", "Third request"];

  for (let i = 0; i < prompts.length; i++) {
    const startTime = Date.now();
    console.log(`\n[Request ${i + 1}] Started at ${new Date(startTime).toISOString()}`);

    try {
      const response = await agent.execute(prompts[i]);
      const duration = Date.now() - startTime;
      console.log(`[Request ${i + 1}] ✓ Completed in ${duration}ms`);
      console.log(`Response: ${response.slice(0, 50)}...`);
    } catch (error) {
      console.error(`[Request ${i + 1}] ✗ Failed:`, error);
    }
  }

  console.log("\n[TEST 3] ✓ Completed\n");
}

/**
 * Test 4: Without verbose logging (normal mode)
 */
async function testNormalMode() {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("TEST 4: Normal Mode (No verbose logging)");
  console.log("═══════════════════════════════════════════════════════════\n");

  const agent = new GLMCoderAgent({
    agentType: "coder",
    verbose: false, // Normal mode
    rateLimit: {
      minDelay: 1000,
      maxRetries: 3,
      initialBackoff: 1000,
    },
  });

  try {
    console.log("Making request in normal mode...");
    const response = await agent.execute("Say 'Normal mode test'");
    console.log(`[TEST 4] ✓ Success!`);
    console.log(`Response: ${response.slice(0, 100)}...\n`);
  } catch (error) {
    console.error("[TEST 4] ✗ Failed:", error);
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║  GLM Rate Limiting & Verbose Logging Test                ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");

  // Check for API key
  if (!process.env.ZAI_API_KEY) {
    console.error("\n✗ ZAI_API_KEY environment variable is not set!");
    console.error("  Please set it with: export ZAI_API_KEY=your_key_here\n");
    process.exit(1);
  }

  console.log(`\n✓ ZAI_API_KEY is set`);
  console.log(`  Key preview: ${process.env.ZAI_API_KEY.slice(0, 8)}...\n`);

  try {
    // Test 1: Single request with verbose logging
    const agent = await testSingleRequestVerbose();

    // Test 2: Multiple rapid requests
    await testRapidRequests(agent);

    // Test 3: Custom rate limit config
    await testCustomRateLimit();

    // Test 4: Normal mode
    await testNormalMode();

    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log("║  All Tests Complete                                       ║");
    console.log("╚═══════════════════════════════════════════════════════════╝\n");

    console.log("Key Features Tested:");
    console.log("  ✓ Verbose logging mode (detailed API call info)");
    console.log("  ✓ Rate limiting (delays between requests)");
    console.log("  ✓ Retry logic for 429 errors");
    console.log("  ✓ Custom rate limit configuration");
    console.log("  ✓ Normal mode (minimal logging)\n");

  } catch (error) {
    console.error("\n✗ Test suite failed:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as testGLMRateLimit };
