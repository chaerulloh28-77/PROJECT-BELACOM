/**
 * Utility functions for date manipulations and working day calculations
 * according to Indonesian calendar (excluding Sundays and National Holidays / Cuti Bersama)
 */

export const INDONESIAN_HOLIDAYS: string[] = [
  // 2025
  '2025-01-01', // Tahun Baru 2025 Masehi
  '2025-01-27', // Isra Mikraj Nabi Muhammad SAW
  '2025-01-28', // Cuti Bersama Tahun Baru Imlek
  '2025-01-29', // Tahun Baru Imlek 2576 Kongzili
  '2025-03-28', // Cuti Bersama Hari Suci Nyepi
  '2025-03-29', // Hari Suci Nyepi Tahun Baru Saka 1947
  '2025-03-31', // Hari Raya Idul Fitri 1446 Hijriah
  '2025-04-01', // Hari Raya Idul Fitri 1446 Hijriah
  '2025-04-02', // Cuti Bersama Idul Fitri
  '2025-04-03', // Cuti Bersama Idul Fitri
  '2025-04-04', // Cuti Bersama Idul Fitri
  '2025-04-07', // Cuti Bersama Idul Fitri
  '2025-04-18', // Wafat Yesus Kristus
  '2025-04-20', // Kebangkitan Yesus Kristus (Paskah)
  '2025-05-01', // Hari Buruh Internasional
  '2025-05-12', // Hari Raya Waisak 2569 BE
  '2025-05-13', // Cuti Bersama Hari Raya Waisak
  '2025-05-29', // Kenaikan Yesus Kristus
  '2025-05-30', // Cuti Bersama Kenaikan Yesus Kristus
  '2025-06-01', // Hari Lahir Pancasila
  '2025-06-06', // Hari Raya Idul Adha 1446 Hijriah
  '2025-06-09', // Cuti Bersama Idul Adha
  '2025-06-27', // 1 Muharam Tahun Baru Islam 1447 Hijriah
  '2025-08-17', // Proklamasi Kemerdekaan RI
  '2025-09-05', // Maulid Nabi Muhammad SAW
  '2025-12-25', // Hari Raya Natal
  '2025-12-26', // Cuti Bersama Natal

  // 2026
  '2026-01-01', // Tahun Baru 2026 Masehi
  '2026-01-16', // Isra Mikraj Nabi Muhammad SAW
  '2026-02-17', // Tahun Baru Imlek 2577 Kongzili
  '2026-03-19', // Hari Suci Nyepi Tahun Baru Saka 1948
  '2026-03-20', // Hari Raya Idul Fitri 1447 Hijriah
  '2026-03-21', // Hari Raya Idul Fitri 1447 Hijriah
  '2026-03-23', // Cuti Bersama Idul Fitri
  '2026-03-24', // Cuti Bersama Idul Fitri
  '2026-04-03', // Wafat Yesus Kristus
  '2026-05-01', // Hari Buruh Internasional
  '2026-05-14', // Kenaikan Yesus Kristus
  '2026-05-31', // Hari Raya Waisak 2570 BE
  '2026-06-01', // Hari Lahir Pancasila
  '2026-05-27', // Hari Raya Idul Adha 1447 Hijriah
  '2026-06-16', // Tahun Baru Islam 1448 Hijriah
  '2026-08-17', // Proklamasi Kemerdekaan RI
  '2026-08-25', // Maulid Nabi Muhammad SAW
  '2026-12-25', // Hari Raya Natal
  '2026-12-26', // Cuti Bersama Natal

  // 2027
  '2027-01-01', // Tahun Baru 2027
  '2027-02-06', // Tahun Baru Imlek
  '2027-03-09', // Hari Raya Idul Fitri
  '2027-03-10', // Hari Raya Idul Fitri
  '2027-03-26', // Wafat Yesus Kristus
  '2027-05-01', // Hari Buruh
  '2027-05-06', // Kenaikan Yesus Kristus
  '2027-05-20', // Hari Raya Waisak
  '2027-06-01', // Hari Lahir Pancasila
  '2027-08-17', // Hari Kemerdekaan RI
  '2027-12-25'  // Hari Raya Natal
];

export const INDONESIAN_HOLIDAY_MAP: Record<string, string> = {
  // 2025
  '2025-01-01': 'Tahun Baru 2025 Masehi',
  '2025-01-27': 'Isra Mikraj Nabi Muhammad SAW',
  '2025-01-28': 'Cuti Bersama Tahun Baru Imlek',
  '2025-01-29': 'Tahun Baru Imlek 2576 Kongzili',
  '2025-03-28': 'Cuti Bersama Hari Suci Nyepi',
  '2025-03-29': 'Hari Suci Nyepi Tahun Baru Saka 1947',
  '2025-03-31': 'Hari Raya Idul Fitri 1446 Hijriah',
  '2025-04-01': 'Hari Raya Idul Fitri 1446 Hijriah',
  '2025-04-02': 'Cuti Bersama Idul Fitri',
  '2025-04-03': 'Cuti Bersama Idul Fitri',
  '2025-04-04': 'Cuti Bersama Idul Fitri',
  '2025-04-07': 'Cuti Bersama Idul Fitri',
  '2025-04-18': 'Wafat Yesus Kristus',
  '2025-04-20': 'Kebangkitan Yesus Kristus (Paskah)',
  '2025-05-01': 'Hari Buruh Internasional',
  '2025-05-12': 'Hari Raya Waisak 2569 BE',
  '2025-05-13': 'Cuti Bersama Hari Raya Waisak',
  '2025-05-29': 'Kenaikan Yesus Kristus',
  '2025-05-30': 'Cuti Bersama Kenaikan Yesus Kristus',
  '2025-06-01': 'Hari Lahir Pancasila',
  '2025-06-06': 'Hari Raya Idul Adha 1446 Hijriah',
  '2025-06-09': 'Cuti Bersama Idul Adha',
  '2025-06-27': '1 Muharam Tahun Baru Islam 1447 Hijriah',
  '2025-08-17': 'Proklamasi Kemerdekaan RI',
  '2025-09-05': 'Maulid Nabi Muhammad SAW',
  '2025-12-25': 'Hari Raya Natal',
  '2025-12-26': 'Cuti Bersama Natal',

  // 2026
  '2026-01-01': 'Tahun Baru 2026 Masehi',
  '2026-01-16': 'Isra Mikraj Nabi Muhammad SAW',
  '2026-02-17': 'Tahun Baru Imlek 2577 Kongzili',
  '2026-03-19': 'Hari Suci Nyepi Tahun Baru Saka 1948',
  '2026-03-20': 'Hari Raya Idul Fitri 1447 Hijriah',
  '2026-03-21': 'Hari Raya Idul Fitri 1447 Hijriah',
  '2026-03-23': 'Cuti Bersama Idul Fitri',
  '2026-03-24': 'Cuti Bersama Idul Fitri',
  '2026-04-03': 'Wafat Yesus Kristus',
  '2026-05-01': 'Hari Buruh Internasional',
  '2026-05-14': 'Kenaikan Yesus Kristus',
  '2026-05-31': 'Hari Raya Waisak 2570 BE',
  '2026-06-01': 'Hari Lahir Pancasila',
  '2026-05-27': 'Hari Raya Idul Adha 1447 Hijriah',
  '2026-06-16': 'Tahun Baru Islam 1448 Hijriah',
  '2026-08-17': 'Proklamasi Kemerdekaan RI',
  '2026-08-25': 'Maulid Nabi Muhammad SAW',
  '2026-12-25': 'Hari Raya Natal',
  '2026-12-26': 'Cuti Bersama Natal',

  // 2027
  '2027-01-01': 'Tahun Baru 2027',
  '2027-02-06': 'Tahun Baru Imlek',
  '2027-03-09': 'Hari Raya Idul Fitri',
  '2027-03-10': 'Hari Raya Idul Fitri',
  '2027-03-26': 'Wafat Yesus Kristus',
  '2027-05-01': 'Hari Buruh',
  '2027-05-06': 'Kenaikan Yesus Kristus',
  '2027-05-20': 'Hari Raya Waisak',
  '2027-06-01': 'Hari Lahir Pancasila',
  '2027-08-17': 'Hari Kemerdekaan RI',
  '2027-12-25': 'Hari Raya Natal'
};

export function getHolidayName(dateStr: string): string | null {
  if (!dateStr) return null;
  if (INDONESIAN_HOLIDAY_MAP[dateStr]) {
    return INDONESIAN_HOLIDAY_MAP[dateStr];
  }
  const mmdd = dateStr.substring(5);
  const fixedHolidays: Record<string, string> = {
    '01-01': 'Tahun Baru Masehi',
    '05-01': 'Hari Buruh Internasional',
    '06-01': 'Hari Lahir Pancasila',
    '08-17': 'Hari Kemerdekaan RI',
    '12-25': 'Hari Raya Natal'
  };
  return fixedHolidays[mmdd] || null;
}

export function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isNationalHoliday(date: Date, customHolidays: string[] = INDONESIAN_HOLIDAYS): boolean {
  const dateStr = formatDateToYYYYMMDD(date);
  if (customHolidays.includes(dateStr)) {
    return true;
  }
  // Check recurring annual fixed holidays (MM-DD)
  const mmdd = dateStr.substring(5);
  if (['01-01', '05-01', '06-01', '08-17', '12-25'].includes(mmdd)) {
    return true;
  }
  return false;
}

/**
 * Calculates the number of working days between startDate and endDate (inclusive),
 * skipping Sundays and Indonesian national holidays / cuti bersama.
 * If startDate === endDate and it's a work day, returns 1.
 * If endDate < startDate, returns 0.
 */
export function calculateWorkDays(
  startDateStr: string,
  endDateStr: string,
  customHolidays: string[] = INDONESIAN_HOLIDAYS
): number {
  if (!startDateStr || !endDateStr) return 0;

  // Handle YYYY-MM-DD string parsing explicitly without timezone shifts
  const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
  const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);

  if (!sYear || !sMonth || !sDay || !eYear || !eMonth || !eDay) return 0;

  const start = new Date(sYear, sMonth - 1, sDay);
  const end = new Date(eYear, eMonth - 1, eDay);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  if (end < start) return 0;

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const isSun = isSunday(current);
    const isHol = isNationalHoliday(current, customHolidays);

    if (!isSun && !isHol) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Calculates the target finish date given a start date and target number of work days,
 * skipping Sundays and Indonesian national holidays / cuti bersama.
 */
export function addWorkDays(
  startDateStr: string,
  workDays: number,
  customHolidays: string[] = INDONESIAN_HOLIDAYS
): string {
  if (!startDateStr) return startDateStr;
  const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
  if (!sYear || !sMonth || !sDay) return startDateStr;

  const current = new Date(sYear, sMonth - 1, sDay);
  if (isNaN(current.getTime())) return startDateStr;

  const targetWorkDays = Math.max(1, workDays);
  let daysAdded = 0;

  // If start day is a valid work day, it counts as day 1
  if (!isSunday(current) && !isNationalHoliday(current, customHolidays)) {
    daysAdded = 1;
  }

  while (daysAdded < targetWorkDays) {
    current.setDate(current.getDate() + 1);
    if (!isSunday(current) && !isNationalHoliday(current, customHolidays)) {
      daysAdded++;
    }
  }

  return formatDateToYYYYMMDD(current);
}

/**
 * Safely calls showPicker() on HTMLInputElement, catching any SecurityError
 * that might occur inside cross-origin / sandboxed iframes.
 */
export function handleDateInputClick(e: React.MouseEvent<HTMLInputElement>): void {
  try {
    if (typeof e.currentTarget.showPicker === 'function') {
      e.currentTarget.showPicker();
    }
  } catch (_err) {
    // showPicker() throws SecurityError in cross-origin iframes.
    // Catching this prevents uncaught exceptions.
  }
}

/**
 * Computes the total sum of duration days across primary schedule and all additional schedule entries.
 */
export function getTotalDurationDays(item?: {
  durationDays?: number;
  durasiDate?: number | string;
  additionalSchedules?: { durationDays?: number }[];
}): number {
  if (!item) return 1;
  const primaryVal = item.durasiDate ?? item.durationDays ?? 1;
  const primary = isNaN(Number(primaryVal)) ? 1 : Number(primaryVal);
  const extraSum = (item.additionalSchedules || []).reduce(
    (sum, row) => sum + (isNaN(Number(row.durationDays)) ? 0 : Number(row.durationDays)),
    0
  );
  return Math.max(1, primary + extraSum);
}


