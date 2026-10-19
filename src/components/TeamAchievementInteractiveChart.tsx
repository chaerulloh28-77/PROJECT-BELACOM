import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Trophy, 
  Award, 
  Target, 
  ArrowUpDown, 
  Sparkles, 
  CheckCircle2, 
  PlayCircle, 
  Clock, 
  XCircle, 
  ChevronRight, 
  MousePointerClick, 
  TrendingUp, 
  Filter,
  SlidersHorizontal,
  Flame,
  Users,
  LayoutList,
  Columns3
} from 'lucide-react';

export interface TeamPerformanceData {
  team: string;
  total: number;
  done: number;
  inProgress: number;
  notYet: number;
  cancel: number;
  doneRate: number; // 0 - 100%
}

interface TeamAchievementInteractiveChartProps {
  data: TeamPerformanceData[];
  onTeamClick?: (teamName: string) => void;
}

export type ChartOrientation = 'horizontal' | 'vertical';
export type ScaleMode = 'count' | 'percent';
export type SortOption = 'done_rate_desc' | 'total_desc' | 'name_asc';
export type StatusFocus = 'ALL' | 'Done' | 'In Progress' | 'Not Yet' | 'Cancel';

export const TeamAchievementInteractiveChart: React.FC<TeamAchievementInteractiveChartProps> = ({
  data,
  onTeamClick
}) => {
  const [orientation, setOrientation] = useState<ChartOrientation>('horizontal');
  const [scaleMode, setScaleMode] = useState<ScaleMode>('count');
  const [sortOption, setSortOption] = useState<SortOption>('total_desc');
  const [statusFocus, setStatusFocus] = useState<StatusFocus>('ALL');
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);

  // Status configuration with distinct colors and badges
  const statusConfig = {
    'Done': {
      label: 'Done (Selesai)',
      shortLabel: 'Done',
      color: '#10b981',
      bgClass: 'bg-emerald-500',
      borderClass: 'border-emerald-500/40',
      textClass: 'text-emerald-400',
      gradient: 'from-emerald-600 to-emerald-400',
      icon: CheckCircle2
    },
    'In Progress': {
      label: 'In Progress (Berjalan)',
      shortLabel: 'In Prog',
      color: '#06b6d4',
      bgClass: 'bg-cyan-500',
      borderClass: 'border-cyan-500/40',
      textClass: 'text-cyan-400',
      gradient: 'from-cyan-600 to-cyan-400',
      icon: PlayCircle
    },
    'Not Yet': {
      label: 'Not Yet (Belum)',
      shortLabel: 'Not Yet',
      color: '#64748b',
      bgClass: 'bg-slate-500',
      borderClass: 'border-slate-500/40',
      textClass: 'text-slate-400',
      gradient: 'from-slate-600 to-slate-400',
      icon: Clock
    },
    'Cancel': {
      label: 'Cancel (Batal)',
      shortLabel: 'Cancel',
      color: '#f43f5e',
      bgClass: 'bg-rose-500',
      borderClass: 'border-rose-500/40',
      textClass: 'text-rose-400',
      gradient: 'from-rose-600 to-rose-400',
      icon: XCircle
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    const list = [...data];
    if (sortOption === 'total_desc') {
      list.sort((a, b) => b.total - a.total || b.doneRate - a.doneRate);
    } else if (sortOption === 'done_rate_desc') {
      list.sort((a, b) => b.doneRate - a.doneRate || b.done - a.done || b.total - a.total);
    } else if (sortOption === 'name_asc') {
      list.sort((a, b) => a.team.localeCompare(b.team));
    }
    return list;
  }, [data, sortOption]);

  // Overall Global Summary Metrics
  const summary = useMemo(() => {
    const totalWo = data.reduce((acc, d) => acc + d.total, 0);
    const totalDone = data.reduce((acc, d) => acc + d.done, 0);
    const totalInProgress = data.reduce((acc, d) => acc + d.inProgress, 0);
    const totalNotYet = data.reduce((acc, d) => acc + d.notYet, 0);
    const totalCancel = data.reduce((acc, d) => acc + d.cancel, 0);
    
    const avgDoneRate = totalWo > 0 ? Math.round((totalDone / totalWo) * 100) : 0;
    const activeTeams = data.filter(d => d.total > 0).length;

    // Top Performer by Done Rate (with min 1 WO)
    const teamsWithWo = data.filter(d => d.total > 0);
    const sortedByAchievement = [...teamsWithWo].sort((a, b) => b.doneRate - a.doneRate || b.done - a.done);
    const topPerformer = sortedByAchievement[0] || null;

    // Highest Load Team
    const sortedByLoad = [...data].sort((a, b) => b.total - a.total);
    const highestLoadTeam = sortedByLoad[0] || null;

    return {
      totalWo,
      totalDone,
      totalInProgress,
      totalNotYet,
      totalCancel,
      avgDoneRate,
      activeTeams,
      topPerformer,
      highestLoadTeam
    };
  }, [data]);

  // Max value for scale calculation
  const maxTotal = Math.max(...data.map(d => d.total), 1);
  const maxAxisVal = Math.max(10, Math.ceil(maxTotal / 5) * 5);

  // Y-axis ticks for vertical column view
  const verticalTicks = [
    maxAxisVal,
    Math.round(maxAxisVal * 0.75),
    Math.round(maxAxisVal * 0.5),
    Math.round(maxAxisVal * 0.25),
    0
  ];

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden transition-all duration-300 select-none">
      
      {/* Background ambient light */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />

      {/* Header: Title & Purpose */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-bold mb-1">
            <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            </span>
            <span>Visualisasi Terpadu • Satu Grafik Komprehensif</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <span>Grafik Pencapaian Tim dari Total WO</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
              Interaktif & Mudah Dibaca
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Semua pencapaian status WO per tim digabung dalam satu grafik visual. Arahkan mouse untuk melihat rincian atau klik baris tim untuk membuka dokumen WO lengkap.
          </p>
        </div>

        {/* Chart View & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Orientation Toggle: Horizontal (Easiest to read) vs Vertical */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center shadow-inner">
            <button
              onClick={() => setOrientation('horizontal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                orientation === 'horizontal'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              title="Tampilan Baris Horizontal (Rekomendasi - Sangat Mudah Dibaca)"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Baris (Mudah Dibaca)</span>
            </button>
            <button
              onClick={() => setOrientation('vertical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                orientation === 'vertical'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              title="Tampilan Kolom Vertikal"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Kolom Vertikal</span>
            </button>
          </div>

          {/* Scale Mode Toggle: Volume WO vs Rasio 100% */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center shadow-inner">
            <button
              onClick={() => setScaleMode('count')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                scaleMode === 'count'
                  ? 'bg-slate-800 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Skala Berdasarkan Jumlah Total WO"
            >
              Volume WO
            </button>
            <button
              onClick={() => setScaleMode('percent')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                scaleMode === 'percent'
                  ? 'bg-slate-800 text-emerald-300 font-bold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Skala Berdasarkan Rasio 100%"
            >
              Rasio 100%
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-transparent border-none text-slate-200 focus:outline-hidden cursor-pointer text-xs"
            >
              <option value="total_desc" className="bg-slate-900 text-white">Urut Total WO</option>
              <option value="done_rate_desc" className="bg-slate-900 text-white">Urut % Selesai (Pencapaian)</option>
              <option value="name_asc" className="bg-slate-900 text-white">Urut Nama Tim (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Unified Quick KPI Snapshot in One Glance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-4">
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block truncate">Tim Berprestasi</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-extrabold text-amber-300 truncate">
                {summary.topPerformer ? summary.topPerformer.team : '-'}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                ({summary.topPerformer ? `${summary.topPerformer.doneRate}%` : '0%'})
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block truncate">Rata-Rata Selesai</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-emerald-400 font-mono">{summary.avgDoneRate}%</span>
              <span className="text-[10px] text-slate-400 font-mono">pencapaian</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block truncate">Beban Terbanyak</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-extrabold text-cyan-300 truncate">
                {summary.highestLoadTeam ? summary.highestLoadTeam.team : '-'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                ({summary.highestLoadTeam ? `${summary.highestLoadTeam.total} WO` : '0'})
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block truncate">Total Distribusi</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-white font-mono">{summary.totalWo}</span>
              <span className="text-[10px] text-slate-400 font-mono">WO di {summary.activeTeams} tim</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Status Filter Pills & Legend - Merged into One Clean Bar */}
      <div className="p-3 mb-5 bg-slate-950/80 rounded-2xl border border-slate-800/90 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-[11px]">Sorot Status dalam Grafik:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Button All */}
          <button
            onClick={() => setStatusFocus('ALL')}
            className={`px-3 py-1 rounded-xl transition-all cursor-pointer font-bold text-xs ${
              statusFocus === 'ALL'
                ? 'bg-cyan-500 text-slate-950 shadow-md ring-2 ring-cyan-400/50'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Semua ({summary.totalWo} WO)
          </button>

          {/* Status Buttons */}
          {Object.entries(statusConfig).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const isSelected = statusFocus === key;
            const count = key === 'Done' ? summary.totalDone
              : key === 'In Progress' ? summary.totalInProgress
              : key === 'Not Yet' ? summary.totalNotYet
              : summary.totalCancel;
            const pct = summary.totalWo > 0 ? Math.round((count / summary.totalWo) * 100) : 0;

            return (
              <button
                key={key}
                onClick={() => setStatusFocus(isSelected ? 'ALL' : (key as StatusFocus))}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all cursor-pointer font-bold border text-xs ${
                  isSelected
                    ? `${cfg.bgClass} text-slate-950 shadow-lg scale-105 border-white/40`
                    : `bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700`
                }`}
                title={`Klik untuk menyorot status ${cfg.label}`}
              >
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: isSelected ? '#000' : cfg.color }}
                />
                <Icon className="w-3.5 h-3.5" />
                <span>{cfg.shortLabel}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/20 text-black' : 'bg-slate-800 text-slate-300'}`}>
                  {count} ({pct}%)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SINGLE COMBINED CHART - VIEW 1: HORIZONTAL BARS (ULTRA READABLE & CLEAN)  */}
      {/* ========================================================================= */}
      {orientation === 'horizontal' && (
        <div className="space-y-3 relative">
          
          {/* Average Benchmark Visual Indicator */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-2 pb-1 border-b border-slate-800/60">
            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <Target className="w-3.5 h-3.5" />
              Garis Rata-Rata Pencapaian: <strong className="text-emerald-400 font-black">{summary.avgDoneRate}% Selesai</strong>
            </span>
            <span className="text-slate-500">
              Skala: {scaleMode === 'count' ? `Volume WO (Maks ${maxAxisVal} WO)` : 'Rasio Status (100%)'}
            </span>
          </div>

          {/* List of Team Rows in One Combined Visual */}
          <div className="divide-y divide-slate-800/50">
            {sortedData.map((item, index) => {
              const isHovered = hoveredTeam === item.team;
              const hasWo = item.total > 0;
              
              // Width calculations
              const barTotalWidthPercent = scaleMode === 'count'
                ? Math.min(100, Math.max(6, (item.total / maxAxisVal) * 100))
                : 100;

              // Segment percentages based on item total
              const donePct = hasWo ? (item.done / item.total) * 100 : 0;
              const inProgPct = hasWo ? (item.inProgress / item.total) * 100 : 0;
              const notYetPct = hasWo ? (item.notYet / item.total) * 100 : 0;
              const cancelPct = hasWo ? (item.cancel / item.total) * 100 : 0;

              // Dimming filter logic
              const isDoneDimmed = statusFocus !== 'ALL' && statusFocus !== 'Done';
              const isInProgressDimmed = statusFocus !== 'ALL' && statusFocus !== 'In Progress';
              const isNotYetDimmed = statusFocus !== 'ALL' && statusFocus !== 'Not Yet';
              const isCancelDimmed = statusFocus !== 'ALL' && statusFocus !== 'Cancel';

              // Top 3 medals
              const rankMedal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

              return (
                <div
                  key={item.team}
                  onMouseEnter={() => setHoveredTeam(item.team)}
                  onMouseLeave={() => setHoveredTeam(null)}
                  onClick={() => onTeamClick && onTeamClick(item.team)}
                  className={`py-2.5 px-3 rounded-2xl transition-all duration-200 cursor-pointer group flex flex-col md:flex-row md:items-center gap-2 md:gap-4 ${
                    isHovered 
                      ? 'bg-slate-800/60 ring-1 ring-cyan-400/50 shadow-lg' 
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  {/* Left Column: Team Identity & Rank */}
                  <div className="w-full md:w-44 flex items-center justify-between md:justify-start gap-2.5 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-center text-xs font-mono font-bold text-slate-500">
                        {rankMedal || `#${index + 1}`}
                      </span>
                      <span className={`font-black text-sm tracking-wide transition-colors ${
                        isHovered ? 'text-cyan-300' : 'text-white group-hover:text-cyan-400'
                      }`}>
                        {item.team}
                      </span>
                    </div>

                    {/* Done Rate Badge for Mobile */}
                    <div className="flex md:hidden items-center gap-2 font-mono">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        item.doneRate >= 80 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : item.doneRate >= 50
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.doneRate}%
                      </span>
                      <span className="text-xs font-bold text-slate-300">{item.total} WO</span>
                    </div>
                  </div>

                  {/* Center Column: Combined Composite Progress Bar */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <div className="w-full bg-slate-950 h-7 rounded-xl overflow-hidden p-0.5 border border-slate-800 flex items-center shadow-inner relative">
                      
                      {/* Interactive Bar Track */}
                      <div 
                        className="h-full flex rounded-lg overflow-hidden transition-all duration-500 relative"
                        style={{ width: `${barTotalWidthPercent}%` }}
                      >
                        {/* Done Segment */}
                        {item.done > 0 && (
                          <div
                            style={{ width: `${donePct}%` }}
                            className={`h-full bg-gradient-to-r from-emerald-600 to-emerald-400 flex items-center justify-center transition-all ${
                              isDoneDimmed ? 'opacity-25' : 'opacity-100'
                            }`}
                            title={`Done: ${item.done} WO (${Math.round(donePct)}%)`}
                          >
                            {donePct >= 12 && (
                              <span className="text-[10px] font-mono font-bold text-slate-950 px-1 truncate">
                                {item.done}
                              </span>
                            )}
                          </div>
                        )}

                        {/* In Progress Segment */}
                        {item.inProgress > 0 && (
                          <div
                            style={{ width: `${inProgPct}%` }}
                            className={`h-full bg-gradient-to-r from-cyan-600 to-cyan-400 flex items-center justify-center transition-all ${
                              isInProgressDimmed ? 'opacity-25' : 'opacity-100'
                            }`}
                            title={`In Progress: ${item.inProgress} WO (${Math.round(inProgPct)}%)`}
                          >
                            {inProgPct >= 12 && (
                              <span className="text-[10px] font-mono font-bold text-slate-950 px-1 truncate">
                                {item.inProgress}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Not Yet Segment */}
                        {item.notYet > 0 && (
                          <div
                            style={{ width: `${notYetPct}%` }}
                            className={`h-full bg-gradient-to-r from-slate-600 to-slate-400 flex items-center justify-center transition-all ${
                              isNotYetDimmed ? 'opacity-25' : 'opacity-100'
                            }`}
                            title={`Not Yet: ${item.notYet} WO (${Math.round(notYetPct)}%)`}
                          >
                            {notYetPct >= 12 && (
                              <span className="text-[10px] font-mono font-bold text-white px-1 truncate">
                                {item.notYet}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Cancel Segment */}
                        {item.cancel > 0 && (
                          <div
                            style={{ width: `${cancelPct}%` }}
                            className={`h-full bg-gradient-to-r from-rose-600 to-rose-400 flex items-center justify-center transition-all ${
                              isCancelDimmed ? 'opacity-25' : 'opacity-100'
                            }`}
                            title={`Cancel: ${item.cancel} WO (${Math.round(cancelPct)}%)`}
                          >
                            {cancelPct >= 12 && (
                              <span className="text-[10px] font-mono font-bold text-white px-1 truncate">
                                {item.cancel}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Empty state bar */}
                        {!hasWo && (
                          <div className="w-full h-full bg-slate-900/60 flex items-center px-2">
                            <span className="text-[10px] font-mono text-slate-600">Belum ada penugasan WO</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Right Column: Values, Done Rate %, Total WO & Action Button */}
                  <div className="hidden md:flex items-center justify-end gap-3 shrink-0 font-mono">
                    {/* Status Breakdown Pills */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="text-emerald-400 font-bold" title="Done">{item.done}D</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-cyan-400 font-bold" title="In Progress">{item.inProgress}P</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-slate-400 font-semibold" title="Not Yet">{item.notYet}NY</span>
                      {item.cancel > 0 && (
                        <>
                          <span className="text-slate-600">/</span>
                          <span className="text-rose-400 font-bold" title="Cancel">{item.cancel}C</span>
                        </>
                      )}
                    </div>

                    {/* Done Rate Badge */}
                    <div className="w-20 text-right">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black inline-block transition-transform ${
                        item.doneRate >= 80 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : item.doneRate >= 50
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                      }`}>
                        {item.doneRate}% Selesai
                      </span>
                    </div>

                    {/* Total WO Number */}
                    <div className="w-16 text-right font-black text-sm text-white">
                      {item.total} WO
                    </div>

                    {/* Drilldown Arrow Action */}
                    <div className="w-8 text-center">
                      <span className="w-6 h-6 rounded-lg bg-slate-800/80 group-hover:bg-cyan-500 group-hover:text-slate-950 flex items-center justify-center text-slate-400 transition-all">
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SINGLE COMBINED CHART - VIEW 2: VERTICAL COLUMNS (HIGH TECH CYBERPUNK)   */}
      {/* ========================================================================= */}
      {orientation === 'vertical' && (
        <div className="w-full relative overflow-x-auto pb-14 pt-4">
          <div className="min-w-[760px] relative">
            
            {/* Y-Axis Horizontal Grid Lines */}
            <div className="relative w-full h-[320px]">
              {verticalTicks.map((tickVal, idx) => {
                const topPct = (idx / (verticalTicks.length - 1)) * 100;
                return (
                  <div
                    key={idx}
                    className="absolute inset-x-0 flex items-center pointer-events-none"
                    style={{ top: `${topPct}%` }}
                  >
                    <span className="w-8 text-[11px] font-mono text-slate-500 text-right pr-2 shrink-0">
                      {tickVal}
                    </span>
                    <div className="w-full border-b border-slate-800/80 border-dashed" />
                  </div>
                );
              })}

              {/* Bars Presentation Area */}
              <div className="absolute inset-y-0 left-9 right-2 flex items-end justify-between px-2 gap-2 sm:gap-3 z-10">
                {sortedData.map((item, index) => {
                  const isHovered = hoveredTeam === item.team;
                  const heightPercent = item.total > 0 ? (item.total / maxAxisVal) * 100 : 0;
                  
                  // Dimming logic
                  const isDoneDimmed = statusFocus !== 'ALL' && statusFocus !== 'Done';
                  const isInProgressDimmed = statusFocus !== 'ALL' && statusFocus !== 'In Progress';
                  const isNotYetDimmed = statusFocus !== 'ALL' && statusFocus !== 'Not Yet';
                  const isCancelDimmed = statusFocus !== 'ALL' && statusFocus !== 'Cancel';

                  // Top 3 medals
                  const rankMedal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

                  return (
                    <div
                      key={item.team + index}
                      className="flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer group/bar transition-all"
                      onMouseEnter={() => setHoveredTeam(item.team)}
                      onMouseLeave={() => setHoveredTeam(null)}
                      onClick={() => onTeamClick && onTeamClick(item.team)}
                    >
                      {/* Floating Tooltip on Hover */}
                      {isHovered && (
                        <div className="absolute -top-32 z-40 bg-slate-900/95 backdrop-blur-md text-white font-mono text-[11px] p-3 rounded-2xl border border-cyan-400/80 shadow-2xl min-w-[200px] pointer-events-none flex flex-col gap-1.5 animate-fadeIn">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                            <span className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-amber-400" />
                              {item.team} {rankMedal}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                              {item.total} Total WO
                            </span>
                          </div>

                          <div className="py-1">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                              <span>Pencapaian Selesai:</span>
                              <strong className="text-emerald-400">{item.doneRate}%</strong>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                                style={{ width: `${item.doneRate}%` }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-1">
                            <div className="flex items-center justify-between bg-slate-950/80 px-2 py-1 rounded-md border border-emerald-500/20">
                              <span className="text-emerald-400 font-semibold">Done:</span>
                              <strong className="text-white">{item.done}</strong>
                            </div>
                            <div className="flex items-center justify-between bg-slate-950/80 px-2 py-1 rounded-md border border-cyan-500/20">
                              <span className="text-cyan-400 font-semibold">In Prog:</span>
                              <strong className="text-white">{item.inProgress}</strong>
                            </div>
                            <div className="flex items-center justify-between bg-slate-950/80 px-2 py-1 rounded-md border border-slate-500/20">
                              <span className="text-slate-400 font-semibold">Not Yet:</span>
                              <strong className="text-white">{item.notYet}</strong>
                            </div>
                            <div className="flex items-center justify-between bg-slate-950/80 px-2 py-1 rounded-md border border-rose-500/20">
                              <span className="text-rose-400 font-semibold">Cancel:</span>
                              <strong className="text-white">{item.cancel}</strong>
                            </div>
                          </div>

                          <div className="text-[9px] text-cyan-400 text-center pt-1 border-t border-slate-800/80 flex items-center justify-center gap-1">
                            <MousePointerClick className="w-3 h-3" /> Klik untuk buka detail WO tim
                          </div>
                        </div>
                      )}

                      {/* Top Done Rate & Total Badge above Bar */}
                      {item.total > 0 && (
                        <div className="flex flex-col items-center mb-1.5">
                          <span className={`px-1.5 py-0.5 rounded-md font-mono text-[9px] font-extrabold transition-all duration-300 ${
                            isHovered 
                              ? 'bg-cyan-400 text-slate-950 scale-110 shadow-lg' 
                              : item.doneRate >= 80 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                : 'bg-slate-800 text-slate-300'
                          }`}>
                            {item.doneRate}%
                          </span>
                        </div>
                      )}

                      {/* Vertical Bar Segments */}
                      <div className="w-full max-w-[40px] h-full flex flex-col justify-end relative">
                        {item.total > 0 ? (
                          <div
                            className={`w-full flex flex-col rounded-t-xl overflow-hidden transition-all duration-300 shrink-0 shadow-lg ${
                              isHovered 
                                ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 scale-x-105 brightness-125' 
                                : 'hover:brightness-110'
                            }`}
                            style={{ height: `${Math.max(heightPercent, 5)}%` }}
                          >
                            {/* Done */}
                            {item.done > 0 && (
                              <div
                                style={{ flex: `${item.done} 1 0%` }}
                                className={`bg-gradient-to-t from-emerald-600 to-emerald-400 transition-opacity ${
                                  isDoneDimmed ? 'opacity-25' : 'opacity-100'
                                }`}
                                title={`Done: ${item.done}`}
                              />
                            )}
                            {/* In Progress */}
                            {item.inProgress > 0 && (
                              <div
                                style={{ flex: `${item.inProgress} 1 0%` }}
                                className={`bg-gradient-to-t from-cyan-600 to-cyan-400 transition-opacity ${
                                  isInProgressDimmed ? 'opacity-25' : 'opacity-100'
                                }`}
                                title={`In Progress: ${item.inProgress}`}
                              />
                            )}
                            {/* Not Yet */}
                            {item.notYet > 0 && (
                              <div
                                style={{ flex: `${item.notYet} 1 0%` }}
                                className={`bg-gradient-to-t from-slate-600 to-slate-400 transition-opacity ${
                                  isNotYetDimmed ? 'opacity-25' : 'opacity-100'
                                }`}
                                title={`Not Yet: ${item.notYet}`}
                              />
                            )}
                            {/* Cancel */}
                            {item.cancel > 0 && (
                              <div
                                style={{ flex: `${item.cancel} 1 0%` }}
                                className={`bg-gradient-to-t from-rose-600 to-rose-400 transition-opacity ${
                                  isCancelDimmed ? 'opacity-25' : 'opacity-100'
                                }`}
                                title={`Cancel: ${item.cancel}`}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-1.5 bg-slate-800 rounded-full" />
                        )}
                      </div>

                      {/* X-Axis Team Name Label */}
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-mono font-semibold block transition-colors transform -rotate-35 origin-top-left ${
                            isHovered 
                              ? 'text-cyan-300 font-bold scale-110' 
                              : 'text-slate-400'
                          }`}
                        >
                          {item.team}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Footer Info: Interaction Tips */}
      <div className="mt-6 pt-3.5 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MousePointerClick className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
          <span>Klik baris atau batang tim manapun untuk membuka dokumen WO lengkap di modal interaktif.</span>
        </div>
        <div className="text-[10px] text-slate-500 flex items-center gap-2">
          <span>🟢 Done</span>
          <span>•</span>
          <span>🔵 In Prog</span>
          <span>•</span>
          <span>⚪ Not Yet</span>
          <span>•</span>
          <span>🔴 Cancel</span>
        </div>
      </div>

    </div>
  );
};
