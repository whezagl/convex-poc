-- School ERP Database Schema
-- Indonesian School Management System with Kurikulum Merdeka Support
-- PostgreSQL 17 Compatible
--
-- This schema defines 24 tables for comprehensive school management including:
-- - Student and teacher records with national ID validation (NISN, NIP, NUPTK)
-- - Class and subject management
-- - Attendance and grading systems
-- - Kurikulum Merdeka P5 projects with descriptive assessment
-- - Fee management and payment tracking
-- - User accounts for portal access
--
-- Usage: psql -h localhost -p 5433 -U postgres -d school_erp -f scripts/seeds/school-erp.ddl
--

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Enums for Indonesian School Domain
CREATE TYPE gender_type AS ENUM ('Laki-laki', 'Perempuan');
CREATE TYPE religion_type AS ENUM ('Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya');
CREATE TYPE student_status AS ENUM ('aktif', 'non-aktif', 'lulus', 'keluar');
CREATE TYPE teacher_status AS ENUM ('aktif', 'non-aktif', 'pensiun', 'cuti');
CREATE TYPE employment_type AS ENUM ('pns', 'pppk', 'honorer', 'kontrak');
CREATE TYPE parent_relationship AS ENUM ('ayah', 'ibu', 'wali', 'lainnya');
CREATE TYPE admin_role AS ENUM ('kepala_sekolah', 'wakil_kepala', 'tata_usaha', 'bendahara', 'lainnya');
CREATE TYPE curriculum_type AS ENUM ('kurikulum_merdeka', 'kurikulum_2013', 'lainnya');
CREATE TYPE p5_theme AS ENUM ('kebinekaan', 'gotong_royong', 'berkarya', 'berdoa', 'sehat', 'sadar_budaya', 'kreatif', 'rekat');
CREATE TYPE p5_assessment AS ENUM ('sangat_baik', 'baik', 'cukup', 'perlu_bimbingan');
CREATE TYPE attendance_status AS ENUM ('hadir', 'izin', 'sakit', 'alpha');
CREATE TYPE grade_component_type AS ENUM ('tugas', 'uts', 'uas', 'proyek', 'partisipasi', 'lainnya');
CREATE TYPE fee_type AS ENUM ('spp', 'uang_buku', 'uang_seragam', 'uang_kegiatan', 'lainnya');
CREATE TYPE payment_status AS ENUM ('pending', 'lunas', 'cicilan', 'terlambat');
CREATE TYPE payment_method AS ENUM ('tunai', 'transfer', 'qris', 'lainnya');
CREATE TYPE user_role AS ENUM ('admin', 'guru', 'siswa', 'ortu', 'lainnya');
CREATE TYPE user_account_status AS ENUM ('aktif', 'non-aktif', 'terkunci', 'menunggu_konfirmasi');
CREATE TYPE announcement_type AS ENUM('umum', 'guru', 'siswa', 'ortu');
CREATE TYPE event_type AS ENUM('akademik', 'non_akademik', 'libur', 'rapat', 'lainnya');
CREATE TYPE document_type AS ENUM('rapor', 'sertifikat', 'ijazah', 'lainnya');

-- ============================================
-- CORE TABLES (1-8)
-- ============================================

-- 1. Schools table - School information with NPSN (National School ID)
CREATE TABLE schools (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    npsn VARCHAR(8) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    province VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    accreditation VARCHAR(5) CHECK (accreditation IN ('A', 'B', 'C', 'Terakreditasi')),
    school_level VARCHAR(50) NOT NULL, -- SD, SMP, SMA, SMK, etc.
    founded_date DATE,
    principal_name VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schools_npsn ON schools(npsn);
CREATE INDEX idx_schools_city ON schools(city);
CREATE INDEX idx_schools_level ON schools(school_level);

-- 2. Students table - Student records with NISN (National Student ID)
CREATE TABLE students (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nisn VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    gender gender_type NOT NULL,
    religion religion_type,
    address TEXT,
    phone VARCHAR(20),
    phone_parents VARCHAR(20)[], -- Array for multiple parent contacts
    email VARCHAR(255),
    enrollment_status student_status DEFAULT 'aktif',
    parent_id BIGINT REFERENCES parents(id) ON DELETE SET NULL,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    graduation_date DATE,
    photo_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (nisn ~ '^[0-9]{10}$') -- NISN must be 10 digits
);

CREATE INDEX idx_students_nisn ON students(nisn);
CREATE INDEX idx_students_status ON students(enrollment_status);
CREATE INDEX idx_students_parent ON students(parent_id);
CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_students_enrollment_date ON students(enrollment_date);

-- 3. Teachers table - Teacher records with NIP and NUPTK
CREATE TABLE teachers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nip VARCHAR(18) UNIQUE NOT NULL,
    nuptk VARCHAR(16),
    name VARCHAR(255) NOT NULL,
    gender gender_type NOT NULL,
    birth_date DATE NOT NULL,
    religion religion_type,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    subject VARCHAR(100),
    employment_status teacher_status DEFAULT 'aktif',
    employment_type employment_type,
    hire_date DATE NOT NULL,
    retirement_date DATE,
    education_level VARCHAR(50), -- S1, S2, S3, etc.
    major VARCHAR(100),
    certification_number VARCHAR(50), -- Sertifikasi guru
    photo_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (nip ~ '^[0-9]{18}$'), -- NIP must be 18 digits
    CHECK (nuptk IS NULL OR nuptk ~ '^[0-9]{16}$') -- NUPTK must be 16 digits if provided
);

CREATE INDEX idx_teachers_nip ON teachers(nip);
CREATE INDEX idx_teachers_nuptk ON teachers(nuptk);
CREATE INDEX idx_teachers_status ON teachers(employment_status);
CREATE INDEX idx_teachers_subject ON teachers(subject);
CREATE INDEX idx_teachers_email ON teachers(email);

-- 4. Parents table - Parent/guardian information
CREATE TABLE parents (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nik VARCHAR(16) UNIQUE, -- Nomor Induk Kependudukan
    name VARCHAR(255) NOT NULL,
    relationship parent_relationship NOT NULL,
    phone VARCHAR(20) NOT NULL,
    phone_alternative VARCHAR(20),
    email VARCHAR(255),
    occupation VARCHAR(100),
    workplace VARCHAR(255),
    address TEXT,
    emergency_contact BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (nik IS NULL OR nik ~ '^[0-9]{16}$') -- NIK must be 16 digits if provided
);

CREATE INDEX idx_parents_phone ON parents(phone);
CREATE INDEX idx_parents_emergency ON parents(emergency_contact);
CREATE INDEX idx_parents_nik ON parents(nik);

-- 5. Admins table - School admin staff
CREATE TABLE admins (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nip VARCHAR(18) UNIQUE,
    name VARCHAR(255) NOT NULL,
    role admin_role NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    school_id BIGINT REFERENCES schools(id) ON DELETE CASCADE,
    employment_status teacher_status DEFAULT 'aktif',
    hire_date DATE NOT NULL,
    photo_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (nip IS NULL OR nip ~ '^[0-9]{18}$')
);

CREATE INDEX idx_admins_school ON admins(school_id);
CREATE INDEX idx_admins_role ON admins(role);
CREATE INDEX idx_admins_email ON admins(email);

-- 6. Classes table - Class/group definitions
CREATE TABLE classes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- e.g., "X-A", "XI-IPA-1"
    grade_level INT NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
    academic_year VARCHAR(9) NOT NULL, -- Format: 2024/2025
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    school_id BIGINT REFERENCES schools(id) ON DELETE CASCADE,
    homeroom_teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
    room_number VARCHAR(20),
    capacity INT DEFAULT 32 CHECK (capacity > 0),
    current_enrollment INT DEFAULT 0 CHECK (current_enrollment >= 0),
    curriculum_type curriculum_type DEFAULT 'kurikulum_merdeka',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (current_enrollment <= capacity),
    UNIQUE (name, academic_year, semester)
);

CREATE INDEX idx_classes_academic_year ON classes(academic_year);
CREATE INDEX idx_classes_grade ON classes(grade_level);
CREATE INDEX idx_classes_school ON classes(school_id);
CREATE INDEX idx_classes_homeroom ON classes(homeroom_teacher_id);

-- 7. Subjects table - Subject offerings
CREATE TABLE subjects (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL, -- e.g., "MAT", "BIN", "IPA"
    name VARCHAR(255) NOT NULL,
    name_english VARCHAR(255),
    curriculum_type curriculum_type DEFAULT 'kurikulum_merdeka',
    grade_level INT, -- NULL for all levels, specific number for particular grade
    hours_per_week INT DEFAULT 2 CHECK (hours_per_week > 0),
    is_mandatory BOOLEAN DEFAULT true,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subjects_code ON subjects(code);
CREATE INDEX idx_subjects_curriculum ON subjects(curriculum_type);
CREATE INDEX idx_subjects_grade ON subjects(grade_level);

-- 8. Class Teachers table - Junction table for teacher-class assignments
CREATE TABLE class_teachers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id BIGINT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'wali_kelas', -- wali_kelas, wakil_wali, etc.
    academic_year VARCHAR(9) NOT NULL,
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (class_id, teacher_id, academic_year, semester)
);

CREATE INDEX idx_class_teachers_class ON class_teachers(class_id);
CREATE INDEX idx_class_teachers_teacher ON class_teachers(teacher_id);
CREATE INDEX idx_class_teachers_year ON class_teachers(academic_year);

-- ============================================
-- ACADEMIC TABLES (9-14)
-- ============================================

-- 9. Enrollments table - Student-class enrollment records
CREATE TABLE enrollments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    academic_year VARCHAR(9) NOT NULL,
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    enrollment_status student_status DEFAULT 'aktif',
    remarks TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, class_id, academic_year, semester)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_class ON enrollments(class_id);
CREATE INDEX idx_enrollments_year ON enrollments(academic_year);
CREATE INDEX idx_enrollments_status ON enrollments(enrollment_status);

-- 10. Subject Teachers table - Teacher-subject assignments
CREATE TABLE subject_teachers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    academic_year VARCHAR(9) NOT NULL,
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (teacher_id, subject_id, academic_year, semester)
);

CREATE INDEX idx_subject_teachers_teacher ON subject_teachers(teacher_id);
CREATE INDEX idx_subject_teachers_subject ON subject_teachers(subject_id);
CREATE INDEX idx_subject_teachers_year ON subject_teachers(academic_year);

-- 11. Class Subjects table - Subject offerings per class
CREATE TABLE class_subjects (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
    academic_year VARCHAR(9) NOT NULL,
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    schedule_day VARCHAR(20), -- Senin, Selasa, etc.
    schedule_time TIME,
    schedule_room VARCHAR(20),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (class_id, subject_id, academic_year, semester)
);

CREATE INDEX idx_class_subjects_class ON class_subjects(class_id);
CREATE INDEX idx_class_subjects_subject ON class_subjects(subject_id);
CREATE INDEX idx_class_subjects_teacher ON class_subjects(teacher_id);

-- 12. Schedules table - Class schedule/time assignments
CREATE TABLE schedules (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    class_subject_id BIGINT NOT NULL REFERENCES class_subjects(id) ON DELETE CASCADE,
    day VARCHAR(20) NOT NULL, -- Senin, Selasa, Rabu, Kamis, Jumat, Sabtu
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(20),
    academic_year VARCHAR(9) NOT NULL,
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time)
);

CREATE INDEX idx_schedules_class_subject ON schedules(class_subject_id);
CREATE INDEX idx_schedules_day ON schedules(day);
CREATE INDEX idx_schedules_year ON schedules(academic_year);

-- 13. Attendance table - Student attendance records
CREATE TABLE attendance (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    notes TEXT,
    recorded_by BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
    academic_year VARCHAR(9) NOT NULL,
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, class_id, date)
);

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_class ON attendance(class_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_year ON attendance(academic_year);

-- 14. Grade Components table - Grading criteria
CREATE TABLE grade_components (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- e.g., "Tugas Harian 1", "UTS Semester Ganjil"
    component_type grade_component_type NOT NULL,
    weight DECIMAL(5,2) NOT NULL CHECK (weight > 0 AND weight <= 100),
    max_score DECIMAL(5,2) DEFAULT 100.00 CHECK (max_score > 0),
    academic_year VARCHAR(9) NOT NULL,
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    due_date DATE,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_grade_components_subject ON grade_components(subject_id);
CREATE INDEX idx_grade_components_class ON grade_components(class_id);
CREATE INDEX idx_grade_components_year ON grade_components(academic_year);
CREATE INDEX idx_grade_components_type ON grade_components(component_type);

-- ============================================
-- ASSESSMENT TABLES (15-18)
-- ============================================

-- 15. Grades table - Student grade records per component
CREATE TABLE grades (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    component_id BIGINT NOT NULL REFERENCES grade_components(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL CHECK (score >= 0),
    notes TEXT,
    graded_by BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
    graded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    academic_year VARCHAR(9) NOT NULL,
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, component_id)
);

CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_component ON grades(component_id);
CREATE INDEX idx_grades_year ON grades(academic_year);

-- 16. P5 Projects table - Kurikulum Merdeka P5 project definitions
CREATE TABLE p5_projects (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    theme p5_theme NOT NULL,
    description TEXT,
    duration_weeks INT NOT NULL CHECK (duration_weeks > 0),
    academic_year VARCHAR(9) NOT NULL,
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    class_id BIGINT REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    learning_objectives TEXT[],
    assessment_criteria JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date > start_date)
);

CREATE INDEX idx_p5_class ON p5_projects(class_id);
CREATE INDEX idx_p5_academic_year ON p5_projects(academic_year);
CREATE INDEX idx_p5_theme ON p5_projects(theme);
CREATE INDEX idx_p5_teacher ON p5_projects(teacher_id);

-- 17. P5 Enrollments table - Student participation in P5 projects
CREATE TABLE p5_enrollments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES p5_projects(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_number INT, -- For group projects
    role VARCHAR(100), -- Ketua, sekretaris, anggota, etc.
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, student_id)
);

CREATE INDEX idx_p5_enrollments_project ON p5_enrollments(project_id);
CREATE INDEX idx_p5_enrollments_student ON p5_enrollments(student_id);

-- 18. P5 Assessments table - P5 descriptive grading
CREATE TABLE p5_assessments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    enrollment_id BIGINT NOT NULL REFERENCES p5_enrollments(id) ON DELETE CASCADE,
    project_id BIGINT NOT NULL REFERENCES p5_projects(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    dimension VARCHAR(100) NOT NULL, -- e.g., "sikap spiritual", "sikap sosial"
    assessment p5_assessment NOT NULL,
    notes TEXT,
    assessed_by BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (enrollment_id, dimension)
);

CREATE INDEX idx_p5_assessments_enrollment ON p5_assessments(enrollment_id);
CREATE INDEX idx_p5_assessments_student ON p5_assessments(student_id);
CREATE INDEX idx_p5_assessments_project ON p5_assessments(project_id);

-- ============================================
-- ADMINISTRATIVE TABLES (19-24)
-- ============================================

-- 19. Fees table - Student fee records
CREATE TABLE fees (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_type fee_type NOT NULL,
    academic_year VARCHAR(9) NOT NULL,
    semester INT CHECK (semester IN (1, 2)),
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    due_date DATE NOT NULL,
    status payment_status DEFAULT 'pending',
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fees_student ON fees(student_id);
CREATE INDEX idx_fees_type ON fees(fee_type);
CREATE INDEX idx_fees_status ON fees(status);
CREATE INDEX idx_fees_year ON fees(academic_year);
CREATE INDEX idx_fees_due_date ON fees(due_date);

-- 20. Fee Payments table - Payment transaction records
CREATE TABLE fee_payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fee_id BIGINT NOT NULL REFERENCES fees(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method payment_method NOT NULL,
    transaction_id VARCHAR(100) UNIQUE, -- Bank/QRIS transaction reference
    receipt_number VARCHAR(100) UNIQUE,
    received_by BIGINT REFERENCES admins(id) ON DELETE SET NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fee_payments_fee ON fee_payments(fee_id);
CREATE INDEX idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX idx_fee_payments_date ON fee_payments(payment_date);
CREATE INDEX idx_fee_payments_transaction ON fee_payments(transaction_id);

-- 21. Announcements table - School announcements and notices
CREATE TABLE announcements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    school_id BIGINT REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    announcement_type announcement_type NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    publish_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    author_id BIGINT REFERENCES admins(id) ON DELETE SET NULL,
    attachments TEXT[], -- Array of file URLs
    is_pinned BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_school ON announcements(school_id);
CREATE INDEX idx_announcements_type ON announcements(announcement_type);
CREATE INDEX idx_announcements_publish_date ON announcements(publish_date);
CREATE INDEX idx_announcements_pinned ON announcements(is_pinned);

-- 22. Events table - School calendar events
CREATE TABLE events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    school_id BIGINT REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type event_type NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    location VARCHAR(255),
    is_academic_day BOOLEAN DEFAULT true, -- Affects attendance counting
    affected_classes INT[], -- Array of class IDs, NULL for all classes
    organizer VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date)
);

CREATE INDEX idx_events_school ON events(school_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_academic_day ON events(is_academic_day);

-- 23. Documents table - Document storage
CREATE TABLE documents (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT, -- Size in bytes
    mime_type VARCHAR(100),
    academic_year VARCHAR(9),
    semester INT CHECK (semester IN (1, 2)),
    issued_date DATE,
    issued_by BIGINT REFERENCES admins(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_student ON documents(student_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_year ON documents(academic_year);

-- 24. User Accounts table - System user accounts for portal access
CREATE TABLE user_accounts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_role user_role NOT NULL,
    status user_account_status DEFAULT 'menunggu_konfirmasi',
    last_login TIMESTAMPTZ,
    login_attempts INT DEFAULT 0 CHECK (login_attempts >= 0),
    locked_until TIMESTAMPTZ,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_accounts_username ON user_accounts(username);
CREATE INDEX idx_user_accounts_email ON user_accounts(email);
CREATE INDEX idx_user_accounts_role ON user_accounts(user_role);
CREATE INDEX idx_user_accounts_status ON user_accounts(status);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON parents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_teachers_updated_at BEFORE UPDATE ON class_teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subject_teachers_updated_at BEFORE UPDATE ON subject_teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_subjects_updated_at BEFORE UPDATE ON class_subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grade_components_updated_at BEFORE UPDATE ON grade_components
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_p5_projects_updated_at BEFORE UPDATE ON p5_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_p5_enrollments_updated_at BEFORE UPDATE ON p5_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_p5_assessments_updated_at BEFORE UPDATE ON p5_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fees_updated_at BEFORE UPDATE ON fees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fee_payments_updated_at BEFORE UPDATE ON fee_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_accounts_updated_at BEFORE UPDATE ON user_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Active students with their class and parent information
CREATE VIEW active_students_details AS
SELECT
    s.id,
    s.nisn,
    s.name,
    s.gender,
    s.enrollment_date,
    c.name AS class_name,
    c.grade_level,
    c.academic_year,
    t.name AS homeroom_teacher,
    p.name AS parent_name,
    p.phone AS parent_phone,
    p.relationship AS parent_relationship
FROM students s
JOIN enrollments e ON s.id = e.student_id
JOIN classes c ON e.class_id = c.id
LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
LEFT JOIN parents p ON s.parent_id = p.id
WHERE s.enrollment_status = 'aktif'
  AND e.enrollment_status = 'aktif'
  AND e.academic_year = (SELECT value FROM current_academic_year());

-- View: Teacher workload summary
CREATE VIEW teacher_workload AS
SELECT
    t.id,
    t.nip,
    t.name,
    COUNT(DISTINCT cs.id) AS subjects_assigned,
    COUNT(DISTINCT e.student_id) AS total_students,
    STRING_AGG(DISTINCT sub.name, ', ') AS subjects_teaching
FROM teachers t
LEFT JOIN class_subjects cs ON t.id = cs.teacher_id
LEFT JOIN subjects sub ON cs.subject_id = sub.id
LEFT JOIN enrollments e ON cs.class_id = e.class_id
WHERE t.employment_status = 'aktif'
GROUP BY t.id, t.nip, t.name;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE schools IS 'School information with NPSN (8-digit national school ID)';
COMMENT ON TABLE students IS 'Student records with NISN (10-digit national student ID)';
COMMENT ON TABLE teachers IS 'Teacher records with NIP (18-digit) and NUPTK (16-digit) educator IDs';
COMMENT ON TABLE parents IS 'Parent/guardian information with NIK (16-digit national ID)';
COMMENT ON TABLE admins IS 'School administration staff';
COMMENT ON TABLE classes IS 'Class/group definitions with academic year and semester';
COMMENT ON TABLE subjects IS 'Subject offerings with curriculum type and grade level';
COMMENT ON TABLE class_teachers IS 'Junction table for teacher-class assignments';
COMMENT ON TABLE enrollments IS 'Student-class enrollment records per academic year';
COMMENT ON TABLE subject_teachers IS 'Teacher-subject assignments per academic year';
COMMENT ON TABLE class_subjects IS 'Subject offerings per class with schedule information';
COMMENT ON TABLE schedules IS 'Class schedule/time assignments';
COMMENT ON TABLE attendance IS 'Student attendance records with daily status';
COMMENT ON TABLE grade_components IS 'Grading criteria (assignments, exams, projects) with weights';
COMMENT ON TABLE grades IS 'Student grade records per component';
COMMENT ON TABLE p5_projects IS 'Kurikulum Merdeka P5 project definitions with themes';
COMMENT ON TABLE p5_enrollments IS 'Student participation in P5 projects';
COMMENT ON TABLE p5_assessments IS 'P5 descriptive grading (sangat baik, baik, cukup, perlu bimbingan)';
COMMENT ON TABLE fees IS 'Student fee records (tuition, books, uniforms)';
COMMENT ON TABLE fee_payments IS 'Payment transaction records with method and receipt';
COMMENT ON TABLE announcements IS 'School announcements and notices with priority levels';
COMMENT ON TABLE events IS 'School calendar events affecting academic calendar';
COMMENT ON TABLE documents IS 'Document storage (reports, certificates, transcripts)';
COMMENT ON TABLE user_accounts IS 'System user accounts for portal access with authentication';

-- ============================================
-- END OF SCHOOL ERP DDL
-- ============================================
