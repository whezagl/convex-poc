import Handlebars from 'handlebars';

/**
 * Register custom Handlebars helpers for template rendering
 */
export function registerHelpers(engine: typeof Handlebars): void {
  // PascalCase transformation for TypeScript types
  engine.registerHelper('pascalCase', (str: string) => {
    if (!str) return '';
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, (_, c) => c.toUpperCase());
  });

  // camelCase transformation for variables
  engine.registerHelper('camelCase', (str: string) => {
    if (!str) return '';
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, (_, c) => c.toLowerCase());
  });

  // Check if column is required (not null, no default)
  engine.registerHelper('isRequired', (column: any) => {
    return !column.nullable && !column.defaultValue;
  });

  // Generate TypeScript type from PostgreSQL type
  engine.registerHelper('typescriptType', (column: any) => {
    const typeMap: Record<string, string> = {
      uuid: 'string',
      text: 'string',
      varchar: 'string',
      integer: 'number',
      bigint: 'number',
      boolean: 'boolean',
      timestamp: 'Date',
      timestamptz: 'Date',
      jsonb: 'Record<string, unknown>',
      json: 'Record<string, unknown>',
      decimal: 'number',
      'double precision': 'number',
    };

    if (column.isArray) {
      return `${typeMap[column.type] || 'unknown'}[]`;
    }

    return typeMap[column.type] || 'unknown';
  });

  // Format date for file headers
  engine.registerHelper('formatDate', (date: Date) => {
    return date.toISOString().split('T')[0];
  });

  // Conditional rendering helper
  engine.registerHelper('eq', (a: any, b: any) => a === b);
  engine.registerHelper('ne', (a: any, b: any) => a !== b);
  engine.registerHelper('gt', (a: number, b: number) => a > b);
  engine.registerHelper('lt', (a: number, b: number) => a < b);

  // Math helper for addition
  engine.registerHelper('add', (a: number, b: number) => a + b);

  // Filter columns by property (returns array of columns where property is truthy)
  engine.registerHelper('filterColumns', (columns: any[], prop: string) => {
    if (!columns || !Array.isArray(columns)) return [];
    return columns.filter((col: any) => col[prop] === true);
  });

  // Find first column matching property
  engine.registerHelper('findColumn', (columns: any[], prop: string) => {
    if (!columns || !Array.isArray(columns)) return null;
    return columns.find((col: any) => col[prop] === true) || columns[0] || null;
  });

  // Take first N columns
  engine.registerHelper('takeColumns', (columns: any[], n: number) => {
    if (!columns || !Array.isArray(columns)) return [];
    return columns.slice(0, n);
  });

  // Capitalize first letter
  engine.registerHelper('capitalize', (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  // Generate HTML input type from PostgreSQL type
  engine.registerHelper('inputType', (pgType: string) => {
    const typeMap: Record<string, string> = {
      uuid: 'text',
      text: 'textarea',
      varchar: 'text',
      integer: 'number',
      bigint: 'number',
      boolean: 'checkbox',
      timestamp: 'datetime-local',
      timestamptz: 'datetime-local',
      date: 'date',
      jsonb: 'textarea',
      json: 'textarea',
      decimal: 'number',
      'double precision': 'number',
    };
    return typeMap[pgType] || 'text';
  });
}
