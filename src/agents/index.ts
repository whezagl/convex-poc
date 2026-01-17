/**
 * Agent framework exports.
 *
 * This barrel file provides a clean public API for the agent system,
 * exporting base agents, concrete implementations, factory, and types.
 *
 * Agents can be created either directly or via AgentFactory which respects
 * the BASE_AGENT environment variable for provider selection.
 */

// Base agent classes
export { BaseAgent } from "./BaseAgent.js";
export { GLMBaseAgent } from "./GLMBaseAgent.js";

// Concrete Claude SDK agent implementations
export { DummyAgent } from "./DummyAgent.js";
export { PlannerAgent } from "./PlannerAgent.js";
export { CoderAgent } from "./CoderAgent.js";
export { ReviewerAgent } from "./ReviewerAgent.js";

// Concrete GLM SDK agent implementations
export { GLMPlannerAgent } from "./GLMPlannerAgent.js";
export { GLMCoderAgent } from "./GLMCoderAgent.js";
export { GLMReviewerAgent } from "./GLMReviewerAgent.js";

// Factory for environment-based agent creation
export { AgentFactory } from "./AgentFactory.js";

// Type definitions
export type { AgentConfig, AgentInterface, AgentProvider } from "../types/agent.js";
export type { PlannerConfig } from "./PlannerAgent.js";
export type { CoderConfig } from "./CoderAgent.js";
export type { ReviewerConfig } from "./ReviewerAgent.js";
export type { GLMPlannerConfig } from "./GLMPlannerAgent.js";
export type { GLMCoderConfig } from "./GLMCoderAgent.js";
export type { GLMReviewerConfig } from "./GLMReviewerAgent.js";
