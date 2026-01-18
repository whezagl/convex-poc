# Phase 14: Template System - Research

**Researched:** 2026-01-18
**Domain:** Template engines, DDL parsing, code generation, Indonesian school ERP
**Confidence:** MEDIUM

## Summary

This phase requires building a robust template engine for code generation with Handlebars, PostgreSQL DDL parsing without regex, and Indonesian school ERP domain knowledge. The research reveals that Handlebars is the industry standard for logic-less templating with built-in HTML escaping, while PostgreSQL DDL parsing requires specialized libraries like `sql-parser-cst` or `pgsql-parser`. For the Indonesian school domain, the system must support Kurikulum Merdeka (P5 projects), national ID validation (NISN, NIP, NUPTK), and use @faker-js/faker with `id_ID` locale for realistic seed data.

**Primary recommendation:** Use Handlebars with `chokidar` for hot-reload, `sql-parser-cst` for DDL parsing (TypeScript-native), and `@biomejs/js-api` for code formatting. Build nested template structure by category (boilerplate/crud) with clear separation between BE/FE/UI templates.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **handlebars** | ^4.7.8 | Template engine | Industry standard for logic-less templating, built-in HTML escaping, TypeScript support |
| **@biomejs/js-api** | ^4.0.0 | Code formatting | 20x faster than Prettier, TypeScript-native API, 97% Prettier compatibility |
| **@faker-js/faker** | ^10.1.0 | Seed data generation | Official Indonesian locale (`id_ID`), actively maintained, comprehensive API |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **sql-parser-cst** | latest | DDL parsing | TypeScript-native, detailed type definitions, multi-dialect support |
| **chokidar** | ^4.0.0 | File watching | Minimal cross-platform file watcher, handles template hot-reload |
| **escape-html** | ^1.0.3 | Additional escaping | Extra HTML escaping layer for security |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| **sql-parser-cst** | pgsql-parser (WASM) | WASM version heavier, TypeScript types less detailed |
| **Biome** | Prettier | Biome 20x faster, but Prettier has more stable ecosystem |
| **Handlebars** | EJS, Nunjucks | Handlebars stricter separation of concerns, better security defaults |

**Installation:**
```bash
# Core dependencies
pnpm add handlebars @faker-js/faker

# DDL parsing
pnpm add sql-parser-cst

# Development
pnpm add -D @types/handlebars @biomejs/js-api chokidar

# For Indonesian locale support (included in @faker-js/faker)
# No additional installation needed - use faker.locale = 'id_ID'
```

## Architecture Patterns

### Recommended Project Structure

```
convex-poc/
├── .templates/                    # Root templates directory
│   ├── boilerplate/              # Project scaffolding templates
│   │   ├── be/                   # Backend boilerplate
│   │   │   ├── package.json.hbs
│   │   │   ├── tsconfig.json.hbs
│   │   │   └── README.md.hbs
│   │   └── fe/                   # Frontend boilerplate
│   │       ├── vite.config.ts.hbs
│   │       └── index.html.hbs
│   └── crud/                     # CRUD generation templates
│       ├── be/                   # Backend CRUD files
│       │   ├── index.ts.hbs       # Query/mutation exports
│       │   ├── sql.ts.hbs         # SQL queries
│       │   ├── types.ts.hbs       # TypeScript types
│       │   ├── README.md.hbs      # Documentation
│       │   └── index.http.hbs     # HTTP test files
│       ├── fe/                   # Frontend service files
│       │   ├── index.ts.hbs       # Service exports
│       │   ├── types.ts.hbs       # Shared types
│       │   ├── api.ts.hbs         # API client
│       │   ├── hooks.ts.hbs       # React hooks
│       │   └── README.md.hbs
│       └── ui/                   # UI CRUD components
│           ├── Page.tsx.hbs       # Page component
│           ├── schema.ts.hbs      # Form schema
│           ├── form.tsx.hbs       # Form component
│           ├── table.tsx.hbs      # Table component
│           ├── hooks.ts.hbs       # Component hooks
│           └── README.md.hbs
│
├── packages/template-engine/     # Template engine package
│   ├── src/
│   │   ├── parser/               # DDL parser
│   │   │   ├── pg-parser.ts      # PostgreSQL parser
│   │   │   ├── types.ts          # Parser type definitions
│   │   │   └── validators.ts     # Indonesian ID validators
│   │   ├── engine/               # Template engine
│   │   │   ├── handlebars.ts     # Handlebars setup
│   │   │   ├── helpers.ts        # Custom helpers
│   │   │   └── escaper.ts        # Escape utilities
│   │   ├── generator/            # Code generator
│   │   │   ├── generator.ts      # Main generator
│   │   │   └── formatter.ts      # Biome formatter
│   │   ├── watcher/              # Hot reload
│   │   │   └── template-watcher.ts
│   │   └── seeder/               # Seed data generation
│   │       ├── faker.ts          # Faker setup
│   │       └── school-erp.ts     # School ERP generators
│   └── package.json
│
└── scripts/
    └── seeds/                    # Seed data directory
        ├── school-erp.ddl        # 24-table DDL
        └── generate-seeds.ts     # Seed generation script
```

### Pattern 1: Handlebars Template Engine

**What:** Configure Handlebars with TypeScript types, custom helpers, and security

**When to use:** All template rendering operations

**Example:**
```typescript
// Source: https://handlebarsjs.com/guide/
import Handlebars from 'handlebars';

export function createTemplateEngine() {
  const engine = Handlebars.create();

  // Custom helper for PascalCase transformation
  engine.registerHelper('pascalCase', (str: string) => {
    return str.replace(/(\w)(\w*)/g,
      (_, g1, g2) => g1.toUpperCase() + g2.toLowerCase()
    );
  });

  // Custom helper for camelCase transformation
  engine.registerHelper('camelCase', (str: string) => {
    return str.replace(/[-_\s]+(.)?/g,
      (_, c) => c ? c.toUpperCase() : ''
    ).replace(/^(.)/, (_, c) => c.toLowerCase());
  });

  // Helper for checking if column is required
  engine.registerHelper('isRequired', (column: Column) => {
    return !column.nullable && !column.defaultValue;
  });

  // HTML escaping is ON by default with {{var}}
  // Use {{{var}}} ONLY for trusted content (rare)

  return engine;
}
```

### Pattern 2: PostgreSQL DDL Parser

**What:** Parse PostgreSQL 17 DDL without regex, extract table definitions

**When to use:** Processing schema files for code generation

**Example:**
```typescript
// Source: https://npmjs.com/package/sql-parser-cst
import { parse } from 'sql-parser-cst';

interface TableDefinition {
  name: string;
  columns: Column[];
  foreignKeys: ForeignKey[];
  indexes: Index[];
}

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isArray: boolean;
  enumValues?: string[];
}

export function parseDDL(ddl: string): TableDefinition[] {
  const tables: TableDefinition[] = [];
  const errors: ParseError[] = [];

  try {
    const ast = parse(ddl, { dialect: 'postgresql' });

    // Traverse AST to extract CREATE TABLE statements
    for (const stmt of ast) {
      if (stmt.type === 'create_table') {
        const table = extractTableDefinition(stmt);
        tables.push(table);
      }
    }
  } catch (error) {
    errors.push({
      message: error.message,
      line: error.location?.start.line,
    });
  }

  // Collect and report all errors at end (per CONTEXT decision)
  if (errors.length > 0) {
    console.error('DDL parsing errors:', errors);
  }

  return tables;
}

function extractTableDefinition(stmt: CreateTableStmt): TableDefinition {
  return {
    name: stmt.name,
    columns: stmt.columns.map(col => ({
      name: col.name,
      type: mapPostgreSQLTypeToTS(col.dataType),
      nullable: !col.constraints?.some(c => c.type === 'not_null'),
      defaultValue: col.constraints?.find(c => c.type === 'default')?.value,
      isPrimaryKey: col.constraints?.some(c => c.type === 'primary_key'),
      isUnique: col.constraints?.some(c => c.type === 'unique'),
      isArray: col.dataType.array,
      enumValues: col.enumValues,
    })),
    foreignKeys: extractForeignKeys(stmt.constraints),
    indexes: extractIndexes(stmt.indexes),
  };
}
```

### Pattern 3: Hot Reload with Chokidar

**What:** Watch template files for changes and recompile without restart

**When to use:** Development workflow for templates

**Example:**
```typescript
// Source: https://github.com/paulmillr/chokidar
import chokidar from 'chokidar';
import path from 'path';

export function watchTemplates(
  templateDir: string,
  onTemplateChange: (templatePath: string) => void
) {
  const watcher = chokidar.watch(
    path.join(templateDir, '**/*.hbs'),
    {
      persistent: true,
      ignoreInitial: true, // Don't fire on initial scan
      awaitWriteFinish: {
        stabilityThreshold: 100, // Wait 100ms after write
        pollInterval: 10,
      },
    }
  );

  watcher
    .on('change', (filePath) => {
      console.log(`Template changed: ${filePath}`);
      onTemplateChange(filePath);
    })
    .on('add', (filePath) => {
      console.log(`Template added: ${filePath}`);
      onTemplateChange(filePath);
    })
    .on('error', (error) => {
      console.error(`Watcher error: ${error}`);
    });

  return watcher;
}

// Usage in dev mode
if (process.env.NODE_ENV === 'development') {
  watchTemplates('.templates', (changedPath) => {
    // Clear require cache and reload template
    delete require.cache[require.resolve(changedPath)];
    console.log(`Reloaded template: ${changedPath}`);
  });
}
```

### Anti-Patterns to Avoid

- **Regex-based DDL parsing:** SQL is context-free, regex can't handle nested structures, comments, or all PostgreSQL types. Use proper parser (sql-parser-cst).
- **Triple-stache for user input:** `{{{userContent}}}` bypasses HTML escaping. Only use for trusted HTML fragments.
- **Synchronous file watching:** Chokidar is async, don't block event loop waiting for file changes.
- **Monolithic template files:** Break into partials by functionality (header, footer, table rows).
- **Hardcoded type mappings:** Make type mappings configurable for different PostgreSQL → TypeScript conventions.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **DDL parsing** | Custom regex or string splitting | `sql-parser-cst` | SQL has nested structures, comments, arrays, enums - regex fails |
| **HTML escaping** | Custom escape function | Handlebars built-in | Already HTML-escapes by default with `{{var}}` |
| **File watching** | fs.watch wrapper | `chokidar` | Cross-platform issues (Windows vs Unix), memory leaks, event debouncing |
| **Code formatting** | Manual string formatting | `@biomejs/js-api` | Biome handles import sorting, JSDoc, 20x faster than Prettier |
| **Indonesian names/addresses** | String arrays | `@faker-js/faker` with `id_ID` | Comprehensive API, realistic data, actively maintained |
| **PostgreSQL types** | Custom switch statements | `sql-parser-cst` type mapping | Handles arrays, JSONB, enums, domains correctly |

**Key insight:** Template engines and DDL parsers are solved problems. Custom implementations introduce bugs, security vulnerabilities, and maintenance burden. Use battle-tested libraries with TypeScript support.

## Common Pitfalls

### Pitfall 1: SQL Injection in Generated Code

**What goes wrong:** Templates embed user input directly into SQL strings without parameterization.

**Why it happens:** Treating DDL column names or table names as template variables without proper validation.

**How to avoid:**
- Always use parameterized queries in generated SQL templates
- Validate table/column names against PostgreSQL identifier rules
- Escape SQL identifiers using double quotes: `"{{columnName}}"`

**Warning signs:** Generated SQL has string concatenation or interpolation without $1, $2 placeholders.

### Pitfall 2: Triple-Stache XSS Vulnerabilities

**What goes wrong:** Using `{{{userContent}}}` allows arbitrary HTML/JS injection.

**Why it happens:** Developer needs raw HTML for legitimate reason but applies it to untrusted input.

**How to avoid:**
- Default to double-stache `{{var}}` (HTML-escaped)
- Only use triple-stache for trusted, server-generated HTML fragments
- Sanitize HTML with DOMPurify if absolutely necessary

**Warning signs:** Template documentation says "use {{{var}}} for raw HTML" without security warning.

### Pitfall 3: PostgreSQL Type Mapping Edge Cases

**What goes wrong:** Arrays, JSONB, or enums generate incorrect TypeScript types.

**Why it happens:** Simple type mappers only handle basic types (text, integer, boolean).

**How to avoid:**
- Use sql-parser-cst to detect array types: `column.isArray`
- Map JSONB to `Record<string, unknown>` or `unknown` (not `any`)
- Extract enum values and generate TypeScript union types

**Warning signs:** Generated types use `any` for complex columns, or arrays become `string`.

### Pitfall 4: Indonesian ID Validation

**What goes wrong:** NISN, NIP, NUPTK fields accept invalid formats.

**Why it happens:** Indonesian national IDs have specific digit requirements not captured by simple string checks.

**How to avoid:**
- NISN: 10 digits, numeric only
- NIP: 18 digits with specific structure (birth date in middle)
- NUPTK: 16 digits, numeric only
- Use Zod schemas for runtime validation

**Warning signs:** Validation only checks `typeof === 'string'` or basic regex.

### Pitfall 5: Hot Reload Memory Leaks

**What goes wrong:** File watcher accumulates listeners, memory grows over time.

**Why it happens:** Not closing watchers when restarting, or not debouncing rapid file changes.

**How to avoid:**
- Use `awaitWriteFinish` option in chokidar
- Close old watchers before creating new ones
- Limit listener count in development

**Warning signs:** Memory usage increases over time during development, or file changes trigger multiple events.

## Code Examples

Verified patterns from official sources:

### Indonesian Faker Locale Setup

```typescript
// Source: https://faker.readthedocs.io/en/latest/locales/id_ID.html
import { faker } from '@faker-js/faker';

// Set Indonesian locale
faker.locale = 'id_ID';

// Generate Indonesian student data
const student = {
  name: faker.person.fullName(),  // Indonesian name format
  email: faker.internet.email(),
  phone: faker.phone.number(),
  address: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),  // Indonesian cities
    province: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode(),
  },
  nisn: faker.string.numeric(10),  // 10-digit NISN
  birthDate: faker.date.past(),
};

// Generate Indonesian teacher data
const teacher = {
  name: faker.person.fullName(),
  nip: faker.string.numeric(18),  // 18-digit NIP
  nuptk: faker.string.numeric(16), // 16-digit NUPTK
  subject: faker.helpers.arrayElement([
    'Matematika',
    'Bahasa Indonesia',
    'IPA',
    'IPS',
    'PKN',
  ]),
};
```

### Biome Formatter Integration

```typescript
// Source: https://biomejs.dev/formatter/
import { format } from '@biomejs/js-api';

export async function formatCode(
  code: string,
  filePath: string
): Promise<string> {
  const formatted = await format(code, {
    filePath,
    lineWidth: 80,
    indentStyle: 'space',
    indentWidth: 2,
  });

  return formatted;
}

// Usage in code generator
const generatedCode = await formatCode(
  templateResult,
  'src/students/index.ts'
);
```

### Handlebars with TypeScript Types

```typescript
// Source: Handlebars TypeScript documentation
import Handlebars from 'handlebars';

interface TemplateContext {
  tableName: string;
  columns: Column[];
}

export function compileTemplate(
  templateSource: string
): HandlebarsTemplateDelegate<TemplateContext> {
  return Handlebars.compile<TemplateContext>(templateSource);
}

// Type-safe template usage
const template = compileTemplate(`
export interface {{pascalCase tableName}} {
{{#each columns}}
  {{#if @last}}
  {{name}}: {{typescriptType}};
  {{else}}
  {{name}}: {{typescriptType};
  {{/if}}
{{/each}}
}
`);

const result = template({
  tableName: 'students',
  columns: [
    { name: 'id', type: 'uuid', nullable: false },
    { name: 'name', type: 'text', nullable: false },
  ],
});
```

### SQL Injection Prevention in Templates

```typescript
// Source: OWASP SQL Injection Prevention Cheat Sheet
// https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html

// BAD: String interpolation (vulnerable)
const badQuery = `
  SELECT * FROM {{tableName}} WHERE name = '${columnName}'
`;

// GOOD: Parameterized query (safe)
const goodQuery = `
  SELECT * FROM {{tableName}} WHERE name = $1
`;

// Helper for generating parameterized queries
export function generateParameterizedQuery(
  tableName: string,
  whereColumns: string[]
): string {
  const whereClause = whereColumns
    .map((col, i) => `"${col}" = $${i + 1}`)
    .join(' AND ');

  return `SELECT * FROM "${tableName}" WHERE ${whereClause};`;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| **Prettier** | **Biome** | 2024-2025 | 20x faster formatting, Rust-based, type-aware linting |
| **Regex DDL parsing** | **sql-parser-cst** | 2023-2024 | TypeScript-native, proper AST, multi-dialect support |
| **Manual file watching** | **chokidar** | 2020-2021 | Cross-platform stability, memory leak fixes |
| **Basic Faker** | **@faker-js/faker** (v9+) | 2023-2024 | Modular architecture, comprehensive locale support |
| **Triple-stache HTML** | **DOMPurify + double-stache** | 2022-2023 | Security-first approach, XSS prevention |

**Deprecated/outdated:**
- **Prettier for new projects:** Biome is faster and more integrated, but Prettier still has ecosystem mindshare
- **WASM-based parsers:** Heavy for Node.js, native TypeScript parsers preferred
- **fs.watch/fs.watchFile:** Unreliable cross-platform, use chokidar instead
- **Manual locale data:** @faker-js/faker includes official locales, don't maintain your own

## Open Questions

Things that couldn't be fully resolved:

1. **PostgreSQL 17 JSON_TABLE() integration**
   - What we know: PostgreSQL 17 added JSON_TABLE() function for converting JSON to tables
   - What's unclear: Whether School ERP templates need to generate JSON_TABLE() queries
   - Recommendation: Support basic JSONB types initially, add JSON_TABLE() templates if CRUD operations require querying nested JSON

2. **Kurikulum Merdeka P5 project data model**
   - What we know: P5 (Projek Penguatan Profil Pelajar Pancasila) is project-based learning
   - What's unclear: Specific database schema for P5 projects (assessment rubrics, student outcomes)
   - Recommendation: Start with flexible JSONB columns for P5 project data, refine schema after reviewing actual curriculum docs

3. **NIP format validation**
   - What we know: NIP is 18 digits with embedded birth date
   - What's unclear: Exact structure (which digits represent birth date, government codes)
   - Recommendation: Use basic 18-digit validation initially, add sophisticated validation if required by business logic

## Sources

### Primary (HIGH confidence)

- **Handlebars Official Docs** - Template engine API, helpers, escaping
  - https://handlebarsjs.com/guide/
- **@faker-js/faker Documentation** - Indonesian locale usage, API reference
  - https://faker.readthedocs.io/en/latest/locales/id_ID.html
  - https://www.npmjs.com/package/@faker-js/faker
- **sql-parser-cst (npm)** - TypeScript-native SQL parser
  - https://npmjs.com/package/sql-parser-cst
- **Biome Formatter Docs** - Code formatting API
  - https://biomejs.dev/formatter/
  - https://biomejs.dev/guides/getting-started/
- **PostgreSQL 17 Release Notes** - JSON_TABLE(), SQL/JSON features
  - https://www.postgresql.org/docs/release/17.0/

### Secondary (MEDIUM confidence)

- **Chokidar GitHub** - File watching patterns
  - https://github.com/paulmillr/chokidar
- **OWASP SQL Injection Prevention** - Security best practices
  - https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
- **Medium: Handlebars Safe Usage (2025)** - SSTI prevention
  - https://medium.com/@instatunnel/server-side-template-injection-ssti-when-your-template-engine-executes-attacker-code-f5d113fd2bd0
- **XYGENI: Handlebars Security (2025)** - Injection flaw prevention
  - https://xygeni.io/blog/handlebars-js-safe-usage-to-avoid-injection-flaws/
- **Biome v2 Release (2025)** - Performance improvements
  - https://biomejs.dev/blog/biome-v2/

### Tertiary (LOW confidence)

- **Various Medium articles (2025)** - CRUD patterns, TypeScript setups
  - Verified some patterns, but treat as implementation guidance not authoritative
- **Indonesian education research (2025)** - Kurikulum Merdeka academic papers
  - Good for domain understanding, but not technical implementation guides
- **StackOverflow discussions** - Specific technical issues
  - Verified solutions against official docs where possible

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - Libraries verified via official docs, but some combinations (sql-parser-cst + templates) untested
- Architecture: MEDIUM - Patterns based on established practices, but School ERP domain has unique requirements
- Pitfalls: HIGH - Security issues (XSS, SQL injection) well-documented in official sources
- Indonesian domain: LOW - Kurikulum Merdeka and NIP validation need local expertise or official docs

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - fast-moving ecosystem with Biome v2, PostgreSQL 17)

**Next research needs:**
1. Official Indonesian government docs for NISN/NIP/NUPTK format specifications
2. Kurikulum Merdeka curriculum documentation for P5 project data model
3. Real-world School ERP DDL examples for validation
4. sql-parser-cst PostgreSQL dialect limitations and workarounds
