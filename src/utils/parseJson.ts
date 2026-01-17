/**
 * Robust JSON parsing utilities for handling LLM responses that may contain
 * malformed JSON, unescaped characters, or other common issues.
 */

/**
 * Attempts to parse JSON with multiple fallback strategies.
 *
 * Strategies tried in order:
 * 1. Standard JSON.parse()
 * 2. Extract from markdown code blocks (```json ... ```)
 * 3. Extract from any code blocks (``` ... ```)
 * 4. Find first JSON-like object
 * 5. Fix common escaping issues and retry
 *
 * @param input - The input string to parse
 * @returns The parsed JSON object
 * @throws Error if all strategies fail
 */
export function parseJson(input: string): any {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  const errors: string[] = [];

  // Strategy 1: Direct parse
  try {
    return JSON.parse(input);
  } catch (e) {
    errors.push(`Direct parse: ${(e as Error).message}`);
  }

  // Strategy 2: Extract from markdown code block with json label
  const codeBlockMatch = input.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch (e) {
      errors.push(`Code block parse: ${(e as Error).message}`);
    }
  }

  // Strategy 3: Find first JSON object (from { to })
  const objectMatch = input.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch (e) {
      errors.push(`Object match parse: ${(e as Error).message}`);
    }
  }

  // Strategy 4: Fix common escaping issues
  try {
    return parseJsonWithFixes(input);
  } catch (e) {
    errors.push(`Fix parse: ${(e as Error).message}`);
  }

  throw new Error(
    `Failed to parse JSON after ${errors.length} attempts:\n${errors.join('\n')}\n\nInput preview: ${input.slice(0, 200)}...`
  );
}

/**
 * Attempts to parse JSON after applying common fixes for LLM output issues.
 *
 * Fixes applied:
 * 1. Remove trailing commas in arrays/objects
 * 2. Fix unescaped quotes in string values
 * 3. Remove line comments (// style) and block comments (star slash style)
 * 4. Fix escaped newlines/tabs
 */
function parseJsonWithFixes(input: string): any {
  let fixed = input.trim();

  // Fix 1: Remove trailing commas before } or ]
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

  // Fix 2: Remove single-line comments (but be careful with URLs)
  // Only remove comments at line start or after whitespace/structural chars
  fixed = fixed.replace(/(^|\s|[{([])\/\/.*$/gm, '$1');

  // Fix 3: Remove multi-line comments
  fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');

  // Fix 4: Try to fix unescaped quotes in string values
  // This is tricky - we need to identify string values and escape quotes within them
  fixed = fixQuotesInStrings(fixed);

  return JSON.parse(fixed);
}

/**
 * Attempts to fix unescaped quotes within JSON string values.
 * This is a heuristic approach that works for common cases.
 */
function fixQuotesInStrings(input: string): string {
  // Split by { and } to identify object boundaries
  // This is a simplified approach - full JSON parsing is complex

  // For string values containing code, we often see patterns like:
  // "content": "export function test() { return "hello"; }"
  // The inner quotes need to be escaped

  // Strategy: Look for common patterns where code is embedded in JSON
  // and escape quotes that appear to be within string values

  // This is a best-effort fix - won't handle all cases
  let result = '';
  let inString = false;
  let escapeNext = false;
  let braceDepth = 0;
  let bracketDepth = 0;
  let stringStartChar = '';

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const prevChar = i > 0 ? input[i - 1] : '';

    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      escapeNext = true;
      continue;
    }

    if (!inString) {
      // Not in a string, track structure
      if (char === '{') braceDepth++;
      if (char === '}') braceDepth--;
      if (char === '[') bracketDepth++;
      if (char === ']') bracketDepth--;

      // Start of string
      if (char === '"' || char === "'") {
        // Check if this is really a string delimiter (not inside a word)
        const nextChar = i < input.length - 1 ? input[i + 1] : '';
        const prevNonSpace = i > 0 ? input[i - 1].trim() : '';

        // String delimiters typically follow :[{, or whitespace
        if (prevNonSpace === '' || ':[{,'.includes(prevNonSpace) || /\s/.test(prevNonSpace)) {
          inString = true;
          stringStartChar = char;
          result += char;
          continue;
        }
      }
      result += char;
    } else {
      // In a string
      if (char === stringStartChar) {
        // Check if this is the end of the string
        const nextChar = i < input.length - 1 ? input[i + 1] : '';

        // String ends if followed by structural chars or whitespace
        if ('}]:,'.includes(nextChar) || /\s/.test(nextChar) || nextChar === '') {
          inString = false;
          stringStartChar = '';
          result += char;
          continue;
        }
      }

      // Inside a string value - escape quotes if they look unescaped
      if (char === '"' || char === "'") {
        // This quote might need escaping if it's not preceded by backslash
        if (prevChar !== '\\') {
          // Check context: if this looks like code, escape it
          // Heuristic: if we're at depth > 1, we're likely in a string value that contains code
          if (braceDepth > 1 || bracketDepth > 1) {
            result += '\\' + char;
            continue;
          }
        }
      }
      result += char;
    }
  }

  return result;
}

/**
 * Extracts JSON from a response that may contain multiple JSON objects.
 * Returns the first valid JSON object found.
 */
export function extractFirstJson(input: string): any {
  const match = input.match(/\{[\s\S]*?\}/);
  if (!match) {
    throw new Error('No JSON object found in input');
  }

  try {
    return JSON.parse(match[0]);
  } catch (e) {
    return parseJsonWithFixes(match[0]);
  }
}
