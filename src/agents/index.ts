/**
 * Agent framework exports.
 *
 * This barrel file provides a clean public API for the agent system,
 * exporting BaseAgent, concrete implementations, and types.
 */

// Base agent class
export { BaseAgent } from "./BaseAgent.js";

// Concrete agent implementations
export { DummyAgent } from "./DummyAgent.js";
export { PlannerAgent } from "./PlannerAgent.js";

// Type definitions
export type { AgentConfig } from "../types/agent.js";
export type { PlannerConfig } from "./PlannerAgent.js";
