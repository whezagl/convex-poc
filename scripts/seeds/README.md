# School ERP Database Schema

## Overview

This schema supports Indonesian school management with full Kurikulum Merdeka curriculum support. It defines 24 tables covering student records, teacher management, class assignments, attendance tracking, grading (including P5 projects), fee management, and user accounts for portal access.

**Purpose**: This DDL serves as the test case for DDL parser validation (Plan 14-09) and provides realistic domain schema for seed data generation.

**Target Database**: PostgreSQL 17

## Tables (24 total)

### Core Tables (1-8)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `schools` | School information with NPSN (8-digit national school ID) | npsn, name, address, accreditation |
| `students` | Student records with NISN (10-digit national student ID) | nisn, name, birth_date, enrollment_status |
| `teachers` | Teacher records with NIP (18-digit) and NUPTK (16-digit) | nip, nuptk, name, subject, employment_status |
| `parents` | Parent/guardian information with NIK (16-digit) | nik, name, relationship, phone |
| `admins` | School admin staff | name, role, email, school_id |
| `classes` | Class/group definitions | name, grade_level, academic_year, homeroom_teacher_id |
| `subjects` | Subject offerings | code, name, curriculum_type, hours_per_week |
| `class_teachers` | Junction table for teacher-class assignments | class_id, teacher_id, role |

### Academic Tables (9-14)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `enrollments` | Student-class enrollment records | student_id, class_id, academic_year, semester |
| `subject_teachers` | Teacher-subject assignments | teacher_id, subject_id, academic_year |
| `class_subjects` | Subject offerings per class | class_id, subject_id, teacher_id, schedule |
| `schedules` | Class schedule/time assignments | class_subject_id, day, start_time, end_time |
| `attendance` | Student attendance records | student_id, class_id, date, status |
| `grade_components` | Grading criteria (assignments, exams, projects) | subject_id, class_id, name, weight |

### Assessment Tables (15-18)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `grades` | Student grade records per component | student_id, component_id, score |
| `p5_projects` | Kurikulum Merdeka P5 project definitions | name, theme, duration_weeks, class_id |
| `p5_enrollments` | Student participation in P5 projects | project_id, student_id, group_number |
| `p5_assessments` | P5 descriptive grading | enrollment_id, dimension, assessment |

### Administrative Tables (19-24)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `fees` | Student fee records (tuition, books, uniforms) | student_id, fee_type, amount, due_date |
| `fee_payments` | Payment transaction records | fee_id, amount, payment_method, receipt_number |
| `announcements` | School announcements and notices | title, content, announcement_type, priority |
| `events` | School calendar events | title, event_type, start_date, end_date |
| `documents` | Document storage (reports, certificates) | student_id, document_type, file_url |
| `user_accounts` | System user accounts for portal access | username, email, password_hash, user_role |

## Relationships

```
students (1) ----< (N) enrollments >---- (1) classes
students (N) ----< (1) parents
students (1) ----< (N) grades >---- (N) grade_components
students (1) ----< (N) attendance
students (1) ----< (N) fees >---- (N) fee_payments
students (1) ----< (N) p5_enrollments >---- (1) p5_projects
students (1) ----< (N) p5_assessments
students (1) ----< (N) documents

teachers (1) ----< (N) class_teachers >---- (1) classes
teachers (1) ----< (N) subject_teachers >---- (1) subjects
teachers (1) ----< (N) class_subjects
teachers (1) ----< (N) p5_projects

classes (1) ----< (N) enrollments >---- (1) students
classes (1) ----< (N) class_teachers >---- (1) teachers
classes (1) ----< (N) class_subjects >---- (1) subjects
classes (1) ----< (N) attendance
classes (1) ----< (N) grade_components
classes (1) ----< (N) p5_projects

subjects (1) ----< (N) subject_teachers >---- (1) teachers
subjects (1) ----< (N) class_subjects >---- (1) classes
subjects (1) ----< (N) grade_components

schools (1) ----< (N) classes
schools (1) ----< (N) admins
schools (1) ----< (N) announcements
schools (1) ----< (N) events

p5_projects (1) ----< (N) p5_enrollments >---- (1) students
p5_projects (1) ----< (N) p5_assessments >---- (1) p5_enrollments

fees (1) ----< (N) fee_payments
```

## National ID Validation

Indonesian national identification fields are validated with check constraints:

| Field | Full Name | Format | Validation |
|-------|-----------|--------|------------|
| `npsn` | Nomor Pokok Sekolah Nasional | 8 digits | `^[0-9]{8}$` |
| `nisn` | Nomor Induk Siswa Nasional | 10 digits | `^[0-9]{10}$` |
| `nip` | Nomor Induk Pegawai | 18 digits | `^[0-9]{18}$` |
| `nuptk` | Nomor Unik Pendidik dan Tenaga Kependidikan | 16 digits | `^[0-9]{16}$` |
| `nik` | Nomor Induk Kependudukan | 16 digits | `^[0-9]{16}$` |

**Examples:**
- NPSN: `12345678`
- NISN: `0012345678`
- NIP: `198001012005011001` (format: YYYYMMDDXXXXXXX)
- NUPTK: `1234567890123456`
- NIK: `3201010101900001` (format: province(2) + regency(2) + district(2) + birth date(6) + sequence(4))

## P5 Projects (Kurikulum Merdeka)

P5 (Projek Penguatan Profil Pelajar Pancasila) is project-based learning in Indonesia's Kurikulum Merdeka curriculum.

### Themes (8 themes)

- `kebinekaan` - Diversity and pluralism
- `gotong_royong` - Mutual cooperation
- `berkarya` - Creativity and entrepreneurship
- `berdoa` - Spiritual devotion
- `sehat` - Health and wellness
- `sadar_budaya` - Cultural awareness
- `kreatif` - Creative thinking
- `rekat` - Social cohesion

### Assessment Scale (descriptive, not numeric)

- `sangat_baik` - Excellent (exceeds expectations)
- `baik` - Good (meets expectations)
- `cukup` - Sufficient (meets minimum standards)
- `perlu_bimbingan` - Needs guidance (below expectations)

**Example P5 Project:**
```sql
INSERT INTO p5_projects (name, theme, duration_weeks, academic_year, semester, class_id, start_date, end_date)
VALUES ('Kerajinan Daur Ulang', 'kreatif', 4, '2024/2025', 1, 1, '2024-08-01', '2024-08-29');
```

## PostgreSQL 17 Features Used

### 1. Identity Columns
Auto-incrementing primary keys using `GENERATED ALWAYS AS IDENTITY`:
```sql
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
```

### 2. JSONB Columns
Flexible metadata storage for schema-less attributes:
```sql
metadata JSONB DEFAULT '{}'
```

### 3. Array Types
Multiple values in single column:
```sql
phone_numbers VARCHAR(20)[],      -- Multiple phone numbers
learning_objectives TEXT[],        -- Multiple learning objectives
attachments TEXT[],                -- Multiple file URLs
affected_classes INT[]             -- Multiple class IDs
```

### 4. Custom Enums
Type-safe enumerated values:
```sql
CREATE TYPE gender_type AS ENUM ('Laki-laki', 'Perempuan');
CREATE TYPE student_status AS ENUM ('aktif', 'non-aktif', 'lulus', 'keluar');
CREATE TYPE p5_theme AS ENUM ('kebinekaan', 'gotong_royong', 'berkarya', ...);
```

### 5. Check Constraints
Data validation using regex patterns:
```sql
CHECK (nisn ~ '^[0-9]{10}$')           -- NISN must be 10 digits
CHECK (end_date > start_date)          -- Logical date validation
CHECK (current_enrollment <= capacity) -- Business rule validation
```

### 6. Foreign Key Constraints
Referential integrity with cascading actions:
```sql
parent_id BIGINT REFERENCES parents(id) ON DELETE SET NULL
class_id BIGINT REFERENCES classes(id) ON DELETE CASCADE
```

### 7. Triggers
Automatic timestamp updates:
```sql
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 8. Views
Pre-computed common queries:
```sql
CREATE VIEW active_students_details AS ...
CREATE VIEW teacher_workload AS ...
```

## Indexes

Indexes are created on:

- **All national ID fields**: `npsn`, `nisn`, `nip`, `nuptk`, `nik`
- **Foreign key columns**: All `*_id` columns
- **Frequently queried fields**: `status`, `academic_year`, `date`, `email`
- **Search fields**: `name`, `phone`

**Index examples:**
```sql
CREATE INDEX idx_students_nisn ON students(nisn);
CREATE INDEX idx_students_status ON students(enrollment_status);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_fees_due_date ON fees(due_date);
```

## Usage Instructions

### Load DDL into PostgreSQL

**Using psql command line:**
```bash
psql -h localhost -p 5433 -U postgres -d school_erp -f scripts/seeds/school-erp.ddl
```

**Using Docker Compose (from project root):**
```bash
# Start PostgreSQL
docker-compose -f docker-compose.dev.yml up -d postgres

# Load DDL
docker exec -i convex-poc-postgres-1 psql -U postgres -d school_erp < scripts/seeds/school-erp.ddl
```

**Verify database creation:**
```bash
# Connect to database
psql -h localhost -p 5433 -U postgres -d school_erp

# Check tables
\dt

# Count tables
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Should return 24

# Check enums
SELECT typname FROM pg_type WHERE typtype = 'e';
```

## Seed Data Generation

After loading the DDL, generate seed data using the npm script (Plan 14-09):

```bash
npm run seeds
```

This will:
1. Parse the DDL to extract table structures
2. Generate realistic Indonesian school data
3. Insert seed data into all 24 tables
4. Validate referential integrity

## Domain Knowledge

### School Levels

Common Indonesian school levels:
- `SD` - Sekolah Dasar (Grades 1-6)
- `SMP` - Sekolah Menengah Pertama (Grades 7-9)
- `SMA` - Sekolah Menengah Atas (Grades 10-12)
- `SMK` - Sekolah Menengah Kejuruan (Vocational, Grades 10-12)

### Academic Calendar

- **Academic Year Format**: `2024/2025` (July - June)
- **Semesters**: `1` (Ganjil, July-December), `2` (Genap, January-June)
- **Schedule Days**: `Senin`, `Selasa`, `Rabu`, `Kamis`, `Jumat`, `Sabtu`

### Employment Types

- `PNS` - Pegawai Negeri Sipil (Civil servant)
- `PPPK` - Pegawai Pemerintah dengan Perjanjian Kerja (Contract government employee)
- `Honorer` - Honorary staff
- `Kontrak` - Contract employee

### Common Subjects

- `MAT` - Matematika (Mathematics)
- `BIN` - Bahasa Indonesia (Indonesian Language)
- `ING` - Bahasa Inggris (English)
- `IPA` - Ilmu Pengetahuan Alam (Natural Sciences)
- `IPS` - Ilmu Pengetahuan Sosial (Social Sciences)
- `PAI` - Pendidikan Agama Islam (Islamic Education)
- `PKN` - Pendidikan Kewarganegaraan (Civic Education)

## Data Constraints

### Business Rules

- Class capacity cannot be exceeded
- End dates must be after start dates
- NISN, NIP, NUPTK must match digit requirements
- Grade scores must be within component max_score
- P5 assessment dimensions must be unique per enrollment
- User accounts lock after 5 failed login attempts

### Referential Integrity

- Students must have parent (optional but recommended)
- Teachers must be assigned to classes/subjects
- Enrollments require valid student and class
- Fees require valid student
- Payments require valid fee record
- All foreign keys use CASCADE or SET NULL appropriately

## Schema Statistics

- **Total Tables**: 24
- **Core Tables**: 8
- **Academic Tables**: 6
- **Assessment Tables**: 4
- **Administrative Tables**: 6
- **Custom Enums**: 19
- **Indexes**: 70+
- **Foreign Keys**: 40+
- **Views**: 2
- **Triggers**: 24 (one per table for updated_at)
- **Lines of DDL**: 762

## Next Steps

1. **Plan 14-09**: Implement DDL parser to extract schema structure
2. **Plan 14-10**: Generate seed data for all 24 tables
3. **Plan 14-11**: Validate seed data quality and relationships

## References

- **Kurikulum Merdeka**: https://kurikulum.kemdikbud.go.id/
- **P5 Projects**: Projek Penguatan Profil Pelajar Pancasila
- **PostgreSQL 17 Docs**: https://www.postgresql.org/docs/17/

---

**File**: `scripts/seeds/school-erp.ddl`
**Created**: 2026-01-18
**Database**: PostgreSQL 17
**Schema Version**: 1.0
