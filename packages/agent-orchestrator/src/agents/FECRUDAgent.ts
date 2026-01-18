// @convex-poc/agent-orchestrator/agents/FECRUDAgent - Frontend CRUD services agent

import { join, dirname } from "path";
import { promises as fs } from "fs";
import { pascalCase, camelCase } from "@convex-poc/template-engine/engine";
import { BaseCRUDAgent } from "./BaseCRUDAgent.js";
import type { CRUDAgentConfig, TableDefinition } from "./types.js";

/**
 * FECRUDAgent generates frontend service code for a single table.
 *
 * Spawns N sub-tasks (one per table), each generating:
 * - types.ts: TypeScript interfaces matching backend DTOs
 * - api.ts: Fetch API wrapper with error handling
 * - hooks.ts: TanStack Query hooks (useQuery, useMutation)
 * - index.ts: Barrel export
 * - README.md: Usage documentation
 *
 * Templates: .templates/crud/fe/* (from Phase 14-06)
 */
export class FECRUDAgent extends BaseCRUDAgent {
  constructor(config: CRUDAgentConfig) {
    super(config);
  }

  protected selectTemplate(table?: TableDefinition): string {
    if (!table) throw new Error("FECRUDAgent requires table definition");
    return "crud/fe";
  }

  /**
   * Prepares template variables for frontend service generation.
   *
   * Variables from Phase 14-06 templates:
   * - tableName, TableName: Table name variants
   * - columns: Column definitions for type generation
   * - apiUrl: Base URL for API requests (from VITE_API_URL env var)
   * - queryKeys: Query key factory pattern
   */
  protected async prepareTemplateVariables(table?: TableDefinition): Promise<Record<string, unknown>> {
    if (!table) throw new Error("FECRUDAgent requires table definition");

    return {
      tableName: table.tableName,
      TableName: pascalCase(table.tableName),
      table: table,
      columns: table.columns,
      primaryKeys: table.columns.filter(c => c.isPrimaryKey).map(c => c.name),
      apiUrl: "import.meta.env.VITE_API_URL || 'http://localhost:3000'",
      pascalCase,
      camelCase,
    };
  }

  /**
   * Returns output path for generated service files.
   * Format: workspacePath/src/services/{tableName}/
   */
  protected getOutputPath(table?: TableDefinition): string {
    if (!table) throw new Error("FECRUDAgent requires table definition");
    return join(this.config.workspacePath, "src", "services", table.tableName);
  }

  /**
   * Generates all service files for a single table.
   */
  async execute(table?: TableDefinition): Promise<void> {
    if (!table) throw new Error("FECRUDAgent requires table definition");

    const { totalSteps } = this.config;

    try {
      // Step 1: Load templates (5 files)
      await this.updateProgress(1, `Loading service templates for ${table.tableName}`);

      const templateFiles = [
        "types.ts.hbs",
        "api.ts.hbs",
        "hooks.ts.hbs",
        "index.ts.hbs",
        "README.md.hbs",
      ];

      const templates = await Promise.all(
        templateFiles.map(file =>
          this.templateEngine.load(`crud/fe/${file}`)
        )
      );

      // Step 2: Prepare variables
      await this.updateProgress(2, `Preparing variables for ${table.tableName}`);
      const variables = await this.prepareTemplateVariables(table);

      // Step 3: Generate code
      await this.updateProgress(3, `Generating service code for ${table.tableName}`);

      const outputPath = this.getOutputPath(table);
      const generatedFiles = templates.map((template, index) => ({
        template,
        outputPath: join(outputPath, templateFiles[index].replace(".hbs", "")),
        variables,
      }));

      // Step 4: Write files
      await this.updateProgress(4, `Writing service files for ${table.tableName}`);

      for (const { template, outputPath, variables } of generatedFiles) {
        const code = template(variables);
        await this.writeFileWithLock(outputPath, code);
      }

      // Step 5: Complete
      await this.updateProgress(
        totalSteps,
        `CRUD services generated for ${table.tableName}`,
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
