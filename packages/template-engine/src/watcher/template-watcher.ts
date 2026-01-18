import chokidar from 'chokidar';
import { promises as fs } from 'fs';

export interface WatcherOptions {
  templateDir: string;
  onTemplateChange?: (templatePath: string) => void;
  onTemplateAdd?: (templatePath: string) => void;
  onTemplateUnlink?: (templatePath: string) => void;
  onError?: (error: Error) => void;
}

export interface TemplateWatcher {
  close(): Promise<void>;
  ready: Promise<void>;
}

/**
 * Watch template files for changes and trigger hot-reload
 * Uses chokidar for cross-platform file watching
 */
export function watchTemplates(options: WatcherOptions): TemplateWatcher {
  const {
    templateDir,
    onTemplateChange,
    onTemplateAdd,
    onTemplateUnlink,
    onError,
  } = options;

  // Create watcher with configuration
  // Note: Watch the directory directly and filter by extension in event handlers
  // Using glob patterns like '**/*.hbs' doesn't work reliably on all platforms
  const watcher = chokidar.watch(templateDir, {
    persistent: true,
    ignoreInitial: true, // Don't fire on initial scan
    awaitWriteFinish: {
      stabilityThreshold: 100, // Wait 100ms after write
      pollInterval: 10,
    },
    ignorePermissionErrors: true,
  });

  // Handle file changes (only .hbs files)
  watcher.on('change', (filePath) => {
    if (filePath.endsWith('.hbs')) {
      console.log(`[TemplateWatcher] Template changed: ${filePath}`);
      onTemplateChange?.(filePath);
    }
  });

  // Handle new templates (only .hbs files)
  watcher.on('add', (filePath) => {
    if (filePath.endsWith('.hbs')) {
      console.log(`[TemplateWatcher] Template added: ${filePath}`);
      onTemplateAdd?.(filePath);
    }
  });

  // Handle deleted templates (only .hbs files)
  watcher.on('unlink', (filePath) => {
    if (filePath.endsWith('.hbs')) {
      console.log(`[TemplateWatcher] Template deleted: ${filePath}`);
      onTemplateUnlink?.(filePath);
    }
  });

  // Handle errors
  watcher.on('error', (error) => {
    console.error('[TemplateWatcher] Watcher error:', error);
    onError?.(error instanceof Error ? error : new Error(String(error)));
  });

  // Return watcher interface
  return {
    async close(): Promise<void> {
      await watcher.close();
    },
    ready: new Promise((resolve, reject) => {
      watcher.on('ready', () => resolve());
      watcher.on('error', reject);
    }),
  };
}

/**
 * Load template file content
 */
export async function loadTemplate(templatePath: string): Promise<string> {
  try {
    return await fs.readFile(templatePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to load template ${templatePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * List all template files in directory
 */
export async function listTemplates(templateDir: string): Promise<string[]> {
  const { readdir } = await import('fs/promises');
  const { join } = await import('path');

  async function walk(dir: string): Promise<string[]> {
    const files = await readdir(dir, { withFileTypes: true });
    const paths: string[] = [];

    for (const file of files) {
      const path = join(dir, file.name);
      if (file.isDirectory()) {
        paths.push(...(await walk(path)));
      } else if (file.name.endsWith('.hbs')) {
        paths.push(path);
      }
    }

    return paths;
  }

  return walk(templateDir);
}
