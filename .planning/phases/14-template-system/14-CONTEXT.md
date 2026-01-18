# Phase 14: Template System - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Build robust template engine with DDL parser for code generation — Handlebars integration, PostgreSQL DDL parsing, CRUD templates for BE/FE/UI, and School ERP seed data generation. Internal developer tooling for generating boilerplate CRUD code from database schemas.

</domain>

<decisions>
## Implementation Decisions

### Template organization
- **File structure**: Nested by category — `.templates/boilerplate/be/`, `.templates/crud/fe/`, `.templates/crud/ui/` (following mono-repo best practices)
- **Naming**: Claude's discretion — choose convention that fits mono-repo structure
- **Multi-file templates**: Claude's discretion — use partials or per-file templates based on maintainability
- **Documentation**: Yes — templates generate README.md alongside code with usage examples

### DDL parsing approach
- **PostgreSQL 17 features**: Claude's discretion — assess School ERP requirements and choose appropriate support level
- **Foreign keys**: Claude's discretion — extract and expose based on CRUD template needs
- **Parser output**: Claude's discretion — choose format that integrates with @convex-poc/shared-types (Zod or plain objects)
- **Error handling**: Collect & report — continue parsing, collect all errors, report summary at end

### Template variables
- **Name transformation**: PascalCase for types (StudentRecords), camelCase for variables (firstName) — standard TypeScript convention
- **Column metadata**: Claude's discretion — include basic or detailed metadata based on template needs
- **Type mappings**: Claude's discretion — fixed or configurable based on flexibility requirements
- **DDL access**: Both available — templates get parsed structure AND original DDL string for reference

### Code generation style
- **Formatter**: Biome (faster Prettier alternative)
- **JSDoc**: Include JSDoc comments with descriptions from column names/types
- **Imports**: Grouped — external libs, internal modules, types separated with blank lines
- **File header**: Include — "⚠️ DO NOT EDIT — Auto-generated on [date]" warning at top

### Claude's Discretion
- Template file naming convention
- Multi-file template strategy (partials vs per-file)
- PostgreSQL 17 feature support level (arrays, JSONB, enums)
- Foreign key extraction and exposure approach
- Parser output format (Zod vs plain objects)
- Column metadata detail level
- Type mapping strategy (fixed vs configurable)

</decisions>

<specifics>
## Specific Ideas

- Templates are internal developer tooling — not user-facing
- Standard TypeScript/JavaScript conventions (PascalCase types, camelCase vars)
- Biome for formatting (faster than Prettier)
- Clear auto-generated warnings to prevent accidental edits

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 14-template-system*
*Context gathered: 2026-01-18*
