import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Edit3, 
  Trash2, 
  FileText, 
  Search, 
  X,
  Eye,
  GitBranch,
  Send,
  UserCheck,
  FileCheck2,
  DollarSign,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Table,
  LayoutGrid
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { BASTItem, WOOption, StatusBAST, PDFFileMeta, BASTWorkflow } from '../types';
import { TouchButton } from '../components/TouchButton';
import { PDFUploader } from '../components/PDFUploader';
import { MultiPDFUploader } from '../components/MultiPDFUploader';
import { PDFViewerModal } from '../components/PDFViewerModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { BASTWorkflowCardStepper } from '../components/BASTWorkflowCardStepper';
import { BASTWorkflowModal } from '../components/BASTWorkflowModal';
import { DashboardBASTRoutingPanel } from '../components/DashboardBASTRoutingPanel';
import { getFileBadgeStyle } from '../utils/fileHelper';
import { evaluateBASTWorkflow, getDefaultBASTWorkflow, WorkflowFilterTab } from '../utils/bastWorkflowHelper';
import { exportBASTToExcel } from '../utils/excelExportHelper';

export const BASTPage: React.FC = () => {
  const { bastList, addBAST, updateBAST, deleteBAST, showToast, dailyReports } = useProjectContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [workflowTab, setWorkflowTab] = useState<WorkflowFilterTab>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [routingModalBast, setRoutingModalBast] = useState<BASTItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<PDFFileMeta | null>(null);
  const [isWorkflowSectionOpen, setIsWorkflowSectionOpen] = useState(true);

  // Delete Target Modal
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; woNumber: string } | null>(null);
  const [isCustomWoType, setIsCustomWoType] = useState<boolean>(false);

  const [formData, setFormData] = useState<Omit<BASTItem, 'id' | 'createdAt' | 'updatedAt'>>({
    woNumber: 'WO-BEL-2026-0082',
    woType: 'Splice Interconnection POP Mini',
    apdPdf: undefined,
    abdPdf: undefined,
    coreConnectionPdf: undefined,
    workType: 'Splicing FO Core 48 & Commissioning OTDR Test',
    releaseDate: new Date().toISOString().substring(0, 10),
    startDate: new Date().toISOString().substring(0, 10),
    finishDate: new Date(Date.now() + 4 * 86400000).toISOString().substring(0, 10),
    abdDate: new Date(Date.now() + 4 * 86400000).toISOString().substring(0, 10),
    coreConnectionDate: new Date(Date.now() + 3 * 86400000).toISOString().substring(0, 10),
    durationDays: 4,
    durasiDate: 4,
    estimatedDistanceMeters: 1200,
    estimatedDistancePdf: undefined,
    totalDistanceMeters: 1195,
    totalDistancePdf: undefined,
    fotoDokumentasiPdf: undefined, // Max 4MB enforce
    fotoDokumentasiPdfs: [],
    statusBast: 'Submit',
    workflow: getDefaultBASTWorkflow('WO-BEL-2026-0082'),
    notes: ''
  });

  const defaultWOOptions: WOOption[] = [
    'Plan Network Interconection POP',
    'Splice Interconnection POP Mini',
    'Splice Interconnection Site',
    'Splice Interconnection POP'
  ];

  const allWOTypeFilterOptions: string[] = Array.from(
    new Set([...defaultWOOptions, ...bastList.map(b => b.woType), ...dailyReports.map(r => r.woType)].filter(Boolean))
  );
  const woOptions: WOOption[] = allWOTypeFilterOptions;

  const handleSaveWorkflow = (bastId: string, updatedWorkflow: BASTWorkflow) => {
    updateBAST(bastId, { workflow: updatedWorkflow });
    const evaluation = evaluateBASTWorkflow({ id: bastId, workflow: updatedWorkflow } as BASTItem);
    showToast(
      'success',
      'Routing BAST Diperbarui',
      `Alur BAST berhasil diperbarui: ${evaluation.currentStageTitle} (${evaluation.percent}% selesai)`
    );
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setIsCustomWoType(false);
    const today = new Date().toISOString().substring(0, 10);
    const finish = new Date(Date.now() + 5 * 86400000).toISOString().substring(0, 10);
    const generatedWo = `WO-BEL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData({
      woNumber: generatedWo,
      woType: 'Splice Interconnection POP Mini',
      apdPdf: undefined,
      abdPdf: undefined,
      coreConnectionPdf: undefined,
      workType: 'Pencarian Core & Splicing Interkoneksi POP',
      releaseDate: today,
      startDate: today,
      finishDate: finish,
      abdDate: finish,
      coreConnectionDate: finish,
      durationDays: 5,
      durasiDate: 5,
      estimatedDistanceMeters: 1500,
      estimatedDistancePdf: undefined,
      totalDistanceMeters: 1480,
      totalDistancePdf: undefined,
      fotoDokumentasiPdf: undefined,
      fotoDokumentasiPdfs: [],
      statusBast: 'Submit',
      workflow: getDefaultBASTWorkflow(generatedWo),
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: BASTItem) => {
    setEditingId(item.id);
    setIsCustomWoType(!defaultWOOptions.includes(item.woType));
    const initialDocs = item.fotoDokumentasiPdfs && item.fotoDokumentasiPdfs.length > 0
      ? item.fotoDokumentasiPdfs
      : (item.fotoDokumentasiPdf ? [item.fotoDokumentasiPdf] : []);

    setFormData({
      ...item,
      fotoDokumentasiPdf: initialDocs[0] || item.fotoDokumentasiPdf,
      fotoDokumentasiPdfs: initialDocs,
      durasiDate: item.durasiDate ?? item.durationDays,
      abdDate: item.abdDate || item.finishDate || new Date().toISOString().substring(0, 10),
      coreConnectionDate: item.coreConnectionDate || item.finishDate || new Date().toISOString().substring(0, 10),
      workflow: item.workflow || getDefaultBASTWorkflow(item.woNumber)
    });
    setIsModalOpen(true);
  };

  const handleSelectWoNumber = (selectedWo: string) => {
    const matchingDaily = dailyReports.find(d => d.woNumber.toLowerCase() === selectedWo.toLowerCase());
    if (matchingDaily) {
      const syncedDocs: PDFFileMeta[] = [];
      if (matchingDaily.documentation) {
        const { fotoClosurePdf, opmPdf, olsPdf, btsPdf, otdrPdf } = matchingDaily.documentation;
        if (fotoClosurePdf) syncedDocs.push(fotoClosurePdf);
        if (opmPdf) syncedDocs.push(opmPdf);
        if (olsPdf) syncedDocs.push(olsPdf);
        if (btsPdf) syncedDocs.push(btsPdf);
        if (otdrPdf) syncedDocs.push(otdrPdf);
      }

      setFormData(prev => ({
        ...prev,
        woNumber: matchingDaily.woNumber,
        woType: matchingDaily.woType,
        workType: matchingDaily.workType,
        releaseDate: matchingDaily.releaseDate,
        startDate: matchingDaily.startDate,
        finishDate: matchingDaily.finishDate,
        abdDate: matchingDaily.finishDate,
        coreConnectionDate: matchingDaily.finishDate,
        durationDays: matchingDaily.durationDays,
        durasiDate: matchingDaily.durationDays,
        estimatedDistanceMeters: matchingDaily.estimatedDistanceMeters,
        estimatedDistancePdf: matchingDaily.estimatedDistancePdf,
        totalDistanceMeters: matchingDaily.totalDistanceMeters,
        totalDistancePdf: matchingDaily.totalDistancePdf,
        fotoDokumentasiPdf: syncedDocs[0] || matchingDaily.documentation?.fotoClosurePdf || prev.fotoDokumentasiPdf,
        fotoDokumentasiPdfs: syncedDocs.length > 0 ? syncedDocs : prev.fotoDokumentasiPdfs
      }));
      showToast('info', 'Sinkronisasi BAST', `Data Timeline & WO disinkronkan dari Daily Report ${matchingDaily.woNumber}`);
    } else {
      setFormData(prev => ({ ...prev, woNumber: selectedWo }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.woNumber.trim() || !formData.workType.trim()) {
      showToast('error', 'Validasi Gagal', 'Harap isi bidang No WO dan Jenis Pekerjaan!');
      return;
    }

    const payload = {
      ...formData,
      durasiDate: formData.durasiDate ?? formData.durationDays
    };

    if (editingId) {
      updateBAST(editingId, payload);
    } else {
      addBAST(payload);
    }
    setIsModalOpen(false);
  };

  // Auto calculate duration in days (inclusive)
  const calculateDurationDays = (startStr: string, finishStr: string): number => {
    if (!startStr || !finishStr) return 1;
    const start = new Date(startStr);
    const finish = new Date(finishStr);
    if (isNaN(start.getTime()) || isNaN(finish.getTime())) return 1;
    if (finish < start) return 1;
    const diffMs = finish.getTime() - start.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const calculateFinishDate = (startStr: string, durationDays: number): string => {
    if (!startStr) return new Date().toISOString().substring(0, 10);
    const start = new Date(startStr);
    if (isNaN(start.getTime())) return new Date().toISOString().substring(0, 10);
    const validDuration = Math.max(1, durationDays);
    const finish = new Date(start.getTime() + (validDuration - 1) * 24 * 60 * 60 * 1000);
    return finish.toISOString().substring(0, 10);
  };

  const handleReleaseDateChange = (val: string) => {
    setFormData(prev => {
      let newStart = prev.startDate;
      if (!newStart || newStart < val) {
        newStart = val;
      }
      const dur = calculateDurationDays(newStart, prev.finishDate);
      const newFinish = dur < 1 || prev.finishDate < newStart ? calculateFinishDate(newStart, dur) : prev.finishDate;
      const calculatedDur = calculateDurationDays(newStart, newFinish);
      return {
        ...prev,
        releaseDate: val,
        startDate: newStart,
        finishDate: newFinish,
        durationDays: calculatedDur,
        durasiDate: calculatedDur
      };
    });
  };

  const handleStartDateChange = (val: string) => {
    setFormData(prev => {
      let newFinish = prev.finishDate;
      if (!newFinish || newFinish < val) {
        newFinish = calculateFinishDate(val, prev.durationDays || 1);
      }
      const dur = calculateDurationDays(val, newFinish);
      return {
        ...prev,
        startDate: val,
        finishDate: newFinish,
        durationDays: dur,
        durasiDate: dur
      };
    });
  };

  const handleFinishDateChange = (val: string) => {
    setFormData(prev => {
      let newStart = prev.startDate;
      if (!newStart || val < newStart) {
        newStart = val;
      }
      const dur = calculateDurationDays(newStart, val);
      return {
        ...prev,
        startDate: newStart,
        finishDate: val,
        durationDays: dur,
        durasiDate: dur
      };
    });
  };

  const handleDurationChange = (val: number) => {
    const validDur = Math.max(1, val);
    setFormData(prev => {
      const newFinish = calculateFinishDate(prev.startDate, validDur);
      return {
        ...prev,
        durationDays: validDur,
        durasiDate: validDur,
        finishDate: newFinish
      };
    });
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteBAST(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const workflowTabs: { key: WorkflowFilterTab; label: string; count: number }[] = [
    { key: 'ALL', label: 'Semua', count: bastList.length },
    { key: '1. Email User', label: '1. Email User', count: bastList.filter(b => evaluateBASTWorkflow(b).filterTab === '1. Email User').length },
    { key: '2. Admin User', label: '2. Admin User', count: bastList.filter(b => evaluateBASTWorkflow(b).filterTab === '2. Admin User').length },
    { key: '3. Routing TTD', label: '3. Routing TTD', count: bastList.filter(b => evaluateBASTWorkflow(b).filterTab === '3. Routing TTD').length },
    { key: '4. Finance', label: '4. Finance', count: bastList.filter(b => evaluateBASTWorkflow(b).filterTab === '4. Finance').length },
    { key: 'Selesai', label: 'Selesai', count: bastList.filter(b => evaluateBASTWorkflow(b).filterTab === 'Selesai').length },
  ];

  const filteredBast = bastList.filter(b => {
    const matchesSearch = 
      b.woNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.workType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (workflowTab === 'ALL') return true;

    const evaluation = evaluateBASTWorkflow(b);
    return evaluation.filterTab === workflowTab;
  });

  return (
    <div className="space-y-6 pb-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
            <CheckSquare className="w-4 h-4" /> Manajemen Berita Acara Serah Terima
          </div>
          <h2 className="text-xl font-bold text-white mt-1">BAST Belacom</h2>
          <p className="text-xs text-slate-400">Workflow Alur 4 Tahap, Verifikasi Berkas APD, ABD, Core Conn & Daily Report</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <TouchButton
            variant="success"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4" />}
            onClick={() => {
              exportBASTToExcel(filteredBast);
              showToast('success', 'Rekap Excel Diunduh', 'Rekap Excel Semua BAST berhasil diunduh dengan foto visual!');
            }}
          >
            Export Excel Rekap Semua BAST (.xls)
          </TouchButton>

          <TouchButton
            variant="primary"
            size="md"
            icon={<Plus className="w-5 h-5" />}
            onClick={handleOpenAddModal}
            showFingerIcon
          >
            + Input BAST Baru
          </TouchButton>
        </div>
      </div>

      {/* Panel Dashboard Routing BAST */}
      <DashboardBASTRoutingPanel
        onOpenRoutingModal={(bast) => setRoutingModalBast(bast)}
      />

      {/* Search Bar & Workflow Filter Tabs */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari No. WO, deskripsi pekerjaan, catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tampilan Tabel Compact"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Tabel Compact</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tampilan Kartu Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kartu Grid</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Total:</span>
              <span className="font-bold text-cyan-400">{filteredBast.length} BAST</span>
              {workflowTab !== 'ALL' && (
                <button
                  onClick={() => setWorkflowTab('ALL')}
                  className="text-[11px] text-cyan-400 hover:underline ml-1 cursor-pointer"
                >
                  (Reset filter)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Workflow Alur 4-Tahap Filter Tabs */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 shrink-0 mr-1.5">
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" /> Alur BAST:
            </span>
            {workflowTabs.map(tab => {
              const isActive = workflowTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setWorkflowTab(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-sm'
                      : 'bg-slate-950/70 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-cyan-400 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* BAST Data Rendering (Compact Table vs Cards Grid) */}
      {filteredBast.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-300">Tidak ada dokumen BAST yang cocok</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tidak ditemukan data pada tab filter "{workflowTab}" atau dengan kata kunci pencarian "{searchQuery}".
          </p>
          {(workflowTab !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setWorkflowTab('ALL');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono rounded-lg transition-colors cursor-pointer"
            >
              Tampilkan Semua BAST
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* MODE 1: Compact Table Format */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/90 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3 font-semibold">No. BAST & Ref WO</th>
                  <th className="py-2 px-3 font-semibold">Project & Pekerjaan</th>
                  <th className="py-2 px-3 font-semibold">Berkas Lampiran</th>
                  <th className="py-2 px-3 font-semibold">Alur Sub Routing (4-Tahap)</th>
                  <th className="py-2 px-3 font-semibold text-center">Durasi & Tanggal</th>
                  <th className="py-2 px-3 font-semibold text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredBast.map((bast) => {
                  const bastNo = bast.bastNumber || `BAST/${bast.woNumber}/BELACOM/2026`;
                  const evalWf = evaluateBASTWorkflow(bast);

                  return (
                    <tr key={bast.id} className="hover:bg-slate-800/60 transition-colors group">
                      
                      {/* Col 1: No. BAST & Ref WO */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="font-bold text-emerald-400 font-mono block text-xs truncate max-w-[180px]" title={bastNo}>
                          {bastNo}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-mono block">WO: {bast.woNumber}</span>
                      </td>

                      {/* Col 2: Project & Pekerjaan */}
                      <td className="py-2 px-3">
                        <span className="font-medium text-slate-200 block max-w-[240px] truncate text-xs" title={bast.workType}>
                          {bast.workType}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[240px]">
                          {bast.woType}
                        </span>
                      </td>

                      {/* Col 3: Berkas Lengkap */}
                      <td className="py-2 px-3 whitespace-nowrap font-mono">
                        <div className="flex items-center gap-1 text-[10px]">
                          {bast.apdPdf ? (
                            <button
                              onClick={() => setPreviewPdf(bast.apdPdf!)}
                              className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 rounded font-bold transition-colors cursor-pointer"
                              title={`Lihat APD: ${bast.apdPdf.name}`}
                            >
                              APD
                            </button>
                          ) : null}

                          {bast.abdPdf ? (
                            <button
                              onClick={() => setPreviewPdf(bast.abdPdf!)}
                              className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-slate-800 rounded font-bold transition-colors cursor-pointer"
                              title={`Lihat ABD: ${bast.abdPdf.name}`}
                            >
                              ABD
                            </button>
                          ) : null}

                          {bast.coreConnectionPdf ? (
                            <button
                              onClick={() => setPreviewPdf(bast.coreConnectionPdf!)}
                              className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded font-bold transition-colors cursor-pointer"
                              title={`Lihat Core: ${bast.coreConnectionPdf.name}`}
                            >
                              Core
                            </button>
                          ) : null}

                          {(bast.fotoDokumentasiPdf || (bast.fotoDokumentasiPdfs && bast.fotoDokumentasiPdfs.length > 0)) ? (
                            <button
                              onClick={() => setPreviewPdf(bast.fotoDokumentasiPdfs?.[0] || bast.fotoDokumentasiPdf!)}
                              className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 text-purple-300 border border-slate-800 rounded font-bold transition-colors cursor-pointer"
                              title="Lihat Foto Dokumentasi"
                            >
                              Foto
                            </button>
                          ) : null}

                          {!bast.apdPdf && !bast.abdPdf && !bast.coreConnectionPdf && !bast.fotoDokumentasiPdf && (!bast.fotoDokumentasiPdfs || bast.fotoDokumentasiPdfs.length === 0) && (
                            <span className="text-slate-600 text-[10px]">-</span>
                          )}
                        </div>
                      </td>

                      {/* Col 4: Alur Sub Routing (Mini 4-dot stepper) */}
                      <td className="py-2 px-3">
                        <div 
                          onClick={() => setRoutingModalBast(bast)}
                          className="flex items-center gap-2 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 cursor-pointer hover:border-cyan-500/50 transition-all max-w-[210px]"
                          title={`Update Routing BAST: ${evalWf.currentStageTitle} (${evalWf.percent}%)`}
                        >
                          <div className="flex items-center gap-1 shrink-0">
                            <span className={`w-2 h-2 rounded-full ${evalWf.stages[0].isCompleted ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} title="1. Email User" />
                            <span className={`w-2 h-2 rounded-full ${evalWf.stages[1].isCompleted ? 'bg-emerald-400' : evalWf.stages[0].isCompleted ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} title="2. Admin User" />
                            <span className={`w-2 h-2 rounded-full ${evalWf.stages[2].isCompleted ? 'bg-emerald-400' : evalWf.stages[1].isCompleted ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} title="3. Routing TTD" />
                            <span className={`w-2 h-2 rounded-full ${evalWf.stages[3].isCompleted ? 'bg-emerald-400' : evalWf.stages[2].isCompleted ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} title="4. Finance" />
                          </div>
                          <div className="text-[10px] font-mono truncate">
                            <span className="text-slate-200 font-semibold">{evalWf.currentStageTitle}</span>
                            <span className="text-cyan-400 ml-1 font-bold">{evalWf.percent}%</span>
                          </div>
                        </div>
                      </td>

                      {/* Col 5: Durasi & Tanggal */}
                      <td className="py-2 px-3 text-center whitespace-nowrap font-mono">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-0.5">
                          [ {bast.durasiDate ?? bast.durationDays ?? 1} Hari ]
                        </span>
                        <span className="text-[10px] text-slate-400 block">{bast.finishDate || '-'}</span>
                      </td>

                      {/* Col 6: Aksi Cepat */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setRoutingModalBast(bast)}
                            className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 hover:bg-cyan-900 transition-colors cursor-pointer"
                            title="Update Sub Routing Alur BAST"
                          >
                            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              exportBASTToExcel([bast]);
                              showToast('success', 'Excel Unduh', `Rekap Excel BAST WO ${bast.woNumber} berhasil diunduh!`);
                            }}
                            className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900 transition-colors cursor-pointer"
                            title="Export Excel BAST Ini (.xls)"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(bast)}
                            className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                            title="Edit BAST"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ id: bast.id, woNumber: bast.woNumber })}
                            className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                            title="Hapus BAST"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* MODE 2: Cards Grid Format */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBast.map((bast) => (
            <div key={bast.id} className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all group">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div>
                    <span className="text-xs text-slate-500 font-mono block">NO. WO</span>
                    <span className="text-sm font-extrabold text-cyan-400 font-mono">{bast.woNumber}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                    bast.statusBast === 'Done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    bast.statusBast === 'Submitted via Gmail' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                    bast.statusBast === 'Submit' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {bast.statusBast}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-xs font-semibold text-white line-clamp-2">{bast.workType}</p>
                  <p className="text-[11px] text-slate-400 font-mono">Option WO: {bast.woType}</p>
                  
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-[11px] font-mono space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1"><span className="text-xs">📅</span> Release Date:</span>
                      <span className="text-slate-200 font-semibold">{bast.releaseDate || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1"><span className="text-xs">🚀</span> Start Date:</span>
                      <span className="text-slate-200 font-semibold">{bast.startDate || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1"><span className="text-xs">🏁</span> Finish Date:</span>
                      <span className="text-slate-200 font-semibold">{bast.finishDate || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1"><span className="text-xs">📄</span> ABD Date:</span>
                      <span className="text-cyan-300 font-semibold">{bast.abdDate || bast.finishDate || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1"><span className="text-xs">🔌</span> Core Conn Date:</span>
                      <span className="text-cyan-300 font-semibold">{bast.coreConnectionDate || bast.finishDate || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400">Durasi Date:</span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                        [ {bast.durasiDate ?? bast.durationDays ?? 1} Hari ]
                      </span>
                    </div>
                    {bast.totalDistanceMeters ? (
                      <div className="flex items-center justify-between text-slate-400 text-[10px] pt-0.5">
                        <span>Total Jarak:</span>
                        <span className="text-emerald-400 font-semibold">{bast.totalDistanceMeters.toLocaleString('id-ID')} m</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Attachments interactive click-to-view badges */}
                  <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-mono">
                    {bast.apdPdf && (
                      <button 
                        onClick={() => setPreviewPdf(bast.apdPdf!)} 
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-slate-750 flex items-center gap-1 cursor-pointer transition-colors" 
                        title={`Lihat ${bast.apdPdf.name}`}
                      >
                        <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(bast.apdPdf.name).bgClass} ${getFileBadgeStyle(bast.apdPdf.name).textClass}`}>
                          [{getFileBadgeStyle(bast.apdPdf.name).ext}]
                        </span> APD
                      </button>
                    )}
                    {bast.abdPdf && (
                      <button 
                        onClick={() => setPreviewPdf(bast.abdPdf!)} 
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-slate-750 flex items-center gap-1 cursor-pointer transition-colors" 
                        title={`Lihat ${bast.abdPdf.name}`}
                      >
                        <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(bast.abdPdf.name).bgClass} ${getFileBadgeStyle(bast.abdPdf.name).textClass}`}>
                          [{getFileBadgeStyle(bast.abdPdf.name).ext}]
                        </span> ABD
                      </button>
                    )}
                    {bast.coreConnectionPdf && (
                      <button 
                        onClick={() => setPreviewPdf(bast.coreConnectionPdf!)} 
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-slate-750 flex items-center gap-1 cursor-pointer transition-colors" 
                        title={`Lihat ${bast.coreConnectionPdf.name}`}
                      >
                        <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(bast.coreConnectionPdf.name).bgClass} ${getFileBadgeStyle(bast.coreConnectionPdf.name).textClass}`}>
                          [{getFileBadgeStyle(bast.coreConnectionPdf.name).ext}]
                        </span> Core Conn
                      </button>
                    )}
                    {(() => {
                      const docs = (bast.fotoDokumentasiPdfs && bast.fotoDokumentasiPdfs.length > 0)
                        ? bast.fotoDokumentasiPdfs
                        : (bast.fotoDokumentasiPdf ? [bast.fotoDokumentasiPdf] : []);

                      return docs.map((doc, idx) => (
                        <button 
                          key={doc.id || idx}
                          onClick={() => setPreviewPdf(doc)} 
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-slate-750 flex items-center gap-1 cursor-pointer transition-colors" 
                          title={`Lihat ${doc.name}`}
                        >
                          <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(doc.name).bgClass} ${getFileBadgeStyle(doc.name).textClass}`}>
                            [{getFileBadgeStyle(doc.name).ext}]
                          </span> {docs.length > 1 ? `Foto Docs #${idx + 1}` : 'Foto Docs'}
                        </button>
                      ));
                    })()}
                  </div>
                </div>

                {/* 4-Stage Sub Routing Workflow Stepper */}
                <div className="mt-3.5 mb-1">
                  <BASTWorkflowCardStepper
                    bast={bast}
                    onOpenRoutingModal={() => setRoutingModalBast(bast)}
                  />
                </div>
              </div>

              {/* Footer actions */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500 font-mono">{bast.id}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      exportBASTToExcel([bast]);
                      showToast('success', 'Excel Unduh', `Rekap Excel BAST WO ${bast.woNumber} berhasil diunduh!`);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                    title="Export Excel BAST Ini (.xls)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoutingModalBast(bast)}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 hover:bg-cyan-900 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                    title="Update Sub Routing Alur BAST"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Update Routing BAST</span>
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(bast)}
                    className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 hover:bg-cyan-500/20 cursor-pointer"
                    title="Edit BAST"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: bast.id, woNumber: bast.woNumber })}
                    className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                    title="Hapus BAST"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-cyan-400" />
                {editingId ? 'Edit BAST' : 'Input BAST Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">6. WO Option</label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextCustom = !isCustomWoType;
                        setIsCustomWoType(nextCustom);
                        if (nextCustom) {
                          setFormData(p => ({ ...p, woType: p.woType || '' }));
                        } else {
                          const presetWo = defaultWOOptions[0];
                          setFormData(p => ({ ...p, woType: presetWo }));
                        }
                      }}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer font-medium bg-cyan-950/60 hover:bg-cyan-900/60 px-2 py-0.5 rounded-md border border-cyan-800/50 transition-colors"
                    >
                      {isCustomWoType ? '← Pilih Preset' : '+ Input Manual'}
                    </button>
                  </div>
                  {isCustomWoType ? (
                    <input
                      type="text"
                      required
                      placeholder="Ketik WO Option / Kategori WO baru..."
                      value={formData.woType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(p => ({
                          ...p,
                          woType: val as WOOption
                        }));
                      }}
                      className="w-full bg-slate-950 border border-cyan-500/80 text-xs text-cyan-300 font-mono rounded-xl p-2.5 outline-none font-bold focus:ring-1 focus:ring-cyan-500"
                    />
                  ) : (
                    <select
                      value={formData.woType}
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM_MANUAL__') {
                          setIsCustomWoType(true);
                          setFormData(p => ({ ...p, woType: '' }));
                        } else {
                          const val = e.target.value as WOOption;
                          setFormData(p => ({
                            ...p,
                            woType: val
                          }));
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                    >
                      <optgroup label="Preset Standar">
                        {defaultWOOptions.map(wo => (
                          <option key={wo} value={wo}>{wo}</option>
                        ))}
                      </optgroup>
                      {allWOTypeFilterOptions.filter(o => !defaultWOOptions.includes(o)).length > 0 && (
                        <optgroup label="Kustom / Inputan Lainnya">
                          {allWOTypeFilterOptions.filter(o => !defaultWOOptions.includes(o)).map(wo => (
                            <option key={wo} value={wo}>{wo}</option>
                          ))}
                        </optgroup>
                      )}
                      <option value="__CUSTOM_MANUAL__" className="text-cyan-400 font-bold">+ Input Manual (Ketik Sendiri)...</option>
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">No. WO (Nomor Referensi)</label>
                    {dailyReports.length > 0 && (
                      <span className="text-[10px] text-cyan-400 font-mono">
                        ⚡ {dailyReports.length} Daily Report
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.woNumber}
                      onChange={(e) => setFormData(p => ({ ...p, woNumber: e.target.value }))}
                      placeholder="Contoh: WO-BEL-2026-0082"
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-cyan-400 font-bold rounded-xl p-2.5 outline-none font-mono"
                    />
                    {dailyReports.length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleSelectWoNumber(e.target.value);
                          }
                        }}
                        defaultValue=""
                        className="bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono rounded-xl px-2 outline-none max-w-[140px] cursor-pointer"
                        title="Pilih WO dari Daily Report untuk Sinkronisasi Otomatis"
                      >
                        <option value="" disabled>⚡ Sync Daily Report...</option>
                        {dailyReports.map(d => (
                          <option key={d.id} value={d.woNumber}>{d.woNumber}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <PDFUploader
                  label="1. APD Upload File"
                  value={formData.apdPdf}
                  onChange={(f) => setFormData(p => ({ ...p, apdPdf: f }))}
                  onPreview={(f) => setPreviewPdf(f)}
                />
                <PDFUploader
                  label="2. ABD Upload File"
                  value={formData.abdPdf}
                  onChange={(f) => setFormData(p => ({ ...p, abdPdf: f }))}
                  onPreview={(f) => setPreviewPdf(f)}
                />
                <PDFUploader
                  label="3. Core Connection File"
                  value={formData.coreConnectionPdf}
                  onChange={(f) => setFormData(p => ({ ...p, coreConnectionPdf: f }))}
                  onPreview={(f) => setPreviewPdf(f)}
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase font-mono flex items-center justify-between">
                  <span>4. Timeline Pelaksanaan BAST</span>
                  <span className="text-[10px] text-slate-400 font-normal">Kalkulasi Otomatis Selisih Hari Inklusif</span>
                </h4>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Work Type (Deskripsi Pekerjaan Teknis)</label>
                  <input
                    type="text"
                    required
                    value={formData.workType}
                    onChange={(e) => setFormData(p => ({ ...p, workType: e.target.value }))}
                    placeholder="Contoh: Pencarian Core & Splicing Core FO Interkoneksi POP Mini"
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Release Date</label>
                    <input
                      type="date"
                      value={formData.releaseDate}
                      onChange={(e) => handleReleaseDateChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Finish Date</label>
                    <input
                      type="date"
                      value={formData.finishDate}
                      onChange={(e) => handleFinishDateChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">ABD Date (Tanggal ABD)</label>
                    <input
                      type="date"
                      value={formData.abdDate || formData.finishDate}
                      onChange={(e) => setFormData(p => ({ ...p, abdDate: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-cyan-300 rounded-xl p-2 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Core Connection Date</label>
                    <input
                      type="date"
                      value={formData.coreConnectionDate || formData.finishDate}
                      onChange={(e) => setFormData(p => ({ ...p, coreConnectionDate: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-cyan-300 rounded-xl p-2 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">Durasi Date (Hari)</label>
                      <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">
                        ⚡ Otomatis
                      </span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={formData.durationDays}
                      onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-cyan-500/50 text-xs text-amber-400 font-extrabold rounded-xl p-2 outline-none font-mono focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <MultiPDFUploader
                  label="5. Foto Dokumentasi File"
                  values={formData.fotoDokumentasiPdfs}
                  singleValue={formData.fotoDokumentasiPdf}
                  onChange={(files) => setFormData(p => ({
                    ...p,
                    fotoDokumentasiPdfs: files,
                    fotoDokumentasiPdf: files[0]
                  }))}
                  onPreview={(f) => setPreviewPdf(f)}
                  woNumber={formData.woNumber}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Status BAST</label>
                <select
                  value={formData.statusBast}
                  onChange={(e) => setFormData(p => ({ ...p, statusBast: e.target.value as StatusBAST }))}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                >
                  <option value="Not Yet">Not Yet</option>
                  <option value="Submit">Submit</option>
                  <option value="Submitted via Gmail">Submitted via Gmail</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              {/* Sub Routing Workflow Alur BAST Section (4 Tahapan) */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3.5">
                <div 
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setIsWorkflowSectionOpen(!isWorkflowSectionOpen)}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        Sub Routing Workflow BAST
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                          4 Tahapan
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400">1. Email User &rarr; 2. Admin User &rarr; 3. Routing TTD &rarr; 4. Finance</p>
                    </div>
                  </div>
                  <button type="button" className="text-slate-400 hover:text-white p-1">
                    {isWorkflowSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {isWorkflowSectionOpen && (
                  <div className="space-y-3.5 pt-3 border-t border-slate-800/80">
                    
                    {/* Tahap 1: BAST diemail ke User */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
                          <Send className="w-3.5 h-3.5 text-cyan-400" /> Tahap 1: BAST Diemail ke User
                        </span>
                        <select
                          value={formData.workflow?.stage1EmailUser?.status || formData.workflow?.stage1EmailFmi?.status || 'Pending'}
                          onChange={(e) => {
                            const newStatus = e.target.value as 'Pending' | 'Selesai';
                            const isDone = newStatus === 'Selesai';
                            setFormData(prev => {
                              const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                              const curS1 = baseWf.stage1EmailUser || baseWf.stage1EmailFmi || { status: 'Pending' };
                              const updatedS1 = {
                                ...curS1,
                                status: newStatus,
                                isCompleted: isDone,
                                tanggalKirim: isDone && !curS1.tanggalKirim ? new Date().toISOString().substring(0, 10) : curS1.tanggalKirim,
                                emailSentDate: isDone && !curS1.emailSentDate ? new Date().toISOString().substring(0, 10) : curS1.emailSentDate
                              };
                              return {
                                ...prev,
                                workflow: {
                                  ...baseWf,
                                  stage1EmailUser: updatedS1,
                                  stage1EmailFmi: updatedS1
                                }
                              };
                            });
                          }}
                          className="bg-slate-950 border border-slate-750 text-[11px] font-mono text-slate-100 rounded-lg px-2.5 py-1 outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Selesai">Selesai (Terkirim)</option>
                        </select>
                      </div>

                      {/* Checkbox Selesai Tahap 1 */}
                      <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.workflow?.stage1EmailUser?.isCompleted || formData.workflow?.stage1EmailUser?.status === 'Selesai' || formData.workflow?.stage1EmailFmi?.status === 'Sent')}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => {
                              const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                              const curS1 = baseWf.stage1EmailUser || baseWf.stage1EmailFmi || { status: 'Pending' };
                              const updatedS1 = {
                                ...curS1,
                                isCompleted: checked,
                                status: checked ? ('Selesai' as const) : ('Pending' as const),
                                tanggalKirim: checked && !curS1.tanggalKirim ? new Date().toISOString().substring(0, 10) : curS1.tanggalKirim,
                                emailSentDate: checked && !curS1.emailSentDate ? new Date().toISOString().substring(0, 10) : curS1.emailSentDate
                              };
                              return {
                                ...prev,
                                workflow: { ...baseWf, stage1EmailUser: updatedS1, stage1EmailFmi: updatedS1 }
                              };
                            });
                          }}
                          className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-900 cursor-pointer accent-emerald-500"
                        />
                        <span className="text-[11px] font-semibold text-slate-200">
                          Centang jika Tahap 1 selesai (dokumen lengkap sudah diemail ke User)
                        </span>
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Tanggal Kirim Email</label>
                          <input
                            type="date"
                            value={formData.workflow?.stage1EmailUser?.tanggalKirim || formData.workflow?.stage1EmailUser?.emailSentDate || formData.workflow?.stage1EmailFmi?.emailSentDate || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                                const curS1 = baseWf.stage1EmailUser || baseWf.stage1EmailFmi || { status: 'Pending' };
                                const updatedS1 = { ...curS1, tanggalKirim: val, emailSentDate: val };
                                return { ...prev, workflow: { ...baseWf, stage1EmailUser: updatedS1, stage1EmailFmi: updatedS1 } };
                              });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-200 rounded-lg p-1.5 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Nomor / Subjek Email</label>
                          <input
                            type="text"
                            placeholder="Nomor atau subjek email BAST..."
                            value={formData.workflow?.stage1EmailUser?.emailSubject || formData.workflow?.stage1EmailFmi?.emailSubject || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                                const curS1 = baseWf.stage1EmailUser || baseWf.stage1EmailFmi || { status: 'Pending' };
                                const updatedS1 = { ...curS1, emailSubject: val };
                                return { ...prev, workflow: { ...baseWf, stage1EmailUser: updatedS1, stage1EmailFmi: updatedS1 } };
                              });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-[11px] text-slate-200 rounded-lg p-1.5 outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Catatan Ringkas</label>
                          <input
                            type="text"
                            placeholder="Catatan pengiriman email..."
                            value={formData.workflow?.stage1EmailUser?.notes || formData.workflow?.stage1EmailFmi?.notes || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                                const curS1 = baseWf.stage1EmailUser || baseWf.stage1EmailFmi || { status: 'Pending' };
                                const updatedS1 = { ...curS1, notes: val };
                                return { ...prev, workflow: { ...baseWf, stage1EmailUser: updatedS1, stage1EmailFmi: updatedS1 } };
                              });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-[11px] text-slate-200 rounded-lg p-1.5 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tahap 2: Pengecekan admin User */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5 font-mono">
                          <UserCheck className="w-3.5 h-3.5 text-blue-400" /> Tahap 2: Pengecekan Admin User
                        </span>
                        <select
                          value={formData.workflow?.stage2AdminUser?.status || formData.workflow?.stage2AdminFmi?.status || 'Menunggu Pengecekan'}
                          onChange={(e) => {
                            const newStatus = e.target.value as 'Menunggu Pengecekan' | 'Approved' | 'Ada Catatan Revisi';
                            const isDone = newStatus === 'Approved';
                            setFormData(prev => {
                              const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                              const curS2 = baseWf.stage2AdminUser || baseWf.stage2AdminFmi || { status: 'Menunggu Pengecekan' };
                              const updatedS2 = {
                                ...curS2,
                                status: newStatus,
                                isCompleted: isDone,
                                checkedDate: !curS2.checkedDate ? new Date().toISOString().substring(0, 10) : curS2.checkedDate
                              };
                              return {
                                ...prev,
                                workflow: { ...baseWf, stage2AdminUser: updatedS2, stage2AdminFmi: updatedS2 }
                              };
                            });
                          }}
                          className="bg-slate-950 border border-slate-750 text-[11px] font-mono text-slate-100 rounded-lg px-2.5 py-1 outline-none"
                        >
                          <option value="Menunggu Pengecekan">Menunggu Pengecekan</option>
                          <option value="Approved">Approved</option>
                          <option value="Ada Catatan Revisi">Ada Catatan Revisi</option>
                        </select>
                      </div>

                      {/* Checkbox Selesai Tahap 2 */}
                      <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.workflow?.stage2AdminUser?.isCompleted || formData.workflow?.stage2AdminUser?.status === 'Approved' || formData.workflow?.stage2AdminFmi?.status === 'Approved')}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => {
                              const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                              const curS2 = baseWf.stage2AdminUser || baseWf.stage2AdminFmi || { status: 'Menunggu Pengecekan' };
                              const updatedS2 = {
                                ...curS2,
                                isCompleted: checked,
                                status: checked ? ('Approved' as const) : ('Menunggu Pengecekan' as const),
                                checkedDate: checked && !curS2.checkedDate ? new Date().toISOString().substring(0, 10) : curS2.checkedDate
                              };
                              return {
                                ...prev,
                                workflow: { ...baseWf, stage2AdminUser: updatedS2, stage2AdminFmi: updatedS2 }
                              };
                            });
                          }}
                          className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-900 cursor-pointer accent-emerald-500"
                        />
                        <span className="text-[11px] font-semibold text-slate-200">
                          Centang jika Tahap 2 selesai (pengecekan admin User disetujui / Approved)
                        </span>
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Nama Admin User</label>
                          <input
                            type="text"
                            placeholder="Nama admin pemeriksa User..."
                            value={formData.workflow?.stage2AdminUser?.adminName || formData.workflow?.stage2AdminFmi?.adminName || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                                const curS2 = baseWf.stage2AdminUser || baseWf.stage2AdminFmi || { status: 'Menunggu Pengecekan' };
                                const updatedS2 = { ...curS2, adminName: val };
                                return { ...prev, workflow: { ...baseWf, stage2AdminUser: updatedS2, stage2AdminFmi: updatedS2 } };
                              });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-[11px] text-slate-200 rounded-lg p-1.5 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Tanggal Pengecekan</label>
                          <input
                            type="date"
                            value={formData.workflow?.stage2AdminUser?.checkedDate || formData.workflow?.stage2AdminFmi?.checkedDate || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                                const curS2 = baseWf.stage2AdminUser || baseWf.stage2AdminFmi || { status: 'Menunggu Pengecekan' };
                                const updatedS2 = { ...curS2, checkedDate: val };
                                return { ...prev, workflow: { ...baseWf, stage2AdminUser: updatedS2, stage2AdminFmi: updatedS2 } };
                              });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-200 rounded-lg p-1.5 outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Catatan Ringkas / Revisi</label>
                          <input
                            type="text"
                            placeholder="Catatan dari admin User..."
                            value={formData.workflow?.stage2AdminUser?.notes || formData.workflow?.stage2AdminFmi?.notes || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                                const curS2 = baseWf.stage2AdminUser || baseWf.stage2AdminFmi || { status: 'Menunggu Pengecekan' };
                                const updatedS2 = { ...curS2, notes: val };
                                return { ...prev, workflow: { ...baseWf, stage2AdminUser: updatedS2, stage2AdminFmi: updatedS2 } };
                              });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-[11px] text-slate-200 rounded-lg p-1.5 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tahap 3: Routing TTD User */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-mono">
                          <FileCheck2 className="w-3.5 h-3.5 text-amber-400" /> Tahap 3: Proses Routing TTD User
                        </span>
                        <select
                          value={formData.workflow?.stage3RoutingTtd?.status || 'Menunggu TTD'}
                          onChange={(e) => {
                            const newStatus = e.target.value as 'Menunggu TTD' | 'In Progress' | 'Selesai TTD';
                            const isDone = newStatus === 'Selesai TTD';
                            setFormData(prev => {
                              const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                              const curS3 = baseWf.stage3RoutingTtd || { status: 'Menunggu TTD' };
                              const updatedS3 = {
                                ...curS3,
                                status: newStatus,
                                isCompleted: isDone,
                                signedDate: isDone && !curS3.signedDate ? new Date().toISOString().substring(0, 10) : curS3.signedDate
                              };
                              return { ...prev, workflow: { ...baseWf, stage3RoutingTtd: updatedS3 } };
                            });
                          }}
                          className="bg-slate-950 border border-slate-750 text-[11px] font-mono text-slate-100 rounded-lg px-2.5 py-1 outline-none"
                        >
                          <option value="Menunggu TTD">Menunggu TTD</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Selesai TTD">Selesai TTD</option>
                        </select>
                      </div>

                      {/* Checkbox Selesai Tahap 3 */}
                      <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.workflow?.stage3RoutingTtd?.isCompleted || formData.workflow?.stage3RoutingTtd?.status === 'Selesai TTD')}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => {
                              const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                              const curS3 = baseWf.stage3RoutingTtd || { status: 'Menunggu TTD' };
                              const updatedS3 = {
                                ...curS3,
                                isCompleted: checked,
                                status: checked ? ('Selesai TTD' as const) : ('In Progress' as const),
                                signedDate: checked && !curS3.signedDate ? new Date().toISOString().substring(0, 10) : curS3.signedDate
                              };
                              return { ...prev, workflow: { ...baseWf, stage3RoutingTtd: updatedS3 } };
                            });
                          }}
                          className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-900 cursor-pointer accent-emerald-500"
                        />
                        <span className="text-[11px] font-semibold text-slate-200">
                          Centang jika Tahap 3 selesai (tanda tangan approver User lengkap)
                        </span>
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Nama Approver User</label>
                          <input
                            type="text"
                            placeholder="Contoh: Pak Budi (PM) / Bu Sarah..."
                            value={formData.workflow?.stage3RoutingTtd?.approverNames || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                                const curS3 = baseWf.stage3RoutingTtd || { status: 'Menunggu TTD' };
                                const updatedS3 = { ...curS3, approverNames: val };
                                return { ...prev, workflow: { ...baseWf, stage3RoutingTtd: updatedS3 } };
                              });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-[11px] text-slate-200 rounded-lg p-1.5 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Tanggal TTD Selesai</label>
                          <input
                            type="date"
                            value={formData.workflow?.stage3RoutingTtd?.signedDate || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                                const curS3 = baseWf.stage3RoutingTtd || { status: 'Menunggu TTD' };
                                const updatedS3 = { ...curS3, signedDate: val };
                                return { ...prev, workflow: { ...baseWf, stage3RoutingTtd: updatedS3 } };
                              });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-200 rounded-lg p-1.5 outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Catatan Ringkas</label>
                          <input
                            type="text"
                            placeholder="Catatan proses tanda tangan..."
                            value={formData.workflow?.stage3RoutingTtd?.notes || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                                const curS3 = baseWf.stage3RoutingTtd || { status: 'Menunggu TTD' };
                                const updatedS3 = { ...curS3, notes: val };
                                return { ...prev, workflow: { ...baseWf, stage3RoutingTtd: updatedS3 } };
                              });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-[11px] text-slate-200 rounded-lg p-1.5 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tahap 4: Masuk ke Finance */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 font-mono">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Tahap 4: Masuk ke Finance
                        </span>
                        <select
                          value={formData.workflow?.stage4Finance?.status || 'Menunggu Finance'}
                          onChange={(e) => {
                            const newStatus = e.target.value as 'Menunggu Finance' | 'Diterima Finance' | 'Siap Invoice';
                            const isDone = newStatus === 'Siap Invoice';
                            setFormData(prev => {
                              const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                              const curS4 = baseWf.stage4Finance || { status: 'Menunggu Finance' };
                              const updatedS4 = {
                                ...curS4,
                                status: newStatus,
                                isCompleted: isDone,
                                receivedDate: !curS4.receivedDate ? new Date().toISOString().substring(0, 10) : curS4.receivedDate,
                                tanggalMasukFinance: !curS4.tanggalMasukFinance ? new Date().toISOString().substring(0, 10) : curS4.tanggalMasukFinance
                              };
                              return { ...prev, workflow: { ...baseWf, stage4Finance: updatedS4 } };
                            });
                          }}
                          className="bg-slate-950 border border-slate-750 text-[11px] font-mono text-slate-100 rounded-lg px-2.5 py-1 outline-none"
                        >
                          <option value="Menunggu Finance">Menunggu Finance</option>
                          <option value="Diterima Finance">Diterima Finance</option>
                          <option value="Siap Invoice">Siap Invoice</option>
                        </select>
                      </div>

                      {/* Checkbox Selesai Tahap 4 */}
                      <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.workflow?.stage4Finance?.isCompleted || formData.workflow?.stage4Finance?.status === 'Siap Invoice')}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => {
                              const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                              const curS4 = baseWf.stage4Finance || { status: 'Menunggu Finance' };
                              const updatedS4 = {
                                ...curS4,
                                isCompleted: checked,
                                status: checked ? ('Siap Invoice' as const) : ('Diterima Finance' as const),
                                receivedDate: checked && !curS4.receivedDate ? new Date().toISOString().substring(0, 10) : curS4.receivedDate,
                                tanggalMasukFinance: checked && !curS4.tanggalMasukFinance ? new Date().toISOString().substring(0, 10) : curS4.tanggalMasukFinance
                              };
                              return { ...prev, workflow: { ...baseWf, stage4Finance: updatedS4 } };
                            });
                          }}
                          className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-900 cursor-pointer accent-emerald-500"
                        />
                        <span className="text-[11px] font-semibold text-slate-200">
                          Centang jika Tahap 4 selesai (diterima finance &amp; siap dibuatkan invoice)
                        </span>
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Tanggal Masuk Finance</label>
                          <input
                            type="date"
                            value={formData.workflow?.stage4Finance?.tanggalMasukFinance || formData.workflow?.stage4Finance?.receivedDate || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                                const curS4 = baseWf.stage4Finance || { status: 'Menunggu Finance' };
                                const updatedS4 = { ...curS4, tanggalMasukFinance: val, receivedDate: val };
                                return { ...prev, workflow: { ...baseWf, stage4Finance: updatedS4 } };
                              });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-200 rounded-lg p-1.5 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Nomor Referensi Finance</label>
                          <input
                            type="text"
                            placeholder="Contoh: FIN-USR-2026-088"
                            value={formData.workflow?.stage4Finance?.financeRefNumber || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                                const curS4 = baseWf.stage4Finance || { status: 'Menunggu Finance' };
                                const updatedS4 = { ...curS4, financeRefNumber: val };
                                return { ...prev, workflow: { ...baseWf, stage4Finance: updatedS4 } };
                              });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-[11px] text-slate-200 rounded-lg p-1.5 outline-none font-mono"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Catatan Ringkas Finance</label>
                          <input
                            type="text"
                            placeholder="Catatan dari finance..."
                            value={formData.workflow?.stage4Finance?.notes || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const baseWf = prev.workflow || getDefaultBASTWorkflow(prev.woNumber);
                                const curS4 = baseWf.stage4Finance || { status: 'Menunggu Finance' };
                                const updatedS4 = { ...curS4, notes: val };
                                return { ...prev, workflow: { ...baseWf, stage4Finance: updatedS4 } };
                              });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-[11px] text-slate-200 rounded-lg p-1.5 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  {editingId && (
                    <TouchButton
                      variant="success"
                      size="md"
                      type="button"
                      icon={<FileSpreadsheet className="w-4 h-4" />}
                      onClick={() => {
                        const currentItem = bastList.find(b => b.id === editingId);
                        if (currentItem) {
                          exportBASTToExcel([currentItem]);
                          showToast('success', 'Excel Unduh', `Rekap Excel BAST WO ${currentItem.woNumber} berhasil diunduh!`);
                        }
                      }}
                    >
                      Export Excel BAST Ini (.xls)
                    </TouchButton>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <TouchButton variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </TouchButton>
                  <TouchButton variant="primary" size="md" type="submit" showFingerIcon>
                    Simpan Dokumen BAST
                  </TouchButton>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Quick Sub Routing Workflow Modal */}
      <BASTWorkflowModal
        isOpen={routingModalBast !== null}
        bast={routingModalBast}
        onClose={() => setRoutingModalBast(null)}
        onSave={handleSaveWorkflow}
      />

      {/* PDF Viewer */}
      <PDFViewerModal 
        file={previewPdf} 
        onClose={() => setPreviewPdf(null)} 
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        title="Konfirmasi Hapus Dokumen BAST"
        itemIdentifier={deleteTarget?.woNumber}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

    </div>
  );
};
