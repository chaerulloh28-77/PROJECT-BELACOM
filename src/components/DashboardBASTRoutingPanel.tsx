import React, { useState, useMemo } from 'react';
import { 
  GitBranch, 
  Send, 
  UserCheck, 
  FileCheck2, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  Search, 
  Info, 
  FileSpreadsheet,
  MousePointerClick,
  X,
  Check,
  PieChart as PieChartIcon
} from 'lucide-react';
import { BASTItem } from '../types';
import { evaluateBASTWorkflow, getDefaultBASTWorkflow, getStage1, getStage2, getStage3, getStage4 } from '../utils/bastWorkflowHelper';
import { exportBASTToExcel } from '../utils/excelExportHelper';
import { useProjectContext } from '../context/ProjectContext';

interface DashboardBASTRoutingPanelProps {
  items?: BASTItem[];
  onOpenRoutingModal?: (bast: BASTItem) => void;
  title?: string;
  className?: string;
}

export interface RoutingSliceInfo {
  id: string; // 'STAGE_1' | 'STAGE_2' | 'STAGE_3' | 'STAGE_4' | 'DONE'
  label: string;
  shortLabel: string;
  count: number;
  color: string;
  icon: React.ElementType;
  subtext: string;
}

export const DashboardBASTRoutingPanel: React.FC<DashboardBASTRoutingPanelProps> = ({
  items,
  onOpenRoutingModal,
  title = "Dashboard Routing & Alur BAST",
  className = ""
}) => {
  const { bastList: contextBastList, showToast } = useProjectContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');
  const [hoveredSliceId, setHoveredSliceId] = useState<string | null>(null);

  // Raw BAST list from props or context
  const rawBastList = items || contextBastList;

  // Process rawBastList with automatic workflow fallback for missing or undefined workflow
  const safeBastList = useMemo<BASTItem[]>(() => {
    return (rawBastList || [])
      .filter((b): b is BASTItem => Boolean(b && b.id && b.woNumber))
      .map(bast => ({
        ...bast,
        workflow: bast.workflow || getDefaultBASTWorkflow(bast.woNumber)
      }));
  }, [rawBastList]);

  // Compute distribution breakdown across 5 workflow categories with fallback resilience
  const { total, distribution, slicesData } = useMemo(() => {
    const totalCount = safeBastList.length;

    let s1 = 0; // Stage 1: Email User
    let s2 = 0; // Stage 2: Admin User
    let s3 = 0; // Stage 3: Routing TTD
    let s4 = 0; // Stage 4: Finance
    let s5 = 0; // Stage 5: Selesai 100%

    safeBastList.forEach(bast => {
      const evalWf = evaluateBASTWorkflow(bast);
      if (evalWf.isAllCompleted) {
        s5++;
      } else if (evalWf.currentStageNumber === 1) {
        s1++;
      } else if (evalWf.currentStageNumber === 2) {
        s2++;
      } else if (evalWf.currentStageNumber === 3) {
        s3++;
      } else if (evalWf.currentStageNumber === 4) {
        s4++;
      }
    });

    const slices: RoutingSliceInfo[] = [
      {
        id: 'STAGE_1',
        label: '1. Email User',
        shortLabel: 'Email User',
        count: s1,
        color: '#06b6d4', // Cyan
        icon: Send,
        subtext: 'Dokumen diemail ke User'
      },
      {
        id: 'STAGE_2',
        label: '2. Admin User',
        shortLabel: 'Admin User',
        count: s2,
        color: '#f59e0b', // Amber
        icon: UserCheck,
        subtext: 'Menunggu/Pengecekan Admin'
      },
      {
        id: 'STAGE_3',
        label: '3. Routing TTD',
        shortLabel: 'Routing TTD',
        count: s3,
        color: '#6366f1', // Indigo
        icon: FileCheck2,
        subtext: 'Sirkulasi TTD User'
      },
      {
        id: 'STAGE_4',
        label: '4. Finance',
        shortLabel: 'Finance',
        count: s4,
        color: '#a855f7', // Violet
        icon: DollarSign,
        subtext: 'Proses Diterima Finance'
      },
      {
        id: 'DONE',
        label: '5. Selesai 100%',
        shortLabel: 'Siap Invoice',
        count: s5,
        color: '#10b981', // Emerald
        icon: CheckCircle2,
        subtext: 'Selesai 100% & Siap Invoice'
      }
    ];

    return {
      total: totalCount,
      distribution: { s1, s2, s3, s4, s5 },
      slicesData: slices
    };
  }, [safeBastList]);

  // SVG Donut Chart Parameters with Number.isFinite safety
  const safeNum = (val: number | undefined | null, fallback = 0): number => {
    return typeof val === 'number' && Number.isFinite(val) ? val : fallback;
  };

  const radius = safeNum(75, 75);
  const strokeWidth = safeNum(26, 26);
  const center = safeNum(100, 100);
  const circumference = safeNum(2 * Math.PI * radius, 471.23889);

  // Active Hovered or Selected Slice
  const activeHoveredSlice = slicesData.find(s => s.id === hoveredSliceId);
  const activeSelectedSlice = slicesData.find(s => s.id === selectedStageFilter);
  const displaySlice = activeHoveredSlice || activeSelectedSlice;

  // Filter items based on selected stage filter & search
  const filteredBastItems = useMemo(() => {
    return safeBastList.filter(bast => {
      const evalWf = evaluateBASTWorkflow(bast);
      const matchesSearch = 
        searchQuery.trim() === '' ||
        bast.woNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bast.workType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bast.bastNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bast.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evalWf.currentStageTitle.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedStageFilter === 'ALL') return true;
      if (selectedStageFilter === 'STAGE_1') return evalWf.currentStageNumber === 1 && !evalWf.isAllCompleted;
      if (selectedStageFilter === 'STAGE_2') return evalWf.currentStageNumber === 2 && !evalWf.isAllCompleted;
      if (selectedStageFilter === 'STAGE_3') return evalWf.currentStageNumber === 3 && !evalWf.isAllCompleted;
      if (selectedStageFilter === 'STAGE_4') return evalWf.currentStageNumber === 4 && !evalWf.isAllCompleted;
      if (selectedStageFilter === 'DONE') return evalWf.isAllCompleted;

      return true;
    });
  }, [safeBastList, searchQuery, selectedStageFilter]);

  return (
    <div className={`space-y-6 select-none ${className}`}>
      
      {/* Panel Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <GitBranch className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white font-mono">{title}</h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono font-bold">
                Interaktif 5 Tahap
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Visualisasi Grafik Pie &amp; Pemantauan Alur BAST (Email ➔ Admin ➔ Routing TTD ➔ Finance ➔ Selesai)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              exportBASTToExcel(safeBastList);
              showToast('success', 'Rekap Excel Unduh', 'Rekap Alur Routing BAST berhasil diekspor ke Excel!');
            }}
            className="px-3.5 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Rekap Excel</span>
          </button>
        </div>
      </div>

      {/* 1. Interactive Pie/Donut Chart Card Section */}
      <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6 transition-all">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <PieChartIcon className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-white font-mono uppercase tracking-wider">
                GRAFIK PIE INTERAKTIF ALUR BAST
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                Klik irisan pie atau legenda untuk memfilter daftar antrean
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1 bg-slate-950 text-cyan-300 border border-slate-800 rounded-xl font-bold">
              Total: <strong className="text-white">{total}</strong> BAST
            </span>
            {selectedStageFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedStageFilter('ALL')}
                className="px-2.5 py-1 bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Donut Chart & Legend Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Centered Donut SVG Display (Col 5) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-2">
            
            <div className="relative flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-56 h-56 sm:w-64 sm:h-64 transform -rotate-90">
                {safeNum(total, 0) === 0 ? (
                  <circle
                    cx={safeNum(center, 100)}
                    cy={safeNum(center, 100)}
                    r={safeNum(radius, 75)}
                    fill="none"
                    stroke="#334155"
                    strokeWidth={safeNum(strokeWidth, 26)}
                  />
                ) : (
                  (() => {
                    let angleAcc = 0;
                    return slicesData.map((slice, index) => {
                      const count = safeNum(slice.count, 0);
                      const safeTotal = safeNum(total, 0);
                      if (count <= 0 || safeTotal <= 0) return null;

                      const rawPercent = count / safeTotal;
                      const percentage = Number.isFinite(rawPercent) && rawPercent > 0 ? rawPercent : 0;
                      if (percentage <= 0) return null;

                      const dashLen = safeNum(percentage * circumference, 0);
                      const strokeDasharray = `${dashLen} ${safeNum(circumference, 471.24)}`;
                      const strokeDashoffset = safeNum(-angleAcc * circumference, 0);
                      angleAcc += percentage;

                      const isHovered = hoveredSliceId === slice.id;
                      const isSelected = selectedStageFilter === slice.id;
                      const calculatedStrokeWidth = safeNum(isSelected ? strokeWidth + 9 : isHovered ? strokeWidth + 5 : strokeWidth, 26);

                      return (
                        <circle
                          key={`stage-${slice.id || index}`}
                          cx={safeNum(center, 100)}
                          cy={safeNum(center, 100)}
                          r={safeNum(radius, 75)}
                          fill="none"
                          stroke={slice.color || '#06b6d4'}
                          strokeWidth={calculatedStrokeWidth}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-200 cursor-pointer"
                          style={{
                            filter: isSelected || isHovered ? `drop-shadow(0 0 14px ${slice.color})` : 'none',
                            opacity: selectedStageFilter !== 'ALL' && !isSelected && hoveredSliceId === null ? 0.4 : hoveredSliceId !== null && !isHovered ? 0.55 : 1
                          }}
                          onMouseEnter={() => setHoveredSliceId(slice.id)}
                          onMouseLeave={() => setHoveredSliceId(null)}
                          onClick={() => setSelectedStageFilter(isSelected ? 'ALL' : slice.id)}
                        />
                      );
                    });
                  })()
                )}
              </svg>

              {/* Center Label inside Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                {displaySlice ? (
                  <div className="animate-fadeIn space-y-0.5">
                    <span className="text-3xl font-black tracking-tight text-white font-mono block">
                      {displaySlice.count}
                    </span>
                    <span 
                      className="text-[11px] uppercase tracking-wider font-extrabold font-mono block truncate max-w-[140px]"
                      style={{ color: displaySlice.color }}
                    >
                      {displaySlice.shortLabel}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {total > 0 ? `${Math.round((displaySlice.count / total) * 100)}% dari total` : ''}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <span className="text-3xl font-black tracking-tight text-cyan-400 font-mono block">
                      {total}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-slate-300 font-extrabold font-mono block">
                      ALUR BAST
                    </span>
                    <span className="text-[9px] text-cyan-400 font-mono font-semibold flex items-center justify-center gap-1">
                      <MousePointerClick className="w-3 h-3" /> Arahkan / Klik
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Instruction tooltip note */}
            <p className="text-[11px] text-slate-400 font-mono text-center mt-3">
              {selectedStageFilter !== 'ALL' ? (
                <span className="text-cyan-300 font-bold">
                  Filter Aktif: {slicesData.find(s => s.id === selectedStageFilter)?.label}
                </span>
              ) : (
                "Arahkan kursor atau klik irisan grafik untuk melihat detail tahap"
              )}
            </p>
          </div>

          {/* Dynamic Interactive Legend List (Col 7) */}
          <div className="lg:col-span-7 space-y-2 font-mono">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              LEGENDA ALUR BAST (5 TAHAP):
            </h5>

            <div className="space-y-2">
              {slicesData.map((slice, index) => {
                const percentage = total > 0 ? Math.round((slice.count / total) * 100) : 0;
                const isHovered = hoveredSliceId === slice.id;
                const isSelected = selectedStageFilter === slice.id;
                const Icon = slice.icon;

                return (
                  <button
                    key={`stage-legend-${slice.id || index}`}
                    type="button"
                    onClick={() => setSelectedStageFilter(isSelected ? 'ALL' : slice.id)}
                    onMouseEnter={() => setHoveredSliceId(slice.id)}
                    onMouseLeave={() => setHoveredSliceId(null)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs transition-all duration-150 cursor-pointer active:scale-98 ${
                      isSelected
                        ? 'bg-slate-800 text-white shadow-lg ring-1 font-bold border-cyan-500/80 ring-cyan-500/50'
                        : isHovered
                          ? 'bg-slate-800/80 text-white border-slate-700'
                          : 'bg-slate-950/60 hover:bg-slate-800/50 text-slate-300 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3.5 h-3.5 rounded-md shrink-0 shadow-sm transition-transform duration-200"
                        style={{ backgroundColor: slice.color }}
                      />
                      <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                      <div className="text-left">
                        <span className="font-bold text-slate-100 block text-xs">
                          {slice.label}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {slice.subtext}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-xs font-bold">{percentage}%</span>
                      <span className="font-extrabold text-white px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800 text-xs shadow-inner">
                        {slice.count} Dokumen
                      </span>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Filter Reset */}
            {selectedStageFilter !== 'ALL' && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedStageFilter('ALL')}
                  className="text-xs text-rose-400 hover:text-white font-mono flex items-center gap-1 bg-rose-950/60 hover:bg-rose-900/60 px-3 py-1.5 rounded-xl border border-rose-800/60 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Reset Filter (Tampilkan Semua BAST)
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 2. Tabel Monitoring Antrean Routing */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-4 sm:p-5">
        
        {/* Filter Controls Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari No BAST, Ref WO, Nama Admin, Approver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-3 py-2.5 outline-none transition-all font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="text-slate-400 font-bold mr-1">Filter Tahap:</span>
            
            <button
              onClick={() => setSelectedStageFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedStageFilter === 'ALL'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Semua ({safeBastList.length})
            </button>

            {selectedStageFilter !== 'ALL' && (
              <span className="px-3 py-1.5 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                Filter: {slicesData.find(s => s.id === selectedStageFilter)?.label} ({filteredBastItems.length})
              </span>
            )}
          </div>
        </div>

        {/* Monitoring Queue Table */}
        <div className="overflow-x-auto">
          {filteredBastItems.length === 0 ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Info className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs font-semibold">Tidak ada dokumen BAST yang ditemukan pada filter ini</p>
              {selectedStageFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedStageFilter('ALL')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono rounded-lg transition-colors cursor-pointer mt-2"
                >
                  Tampilkan Semua BAST
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/90 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">No. BAST &amp; Ref WO</th>
                  <th className="py-2.5 px-3 font-semibold">Pekerjaan / Subjek</th>
                  <th className="py-2.5 px-3 font-semibold">Tahap Aktif Saat Ini</th>
                  <th className="py-2.5 px-3 font-semibold">Tanggal &amp; Update</th>
                  <th className="py-2.5 px-3 font-semibold">Approver / PIC Terakhir</th>
                  <th className="py-2.5 px-3 font-semibold">Status &amp; Catatan</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredBastItems.map((bast, index) => {
                  const safeBast: BASTItem = {
                    ...bast,
                    workflow: bast.workflow || getDefaultBASTWorkflow(bast.woNumber)
                  };

                  const evalWf = evaluateBASTWorkflow(safeBast);
                  const bastNo = bast.bastNumber || `BAST/${bast.woNumber}/BELACOM/2026`;
                  const s1 = getStage1(safeBast.workflow);
                  const s2 = getStage2(safeBast.workflow);
                  const s3 = getStage3(safeBast.workflow);
                  const s4 = getStage4(safeBast.workflow);

                  // Extract last active approver name / date / detail info
                  let activePic = '-';
                  let activeDate = bast.finishDate || bast.createdAt;
                  let activeNotes = bast.notes || '-';

                  if (evalWf.currentStageNumber === 1) {
                    activePic = s1.emailSubject || 'Email User';
                    activeDate = s1.tanggalKirim || s1.emailSentDate || bast.createdAt;
                    activeNotes = s1.notes || 'Menunggu pengiriman email ke User';
                  } else if (evalWf.currentStageNumber === 2) {
                    activePic = s2.adminName ? `Admin: ${s2.adminName}` : 'Admin User';
                    activeDate = s2.checkedDate || bast.updatedAt || bast.createdAt;
                    activeNotes = s2.notes || (s2.status === 'Ada Catatan Revisi' ? 'Ada catatan revisi dari Admin User' : 'Dalam pengecekan admin User');
                  } else if (evalWf.currentStageNumber === 3) {
                    activePic = s3.approverNames ? `Approver: ${s3.approverNames}` : 'Approver User';
                    activeDate = s3.signedDate || bast.updatedAt || bast.createdAt;
                    activeNotes = s3.notes || 'Sirkulasi TTD sedang berjalan';
                  } else if (evalWf.currentStageNumber === 4) {
                    activePic = s4.financeRefNumber ? `Ref: ${s4.financeRefNumber}` : 'Tim Finance';
                    activeDate = s4.tanggalMasukFinance || s4.receivedDate || bast.updatedAt || bast.createdAt;
                    activeNotes = s4.notes || 'Berkas diterima finance, proses penerbitan invoice';
                  } else {
                    activePic = s4.financeRefNumber || 'Finance Completed';
                    activeDate = s4.tanggalMasukFinance || bast.updatedAt || bast.createdAt;
                    activeNotes = 'Selesai 100% (Siap Invoice)';
                  }

                  return (
                    <tr key={`bast-row-${bast.id || index}`} className="hover:bg-slate-800/60 transition-colors group">
                      
                      {/* Col 1: No. BAST & Ref WO */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-emerald-400 font-mono block text-xs truncate max-w-[170px]" title={bastNo}>
                          {bastNo}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-mono block">WO: {bast.woNumber}</span>
                      </td>

                      {/* Col 2: Pekerjaan & Subjek */}
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-slate-200 block max-w-[220px] truncate text-xs" title={bast.workType}>
                          {bast.workType}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[220px]">
                          {bast.woType}
                        </span>
                      </td>

                      {/* Col 3: Tahap Aktif Saat Ini */}
                      <td className="py-2.5 px-3">
                        <div 
                          onClick={() => onOpenRoutingModal?.(bast)}
                          className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer max-w-[220px]"
                          title="Klik untuk membuka BAST Workflow Modal"
                        >
                          <div className="flex items-center gap-1 shrink-0">
                            <span className={`w-2 h-2 rounded-full ${evalWf.stages[0].isCompleted ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'}`} />
                            <span className={`w-2 h-2 rounded-full ${evalWf.stages[1].isCompleted ? 'bg-emerald-400' : evalWf.stages[0].isCompleted ? (s2.status === 'Ada Catatan Revisi' ? 'bg-rose-400 animate-pulse' : 'bg-amber-400 animate-pulse') : 'bg-slate-700'}`} />
                            <span className={`w-2 h-2 rounded-full ${evalWf.stages[2].isCompleted ? 'bg-emerald-400' : evalWf.stages[1].isCompleted ? 'bg-indigo-400 animate-pulse' : 'bg-slate-700'}`} />
                            <span className={`w-2 h-2 rounded-full ${evalWf.stages[3].isCompleted ? 'bg-emerald-400' : evalWf.stages[2].isCompleted ? 'bg-purple-400 animate-pulse' : 'bg-slate-700'}`} />
                          </div>
                          <div className="text-[10px] font-mono truncate">
                            <span className={`font-bold block ${
                              evalWf.isAllCompleted ? 'text-emerald-400' :
                              s2.status === 'Ada Catatan Revisi' ? 'text-rose-400' :
                              'text-cyan-300'
                            }`}>
                              {evalWf.currentStageTitle}
                            </span>
                            <span className="text-slate-400 text-[9px]">{evalWf.percent}% Selesai</span>
                          </div>
                        </div>
                      </td>

                      {/* Col 4: Tanggal Masuk Tahap */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                        <span className="text-xs text-slate-200 block font-bold">{activeDate || '-'}</span>
                        <span className="text-[10px] text-slate-400 block">Status Date</span>
                      </td>

                      {/* Col 5: Approver / PIC Terakhir */}
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-200 block max-w-[170px] truncate text-xs" title={activePic}>
                          {activePic}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Tahap {evalWf.currentStageNumber > 4 ? 'Done' : evalWf.currentStageNumber}
                        </span>
                      </td>

                      {/* Col 6: Status & Catatan */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {s2.status === 'Ada Catatan Revisi' ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-mono font-bold flex items-center gap-1 shrink-0">
                              <AlertTriangle className="w-3 h-3 text-rose-400" /> Ada Revisi
                            </span>
                          ) : evalWf.isAllCompleted ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Siap Invoice
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono font-bold flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3 text-blue-400" /> In Routing
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[200px] mt-0.5" title={activeNotes}>
                          {activeNotes}
                        </span>
                      </td>

                      {/* Col 7: Aksi Cepat */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenRoutingModal?.(bast)}
                          className="px-2.5 py-1 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono font-bold transition-all flex items-center gap-1.5 ml-auto cursor-pointer active:scale-95 shadow-sm"
                          title="Buka Modal Workflow Alur BAST"
                        >
                          <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Update Routing</span>
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};
