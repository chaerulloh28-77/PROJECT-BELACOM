import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Check, 
  AlertTriangle, 
  PartyPopper,
  Clock
} from 'lucide-react';
import { 
  INDONESIAN_HOLIDAYS, 
  isSunday, 
  isNationalHoliday, 
  formatDateToYYYYMMDD, 
  getHolidayName 
} from '../utils/dateUtils';
import { TouchButton } from './TouchButton';

interface CalendarDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialDate?: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Ming', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const CalendarDatePickerModal: React.FC<CalendarDatePickerModalProps> = ({
  isOpen,
  onClose,
  title,
  initialDate,
  onSelectDate
}) => {
  if (!isOpen) return null;

  const parseInitialDate = () => {
    if (initialDate && initialDate.length === 10) {
      const [y, m, d] = initialDate.split('-').map(Number);
      if (y && m && d) {
        return new Date(y, m - 1, d);
      }
    }
    return new Date();
  };

  const initialParsed = parseInitialDate();
  const [currentYear, setCurrentYear] = useState<number>(initialParsed.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(initialParsed.getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState<string>(initialDate || '');

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Calendar matrix calculation
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ...
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays: {
    dayNumber: number;
    monthOffset: 'prev' | 'current' | 'next';
    dateStr: string;
    isSunday: boolean;
    isHoliday: boolean;
    holidayName: string | null;
  }[] = [];

  // Previous month trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDate - i;
    const prevDateObj = new Date(currentYear, currentMonth - 1, dayNum);
    const dateStr = formatDateToYYYYMMDD(prevDateObj);
    calendarDays.push({
      dayNumber: dayNum,
      monthOffset: 'prev',
      dateStr,
      isSunday: isSunday(prevDateObj),
      isHoliday: isNationalHoliday(prevDateObj),
      holidayName: getHolidayName(dateStr)
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(currentYear, currentMonth, d);
    const dateStr = formatDateToYYYYMMDD(dateObj);
    calendarDays.push({
      dayNumber: d,
      monthOffset: 'current',
      dateStr,
      isSunday: isSunday(dateObj),
      isHoliday: isNationalHoliday(dateObj),
      holidayName: getHolidayName(dateStr)
    });
  }

  // Next month leading days (fill up 35 or 42 grid slots)
  const remainingSlots = (calendarDays.length > 35 ? 42 : 35) - calendarDays.length;
  for (let d = 1; d <= remainingSlots; d++) {
    const nextDateObj = new Date(currentYear, currentMonth + 1, d);
    const dateStr = formatDateToYYYYMMDD(nextDateObj);
    calendarDays.push({
      dayNumber: d,
      monthOffset: 'next',
      dateStr,
      isSunday: isSunday(nextDateObj),
      isHoliday: isNationalHoliday(nextDateObj),
      holidayName: getHolidayName(dateStr)
    });
  }

  const handlePickDay = (dateStr: string) => {
    setSelectedDateStr(dateStr);
  };

  const handleConfirm = () => {
    onSelectDate(selectedDateStr);
    onClose();
  };

  const handleClearDate = () => {
    onSelectDate('');
    onClose();
  };

  // Selected date status summary
  const getSelectedDateSummary = () => {
    if (!selectedDateStr) return 'Belum ada tanggal dipilih';
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    if (!y || !m || !d) return selectedDateStr;
    const dt = new Date(y, m - 1, d);
    const dayNameStr = dt.toLocaleDateString('id-ID', { weekday: 'long' });
    const formattedStr = `${dayNameStr}, ${d} ${INDONESIAN_MONTHS[m - 1]} ${y}`;
    const isSun = isSunday(dt);
    const holName = getHolidayName(selectedDateStr);

    if (holName) {
      return {
        label: formattedStr,
        status: `🎉 Libur Nasional / Cuti Bersama: ${holName}`,
        isWorkDay: false
      };
    }
    if (isSun) {
      return {
        label: formattedStr,
        status: '🚨 Hari Minggu (Libur - Tidak Diukur Dalam Durasi)',
        isWorkDay: false
      };
    }
    return {
      label: formattedStr,
      status: '💼 Hari Kerja Efektif',
      isWorkDay: true
    };
  };

  const selectedSummary = getSelectedDateSummary();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-cyan-400 font-mono flex items-center gap-1.5">
              <span>📅</span>
              <span>{title}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner */}
        <div className="bg-cyan-950/60 border-b border-cyan-800/60 px-4 py-2.5 text-[11px] font-mono text-cyan-300 leading-snug">
          <span className="font-bold text-white block mb-0.5">⚡ Perhitungan Kerja Akurat:</span>
          <span>Durasi hari kerja kini dihitung secara presisi dengan mengecualikan Hari Minggu, Hari Libur Nasional, serta Cuti Bersama.</span>
        </div>

        {/* Month Selector */}
        <div className="p-3 bg-slate-900 flex items-center justify-between border-b border-slate-800/50">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-1 text-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>
          <div className="text-sm font-bold text-slate-100 font-mono">
            {INDONESIAN_MONTHS[currentMonth]} {currentYear}
          </div>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-1 text-xs"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-3 space-y-1">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 text-center font-mono text-[11px] font-bold py-1 border-b border-slate-800">
            {DAY_NAMES.map((day, idx) => (
              <span key={day} className={idx === 0 ? 'text-rose-400 font-extrabold' : 'text-slate-400'}>
                {day}
              </span>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1 pt-1">
            {calendarDays.map((item, index) => {
              const isSelected = item.dateStr === selectedDateStr;
              const isCurrentMonth = item.monthOffset === 'current';

              let cellStyle = 'bg-slate-950/60 text-slate-300 hover:bg-cyan-950/80 hover:text-cyan-200 border-slate-800';

              if (!isCurrentMonth) {
                cellStyle = 'bg-slate-950/20 text-slate-600 opacity-40 border-transparent';
              } else if (item.holidayName) {
                // National Holiday / Cuti Bersama
                cellStyle = 'bg-rose-950/80 text-rose-300 font-extrabold border-rose-600/80 shadow-sm hover:bg-rose-900/90';
              } else if (item.isSunday) {
                // Sunday
                cellStyle = 'bg-rose-950/40 text-rose-400 font-bold border-rose-900/50 hover:bg-rose-900/60';
              }

              if (isSelected) {
                cellStyle += ' ring-2 ring-cyan-400 border-cyan-400 text-white font-extrabold shadow-lg bg-cyan-950';
              }

              return (
                <button
                  key={`${item.dateStr}_${index}`}
                  type="button"
                  onClick={() => handlePickDay(item.dateStr)}
                  title={item.holidayName ? `Libur: ${item.holidayName}` : item.isSunday ? 'Hari Minggu' : 'Hari Kerja'}
                  className={`relative h-10 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer text-xs ${cellStyle}`}
                >
                  <span>{item.dayNumber}</span>
                  {item.holidayName && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 absolute bottom-1"></span>
                  )}
                  {item.isSunday && !item.holidayName && (
                    <span className="w-1 h-1 rounded-full bg-rose-500/70 absolute bottom-1"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Summary Footer */}
        {typeof selectedSummary === 'object' && (
          <div className="mx-3 my-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div>
              <div className="font-bold text-slate-200">{selectedSummary.label}</div>
              <div className={`text-[11px] ${selectedSummary.isWorkDay ? 'text-cyan-400' : 'text-rose-400 font-bold'}`}>
                {selectedSummary.status}
              </div>
            </div>
            {selectedSummary.isWorkDay ? (
              <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded text-[10px] font-bold">
                💼 Kerja
              </span>
            ) : (
              <span className="bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">
                🚨 Libur
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleClearDate}
            className="px-3 py-1.5 text-xs font-mono font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl border border-slate-800 transition-colors cursor-pointer"
          >
            Clear / Kosongkan
          </button>
          <div className="flex items-center gap-2">
            <TouchButton variant="secondary" size="sm" type="button" onClick={onClose}>
              Batal
            </TouchButton>
            <TouchButton variant="primary" size="sm" type="button" onClick={handleConfirm}>
              Pilih Tanggal Ini
            </TouchButton>
          </div>
        </div>
      </div>
    </div>
  );
};
