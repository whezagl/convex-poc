// @convex-poc/agent-orchestrator/agents/BECRUDAgent - Backend CRUD APIs agent

import { join, dirname } from "path";
import { promises as fs } from "fs";
import { pascalCase, camelCase } from "@convex-poc/template-engine/engine";
import { BaseCRUDAgent } from "./BaseCRUDAgent.js";
import type { CRUDAgentConfig, TableDefinition } from "./types.js";

/**
 * BECRUDAgent generates backend CRUD code for a single table.
 *
 * Spawns N sub-tasks (one per table), each generating:
 * - types.ts: TypeScript interfaces for table model
 * - sql.ts: SQL queries (findMany, findById, create, update, delete, count)
 * - index.ts: Repository class with CRUD methods
 * - README.md: Usage documentation
 * - index.http: HTTP requests for testing (VS Code REST Client)
 *
 * Templates: .templates/crud/be/* (from Phase 14-05)
 */
export class BECRUDAgent extends BaseCRUDAgent {
  constructor(config: CRUDAgentConfig) {
    super(config);
  }

  /**
   * Selects template based on table name.
   * Templates from Phase 14-05:
   * - types.ts.hbs
   * - sql.ts.hbs
   * - index.ts.hbs
   * - README.md.hbs
   * - index.http.hbs
   */
  protected selectTemplate(table?: TableDefinition): string {
    if (!table) throw new Error("BECRUDAgent requires table definition");
    return "crud/be";
  }

  /**
   * Prepares template variables for CRUD code generation.
   *
   * Variables from Phase 14-05 templates:
   * - tableName: Original table name (e.g., "students")
   * - TableName: Pascal case (e.g., "Students")
   * - columns: Array of column definitions
   * - primaryKeys: Array of primary key column names
   * - foreignKeys: Array of foreign key constraints
   * - indexes: Array of index definitions
   */
  protected async prepareTemplateVariables(table?: TableDefinition): Promise<Record<string, unknown>> {
    if (!table) throw new Error("BECRUDAgent requires table definition");

    return {
      tableName: table.tableName,
      TableName: pascalCase(table.tableName),
      table: table,
      columns: table.columns,
      primaryKeys: table.columns.filter(c => c.isPrimaryKey).map(c => c.name),
      foreignKeys: table.foreignKeys || [],
      indexes: table.indexes || [],
      // Helper functions for templates
      pascalCase,
      camelCase,
    };
  }

  /**
   * Returns output path for generated CRUD files.
   * Format: workspacePath/src/repositories/{tableName}/
   */
  protected getOutputPath(table?: TableDefinition): string {
    if (!table) throw new Error("BECRUDAgent requires table definition");
    return join(this.config.workspacePath, "src", "repositories", table.tableName);
  }

  /**
   * Generates all CRUD files for a single table.
   */
  async execute(table?: TableDefinition): Promise<void> {
    if (!table) throw new Error("BECRUDAgent requires table definition");

    const { totalSteps } = this.config;

    try {
      // Step 1: Load templates (5 files)
      await this.updateProgress(1, `Loading CRUD templates for ${table.tableName}`);

      const templateFiles = [
        "types.ts.hbs",
        "sql.ts.hbs",
        "index.ts.hbs",
        "README.md.hbs",
        "index.http.hbs",
      ];

      const templates = await Promise.all(
        templateFiles.map(file =>
          this.templateEngine.load(`crud/be/${file}`)
        )
      );

      // Step 2: Prepare variables
      await this.updateProgress(2, `Preparing variables for ${table.tableName}`);
      const variables = await this.prepareTemplateVariables(table);

      // Step 3: Generate code
      await this.updateProgress(3, `Generating CRUD code for ${table.tableName}`);

      const outputPath = this.getOutputPath(table);
      const generatedFiles = templates.map((template, index) => ({
        template,
        outputPath: join(outputPath, templateFiles[index].replace(".hbs", "")),
        variables,
      }));

      // Step 4: Write files with locking
      await this.updateProgress(4, `Writing CRUD files for ${table.tableName}`);

      for (const { template, outputPath, variables } of generatedFiles) {
        const code = template(variables);
        await this.writeFileWithLock(outputPath, code);
      }

      // Step 5: Complete
      await this.updateProgress(
        totalSteps,
        `CRUD APIs generated for ${table.tableName}`,
        "done"
      );

    } catch (error) {
      await this.handleExecutionError(table.tableName, error);
    }
  }

  /**
   * Writes file with locking for custom output paths.
   */
  protected async writeFileWithLock(
    outputPath: string,
    content: string
  ): Promise<void> {
    await fs.mkdir(dirname(outputPath), { recursive: true });

    await this.lockManager.withLock(outputPath, async () => {
      await fs.writeFile(outputPath, content, "utf-8");
    });
  }
}
