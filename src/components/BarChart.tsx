import React, { useState, useMemo } from 'react';
import { BarChart3, MousePointerClick, Info } from 'lucide-react';

export interface BarChartStackItem {
  label: string;
  value: number;
  color: string;
}

export interface BarChartDataItem {
  label: string;
  value: number;
  color?: string;
  subtext?: string;
  stacks?: BarChartStackItem[];
}

interface BarChartProps {
  title: string;
  data: BarChartDataItem[];
  onBarClick?: (item: BarChartDataItem) => void;
  height?: number;
  valueSuffix?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  title,
  data,
  onBarClick,
  height = 180,
  valueSuffix = ''
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Dynamic Legend Generator from Stacks
  const dynamicLegend = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach(d => {
      if (d.stacks) {
        d.stacks.forEach(s => {
          if (!map.has(s.label) && s.label) {
            map.set(s.label, s.color);
          }
        });
      }
    });
    return Array.from(map.entries()).map(([label, color]) => ({ label, color }));
  }, [data]);

  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all duration-200 group select-none">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-4 h-4" />
          </div>
          <span>{title}</span>
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          Total: <strong className="text-cyan-400 font-bold">{totalValue}</strong> {valueSuffix}
        </span>
      </div>

      {/* Stacked Legend Top Header if available */}
      {dynamicLegend.length > 0 && (
        <div className="mb-3 pb-2.5 border-b border-slate-800/60 flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-[10px] font-mono">
          {dynamicLegend.map((item: { label: string; color: string }, idx: number) => (
            <div key={idx} className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }}></span>
              <span className="text-slate-300">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bar Chart Canvas Area with Background Gridlines */}
      <div className="w-full relative py-2">
        
        {/* Background Grid Lines (0%, 25%, 50%, 75%, 100%) */}
        <div 
          className="absolute inset-x-0 top-2 bottom-8 flex flex-col justify-between pointer-events-none opacity-20 border-t border-b border-slate-700"
          style={{ height: `${height}px` }}
        >
          <div className="w-full border-b border-dashed border-slate-600"></div>
          <div className="w-full border-b border-dashed border-slate-600"></div>
          <div className="w-full border-b border-dashed border-slate-600"></div>
        </div>

        {data.length === 0 ? (
          <div 
            className="w-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs gap-2"
            style={{ height: `${height}px` }}
          >
            <Info className="w-5 h-5 text-slate-600" />
            <span>Tidak ada data untuk filter ini</span>
          </div>
        ) : (
          <div 
            className="flex items-end justify-around gap-1.5 sm:gap-2 w-full relative z-10"
            style={{ height: `${height}px` }}
          >
            {data.map((item, index) => {
              const isHovered = hoveredIndex === index;
              
              // Raw height percentage relative to maxValue
              const rawPercent = Math.round((item.value / maxValue) * 100);
              // Ensure visible bar height floor when value > 0
              const heightPercent = item.value > 0 ? Math.max(rawPercent, 12) : 4;
              const barColor = item.color || '#06b6d4';

              return (
                <div
                  key={item.label + index}
                  className="flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer group/bar"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onBarClick && onBarClick(item)}
                >
                  {/* Detailed Multi-stack Tooltip on Hover */}
                  {isHovered && (
                    <div className="absolute -top-20 sm:-top-24 z-30 bg-slate-950/95 text-white font-mono text-[11px] p-2.5 rounded-xl border border-cyan-500/80 shadow-2xl min-w-[140px] pointer-events-none flex flex-col gap-1 backdrop-blur-md animate-fadeIn">
                      <div className="font-bold text-cyan-300 border-b border-slate-800 pb-1 flex justify-between">
                        <span>{item.label}</span>
                        <span>{item.value} {valueSuffix}</span>
                      </div>
                      {item.stacks && item.stacks.length > 0 ? (
                        <div className="space-y-0.5 text-[10px]">
                          {item.stacks.map((st, sIdx) => st.value > 0 && (
                            <div key={sIdx} className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }}></span>
                                <span className="text-slate-300">{st.label}:</span>
                              </span>
                              <strong className="text-white">{st.value}</strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">{item.value} {valueSuffix} ({totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0}%)</span>
                      )}
                    </div>
                  )}

                  {/* Value Badge above Bar */}
                  <span className={`text-[10px] sm:text-[11px] font-mono font-extrabold mb-1 transition-all duration-150 ${
                    isHovered ? 'text-cyan-300 scale-110' : item.value > 0 ? 'text-white' : 'text-slate-600'
                  }`}>
                    {item.value}
                  </span>

                  {/* Bar Track Container */}
                  <div className="w-full max-w-[48px] h-full bg-slate-950/90 rounded-t-xl overflow-hidden border border-slate-800/90 p-0.5 shadow-inner flex flex-col justify-end relative">
                    
                    {/* Stacked Segments Fill using Flex basis for 100% reliable rendering */}
                    {item.stacks && item.stacks.length > 0 && item.value > 0 ? (
                      <div
                        className="w-full flex flex-col rounded-t-lg overflow-hidden transition-all duration-300 shrink-0"
                        style={{ height: `${heightPercent}%` }}
                      >
                        {item.stacks.map((stack, sIdx) => {
                          if (stack.value === 0) return null;

                          return (
                            <div
                              key={sIdx}
                              style={{
                                flex: `${stack.value} 1 0%`,
                                backgroundColor: stack.color,
                                minHeight: '3px'
                              }}
                              className="w-full transition-all duration-200 hover:brightness-125 border-b border-slate-900/30 last:border-b-0"
                              title={`${stack.label}: ${stack.value}`}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      /* Single Bar Fill */
                      <div
                        className="w-full rounded-t-lg transition-all duration-300 shrink-0"
                        style={{
                          height: `${heightPercent}%`,
                          backgroundColor: item.value > 0 ? barColor : '#334155',
                          boxShadow: isHovered && item.value > 0 ? `0 0 14px ${barColor}` : 'none'
                        }}
                      />
                    )}

                  </div>

                  {/* X Axis Label */}
                  <span className={`text-[9px] sm:text-[10px] font-mono mt-2 truncate max-w-[70px] text-center transition-colors ${
                    isHovered ? 'text-cyan-300 font-bold' : 'text-slate-400'
                  }`} title={item.label}>
                    {item.label}
                  </span>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Interactivity Footnote */}
      <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono text-center flex items-center justify-center gap-1">
        <MousePointerClick className="w-3 h-3 text-cyan-400" />
        <span>Klik batang grafik untuk memfilter rincian data</span>
      </div>

    </div>
  );
};
