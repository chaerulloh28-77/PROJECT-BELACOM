import React, { useState } from 'react';
import { 
  PieChart as PieChartIcon, 
  CheckCircle2, 
  PlayCircle, 
  Clock, 
  XCircle, 
  ChevronRight, 
  MousePointerClick 
} from 'lucide-react';
import { StatusWO } from '../types';

interface StatusWoPieChartCardProps {
  total: number;
  doneCount: number;
  inProgressCount: number;
  notYetCount: number;
  cancelCount: number;
  achievementRate: number;
  onStatusClick?: (status: StatusWO) => void;
}

export const StatusWoPieChartCard: React.FC<StatusWoPieChartCardProps> = ({
  total,
  doneCount,
  inProgressCount,
  notYetCount,
  cancelCount,
  achievementRate,
  onStatusClick
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const statusItems = [
    {
      status: 'Done' as StatusWO,
      label: 'Done (Selesai)',
      shortLabel: 'Done',
      value: doneCount,
      color: '#10b981', // emerald-500
      icon: CheckCircle2,
      subtext: `${achievementRate}% Pencapaian`
    },
    {
      status: 'In Progress' as StatusWO,
      label: 'In Progress',
      shortLabel: 'In Progress',
      value: inProgressCount,
      color: '#06b6d4', // cyan-500
      icon: PlayCircle,
      subtext: 'Sedang Berjalan'
    },
    {
      status: 'Not Yet' as StatusWO,
      label: 'Not Yet',
      shortLabel: 'Not Yet',
      value: notYetCount,
      color: '#64748b', // slate-500
      icon: Clock,
      subtext: 'Belum Dimulai'
    },
    {
      status: 'Cancel' as StatusWO,
      label: 'Cancel (Batal)',
      shortLabel: 'Cancel',
      value: cancelCount,
      color: '#f43f5e', // rose-500
      icon: XCircle,
      subtext: 'Dibatalkan'
    }
  ];

  // SVG parameters
  const radius = 75;
  const strokeWidth = 26;
  const center = 100;
  const circumference = 2 * Math.PI * radius;
  let cumulativeAngle = 0;

  const activeItem = hoveredIndex !== null ? statusItems[hoveredIndex] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between hover:border-cyan-500/40 transition-all duration-200 select-none group">
      
      {/* Header matching screenshot */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold uppercase font-mono tracking-wider text-slate-100 flex items-center gap-1.5">
              <span>PENCAPAIAN STATUS WO (PIE CHART)</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Komposisi status siklus hidup Work Order
            </span>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-md bg-slate-950 text-emerald-400 border border-slate-800 text-xs font-mono font-bold">
          Total: <strong className="text-white">{total}</strong>
        </span>
      </div>

      {/* SVG Donut Chart */}
      <div className="relative flex items-center justify-center py-4 my-auto">
        <svg viewBox="0 0 200 200" className="w-44 h-44 sm:w-48 sm:h-48 transform -rotate-90">
          {total === 0 ? (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#1e293b"
              strokeWidth={strokeWidth}
            />
          ) : (
            statusItems.map((item, index) => {
              if (item.value === 0) return null;
              const percentage = item.value / total;
              const strokeDasharray = `${percentage * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativeAngle * circumference;
              cumulativeAngle += percentage;

              const isHovered = hoveredIndex === index;

              return (
                <circle
                  key={item.status}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={isHovered ? strokeWidth + 7 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-200 cursor-pointer"
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 10px ${item.color})` : 'none',
                    opacity: hoveredIndex !== null && !isHovered ? 0.6 : 1
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onStatusClick && onStatusClick(item.status)}
                />
              );
            })
          )}
        </svg>

        {/* Center Donut Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
          {activeItem ? (
            <>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono animate-fadeIn">
                {activeItem.value}
              </span>
              <span 
                className="text-[10px] uppercase tracking-wider font-extrabold font-mono truncate max-w-[120px]"
                style={{ color: activeItem.color }}
              >
                {activeItem.shortLabel}
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                {total > 0 ? `${Math.round((activeItem.value / total) * 100)}% dari total WO` : ''}
              </span>
            </>
          ) : (
            <>
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-400 font-mono">
                {achievementRate}%
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold font-mono">
                PENCAPAIAN DONE
              </span>
              <span className="text-[9px] text-cyan-400 font-mono font-semibold">
                {doneCount} dari {total} WO
              </span>
            </>
          )}
        </div>
      </div>

      {/* Interactive Legend List */}
      <div className="space-y-1.5 pt-2 border-t border-slate-800">
        {statusItems.map((item, index) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          const isHovered = hoveredIndex === index;
          const Icon = item.icon;

          return (
            <button
              key={item.status}
              type="button"
              onClick={() => onStatusClick && onStatusClick(item.status)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all duration-150 cursor-pointer active:scale-98 ${
                isHovered 
                  ? 'bg-slate-850 text-white shadow-md ring-1 ring-emerald-500/50' 
                  : 'hover:bg-slate-850/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-md shrink-0 shadow-sm transition-transform duration-200"
                  style={{ backgroundColor: item.color }}
                ></span>
                <span className="font-bold text-slate-100 font-mono text-left">
                  {item.label}
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-400 text-[11px] font-bold">{pct}%</span>
                <span className="font-bold text-white px-2 py-0.5 bg-slate-950 rounded border border-slate-800 text-[11px]">
                  {item.value} WO
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info Prompt */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-emerald-400 font-mono">
        <span className="flex items-center gap-1">
          <MousePointerClick className="w-3 h-3" />
          Klik status untuk filter detail WO
        </span>
        <span className="text-slate-500">
          Target 100% Selesai
        </span>
      </div>

    </div>
  );
};
