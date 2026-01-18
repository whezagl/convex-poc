/**
 * Escaping utilities for template security
 * Note: Handlebars already HTML-escapes by default with {{var}}
 * This module provides additional escaping for SQL and special contexts
 */

/**
 * Escape SQL identifiers (table names, column names)
 * Uses double quotes as per PostgreSQL standard
 */
export function escapeSqlIdentifier(identifier: string): string {
  // Escape double quotes by doubling them: "my""table"
  return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Escape SQL string literals
 * Uses single quotes with proper escaping
 */
export function escapeSqlString(str: string): string {
  // Escape single quotes by doubling them: 'O''Reilly'
  return `'${str.replace(/'/g, "''")}'`;
}

/**
 * Validate PostgreSQL identifier
 * Prevents SQL injection in dynamic SQL
 */
export function isValidIdentifier(identifier: string): boolean {
  // PostgreSQL identifiers: letters, digits, underscores, not starting with digit
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
}

/**
 * Sanitize template variable names
 * Prevents template injection attacks
 */
export function sanitizeVariableName(name: string): string {
  // Remove any characters that aren't valid in JavaScript identifiers
  return name.replace(/[^a-zA-Z0-9_$]/g, '');
}
