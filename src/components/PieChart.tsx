import React, { useState } from 'react';
import { MousePointerClick, PieChart as PieChartIcon } from 'lucide-react';

export interface PieChartDataItem {
  label: string;
  value: number;
  color: string;
  subtext?: string;
}

interface PieChartProps {
  title: string;
  data: PieChartDataItem[];
  onSliceClick?: (item: PieChartDataItem) => void;
  centerText?: string;
  centerSubtext?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  title,
  data,
  onSliceClick,
  centerText,
  centerSubtext
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  // Calculate SVG arc paths
  let cumulativeAngle = 0;
  const radius = 80;
  const strokeWidth = 28;
  const center = 100;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all duration-200 group select-none">
      
      {/* Title */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
            <PieChartIcon className="w-3.5 h-3.5" />
          </div>
          <span>{title}</span>
        </h3>
        <span className="text-xs text-slate-400 font-mono font-medium">
          Total: <strong className="text-white">{total}</strong>
        </span>
      </div>

      {/* SVG Donut Chart */}
      <div className="relative flex items-center justify-center py-2">
        <svg viewBox="0 0 200 200" className="w-48 h-48 transform -rotate-90">
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
              const percentage = item.value / total;
              const strokeDasharray = `${percentage * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativeAngle * circumference;
              cumulativeAngle += percentage;

              const isHovered = hoveredIndex === index;

              return (
                <circle
                  key={item.label}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-200 cursor-pointer hover:opacity-95 active:scale-95"
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 8px ${item.color})` : 'none'
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onSliceClick && onSliceClick(item)}
                />
              );
            })
          )}
        </svg>

        {/* Center Donut Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-2xl font-black tracking-tight text-white font-mono transition-transform duration-150">
            {hoveredIndex !== null ? data[hoveredIndex].value : (centerText || total)}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-1 truncate max-w-[100px]">
            {hoveredIndex !== null ? data[hoveredIndex].label : (centerSubtext || 'Total Items')}
          </span>
        </div>
      </div>

      {/* Interactive Legend & Drilldown triggers */}
      <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-800">
        {data.map((item, index) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
          const isHovered = hoveredIndex === index;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSliceClick && onSliceClick(item)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all duration-150 cursor-pointer active:scale-98 ${
                isHovered ? 'bg-slate-850 text-white shadow-md ring-1 ring-cyan-500/50' : 'hover:bg-slate-850/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-md shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: item.color }}
                ></span>
                <span className="font-medium truncate text-left max-w-[120px]" title={item.label}>
                  {item.label}
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-400 text-[11px]">{pct}%</span>
                <span className="font-bold text-white px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800">
                  {item.value}
                </span>
                <MousePointerClick className="w-3.5 h-3.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
};
