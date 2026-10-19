import React, { useState } from 'react';
import { MousePointerClick, Info } from 'lucide-react';

export interface TeamStatusData {
  team: string;
  total: number;
  done: number;
  inProgress: number;
  notYet: number;
  cancel: number;
}

interface Props {
  data: TeamStatusData[];
  onTeamClick?: (teamName: string, status?: string) => void;
  height?: number;
}

export const STATUS_LEGEND = [
  { key: 'done', label: 'Done', color: '#10b981' },
  { key: 'inProgress', label: 'In Progress', color: '#06b6d4' },
  { key: 'notYet', label: 'Not Yet', color: '#64748b' },
  { key: 'cancel', label: 'Cancel', color: '#f43f5e' },
] as const;

export const TeamStatusAchievementChart: React.FC<Props> = ({
  data,
  onTeamClick,
  height = 340
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxDataValue = Math.max(...data.map(d => d.total), 1);
  const maxY = Math.max(60, Math.ceil(maxDataValue / 5) * 5);

  const tickCount = 13; // e.g. 0, 5, 10, 15, ..., maxY
  const step = maxY / (tickCount - 1);
  const yTicks = Array.from({ length: tickCount }, (_, i) => Math.round(maxY - i * step));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all duration-200 select-none">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span className="text-lg">📊</span>
          <span>Grafik Pencapaian Team Berdasarkan Status WO</span>
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          Total WO Terdata: <strong className="text-cyan-600 dark:text-cyan-400 font-bold">{data.reduce((a, b) => a + b.total, 0)}</strong>
        </span>
      </div>

      {/* Top Legend Bar for 4 Statuses: Done, In Progress, Not Yet, Cancel */}
      <div className="mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono">
        {STATUS_LEGEND.map((item) => (
          <div key={item.key} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <span 
              className="w-3.5 h-3.5 rounded-sm shrink-0 inline-block shadow-xs" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-slate-700 dark:text-slate-200 font-bold">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full relative overflow-x-auto pb-10 pt-2">
        <div className="min-w-[700px] relative">
          
          {/* Y-Axis Grid Lines & Ticks */}
          <div className="relative w-full" style={{ height: `${height}px` }}>
            {yTicks.map((tickVal, idx) => {
              const topPercent = (idx / (tickCount - 1)) * 100;
              return (
                <div 
                  key={idx} 
                  className="absolute inset-x-0 flex items-center pointer-events-none"
                  style={{ top: `${topPercent}%` }}
                >
                  <span className="w-8 text-[10px] font-mono text-slate-400 dark:text-slate-500 text-right pr-2 shrink-0">
                    {tickVal}
                  </span>
                  <div className="w-full border-b border-slate-200 dark:border-slate-800 border-dashed" />
                </div>
              );
            })}

            {/* Bars Container */}
            {data.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-mono text-xs gap-2">
                <Info className="w-5 h-5" />
                <span>Tidak ada data untuk filter ini</span>
              </div>
            ) : (
              <div className="absolute inset-y-0 left-8 right-0 flex items-end justify-between px-2 gap-1.5 sm:gap-2 z-10">
                {data.map((item, index) => {
                  const isHovered = hoveredIndex === index;
                  const heightPercent = item.total > 0 ? (item.total / maxY) * 100 : 0;

                  return (
                    <div
                      key={item.team + index}
                      className="flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer group/bar"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => onTeamClick && onTeamClick(item.team)}
                    >
                      {/* Floating Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-24 z-30 bg-slate-900 text-white font-mono text-[11px] p-3 rounded-xl border border-cyan-500/80 shadow-2xl min-w-[160px] pointer-events-none flex flex-col gap-1 backdrop-blur-md animate-fadeIn">
                          <div className="font-bold text-cyan-300 border-b border-slate-700 pb-1 flex justify-between">
                            <span>{item.team}</span>
                            <span>{item.total} WO</span>
                          </div>
                          <div className="space-y-1 text-[10px] text-slate-300 pt-1">
                            {item.done > 0 && (
                              <div className="flex justify-between">
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Done:
                                </span> 
                                <strong>{item.done}</strong>
                              </div>
                            )}
                            {item.inProgress > 0 && (
                              <div className="flex justify-between">
                                <span className="text-cyan-400 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" /> In Progress:
                                </span> 
                                <strong>{item.inProgress}</strong>
                              </div>
                            )}
                            {item.notYet > 0 && (
                              <div className="flex justify-between">
                                <span className="text-slate-400 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Not Yet:
                                </span> 
                                <strong>{item.notYet}</strong>
                              </div>
                            )}
                            {item.cancel > 0 && (
                              <div className="flex justify-between">
                                <span className="text-rose-400 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Cancel:
                                </span> 
                                <strong>{item.cancel}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Bar Track Container */}
                      <div className="w-full max-w-[38px] h-full flex flex-col justify-end relative">
                        {item.total > 0 ? (
                          <div
                            className="w-full flex flex-col rounded-t-sm overflow-hidden transition-all duration-300 shrink-0 shadow-sm hover:brightness-110"
                            style={{ height: `${Math.max(heightPercent, 2)}%` }}
                          >
                            {/* Stacks ordered from bottom to top: Done, In Progress, Not Yet, Cancel */}
                            {item.done > 0 && (
                              <div style={{ flex: `${item.done} 1 0%`, backgroundColor: '#10b981' }} title={`Done: ${item.done}`} />
                            )}
                            {item.inProgress > 0 && (
                              <div style={{ flex: `${item.inProgress} 1 0%`, backgroundColor: '#06b6d4' }} title={`In Progress: ${item.inProgress}`} />
                            )}
                            {item.notYet > 0 && (
                              <div style={{ flex: `${item.notYet} 1 0%`, backgroundColor: '#64748b' }} title={`Not Yet: ${item.notYet}`} />
                            )}
                            {item.cancel > 0 && (
                              <div style={{ flex: `${item.cancel} 1 0%`, backgroundColor: '#f43f5e' }} title={`Cancel: ${item.cancel}`} />
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
                        )}
                      </div>

                      {/* X-Axis Tilted Label */}
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span 
                          className={`text-[10px] font-mono font-semibold block transition-colors transform -rotate-30 origin-top-left ${
                            isHovered ? 'text-cyan-600 dark:text-cyan-300 font-bold' : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {item.team}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Footer Helper */}
      <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-mono text-center flex items-center justify-center gap-1.5">
        <MousePointerClick className="w-3.5 h-3.5 text-cyan-500 animate-bounce" />
        <span>Klik batang grafik team untuk membuka rincian detail dokumen WO</span>
      </div>

    </div>
  );
};
