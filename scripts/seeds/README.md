# School ERP Seed Data Generator

Generates realistic seed data for Indonesian schools using @faker-js/faker with Indonesian locale.

## Usage

Generate seed data and save to SQL file:

```bash
npm run seeds > scripts/seeds/data.sql
```

Load seed data into PostgreSQL:

```bash
psql -h localhost -p 5433 -U postgres -d school_erp -f scripts/seeds/data.sql
```

Or via Docker Compose:

```bash
docker exec -i convex-poc-postgres-1 psql -U postgres -d school_erp < scripts/seeds/data.sql
```

## Generated Data

| Table | Records | Description |
|-------|---------|-------------|
| schools | 1 | School information with NPSN (8-digit ID) |
| students | 100 | Student records with NISN (10-digit ID) |
| teachers | 20 | Teacher records with NIP (18-digit) and NUPTK (16-digit) |
| parents | 100 | Parent/guardian information |
| admins | 5 | School admin staff |
| classes | 30 | Class definitions (X, XI, XII with majors) |
| subjects | 15 | Subject offerings with Indonesian names |
| class_teachers | 20 | Teacher-class assignments (wali kelas) |
| subject_teachers | 20 | Teacher-subject assignments |
| class_subjects | 50 | Subject offerings per class with schedules |
| enrollments | 100 | Student-class enrollments |
| p5_projects | 10 | Kurikulum Merdeka P5 projects |
| p5_enrollments | 200 | Student participation in P5 projects |
| p5_assessments | 800+ | P5 descriptive grading records |
| attendance | 15,000 | Student attendance records |
| grade_components | 1,800 | Grading criteria (tugas, UTS, UAS, proyek, partisipasi) |
| grades | 180,000 | Student grade records |
| fees | 400 | Student fee records (SPP, uang buku, uang seragam, etc.) |
| fee_payments | 280 | Payment transaction records |
| user_accounts | 50 | System user accounts for portal access |
| announcements | 20 | School announcements and notices |
| events | 15 | School calendar events |
| documents | 50 | Document storage (rapor, sertifikat, ijazah) |

## Indonesian Domain Specifics

### National IDs

- **NISN**: 10 digits (Nomor Induk Siswa Nasional) - National Student ID
- **NIP**: 18 digits (Nomor Induk Pegawai) - Civil Servant ID for teachers/admins
- **NUPTK**: 16 digits (Nomor Unik Pendidik dan Tenaga Kependidikan) - Unique Educator ID
- **NPSN**: 8 digits (Nomor Pokok Sekolah Nasional) - National School ID
- **NIK**: 16 digits (Nomor Induk Kependudukan) - National Population ID for parents

All national IDs are validated using digit count validation in the DDL:

```sql
CHECK (nisn ~ '^[0-9]{10}$')  -- NISN must be 10 digits
CHECK (nip ~ '^[0-9]{18}$')   -- NIP must be 18 digits
CHECK (nuptk ~ '^[0-9]{16}$') -- NUPTK must be 16 digits
```

### Kurikulum Merdeka P5 Projects

P5 (Projek Penguatan Profil Pelajar Pancasila) is a core component of Indonesia's Kurikulum Merdeka curriculum.

**P5 Themes:**
- kebinekaan (diversity)
- gotong_royong (mutual cooperation)
- berkarya (creativity)
- berdoa (prayer)
- sehat (health)
- sadar_budaya (cultural awareness)
- kreatif (creative)
- rekat (cohesion)

### Descriptive Grading

P5 assessments use descriptive grading (not numeric scores):

- **sangat_baik** (very good) - Exceeds expectations
- **baik** (good) - Meets expectations
- **cukup** (sufficient) - Adequate performance
- **perlu_bimbingan** (needs guidance) - Requires improvement

This aligns with Kurikulum Merdeka's emphasis on qualitative assessment over quantitative scores.

### Indonesian Language Values

The generator uses Indonesian language for:

- **Gender**: Laki-laki (Male), Perempuan (Female)
- **Religion**: Islam, Kristen, Katolik, Hindu, Buddha, Konghucu, Lainnya
- **Student Status**: aktif (active), non-aktif (inactive), lulus (graduated), keluar (left)
- **Teacher Status**: aktif, non-aktif, pensiun (retired), cuti (leave)
- **Employment Type**: pns (civil servant), pppk (contract civil servant), honorer (honorary), kontrak (contract)
- **Parent Relationship**: ayah (father), ibu (mother), wali (guardian), lainnya (other)
- **Days**: Senin (Monday), Selasa (Tuesday), Rabu (Wednesday), Kamis (Thursday), Jumat (Friday), Sabtu (Saturday)
- **Subjects**: Matematika, Bahasa Indonesia, Bahasa Inggris, IPA, IPS, PKN, Seni Budaya, PJOK, TIK
- **Fee Types**: spp (tuition), uang_buku (book fees), uang_seragam (uniform fees), uang_kegiatan (activity fees)

## Data Quality

All generated data:

- Uses Indonesian names, addresses, phone numbers via @faker-js/faker locale `id_ID`
- Validates national ID digit counts (NISN=10, NIP=18, NUPTK=16, NPSN=8, NIK=16)
- Respects foreign key relationships (enrollments link to students/classes, etc.)
- Generates realistic dates and values (birth dates, hire dates, due dates)
- Uses Indonesian language for enum values matching the DDL schema
- Handles PostgreSQL array types (phone_parents[], learning_objectives[])
- Generates proper academic year format (2024/2025)

## Architecture

The seed generator consists of:

1. **Data Generators**: Functions for each table type (schools, students, teachers, etc.)
2. **Relationship Generator**: Creates foreign key relationships between tables
3. **SQL Generator**: Converts JavaScript objects to SQL INSERT statements
4. **Indonesian Locale**: @faker-js/faker configured with `faker.locale = 'id_ID'`

## Customization

Edit `scripts/seeds/generate-seeds.ts` to adjust:

- Number of records per table (change parameters in generator calls)
- Data generation patterns (modify faker method calls)
- Validation rules (add custom validation logic)
- Foreign key relationships (adjust relationship generation)
- Date ranges (modify faker.date.*() calls)

## DDL Integration

This script is designed to work with the School ERP DDL schema at `scripts/seeds/school-erp.ddl`.

The DDL defines:
- 24 tables with proper constraints and indexes
- 19 custom enums for type safety
- 87 indexes for query performance
- 39 foreign key relationships
- Automatic updated_at triggers on all tables
- JSONB metadata columns for flexible schema evolution

## Dependencies

- **@faker-js/faker** (v10.1.0+) - Data generation with Indonesian locale support
- **@convex-poc/template-engine** - DDL parser for schema-aware generation (planned)
- **tsx** - TypeScript execution

## Examples

### Generate seeds for all tables (default):

```bash
npm run seeds > scripts/seeds/data.sql
```

### Load seeds into database:

```bash
# Using psql directly
psql -h localhost -p 5433 -U postgres -d school_erp -f scripts/seeds/data.sql

# Using Docker Compose
docker exec -i convex-poc-postgres-1 psql -U postgres -d school_erp < scripts/seeds/data.sql
```

### Verify data loaded:

```sql
-- Check record counts
SELECT 'schools' as table_name, COUNT(*) FROM schools
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'teachers', COUNT(*) FROM teachers
UNION ALL
SELECT 'classes', COUNT(*) FROM classes
UNION ALL
SELECT 'p5_projects', COUNT(*) FROM p5_projects;

-- Check Indonesian locale data
SELECT name, city FROM schools LIMIT 5;
SELECT name, gender, religion FROM students LIMIT 5;
SELECT name, subject FROM teachers LIMIT 5;
```

## Notes

- All phone numbers are formatted for Indonesian locale (+62 country code)
- Addresses use Indonesian city names and street formats
- Names follow Indonesian naming conventions
- Email addresses use realistic Indonesian domains
- Academic years follow Indonesian format (2024/2025)
- Semester values are 1 (Ganjil) or 2 (Genap)
- All dates are in ISO 8601 format (YYYY-MM-DD)

## License

MIT
