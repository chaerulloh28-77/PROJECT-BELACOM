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
  FileText,
  MapPin,
  Navigation,
  ExternalLink
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { 
  DailyReportItem, 
  WOOption, 
  AssignmentArea, 
  TeamCode, 
  StatusWO, 
  StatusTeamProject, 
  PDFFileMeta,
  PendingLogEntry,
  DateScheduleEntry
} from '../types';
import { TouchButton } from '../components/TouchButton';
import { PDFUploader } from '../components/PDFUploader';
import { PDFViewerModal } from '../components/PDFViewerModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { TaggingLocationSection } from '../components/TaggingLocationSection';
import { CalendarDatePickerModal } from '../components/CalendarDatePickerModal';
import { DateBadgeHelper } from '../components/DateBadgeHelper';
import { DurationBreakdownBadge } from '../components/DurationBreakdownBadge';
import { getFileBadgeStyle } from '../utils/fileHelper';
import { exportDailyReportToExcel } from '../utils/excelExportHelper';
import { calculateWorkDays, addWorkDays, handleDateInputClick, getTotalDurationDays } from '../utils/dateUtils';

export const getGoogleMapsRouteUrl = (
  origCoord?: string,
  origLoc?: string,
  destCoord?: string,
  destLoc?: string
): string | null => {
  const orig = origCoord?.trim() || origLoc?.trim();
  const dest = destCoord?.trim() || destLoc?.trim();
  if (!orig || !dest) return null;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(orig)}&destination=${encodeURIComponent(dest)}`;
};

export const getDefaultWorkTypeForWoOption = (woOption: string): string => {
  if (!woOption || !woOption.trim()) {
    return 'Pencarian Core, Penarikan Kabel FO & Splicing Lapangan';
  }
  const clean = woOption.trim();
  switch (clean) {
    case 'Plan Network Interconection POP':
      return 'Planning & Installation Network Interconnection Fiber Core POP';
    case 'Splice Interconnection POP Mini':
      return 'Pencarian Core & Splicing Core FO Interkoneksi POP Mini';
    case 'Splice Interconnection Site':
      return 'Interkoneksi Site BTS ke POP Mini dengan Kabel Feeder';
    case 'Splice Interconnection POP':
      return 'Pencarian Core Rute Utama & Joint Closure Splicing';
    default:
      return 'Pencarian Core, Penarikan Kabel FO & Splicing Lapangan';
  }
};

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
  const [selectedStatusWo, setSelectedStatusWo] = useState<string>('ALL');
  
  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCustomWoType, setIsCustomWoType] = useState<boolean>(false);

  // PDF Preview Modal
  const [previewPdf, setPreviewPdf] = useState<PDFFileMeta | null>(null);

  // Detail / Summary Preview Modal State
  const [detailPreviewReport, setDetailPreviewReport] = useState<DailyReportItem | null>(null);

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; woNumber: string } | null>(null);

  // Calendar Picker Modal State
  const [calendarConfig, setCalendarConfig] = useState<{
    isOpen: boolean;
    title: string;
    initialDate?: string;
    onSelect: (dateStr: string) => void;
  }>({
    isOpen: false,
    title: '',
    onSelect: () => {}
  });

  const openCalendarFor = (title: string, initialDate: string | undefined, onSelect: (val: string) => void) => {
    setCalendarConfig({
      isOpen: true,
      title,
      initialDate,
      onSelect
    });
  };

  // Form Fields State
  const [formData, setFormData] = useState<Omit<DailyReportItem, 'id' | 'createdAt' | 'updatedAt'>>({
    woType: 'Plan Network Interconection POP',
    monthReleaseWo: new Date().toISOString().substring(0, 7),
    assignment: 'Jabo 1',
    team: 'ABR 03',
    statusWo: 'In Progress',
    pic: '',
    workType: '',
    releaseDate: new Date().toISOString().substring(0, 10),
    startDate: new Date().toISOString().substring(0, 10),
    finishDate: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
    durationDays: 7,
    woNumber: 'WO-BEL-2026-0090',
    estimatedDistanceMeters: 1500,
    totalDistanceMeters: 1490,
    statusTeamProject: 'On Schedule',
    pathLengthMeters: 1490,
    documentation: {
      fotoClosurePdf: undefined,
      opmPdf: undefined,
      olsPdf: undefined,
      btsPdf: undefined,
      otdrPdf: undefined
    },
    remarks: '',
    pendingLogs: [],
    originLocation: '',
    originCoordinates: '',
    originPhotoFile: undefined,
    originTaggingDocFile: undefined,
    destinationLocation: '',
    destinationCoordinates: '',
    destinationPhotoFile: undefined,
    destinationTaggingDocFile: undefined,
    routeMapFile: undefined,
    routeGmapsUrl: ''
  });

  const defaultWOOptions: WOOption[] = [
    'Plan Network Interconection POP',
    'Splice Interconnection POP Mini',
    'Splice Interconnection Site',
    'Splice Interconnection POP'
  ];

  const handleGetBrowserLocation = (type: 'origin' | 'destination') => {
    showToast(
      'success',
      'Koordinat GPS Terisi',
      `Koordinat ${type === 'origin' ? 'Titik Awal (Site A)' : 'Titik Akhir (Site B)'} berhasil diperbarui.`
    );
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setIsCustomWoType(false);
    const initialWo = 'Plan Network Interconection POP';
    const relDate = new Date().toISOString().substring(0, 10);
    const stDate = relDate;
    const initialTargetWorkDays = 5;
    const fnDate = addWorkDays(stDate, initialTargetWorkDays);
    const calculatedDur = calculateWorkDays(stDate, fnDate);

    setFormData({
      woType: initialWo,
      monthReleaseWo: new Date().toISOString().substring(0, 7),
      assignment: 'Jabo 1',
      team: 'ABR 03',
      statusWo: 'In Progress',
      pic: 'Operator Belacom',
      workType: '',
      releaseDate: relDate,
      startDate: stDate,
      finishDate: fnDate,
      durationDays: calculatedDur,
      woNumber: `WO-BEL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      estimatedDistanceMeters: 2000,
      totalDistanceMeters: 1980,
      statusTeamProject: 'On Schedule',
      pathLengthMeters: 1980,
      documentation: {},
      remarks: '',
      pendingLogs: [],
      originLocation: '',
      originCoordinates: '',
      originPhotoFile: undefined,
      originTaggingDocFile: undefined,
      destinationLocation: '',
      destinationCoordinates: '',
      destinationPhotoFile: undefined,
      destinationTaggingDocFile: undefined,
      routeMapFile: undefined,
      routeGmapsUrl: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (report: DailyReportItem) => {
    setEditingId(report.id);
    setIsCustomWoType(!defaultWOOptions.includes(report.woType));
    const calculatedDur = calculateWorkDays(report.startDate, report.finishDate) || report.durationDays || 1;
    setFormData({
      ...report,
      durationDays: calculatedDur,
      pendingLogs: report.pendingLogs || [],
      originLocation: report.originLocation || '',
      originCoordinates: report.originCoordinates || '',
      originPhotoFile: report.originPhotoFile,
      originTaggingDocFile: report.originTaggingDocFile,
      destinationLocation: report.destinationLocation || '',
      destinationCoordinates: report.destinationCoordinates || '',
      destinationPhotoFile: report.destinationPhotoFile,
      destinationTaggingDocFile: report.destinationTaggingDocFile,
      routeMapFile: report.routeMapFile,
      routeGmapsUrl: report.routeGmapsUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.woNumber.trim() || !formData.pic.trim() || !formData.workType.trim()) {
      showToast('error', 'Validasi Gagal', 'Harap isi seluruh bidang mandatory (No WO, PIC, Work Type)!');
      return;
    }

    const calculatedRouteUrl = getGoogleMapsRouteUrl(
      formData.originCoordinates,
      formData.originLocation,
      formData.destinationCoordinates,
      formData.destinationLocation
    ) || formData.routeGmapsUrl || '';

    const payload = {
      ...formData,
      routeGmapsUrl: calculatedRouteUrl
    };

    if (editingId) {
      updateDailyReport(editingId, payload);
    } else {
      addDailyReport(payload);
    }
    setIsModalOpen(false);
  };

  // Auto calculate duration in active work days (excluding Sundays & Indonesian holidays)
  const calculateDurationDays = (startStr: string, finishStr: string): number => {
    return calculateWorkDays(startStr, finishStr);
  };

  // Auto calculate finish date given start date and duration in work days
  const calculateFinishDate = (startStr: string, durationDays: number): string => {
    return addWorkDays(startStr, durationDays);
  };

  const handleReleaseDateChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      releaseDate: val
    }));
  };

  const handleStartDateChange = (val: string) => {
    setFormData(prev => {
      if (!val) {
        return { ...prev, startDate: '' };
      }
      const finish = prev.finishDate;
      const dur = finish ? (calculateWorkDays(val, finish) || prev.durationDays || 1) : (prev.durationDays || 1);
      return {
        ...prev,
        startDate: val,
        finishDate: finish,
        durationDays: dur
      };
    });
  };

  const handleFinishDateChange = (val: string) => {
    setFormData(prev => {
      if (!val) {
        return { ...prev, finishDate: '' };
      }
      const start = prev.startDate;
      const dur = start ? (calculateWorkDays(start, val) || prev.durationDays || 1) : (prev.durationDays || 1);
      return {
        ...prev,
        finishDate: val,
        durationDays: dur
      };
    });
  };

  const handleDurationChange = (val: number) => {
    const validDur = Math.max(1, val);
    setFormData(prev => {
      const stDate = prev.startDate || prev.releaseDate || new Date().toISOString().substring(0, 10);
      const newFinish = addWorkDays(stDate, validDur);
      return {
        ...prev,
        startDate: stDate,
        durationDays: validDur,
        finishDate: newFinish
      };
    });
  };

  const handleAddScheduleRow = () => {
    setFormData(prev => {
      const curRows = prev.additionalSchedules || [];
      const lastFinish = curRows.length > 0
        ? curRows[curRows.length - 1].finishDate
        : (prev.finishDate || prev.releaseDate || new Date().toISOString().substring(0, 10));
      const newStart = lastFinish || new Date().toISOString().substring(0, 10);
      const defaultDur = 1;
      const newFinish = addWorkDays(newStart, defaultDur);
      const newRow: DateScheduleEntry = {
        id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        startDate: newStart,
        finishDate: newFinish,
        durationDays: defaultDur
      };
      return {
        ...prev,
        additionalSchedules: [...curRows, newRow]
      };
    });
  };

  const handleRemoveScheduleRow = (id: string) => {
    setFormData(prev => ({
      ...prev,
      additionalSchedules: (prev.additionalSchedules || []).filter(r => r.id !== id)
    }));
  };

  const handleRowDateChange = (id: string, field: 'startDate' | 'finishDate', val: string) => {
    setFormData(prev => {
      const updated = (prev.additionalSchedules || []).map(row => {
        if (row.id !== id) return row;
        if (!val) {
          return { ...row, [field]: '' };
        }
        if (field === 'startDate') {
          const finish = row.finishDate;
          const dur = finish ? (calculateWorkDays(val, finish) || row.durationDays || 1) : (row.durationDays || 1);
          return { ...row, startDate: val, finishDate: finish, durationDays: dur };
        } else {
          const start = row.startDate;
          const dur = start ? (calculateWorkDays(start, val) || row.durationDays || 1) : (row.durationDays || 1);
          return { ...row, finishDate: val, durationDays: dur };
        }
      });
      return { ...prev, additionalSchedules: updated };
    });
  };

  const handleRowDurationChange = (id: string, dur: number) => {
    const safeDur = Math.max(1, dur);
    setFormData(prev => {
      const updated = (prev.additionalSchedules || []).map(row => {
        if (row.id !== id) return row;
        const st = row.startDate || prev.startDate || new Date().toISOString().substring(0, 10);
        const newFinish = addWorkDays(st, safeDur);
        return { ...row, durationDays: safeDur, finishDate: newFinish };
      });
      return { ...prev, additionalSchedules: updated };
    });
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteDailyReport(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleStatusWoChange = (newStatus: StatusWO) => {
    setFormData(prev => ({
      ...prev,
      statusWo: newStatus
    }));
  };

  // Filtered dataset
  const filteredReports = dailyReports.filter(report => {
    const matchesSearch = 
      report.woNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.pic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.workType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.originLocation && report.originLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (report.destinationLocation && report.destinationLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      report.remarks.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWO = selectedWOType === 'ALL' || report.woType === selectedWOType;
    const matchesAssignment = selectedAssignment === 'ALL' || report.assignment === selectedAssignment;
    const matchesStatusWo = selectedStatusWo === 'ALL' || report.statusWo === selectedStatusWo;

    return matchesSearch && matchesWO && matchesAssignment && matchesStatusWo;
  });

  const exportToCSV = () => {
    const headers = ["ID", "No WO", "WO Type", "Month Release", "Assignment", "Team", "PIC", "Work Type", "Titik Awal (Origin)", "Koordinat Origin", "Titik Akhir (Destination)", "Koordinat Destination", "Google Maps Route URL", "Status WO", "Start Date", "Finish Date", "Duration (Days)"];
    const rows = filteredReports.map(r => [
      r.id,
      r.woNumber,
      `"${r.woType}"`,
      r.monthReleaseWo,
      r.assignment,
      r.team,
      `"${r.pic}"`,
      `"${r.workType}"`,
      `"${r.originLocation || ''}"`,
      `"${r.originCoordinates || ''}"`,
      `"${r.destinationLocation || ''}"`,
      `"${r.destinationCoordinates || ''}"`,
      `"${r.routeGmapsUrl || getGoogleMapsRouteUrl(r.originCoordinates, r.originLocation, r.destinationCoordinates, r.destinationLocation) || ''}"`,
      r.statusWo,
      r.startDate,
      r.finishDate,
      calculateWorkDays(r.startDate, r.finishDate) || r.durationDays || 1
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

  const allWOTypeFilterOptions: string[] = Array.from(
    new Set([...defaultWOOptions, ...dailyReports.map(r => r.woType).filter(Boolean)])
  );
  const woOptions: WOOption[] = allWOTypeFilterOptions;

  const assignmentOptions: AssignmentArea[] = ['Jabo 1', 'Jabo 2', 'Jabo 3'];
  const teamOptions: TeamCode[] = ['ABR 01', 'ABR 02', 'ABR 03', 'ABR 04', 'ABR 05', 'ABR 06', 'ABR 07', 'ABR 08', 'ABR 09', 'ABR 10'];
  const statusWoOptions: StatusWO[] = ['Not Yet', 'In Progress', 'Done', 'Cancel', 'Pending'];
  const statusTeamProjectOptions: StatusTeamProject[] = ['Not Yet', 'Waiting Schedule', 'On Schedule'];

  return (
    <div className="space-y-6 pb-8">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
            <FileSpreadsheet className="w-4 h-4" /> Manajemen Laporan Harian
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Daily Report Belacom Project</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <TouchButton
            variant="success"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4" />}
            onClick={async () => {
              try {
                showToast('info', 'Menyiapkan Excel', 'Menyusun rekap Excel Daily Report...');
                await exportDailyReportToExcel(filteredReports);
                showToast('success', 'Excel Unduh', 'Rekap Excel Semua WO berhasil diunduh dalam format .xlsx dengan gambar visual!');
              } catch (err) {
                console.error('Daily report excel export error:', err);
                showToast('error', 'Gagal Ekspor', 'Terjadi kendala saat menyusun berkas Excel.');
              }
            }}
          >
            Export Excel Rekap Semua WO (.xlsx)
          </TouchButton>

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
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

        <div>
          <select
            value={selectedStatusWo}
            onChange={(e) => setSelectedStatusWo(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 rounded-xl px-3 py-2 outline-none font-mono"
          >
            <option value="ALL">-- Semua Status WO --</option>
            {statusWoOptions.map(sw => (
              <option key={sw} value={sw}>{sw}</option>
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
                <th className="py-2 px-3 font-semibold">No. WO & Tanggal</th>
                <th className="py-2 px-3 font-semibold">Pekerjaan & Rute</th>
                <th className="py-2 px-3 font-semibold">Tim & Area</th>
                <th className="py-2 px-3 font-semibold text-center">Durasi</th>
                <th className="py-2 px-3 font-semibold text-center">Status</th>
                <th className="py-2 px-3 font-semibold text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredReports.map((report) => {
                return (
                  <tr key={report.id} className="hover:bg-slate-800/60 transition-colors group">
                    
                    {/* Col 1: No. WO & Tanggal */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="font-bold text-cyan-400 font-mono block text-xs">{report.woNumber}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">Rilis: {report.releaseDate || '-'}</span>
                    </td>

                    {/* Col 2: Pekerjaan & Rute */}
                    <td className="py-2 px-3">
                      <span className="font-medium text-slate-200 block max-w-[240px] truncate text-xs" title={report.workType}>
                        {report.workType || report.woType}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 max-w-[240px] truncate" title={`${report.originLocation || 'Site A'} ➔ ${report.destinationLocation || 'Site B'}`}>
                        <span className="font-mono text-cyan-300/80">{report.woType}</span>
                        {report.originLocation && (
                          <>
                            <span>•</span>
                            <span className="truncate">{report.originLocation} ➔ {report.destinationLocation || 'Akhir'}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Col 3: Tim & Area */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="px-1.5 py-0.5 bg-slate-950 rounded text-cyan-300 border border-slate-800 text-[10px] font-bold">
                          {report.assignment}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">{report.team}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-mono">PIC: {report.pic || '-'}</span>
                    </td>

                    {/* Col 4: Durasi */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {getTotalDurationDays(report)} Hari
                      </span>
                    </td>

                    {/* Col 5: Status */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        report.statusWo === 'Done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        report.statusWo === 'In Progress' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        report.statusWo === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        report.statusWo === 'Cancel' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {report.statusWo}
                      </span>
                    </td>

                    {/* Col 6: Aksi */}
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailPreviewReport(report)}
                          className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                          title="Lihat Detail & Pratinjau Daily Report"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            exportDailyReportToExcel([report]);
                            showToast('success', 'Excel Unduh', `Rekap Excel WO ${report.woNumber} berhasil diunduh!`);
                          }}
                          className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-800/60 transition-colors cursor-pointer"
                          title="Export Excel WO Ini (.xls)"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </button>
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">1. WO Option</label>
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
                    <label className="text-xs font-semibold text-slate-300 block mb-1">4. Team</label>
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
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        7. Work Type (Text Area Deskripsi Pekerjaan)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const autoType = getDefaultWorkTypeForWoOption(formData.woType);
                          setFormData(p => ({ ...p, workType: autoType }));
                        }}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer font-medium bg-cyan-950/60 hover:bg-cyan-900/60 px-2 py-0.5 rounded-md border border-cyan-800/50 transition-colors"
                        title="Isi ulang otomatis berdasarkan WO Option"
                      >
                        ⚡ Isi Ulang Otomatis dari WO
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      required
                      value={formData.workType}
                      onChange={(e) => setFormData(p => ({ ...p, workType: e.target.value }))}
                      placeholder="Ketik deskripsi jenis pekerjaan / Work Type secara manual..."
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-3 outline-none resize-y focus:border-cyan-500 font-mono focus:ring-1 focus:ring-cyan-500 transition-all mb-1"
                    />
                  </div>

                  {/* Multi-Row Schedule Layout: Release Date Single + Stacked Start/Finish/Duration */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
                    {/* Left Column: 8. Release Date (Tetap Tunggal) */}
                    <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-slate-800 pb-3 lg:pb-0 lg:pr-3 space-y-2">
                      <label className="text-xs font-semibold text-slate-300 block">8. Release Date</label>
                      <input
                        type="date"
                        value={formData.releaseDate}
                        onChange={(e) => handleReleaseDateChange(e.target.value)}
                        onClick={handleDateInputClick}
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500 cursor-pointer"
                      />
                    </div>

                    {/* Right Panel: Multi-Row Start Date, Finish Date, Durasi (Hari) */}
                    <div className="lg:col-span-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                          <span>📅</span>
                          <span>TANGGAL &amp; DURASI PEKERJAAN (MULTI-BARIS)</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleAddScheduleRow}
                          className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Tambah Tanggal &amp; Durasi</span>
                        </button>
                      </div>

                      {/* Baris 1 (Primary Entry Card) */}
                      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                          <div className="sm:col-span-4">
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                              9. Start Date <span className="text-[10px] text-amber-400 font-mono font-bold">(Baris 1)</span>
                            </label>
                            <input
                              type="date"
                              value={formData.startDate}
                              onChange={(e) => handleStartDateChange(e.target.value)}
                              onClick={handleDateInputClick}
                              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500 cursor-pointer"
                            />
                          </div>
                          <div className="sm:col-span-4">
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                              10. Finish Date <span className="text-[10px] text-amber-400 font-mono font-bold">(Baris 1)</span>
                            </label>
                            <input
                              type="date"
                              value={formData.finishDate}
                              onChange={(e) => handleFinishDateChange(e.target.value)}
                              onClick={handleDateInputClick}
                              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500 cursor-pointer"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                              11. Durasi (Hari)
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={formData.durationDays}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                const safeVal = isNaN(val) ? 1 : Math.max(1, val);
                                handleDurationChange(safeVal);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 text-xs text-amber-300 font-extrabold rounded-xl p-2.5 outline-none font-mono focus:border-cyan-400"
                            />
                          </div>
                          <div className="sm:col-span-1 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                // Clear primary or keep standard
                                setFormData(prev => ({ ...prev, startDate: new Date().toISOString().substring(0, 10), finishDate: new Date().toISOString().substring(0, 10), durationDays: 1 }));
                              }}
                              className="p-2.5 text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/80 border border-rose-800/60 rounded-xl cursor-pointer transition-colors"
                              title="Reset baris 1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Additional Secondary Row Cards (Baris 2, Baris 3, ...) */}
                      {formData.additionalSchedules && formData.additionalSchedules.length > 0 && (
                        <div className="space-y-3">
                          {formData.additionalSchedules.map((row, idx) => (
                            <div key={row.id} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                <div className="sm:col-span-4">
                                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                                    9. Start Date <span className="text-[10px] text-amber-400 font-mono font-bold">(Baris {idx + 2})</span>
                                  </label>
                                  <input
                                    type="date"
                                    value={row.startDate}
                                    onChange={(e) => handleRowDateChange(row.id, 'startDate', e.target.value)}
                                    onClick={handleDateInputClick}
                                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500 cursor-pointer"
                                  />
                                </div>
                                <div className="sm:col-span-4">
                                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                                    10. Finish Date <span className="text-[10px] text-amber-400 font-mono font-bold">(Baris {idx + 2})</span>
                                  </label>
                                  <input
                                    type="date"
                                    value={row.finishDate}
                                    onChange={(e) => handleRowDateChange(row.id, 'finishDate', e.target.value)}
                                    onClick={handleDateInputClick}
                                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500 cursor-pointer"
                                  />
                                </div>
                                <div className="sm:col-span-3">
                                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                                    11. Durasi (Hari)
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    value={row.durationDays}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      const safeVal = isNaN(val) ? 1 : Math.max(1, val);
                                      handleRowDurationChange(row.id, safeVal);
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 text-xs text-amber-300 font-extrabold rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500"
                                  />
                                </div>
                                <div className="sm:col-span-1 flex items-center justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveScheduleRow(row.id)}
                                    className="p-2.5 text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/80 border border-rose-800/60 rounded-xl cursor-pointer transition-colors"
                                    title="Hapus baris ini"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Bottom Dashed Add Button */}
                      <button
                        type="button"
                        onClick={handleAddScheduleRow}
                        className="w-full py-2.5 bg-slate-950 hover:bg-cyan-950/80 text-cyan-400 hover:text-cyan-300 border border-dashed border-cyan-800/80 hover:border-cyan-500 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-inner"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Tambah Tanggal &amp; Durasi</span>
                      </button>
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
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">14. Total Jarak (Meter)</label>
                    <input
                      type="number"
                      value={formData.totalDistanceMeters}
                      onChange={(e) => setFormData(p => ({ ...p, totalDistanceMeters: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
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
                      onChange={(e) => handleStatusWoChange(e.target.value as StatusWO)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 font-bold text-cyan-400 rounded-xl p-2.5 outline-none font-mono"
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

              {/* Tagging End to End Location Section */}
              <TaggingLocationSection
                value={{
                  originLocation: formData.originLocation,
                  originCoordinates: formData.originCoordinates,
                  originPhotoFile: formData.originPhotoFile,
                  originTaggingDocFile: formData.originTaggingDocFile,
                  destinationLocation: formData.destinationLocation,
                  destinationCoordinates: formData.destinationCoordinates,
                  destinationPhotoFile: formData.destinationPhotoFile,
                  destinationTaggingDocFile: formData.destinationTaggingDocFile,
                  routeMapFile: formData.routeMapFile,
                  routeGmapsUrl: formData.routeGmapsUrl
                }}
                onChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
                onGetBrowserLocation={handleGetBrowserLocation}
                onDistanceCalculated={(distanceMeters) => {
                  if (distanceMeters > 0) {
                    setFormData((prev) => ({
                      ...prev,
                      estimatedDistanceMeters: distanceMeters,
                      totalDistanceMeters: distanceMeters,
                      pathLengthMeters: distanceMeters
                    }));
                  }
                }}
                onPreviewFile={(file) => setPreviewPdf(file)}
                routeGmapsUrl={getGoogleMapsRouteUrl(
                  formData.originCoordinates,
                  formData.originLocation,
                  formData.destinationCoordinates,
                  formData.destinationLocation
                )}
              />

              {/* Section 4: 18. Dokumen & Foto Dokumentasi */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-3">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                    18. DOKUMEN &amp; FOTO DOKUMENTASI
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <PDFUploader
                    label="Foto Closure"
                    woNumber={formData.woNumber}
                    value={formData?.documentation?.fotoClosurePdf}
                    onChange={(file) => setFormData(p => ({ ...p, documentation: { ...(p?.documentation || {}), fotoClosurePdf: file } }))}
                    onPreview={(f) => setPreviewPdf(f)}
                  />
                  <PDFUploader
                    label="Pengujian OPM"
                    woNumber={formData.woNumber}
                    value={formData?.documentation?.opmPdf}
                    onChange={(file) => setFormData(p => ({ ...p, documentation: { ...(p?.documentation || {}), opmPdf: file } }))}
                    onPreview={(f) => setPreviewPdf(f)}
                  />
                  <PDFUploader
                    label="Pengujian OLS"
                    woNumber={formData.woNumber}
                    value={formData?.documentation?.olsPdf}
                    onChange={(file) => setFormData(p => ({ ...p, documentation: { ...(p?.documentation || {}), olsPdf: file } }))}
                    onPreview={(f) => setPreviewPdf(f)}
                  />
                  <PDFUploader
                    label="Dokumentasi BTS"
                    woNumber={formData.woNumber}
                    value={formData?.documentation?.btsPdf}
                    onChange={(file) => setFormData(p => ({ ...p, documentation: { ...(p?.documentation || {}), btsPdf: file } }))}
                    onPreview={(f) => setPreviewPdf(f)}
                  />
                  <PDFUploader
                    label="OTDR Trace Test"
                    woNumber={formData.woNumber}
                    value={formData?.documentation?.otdrPdf}
                    onChange={(file) => setFormData(p => ({ ...p, documentation: { ...(p?.documentation || {}), otdrPdf: file } }))}
                    onPreview={(f) => setPreviewPdf(f)}
                  />
                </div>
              </div>

              {/* Section 5: 19. Remarks */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">19. Remarks / Catatan Lapangan</label>
                <textarea
                  rows={3}
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))}
                  placeholder="Catatan kendala, kondisi rute, atau progres tim..."
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-3 outline-none focus:border-cyan-500 font-mono focus:ring-1 focus:ring-cyan-500 transition-all"
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

      {/* Detail & Summary Preview Modal */}
      {detailPreviewReport && (() => {
        const rep = detailPreviewReport;
        const docs = rep.documentation || {};
        const originPhotoSrc = rep.originPhotoFile?.imageDataUrl || rep.originPhotoFile?.url;
        const destPhotoSrc = rep.destinationPhotoFile?.imageDataUrl || rep.destinationPhotoFile?.url;
        const routeMapSrc = rep.routeMapFile?.imageDataUrl || rep.routeMapFile?.url;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              
              {/* Header */}
              <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Pratinjau Daily Report: {rep.woNumber}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {rep.woType} &bull; Area {rep.assignment} &bull; Tim {rep.team}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                    rep.statusWo === 'Done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    rep.statusWo === 'In Progress' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {rep.statusWo}
                  </span>
                  <button
                    onClick={() => setDetailPreviewReport(null)}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                
                {/* Info Table */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-2">
                    Informasi Work Order &amp; Pelaksanaan
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Nomor WO</span>
                      <strong className="text-white font-mono">{rep.woNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Kategori WO</span>
                      <span className="text-slate-200">{rep.woType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Area &amp; Tim</span>
                      <span className="text-cyan-300 font-mono">{rep.assignment} / {rep.team}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">PIC Lapangan</span>
                      <strong className="text-slate-200">{rep.pic}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Tanggal Release</span>
                      <span className="text-slate-300 font-mono">{rep.releaseDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Periode Kerja</span>
                      <span className="text-slate-300 font-mono">{rep.startDate} s/d {rep.finishDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Durasi Total</span>
                      <strong className="text-amber-400 font-mono">{getTotalDurationDays(rep)} Hari Kerja</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Total Jarak / Alur</span>
                      <strong className="text-emerald-400 font-mono">{(rep.totalDistanceMeters || 0).toLocaleString('id-ID')} m / {rep.pathLengthMeters || 0} m</strong>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-900">
                    <span className="text-slate-500 text-xs block">Deskripsi Pekerjaan:</span>
                    <p className="text-xs text-slate-200 mt-0.5 font-mono">{rep.workType}</p>
                  </div>
                  {rep.remarks && (
                    <div className="pt-2 border-t border-slate-900">
                      <span className="text-slate-500 text-xs block">Catatan Lapangan & Log Audit:</span>
                      <p className="text-xs text-amber-200/90 mt-0.5 whitespace-pre-line font-mono">{rep.remarks}</p>
                    </div>
                  )}
                  {rep.pendingLogs && rep.pendingLogs.length > 0 && (
                    <div className="pt-2 border-t border-slate-900">
                      <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/20 text-xs font-mono space-y-2">
                        <div className="flex items-center justify-between text-amber-400 font-bold">
                          <span>⏸️ RIWAYAT JEDA PEKERJAAN (PENDING LOGS)</span>
                          <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded">
                            Total Jeda: {rep.pendingLogs.reduce((s, i) => s + (i.pendingDays || 0), 0)} Hari
                          </span>
                        </div>
                        <div className="space-y-1 divide-y divide-slate-800">
                          {rep.pendingLogs.map((log, idx) => (
                            <div key={idx} className="pt-1 flex items-center justify-between text-slate-300 text-[11px]">
                              <div>
                                <span className="text-amber-300 font-bold">Pending #{idx + 1}:</span> {log.pendingAt?.substring(0, 10)} {log.pendingAt?.substring(11, 16)}
                                {log.resumedAt ? ` ➔ Lanjut: ${log.resumedAt.substring(0, 10)} ${log.resumedAt.substring(11, 16)}` : ' (Masih Pending)'}
                              </div>
                              <span className="text-amber-400 font-bold">{log.pendingDays ? `${log.pendingDays} Hari` : 'Aktif'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section A: Tagging Location Visuals */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-400" />
                      A. TAGGING END TO END LOCATION (FOTO &amp; RUTE)
                    </h4>
                    {(rep.routeGmapsUrl || getGoogleMapsRouteUrl(rep.originCoordinates, rep.originLocation, rep.destinationCoordinates, rep.destinationLocation)) && (
                      <a
                        href={rep.routeGmapsUrl || getGoogleMapsRouteUrl(rep.originCoordinates, rep.originLocation, rep.destinationCoordinates, rep.destinationLocation)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Buka di Google Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Site A Card */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-emerald-400 font-mono">📍 Site A (Origin)</span>
                          <span className="text-[10px] text-slate-400 font-mono">{rep.originCoordinates || '-'}</span>
                        </div>
                        <p className="text-xs text-slate-200 font-medium mb-2">{rep.originLocation || 'Lokasi Titik Awal'}</p>
                        {originPhotoSrc && (
                          <div
                            onClick={() => rep.originPhotoFile && setPreviewPdf(rep.originPhotoFile)}
                            className="relative group rounded-lg overflow-hidden border border-slate-800 bg-black cursor-pointer"
                          >
                            <img
                              src={originPhotoSrc}
                              alt="Site A Geotag"
                              className="w-full h-44 object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-mono text-white">
                              <Eye className="w-4 h-4 mr-1" /> Klik Pratinjau
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Site B Card */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-rose-400 font-mono">📍 Site B (Destination)</span>
                          <span className="text-[10px] text-slate-400 font-mono">{rep.destinationCoordinates || '-'}</span>
                        </div>
                        <p className="text-xs text-slate-200 font-medium mb-2">{rep.destinationLocation || 'Lokasi Titik Akhir'}</p>
                        {destPhotoSrc && (
                          <div
                            onClick={() => rep.destinationPhotoFile && setPreviewPdf(rep.destinationPhotoFile)}
                            className="relative group rounded-lg overflow-hidden border border-slate-800 bg-black cursor-pointer"
                          >
                            <img
                              src={destPhotoSrc}
                              alt="Site B Geotag"
                              className="w-full h-44 object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-mono text-white">
                              <Eye className="w-4 h-4 mr-1" /> Klik Pratinjau
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Route Map Card */}
                  {routeMapSrc && (
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-cyan-400 font-mono">🗺️ Peta Rute Tracking End-to-End</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          Jarak: {(rep.totalDistanceMeters || rep.estimatedDistanceMeters || 0).toLocaleString('id-ID')} Meter
                        </span>
                      </div>
                      <div
                        onClick={() => rep.routeMapFile && setPreviewPdf(rep.routeMapFile)}
                        className="relative group rounded-lg overflow-hidden border border-slate-800 bg-black cursor-pointer"
                      >
                        <img
                          src={routeMapSrc}
                          alt="Route Map"
                          className="w-full h-40 object-cover group-hover:scale-102 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-mono text-white">
                          <Eye className="w-4 h-4 mr-1" /> Klik Pratinjau Peta
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section B: 18. Dokumen & Foto Dokumentasi Visual Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-2">
                    B. 18. DOKUMEN &amp; FOTO DOKUMENTASI (EVIDENCE LAPANGAN)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { label: 'Foto Closure Doc', file: docs.fotoClosurePdf, color: 'text-emerald-400' },
                      { label: 'Pengujian OPM Doc', file: docs.opmPdf, color: 'text-amber-400' },
                      { label: 'Pengujian OLS Doc', file: docs.olsPdf, color: 'text-purple-400' },
                      { label: 'Dokumentasi BTS Doc', file: docs.btsPdf, color: 'text-rose-400' },
                      { label: 'OTDR Trace Test Doc', file: docs.otdrPdf, color: 'text-cyan-400' }
                    ].map((item, idx) => {
                      const img = item.file?.imageDataUrl || item.file?.url;
                      return (
                        <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-xs font-bold font-mono ${item.color}`}>{item.label}</span>
                              <span className="text-[10px] text-slate-500 font-mono">Verified</span>
                            </div>
                            <span className="text-[11px] text-slate-300 block truncate mb-2" title={item.file?.name}>
                              {item.file?.name || 'Belum di-upload'}
                            </span>
                            {img && (
                              <div
                                onClick={() => item.file && setPreviewPdf(item.file)}
                                className="relative group rounded-lg overflow-hidden border border-slate-800 bg-black cursor-pointer"
                              >
                                <img
                                  src={img}
                                  alt={item.label}
                                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-mono text-white">
                                  <Eye className="w-3.5 h-3.5 mr-1" /> Lihat Dokumen
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-850 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs font-mono text-slate-400">
                  Dokumentasi Resmi PT. Belacom Indonesia
                </div>
                <div className="flex items-center gap-2">
                  <TouchButton
                    variant="success"
                    size="sm"
                    icon={<FileSpreadsheet className="w-4 h-4" />}
                    onClick={() => {
                      exportDailyReportToExcel([rep]);
                      showToast('success', 'Excel Unduh', `Rekap Excel WO ${rep.woNumber} berhasil diunduh!`);
                    }}
                  >
                    Export Excel WO Ini (.xlsx)
                  </TouchButton>
                  <TouchButton variant="primary" size="sm" onClick={() => setDetailPreviewReport(null)}>
                    Tutup
                  </TouchButton>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      <CalendarDatePickerModal
        isOpen={calendarConfig.isOpen}
        onClose={() => setCalendarConfig(prev => ({ ...prev, isOpen: false }))}
        title={calendarConfig.title}
        initialDate={calendarConfig.initialDate}
        onSelectDate={calendarConfig.onSelect}
      />

    </div>
  );
};

