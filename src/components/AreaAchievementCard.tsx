import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  ChevronRight, 
  MousePointerClick, 
  CheckCircle2, 
  RadioTower, 
  Layers 
} from 'lucide-react';
import { DailyReportItem } from '../types';

interface AreaAchievementCardProps {
  reports: DailyReportItem[];
  onAreaClick?: (areaName: string) => void;
}

const AREA_COLORS: Record<string, string> = {
  'Jabo 1': '#06b6d4', // cyan-500
  'Jabo 2': '#6366f1', // indigo-500
  'Jabo 3': '#f59e0b', // amber-500
  'Other': '#94a3b8'
};

export const AreaAchievementCard: React.FC<AreaAchievementCardProps> = ({
  reports,
  onAreaClick
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute area stats
  const areaData = useMemo(() => {
    const areas = ['Jabo 1', 'Jabo 2', 'Jabo 3'];
    const map = new Map<string, { total: number; done: number; inProgress: number; notYet: number; cancel: number }>();

    areas.forEach(a => {
      map.set(a, { total: 0, done: 0, inProgress: 0, notYet: 0, cancel: 0 });
    });

    reports.forEach(r => {
      const area = r.assignment || 'Jabo 1';
      if (!map.has(area)) {
        map.set(area, { total: 0, done: 0, inProgress: 0, notYet: 0, cancel: 0 });
      }
      const entry = map.get(area)!;
      entry.total += 1;
      if (r.statusWo === 'Done') entry.done += 1;
      else if (r.statusWo === 'In Progress') entry.inProgress += 1;
      else if (r.statusWo === 'Not Yet') entry.notYet += 1;
      else if (r.statusWo === 'Cancel') entry.cancel += 1;
    });

    return Array.from(map.entries())
      .map(([name, stats]) => {
        const doneRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
        return {
          name,
          ...stats,
          doneRate,
          color: AREA_COLORS[name] || '#94a3b8'
        };
      })
      .filter(a => a.total > 0 || reports.length === 0);
  }, [reports]);

  const totalValue = areaData.reduce((acc, curr) => acc + curr.total, 0);

  // SVG parameters
  const radius = 75;
  const strokeWidth = 26;
  const center = 100;
  const circumference = 2 * Math.PI * radius;
  let cumulativeAngle = 0;

  const activeItem = hoveredIndex !== null && areaData[hoveredIndex] ? areaData[hoveredIndex] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between hover:border-cyan-500/40 transition-all duration-200 select-none group">
      
      {/* Header matching screenshot */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold uppercase font-mono tracking-wider text-slate-100 flex items-center gap-1.5">
              <span>PENCAPAIAN DOKUMEN WO PER AREA</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Distribusi regional Jabo 1, Jabo 2, Jabo 3
            </span>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-md bg-slate-950 text-indigo-400 border border-slate-800 text-xs font-mono font-bold">
          Total Item: <strong className="text-white">{reports.length}</strong>
        </span>
      </div>

      {/* SVG Donut Chart */}
      <div className="relative flex items-center justify-center py-4 my-auto">
        <svg viewBox="0 0 200 200" className="w-44 h-44 sm:w-48 sm:h-48 transform -rotate-90">
          {totalValue === 0 ? (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#1e293b"
              strokeWidth={strokeWidth}
            />
          ) : (
            areaData.map((item, index) => {
              const percentage = item.total / totalValue;
              const strokeDasharray = `${percentage * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativeAngle * circumference;
              cumulativeAngle += percentage;

              const isHovered = hoveredIndex === index;

              return (
                <circle
                  key={item.name}
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
                  onClick={() => onAreaClick && onAreaClick(item.name)}
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
                {activeItem.total}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-400 font-mono">
                {activeItem.name}
              </span>
              <span className="text-[9px] text-emerald-400 font-mono font-semibold">
                {activeItem.done} Selesai ({activeItem.doneRate}%)
              </span>
            </>
          ) : (
            <>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                {totalValue}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold font-mono">
                TOTAL WO AREA
              </span>
              <span className="text-[9px] text-indigo-400 font-mono font-semibold">
                3 Wilayah Jabo
              </span>
            </>
          )}
        </div>
      </div>

      {/* Interactive Legend List */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        {areaData.map((item, index) => {
          const pct = totalValue > 0 ? Math.round((item.total / totalValue) * 100) : 0;
          const isHovered = hoveredIndex === index;

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onAreaClick && onAreaClick(item.name)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer active:scale-98 ${
                isHovered 
                  ? 'bg-slate-850 text-white shadow-md ring-1 ring-indigo-500/50' 
                  : 'hover:bg-slate-850/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-md shrink-0 shadow-sm transition-transform duration-200"
                  style={{ backgroundColor: item.color }}
                ></span>
                <div className="text-left">
                  <span className="font-bold text-slate-100 font-mono block">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {item.done} Selesai • {item.inProgress} Berjalan
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <span className="text-indigo-400 text-[11px] font-bold">{pct}%</span>
                <span className="font-bold text-white px-2 py-0.5 bg-slate-950 rounded border border-slate-800 text-[11px]">
                  {item.total} WO
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info Prompt */}
      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-indigo-400 font-mono">
        <span className="flex items-center gap-1">
          <MousePointerClick className="w-3 h-3" />
          Klik baris area untuk filter detail WO
        </span>
        <span className="text-slate-500">
          Cakupan Telekomunikasi Jabo
        </span>
      </div>

    </div>
  );
};
