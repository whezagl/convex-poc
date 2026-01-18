/**
 * Types for parsed DDL structures
 * Represents PostgreSQL schema definitions for code generation
 */

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isArray: boolean;
  enumValues?: string[];
  comment?: string;
}

export interface ForeignKey {
  name?: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';
}

export interface Index {
  name: string;
  columns: string[];
  isUnique: boolean;
  isPrimary: boolean;
}

export interface TableDefinition {
  name: string;
  columns: Column[];
  foreignKeys: ForeignKey[];
  indexes: Index[];
  comment?: string;
}

export interface ParseError {
  message: string;
  line?: number;
  column?: number;
  table?: string;
}

export interface ParseResult {
  tables: TableDefinition[];
  errors: ParseError[];
}

export interface IndonesianIDValidation {
  isValid: boolean;
  type: 'NISN' | 'NIP' | 'NUPTK' | 'unknown';
  errors: string[];
}

/**
 * PostgreSQL type to TypeScript type mapping
 */
export const POSTGRESQL_TYPE_MAP: Record<string, string> = {
  // Integer types
  'smallint': 'number',
  'integer': 'number',
  'bigint': 'number',

  // Serial types
  'serial': 'number',
  'bigserial': 'number',

  // Floating point
  'real': 'number',
  'double precision': 'number',

  // Fixed precision
  'numeric': 'number',
  'decimal': 'number',

  // Character types
  'character varying': 'string',
  'varchar': 'string',
  'character': 'string',
  'char': 'string',
  'text': 'string',

  // Boolean
  'boolean': 'boolean',

  // Date/time
  'timestamp': 'Date',
  'timestamptz': 'Date',
  'date': 'Date',
  'time': 'string',
  'timetz': 'string',
  'interval': 'string',

  // Binary
  'bytea': 'Buffer',

  // JSON
  'json': 'Record<string, unknown>',
  'jsonb': 'Record<string, unknown>',

  // UUID
  'uuid': 'string',

  // Special
  'money': 'number',
  'xml': 'string',
};

/**
 * Map PostgreSQL type to TypeScript type
 */
export function mapPostgreSQLTypeToTS(pgType: string): string {
  return POSTGRESQL_TYPE_MAP[pgType.toLowerCase()] || 'unknown';
}
