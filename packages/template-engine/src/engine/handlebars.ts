import Handlebars from 'handlebars';
import { registerHelpers } from './helpers.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export interface TemplateEngine {
  compile(template: string): HandlebarsTemplateDelegate;
  render(template: string, context: Record<string, unknown>): string;
  load(templatePath: string): HandlebarsTemplateDelegate;
  invalidateCache(templatePath?: string): void;
}

/**
 * Create a configured Handlebars template engine
 * HTML escaping is ON by default (use {{{var}}} only for trusted content)
 */
export function createTemplateEngine(): TemplateEngine {
  const engine = Handlebars.create();

  // Register custom helpers
  registerHelpers(engine);

  // Store loaded templates for hot-reload
  const templateCache = new Map<string, HandlebarsTemplateDelegate>();

  return {
    compile(template: string): HandlebarsTemplateDelegate {
      return engine.compile(template);
    },

    render(template: string, context: Record<string, unknown>): string {
      const compiled = engine.compile(template);
      return compiled(context);
    },

    load(templatePath: string): HandlebarsTemplateDelegate {
      // Resolve path: if relative, join with .templates/ directory
      const absolutePath = resolve(templatePath);

      // Check cache first
      const cached = templateCache.get(absolutePath);
      if (cached) {
        return cached;
      }

      // Load template from disk
      let content: string;
      try {
        content = readFileSync(absolutePath, 'utf-8');
      } catch (error) {
        throw new Error(`Failed to load template ${absolutePath}: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Compile and cache
      const compiled = engine.compile(content);
      templateCache.set(absolutePath, compiled);

      return compiled;
    },

    invalidateCache(templatePath?: string): void {
      if (templatePath) {
        const absolutePath = resolve(templatePath);
        templateCache.delete(absolutePath);
      } else {
        templateCache.clear();
      }
    },
  };
}

// Re-export Handlebars types for convenience
// Note: HandlebarsTemplateDelegate is not directly exported, use the runtime type
export type HandlebarsTemplateDelegate = ReturnType<typeof Handlebars.compile>;
