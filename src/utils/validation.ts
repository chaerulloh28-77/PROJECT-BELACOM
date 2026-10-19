/**
 * Utilitas Validasi Email Standar RFC 5322
 */

// Regex standar RFC 5322 untuk validasi alamat email
export const RFC5322_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Memvalidasi apakah satu alamat email memenuhi standar RFC 5322
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  return RFC5322_EMAIL_REGEX.test(trimmed);
}

/**
 * Memvalidasi daftar email (misal daftar Cc)
 */
export function validateEmailList(emails: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const raw of emails) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (isValidEmail(trimmed)) {
      if (!valid.includes(trimmed)) {
        valid.push(trimmed);
      }
    } else {
      if (!invalid.includes(trimmed)) {
        invalid.push(trimmed);
      }
    }
  }

  return { valid, invalid };
}
