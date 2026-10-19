import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  FolderKanban, 
  Clock, 
  PlayCircle, 
  XCircle, 
  CheckCircle2, 
  Activity, 
  Sparkles, 
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  Tag,
  Award,
  MousePointerClick
} from 'lucide-react';
import { useProjectContext, DrilldownFilter } from '../context/ProjectContext';
import { DetailFilterModal } from '../components/DetailFilterModal';
import { StatusWoPieChartCard } from '../components/StatusWoPieChartCard';
import { TeamActivityPieChart } from '../components/TeamActivityPieChart';
import { AreaAchievementCard } from '../components/AreaAchievementCard';

export const DashboardOverviewPage: React.FC = () => {
  const { 
    dailyReports, 
    drilldownFilter,
    setDrilldownFilter
  } = useProjectContext();

  // Comprehensive Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [selectedWoType, setSelectedWoType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  // Dynamic Options
  const availableWoTypes = useMemo(() => {
    return Array.from(new Set(dailyReports.map(r => r.woType)));
  }, [dailyReports]);

  const availableTeams = useMemo(() => {
    return Array.from(new Set(dailyReports.map(r => r.team))).sort();
  }, [dailyReports]);

  const availableMonths = useMemo(() => {
    return Array.from(new Set(dailyReports.map(r => r.monthReleaseWo))).sort();
  }, [dailyReports]);

  // Reset Filters Handler
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedArea('ALL');
    setSelectedTeam('ALL');
    setSelectedWoType('ALL');
    setSelectedStatus('ALL');
    setSelectedMonth('ALL');
  };

  const isFiltered = 
    searchQuery !== '' || 
    selectedArea !== 'ALL' || 
    selectedTeam !== 'ALL' || 
    selectedWoType !== 'ALL' || 
    selectedStatus !== 'ALL' || 
    selectedMonth !== 'ALL';

  // Apply Filter Logic
  const filteredReports = useMemo(() => {
    return dailyReports.filter(r => {
      const matchesSearch = 
        r.woNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.pic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.workType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.team.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesArea = selectedArea === 'ALL' || r.assignment === selectedArea;
      const matchesTeam = selectedTeam === 'ALL' || r.team === selectedTeam;
      const matchesWoType = selectedWoType === 'ALL' || r.woType === selectedWoType;
      const matchesStatus = selectedStatus === 'ALL' || r.statusWo === selectedStatus;
      const matchesMonth = selectedMonth === 'ALL' || r.monthReleaseWo === selectedMonth;

      return matchesSearch && matchesArea && matchesTeam && matchesWoType && matchesStatus && matchesMonth;
    });
  }, [dailyReports, searchQuery, selectedArea, selectedTeam, selectedWoType, selectedStatus, selectedMonth]);

  // Core Metrics Computed
  const totalWoCount = filteredReports.length;
  const totalProjectsCount = filteredReports.length;
  const notYetCount = filteredReports.filter(r => r.statusWo === 'Not Yet').length;
  const inProgressCount = filteredReports.filter(r => r.statusWo === 'In Progress').length;
  const cancelCount = filteredReports.filter(r => r.statusWo === 'Cancel').length;
  const doneCount = filteredReports.filter(r => r.statusWo === 'Done').length;

  // Achievement Percentage Calculation
  const achievementRate = totalWoCount > 0 
    ? Math.round((doneCount / totalWoCount) * 100) 
    : 0;

  const inProgressRate = totalWoCount > 0 
    ? Math.round((inProgressCount / totalWoCount) * 100) 
    : 0;


  const handleStatCardClick = (title: string, category: DrilldownFilter['category'], value: string) => {
    setDrilldownFilter({ title, category, value });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8 select-none">
      
      {/* Executive Overview Banner & Achievement Rate KPI */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden group">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-cyan-500/10 blur-3xl pointer-events-none group-hover:bg-cyan-500/15 transition-all"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
              <span className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
              </span>
              <span>Dashboard Control & Pencapaian Work Order (WO)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 flex items-center gap-2">
              Dashboard Work Order (WO) Belacom
              <Sparkles className="w-5 h-5 text-amber-400 hidden sm:inline" />
            </h2>
          </div>

          {/* Achievement Rate Progress Gauge Badge */}
          <button
            onClick={() => handleStatCardClick('Pencapaian Seluruh WO Belacom', 'wo', 'Semua WO')}
            className="flex items-center gap-4 bg-slate-950/90 hover:bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-cyan-500/50 font-mono text-xs shadow-lg text-left transition-all cursor-pointer active:scale-95 group/gauge"
          >
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 group-hover/gauge:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>PENCAPAIAN WO SELESAI (DONE)</span>
                <span className="text-emerald-400 font-extrabold">{achievementRate}%</span>
              </div>
              <div className="w-48 sm:w-56 bg-slate-900 rounded-full h-2.5 my-1.5 border border-slate-800 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${achievementRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>{doneCount} dari {totalWoCount} WO Selesai</span>
                <span className="text-cyan-400 flex items-center gap-0.5">
                  Klik Detail <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </button>
        </div>

      </div>

      {/* Complete Multi-Criteria Filter Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Filter className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-100">
              PANEL FILTER LENGKAP DASHBOARD WO
            </span>
          </div>

          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-cyan-400 hover:text-white rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-slate-700/60"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Seluruh Filter</span>
            </button>
          )}
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs font-mono">
          
          {/* 1. Global Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Nomor WO / PIC / Tim / Uraian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-100 placeholder-slate-500 rounded-xl pl-8 pr-3 py-2.5 outline-none transition-all"
            />
          </div>

          {/* 2. Area Filter */}
          <div>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 rounded-xl p-2.5 outline-none"
            >
              <option value="ALL">Semua Area</option>
              <option value="Jabo 1">Jabo 1</option>
              <option value="Jabo 2">Jabo 2</option>
              <option value="Jabo 3">Jabo 3</option>
            </select>
          </div>

          {/* 3. Team Filter */}
          <div>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 rounded-xl p-2.5 outline-none"
            >
              <option value="ALL">Semua Tim Pelaksana</option>
              {availableTeams.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* 4. WO Category / Type Filter */}
          <div>
            <select
              value={selectedWoType}
              onChange={(e) => setSelectedWoType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 rounded-xl p-2.5 outline-none"
            >
              <option value="ALL">Semua Kategori WO</option>
              {availableWoTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* 5. Month Release Filter */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 rounded-xl p-2.5 outline-none"
            >
              <option value="ALL">Semua Bulan Release</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>Bulan: {m}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Quick Status Preset Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold mr-1">Status Quick Pills:</span>
            
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedStatus === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Semua Status ({dailyReports.length})
            </button>

            <button
              onClick={() => setSelectedStatus('Done')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedStatus === 'Done'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30'
              }`}
            >
              Done Only ({dailyReports.filter(r => r.statusWo === 'Done').length})
            </button>

            <button
              onClick={() => setSelectedStatus('In Progress')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedStatus === 'In Progress'
                  ? 'bg-cyan-400 text-slate-950 font-bold'
                  : 'bg-slate-950 text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/30'
              }`}
            >
              In Progress ({dailyReports.filter(r => r.statusWo === 'In Progress').length})
            </button>

            <button
              onClick={() => setSelectedStatus('Not Yet')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedStatus === 'Not Yet'
                  ? 'bg-slate-400 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Not Yet ({dailyReports.filter(r => r.statusWo === 'Not Yet').length})
            </button>

            <button
              onClick={() => setSelectedStatus('Cancel')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedStatus === 'Cancel'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-slate-950 text-rose-400 hover:bg-rose-500/10 border border-rose-500/30'
              }`}
            >
              Cancel ({dailyReports.filter(r => r.statusWo === 'Cancel').length})
            </button>
          </div>

          {/* Filter Status Badge */}
          {isFiltered && (
            <span className="text-[10px] text-cyan-400 font-bold">
              Terfilter {filteredReports.length} dari {dailyReports.length} WO
            </span>
          )}
        </div>

        {/* Active Filter Criteria Summary */}
        {isFiltered && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
            <span className="text-slate-500 flex items-center gap-1 font-semibold">
              <Tag className="w-3 h-3 text-cyan-400" /> Filter Aktif:
            </span>
            {searchQuery && (
              <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-md">
                Pencarian: "{searchQuery}"
              </span>
            )}
            {selectedArea !== 'ALL' && (
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-md">
                Area: {selectedArea}
              </span>
            )}
            {selectedTeam !== 'ALL' && (
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-md">
                Tim: {selectedTeam}
              </span>
            )}
            {selectedWoType !== 'ALL' && (
              <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-md truncate max-w-[180px]">
                Kategori: {selectedWoType}
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-md">
                Status: {selectedStatus}
              </span>
            )}
            {selectedMonth !== 'ALL' && (
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md">
                Bulan: {selectedMonth}
              </span>
            )}
          </div>
        )}

      </div>

      {/* Primary 6 WO Structure Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* 1. Total WO */}
        <button
          onClick={() => handleStatCardClick('Daftar Seluruh Work Order (WO)', 'wo', 'Semua WO')}
          className="bg-slate-900 border border-slate-800 hover:border-cyan-500/60 p-4 rounded-2xl shadow-xl transition-all duration-200 text-left group cursor-pointer active:scale-95 flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">TOTAL WO</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 group-hover:rotate-6 transition-all">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono block">
              {totalWoCount}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
              {isFiltered ? `Saringan dari ${dailyReports.length}` : 'Work Order Rilis'}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-cyan-400 font-mono">
            <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> Klik Detail</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* 2. Total Project */}
        <button
          onClick={() => handleStatCardClick('Ringkasan Seluruh Project Belacom', 'project', 'Semua Project Aktif')}
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/60 p-4 rounded-2xl shadow-xl transition-all duration-200 text-left group cursor-pointer active:scale-95 flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">TOTAL PROJECT</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 group-hover:rotate-6 transition-all">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-blue-400 font-mono block">
              {totalProjectsCount}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
              Proyek Aktif
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-blue-400 font-mono">
            <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> Klik Detail</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* 3. Not Yet */}
        <button
          onClick={() => handleStatCardClick('Detail WO Status Not Yet', 'statusWo', 'Not Yet')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-500/60 p-4 rounded-2xl shadow-xl transition-all duration-200 text-left group cursor-pointer active:scale-95 flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">NOT YET</span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-400 group-hover:scale-110 group-hover:rotate-6 transition-all">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-300 font-mono block">
              {notYetCount}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
              Belum Dimulai
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> Klik Detail</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* 4. In Progress */}
        <button
          onClick={() => handleStatCardClick('Detail WO Status In Progress', 'statusWo', 'In Progress')}
          className="bg-slate-900 border border-slate-800 hover:border-cyan-500/60 p-4 rounded-2xl shadow-xl transition-all duration-200 text-left group cursor-pointer active:scale-95 flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">IN PROGRESS</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 group-hover:rotate-6 transition-all">
              <PlayCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono block">
              {inProgressCount}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
              {inProgressRate}% Sedang Berjalan
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-cyan-400 font-mono">
            <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> Klik Detail</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* 5. Cancel */}
        <button
          onClick={() => handleStatCardClick('Detail WO Status Cancel', 'statusWo', 'Cancel')}
          className="bg-slate-900 border border-slate-800 hover:border-rose-500/60 p-4 rounded-2xl shadow-xl transition-all duration-200 text-left group cursor-pointer active:scale-95 flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">CANCEL</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 group-hover:rotate-6 transition-all">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono block">
              {cancelCount}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
              Dibatalkan
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-rose-400 font-mono">
            <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> Klik Detail</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* 6. Done */}
        <button
          onClick={() => handleStatCardClick('Detail WO Status Done', 'statusWo', 'Done')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/60 p-4 rounded-2xl shadow-xl transition-all duration-200 text-left group cursor-pointer active:scale-95 flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">DONE</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 group-hover:rotate-6 transition-all">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono block">
              {doneCount}
            </span>
            <span className="text-[10px] text-emerald-400 mt-1 block font-mono font-bold">
              {achievementRate}% Pencapaian
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-emerald-400 font-mono">
            <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> Klik Detail</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

      </div>

      {/* Visual Analytics 3-Card Grid Matching User Request & Reference Image */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-2">
        
        {/* Card 1: PENCAPAIAN STATUS WO (PIE CHART) */}
        <StatusWoPieChartCard
          total={totalWoCount}
          doneCount={doneCount}
          inProgressCount={inProgressCount}
          notYetCount={notYetCount}
          cancelCount={cancelCount}
          achievementRate={achievementRate}
          onStatusClick={(status) => {
            handleStatCardClick(`Detail WO Status ${status}`, 'statusWo', status);
          }}
        />

        {/* Card 2: STATUS AKTIVITAS TEAM DARI TOTAL WO (PIE CHART) */}
        <TeamActivityPieChart
          reports={filteredReports}
          onTeamClick={(teamName) => {
            handleStatCardClick(`Rincian Dokumen WO - ${teamName}`, 'team', teamName);
          }}
          onStatusClick={(statusName) => {
            handleStatCardClick(`Detail WO Status ${statusName}`, 'statusWo', statusName);
          }}
        />

        {/* Card 3: PENCAPAIAN DOKUMEN WO PER AREA */}
        <AreaAchievementCard
          reports={filteredReports}
          onAreaClick={(areaName) => {
            handleStatCardClick(`Rincian Dokumen WO - Wilayah ${areaName}`, 'area', areaName);
          }}
        />

      </div>



      {/* Drilldown Filter Modal with Tutup Button */}
      <DetailFilterModal
        filter={drilldownFilter}
        onClose={() => setDrilldownFilter(null)}
      />

    </div>
  );
};
