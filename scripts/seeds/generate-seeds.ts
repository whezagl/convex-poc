/**
 * School ERP Seed Data Generator
 *
 * Generates realistic seed data for Indonesian schools using
 * @faker-js/faker with Indonesian locale (id_ID).
 *
 * Usage: npm run seeds > scripts/seeds/data.sql
 */

import { faker } from '@faker-js/faker';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseDDL } from '@convex-poc/template-engine/parser';

// Set Indonesian locale
faker.locale = 'id_ID';

/**
 * School ERP seed data generators
 */
const generators = {
  /**
   * Generate school data
   */
  schools: (count: number = 1) => {
    return Array.from({ length: count }, () => ({
      npsn: faker.string.numeric(8), // 8-digit school ID
      name: `SMA ${faker.location.city()}`,
      address: faker.location.streetAddress(),
      province: faker.location.state({ abbreviated: true }),
      city: faker.location.city(),
      district: faker.location.county(),
      postal_code: faker.location.zipCode(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      website: faker.internet.url(),
      accreditation: faker.helpers.arrayElement(['A', 'B', 'C']),
      school_level: faker.helpers.arrayElement(['SD', 'SMP', 'SMA', 'SMK']),
      founded_date: faker.date.past({ years: 50 }).toISOString().split('T')[0],
      principal_name: faker.person.fullName(),
    }));
  },

  /**
   * Generate student data with Indonesian NISN
   */
  students: (count: number = 100) => {
    return Array.from({ length: count }, () => ({
      nisn: faker.string.numeric(10), // 10-digit NISN
      name: faker.person.fullName(),
      birth_date: faker.date.past({ years: 18 }).toISOString().split('T')[0],
      gender: faker.helpers.arrayElement(['Laki-laki', 'Perempuan']),
      religion: faker.helpers.arrayElement(['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya']),
      address: faker.location.streetAddress(),
      phone: faker.phone.number(),
      phone_parents: [faker.phone.number(), faker.phone.number()],
      email: faker.internet.email(),
      enrollment_status: faker.helpers.arrayElement(['aktif', 'non-aktif', 'lulus', 'keluar']),
      enrollment_date: faker.date.past({ years: 4 }).toISOString().split('T')[0],
    }));
  },

  /**
   * Generate teacher data with NIP and NUPTK
   */
  teachers: (count: number = 20) => {
    const subjects = [
      'Matematika', 'Bahasa Indonesia', 'IPA', 'IPS', 'PKN',
      'Bahasa Inggris', 'Seni Budaya', 'PJOK', 'Agama', 'TIK'
    ];

    return Array.from({ length: count }, () => ({
      nip: faker.string.numeric(18), // 18-digit NIP
      nuptk: faker.string.numeric(16), // 16-digit NUPTK
      name: faker.person.fullName(),
      gender: faker.helpers.arrayElement(['Laki-laki', 'Perempuan']),
      birth_date: faker.date.birthdate({ min: 25, max: 60 }).toISOString().split('T')[0],
      religion: faker.helpers.arrayElement(['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya']),
      address: faker.location.streetAddress(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      subject: faker.helpers.arrayElement(subjects),
      employment_status: faker.helpers.arrayElement(['aktif', 'non-aktif', 'pensiun', 'cuti']),
      employment_type: faker.helpers.arrayElement(['pns', 'pppk', 'honorer', 'kontrak']),
      hire_date: faker.date.past({ years: 20 }).toISOString().split('T')[0],
      education_level: faker.helpers.arrayElement(['S1', 'S2', 'S3']),
      major: faker.person.jobTitle(),
    }));
  },

  /**
   * Generate parent/guardian data
   */
  parents: (count: number = 100) => {
    return Array.from({ length: count }, () => ({
      nik: faker.string.numeric(16),
      name: faker.person.fullName(),
      relationship: faker.helpers.arrayElement(['ayah', 'ibu', 'wali', 'lainnya']),
      phone: faker.phone.number(),
      phone_alternative: faker.phone.number(),
      email: faker.internet.email(),
      occupation: faker.person.jobTitle(),
      workplace: faker.company.name(),
      address: faker.location.streetAddress(),
    }));
  },

  /**
   * Generate admin staff data
   */
  admins: (count: number = 5) => {
    return Array.from({ length: count }, () => ({
      nip: faker.string.numeric(18),
      name: faker.person.fullName(),
      role: faker.helpers.arrayElement(['kepala_sekolah', 'wakil_kepala', 'tata_usaha', 'bendahara', 'lainnya']),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      employment_status: faker.helpers.arrayElement(['aktif', 'non-aktif', 'pensiun', 'cuti']),
      hire_date: faker.date.past({ years: 15 }).toISOString().split('T')[0],
    }));
  },

  /**
   * Generate class data
   */
  classes: (count: number = 30, schoolIds: number[] = [1]) => {
    const grades = ['X', 'XI', 'XII'];
    const majors = ['', 'IPA', 'IPS', 'Bahasa'];

    return Array.from({ length: count }, () => ({
      name: `${faker.helpers.arrayElement(grades)}${faker.helpers.arrayElement(majors)}-${faker.number.int({ min: 1, max: 5 })}`,
      grade_level: faker.number.int({ min: 10, max: 12 }),
      academic_year: '2024/2025',
      semester: faker.number.int({ min: 1, max: 2 }),
      school_id: faker.helpers.arrayElement(schoolIds),
      room_number: `${faker.string.alpha({ length: 1, casing: 'upper' })}${faker.number.int({ min: 1, max: 20 })}`,
      capacity: faker.number.int({ min: 30, max: 36 }),
      current_enrollment: faker.number.int({ min: 25, max: 32 }),
      curriculum_type: 'kurikulum_merdeka',
    }));
  },

  /**
   * Generate subject data
   */
  subjects: (count: number = 15) => {
    const subjects = [
      { code: 'MAT', name: 'Matematika', name_english: 'Mathematics' },
      { code: 'BIN', name: 'Bahasa Indonesia', name_english: 'Indonesian Language' },
      { code: 'ING', name: 'Bahasa Inggris', name_english: 'English' },
      { code: 'IPA', name: 'Ilmu Pengetahuan Alam', name_english: 'Natural Sciences' },
      { code: 'IPS', name: 'Ilmu Pengetahuan Sosial', name_english: 'Social Sciences' },
      { code: 'PKN', name: 'Pendidikan Kewarganegaraan', name_english: 'Civics' },
      { code: 'AGM', name: 'Pendidikan Agama', name_english: 'Religious Education' },
      { code: 'SEN', name: 'Seni Budaya', name_english: 'Arts and Culture' },
      { code: 'PJOK', name: 'PJOK', name_english: 'Physical Education' },
      { code: 'TIK', name: 'TIK', name_english: 'ICT' },
      { code: 'FIS', name: 'Fisika', name_english: 'Physics' },
      { code: 'KIM', name: 'Kimia', name_english: 'Chemistry' },
      { code: 'BIO', name: 'Biologi', name_english: 'Biology' },
      { code: 'EKO', name: 'Ekonomi', name_english: 'Economics' },
      { code: 'GEO', name: 'Geografi', name_english: 'Geography' },
    ];

    return subjects.slice(0, count).map((subject, idx) => ({
      code: subject.code,
      name: subject.name,
      name_english: subject.name_english,
      curriculum_type: 'kurikulum_merdeka',
      hours_per_week: faker.number.int({ min: 2, max: 4 }),
      is_mandatory: faker.datatype.boolean(),
    }));
  },

  /**
   * Generate P5 project data (Kurikulum Merdeka)
   */
  p5_projects: (count: number = 10) => {
    const themes = [
      'kebinekaan', 'gotong_royong', 'berkarya', 'berdoa',
      'sehat', 'sadar_budaya', 'kreatif', 'rekat'
    ];

    return Array.from({ length: count }, () => {
      const startDate = faker.date.soon({ days: 90 });
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 3);

      return {
        name: `Projek ${faker.helpers.arrayElement(themes).replace('_', ' ')}`,
        theme: faker.helpers.arrayElement(themes),
        description: faker.lorem.paragraph(),
        duration_weeks: faker.number.int({ min: 4, max: 12 }),
        academic_year: '2024/2025',
        semester: faker.number.int({ min: 1, max: 2 }),
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        learning_objectives: [
          faker.lorem.sentence(),
          faker.lorem.sentence(),
        ],
      };
    });
  },

  /**
   * Generate P5 assessment with descriptive grading
   */
  p5_assessments: (studentCount: number, projectCount: number) => {
    const dimensions = [
      'sikap spiritual', 'sikap sosial', 'pengetahuan', 'keterampilan'
    ];
    const grades = ['sangat_baik', 'baik', 'cukup', 'perlu_bimbingan'];

    return Array.from({ length: studentCount * projectCount }, () => ({
      dimension: faker.helpers.arrayElement(dimensions),
      assessment: faker.helpers.arrayElement(grades),
      notes: faker.lorem.sentence(),
    }));
  },

  /**
   * Generate attendance records
   */
  attendance: (studentCount: number, classCount: number) => {
    const statuses = ['hadir', 'izin', 'sakit', 'alpha'];

    return Array.from({ length: studentCount * classCount * 5 }, () => ({
      date: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
      status: faker.helpers.arrayElement(statuses),
      notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    }));
  },

  /**
   * Generate grade components
   */
  grade_components: (subjectCount: number, classCount: number) => {
    const types = ['tugas', 'uts', 'uas', 'proyek', 'partisipasi'];

    return Array.from({ length: subjectCount * classCount * 4 }, () => {
      const dueDate = faker.date.soon({ days: 60 });
      return {
        name: `${faker.helpers.arrayElement(types)} ${faker.number.int({ min: 1, max: 5 })}`,
        component_type: faker.helpers.arrayElement(types),
        weight: faker.number.int({ min: 5, max: 30 }),
        max_score: 100,
        academic_year: '2024/2025',
        semester: faker.number.int({ min: 1, max: 2 }),
        due_date: dueDate.toISOString().split('T')[0],
      };
    });
  },

  /**
   * Generate grade records
   */
  grades: (studentCount: number, componentCount: number) => {
    return Array.from({ length: studentCount * componentCount }, () => ({
      score: faker.number.float({ min: 60, max: 100, precision: 0.01 }),
      notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      graded_at: faker.date.recent().toISOString(),
      academic_year: '2024/2025',
      semester: faker.number.int({ min: 1, max: 2 }),
    }));
  },

  /**
   * Generate fee records
   */
  fees: (studentCount: number) => {
    const types = ['spp', 'uang_buku', 'uang_seragam', 'uang_kegiatan'];

    return Array.from({ length: studentCount * 4 }, () => {
      const dueDate = faker.date.soon({ days: 90 });
      return {
        fee_type: faker.helpers.arrayElement(types),
        academic_year: '2024/2025',
        semester: faker.number.int({ min: 1, max: 2 }),
        amount: faker.number.int({ min: 100000, max: 2000000 }),
        due_date: dueDate.toISOString().split('T')[0],
        status: faker.helpers.arrayElement(['pending', 'lunas', 'cicilan', 'terlambat']),
        description: faker.lorem.sentence(),
      };
    });
  },

  /**
   * Generate fee payment records
   */
  fee_payments: (feeCount: number) => {
    return Array.from({ length: Math.floor(feeCount * 0.7) }, () => ({
      amount: faker.number.int({ min: 50000, max: 2000000 }),
      payment_date: faker.date.recent().toISOString().split('T')[0],
      payment_method: faker.helpers.arrayElement(['tunai', 'transfer', 'qris']),
      transaction_id: faker.string.uuid(),
      receipt_number: `INV${faker.string.numeric(8)}`,
      notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    }));
  },

  /**
   * Generate user accounts
   */
  user_accounts: (count: number = 50) => {
    return Array.from({ length: count }, () => ({
      username: faker.internet.displayName(),
      email: faker.internet.email(),
      password_hash: faker.string.uuid(), // Fake hash
      user_role: faker.helpers.arrayElement(['admin', 'guru', 'siswa', 'ortu']),
      status: faker.helpers.arrayElement(['aktif', 'non-aktif', 'terkunci', 'menunggu_konfirmasi']),
    }));
  },
};

/**
 * Generate SQL INSERT statements from data
 */
function generateInserts(tableName: string, data: any[]): string {
  if (data.length === 0) return '';

  const columns = Object.keys(data[0]);
  const columnList = columns.map(c => `"${c}"`).join(', ');
  const values = data.map(row => {
    const valueList = columns.map(col => {
      const val = row[col];
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return val;
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      if (Array.isArray(val)) {
        // Handle PostgreSQL array format
        const arrayStr = val.map((v: any) => `"${v}"`).join(', ');
        return `ARRAY[${arrayStr}]`;
      }
      return `'${String(val).replace(/'/g, "''")}'`;
    });
    return `(${valueList.join(', ')})`;
  });

  return `-- ${tableName}\n` +
    `INSERT INTO "${tableName}" (${columnList}) VALUES\n` +
    values.join(',\n') +
    ';\n\n';
}

/**
 * Main seed generation function
 */
async function generateSeeds() {
  console.log('-- School ERP Seed Data');
  console.log('-- Generated:', new Date().toISOString());
  console.log('-- Indonesian Locale (id_ID)');
  console.log('--');

  // Generate core data
  const schools = generators.schools(1);
  const students = generators.students(100);
  const teachers = generators.teachers(20);
  const parents = generators.parents(100);
  const admins = generators.admins(5);
  const classes = generators.classes(30, [1]);
  const subjects = generators.subjects(15);
  const p5_projects = generators.p5_projects(10);

  // Generate relationships
  const enrollments = students.map((_, idx) => ({
    student_id: (idx % 100) + 1,
    class_id: ((idx % 30) + 1),
    academic_year: '2024/2025',
    semester: (idx % 2) + 1,
    enrollment_date: faker.date.past({ years: 2 }).toISOString().split('T')[0],
    enrollment_status: faker.helpers.arrayElement(['aktif', 'non-aktif', 'lulus', 'keluar']),
  }));

  const class_teachers = teachers.map((_, idx) => ({
    class_id: ((idx % 30) + 1),
    teacher_id: (idx % 20) + 1,
    role: 'wali_kelas',
    academic_year: '2024/2025',
    semester: (idx % 2) + 1,
  }));

  const subject_teachers = teachers.map((_, idx) => ({
    teacher_id: (idx % 20) + 1,
    subject_id: ((idx % 15) + 1),
    academic_year: '2024/2025',
    semester: (idx % 2) + 1,
  }));

  const class_subjects = Array.from({ length: 50 }, (_, idx) => ({
    class_id: ((idx % 30) + 1),
    subject_id: ((idx % 15) + 1),
    teacher_id: ((idx % 20) + 1),
    academic_year: '2024/2025',
    semester: (idx % 2) + 1,
    schedule_day: faker.helpers.arrayElement(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']),
    schedule_time: `${faker.number.int({ min: 7, max: 15 })}:00`,
    schedule_room: `${faker.string.alpha({ length: 1, casing: 'upper' })}${faker.number.int({ min: 1, max: 20 })}`,
  }));

  // P5 enrollments and assessments
  const p5_enrollments = Array.from({ length: 200 }, (_, idx) => ({
    project_id: ((idx % 10) + 1),
    student_id: ((idx % 100) + 1),
    group_number: (idx % 10) + 1,
    role: faker.helpers.arrayElement(['Ketua', 'Sekretaris', 'Anggota']),
    enrollment_date: faker.date.recent().toISOString().split('T')[0],
  }));

  const p5_assessments = p5_enrollments.map((enrollment, idx) => ({
    enrollment_id: (idx % 200) + 1,
    project_id: enrollment.project_id,
    student_id: enrollment.student_id,
    dimension: faker.helpers.arrayElement(['sikap spiritual', 'sikap sosial', 'pengetahuan', 'keterampilan']),
    assessment: faker.helpers.arrayElement(['sangat_baik', 'baik', 'cukup', 'perlu_bimbingan']),
    notes: faker.lorem.sentence(),
    assessed_at: faker.date.recent().toISOString(),
  }));

  // Academic records
  const attendance = generators.attendance(100, 30);
  const grade_components = generators.grade_components(15, 30);
  const grades = generators.grades(100, grade_components.length);

  // Fee records
  const fees = generators.fees(100);
  const fee_payments = generators.fee_payments(fees.length);

  // User accounts
  const user_accounts = generators.user_accounts(50);

  // Announcements
  const announcements = Array.from({ length: 20 }, () => {
    const publishDate = faker.date.recent();
    const expiryDate = new Date(publishDate);
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    return {
      school_id: 1,
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      announcement_type: faker.helpers.arrayElement(['umum', 'guru', 'siswa', 'ortu']),
      priority: faker.helpers.arrayElement(['low', 'normal', 'high', 'urgent']),
      publish_date: publishDate.toISOString(),
      expiry_date: expiryDate.toISOString(),
    };
  });

  const events = Array.from({ length: 15 }, () => {
    const startDate = faker.date.soon({ days: 90 });
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    return {
      school_id: 1,
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      event_type: faker.helpers.arrayElement(['akademik', 'non_akademik', 'libur', 'rapat']),
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      location: faker.location.streetAddress(),
      is_academic_day: faker.datatype.boolean(),
      organizer: faker.person.fullName(),
    };
  });

  const documents = Array.from({ length: 50 }, (_, idx) => ({
    student_id: ((idx % 100) + 1),
    document_type: faker.helpers.arrayElement(['rapor', 'sertifikat', 'ijazah', 'lainnya']),
    title: faker.lorem.sentence(),
    file_url: faker.internet.url(),
    file_size: faker.number.int({ min: 100000, max: 5000000 }),
    mime_type: 'application/pdf',
    academic_year: '2024/2025',
    semester: (idx % 2) + 1,
    issued_date: faker.date.past().toISOString().split('T')[0],
  }));

  // Output SQL
  console.log(generateInserts('schools', schools));
  console.log(generateInserts('students', students));
  console.log(generateInserts('teachers', teachers));
  console.log(generateInserts('parents', parents));
  console.log(generateInserts('admins', admins));
  console.log(generateInserts('classes', classes));
  console.log(generateInserts('subjects', subjects));
  console.log(generateInserts('class_teachers', class_teachers));
  console.log(generateInserts('subject_teachers', subject_teachers));
  console.log(generateInserts('class_subjects', class_subjects));
  console.log(generateInserts('enrollments', enrollments));
  console.log(generateInserts('p5_projects', p5_projects));
  console.log(generateInserts('p5_enrollments', p5_enrollments));
  console.log(generateInserts('p5_assessments', p5_assessments));
  console.log(generateInserts('attendance', attendance));
  console.log(generateInserts('grade_components', grade_components));
  console.log(generateInserts('grades', grades));
  console.log(generateInserts('fees', fees));
  console.log(generateInserts('fee_payments', fee_payments));
  console.log(generateInserts('user_accounts', user_accounts));
  console.log(generateInserts('announcements', announcements));
  console.log(generateInserts('events', events));
  console.log(generateInserts('documents', documents));

  console.log('-- Seed data generation complete');
  console.log(`-- Schools: ${schools.length}`);
  console.log(`-- Students: ${students.length}`);
  console.log(`-- Teachers: ${teachers.length}`);
  console.log(`-- Parents: ${parents.length}`);
  console.log(`-- Admins: ${admins.length}`);
  console.log(`-- Classes: ${classes.length}`);
  console.log(`-- Subjects: ${subjects.length}`);
  console.log(`-- Class Teachers: ${class_teachers.length}`);
  console.log(`-- Subject Teachers: ${subject_teachers.length}`);
  console.log(`-- Class Subjects: ${class_subjects.length}`);
  console.log(`-- Enrollments: ${enrollments.length}`);
  console.log(`-- P5 Projects: ${p5_projects.length}`);
  console.log(`-- P5 Enrollments: ${p5_enrollments.length}`);
  console.log(`-- P5 Assessments: ${p5_assessments.length}`);
  console.log(`-- Attendance: ${attendance.length}`);
  console.log(`-- Grade Components: ${grade_components.length}`);
  console.log(`-- Grades: ${grades.length}`);
  console.log(`-- Fees: ${fees.length}`);
  console.log(`-- Fee Payments: ${fee_payments.length}`);
  console.log(`-- User Accounts: ${user_accounts.length}`);
  console.log(`-- Announcements: ${announcements.length}`);
  console.log(`-- Events: ${events.length}`);
  console.log(`-- Documents: ${documents.length}`);
}

// Run generation
generateSeeds().catch(console.error);
