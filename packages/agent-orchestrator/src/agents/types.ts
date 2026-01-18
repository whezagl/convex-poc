// @convex-poc/agent-orchestrator/agents/types - CRUD agent type definitions

import type { Id } from "@convex-poc/shared-types/subtask";
import type { AgentType } from "@convex-poc/shared-types/agent";

// Table definition from DDL parser
// Re-exporting from template-engine for convenience
export type { TableDefinition } from "@convex-poc/template-engine/parser";

// Template types matching Phase 14 templates
export type TemplateType =
  | "be/boilerplate"      // Backend setup (1 sub-task)
  | "fe/boilerplate"      // Frontend setup (1 sub-task)
  | "be/crud"             // Backend CRUD APIs (N sub-tasks, one per table)
  | "fe/crud"             // Frontend services (N sub-tasks, one per table)
  | "ui/crud";            // UI CRUD pages (N sub-tasks, one per table)

// CRUD agent configuration
export interface CRUDAgentConfig {
  agentType: AgentType;
  subTaskId: Id;
  workspacePath: string;
  ddlPath?: string; // Optional: path to DDL file for CRUD agents
  templateType: TemplateType;
  totalSteps: number; // Expected steps (usually 5: parse, load, generate, format, write)
}

// Progress update for Convex streaming
export interface ProgressUpdate {
  stepNumber: number;
  totalSteps: number;
  message: string;
  status?: "running" | "done" | "failed";
  error?: string;
}

// Template generation result
export interface GenerationResult {
  tableName: string;
  templateType: TemplateType;
  files: Array<{
    path: string;
    content: string;
  }>;
  step: number;
  totalSteps: number;
}
