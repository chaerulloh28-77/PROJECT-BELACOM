import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  MousePointerClick, 
  Trophy, 
  Award, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Users, 
  PieChart as PieChartIcon,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useProjectContext, DrilldownFilter } from '../context/ProjectContext';
import { DetailFilterModal } from '../components/DetailFilterModal';

export interface DashboardTagihanPageProps {
  hideHeader?: boolean;
}

export const DashboardTagihanPage: React.FC<DashboardTagihanPageProps> = ({ hideHeader = false }) => {
  const { 
    penagihanList, 
    dailyReports, 
    drilldownFilter, 
    setDrilldownFilter 
  } = useProjectContext();

  // Mode for Chart 1: Rasio Pelunasan Pembayaran
  // 'ratio' = Lunas vs Belum Lunas (2 categories)
  // 'detail' = Lunas, Disetujui, Dalam Review, Draft, Ditolak (5 categories)
  const [pelunasanViewMode, setPelunasanViewMode] = useState<'ratio' | 'detail'>('ratio');

  // Mode for Chart 2: Status Aktivitas Team yang Done
  // 'team_done' = Distribution of Done activities across teams (ABR 05, ABR 01, etc.)
  // 'status_all' = Status of all activities (Done vs In Progress vs Not Yet vs Cancel)
  const [teamActivityViewMode, setTeamActivityViewMode] = useState<'team_done' | 'status_all'>('team_done');

  // Hover states for Donut Charts
  const [hoveredPelunasanIndex, setHoveredPelunasanIndex] = useState<number | null>(null);
  const [hoveredTeamIndex, setHoveredTeamIndex] = useState<number | null>(null);

  // ----------------------------------------------------
  // COMPUTATIONS: 1. Rasio Pelunasan Pembayaran
  // ----------------------------------------------------
  const totalNominalAll = useMemo(() => {
    return penagihanList.reduce((acc, p) => acc + p.totalNominalRupiah, 0);
  }, [penagihanList]);

  const lunasItems = useMemo(() => {
    return penagihanList.filter(p => p.statusPenagihan === 'Lunas');
  }, [penagihanList]);

  const belumLunasItems = useMemo(() => {
    return penagihanList.filter(p => p.statusPenagihan !== 'Lunas');
  }, [penagihanList]);

  const totalNominalLunas = useMemo(() => {
    return lunasItems.reduce((acc, p) => acc + p.totalNominalRupiah, 0);
  }, [lunasItems]);

  const totalNominalBelumLunas = useMemo(() => {
    return belumLunasItems.reduce((acc, p) => acc + p.totalNominalRupiah, 0);
  }, [belumLunasItems]);

  const collectionRate = totalNominalAll > 0 
    ? Math.round((totalNominalLunas / totalNominalAll) * 100) 
    : 0;

  // Detailed status breakdown for payment
  const disetujuiItems = useMemo(() => penagihanList.filter(p => p.statusPenagihan === 'Disetujui'), [penagihanList]);
  const reviewItems = useMemo(() => penagihanList.filter(p => p.statusPenagihan === 'Dalam Review'), [penagihanList]);
  const draftItems = useMemo(() => penagihanList.filter(p => p.statusPenagihan === 'Draft'), [penagihanList]);
  const ditolakItems = useMemo(() => penagihanList.filter(p => p.statusPenagihan === 'Ditolak'), [penagihanList]);

  // Data for Chart 1: Rasio Pelunasan Pembayaran
  const pelunasanChartData = useMemo(() => {
    if (pelunasanViewMode === 'ratio') {
      return [
        {
          label: 'Lunas (Terbayar)',
          filterValue: 'Lunas',
          count: lunasItems.length,
          nominal: totalNominalLunas,
          value: totalNominalLunas,
          color: '#10b981', // emerald-500
          glow: 'rgba(16, 185, 129, 0.4)'
        },
        {
          label: 'Belum Lunas (Piutang / Proses)',
          filterValue: 'Dalam Review',
          count: belumLunasItems.length,
          nominal: totalNominalBelumLunas,
          value: totalNominalBelumLunas,
          color: '#f59e0b', // amber-500
          glow: 'rgba(245, 158, 11, 0.4)'
        }
      ];
    } else {
      return [
        {
          label: 'Lunas',
          filterValue: 'Lunas',
          count: lunasItems.length,
          nominal: totalNominalLunas,
          value: totalNominalLunas,
          color: '#10b981',
          glow: 'rgba(16, 185, 129, 0.4)'
        },
        {
          label: 'Disetujui (Menunggu Bayar)',
          filterValue: 'Disetujui',
          count: disetujuiItems.length,
          nominal: disetujuiItems.reduce((acc, p) => acc + p.totalNominalRupiah, 0),
          value: disetujuiItems.reduce((acc, p) => acc + p.totalNominalRupiah, 0),
          color: '#06b6d4',
          glow: 'rgba(6, 182, 212, 0.4)'
        },
        {
          label: 'Dalam Review Berkas',
          filterValue: 'Dalam Review',
          count: reviewItems.length,
          nominal: reviewItems.reduce((acc, p) => acc + p.totalNominalRupiah, 0),
          value: reviewItems.reduce((acc, p) => acc + p.totalNominalRupiah, 0),
          color: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.4)'
        },
        {
          label: 'Draft Tagihan',
          filterValue: 'Draft',
          count: draftItems.length,
          nominal: draftItems.reduce((acc, p) => acc + p.totalNominalRupiah, 0),
          value: draftItems.reduce((acc, p) => acc + p.totalNominalRupiah, 0),
          color: '#94a3b8',
          glow: 'rgba(148, 163, 184, 0.4)'
        },
        {
          label: 'Ditolak / Revisi',
          filterValue: 'Ditolak',
          count: ditolakItems.length,
          nominal: ditolakItems.reduce((acc, p) => acc + p.totalNominalRupiah, 0),
          value: ditolakItems.reduce((acc, p) => acc + p.totalNominalRupiah, 0),
          color: '#f43f5e',
          glow: 'rgba(244, 63, 94, 0.4)'
        }
      ].filter(item => item.count > 0 || item.nominal > 0);
    }
  }, [
    pelunasanViewMode, 
    lunasItems, 
    belumLunasItems, 
    totalNominalLunas, 
    totalNominalBelumLunas, 
    disetujuiItems, 
    reviewItems, 
    draftItems, 
    ditolakItems
  ]);

  // ----------------------------------------------------
  // COMPUTATIONS: 2. Status Aktivitas Team yang Done
  // ----------------------------------------------------
  const doneActivities = useMemo(() => {
    return dailyReports.filter(r => r.statusWo === 'Done');
  }, [dailyReports]);

  const inProgressActivities = useMemo(() => {
    return dailyReports.filter(r => r.statusWo === 'In Progress');
  }, [dailyReports]);

  const notYetActivities = useMemo(() => {
    return dailyReports.filter(r => r.statusWo === 'Not Yet');
  }, [dailyReports]);

  const cancelActivities = useMemo(() => {
    return dailyReports.filter(r => r.statusWo === 'Cancel');
  }, [dailyReports]);

  const totalActivitiesCount = dailyReports.length;
  const doneActivitiesCount = doneActivities.length;
  const doneRate = totalActivitiesCount > 0 
    ? Math.round((doneActivitiesCount / totalActivitiesCount) * 100) 
    : 0;

  // Breakdown of Done Activities per Team
  const teamDoneBreakdown = useMemo(() => {
    const countsByTeam: Record<string, number> = {};
    doneActivities.forEach(item => {
      countsByTeam[item.team] = (countsByTeam[item.team] || 0) + 1;
    });

    const colors = [
      '#10b981', // emerald
      '#06b6d4', // cyan
      '#3b82f6', // blue
      '#8b5cf6', // purple
      '#f59e0b', // amber
      '#ec4899', // pink
      '#14b8a6', // teal
      '#6366f1'  // indigo
    ];

    return Object.entries(countsByTeam)
      .map(([team, count], idx) => ({
        label: team,
        teamName: team,
        count: count,
        value: count,
        color: colors[idx % colors.length],
        glow: `${colors[idx % colors.length]}66`
      }))
      .sort((a, b) => b.count - a.count);
  }, [doneActivities]);

  // Data for Chart 2: Status Aktivitas Team yang Done
  const teamActivityChartData = useMemo(() => {
    if (teamActivityViewMode === 'team_done') {
      return teamDoneBreakdown;
    } else {
      return [
        {
          label: 'Done (Selesai)',
          statusFilter: 'Done',
          count: doneActivitiesCount,
          value: doneActivitiesCount,
          color: '#10b981',
          glow: 'rgba(16, 185, 129, 0.4)'
        },
        {
          label: 'In Progress (Sedang Berjalan)',
          statusFilter: 'In Progress',
          count: inProgressActivities.length,
          value: inProgressActivities.length,
          color: '#06b6d4',
          glow: 'rgba(6, 182, 212, 0.4)'
        },
        {
          label: 'Not Yet (Belum Mulai)',
          statusFilter: 'Not Yet',
          count: notYetActivities.length,
          value: notYetActivities.length,
          color: '#64748b',
          glow: 'rgba(100, 116, 139, 0.4)'
        },
        {
          label: 'Cancel (Dibatalkan)',
          statusFilter: 'Cancel',
          count: cancelActivities.length,
          value: cancelActivities.length,
          color: '#f43f5e',
          glow: 'rgba(244, 63, 94, 0.4)'
        }
      ].filter(item => item.count > 0);
    }
  }, [
    teamActivityViewMode, 
    teamDoneBreakdown, 
    doneActivitiesCount, 
    inProgressActivities, 
    notYetActivities, 
    cancelActivities
  ]);

  // Trigger Drilldown
  const handleStatClick = (title: string, category: DrilldownFilter['category'], value: string) => {
    setDrilldownFilter({ title, category, value });
  };

  // SVG Calculations Helper
  const radius = 80;
  const strokeWidth = 26;
  const center = 100;
  const circumference = 2 * Math.PI * radius;

  // Chart 1 total for SVG arcs
  const chart1Total = pelunasanChartData.reduce((acc, curr) => acc + curr.value, 0);
  let chart1CumulativeAngle = 0;

  // Chart 2 total for SVG arcs
  const chart2Total = teamActivityChartData.reduce((acc, curr) => acc + curr.value, 0);
  let chart2CumulativeAngle = 0;

  return (
    <div className="space-y-6 animate-fadeIn pb-12 select-none">
      
      {/* Clean Executive Header */}
      {!hideHeader && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-500/10 blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider font-semibold">
                <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                  <CreditCard className="w-3.5 h-3.5 animate-pulse" />
                </span>
                <span>BELACOM BILLING & OPERATIONS ANALYTICS</span>
              </div>
              
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1.5 flex items-center gap-2">
                Dashboard Tagihan
                <Sparkles className="w-5 h-5 text-amber-400 hidden sm:inline" />
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-right">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">SINKRONISASI AKTIF</span>
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 justify-end">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Real-Time Data
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2 Primary Executive Metric Cards (Focused directly on the 2 charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* KPI 1: Rasio Pelunasan Pembayaran */}
        <div 
          onClick={() => handleStatClick('Rincian Paket Penagihan Lunas', 'statusPenagihan', 'Lunas')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 p-5 rounded-2xl shadow-xl transition-all cursor-pointer group active:scale-[0.99] relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                  RASIO PELUNASAN PEMBAYARAN
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5 block">
                  {collectionRate}% <span className="text-xs font-sans font-normal text-emerald-400">Terlunasi</span>
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {lunasItems.length} dari {penagihanList.length} Lunas
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${collectionRate}%` }}
              ></div>
            </div>
          </div>

          {/* Nominal Breakdown Strip */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Total Terbayar (Lunas)</span>
              <span className="text-emerald-400 font-extrabold text-sm sm:text-base">
                Rp {totalNominalLunas.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 text-[10px] uppercase block">Sisa Belum Lunas</span>
              <span className="text-amber-400 font-extrabold text-sm sm:text-base">
                Rp {totalNominalBelumLunas.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end text-[11px] text-emerald-400 font-mono gap-1 group-hover:translate-x-0.5 transition-transform">
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>Klik kartu untuk rincian tagihan lunas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 2: Status Aktivitas Team yang Done */}
        <div 
          onClick={() => handleStatClick('Rincian Seluruh Aktivitas Tim (Done)', 'statusWo', 'Done')}
          className="bg-slate-900 border border-slate-800 hover:border-cyan-500/40 p-5 rounded-2xl shadow-xl transition-all cursor-pointer group active:scale-[0.99] relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                  AKTIVITAS TEAM STATUS DONE
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5 block">
                  {doneActivitiesCount} <span className="text-xs font-sans font-normal text-cyan-400">WO Selesai ({doneRate}%)</span>
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {doneActivitiesCount} / {totalActivitiesCount} Aktivitas
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${doneRate}%` }}
              ></div>
            </div>
          </div>

          {/* Activity Breakdown Strip */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Tim Penyelesai Terbanyak</span>
              <span className="text-cyan-400 font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                {teamDoneBreakdown[0]?.label || 'ABR 05'} ({teamDoneBreakdown[0]?.count || 0} Done)
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 text-[10px] uppercase block">Aktivitas Dalam Pengerjaan</span>
              <span className="text-slate-200 font-extrabold text-sm sm:text-base">
                {inProgressActivities.length} WO Aktif
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end text-[11px] text-cyan-400 font-mono gap-1 group-hover:translate-x-0.5 transition-transform">
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>Klik kartu untuk rincian aktivitas tim yang done</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* 2 MAIN REQUESTED PIE CHARTS (Focused & Beautiful)     */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ==================================================== */}
        {/* CHART 1: RASIO PELUNASAN PEMBAYARAN                  */}
        {/* ==================================================== */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all group">
          
          {/* Card Top: Title & Mode Toggle */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <PieChartIcon className="w-4 h-4" />
                  </div>
                  <span>Rasio Pelunasan Pembayaran</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">
                  Visualisasi perbandingan tagihan yang telah lunas vs piutang/proses
                </p>
              </div>

              {/* Mode Toggle: Ratio vs Detail */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setPelunasanViewMode('ratio')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    pelunasanViewMode === 'ratio'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Rasio Lunas
                </button>
                <button
                  type="button"
                  onClick={() => setPelunasanViewMode('detail')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    pelunasanViewMode === 'detail'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Rincian Status
                </button>
              </div>
            </div>

            {/* Donut Chart Visualization */}
            <div className="relative flex items-center justify-center py-6">
              <svg viewBox="0 0 200 200" className="w-56 h-56 transform -rotate-90">
                {chart1Total === 0 ? (
                  <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth={strokeWidth}
                  />
                ) : (
                  pelunasanChartData.map((item, index) => {
                    const percentage = item.value / chart1Total;
                    const strokeDasharray = `${percentage * circumference} ${circumference}`;
                    const strokeDashoffset = -chart1CumulativeAngle * circumference;
                    chart1CumulativeAngle += percentage;

                    const isHovered = hoveredPelunasanIndex === index;

                    return (
                      <circle
                        key={item.label}
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke={item.color}
                        strokeWidth={isHovered ? strokeWidth + 7 : strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-200 cursor-pointer hover:opacity-95"
                        style={{
                          filter: isHovered ? `drop-shadow(0 0 10px ${item.glow})` : 'none'
                        }}
                        onMouseEnter={() => setHoveredPelunasanIndex(index)}
                        onMouseLeave={() => setHoveredPelunasanIndex(null)}
                        onClick={() => {
                          handleStatClick(`Detail Tagihan Status: ${item.filterValue}`, 'statusPenagihan', item.filterValue);
                        }}
                      />
                    );
                  })
                )}
              </svg>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                {hoveredPelunasanIndex !== null ? (
                  <>
                    <span className="text-xl font-black text-white font-mono">
                      {chart1Total > 0 ? `${Math.round((pelunasanChartData[hoveredPelunasanIndex].value / chart1Total) * 100)}%` : '0%'}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-emerald-400 truncate max-w-[140px]">
                      {pelunasanChartData[hoveredPelunasanIndex].count} Tagihan
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold truncate max-w-[140px] mt-0.5">
                      {pelunasanChartData[hoveredPelunasanIndex].label}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                      {collectionRate}%
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">
                      Rasio Lunas
                    </span>
                    <span className="text-[11px] font-mono text-slate-300 font-semibold mt-0.5">
                      {lunasItems.length} dari {penagihanList.length} Paket
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase pb-1">
              <span>Status Pembayaran</span>
              <span>Nominal & Rasio</span>
            </div>

            {pelunasanChartData.map((item, index) => {
              const pct = chart1Total > 0 ? ((item.value / chart1Total) * 100).toFixed(0) : '0';
              const isHovered = hoveredPelunasanIndex === index;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleStatClick(`Detail Tagihan: ${item.filterValue}`, 'statusPenagihan', item.filterValue)}
                  onMouseEnter={() => setHoveredPelunasanIndex(index)}
                  onMouseLeave={() => setHoveredPelunasanIndex(null)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer active:scale-[0.99] ${
                    isHovered 
                      ? 'bg-slate-800 text-white shadow-lg ring-1 ring-emerald-500/50' 
                      : 'bg-slate-950/60 hover:bg-slate-850 text-slate-300 border border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-md shrink-0 shadow-sm transition-transform duration-200"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <div className="text-left">
                      <span className="font-bold text-white block text-xs truncate max-w-[180px]">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.count} Paket Tagihan
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="font-extrabold text-white text-xs block">
                      Rp {item.nominal.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {pct}% dari total
                    </span>
                  </div>
                </button>
              );
            })}

            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-400 font-mono flex items-center justify-center gap-1">
                <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
                Klik salah satu status untuk melihat daftar rincian invoice & tagihan
              </span>
            </div>
          </div>

        </div>

        {/* ==================================================== */}
        {/* CHART 2: STATUS AKTIVITAS TEAM YANG DONE             */}
        {/* ==================================================== */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all group">
          
          {/* Card Top: Title & Mode Toggle */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>Status Aktivitas Team yang Done</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">
                  Visualisasi persebaran aktivitas tim yang telah berstatus selesai (Done)
                </p>
              </div>

              {/* Mode Toggle: Done per Team vs Ratio All Status */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setTeamActivityViewMode('team_done')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    teamActivityViewMode === 'team_done'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tim (Done)
                </button>
                <button
                  type="button"
                  onClick={() => setTeamActivityViewMode('status_all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    teamActivityViewMode === 'status_all'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua Status
                </button>
              </div>
            </div>

            {/* Donut Chart Visualization */}
            <div className="relative flex items-center justify-center py-6">
              <svg viewBox="0 0 200 200" className="w-56 h-56 transform -rotate-90">
                {chart2Total === 0 ? (
                  <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth={strokeWidth}
                  />
                ) : (
                  teamActivityChartData.map((item, index) => {
                    const percentage = item.value / chart2Total;
                    const strokeDasharray = `${percentage * circumference} ${circumference}`;
                    const strokeDashoffset = -chart2CumulativeAngle * circumference;
                    chart2CumulativeAngle += percentage;

                    const isHovered = hoveredTeamIndex === index;

                    return (
                      <circle
                        key={item.label}
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke={item.color}
                        strokeWidth={isHovered ? strokeWidth + 7 : strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-200 cursor-pointer hover:opacity-95"
                        style={{
                          filter: isHovered ? `drop-shadow(0 0 10px ${item.glow})` : 'none'
                        }}
                        onMouseEnter={() => setHoveredTeamIndex(index)}
                        onMouseLeave={() => setHoveredTeamIndex(null)}
                        onClick={() => {
                          if (teamActivityViewMode === 'team_done') {
                            handleStatClick(`Aktivitas Done Tim ${(item as any).teamName}`, 'team', (item as any).teamName);
                          } else {
                            handleStatClick(`Aktivitas Status ${(item as any).statusFilter}`, 'statusWo', (item as any).statusFilter);
                          }
                        }}
                      />
                    );
                  })
                )}
              </svg>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                {hoveredTeamIndex !== null ? (
                  <>
                    <span className="text-xl font-black text-white font-mono">
                      {chart2Total > 0 ? `${Math.round((teamActivityChartData[hoveredTeamIndex].value / chart2Total) * 100)}%` : '0%'}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-cyan-400 truncate max-w-[140px]">
                      {teamActivityChartData[hoveredTeamIndex].count} Aktivitas WO
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold truncate max-w-[140px] mt-0.5">
                      {teamActivityChartData[hoveredTeamIndex].label}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-black text-cyan-400 font-mono tracking-tight">
                      {doneActivitiesCount} WO
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">
                      Status Done
                    </span>
                    <span className="text-[11px] font-mono text-slate-300 font-semibold mt-0.5">
                      {doneRate}% dari Total WO
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase pb-1">
              <span>{teamActivityViewMode === 'team_done' ? 'Tim Pelaksana (Status Done)' : 'Status Aktivitas'}</span>
              <span>Jumlah WO & Kontribusi</span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {teamActivityChartData.map((item, index) => {
                const pct = chart2Total > 0 ? ((item.value / chart2Total) * 100).toFixed(0) : '0';
                const isHovered = hoveredTeamIndex === index;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (teamActivityViewMode === 'team_done') {
                        handleStatClick(`Aktivitas Done Tim ${(item as any).teamName}`, 'team', (item as any).teamName);
                      } else {
                        handleStatClick(`Aktivitas Status ${(item as any).statusFilter}`, 'statusWo', (item as any).statusFilter);
                      }
                    }}
                    onMouseEnter={() => setHoveredTeamIndex(index)}
                    onMouseLeave={() => setHoveredTeamIndex(null)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer active:scale-[0.99] ${
                      isHovered 
                        ? 'bg-slate-800 text-white shadow-lg ring-1 ring-cyan-500/50' 
                        : 'bg-slate-950/60 hover:bg-slate-850 text-slate-300 border border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-md shrink-0 shadow-sm transition-transform duration-200"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <div className="text-left flex items-center gap-2">
                        {teamActivityViewMode === 'team_done' && index < 3 && (
                          <span className="text-xs" title={`Peringkat ${index + 1}`}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                        <div>
                          <span className="font-bold text-white block text-xs truncate max-w-[180px]">
                            {item.label}
                          </span>
                          {teamActivityViewMode === 'team_done' && (
                            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Status Done
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="font-extrabold text-white text-xs block">
                        {item.count} WO
                      </span>
                      <span className="text-[10px] text-cyan-400 font-bold">
                        {pct}% porsi
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-400 font-mono flex items-center justify-center gap-1">
                <MousePointerClick className="w-3.5 h-3.5 text-cyan-400" />
                Klik salah satu tim/status untuk membuka rincian WO di modal detail
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Drilldown Modal with Tutup Button */}
      <DetailFilterModal
        filter={drilldownFilter}
        onClose={() => setDrilldownFilter(null)}
      />

    </div>
  );
};
