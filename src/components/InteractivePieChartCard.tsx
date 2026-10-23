import React, { useState } from 'react';
import { 
  PieChart as PieChartIcon, 
  ChevronRight, 
  MousePointerClick,
  X,
  Check
} from 'lucide-react';

export interface PieChartSliceData {
  id: string;
  label: string;
  shortLabel: string;
  value: number;
  color: string;
  icon?: React.ElementType;
  subtext?: string;
}

interface InteractivePieChartCardProps {
  title: string;
  subtitle: string;
  total: number;
  data: PieChartSliceData[];
  selectedId: string | null;
  onSelectSlice: (id: string | null) => void;
  centerTitle?: string;
  centerSubtitle?: string;
}

export const InteractivePieChartCard: React.FC<InteractivePieChartCardProps> = ({
  title,
  subtitle,
  total,
  data,
  selectedId,
  onSelectSlice,
  centerTitle,
  centerSubtitle
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG parameters
  const radius = 75;
  const strokeWidth = 26;
  const center = 100;
  const circumference = 2 * Math.PI * radius;
  let cumulativeAngle = 0;

  const activeIndex = data.findIndex(item => item.id === selectedId);
  const activeHoveredItem = hoveredIndex !== null ? data[hoveredIndex] : null;
  const activeSelectedItem = activeIndex !== -1 ? data[activeIndex] : null;
  const displayItem = activeHoveredItem || activeSelectedItem;

  return (
    <div className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all duration-300 select-none ${
      selectedId ? 'border-cyan-500/60 shadow-cyan-950/40 ring-1 ring-cyan-500/30' : 'border-slate-800 hover:border-slate-700'
    }`}>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold uppercase font-mono tracking-wider text-slate-100">
              {title}
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              {subtitle}
            </span>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-md bg-slate-950 text-cyan-400 border border-slate-800 text-xs font-mono font-bold">
          Total: <strong className="text-white">{total}</strong>
        </span>
      </div>

      {/* SVG Donut Chart */}
      <div className="relative flex items-center justify-center py-5 my-auto">
        <svg viewBox="0 0 200 200" className="w-48 h-48 sm:w-52 sm:h-52 transform -rotate-90">
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
            data.map((item, index) => {
              if (item.value === 0) return null;
              const percentage = item.value / total;
              const strokeDasharray = `${percentage * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativeAngle * circumference;
              cumulativeAngle += percentage;

              const isHovered = hoveredIndex === index;
              const isSelected = selectedId === item.id;

              return (
                <circle
                  key={item.id}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={isSelected ? strokeWidth + 9 : isHovered ? strokeWidth + 5 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-200 cursor-pointer"
                  style={{
                    filter: isSelected || isHovered ? `drop-shadow(0 0 12px ${item.color})` : 'none',
                    opacity: selectedId && !isSelected && hoveredIndex === null ? 0.45 : hoveredIndex !== null && !isHovered ? 0.6 : 1
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onSelectSlice(isSelected ? null : item.id)}
                />
              );
            })
          )}
        </svg>

        {/* Center Donut Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
          {displayItem ? (
            <>
              <span className="text-2xl font-black tracking-tight text-white font-mono animate-fadeIn">
                {displayItem.value}
              </span>
              <span 
                className="text-[10px] uppercase tracking-wider font-extrabold font-mono truncate max-w-[130px]"
                style={{ color: displayItem.color }}
              >
                {displayItem.shortLabel}
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                {total > 0 ? `${Math.round((displayItem.value / total) * 100)}% dari total` : ''}
              </span>
            </>
          ) : (
            <>
              <span className="text-2xl font-black tracking-tight text-cyan-400 font-mono">
                {centerTitle || total}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold font-mono">
                {centerSubtitle || 'TOTAL DATA'}
              </span>
              <span className="text-[9px] text-cyan-400 font-mono font-semibold">
                Klik irisan chart
              </span>
            </>
          )}
        </div>
      </div>

      {/* Interactive Legend List */}
      <div className="space-y-1.5 pt-3 border-t border-slate-800">
        {data.map((item, index) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          const isHovered = hoveredIndex === index;
          const isSelected = selectedId === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSlice(isSelected ? null : item.id)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all duration-150 cursor-pointer active:scale-98 ${
                isSelected
                  ? 'bg-cyan-950/80 text-white shadow-lg ring-1 ring-cyan-400/80 font-bold border border-cyan-500/50'
                  : isHovered 
                    ? 'bg-slate-800/80 text-white' 
                    : 'hover:bg-slate-800/50 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-md shrink-0 shadow-sm transition-transform duration-200"
                  style={{ backgroundColor: item.color }}
                ></span>
                {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                <span className="font-semibold text-slate-100 font-mono text-left truncate max-w-[140px]">
                  {item.label}
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-400 text-[11px] font-bold">{pct}%</span>
                <span className="font-bold text-white px-2 py-0.5 bg-slate-950 rounded border border-slate-800 text-[11px]">
                  {item.value}
                </span>
                {isSelected ? (
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Slice Reset Notification */}
      {selectedId && (
        <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-cyan-400 bg-cyan-950/40 p-2 rounded-xl border border-cyan-500/20">
          <span>Filter Aktif: <strong>{data.find(d => d.id === selectedId)?.label}</strong></span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectSlice(null);
            }}
            className="flex items-center gap-1 text-[10px] text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/30 px-2 py-0.5 rounded border border-rose-500/20 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" /> Reset Filter
          </button>
        </div>
      )}

      {/* Footer Instructions */}
      {!selectedId && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-cyan-400 font-mono">
          <span className="flex items-center gap-1">
            <MousePointerClick className="w-3 h-3" />
            Klik irisan grafik untuk melihat rincian detail
          </span>
          <span className="text-slate-500">
            Interactive Slice
          </span>
        </div>
      )}

    </div>
  );
};
