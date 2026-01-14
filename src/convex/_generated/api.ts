/**
 * API exports for Convex functions.
 * This provides type-safe access to queries and mutations.
 *
 * In a self-hosted setup, we manually create function references
 * instead of relying on auto-generation from convex dev.
 */

import { makeFunctionReference } from "convex/server";
import type { DataModel } from "./dataModel";

// Create proper FunctionReferences for each function
export const api = {
  functions: {
    getMockData: makeFunctionReference<"query", {}, DataModel["mockData"][]>("functions:getMockData"),
    updateMockData: makeFunctionReference<"mutation", { id: string; name?: string; value?: string; description?: string }, string>("functions:updateMockData"),
  },
};
