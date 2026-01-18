/**
 * Template Development Server
 *
 * Provides hot-reload functionality for template development.
 * Watches .templates/ directory for changes and automatically
 * re-loads modified templates.
 */

import { watchTemplates } from '../../packages/template-engine/dist/watcher/index.js';
import { createTemplateEngine } from '../../packages/template-engine/dist/engine/index.js';
import { resolve } from 'path';

const templateDir = resolve('.templates');
const engine = createTemplateEngine();

// Start watching templates
const watcher = watchTemplates({
  templateDir,
  onTemplateChange: async (templatePath) => {
    console.log(`[HotReload] Reloading: ${templatePath}`);
    try {
      // Invalidate cache first
      engine.invalidateCache(templatePath);
      // Re-load the template (this will re-compile and cache)
      engine.load(templatePath);
      console.log(`[HotReload] ✓ Reloaded: ${templatePath}`);
    } catch (error) {
      console.error(`[HotReload] ✗ Failed to reload:`, error);
    }
  },
  onTemplateAdd: (templatePath) => {
    console.log(`[HotReload] New template: ${templatePath}`);
  },
  onTemplateUnlink: (templatePath) => {
    console.log(`[HotReload] Deleted template: ${templatePath}`);
    engine.invalidateCache(templatePath);
  },
  onError: (error) => {
    console.error('[HotReload] Watcher error:', error);
  },
});

console.log('[TemplateDevServer] Watching .templates/ for changes...');
console.log('[TemplateDevServer] Press Ctrl+C to stop');

// Wait for watcher to be ready
await watcher.ready;

console.log('[TemplateDevServer] Watcher ready');

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[TemplateDevServer] Shutting down...');
  await watcher.close();
  process.exit(0);
});

// Keep process alive
process.stdin.resume();
