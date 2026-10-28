import React, { useState, useMemo } from 'react';
import { 
  PieChart as PieChartIcon, 
  Users, 
  Award, 
  CheckCircle2, 
  PlayCircle, 
  Clock, 
  XCircle, 
  MousePointerClick, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  Filter
} from 'lucide-react';
import { DailyReportItem } from '../types';

interface TeamActivityPieChartProps {
  reports: DailyReportItem[];
  onTeamClick?: (teamName: string) => void;
  onStatusClick?: (statusName: string) => void;
}

type ViewMode = 'team-share' | 'done-contribution' | 'team-status-drill';

// High-contrast, elegant color palette for teams
const TEAM_COLORS = [
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#8b5cf6', // purple-500
  '#f59e0b', // amber-500
  '#3b82f6', // blue-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f43f5e', // rose-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
  '#eab308', // yellow-500
  '#a855f7'  // fuchsia-500
];

const STATUS_COLORS: Record<string, string> = {
  'Done': '#10b981',
  'In Progress': '#06b6d4',
  'Not Yet': '#64748b',
  'Cancel': '#f43f5e'
};

export const TeamActivityPieChart: React.FC<TeamActivityPieChartProps> = ({
  reports,
  onTeamClick,
  onStatusClick
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('team-share');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedTeamForDrill, setSelectedTeamForDrill] = useState<string>('ALL');

  // Compute team performance data
  const teamStats = useMemo(() => {
    const map = new Map<string, {
      total: number;
      done: number;
      inProgress: number;
      notYet: number;
      cancel: number;
    }>();

    reports.forEach(r => {
      const team = r.team || 'Unassigned';
      if (!map.has(team)) {
        map.set(team, { total: 0, done: 0, inProgress: 0, notYet: 0, cancel: 0 });
      }
      const entry = map.get(team)!;
      entry.total += 1;
      if (r.statusWo === 'Done') entry.done += 1;
      else if (r.statusWo === 'In Progress') entry.inProgress += 1;
      else if (r.statusWo === 'Not Yet') entry.notYet += 1;
      else if (r.statusWo === 'Cancel') entry.cancel += 1;
    });

    return Array.from(map.entries())
      .map(([team, stats]) => ({
        team,
        ...stats,
        doneRate: stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [reports]);

  // Set default team for drill if needed
  const activeDrillTeam = selectedTeamForDrill === 'ALL' && teamStats.length > 0 
    ? teamStats[0].team 
    : selectedTeamForDrill;

  // Chart Slices Data depending on viewMode
  const chartData = useMemo(() => {
    if (viewMode === 'team-share') {
      return teamStats.map((item, index) => ({
        label: item.team,
        value: item.total,
        color: TEAM_COLORS[index % TEAM_COLORS.length],
        secondaryInfo: `${item.done} Done (${item.doneRate}%)`,
        doneCount: item.done,
        inProgCount: item.inProgress,
        notYetCount: item.notYet,
        cancelCount: item.cancel,
        doneRate: item.doneRate
      }));
    } else if (viewMode === 'done-contribution') {
      const teamsWithDone = teamStats.filter(t => t.done > 0);
      return teamsWithDone.map((item, index) => ({
        label: item.team,
        value: item.done,
        color: TEAM_COLORS[index % TEAM_COLORS.length],
        secondaryInfo: `dari ${item.total} total WO`,
        doneCount: item.done,
        inProgCount: item.inProgress,
        notYetCount: item.notYet,
        cancelCount: item.cancel,
        doneRate: item.doneRate
      }));
    } else {
      // team-status-drill
      const current = teamStats.find(t => t.team === activeDrillTeam);
      if (!current) return [];
      return [
        { label: 'Done', value: current.done, color: STATUS_COLORS['Done'], secondaryInfo: `${current.doneRate}% tercapai` },
        { label: 'In Progress', value: current.inProgress, color: STATUS_COLORS['In Progress'], secondaryInfo: 'Sedang berjalan' },
        { label: 'Not Yet', value: current.notYet, color: STATUS_COLORS['Not Yet'], secondaryInfo: 'Belum dimulai' },
        { label: 'Cancel', value: current.cancel, color: STATUS_COLORS['Cancel'], secondaryInfo: 'Dibatalkan' }
      ].filter(s => s.value > 0);
    }
  }, [viewMode, teamStats, activeDrillTeam]);

  const totalValue = chartData.reduce((acc, curr) => acc + curr.value, 0);

  // SVG parameters
  const radius = 75;
  const strokeWidth = 26;
  const center = 100;
  const circumference = 2 * Math.PI * radius;
  let cumulativeAngle = 0;

  // Active hover item
  const activeItem = hoveredIndex !== null && chartData[hoveredIndex] ? chartData[hoveredIndex] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between hover:border-cyan-500/40 transition-all duration-200 select-none group">
      
      {/* Header matching screenshot style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold uppercase font-mono tracking-wider text-slate-100 flex items-center gap-1.5">
              <span>STATUS AKTIVITAS TEAM DARI TOTAL WO (PIE CHART)</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Rasio distribusi dan performa aktivitas tim pelaksana
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-cyan-400 border border-slate-800 text-xs font-mono font-bold">
            Total Item: <strong className="text-white">{reports.length}</strong>
          </span>
        </div>
      </div>

      {/* Mode Switches */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl my-3 border border-slate-800 text-[10px] font-mono">
        <button
          onClick={() => { setViewMode('team-share'); setHoveredIndex(null); }}
          className={`py-1.5 px-2 rounded-lg transition-all text-center font-bold cursor-pointer truncate ${
            viewMode === 'team-share'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Proporsi WO Tiap Tim"
        >
          Proporsi Tim
        </button>

        <button
          onClick={() => { setViewMode('done-contribution'); setHoveredIndex(null); }}
          className={`py-1.5 px-2 rounded-lg transition-all text-center font-bold cursor-pointer truncate ${
            viewMode === 'done-contribution'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Kontribusi WO Selesai (Done)"
        >
          Aktivitas Done
        </button>

        <button
          onClick={() => { setViewMode('team-status-drill'); setHoveredIndex(null); }}
          className={`py-1.5 px-2 rounded-lg transition-all text-center font-bold cursor-pointer truncate ${
            viewMode === 'team-status-drill'
              ? 'bg-indigo-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Rincian Status Tim Pilihan"
        >
          Status per Tim
        </button>
      </div>

      {/* Team selector for 'team-status-drill' mode */}
      {viewMode === 'team-status-drill' && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-[11px] font-mono text-slate-400">Pilih Tim:</span>
          <select
            value={activeDrillTeam}
            onChange={(e) => {
              setSelectedTeamForDrill(e.target.value);
              setHoveredIndex(null);
            }}
            className="flex-1 bg-slate-950 border border-slate-800 text-xs text-cyan-300 font-mono rounded-lg px-2.5 py-1 outline-none focus:border-cyan-500"
          >
            {teamStats.map(t => (
              <option key={t.team} value={t.team}>
                {t.team} — {t.total} WO ({t.done} Selesai)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Donut Chart Canvas */}
      <div className="relative flex items-center justify-center py-2">
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
            chartData.map((item, index) => {
              const percentage = item.value / totalValue;
              const strokeDasharray = `${percentage * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativeAngle * circumference;
              cumulativeAngle += percentage;

              const isHovered = hoveredIndex === index;

              return (
                <circle
                  key={`team-act-slice-${item.label || index}-${index}`}
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
                  onClick={() => {
                    if (viewMode === 'team-status-drill') {
                      onStatusClick && onStatusClick(item.label);
                    } else {
                      onTeamClick && onTeamClick(item.label);
                    }
                  }}
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
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-cyan-400 font-mono truncate max-w-[120px]">
                {activeItem.label}
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                {totalValue > 0 ? `${Math.round((activeItem.value / totalValue) * 100)}% dari total` : ''}
              </span>
            </>
          ) : (
            <>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                {totalValue}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold font-mono">
                {viewMode === 'team-share' ? 'TOTAL WO' : viewMode === 'done-contribution' ? 'WO SELESAI' : 'TOTAL WO TIM'}
              </span>
              <span className="text-[9px] text-emerald-400 font-mono font-semibold">
                {teamStats.length} Tim Pelaksana
              </span>
            </>
          )}
        </div>
      </div>

      {/* Interactive Legend List */}
      <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-800 max-h-48 overflow-y-auto scrollbar-thin">
        {chartData.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500 font-mono">
            Tidak ada aktivitas data yang sesuai filter
          </div>
        ) : (
          chartData.map((item, index) => {
            const pct = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
            const isHovered = hoveredIndex === index;

            return (
              <button
                key={`team-act-legend-${item.label || index}-${index}`}
                type="button"
                onClick={() => {
                  if (viewMode === 'team-status-drill') {
                    onStatusClick && onStatusClick(item.label);
                  } else {
                    onTeamClick && onTeamClick(item.label);
                  }
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all duration-150 cursor-pointer active:scale-98 ${
                  isHovered 
                    ? 'bg-slate-850 text-white shadow-md ring-1 ring-cyan-500/50' 
                    : 'hover:bg-slate-850/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-md shrink-0 shadow-sm transition-transform duration-200"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <div className="text-left truncate">
                    <span className="font-bold text-slate-100 font-mono block truncate">
                      {item.label}
                    </span>
                    {item.secondaryInfo && (
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {item.secondaryInfo}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono shrink-0">
                  <span className="text-cyan-400 text-[11px] font-bold">{pct}%</span>
                  <span className="font-bold text-white px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800 text-[11px]">
                    {item.value} WO
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Info Prompt */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-cyan-400 font-mono">
        <span className="flex items-center gap-1">
          <MousePointerClick className="w-3 h-3" />
          Klik irisan pie atau tim untuk lihat detail WO
        </span>
        <span className="text-slate-500">
          {teamStats.filter(t => t.done > 0).length} Tim Aktif
        </span>
      </div>

    </div>
  );
};
