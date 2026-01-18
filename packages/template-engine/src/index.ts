// Re-export main entry points
export { createTemplateEngine, TemplateEngine } from './engine/index.js';
export { formatCode, formatCodeSync } from './generator/index.js';
export { watchTemplates, loadTemplate, listTemplates } from './watcher/index.js';
