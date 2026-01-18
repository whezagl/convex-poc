// @convex-poc/agent-orchestrator/dispatcher/types - Dispatcher type definitions

import type { AgentType } from "@convex-poc/shared-types/agent";

/**
 * Agent classification result from keyword or LLM analysis.
 */
export interface AgentClassification {
  agentType: AgentType;
  confidence: number; // 0.0 to 1.0
  keywords: string[]; // Matched keywords (keyword mode) or extracted phrases (LLM mode)
  method: "keyword" | "llm"; // Which method produced this result
  reasoning?: string; // LLM explanation (only if method: "llm")
}

/**
 * Keyword patterns for fast-path routing.
 * Maps agent type to array of matching phrases.
 */
export type KeywordPatterns = Record<
  AgentType,
  string[]
>;

/**
 * LLM classifier configuration.
 */
export interface LLMClassifierConfig {
  apiKey: string;
  model?: string; // Default: claude-3-haiku-20240307 (faster/cheaper)
  maxTokens?: number; // Default: 200
  temperature?: number; // Default: 0.3 (low temperature for classification)
}

/**
 * Dispatcher configuration.
 */
export interface DispatcherConfig {
  keywordPatterns?: Partial<KeywordPatterns>; // Custom keyword patterns
  llmConfig?: LLMClassifierConfig; // LLM classifier settings
  enableLLM?: boolean; // Enable LLM fallback (default: true)
}
