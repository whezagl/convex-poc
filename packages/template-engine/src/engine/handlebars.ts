import Handlebars from 'handlebars';
import { registerHelpers } from './helpers.js';

export interface TemplateEngine {
  compile(template: string): HandlebarsTemplateDelegate;
  render(template: string, context: Record<string, unknown>): string;
  load(templatePath: string): HandlebarsTemplateDelegate;
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
      // Templates will be loaded by file system in watcher
      // This is a placeholder for the loader interface
      throw new Error('Template loading requires file system access - use watcher module');
    },
  };
}

// Re-export Handlebars types for convenience
// Note: HandlebarsTemplateDelegate is not directly exported, use the runtime type
export type HandlebarsTemplateDelegate = ReturnType<typeof Handlebars.compile>;
