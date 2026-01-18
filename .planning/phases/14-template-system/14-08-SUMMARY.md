---
phase: 14-template-system
plan: 08
subsystem: database-schema
tags: postgresql-17, ddl, school-erp, indonesian-domain, kurikulum-merdeka, p5-projects

# Dependency graph
requires:
  - phase: 13-foundation
    provides: mono-repo structure, PostgreSQL 17 database infrastructure
provides:
  - School ERP DDL schema with 24 tables for Indonesian school management
  - PostgreSQL 17 DDL demonstrating identity columns, JSONB, arrays, enums, check constraints
  - Realistic test case for DDL parser validation (Plan 14-09)
  - Complete domain schema for seed data generation (Plan 14-10)
affects:
  - 14-09 (DDL parser implementation uses this schema as test case)
  - 14-10 (seed data generation uses this schema structure)
  - 14-11 (CRUD templates reference this schema pattern)

# Tech tracking
tech-stack:
  added: postgresql-17 (identity columns, JSONB, arrays, custom enums, check constraints)
  patterns: Indonesian national ID validation, Kurikulum Merdeka P5 project structure, descriptive grading, referential integrity with cascading deletes

key-files:
  created:
    - scripts/seeds/school-erp.ddl (762 lines, 24 tables, 19 enums, 87 indexes)
    - scripts/seeds/README.md (352 lines, comprehensive documentation)
  modified: []

key-decisions:
  - "Indonesian national IDs validated with regex check constraints (NPSN: 8 digits, NISN: 10, NIP: 18, NUPTK: 16)"
  - "Kurikulum Merdeka P5 projects use 8 themes with descriptive assessment scale (sangat_baik, baik, cukup, perlu_bimbingan)"
  - "All tables use identity columns with GENERATED ALWAYS AS IDENTITY for PostgreSQL 17 compatibility"
  - "JSONB metadata columns on all tables for flexible schema evolution"
  - "Automatic updated_at triggers on all 24 tables for change tracking"
  - "Views for common queries (active_students_details, teacher_workload)"
  - "Foreign keys use CASCADE for dependent data, SET NULL for optional references"

patterns-established:
  - "Pattern 1: National ID validation using PostgreSQL check constraints with regex (~ operator)"
  - "Pattern 2: Flexible metadata storage using JSONB DEFAULT '{}' for schema-less attributes"
  - "Pattern 3: Automatic timestamp updates using BEFORE UPDATE triggers"
  - "Pattern 4: Enum types for status fields ensuring type safety (gender_type, student_status, etc.)"
  - "Pattern 5: Descriptive assessment scales using enum instead of numeric scores (P5 assessments)"
  - "Pattern 6: Junction tables for many-to-many relationships (class_teachers, enrollments, etc.)"

# Metrics
duration: 2min
completed: 2026-01-18
---

# Phase 14: Plan 08 - School ERP DDL Schema Summary

**PostgreSQL 17 DDL with 24 tables for Indonesian school management including Kurikulum Merdeka P5 projects, national ID validation, and comprehensive domain coverage**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-18T05:02:18Z
- **Completed:** 2026-01-18T05:04:50Z
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments

- Created comprehensive School ERP DDL with 24 tables covering students, teachers, classes, subjects, enrollments, attendance, grades, fees, and administrative functions
- Implemented Indonesian national ID validation (NPSN, NISN, NIP, NUPTK) with regex check constraints
- Added Kurikulum Merdeka P5 project support with 8 themes and descriptive grading scale
- Used PostgreSQL 17 features: identity columns, JSONB metadata, array types, 19 custom enums, check constraints
- Created 87 indexes on foreign keys and frequently queried columns
- Added 24 triggers for automatic updated_at timestamps
- Documented complete schema with relationships, domain knowledge, and usage instructions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create School ERP DDL with core student and teacher tables** - `ac753e0` (feat)
2. **Task 2: Document School ERP schema structure** - `fc37bcb` (docs)

**Plan metadata:** (to be committed after SUMMARY.md creation)

## Files Created/Modified

- `scripts/seeds/school-erp.ddl` - PostgreSQL 17 DDL with 24 tables, 762 lines, complete Indonesian school management schema
- `scripts/seeds/README.md` - Comprehensive documentation with table descriptions, relationships, domain knowledge, usage instructions

## Decisions Made

- **Indonesian national ID format validation**: Used regex check constraints to validate NPSN (8 digits), NISN (10), NIP (18), NUPTK (16) ensuring data quality
- **Kurikulum Merdeka P5 themes**: Selected 8 official P5 themes (kebinekaan, gotong_royong, berkarya, berdoa, sehat, sadar_budaya, kreatif, rekat) for authentic Indonesian curriculum support
- **Descriptive grading for P5**: Used enum-based assessment scale (sangat_baik, baik, cukup, perlu_bimbingan) instead of numeric scores to match Kurikulum Merdeka methodology
- **JSONB metadata on all tables**: Added flexible JSONB columns to enable schema evolution without DDL changes
- **Automatic updated_at triggers**: Implemented trigger function for all 24 tables to track record modification timestamps automatically
- **Foreign key cascade strategy**: Used CASCADE for dependent data (enrollments, grades) and SET NULL for optional references (parent_id, teacher_id) to maintain referential integrity
- **Junction table naming**: Used descriptive names (class_teachers, subject_teachers) following PostgreSQL conventions for many-to-many relationships

## Deviations from Plan

None - plan executed exactly as written. All 24 tables created with proper constraints, indexes, and relationships. No auto-fixes or blocking issues encountered.

## Issues Encountered

None - DDL creation and documentation completed without issues. All PostgreSQL 17 syntax validated successfully.

## User Setup Required

None - no external service configuration required. DDL can be loaded into existing PostgreSQL 17 database using:

```bash
psql -h localhost -p 5433 -U postgres -d school_erp -f scripts/seeds/school-erp.ddl
```

Or via Docker Compose from project root:

```bash
docker exec -i convex-poc-postgres-1 psql -U postgres -d school_erp < scripts/seeds/school-erp.ddl
```

## Next Phase Readiness

**Ready for Plan 14-09 (DDL Parser Implementation):**

- School ERP DDL provides comprehensive test case with 24 tables
- Demonstrates all PostgreSQL 17 features to parse: identity columns, JSONB, arrays, enums, check constraints
- Indonesian national ID validation rules provide edge case validation for parser
- 19 custom enums test enum extraction and type mapping
- 87 indexes and 39 foreign keys test relationship parsing

**What's ready:**
- Complete DDL file at `scripts/seeds/school-erp.ddl` (762 lines)
- Comprehensive documentation at `scripts/seeds/README.md` (352 lines)
- Schema structure for seed data generation (Plan 14-10)
- Domain knowledge for CRUD template development (Plan 14-11)

**Potential concerns for next phases:**
- **Phase 14-09**: DDL parser must handle Indonesian language values in enums and check constraints (e.g., 'Laki-laki', 'Perempuan', 'aktif', 'non-aktif')
- **Phase 14-09**: Array columns (phone_numbers[], attachments[], affected_classes[]) need proper parsing
- **Phase 14-09**: Trigger function definitions and view definitions may need separate handling from table definitions
- **Phase 14-10**: Seed data generation must respect national ID validation rules (10-digit NISN, 18-digit NIP, etc.)
- **Phase 14-10**: P5 project seed data must use valid themes and descriptive assessments

**No blockers** - all deliverables complete and ready for next plan execution.

---
*Phase: 14-template-system*
*Plan: 08*
*Completed: 2026-01-18*
