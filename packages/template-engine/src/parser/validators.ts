import { IndonesianIDValidation } from './types.js';

/**
 * Indonesian National ID Validators
 * For School ERP domain validation
 */

/**
 * Validate NISN (Nomor Induk Siswa Nasional)
 * Format: 10 digits, numeric only
 */
export function validateNISN(nisn: string): IndonesianIDValidation {
  const errors: string[] = [];

  if (!nisn) {
    return { isValid: false, type: 'NISN', errors: ['NISN is required'] };
  }

  // Check length (10 digits)
  if (nisn.length !== 10) {
    errors.push(`NISN must be 10 digits, got ${nisn.length}`);
  }

  // Check numeric only
  if (!/^\d+$/.test(nisn)) {
    errors.push('NISN must contain only digits');
  }

  // Check for common invalid patterns
  if (/^0+$/.test(nisn)) {
    errors.push('NISN cannot be all zeros');
  }

  return {
    isValid: errors.length === 0,
    type: 'NISN',
    errors,
  };
}

/**
 * Validate NIP (Nomor Induk Pegawai)
 * Format: 18 digits, structured (birth date embedded)
 * Basic validation only - sophisticated structure validation deferred per RESEARCH
 */
export function validateNIP(nip: string): IndonesianIDValidation {
  const errors: string[] = [];

  if (!nip) {
    return { isValid: false, type: 'NIP', errors: ['NIP is required'] };
  }

  // Check length (18 digits)
  if (nip.length !== 18) {
    errors.push(`NIP must be 18 digits, got ${nip.length}`);
  }

  // Check numeric only
  if (!/^\d+$/.test(nip)) {
    errors.push('NIP must contain only digits');
  }

  // Check for common invalid patterns
  if (/^0+$/.test(nip)) {
    errors.push('NIP cannot be all zeros');
  }

  // Note: Sophisticated NIP structure validation (birth date position, government codes)
  // is deferred per RESEARCH.md open questions. Basic digit validation is sufficient for POC.

  return {
    isValid: errors.length === 0,
    type: 'NIP',
    errors,
  };
}

/**
 * Validate NUPTK (Nomor Unik Pendidik dan Tenaga Kependidikan)
 * Format: 16 digits, numeric only
 */
export function validateNUPTK(nuptk: string): IndonesianIDValidation {
  const errors: string[] = [];

  if (!nuptk) {
    return { isValid: false, type: 'NUPTK', errors: ['NUPTK is required'] };
  }

  // Check length (16 digits)
  if (nuptk.length !== 16) {
    errors.push(`NUPTK must be 16 digits, got ${nuptk.length}`);
  }

  // Check numeric only
  if (!/^\d+$/.test(nuptk)) {
    errors.push('NUPTK must contain only digits');
  }

  // Check for common invalid patterns
  if (/^0+$/.test(nuptk)) {
    errors.push('NUPTK cannot be all zeros');
  }

  return {
    isValid: errors.length === 0,
    type: 'NUPTK',
    errors,
  };
}

/**
 * Detect ID type and validate
 */
export function validateIndonesianID(id: string): IndonesianIDValidation {
  if (!id) {
    return {
      isValid: false,
      type: 'unknown',
      errors: ['ID is required'],
    };
  }

  // Detect by length
  const length = id.replace(/\D/g, '').length;

  switch (length) {
    case 10:
      return validateNISN(id);
    case 16:
      return validateNUPTK(id);
    case 18:
      return validateNIP(id);
    default:
      return {
        isValid: false,
        type: 'unknown',
        errors: [`Unknown Indonesian ID format: ${length} digits`],
      };
  }
}

/**
 * Validate PostgreSQL identifier
 * Prevents SQL injection in dynamic SQL
 */
export function isValidIdentifier(identifier: string): boolean {
  // PostgreSQL identifiers: letters, digits, underscores, not starting with digit
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
}
