/**
 * Date utility helpers for DD/MM/YYYY format across the Game Backlog Tracker.
 */

/**
 * Formats any date string (YYYY-MM-DD, ISO string, etc.) into DD/MM/YYYY.
 */
export function formatDateDDMMYYYY(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return '';
  const trimmed = dateStr.trim();

  // If already in DD/MM/YYYY format
  const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  // If in YYYY-MM-DD format (including ISO dates starting with YYYY-MM-DD)
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  // Fallback to Date object parsing
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return trimmed;
}

/**
 * Parses a date string that might be in DD/MM/YYYY or YYYY-MM-DD into canonical YYYY-MM-DD.
 */
export function parseDateToYMD(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return '';
  const trimmed = dateStr.trim();

  // If DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // If already YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return trimmed;
}
