import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Eye, 
  FileSpreadsheet,
  Download,
  X,
  FileText
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { 
  DailyReportItem, 
  WOOption, 
  AssignmentArea, 
  TeamCode, 
  StatusWO, 
  StatusTeamProject, 
  PDFFileMeta 
} from '../types';
import { TouchButton } from '../components/TouchButton';
import { PDFUploader } from '../components/PDFUploader';
import { PDFViewerModal } from '../components/PDFViewerModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export const DailyReportPage: React.FC = () => {
  const { 
    dailyReports, 
    addDailyReport, 
    updateDailyReport, 
    deleteDailyReport,
    showToast
  } = useProjectContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWOType, setSelectedWOType] = useState<string>('ALL');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('ALL');
  
  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // PDF Preview Modal
  const [previewPdf, setPreviewPdf] = useState<PDFFileMeta | null>(null);

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; woNumber: string } | null>(null);

  // Form Fields State (19 fields)
  const [formData, setFormData] = useState<Omit<DailyReportItem, 'id' | 'createdAt' | 'updatedAt'>>({
    woType: 'Plan Network Interconection POP',
    monthReleaseWo: new Date().toISOString().substring(0, 7),
    assignment: 'Jabo 1',
    team: 'ABR 03',
    statusWo: 'In Progress',
    pic: '',
    workType: 'Penarikan Core Fiber Optic & Splicing Interkoneksi POP',
    releaseDate: new Date().toISOString().substring(0, 10),
    startDate: new Date().toISOString().substring(0, 10),
    finishDate: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
    durationDays: 7,
    woNumber: 'WO-BEL-2026-0090',
    estimatedDistanceMeters: 1500,
    estimatedDistancePdf: undefined,
    totalDistanceMeters: 1490,
    totalDistancePdf: undefined,
    statusTeamProject: 'On Schedule',
    pathLengthMeters: 1490,
    documentation: {
      fotoClosurePdf: undefined,
      opmPdf: undefined,
      olsPdf: undefined,
      btsPdf: undefined,
      otdrPdf: undefined
    },
    remarks: ''
  });

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      woType: 'Plan Network Interconection POP',
      monthReleaseWo: new Date().toISOString().substring(0, 7),
      assignment: 'Jabo 1',
      team: 'ABR 03',
      statusWo: 'In Progress',
      pic: 'Operator Belacom',
      workType: 'Pencarian Core & Splicing Core FO 24/48',
      releaseDate: new Date().toISOString().substring(0, 10),
      startDate: new Date().toISOString().substring(0, 10),
      finishDate: new Date(Date.now() + 5 * 86400000).toISOString().substring(0, 10),
      durationDays: 5,
      woNumber: `WO-BEL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      estimatedDistanceMeters: 2000,
      estimatedDistancePdf: undefined,
      totalDistanceMeters: 1980,
      totalDistancePdf: undefined,
      statusTeamProject: 'On Schedule',
      pathLengthMeters: 1980,
      documentation: {},
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (report: DailyReportItem) => {
    setEditingId(report.id);
    setFormData({ ...report });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.woNumber.trim() || !formData.pic.trim() || !formData.workType.trim()) {
      showToast('error', 'Validasi Gagal', 'Harap isi seluruh bidang mandatory (No WO, PIC, Work Type)!');
      return;
    }

    if (editingId) {
      updateDailyReport(editingId, formData);
    } else {
      addDailyReport(formData);
    }
    setIsModalOpen(false);
  };

  // Auto calculate duration when start or finish date changes
  const calculateDuration = (start: string, finish: string) => {
    if (!start || !finish) return 1;
    const d1 = new Date(start).getTime();
    const d2 = new Date(finish).getTime();
    const diff = Math.max(1, Math.ceil((d2 - d1) / (1000 * 3600 * 24)));
    return isNaN(diff) ? 1 : diff;
  };

  const handleStartDateChange = (val: string) => {
    const dur = calculateDuration(val, formData.finishDate);
    setFormData(prev => ({ ...prev, startDate: val, durationDays: dur }));
  };

  const handleFinishDateChange = (val: string) => {
    const dur = calculateDuration(formData.startDate, val);
    setFormData(prev => ({ ...prev, finishDate: val, durationDays: dur }));
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteDailyReport(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // Filtered dataset
  const filteredReports = dailyReports.filter(report => {
    const matchesSearch = 
      report.woNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.pic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.workType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.remarks.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWO = selectedWOType === 'ALL' || report.woType === selectedWOType;
    const matchesAssignment = selectedAssignment === 'ALL' || report.assignment === selectedAssignment;

    return matchesSearch && matchesWO && matchesAssignment;
  });

  const exportToCSV = () => {
    const headers = ["ID", "No WO", "WO Type", "Month Release", "Assignment", "Team", "PIC", "Work Type", "Status WO", "Start Date", "Finish Date", "Duration (Days)"];
    const rows = filteredReports.map(r => [
      r.id,
      r.woNumber,
      `"${r.woType}"`,
      r.monthReleaseWo,
      r.assignment,
      r.team,
      `"${r.pic}"`,
      `"${r.workType}"`,
      r.statusWo,
      r.startDate,
      r.finishDate,
      r.durationDays
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Daily_Report_Belacom_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const woOptions: WOOption[] = [
    'Plan Network Interconection POP',
    'Splice Interconnection POP Mini',
    'Splice Interconnection Site',
    'Splice Interconnection POP'
  ];

  const assignmentOptions: AssignmentArea[] = ['Jabo 1', 'Jabo 2', 'Jabo 3'];
  const teamOptions: TeamCode[] = ['ABR 03', 'ABR 04', 'ABR 05', 'ABR 06', 'ABR 07', 'ABR 08', 'ABR 09'];
  const statusWoOptions: StatusWO[] = ['Not Yet', 'In Progress', 'Done'];
  const statusTeamProjectOptions: StatusTeamProject[] = ['Not Yet', 'Waiting Schedule', 'On Schedule'];

  const coreSuggestions = [
    'Pencarian Core Rute Utama POP Interconnection',
    'Penarikan Core Fiber Optic 24 Core & Splicing',
    'Splicing FO Core 48 & Commissioning OTDR Test',
    'Interkoneksi Site BTS ke POP Mini Kabel Feeder',
    'Pengetesan Power Optic OPM & Light Source OLS'
  ];

  return (
    <div className="space-y-6 pb-8">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
            <FileSpreadsheet className="w-4 h-4" /> Manajemen Laporan Harian
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Daily Report Project Belacom</h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <TouchButton
            variant="secondary"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={exportToCSV}
          >
            Export CSV
          </TouchButton>

          <TouchButton
            variant="primary"
            size="md"
            icon={<Plus className="w-5 h-5" />}
            onClick={handleOpenAddModal}
            showFingerIcon
          >
            + Input Daily Report
          </TouchButton>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No. WO, PIC, atau jenis pekerjaan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-3 py-2 outline-none"
          />
        </div>

        <div>
          <select
            value={selectedWOType}
            onChange={(e) => setSelectedWOType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 rounded-xl px-3 py-2 outline-none font-mono"
          >
            <option value="ALL">-- Semua WO Type --</option>
            {woOptions.map(wo => (
              <option key={wo} value={wo}>{wo}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedAssignment}
            onChange={(e) => setSelectedAssignment(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 rounded-xl px-3 py-2 outline-none font-mono"
          >
            <option value="ALL">-- Semua Assignment Area --</option>
            {assignmentOptions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">No. WO & Release</th>
                <th className="py-3.5 px-4 font-semibold">WO Type</th>
                <th className="py-3.5 px-4 font-semibold">Area & Tim</th>
                <th className="py-3.5 px-4 font-semibold">PIC & Pekerjaan</th>
                <th className="py-3.5 px-4 font-semibold">Tanggal & Durasi</th>
                <th className="py-3.5 px-4 font-semibold">Dokumentasi & Jarak PDF</th>
                <th className="py-3.5 px-4 font-semibold text-center">Status WO</th>
                <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredReports.map((report) => {
                const docs = report.documentation;
                return (
                  <tr key={report.id} className="hover:bg-slate-850/60 transition-colors group">
                    
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-cyan-400 font-mono block">{report.woNumber}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Bulan: {report.monthReleaseWo}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-200 block max-w-[180px] truncate" title={report.woType}>
                        {report.woType}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Alur: {report.pathLengthMeters}m</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className="px-2 py-0.5 bg-slate-950 rounded text-cyan-300 border border-slate-800 text-[11px] inline-block mb-1">
                        {report.assignment}
                      </span>
                      <div className="text-[10px] text-slate-400">Tim: <strong className="text-slate-200">{report.team}</strong></div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-white block">{report.pic}</span>
                      <span className="text-[11px] text-slate-400 block max-w-[220px] truncate" title={report.workType}>
                        {report.workType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <span className="block text-slate-300">{report.startDate} s/d {report.finishDate}</span>
                      <span className="text-amber-400 font-bold">{report.durationDays} Hari Kerja</span>
                    </td>

                    {/* Interactive Individual Click-to-View PDF Badges */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {report.estimatedDistancePdf && (
                          <button
                            onClick={() => setPreviewPdf(report.estimatedDistancePdf!)}
                            className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded hover:bg-cyan-500/20 flex items-center gap-1 cursor-pointer"
                            title="Pratinjau PDF Estimasi Jarak"
                          >
                            <Eye className="w-3 h-3 text-cyan-400" /> Est Jarak
                          </button>
                        )}

                        {report.totalDistancePdf && (
                          <button
                            onClick={() => setPreviewPdf(report.totalDistancePdf!)}
                            className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded hover:bg-cyan-500/20 flex items-center gap-1 cursor-pointer"
                            title="Pratinjau PDF Total Jarak"
                          >
                            <Eye className="w-3 h-3 text-cyan-400" /> Tot Jarak
                          </button>
                        )}

                        {docs.fotoClosurePdf && (
                          <button
                            onClick={() => setPreviewPdf(docs.fotoClosurePdf!)}
                            className="px-1.5 py-0.5 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded hover:bg-rose-500/20 flex items-center gap-1 cursor-pointer"
                            title="Pratinjau Closure PDF"
                          >
                            <FileText className="w-3 h-3" /> Closure
                          </button>
                        )}

                        {docs.opmPdf && (
                          <button
                            onClick={() => setPreviewPdf(docs.opmPdf!)}
                            className="px-1.5 py-0.5 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded hover:bg-rose-500/20 flex items-center gap-1 cursor-pointer"
                            title="Pratinjau OPM PDF"
                          >
                            <FileText className="w-3 h-3" /> OPM
                          </button>
                        )}

                        {docs.olsPdf && (
                          <button
                            onClick={() => setPreviewPdf(docs.olsPdf!)}
                            className="px-1.5 py-0.5 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded hover:bg-rose-500/20 flex items-center gap-1 cursor-pointer"
                            title="Pratinjau OLS PDF"
                          >
                            <FileText className="w-3 h-3" /> OLS
                          </button>
                        )}

                        {docs.btsPdf && (
                          <button
                            onClick={() => setPreviewPdf(docs.btsPdf!)}
                            className="px-1.5 py-0.5 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded hover:bg-rose-500/20 flex items-center gap-1 cursor-pointer"
                            title="Pratinjau BTS PDF"
                          >
                            <FileText className="w-3 h-3" /> BTS
                          </button>
                        )}

                        {docs.otdrPdf && (
                          <button
                            onClick={() => setPreviewPdf(docs.otdrPdf!)}
                            className="px-1.5 py-0.5 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded hover:bg-rose-500/20 flex items-center gap-1 cursor-pointer"
                            title="Pratinjau OTDR Trace PDF"
                          >
                            <FileText className="w-3 h-3" /> OTDR
                          </button>
                        )}

                        {!report.estimatedDistancePdf && !report.totalDistancePdf && Object.values(docs).filter(Boolean).length === 0 && (
                          <span className="text-slate-600 text-[10px]">Belum ada PDF</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                        report.statusWo === 'Done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        report.statusWo === 'In Progress' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {report.statusWo}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(report)}
                          className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                          title="Edit Data"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: report.id, woNumber: report.woNumber })}
                          className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                          title="Hapus Data"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-mono text-xs">
                    Tidak ada laporan harian ditemukan. Klik "+ Input Daily Report" untuk membuat laporan baru.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Input / Edit Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                {editingId ? 'Edit Daily Report' : 'Input Daily Report Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
              
              {/* Section 1: Data WO & Penugasan */}
              <div>
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-2 mb-3">
                  1. WO & Penugasan Lapangan
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">1. WO Option</label>
                    <select
                      value={formData.woType}
                      onChange={(e) => setFormData(p => ({ ...p, woType: e.target.value as WOOption }))}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                    >
                      {woOptions.map(wo => (
                        <option key={wo} value={wo}>{wo}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">2. Month Release WO</label>
                    <input
                      type="month"
                      value={formData.monthReleaseWo}
                      onChange={(e) => setFormData(p => ({ ...p, monthReleaseWo: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">12. No. WO (Numeric/String)</label>
                    <input
                      type="text"
                      required
                      value={formData.woNumber}
                      onChange={(e) => setFormData(p => ({ ...p, woNumber: e.target.value }))}
                      placeholder="WO-BEL-2026-XXXX"
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono font-bold text-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">3. Assignment</label>
                    <select
                      value={formData.assignment}
                      onChange={(e) => setFormData(p => ({ ...p, assignment: e.target.value as AssignmentArea }))}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                    >
                      {assignmentOptions.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">4. Team Option</label>
                    <select
                      value={formData.team}
                      onChange={(e) => setFormData(p => ({ ...p, team: e.target.value as TeamCode }))}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                    >
                      {teamOptions.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">6. PIC (Isi Manual)</label>
                    <input
                      type="text"
                      required
                      value={formData.pic}
                      onChange={(e) => setFormData(p => ({ ...p, pic: e.target.value }))}
                      placeholder="Nama PIC Penanggung Jawab"
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Pekerjaan & Jadwal */}
              <div>
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-2 mb-3">
                  2. Jenis Pekerjaan & Timeline
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      7. Work Type (Pencarian Core & Input Manual)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.workType}
                      onChange={(e) => setFormData(p => ({ ...p, workType: e.target.value }))}
                      placeholder="Contoh: Splicing Interconnection Core 24/48..."
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none mb-1.5"
                    />
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      <span className="text-slate-500 py-0.5">Saran pencarian core:</span>
                      {coreSuggestions.map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, workType: sug }))}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded cursor-pointer"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">8. Release Date</label>
                      <input
                        type="date"
                        value={formData.releaseDate}
                        onChange={(e) => setFormData(p => ({ ...p, releaseDate: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">9. Start Date</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">10. Finish Date</label>
                      <input
                        type="date"
                        value={formData.finishDate}
                        onChange={(e) => handleFinishDateChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">11. Durasi (Hari)</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.durationDays}
                        onChange={(e) => setFormData(p => ({ ...p, durationDays: parseInt(e.target.value) || 1 }))}
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-amber-400 font-bold rounded-xl p-2.5 outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Jarak, Status & Parameter */}
              <div>
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-2 mb-3">
                  3. Measurement & Status
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">13. Estimasi Jarak (Meter)</label>
                    <input
                      type="number"
                      value={formData.estimatedDistanceMeters}
                      onChange={(e) => setFormData(p => ({ ...p, estimatedDistanceMeters: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono mb-2"
                    />
                    <PDFUploader
                      label="Upload PDF Estimasi Jarak"
                      value={formData.estimatedDistancePdf}
                      onChange={(file) => setFormData(p => ({ ...p, estimatedDistancePdf: file }))}
                      onPreview={(f) => setPreviewPdf(f)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">14. Total Jarak (Meter)</label>
                    <input
                      type="number"
                      value={formData.totalDistanceMeters}
                      onChange={(e) => setFormData(p => ({ ...p, totalDistanceMeters: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono mb-2"
                    />
                    <PDFUploader
                      label="Upload PDF Total Jarak"
                      value={formData.totalDistancePdf}
                      onChange={(file) => setFormData(p => ({ ...p, totalDistancePdf: file }))}
                      onPreview={(f) => setPreviewPdf(f)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">15. Status Team Project</label>
                    <select
                      value={formData.statusTeamProject}
                      onChange={(e) => setFormData(p => ({ ...p, statusTeamProject: e.target.value as StatusTeamProject }))}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                    >
                      {statusTeamProjectOptions.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">16. Status WO</label>
                    <select
                      value={formData.statusWo}
                      onChange={(e) => setFormData(p => ({ ...p, statusWo: e.target.value as StatusWO }))}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                    >
                      {statusWoOptions.map(sw => (
                        <option key={sw} value={sw}>{sw}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">17. Panjang Alur (Meter)</label>
                    <input
                      type="number"
                      value={formData.pathLengthMeters}
                      onChange={(e) => setFormData(p => ({ ...p, pathLengthMeters: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: 18. Foto Dokumentasi PDF Uploads */}
              <div>
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-2 mb-3">
                  18. Foto Dokumentasi (Upload PDF)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <PDFUploader
                    label="Foto Closure PDF"
                    value={formData.documentation.fotoClosurePdf}
                    onChange={(file) => setFormData(p => ({ ...p, documentation: { ...p.documentation, fotoClosurePdf: file } }))}
                    onPreview={(f) => setPreviewPdf(f)}
                  />
                  <PDFUploader
                    label="OPM PDF"
                    value={formData.documentation.opmPdf}
                    onChange={(file) => setFormData(p => ({ ...p, documentation: { ...p.documentation, opmPdf: file } }))}
                    onPreview={(f) => setPreviewPdf(f)}
                  />
                  <PDFUploader
                    label="OLS PDF"
                    value={formData.documentation.olsPdf}
                    onChange={(file) => setFormData(p => ({ ...p, documentation: { ...p.documentation, olsPdf: file } }))}
                    onPreview={(f) => setPreviewPdf(f)}
                  />
                  <PDFUploader
                    label="BTS PDF"
                    value={formData.documentation.btsPdf}
                    onChange={(file) => setFormData(p => ({ ...p, documentation: { ...p.documentation, btsPdf: file } }))}
                    onPreview={(f) => setPreviewPdf(f)}
                  />
                  <PDFUploader
                    label="OTDR PDF"
                    value={formData.documentation.otdrPdf}
                    onChange={(file) => setFormData(p => ({ ...p, documentation: { ...p.documentation, otdrPdf: file } }))}
                    onPreview={(f) => setPreviewPdf(f)}
                  />
                </div>
              </div>

              {/* Section 5: 19. Remarks */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">19. Remarks / Catatan Lapangan</label>
                <textarea
                  rows={3}
                  value={formData.remarks}
                  onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))}
                  placeholder="Catatan kendala, kondisi rute, atau progres tim..."
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-3 outline-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <TouchButton variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
                  Batal
                </TouchButton>
                <TouchButton variant="primary" size="md" type="submit" showFingerIcon>
                  Simpan Daily Report
                </TouchButton>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      <PDFViewerModal file={previewPdf} onClose={() => setPreviewPdf(null)} />

      {/* Styled Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        title="Konfirmasi Hapus Daily Report"
        itemIdentifier={deleteTarget?.woNumber}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

    </div>
  );
};
