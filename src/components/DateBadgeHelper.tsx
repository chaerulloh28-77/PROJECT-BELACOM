import React from 'react';
import { isSunday, isNationalHoliday, getHolidayName } from '../utils/dateUtils';

interface DateBadgeHelperProps {
  dateStr?: string;
  showWorkDayTag?: boolean;
}

const INDONESIAN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agus', 'Sep', 'Okt', 'Nov', 'Des'
];

export const DateBadgeHelper: React.FC<DateBadgeHelperProps> = ({
  dateStr,
  showWorkDayTag = true
}) => {
  if (!dateStr || dateStr.length !== 10) return null;

  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;

  const dt = new Date(y, m - 1, d);
  if (isNaN(dt.getTime())) return null;

  const dayNameStr = dt.toLocaleDateString('id-ID', { weekday: 'short' });
  const formattedText = `${dayNameStr}, ${d} ${INDONESIAN_MONTHS_SHORT[m - 1]} ${y}`;

  const isSun = isSunday(dt);
  const holidayName = getHolidayName(dateStr);

  if (holidayName) {
    return (
      <div className="flex items-center gap-1 mt-1 text-[10px] font-mono">
        <span className="bg-rose-950/90 text-rose-300 font-extrabold border border-rose-600/80 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
          <span>🎉</span>
          <span>{holidayName} (Libur National)</span>
        </span>
      </div>
    );
  }

  if (isSun) {
    return (
      <div className="flex items-center gap-1 mt-1 text-[10px] font-mono">
        <span className="bg-rose-950/70 text-rose-400 font-bold border border-rose-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
          <span>🚨</span>
          <span>{formattedText} (Hari Minggu - Tidak Diukur)</span>
        </span>
      </div>
    );
  }

  if (showWorkDayTag) {
    return (
      <div className="flex items-center gap-1 mt-1 text-[10px] font-mono">
        <span className="bg-slate-900 text-cyan-400 font-semibold border border-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1">
          <span>💼</span>
          <span>{formattedText} (Hari Kerja Efektif)</span>
        </span>
      </div>
    );
  }

  return null;
};
