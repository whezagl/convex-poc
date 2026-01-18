// @convex-poc/agent-orchestrator/agents/UICRUDAgent - UI CRUD pages agent

import { join, dirname } from "path";
import { promises as fs } from "fs";
import { pascalCase, camelCase } from "@convex-poc/template-engine/engine";
import { BaseCRUDAgent } from "./BaseCRUDAgent.js";
import type { CRUDAgentConfig, TableDefinition } from "./types.js";

/**
 * UICRUDAgent generates UI CRUD components for a single table.
 *
 * Spawns N sub-tasks (one per table), each generating:
 * - Page.tsx: Main page with list, create, edit views
 * - schema.ts: Zod validation schema from table columns
 * - form.tsx: React Hook Form with validation
 * - table.tsx: Table component with edit/delete actions
 * - hooks.ts: Custom hooks for form and table state
 * - README.md: Usage documentation
 *
 * Templates: .templates/crud/ui/* (from Phase 14-07)
 */
export class UICRUDAgent extends BaseCRUDAgent {
  constructor(config: CRUDAgentConfig) {
    super(config);
  }

  protected selectTemplate(table?: TableDefinition): string {
    if (!table) throw new Error("UICRUDAgent requires table definition");
    return "crud/ui";
  }

  /**
   * Prepares template variables for UI component generation.
   *
   * Variables from Phase 14-07 templates:
   * - tableName, TableName: Table name variants
   * - columns: Column definitions with HTML input type mapping
   * - formFields: Form field definitions with validation
   * - tableColumns: Table column definitions with display formatters
   */
  protected async prepareTemplateVariables(table?: TableDefinition): Promise<Record<string, unknown>> {
    if (!table) throw new Error("UICRUDAgent requires table definition");

    // Map PostgreSQL types to HTML input types
    const inputTypeMap: Record<string, string> = {
      "integer": "number",
      "bigint": "number",
      "decimal": "number",
      "numeric": "number",
      "varchar": "text",
      "text": "textarea",
      "boolean": "checkbox",
      "timestamp": "datetime-local",
      "timestamptz": "datetime-local",
      "date": "date",
      "jsonb": "textarea",
      "json": "textarea",
      "uuid": "text",
    };

    return {
      tableName: table.name,
      TableName: pascalCase(table.name),
      table: table,
      columns: table.columns,
      formFields: table.columns.map(col => ({
        name: col.name,
        label: pascalCase(col.name),
        type: inputTypeMap[col.type] || "text",
        required: !col.nullable,
        defaultValue: col.defaultValue,
      })),
      tableColumns: table.columns.slice(0, 6).map(col => ({
        name: col.name,
        label: pascalCase(col.name),
        type: col.type,
      })),
      pascalCase,
      camelCase,
    };
  }

  /**
   * Returns output path for generated UI files.
   * Format: workspacePath/src/pages/{tableName}/
   */
  protected getOutputPath(table?: TableDefinition): string {
    if (!table) throw new Error("UICRUDAgent requires table definition");
    return join(this.config.workspacePath, "src", "pages", table.name);
  }

  /**
   * Generates all UI files for a single table.
   */
  async execute(table?: TableDefinition): Promise<void> {
    if (!table) throw new Error("UICRUDAgent requires table definition");

    const { totalSteps } = this.config;

    try {
      // Step 1: Load templates (6 files)
      await this.updateProgress(1, `Loading UI templates for ${table.name}`);

      const templateFiles = [
        "Page.tsx.hbs",
        "schema.ts.hbs",
        "form.tsx.hbs",
        "table.tsx.hbs",
        "hooks.ts.hbs",
        "README.md.hbs",
      ];

      const templates = await Promise.all(
        templateFiles.map(file =>
          this.templateEngine.load(`crud/ui/${file}`)
        )
      );

      // Step 2: Prepare variables
      await this.updateProgress(2, `Preparing variables for ${table.name}`);
      const variables = await this.prepareTemplateVariables(table);

      // Step 3: Generate code
      await this.updateProgress(3, `Generating UI components for ${table.name}`);

      const outputPath = this.getOutputPath(table);
      const generatedFiles = templates.map((template, index) => ({
        template,
        outputPath: join(outputPath, templateFiles[index].replace(".hbs", "")),
        variables,
      }));

      // Step 4: Write files
      await this.updateProgress(4, `Writing UI files for ${table.name}`);

      for (const { template, outputPath, variables } of generatedFiles) {
        const code = template(variables);
        await this.writeFileWithLock(outputPath, code);
      }

      // Step 5: Complete
      await this.updateProgress(
        totalSteps,
        `UI pages generated for ${table.name}`,
        "done"
      );

    } catch (error) {
      await this.handleExecutionError(table.name, error);
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
