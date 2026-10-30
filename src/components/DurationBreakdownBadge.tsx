import React from 'react';
import { 
  isSunday, 
  isNationalHoliday, 
  getHolidayName, 
  formatDateToYYYYMMDD 
} from '../utils/dateUtils';

interface DurationBreakdownBadgeProps {
  startDateStr?: string;
  finishDateStr?: string;
  durationDays: number;
}

export const DurationBreakdownBadge: React.FC<DurationBreakdownBadgeProps> = ({
  startDateStr,
  finishDateStr,
  durationDays
}) => {
  if (!startDateStr || !finishDateStr || durationDays <= 0) {
    return (
      <div className="mt-1 text-[10px] font-mono text-slate-400">
        Kalkulasi harian efektif (Presisi: Mengabaikan Minggu &amp; Libur)
      </div>
    );
  }

  const [sY, sM, sD] = startDateStr.split('-').map(Number);
  const [eY, eM, eD] = finishDateStr.split('-').map(Number);

  if (!sY || !sM || !sD || !eY || !eM || !eD) return null;

  const start = new Date(sY, sM - 1, sD);
  const end = new Date(eY, eM - 1, eD);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return null;
  }

  let totalCalendarDays = 0;
  let sundayCount = 0;
  let holidayCount = 0;
  const holidaysFound: string[] = [];

  const current = new Date(start);
  while (current <= end) {
    totalCalendarDays++;
    const isSun = isSunday(current);
    const isHol = isNationalHoliday(current);
    const dateStr = formatDateToYYYYMMDD(current);

    if (isHol) {
      holidayCount++;
      const holName = getHolidayName(dateStr);
      if (holName && !holidaysFound.includes(holName)) {
        holidaysFound.push(holName);
      }
    } else if (isSun) {
      sundayCount++;
    }

    current.setDate(current.getDate() + 1);
  }

  const totalNonWorkDays = sundayCount + holidayCount;

  return (
    <div className="mt-1.5 space-y-1 font-mono text-[10px]">
      <div className="flex items-center flex-wrap gap-1">
        <span className="bg-cyan-950 text-cyan-300 font-extrabold border border-cyan-800 px-1.5 py-0.5 rounded">
          ⚡ {durationDays} Hari Kerja Efektif
        </span>
        <span className="text-slate-400">
          (dari {totalCalendarDays} hari kalender)
        </span>
      </div>

      {totalNonWorkDays > 0 && (
        <div className="flex items-center flex-wrap gap-1 text-rose-300 bg-rose-950/40 border border-rose-900/60 p-1.5 rounded-lg">
          <span className="font-bold text-rose-400">🚨 Hari Tidak Diukur:</span>
          {sundayCount > 0 && (
            <span className="bg-rose-900/80 px-1 rounded text-rose-200">
              {sundayCount}x Hari Minggu
            </span>
          )}
          {holidayCount > 0 && (
            <span className="bg-rose-900/80 px-1 rounded text-rose-200">
              {holidayCount}x Libur/Cuti ({holidaysFound.slice(0, 2).join(', ')})
            </span>
          )}
        </div>
      )}
    </div>
  );
};
