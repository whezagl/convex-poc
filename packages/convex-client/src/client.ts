// @convex-poc/convex-client/client - Convex client initialization
// This module provides singleton Convex client initialization with environment configuration

import { ConvexClient } from "convex/browser";

let clientInstance: ConvexClient | null = null;

/**
 * Initialize Convex client with environment configuration
 * Uses CONVEX_URL from environment or defaults to local development
 */
export function createConvexClient(): ConvexClient {
  if (clientInstance) {
    return clientInstance;
  }

  const convexUrl = process.env.CONVEX_URL || "http://127.0.0.1:3210";

  clientInstance = new ConvexClient(convexUrl, {
    // Note: In production with auth, configure authenticateUrl
    // For this POC, we skip auth (Phase 13 is self-hosted local only)
  });

  return clientInstance;
}

/**
 * Get or create the singleton Convex client instance
 */
export function getConvexClient(): ConvexClient {
  if (!clientInstance) {
    return createConvexClient();
  }
  return clientInstance;
}

/**
 * Close the Convex client and cleanup subscriptions
 * Call this when shutting down the application
 */
export function closeConvexClient(): void {
  if (clientInstance) {
    clientInstance.close();
    clientInstance = null;
  }
}
