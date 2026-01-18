import { parse } from 'sql-parser-cst';
import type { CreateTableStmt, Statement } from 'sql-parser-cst';
import {
  TableDefinition,
  Column,
  ForeignKey,
  Index,
  ParseResult,
  ParseError,
  mapPostgreSQLTypeToTS,
} from './types.js';

/**
 * Parse PostgreSQL DDL and extract table definitions
 * Uses sql-parser-cst for proper AST parsing (NOT regex)
 */
export function parseDDL(ddl: string): ParseResult {
  const tables: TableDefinition[] = [];
  const errors: ParseError[] = [];

  try {
    const ast = parse(ddl, { dialect: 'postgresql' });

    // Traverse AST to extract CREATE TABLE statements
    for (const stmt of ast.statements) {
      try {
        if (stmt.type === 'create_table_stmt') {
          const table = extractTableDefinition(stmt as CreateTableStmt);
          tables.push(table);
        }
      } catch (error) {
        errors.push({
          message: error instanceof Error ? error.message : String(error),
          line: stmt.range ? 1 : undefined, // sql-parser-cst uses ranges, not lines
          column: stmt.range ? stmt.range[0] : undefined,
        });
      }
    }
  } catch (error) {
    // Top-level parsing error
    errors.push({
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return { tables, errors };
}

/**
 * Extract table definition from CREATE TABLE statement
 */
function extractTableDefinition(stmt: CreateTableStmt): TableDefinition {
  const tableName = entityNameToString(stmt.name);

  if (!tableName) {
    throw new Error('Table name not found in CREATE TABLE statement');
  }

  const columns: Column[] = [];
  const foreignKeys: ForeignKey[] = [];
  const indexes: Index[] = [];

  // Extract columns and constraints from columns ParenExpr
  if (stmt.columns?.expr?.items) {
    for (const item of stmt.columns.expr.items) {
      if (item.type === 'column_definition') {
        columns.push(extractColumn(item));
      } else if (item.type === 'constraint') {
        extractTableConstraint(item, tableName, foreignKeys, indexes);
      } else if (item.type === 'constraint_primary_key') {
        extractPrimaryKey(item, tableName, indexes);
      } else if (item.type === 'constraint_foreign_key') {
        extractForeignKey(item, foreignKeys);
      } else if (item.type === 'constraint_unique') {
        extractUnique(item, tableName, indexes);
      }
    }
  }

  return {
    name: tableName,
    columns,
    foreignKeys,
    indexes,
  };
}

/**
 * Extract column definition from column_definition node
 */
function extractColumn(col: any): Column {
  const columnName = col.name?.name || col.name?.text;

  if (!columnName) {
    throw new Error('Column name not found in column definition');
  }

  if (!col.dataType) {
    throw new Error('Data type not found for column');
  }

  // Extract type name from DataType
  const typeName = extractDataTypeName(col.dataType);

  // Check for array type
  const isArray = col.dataType.type === 'array_data_type' ||
    typeName.endsWith('[]');

  // Determine nullability
  let nullable = true;
  let isPrimaryKey = false;
  let isUnique = false;
  let defaultValue: string | undefined;

  // Check constraints
  if (col.constraints) {
    for (const constraint of col.constraints) {
      if (constraint.type === 'constraint_not_null' || constraint.type === 'not_null') {
        nullable = false;
      } else if (constraint.type === 'constraint_primary_key' || constraint.type === 'primary_key') {
        isPrimaryKey = true;
        nullable = false; // Primary keys are never null
      } else if (constraint.type === 'constraint_unique' || constraint.type === 'unique') {
        isUnique = true;
      } else if (constraint.type === 'constraint_default' || constraint.type === 'default') {
        defaultValue = serializeDefaultValue(constraint.expr || constraint.value);
      } else if (constraint.type === 'constraint') {
        // Wrapped constraint
        const inner = constraint.constraint;
        if (inner.type === 'constraint_not_null' || inner.type === 'not_null') {
          nullable = false;
        } else if (inner.type === 'constraint_primary_key' || inner.type === 'primary_key') {
          isPrimaryKey = true;
          nullable = false;
        } else if (inner.type === 'constraint_unique' || inner.type === 'unique') {
          isUnique = true;
        } else if (inner.type === 'constraint_default' || inner.type === 'default') {
          defaultValue = serializeDefaultValue(inner.expr || inner.value);
        }
      }
    }
  }

  return {
    name: columnName,
    type: mapPostgreSQLTypeToTS(typeName.replace(/\[\]/g, '')),
    nullable,
    defaultValue,
    isPrimaryKey,
    isUnique,
    isArray,
  };
}

/**
 * Extract data type name from DataType node
 */
function extractDataTypeName(dataType: any): string {
  if (!dataType) return 'unknown';

  if (dataType.type === 'data_type_name') {
    const name = dataType.name;
    if (Array.isArray(name)) {
      return name.map((n: any) => n.text || n.name).join(' ');
    }
    return name.text || name.name || 'unknown';
  }

  if (dataType.type === 'array_data_type') {
    const baseName = extractDataTypeName(dataType.dataType);
    return `${baseName}[]`;
  }

  if (dataType.type === 'time_data_type') {
    const base = dataType.timeKw?.text || 'timestamp';
    const tz = dataType.timeZoneKw ? 'tz' : '';
    return `${base}${tz}`;
  }

  if (dataType.type === 'modified_data_type') {
    return extractDataTypeName(dataType.dataType);
  }

  return 'unknown';
}

/**
 * Extract entity name to string
 */
function entityNameToString(name: any): string {
  if (!name) return '';

  if (name.text) return name.text;
  if (name.name) {
    if (Array.isArray(name.name)) {
      return name.name.map((n: any) => n.text || n.name || n).join('.');
    }
    return name.name.text || name.name.name || name.name;
  }

  return '';
}

/**
 * Extract table constraint
 */
function extractTableConstraint(
  constraint: any,
  tableName: string,
  foreignKeys: ForeignKey[],
  indexes: Index[]
): void {
  const inner = constraint.constraint || constraint;

  if (inner.type === 'constraint_primary_key' || inner.type === 'primary_key') {
    extractPrimaryKey(inner, tableName, indexes);
  } else if (inner.type === 'constraint_foreign_key' || inner.type === 'foreign_key') {
    extractForeignKey(inner, foreignKeys);
  } else if (inner.type === 'constraint_unique' || inner.type === 'unique') {
    extractUnique(inner, tableName, indexes);
  }
}

/**
 * Extract primary key constraint
 */
function extractPrimaryKey(constraint: any, tableName: string, indexes: Index[]): void {
  const columns = extractColumnNames(constraint.columns);
  if (columns.length === 0) return;

  indexes.push({
    name: `pk_${tableName}`,
    columns,
    isUnique: true,
    isPrimary: true,
  });
}

/**
 * Extract foreign key constraint
 */
function extractForeignKey(constraint: any, foreignKeys: ForeignKey[]): void {
  const columns = extractColumnNames(constraint.columns);
  if (columns.length === 0) return;

  const references = constraint.references || constraint.referencesKw;
  if (!references) return;

  const refTable = entityNameToString(references.table);
  const refColumns = extractColumnNames(references.columns);

  // Find ON DELETE action
  let onDelete: ForeignKey['onDelete'];
  if (references.options) {
    for (const option of references.options) {
      if (option.type === 'referential_action' && option.eventKw?.text === 'DELETE') {
        const actionKw = option.actionKw;
        if (Array.isArray(actionKw)) {
          onDelete = actionKw.map((a: any) => a.text).join('_') as ForeignKey['onDelete'];
        } else {
          onDelete = actionKw?.text as ForeignKey['onDelete'];
        }
      }
    }
  }

  foreignKeys.push({
    name: constraint.indexName?.name || constraint.name?.name,
    columns,
    referencedTable: refTable,
    referencedColumns: refColumns,
    onDelete,
  });
}

/**
 * Extract unique constraint
 */
function extractUnique(constraint: any, tableName: string, indexes: Index[]): void {
  const columns = extractColumnNames(constraint.columns);
  if (columns.length === 0) return;

  indexes.push({
    name: `uq_${tableName}`,
    columns,
    isUnique: true,
    isPrimary: false,
  });
}

/**
 * Extract column names from ParenExpr or similar
 */
function extractColumnNames(columns: any): string[] {
  if (!columns) return [];

  // Handle ParenExpr<ListExpr<Identifier>>
  if (columns.expr?.items) {
    return columns.expr.items.map((item: any) => item.name || item.text || '').filter(Boolean);
  }

  // Handle ListExpr<Identifier>
  if (columns.items) {
    return columns.items.map((item: any) => item.name || item.text || '').filter(Boolean);
  }

  return [];
}

/**
 * Serialize default value to string
 */
function serializeDefaultValue(value: any): string | undefined {
  if (!value) return undefined;

  if (value.type === 'single_quote_string' || value.type === 'string') {
    return value.value || '';
  } else if (value.type === 'number' || value.type === 'number_literal') {
    return String(value.value || '');
  } else if (value.type === 'boolean') {
    return String(value.value || '');
  } else if (value.type === 'function_call' || value.type === 'func_call') {
    const funcName = value.name?.[0]?.name || value.functionName?.name;
    return funcName || 'unknown';
  } else if (value.text) {
    return value.text;
  }

  return undefined;
}

/**
 * Parse DDL file and return tables (throws if errors)
 */
export function parseDDLStrict(ddl: string): TableDefinition[] {
  const result = parseDDL(ddl);

  if (result.errors.length > 0) {
    throw new Error(`DDL parsing failed with ${result.errors.length} errors:\n${
      result.errors.map(e => `- ${e.message}`).join('\n')
    }`);
  }

  return result.tables;
}
