/**
 * Test setup file for vitest
 *
 * This file runs before all tests to set up required environment variables.
 * Environment variables must be set at the top level because imports
 * happen before any test hooks run.
 */

// Set up required environment variables for tests (must be at top level)
process.env.CONVEX_SELF_HOSTED_URL = "http://127.0.0.1:3210";
process.env.CONVEX_SELF_HOSTED_ADMIN_KEY =
  "convex-self-hosted|test-admin-key-for-testing";
process.env.ZAI_API_KEY = "test-zai-api-key";
