// @convex-poc/agent-orchestrator/agents/BaseCRUDAgent - Base class for CRUD agents

import { promises as fs } from "fs";
import { join, dirname } from "path";
import type { AgentType } from "@convex-poc/shared-types/agent";
import { updateSubTaskProgress, updateSubTaskStatus } from "@convex-poc/convex-client/subtasks";
import { createTemplateEngine, type TemplateEngine } from "@convex-poc/template-engine/engine";
import { parseDDL } from "@convex-poc/template-engine/parser";
import { FileLockManager } from "../queue/FileLockManager.js";
import type {
  CRUDAgentConfig,
  TableDefinition,
  TemplateType,
  ProgressUpdate,
  GenerationResult,
} from "./types.js";

/**
 * BaseCRUDAgent provides common functionality for all CRUD agents:
 * - Template engine integration
 * - Convex progress streaming
 * - File locking for parallel writes
 * - DDL parsing for table-aware code generation
 */
export abstract class BaseCRUDAgent {
  protected readonly config: CRUDAgentConfig;
  protected readonly lockManager: FileLockManager;
  protected readonly templateEngine: TemplateEngine;

  // Cache for parsed tables (avoid re-parsing DDL)
  private tablesCache?: TableDefinition[];

  constructor(config: CRUDAgentConfig) {
    this.config = config;
    this.lockManager = new FileLockManager();
    this.templateEngine = createTemplateEngine();
  }

  /**
   * Abstract method: Subclasses must implement template selection
   *
   * @param table - Table definition (for CRUD agents) or undefined (for boilerplate)
   * @returns Template name to load from .templates/ directory
   */
  protected abstract selectTemplate(
    table?: TableDefinition
  ): string;

  /**
   * Abstract method: Subclasses must implement template variable preparation
   *
   * @param table - Table definition (for CRUD agents) or undefined (for boilerplate)
   * @returns Variables object for template rendering
   */
  protected abstract prepareTemplateVariables(
    table?: TableDefinition
  ): Promise<Record<string, unknown>>;

  /**
   * Abstract method: Subclasses must implement output path resolution
   *
   * @param table - Table definition (for CRUD agents) or undefined (for boilerplate)
   * @returns Absolute path where generated code should be written
   */
  protected abstract getOutputPath(
    table?: TableDefinition
  ): string;

  /**
   * Executes the agent for a single table (or once for boilerplate agents).
   *
   * Workflow:
   * 1. Parse DDL to extract table structure (CRUD agents only)
   * 2. Load Handlebars template
   * 3. Prepare template variables
   * 4. Generate code with template
   * 5. Format with Biome (if applicable)
   * 6. Write to filesystem with file locking
   *
   * @param table - Optional table definition for CRUD agents
   */
  async execute(table?: TableDefinition): Promise<void> {
    const { subTaskId, templateType, totalSteps } = this.config;
    const targetName = table ? table.name : "project";

    try {
      // Step 1: Parse DDL (CRUD agents only)
      if (this.config.ddlPath && !table) {
        await this.updateProgress(1, `Parsing DDL from ${this.config.ddlPath}`);
        this.tablesCache = await this.parseDDL(this.config.ddlPath);
      } else {
        await this.updateProgress(1, `Starting ${this.config.agentType} for ${targetName}`);
      }

      // Step 2: Load template
      const templateName = this.selectTemplate(table);
      await this.updateProgress(2, `Loading template: ${templateName}`);
      const template = this.templateEngine.load(templateName);

      // Step 3: Prepare variables
      await this.updateProgress(3, `Preparing variables for ${targetName}`);
      const variables = await this.prepareTemplateVariables(table);

      // Step 4: Generate code
      await this.updateProgress(4, `Generating code for ${targetName}`);
      const code = template(variables);

      // Step 5: Write to filesystem with lock
      await this.updateProgress(5, `Writing files for ${targetName}`);
      await this.writeWithLock(table, code);

      // Mark complete
      await this.updateProgress(totalSteps, `Completed ${this.config.agentType} for ${targetName}`, "done");

    } catch (error) {
      await this.handleExecutionError(targetName, error);
    }
  }

  /**
   * Executes the agent for multiple tables in parallel.
   * Used by CRUD agents that spawn N sub-tasks (one per table).
   *
   * @param tables - Array of table definitions
   */
  async executeForTables(tables: TableDefinition[]): Promise<void> {
    const results = await Promise.allSettled(
      tables.map(table => this.execute(table))
    );

    // Check for failures
    const failures = results.filter(r => r.status === "rejected");
    if (failures.length > 0) {
      throw new Error(
        `${failures.length} of ${tables.length} table operations failed`
      );
    }
  }

  /**
   * Parses DDL file to extract table definitions.
   * Results are cached to avoid re-parsing.
   *
   * @param ddlPath - Path to DDL file
   * @returns Array of table definitions
   */
  protected async parseDDL(ddlPath: string): Promise<TableDefinition[]> {
    if (this.tablesCache) {
      return this.tablesCache;
    }

    const ddlContent = await fs.readFile(ddlPath, "utf-8");
    const parseResult = parseDDL(ddlContent);

    // Check for errors (parser uses continue-on-error pattern from Phase 14-02)
    if (parseResult.errors.length > 0) {
      throw new Error(
        `DDL parsing failed: ${parseResult.errors.map(e => e.message).join(", ")}`
      );
    }

    this.tablesCache = parseResult.tables;
    return this.tablesCache;
  }

  /**
   * Writes generated code to filesystem with file locking.
   *
   * @param table - Optional table definition
   * @param content - Generated code content
   */
  protected async writeWithLock(
    table: TableDefinition | undefined,
    content: string
  ): Promise<void> {
    const outputPath = this.getOutputPath(table);

    // Ensure parent directory exists
    await fs.mkdir(dirname(outputPath), { recursive: true });

    // Write with lock to prevent conflicts in parallel execution
    await this.lockManager.withLock(outputPath, async () => {
      await fs.writeFile(outputPath, content, "utf-8");
    });
  }

  /**
   * Updates progress in Convex for real-time UI streaming.
   * Uses fire-and-forget pattern to avoid blocking agent execution.
   *
   * @param stepNumber - Current step number
   * @param message - Progress message
   * @param status - Optional status override
   */
  protected async updateProgress(
    stepNumber: number,
    message: string,
    status?: "running" | "done" | "failed"
  ): Promise<void> {
    const update: ProgressUpdate = {
      stepNumber,
      totalSteps: this.config.totalSteps,
      message,
      status,
    };

    // Non-blocking Convex update (don't await)
    // Note: updateSubTaskProgress only updates stepNumber, not full progress
    // TODO: Add updateSubTaskWithMessage mutation to Convex backend
    updateSubTaskProgress({
      subtaskId: this.config.subTaskId,
      stepNumber,
    }).catch((err: unknown) => {
      console.error(`[BaseCRUDAgent] Progress update failed: ${err}`);
    });

    // If status is provided, also update status
    if (status) {
      updateSubTaskStatus({
        subtaskId: this.config.subTaskId,
        status,
      }).catch((err: unknown) => {
        console.error(`[BaseCRUDAgent] Status update failed: ${err}`);
      });
    }
  }

  /**
   * Handles execution errors with proper Convex status update.
   *
   * @param targetName - Name of table/project being processed
   * @param error - Error object
   */
  protected async handleExecutionError(
    targetName: string,
    error: unknown
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await this.updateProgress(
      this.config.totalSteps,
      `Failed ${this.config.agentType} for ${targetName}: ${errorMessage}`,
      "failed"
    );

    throw error;
  }

  /**
   * Cleans up resources (locks, connections).
   * Call this when agent is done (even if it failed).
   */
  async cleanup(): Promise<void> {
    await this.lockManager.releaseAll();
  }
}
