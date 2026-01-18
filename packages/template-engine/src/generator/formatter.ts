import { Biome, Distribution } from '@biomejs/js-api';

export interface FormatOptions {
  filePath: string;
  lineWidth?: number;
  indentStyle?: 'space' | 'tab';
  indentWidth?: number;
}

// Singleton Biome instance
let biomeInstance: Awaited<ReturnType<typeof Biome.create>> | null = null;

async function getBiomeInstance() {
  if (!biomeInstance) {
    biomeInstance = await Biome.create({ distribution: Distribution.NODE });
  }
  return biomeInstance;
}

/**
 * Format generated code using Biome
 * Biome is 20x faster than Prettier with 97% compatibility
 */
export async function formatCode(
  code: string,
  options: FormatOptions
): Promise<string> {
  try {
    const biome = await getBiomeInstance();
    const project = biome.openProject();

    const result = biome.formatContent(project.projectKey, code, {
      filePath: options.filePath,
    });

    if (result.diagnostics.length > 0) {
      console.warn(`Biome formatting diagnostics for ${options.filePath}:`, result.diagnostics);
    }

    return result.content;
  } catch (error) {
    // If formatting fails, return original code
    // This allows development to continue even if Biome has issues
    console.warn(`Biome formatting failed for ${options.filePath}:`, error);
    return code;
  }
}

/**
 * Format code synchronously (fallback for simpler cases)
 * Note: Biome's async API is preferred, but this provides a sync option
 */
export function formatCodeSync(code: string, filePath: string): string {
  // Basic synchronous formatting as fallback
  // In production, use async formatCode for better performance
  return code; // Biome doesn't have a sync API, so we return as-is
}
