/**
 * Agent framework exports.
 *
 * This barrel file provides a clean public API for the agent system,
 * exporting BaseAgent, GLMBaseAgent, concrete implementations, and types.
 */

// Base agent classes
export { BaseAgent } from "./BaseAgent.js";
export { GLMBaseAgent } from "./GLMBaseAgent.js";

// Concrete agent implementations
export { DummyAgent } from "./DummyAgent.js";
export { PlannerAgent } from "./PlannerAgent.js";
export { CoderAgent } from "./CoderAgent.js";
export { ReviewerAgent } from "./ReviewerAgent.js";

// Type definitions
export type { AgentConfig, AgentInterface } from "../types/agent.js";
export type { PlannerConfig } from "./PlannerAgent.js";
export type { CoderConfig } from "./CoderAgent.js";
export type { ReviewerConfig } from "./ReviewerAgent.js";
