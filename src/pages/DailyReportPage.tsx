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
  PDFFileMeta 
} from '../types';
import { TouchButton } from '../components/TouchButton';
import { PDFUploader } from '../components/PDFUploader';
import { PDFViewerModal } from '../components/PDFViewerModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { getFileBadgeStyle } from '../utils/fileHelper';

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
  
  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCustomWoType, setIsCustomWoType] = useState<boolean>(false);

  // PDF Preview Modal
  const [previewPdf, setPreviewPdf] = useState<PDFFileMeta | null>(null);

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; woNumber: string } | null>(null);

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
    originLocation: '',
    originCoordinates: '',
    destinationLocation: '',
    destinationCoordinates: '',
    routeGmapsUrl: ''
  });

  const defaultWOOptions: WOOption[] = [
    'Plan Network Interconection POP',
    'Splice Interconnection POP Mini',
    'Splice Interconnection Site',
    'Splice Interconnection POP'
  ];

  const handleGetBrowserLocation = (type: 'origin' | 'destination') => {
    if (!navigator.geolocation) {
      showToast('error', 'GPS Tidak Didukung', 'Browser Anda tidak mendukung Geolocation API.');
      return;
    }
    showToast('info', 'Mendapatkan Lokasi', 'Mengambil koordinat GPS saat ini dari peranti...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(5);
        const lng = position.coords.longitude.toFixed(5);
        const coordsString = `${lat}, ${lng}`;
        if (type === 'origin') {
          setFormData(prev => ({
            ...prev,
            originCoordinates: coordsString
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            destinationCoordinates: coordsString
          }));
        }
        showToast('success', 'GPS Berhasil', `Koordinat ${type === 'origin' ? 'Titik Awal' : 'Titik Akhir'} terisi: ${coordsString}`);
      },
      (error) => {
        showToast('error', 'Gagal Ambil GPS', error.message || 'Izin lokasi ditolak atau GPS tidak aktif.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setIsCustomWoType(false);
    const initialWo = 'Plan Network Interconection POP';
    setFormData({
      woType: initialWo,
      monthReleaseWo: new Date().toISOString().substring(0, 7),
      assignment: 'Jabo 1',
      team: 'ABR 03',
      statusWo: 'In Progress',
      pic: 'Operator Belacom',
      workType: '',
      releaseDate: new Date().toISOString().substring(0, 10),
      startDate: new Date().toISOString().substring(0, 10),
      finishDate: new Date(Date.now() + 5 * 86400000).toISOString().substring(0, 10),
      durationDays: 5,
      woNumber: `WO-BEL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      estimatedDistanceMeters: 2000,
      totalDistanceMeters: 1980,
      statusTeamProject: 'On Schedule',
      pathLengthMeters: 1980,
      documentation: {},
      remarks: '',
      originLocation: '',
      originCoordinates: '',
      destinationLocation: '',
      destinationCoordinates: '',
      routeGmapsUrl: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (report: DailyReportItem) => {
    setEditingId(report.id);
    setIsCustomWoType(!defaultWOOptions.includes(report.woType));
    setFormData({
      ...report,
      originLocation: report.originLocation || '',
      originCoordinates: report.originCoordinates || '',
      destinationLocation: report.destinationLocation || '',
      destinationCoordinates: report.destinationCoordinates || '',
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

  // Auto calculate finish date given start date and duration days
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
      return {
        ...prev,
        releaseDate: val,
        startDate: newStart,
        finishDate: newFinish,
        durationDays: calculateDurationDays(newStart, newFinish)
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
        durationDays: dur
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
        durationDays: dur
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
        finishDate: newFinish
      };
    });
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
      (report.originLocation && report.originLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (report.destinationLocation && report.destinationLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      report.remarks.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWO = selectedWOType === 'ALL' || report.woType === selectedWOType;
    const matchesAssignment = selectedAssignment === 'ALL' || report.assignment === selectedAssignment;

    return matchesSearch && matchesWO && matchesAssignment;
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

  const allWOTypeFilterOptions: string[] = Array.from(
    new Set([...defaultWOOptions, ...dailyReports.map(r => r.woType).filter(Boolean)])
  );
  const woOptions: WOOption[] = allWOTypeFilterOptions;

  const assignmentOptions: AssignmentArea[] = ['Jabo 1', 'Jabo 2', 'Jabo 3'];
  const teamOptions: TeamCode[] = ['ABR 01', 'ABR 02', 'ABR 03', 'ABR 04', 'ABR 05', 'ABR 06', 'ABR 07', 'ABR 08', 'ABR 09', 'ABR 10'];
  const statusWoOptions: StatusWO[] = ['Not Yet', 'In Progress', 'Done'];
  const statusTeamProjectOptions: StatusTeamProject[] = ['Not Yet', 'Waiting Schedule', 'On Schedule'];

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
                <th className="py-2.5 px-3 font-semibold">No. WO & Release</th>
                <th className="py-2.5 px-3 font-semibold">WO Type</th>
                <th className="py-2.5 px-3 font-semibold">Area & Tim</th>
                <th className="py-2.5 px-3 font-semibold">PIC & Pekerjaan</th>
                <th className="py-2.5 px-3 font-semibold">Tanggal & Durasi</th>
                <th className="py-2.5 px-3 font-semibold">Dokumentasi & Jarak PDF</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status WO</th>
                <th className="py-2.5 px-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredReports.map((report) => {
                const docs = report.documentation;
                return (
                  <tr key={report.id} className="hover:bg-slate-850/60 transition-colors group">
                    
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-cyan-400 font-mono block">{report.woNumber}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Bulan: {report.monthReleaseWo}</span>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-200 block max-w-[180px] truncate" title={report.woType}>
                        {report.woType}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Alur: {report.pathLengthMeters}m</span>
                    </td>

                    <td className="py-2.5 px-3 font-mono">
                      <span className="px-2 py-0.5 bg-slate-950 rounded text-cyan-300 border border-slate-800 text-[11px] inline-block mb-1">
                        {report.assignment}
                      </span>
                      <div className="text-[10px] text-slate-400">Tim: <strong className="text-slate-200">{report.team}</strong></div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-white block">{report.pic}</span>
                      <span className="text-[11px] text-slate-400 block max-w-[220px] truncate" title={report.workType}>
                        {report.workType}
                      </span>
                      {(report.originLocation || report.destinationLocation || report.originCoordinates || report.destinationCoordinates) && (
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800 text-slate-300">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span className="font-semibold text-slate-200 truncate max-w-[95px]" title={report.originLocation || report.originCoordinates}>
                            {report.originLocation || report.originCoordinates || 'Awal'}
                          </span>
                          <span className="text-cyan-400 font-bold">➔</span>
                          <span className="font-semibold text-slate-200 truncate max-w-[95px]" title={report.destinationLocation || report.destinationCoordinates}>
                            {report.destinationLocation || report.destinationCoordinates || 'Akhir'}
                          </span>
                          {(report.routeGmapsUrl || getGoogleMapsRouteUrl(report.originCoordinates, report.originLocation, report.destinationCoordinates, report.destinationLocation)) && (
                            <a
                              href={report.routeGmapsUrl || getGoogleMapsRouteUrl(report.originCoordinates, report.originLocation, report.destinationCoordinates, report.destinationLocation)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-0.5 text-emerald-400 hover:text-emerald-300 transition-colors p-0.5 rounded"
                              title="Lihat Rute di Google Maps"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      <span className="block text-slate-300">{report.startDate} s/d {report.finishDate}</span>
                      <span className="text-amber-400 font-bold">{report.durationDays} Hari Kerja</span>
                    </td>

                    {/* Interactive Individual Click-to-View PDF Badges */}
                    <td className="py-2.5 px-3 font-mono">
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {docs.fotoClosurePdf && (
                          <button
                            onClick={() => setPreviewPdf(docs.fotoClosurePdf!)}
                            className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-750 rounded flex items-center gap-1 cursor-pointer transition-colors"
                            title={`Lihat ${docs.fotoClosurePdf.name}`}
                          >
                            <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(docs.fotoClosurePdf.name).bgClass} ${getFileBadgeStyle(docs.fotoClosurePdf.name).textClass}`}>
                              [{getFileBadgeStyle(docs.fotoClosurePdf.name).ext}]
                            </span> Closure
                          </button>
                        )}

                        {docs.opmPdf && (
                          <button
                            onClick={() => setPreviewPdf(docs.opmPdf!)}
                            className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-750 rounded flex items-center gap-1 cursor-pointer transition-colors"
                            title={`Lihat ${docs.opmPdf.name}`}
                          >
                            <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(docs.opmPdf.name).bgClass} ${getFileBadgeStyle(docs.opmPdf.name).textClass}`}>
                              [{getFileBadgeStyle(docs.opmPdf.name).ext}]
                            </span> OPM
                          </button>
                        )}

                        {docs.olsPdf && (
                          <button
                            onClick={() => setPreviewPdf(docs.olsPdf!)}
                            className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-750 rounded flex items-center gap-1 cursor-pointer transition-colors"
                            title={`Lihat ${docs.olsPdf.name}`}
                          >
                            <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(docs.olsPdf.name).bgClass} ${getFileBadgeStyle(docs.olsPdf.name).textClass}`}>
                              [{getFileBadgeStyle(docs.olsPdf.name).ext}]
                            </span> OLS
                          </button>
                        )}

                        {docs.btsPdf && (
                          <button
                            onClick={() => setPreviewPdf(docs.btsPdf!)}
                            className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-750 rounded flex items-center gap-1 cursor-pointer transition-colors"
                            title={`Lihat ${docs.btsPdf.name}`}
                          >
                            <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(docs.btsPdf.name).bgClass} ${getFileBadgeStyle(docs.btsPdf.name).textClass}`}>
                              [{getFileBadgeStyle(docs.btsPdf.name).ext}]
                            </span> BTS
                          </button>
                        )}

                        {docs.otdrPdf && (
                          <button
                            onClick={() => setPreviewPdf(docs.otdrPdf!)}
                            className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-750 rounded flex items-center gap-1 cursor-pointer transition-colors"
                            title={`Lihat ${docs.otdrPdf.name}`}
                          >
                            <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(docs.otdrPdf.name).bgClass} ${getFileBadgeStyle(docs.otdrPdf.name).textClass}`}>
                              [{getFileBadgeStyle(docs.otdrPdf.name).ext}]
                            </span> OTDR
                          </button>
                        )}

                        {Object.values(docs).filter(Boolean).length === 0 && (
                          <span className="text-slate-600 text-[10px]">Belum ada berkas</span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                        report.statusWo === 'Done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        report.statusWo === 'In Progress' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {report.statusWo}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right">
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
                    <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-mono">
                      <span className="bg-slate-800 border border-slate-700 text-cyan-300 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                        ✍️ Siap Diisi Manual
                      </span>
                      <span className="text-slate-400">Bidang teks bersih tanpa teks bawaan dan siap diisi deskripsi pekerjaan secara bebas</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">8. Release Date</label>
                      <input
                        type="date"
                        value={formData.releaseDate}
                        onChange={(e) => handleReleaseDateChange(e.target.value)}
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
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-300">11. Durasi (Hari)</label>
                        <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">
                          ⚡ Otomatis
                        </span>
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={formData.durationDays}
                        onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-950 border border-cyan-500/50 text-xs text-amber-400 font-extrabold rounded-xl p-2.5 outline-none font-mono focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono italic mt-1">
                    * Durasi (Hari) dihitung otomatis dari (Finish Date - Start Date + 1). Mengubah durasi juga memperbarui Finish Date secara otomatis.
                  </p>
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

              {/* Tagging End to End Location Section */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                    TAGGING END TO END LOCATION (RUTE & TITIK KOORDINAT)
                  </h4>
                  {getGoogleMapsRouteUrl(
                    formData.originCoordinates,
                    formData.originLocation,
                    formData.destinationCoordinates,
                    formData.destinationLocation
                  ) && (
                    <a
                      href={getGoogleMapsRouteUrl(
                        formData.originCoordinates,
                        formData.originLocation,
                        formData.destinationCoordinates,
                        formData.destinationLocation
                      )!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/80 px-2.5 py-1 rounded-lg border border-emerald-800/80 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      🗺️ Lihat Rute di Google Maps
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kolom Kiri — Titik Awal (Origin / Site A) */}
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                        Titik Awal (Origin / Site A)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleGetBrowserLocation('origin')}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 bg-slate-800 hover:bg-slate-750 px-2 py-0.5 rounded border border-slate-700 cursor-pointer transition-colors"
                        title="Gunakan Geolocation browser untuk ambil koordinat saat ini"
                      >
                        📍 Ambil GPS Saat Ini
                      </button>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Nama Site / Titik Awal (Origin)</label>
                      <input
                        type="text"
                        value={formData.originLocation || ''}
                        onChange={(e) => setFormData(p => ({ ...p, originLocation: e.target.value }))}
                        placeholder="Contoh: POP Sentul City / OTB-01"
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Koordinat GPS Titik Awal (Lat, Long)</label>
                      <input
                        type="text"
                        value={formData.originCoordinates || ''}
                        onChange={(e) => setFormData(p => ({ ...p, originCoordinates: e.target.value }))}
                        placeholder="-6.58912, 106.85231"
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-bold rounded-xl p-2.5 outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Kolom Kanan — Titik Akhir (Destination / Site B) */}
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400 inline-block animate-pulse"></span>
                        Titik Akhir (Destination / Site B)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleGetBrowserLocation('destination')}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 bg-slate-800 hover:bg-slate-750 px-2 py-0.5 rounded border border-slate-700 cursor-pointer transition-colors"
                        title="Gunakan Geolocation browser untuk ambil koordinat saat ini"
                      >
                        📍 Ambil GPS Saat Ini
                      </button>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Nama Site / Titik Akhir (Destination)</label>
                      <input
                        type="text"
                        value={formData.destinationLocation || ''}
                        onChange={(e) => setFormData(p => ({ ...p, destinationLocation: e.target.value }))}
                        placeholder="Contoh: BTS Cijayanti / Closure CL-04"
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Koordinat GPS Titik Akhir (Lat, Long)</label>
                      <input
                        type="text"
                        value={formData.destinationCoordinates || ''}
                        onChange={(e) => setFormData(p => ({ ...p, destinationCoordinates: e.target.value }))}
                        placeholder="-6.59421, 106.86105"
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-bold rounded-xl p-2.5 outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: 18. Dokumen & Foto Dokumentasi Uploads */}
              <div>
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-2 mb-3">
                  18. DOKUMEN & FOTO DOKUMENTASI (UPLOAD FILE)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <PDFUploader
                    label="Foto Closure Doc"
                    value={formData.documentation.fotoClosurePdf}
                    onChange={(file) => setFormData(p => ({ ...p, documentation: { ...p.documentation, fotoClosurePdf: file } }))}
                    onPreview={(f) => setPreviewPdf(f)}
                  />
                  <PDFUploader
                    label="Pengujian OPM Doc"
                    value={formData.documentation.opmPdf}
                    onChange={(file) => setFormData(p => ({ ...p, documentation: { ...p.documentation, opmPdf: file } }))}
                    onPreview={(f) => setPreviewPdf(f)}
                  />
                  <PDFUploader
                    label="Pengujian OLS Doc"
                    value={formData.documentation.olsPdf}
                    onChange={(file) => setFormData(p => ({ ...p, documentation: { ...p.documentation, olsPdf: file } }))}
                    onPreview={(f) => setPreviewPdf(f)}
                  />
                  <PDFUploader
                    label="Dokumentasi BTS Doc"
                    value={formData.documentation.btsPdf}
                    onChange={(file) => setFormData(p => ({ ...p, documentation: { ...p.documentation, btsPdf: file } }))}
                    onPreview={(f) => setPreviewPdf(f)}
                  />
                  <PDFUploader
                    label="OTDR Trace Test Doc"
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
