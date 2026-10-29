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
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  RefreshCw,
  Award,
  MousePointerClick,
  CreditCard,
  Layers,
  ShieldCheck,
  Receipt,
  Tag,
  Users,
  Check,
  ClipboardList,
  RadioTower,
  WalletCards,
  ReceiptText
} from 'lucide-react';
import { useProjectContext, DrilldownFilter } from '../context/ProjectContext';
import { DetailFilterModal } from '../components/DetailFilterModal';
import { InteractivePieChartCard, PieChartSliceData } from '../components/InteractivePieChartCard';
import { ProjectDetailCardList, DetailCardItem } from '../components/ProjectDetailCardList';
import { DashboardBASTRoutingPanel } from '../components/DashboardBASTRoutingPanel';
import { BASTWorkflowModal } from '../components/BASTWorkflowModal';
import { DashboardTagihanPage } from './DashboardTagihanPage';
import { DailyReportItem, BASTItem, BASTWorkflow } from '../types';
import { evaluateBASTWorkflow, getDefaultBASTWorkflow } from '../utils/bastWorkflowHelper';

interface DashboardOverviewPageProps {
  initialSubTab?: 'operational' | 'financial';
}

export const DashboardOverviewPage: React.FC<DashboardOverviewPageProps> = ({ initialSubTab = 'operational' }) => {
  const { 
    dailyReports, 
    bastList,
    invoices,
    penagihanList,
    drilldownFilter,
    setDrilldownFilter,
    setActiveTab,
    dashboardView,
    setDashboardView,
    updateBAST,
    showToast
  } = useProjectContext();

  const [dashboardRoutingModalBast, setDashboardRoutingModalBast] = useState<BASTItem | null>(null);

  const handleSaveDashboardWorkflow = (bastId: string, updatedWorkflow: BASTWorkflow) => {
    updateBAST(bastId, { workflow: updatedWorkflow });
    showToast('success', 'Routing BAST Diperbarui', 'Alur BAST berhasil diperbarui dari Dashboard!');
  };

  const [isPmWidgetExpanded, setIsPmWidgetExpanded] = useState<boolean>(true);
  const totalTagihanItems = dailyReports.length + bastList.length + invoices.length + penagihanList.length;

  // Sub-Tab State: 'operational' vs 'financial'
  const [dashboardSubTab, setDashboardSubTab] = useState<'operational' | 'financial'>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setDashboardSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Accordion Open / Collapsible State
  const [openSections, setOpenSections] = useState({
    project: true,   // 1. Dashboard Total Project (default open)
    bast: false,     // 2. Dashboard BAST (collapsible)
    invoice: false,  // 3. Dashboard Invoice Penagihan (collapsible)
  });

  const toggleSection = (key: 'project' | 'bast' | 'invoice') => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const scrollToSection = (key: 'project' | 'bast' | 'invoice') => {
    setOpenSections(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      const el = document.getElementById(`slidebar-${key}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleExpandAll = () => {
    setOpenSections({ project: true, bast: true, invoice: true });
  };

  const handleCollapseAll = () => {
    setOpenSections({ project: false, bast: false, invoice: false });
  };

  // Interactive Pie Chart Slice Selection State
  const [selectedProjectStatus, setSelectedProjectStatus] = useState<string | null>(null);
  const [selectedBastStatus, setSelectedBastStatus] = useState<string | null>(null);
  const [selectedInvoiceStatus, setSelectedInvoiceStatus] = useState<string | null>(null);

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
    setSelectedProjectStatus(null);
    setSelectedBastStatus(null);
    setSelectedInvoiceStatus(null);
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

  // 1. Dashboard Total Project Metrics & Pie Data
  const totalWoCount = filteredReports.length;
  const doneCount = filteredReports.filter(r => r.statusWo === 'Done').length;
  const inProgressCount = filteredReports.filter(r => r.statusWo === 'In Progress').length;
  const pendingCount = filteredReports.filter(r => r.statusWo === 'Pending').length;
  const notYetCount = filteredReports.filter(r => r.statusWo === 'Not Yet').length;
  const cancelCount = filteredReports.filter(r => r.statusWo === 'Cancel').length;

  const achievementRate = totalWoCount > 0 
    ? Math.round((doneCount / totalWoCount) * 100) 
    : 0;

  const projectPieData: PieChartSliceData[] = [
    {
      id: 'Done',
      label: 'Done (Selesai)',
      shortLabel: 'Done',
      value: doneCount,
      color: '#10b981', // emerald-500
      icon: CheckCircle2,
      subtext: `${achievementRate}% Pencapaian`
    },
    {
      id: 'In Progress',
      label: 'In Progress',
      shortLabel: 'In Progress',
      value: inProgressCount,
      color: '#06b6d4', // cyan-500
      icon: PlayCircle,
      subtext: 'Sedang Berjalan'
    },
    {
      id: 'Pending',
      label: 'Pending (Tertunda)',
      shortLabel: 'Pending',
      value: pendingCount,
      color: '#f59e0b', // amber-500
      icon: Clock,
      subtext: 'Tertunda'
    },
    {
      id: 'Not Yet',
      label: 'Not Yet',
      shortLabel: 'Not Yet',
      value: notYetCount,
      color: '#94a3b8', // slate-400
      icon: Clock,
      subtext: 'Belum Dimulai'
    },
    {
      id: 'Cancel',
      label: 'Cancel (Batal)',
      shortLabel: 'Cancel',
      value: cancelCount,
      color: '#f43f5e', // rose-500
      icon: XCircle,
      subtext: 'Dibatalkan'
    }
  ];

  // Helper BAST Status Mapper
  const getBastStatusForReport = (r: DailyReportItem) => {
    const bast = bastList.find(b => b.woNumber === r.woNumber);
    if (bast) {
      if (bast.statusBast === 'Done' || bast.statusBast === 'Submitted via Gmail' || bast.statusBast === 'Submit') {
        return 'Sudah BAST';
      }
      if (bast.statusBast === 'Not Yet') {
        return 'Draft BAST';
      }
    }
    if (r.statusWo === 'Done') {
      return 'Sudah BAST';
    }
    if (r.statusWo === 'In Progress') {
      return 'Pending Review';
    }
    return 'Draft BAST';
  };

  // 2. Dashboard BAST Metrics & Pie Data directly synced with bastList
  const bastSudahCount = bastList.filter(b => {
    const safeB = { ...b, workflow: b.workflow || getDefaultBASTWorkflow(b.woNumber) };
    return evaluateBASTWorkflow(safeB).isAllCompleted;
  }).length;

  const bastDraftCount = bastList.filter(b => {
    const safeB = { ...b, workflow: b.workflow || getDefaultBASTWorkflow(b.woNumber) };
    return !evaluateBASTWorkflow(safeB).isAllCompleted && evaluateBASTWorkflow(safeB).currentStageNumber === 1;
  }).length;

  const bastPendingCount = bastList.filter(b => {
    const safeB = { ...b, workflow: b.workflow || getDefaultBASTWorkflow(b.woNumber) };
    return !evaluateBASTWorkflow(safeB).isAllCompleted && evaluateBASTWorkflow(safeB).currentStageNumber > 1;
  }).length;

  const totalBastCount = bastList.length;

  const bastPieData: PieChartSliceData[] = [
    {
      id: 'Sudah BAST',
      label: 'Sudah BAST (100% Selesai)',
      shortLabel: 'Sudah BAST',
      value: bastSudahCount,
      color: '#10b981', // emerald-500
      icon: ShieldCheck,
      subtext: 'Dokumen Terbit'
    },
    {
      id: 'Draft BAST',
      label: 'Draft BAST (Tahap 1: Email)',
      shortLabel: 'Draft BAST',
      value: bastDraftCount,
      color: '#06b6d4', // cyan-500
      icon: Clock,
      subtext: 'Dalam Pengiriman Email'
    },
    {
      id: 'Pending Review',
      label: 'In Routing / Review',
      shortLabel: 'In Routing',
      value: bastPendingCount,
      color: '#f59e0b', // amber-500
      icon: PlayCircle,
      subtext: 'Review & Routing TTD'
    }
  ];

  // Helper Invoice Status Mapper
  const getInvoiceStatusForReport = (r: DailyReportItem) => {
    const p = penagihanList.find(item => item.woNumber === r.woNumber);
    const inv = invoices.find(item => item.woNumber === r.woNumber);

    if (p?.statusPenagihan === 'Lunas' || inv?.statusInvoice === 'Done') {
      return 'Lunas';
    }
    if (inv?.statusInvoice === 'Submit' || p?.statusPenagihan === 'Dalam Review') {
      return 'Dalam Verifikasi';
    }
    if (inv?.statusInvoice === 'Revision' || p?.statusPenagihan === 'Ditolak') {
      return 'Kendala Administrasi';
    }
    return 'Belum Terbit Invoice';
  };

  const getNominalForReport = (r: DailyReportItem) => {
    const p = penagihanList.find(item => item.woNumber === r.woNumber);
    if (p && p.totalNominalRupiah > 0) return p.totalNominalRupiah;
    const inv = invoices.find(item => item.woNumber === r.woNumber);
    if (inv && inv.amountRupiah > 0) return inv.amountRupiah;
    return r.totalDistanceMeters * 35000;
  };

  // 3. Dashboard Invoice Metrics & Pie Data
  const invLunasCount = filteredReports.filter(r => getInvoiceStatusForReport(r) === 'Lunas').length;
  const invVerifikasiCount = filteredReports.filter(r => getInvoiceStatusForReport(r) === 'Dalam Verifikasi').length;
  const invBelumTerbitCount = filteredReports.filter(r => getInvoiceStatusForReport(r) === 'Belum Terbit Invoice').length;
  const invKendalaCount = filteredReports.filter(r => getInvoiceStatusForReport(r) === 'Kendala Administrasi').length;

  const totalNominalLunas = filteredReports
    .filter(r => getInvoiceStatusForReport(r) === 'Lunas')
    .reduce((acc, r) => acc + getNominalForReport(r), 0);

  const invoicePieData: PieChartSliceData[] = [
    {
      id: 'Lunas',
      label: 'Lunas (Selesai Bayar)',
      shortLabel: 'Lunas',
      value: invLunasCount,
      color: '#10b981', // emerald-500
      icon: CheckCircle2,
      subtext: `Rp ${(totalNominalLunas / 1000000).toFixed(1)}M`
    },
    {
      id: 'Dalam Verifikasi',
      label: 'Dalam Verifikasi',
      shortLabel: 'Verifikasi',
      value: invVerifikasiCount,
      color: '#06b6d4', // cyan-500
      icon: Clock,
      subtext: 'Proses Review Client'
    },
    {
      id: 'Belum Terbit Invoice',
      label: 'Belum Terbit Invoice',
      shortLabel: 'Belum Terbit',
      value: invBelumTerbitCount,
      color: '#f59e0b', // amber-500
      icon: Receipt,
      subtext: 'Menunggu Pengajuan'
    },
    {
      id: 'Kendala Administrasi',
      label: 'Kendala Administrasi',
      shortLabel: 'Kendala',
      value: invKendalaCount,
      color: '#f43f5e', // rose-500
      icon: XCircle,
      subtext: 'Perlu Revisi Dokumen'
    }
  ];

  // Selected Detail Items Computed for Section 1 (Total Project)
  const projectDetailItems = useMemo((): DetailCardItem[] => {
    if (!selectedProjectStatus) return [];
    return filteredReports
      .filter(r => r.statusWo === selectedProjectStatus)
      .map(r => ({
        id: r.id,
        woNumber: r.woNumber,
        pic: r.pic,
        assignment: r.assignment,
        team: r.team,
        workType: r.workType,
        statusLabel: r.statusWo,
        statusBadgeColor: 
          r.statusWo === 'Done' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' :
          r.statusWo === 'In Progress' ? 'bg-cyan-950 text-cyan-400 border-cyan-500/30' :
          r.statusWo === 'Pending' ? 'bg-amber-950 text-amber-400 border-amber-500/30 font-bold' :
          r.statusWo === 'Cancel' ? 'bg-rose-950 text-rose-400 border-rose-500/30' :
          'bg-slate-950 text-slate-400 border-slate-800',
        estimatedDistanceMeters: r.estimatedDistanceMeters,
        totalDistanceMeters: r.totalDistanceMeters,
        nominal: getNominalForReport(r),
        releaseDate: r.releaseDate
      }));
  }, [filteredReports, selectedProjectStatus]);

  // Selected Detail Items Computed for Section 2 (BAST)
  const bastDetailItems = useMemo((): DetailCardItem[] => {
    if (!selectedBastStatus) return [];
    return filteredReports
      .filter(r => getBastStatusForReport(r) === selectedBastStatus)
      .map(r => ({
        id: r.id,
        woNumber: r.woNumber,
        pic: r.pic,
        assignment: r.assignment,
        team: r.team,
        workType: r.workType,
        statusLabel: selectedBastStatus,
        statusBadgeColor: 
          selectedBastStatus === 'Sudah BAST' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' :
          selectedBastStatus === 'Pending Review' ? 'bg-blue-950 text-blue-400 border-blue-500/30' :
          'bg-amber-950 text-amber-400 border-amber-500/30',
        estimatedDistanceMeters: r.estimatedDistanceMeters,
        totalDistanceMeters: r.totalDistanceMeters,
        nominal: getNominalForReport(r),
        releaseDate: r.releaseDate
      }));
  }, [filteredReports, selectedBastStatus]);

  // Selected Detail Items Computed for Section 3 (Invoice)
  const invoiceDetailItems = useMemo((): DetailCardItem[] => {
    if (!selectedInvoiceStatus) return [];
    return filteredReports
      .filter(r => getInvoiceStatusForReport(r) === selectedInvoiceStatus)
      .map(r => ({
        id: r.id,
        woNumber: r.woNumber,
        pic: r.pic,
        assignment: r.assignment,
        team: r.team,
        workType: r.workType,
        statusLabel: selectedInvoiceStatus,
        statusBadgeColor: 
          selectedInvoiceStatus === 'Lunas' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' :
          selectedInvoiceStatus === 'Dalam Verifikasi' ? 'bg-cyan-950 text-cyan-400 border-cyan-500/30' :
          selectedInvoiceStatus === 'Kendala Administrasi' ? 'bg-rose-950 text-rose-400 border-rose-500/30' :
          'bg-amber-950 text-amber-400 border-amber-500/30',
        estimatedDistanceMeters: r.estimatedDistanceMeters,
        totalDistanceMeters: r.totalDistanceMeters,
        nominal: getNominalForReport(r),
        releaseDate: r.releaseDate
      }));
  }, [filteredReports, selectedInvoiceStatus]);

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
              <span>Dashboard Control & Monitoring Operasional Belacom Project</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 flex items-center gap-2">
              Dashboard
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

      {/* Modern Sub-Tab Navigation System (Pills Toggle) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 w-full sm:w-auto">
          {/* Sub-Tab 1: Operasional & Pencapaian WO */}
          <button
            type="button"
            onClick={() => setDashboardSubTab('operational')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              dashboardSubTab === 'operational'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/50 border border-cyan-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-300" />
            <span>Operasional & Pencapaian WO</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
              dashboardSubTab === 'operational' ? 'bg-cyan-900/60 text-cyan-200' : 'bg-slate-800 text-slate-400'
            }`}>
              {dailyReports.length}
            </span>
          </button>

          {/* Sub-Tab 2: Finansial & Tagihan WO */}
          <button
            type="button"
            onClick={() => setDashboardSubTab('financial')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              dashboardSubTab === 'financial'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50 border border-emerald-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-300" />
            <span>Finansial & Tagihan WO</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
              dashboardSubTab === 'financial' ? 'bg-emerald-900/70 text-emerald-200' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}>
              {penagihanList.length} Aktif
            </span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-950/60 rounded-xl border border-slate-800/60 text-[11px] font-mono text-slate-400">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Mode Tampilan: <strong className="text-slate-200">{dashboardSubTab === 'operational' ? 'Analitik Accordion Terstruktur' : 'Analitik Finansial & Tagihan'}</strong></span>
        </div>
      </div>

      {dashboardSubTab === 'operational' ? (
        <div className="space-y-6">
          
          {/* Global Search & Complete Filter Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Filter className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-100">
                  PANEL FILTER DASHBOARD ACCORDION
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
          </div>

          {/* DYNAMIC ACTIVE DASHBOARD VIEW (Total WO, BAST, or Tagihan) */}
          {dashboardView === 'total-wo' && (
            <div className="bg-slate-900 border border-cyan-500/50 ring-1 ring-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl p-4 sm:p-6 animate-fadeIn space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-white font-mono">
                      Dashboard Total WO
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      Visualisasi status siklus hidup seluruh Work Order (WO)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-3 py-1 rounded-lg bg-slate-950 text-cyan-400 border border-slate-800 font-bold">
                    Total: {totalWoCount} WO
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold">
                    Done: {doneCount}
                  </span>
                </div>
              </div>

              <div className="max-w-2xl mx-auto w-full">
                <InteractivePieChartCard
                  title="STATUS PENCAPAIAN WORK ORDER"
                  subtitle="Kelompok status pekerjaan (Done, In Progress, Not Yet, Cancel)"
                  total={totalWoCount}
                  data={projectPieData}
                  selectedId={selectedProjectStatus}
                  onSelectSlice={(id) => setSelectedProjectStatus(id)}
                  centerTitle={`${achievementRate}%`}
                  centerSubtitle="PENCAPAIAN DONE"
                />
              </div>

              {selectedProjectStatus && (
                <div className="w-full mt-6 animate-fadeIn">
                  <ProjectDetailCardList
                    title="DETAIL PROJECT BERDASARKAN STATUS"
                    statusName={selectedProjectStatus}
                    count={projectDetailItems.length}
                    items={projectDetailItems}
                    onClose={() => setSelectedProjectStatus(null)}
                    onSelectWo={(wo) => handleStatCardClick(`Detail WO ${wo}`, 'wo', wo)}
                  />
                </div>
              )}
            </div>
          )}

          {dashboardView === 'bast' && (
            <div className="bg-slate-900 border border-emerald-500/50 ring-1 ring-emerald-500/20 rounded-2xl overflow-hidden shadow-2xl p-4 sm:p-6 animate-fadeIn space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-white font-mono">
                      Dashboard BAST
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      Visualisasi status penerbitan & verifikasi dokumen BAST
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-3 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold">
                    Sudah BAST: {bastSudahCount}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-500/30 font-bold">
                    Draft: {bastDraftCount}
                  </span>
                </div>
              </div>

              <div className="max-w-2xl mx-auto w-full">
                <InteractivePieChartCard
                  title="STATUS DOKUMEN BAST"
                  subtitle="Kelompok status BAST (Sudah BAST, Draft BAST, In Routing)"
                  total={totalBastCount}
                  data={bastPieData}
                  selectedId={selectedBastStatus}
                  onSelectSlice={(id) => setSelectedBastStatus(id)}
                  centerTitle={`${bastSudahCount}`}
                  centerSubtitle="SUDAH BAST"
                />
              </div>

              {selectedBastStatus && (
                <div className="w-full mt-6 animate-fadeIn">
                  <ProjectDetailCardList
                    title="DETAIL PROYEK BAST"
                    statusName={selectedBastStatus}
                    count={bastDetailItems.length}
                    items={bastDetailItems}
                    onClose={() => setSelectedBastStatus(null)}
                    onSelectWo={(wo) => handleStatCardClick(`Detail BAST ${wo}`, 'bast', wo)}
                  />
                </div>
              )}

              {/* Panel Dashboard Routing & Pipeline Alur BAST 4-Tahap */}
              <div className="pt-4 border-t border-slate-800">
                <DashboardBASTRoutingPanel
                  items={bastList}
                  onOpenRoutingModal={(bast) => setDashboardRoutingModalBast(bast)}
                />
              </div>
            </div>
          )}

          {dashboardView === 'tagihan' && (
            <div className="bg-slate-900 border border-amber-500/50 ring-1 ring-amber-500/20 rounded-2xl overflow-hidden shadow-2xl p-4 sm:p-6 animate-fadeIn space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-white font-mono">
                      Dashboard Tagihan
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      Visualisasi status pembayaran & penagihan keuangan paket
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-3 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold">
                    Lunas: {invLunasCount}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold">
                    Verifikasi: {invVerifikasiCount}
                  </span>
                </div>
              </div>

              <div className="max-w-2xl mx-auto w-full">
                <InteractivePieChartCard
                  title="STATUS PEMBAYARAN & PENAGIHAN"
                  subtitle="Kelompok status (Lunas, Dalam Verifikasi, Belum Terbit Invoice, Kendala)"
                  total={totalWoCount}
                  data={invoicePieData}
                  selectedId={selectedInvoiceStatus}
                  onSelectSlice={(id) => setSelectedInvoiceStatus(id)}
                  centerTitle={`Rp ${(totalNominalLunas / 1000000).toFixed(0)}M`}
                  centerSubtitle="LUNAS TERBAYAR"
                />
              </div>

              {selectedInvoiceStatus && (
                <div className="w-full mt-6 animate-fadeIn">
                  <ProjectDetailCardList
                    title="DETAIL STATUS PENAGIHAN INVOICE"
                    statusName={selectedInvoiceStatus}
                    count={invoiceDetailItems.length}
                    items={invoiceDetailItems}
                    onClose={() => setSelectedInvoiceStatus(null)}
                    onSelectWo={(wo) => handleStatCardClick(`Detail Penagihan ${wo}`, 'penagihan', wo)}
                  />
                </div>
              )}
            </div>
          )}

        </div>
      ) : (
        <div className="animate-fadeIn">
          <DashboardTagihanPage hideHeader />
        </div>
      )}

      {/* Drilldown Filter Modal with Tutup Button */}
      <DetailFilterModal
        filter={drilldownFilter}
        onClose={() => setDrilldownFilter(null)}
      />

      {/* BAST Workflow Modal for Quick Updating Routing */}
      <BASTWorkflowModal
        isOpen={Boolean(dashboardRoutingModalBast)}
        bast={dashboardRoutingModalBast}
        onClose={() => setDashboardRoutingModalBast(null)}
        onSave={handleSaveDashboardWorkflow}
      />

    </div>
  );
};
