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
  MapPin,
  Navigation,
  ExternalLink,
  FileSpreadsheet
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { BASTItem, WOOption, StatusBAST, PDFFileMeta } from '../types';
import { TouchButton } from '../components/TouchButton';
import { PDFUploader } from '../components/PDFUploader';
import { MultiPDFUploader } from '../components/MultiPDFUploader';
import { PDFViewerModal } from '../components/PDFViewerModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { getDefaultWorkTypeForWoOption, getGoogleMapsRouteUrl } from './DailyReportPage';
import { TaggingLocationSection } from '../components/TaggingLocationSection';
import { getFileBadgeStyle } from '../utils/fileHelper';
import { exportBastToWord, exportBastToExcel } from '../utils/bastExportHelper';

export const BASTPage: React.FC = () => {
  const { bastList, addBAST, updateBAST, deleteBAST, showToast, dailyReports } = useProjectContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<PDFFileMeta | null>(null);
  const [previewingBastContext, setPreviewingBastContext] = useState<BASTItem | null>(null);

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
    notes: '',
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

  const allWOTypeFilterOptions: string[] = Array.from(
    new Set([...defaultWOOptions, ...bastList.map(b => b.woType), ...dailyReports.map(r => r.woType)].filter(Boolean))
  );
  const woOptions: WOOption[] = allWOTypeFilterOptions;

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
    const today = new Date().toISOString().substring(0, 10);
    const finish = new Date(Date.now() + 5 * 86400000).toISOString().substring(0, 10);
    setFormData({
      woNumber: `WO-BEL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
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
      notes: '',
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
      originLocation: item.originLocation || '',
      originCoordinates: item.originCoordinates || '',
      originPhotoFile: item.originPhotoFile,
      originTaggingDocFile: item.originTaggingDocFile,
      destinationLocation: item.destinationLocation || '',
      destinationCoordinates: item.destinationCoordinates || '',
      destinationPhotoFile: item.destinationPhotoFile,
      destinationTaggingDocFile: item.destinationTaggingDocFile,
      routeMapFile: item.routeMapFile,
      routeGmapsUrl: item.routeGmapsUrl || ''
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
        fotoDokumentasiPdfs: syncedDocs.length > 0 ? syncedDocs : prev.fotoDokumentasiPdfs,
        originLocation: matchingDaily.originLocation || '',
        originCoordinates: matchingDaily.originCoordinates || '',
        originPhotoFile: matchingDaily.originPhotoFile,
        originTaggingDocFile: matchingDaily.originTaggingDocFile,
        destinationLocation: matchingDaily.destinationLocation || '',
        destinationCoordinates: matchingDaily.destinationCoordinates || '',
        destinationPhotoFile: matchingDaily.destinationPhotoFile,
        destinationTaggingDocFile: matchingDaily.destinationTaggingDocFile,
        routeMapFile: matchingDaily.routeMapFile,
        routeGmapsUrl: matchingDaily.routeGmapsUrl || ''
      }));
      showToast('info', 'Sinkronisasi BAST', `Data Timeline, Rute Location & WO disinkronkan dari Daily Report ${matchingDaily.woNumber}`);
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

    const calculatedRouteUrl = getGoogleMapsRouteUrl(
      formData.originCoordinates,
      formData.originLocation,
      formData.destinationCoordinates,
      formData.destinationLocation
    ) || formData.routeGmapsUrl || '';

    const payload = {
      ...formData,
      durasiDate: formData.durasiDate ?? formData.durationDays,
      routeGmapsUrl: calculatedRouteUrl
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

  const filteredBast = bastList.filter(b => 
    b.woNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.workType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.originLocation && b.originLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (b.destinationLocation && b.destinationLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
    b.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
            <CheckSquare className="w-4 h-4" /> Manajemen Berita Acara Serah Terima
          </div>
          <h2 className="text-xl font-bold text-white mt-1">BAST Belacom</h2>
          <p className="text-xs text-slate-400">Verifikasi Berkas APD, ABD, Core Connection, & Daily Report</p>
        </div>

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

      {/* Search Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No. WO atau deskripsi BAST..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-3 py-2 outline-none"
          />
        </div>
      </div>

      {/* BAST Data Grid */}
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
                  {(bast.originLocation || bast.destinationLocation || bast.originCoordinates || bast.destinationCoordinates) && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          Tagging Route:
                        </span>
                        {(bast.routeGmapsUrl || getGoogleMapsRouteUrl(bast.originCoordinates, bast.originLocation, bast.destinationCoordinates, bast.destinationLocation)) && (
                          <a
                            href={bast.routeGmapsUrl || getGoogleMapsRouteUrl(bast.originCoordinates, bast.originLocation, bast.destinationCoordinates, bast.destinationLocation)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/80 transition-colors"
                            title="Buka Rute di Google Maps"
                          >
                            <Navigation className="w-3 h-3" /> Maps
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-200 font-mono font-semibold bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 flex items-center justify-between gap-1">
                        <span className="truncate max-w-[45%]" title={bast.originLocation || bast.originCoordinates}>
                          📍 {bast.originLocation || bast.originCoordinates || 'Awal'}
                        </span>
                        <span className="text-cyan-400 font-bold shrink-0">➔</span>
                        <span className="truncate max-w-[45%] text-right" title={bast.destinationLocation || bast.destinationCoordinates}>
                          🏁 {bast.destinationLocation || bast.destinationCoordinates || 'Akhir'}
                        </span>
                      </div>
                    </div>
                  )}
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
                      onClick={() => {
                        setPreviewingBastContext(bast);
                        setPreviewPdf(bast.apdPdf!);
                      }} 
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
                      onClick={() => {
                        setPreviewingBastContext(bast);
                        setPreviewPdf(bast.abdPdf!);
                      }} 
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
                      onClick={() => {
                        setPreviewingBastContext(bast);
                        setPreviewPdf(bast.coreConnectionPdf!);
                      }} 
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
                        onClick={() => {
                          setPreviewingBastContext(bast);
                          setPreviewPdf(doc);
                        }} 
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-slate-750 flex items-center gap-1 cursor-pointer transition-colors" 
                        title={`Lihat ${doc.name}`}
                      >
                        <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(doc.name).bgClass} ${getFileBadgeStyle(doc.name).textClass}`}>
                          [{getFileBadgeStyle(doc.name).ext}]
                        </span> {docs.length > 1 ? `Foto Docs #${idx + 1}` : 'Foto Docs'}
                      </button>
                    ));
                  })()}
                  {bast.originPhotoFile && (
                    <button 
                      onClick={() => {
                        setPreviewingBastContext(bast);
                        setPreviewPdf(bast.originPhotoFile!);
                      }} 
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-emerald-300 rounded border border-emerald-800/50 flex items-center gap-1 cursor-pointer transition-colors" 
                      title={`Lihat Foto Site A: ${bast.originPhotoFile.name}`}
                    >
                      <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(bast.originPhotoFile.name).bgClass} ${getFileBadgeStyle(bast.originPhotoFile.name).textClass}`}>
                        [{getFileBadgeStyle(bast.originPhotoFile.name).ext}]
                      </span> Foto Site A
                    </button>
                  )}
                  {bast.originTaggingDocFile && (
                    <button 
                      onClick={() => {
                        setPreviewingBastContext(bast);
                        setPreviewPdf(bast.originTaggingDocFile!);
                      }} 
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-emerald-300 rounded border border-emerald-800/50 flex items-center gap-1 cursor-pointer transition-colors" 
                      title={`Lihat Dokumen Tagging Site A: ${bast.originTaggingDocFile.name}`}
                    >
                      <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(bast.originTaggingDocFile.name).bgClass} ${getFileBadgeStyle(bast.originTaggingDocFile.name).textClass}`}>
                        [{getFileBadgeStyle(bast.originTaggingDocFile.name).ext}]
                      </span> Doc Site A
                    </button>
                  )}
                  {bast.destinationPhotoFile && (
                    <button 
                      onClick={() => {
                        setPreviewingBastContext(bast);
                        setPreviewPdf(bast.destinationPhotoFile!);
                      }} 
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-rose-300 rounded border border-rose-800/50 flex items-center gap-1 cursor-pointer transition-colors" 
                      title={`Lihat Foto Site B: ${bast.destinationPhotoFile.name}`}
                    >
                      <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(bast.destinationPhotoFile.name).bgClass} ${getFileBadgeStyle(bast.destinationPhotoFile.name).textClass}`}>
                        [{getFileBadgeStyle(bast.destinationPhotoFile.name).ext}]
                      </span> Foto Site B
                    </button>
                  )}
                  {bast.destinationTaggingDocFile && (
                    <button 
                      onClick={() => {
                        setPreviewingBastContext(bast);
                        setPreviewPdf(bast.destinationTaggingDocFile!);
                      }} 
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-rose-300 rounded border border-rose-800/50 flex items-center gap-1 cursor-pointer transition-colors" 
                      title={`Lihat Dokumen Tagging Site B: ${bast.destinationTaggingDocFile.name}`}>
                      <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(bast.destinationTaggingDocFile.name).bgClass} ${getFileBadgeStyle(bast.destinationTaggingDocFile.name).textClass}`}>
                        [{getFileBadgeStyle(bast.destinationTaggingDocFile.name).ext}]
                      </span> Doc Site B
                    </button>
                  )}
                  {bast.routeMapFile && (
                    <button 
                      onClick={() => {
                        setPreviewingBastContext(bast);
                        setPreviewPdf(bast.routeMapFile!);
                      }} 
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-indigo-300 rounded border border-indigo-800/50 flex items-center gap-1 cursor-pointer transition-colors" 
                      title={`Lihat File Peta Rute: ${bast.routeMapFile.name}`}
                    >
                      <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(bast.routeMapFile.name).bgClass} ${getFileBadgeStyle(bast.routeMapFile.name).textClass}`}>
                        [{getFileBadgeStyle(bast.routeMapFile.name).ext}]
                      </span> Peta Rute
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500 font-mono">{bast.id}</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Download Word (.doc) */}
                <button
                  type="button"
                  onClick={() => {
                    exportBastToWord(bast);
                    showToast('success', 'Download Word Sukses', `Dokumen BAST ${bast.woNumber} berhasil diunduh dalam format .doc beserta foto visual.`);
                  }}
                  className="px-2 py-1.5 rounded-lg bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 border border-indigo-500/20 cursor-pointer flex items-center gap-1 text-[11px] font-semibold transition-colors"
                  title="Download BAST Microsoft Word (.doc) lengkap dengan gambar & rute"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Word</span>
                </button>

                {/* Download Excel (.xls) */}
                <button
                  type="button"
                  onClick={() => {
                    exportBastToExcel(bast);
                    showToast('success', 'Download Excel Sukses', `Dokumen BAST ${bast.woNumber} berhasil diunduh dalam format .xls beserta foto visual.`);
                  }}
                  className="px-2 py-1.5 rounded-lg bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 border border-emerald-500/20 cursor-pointer flex items-center gap-1 text-[11px] font-semibold transition-colors"
                  title="Download BAST Microsoft Excel (.xls) lengkap dengan gambar & rute"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Excel</span>
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
                  onPreview={(f) => {
                    setPreviewingBastContext({
                      ...formData,
                      id: editingId || 'BAST-TEMP',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    });
                    setPreviewPdf(f);
                  }}
                />
                <PDFUploader
                  label="2. ABD Upload File"
                  value={formData.abdPdf}
                  onChange={(f) => setFormData(p => ({ ...p, abdPdf: f }))}
                  onPreview={(f) => {
                    setPreviewingBastContext({
                      ...formData,
                      id: editingId || 'BAST-TEMP',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    });
                    setPreviewPdf(f);
                  }}
                />
                <PDFUploader
                  label="3. Core Connection File"
                  value={formData.coreConnectionPdf}
                  onChange={(f) => setFormData(p => ({ ...p, coreConnectionPdf: f }))}
                  onPreview={(f) => {
                    setPreviewingBastContext({
                      ...formData,
                      id: editingId || 'BAST-TEMP',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    });
                    setPreviewPdf(f);
                  }}
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
                      totalDistanceMeters: distanceMeters
                    }));
                  }
                }}
                onPreviewFile={(file) => {
                  setPreviewingBastContext({
                    ...formData,
                    id: editingId || 'BAST-TEMP',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  });
                  setPreviewPdf(file);
                }}
                routeGmapsUrl={getGoogleMapsRouteUrl(
                  formData.originCoordinates,
                  formData.originLocation,
                  formData.destinationCoordinates,
                  formData.destinationLocation
                )}
                onDownloadWord={() => {
                  const currentBast: BASTItem = {
                    ...formData,
                    id: editingId || 'BAST-DRAFT',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  };
                  exportBastToWord(currentBast);
                  showToast('success', 'Download Word BAST', `Dokumen BAST ${currentBast.woNumber} berhasil diunduh dalam format .doc beserta foto visual.`);
                }}
                onDownloadExcel={() => {
                  const currentBast: BASTItem = {
                    ...formData,
                    id: editingId || 'BAST-DRAFT',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  };
                  exportBastToExcel(currentBast);
                  showToast('success', 'Download Excel BAST', `Dokumen BAST ${currentBast.woNumber} berhasil diunduh dalam format .xls beserta foto visual.`);
                }}
              />

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
                  onPreview={(f) => {
                    setPreviewingBastContext({
                      ...formData,
                      id: editingId || 'BAST-TEMP',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    });
                    setPreviewPdf(f);
                  }}
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

              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const currentBast: BASTItem = {
                        ...formData,
                        id: editingId || 'BAST-DRAFT',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      };
                      exportBastToWord(currentBast);
                      showToast('success', 'Download Word BAST', `File Word BAST ${currentBast.woNumber} berhasil diunduh.`);
                    }}
                    className="px-3 py-2 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/30 font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Export Formulir BAST & Lampiran Visual ke Microsoft Word (.doc)"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Download Word (.doc)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const currentBast: BASTItem = {
                        ...formData,
                        id: editingId || 'BAST-DRAFT',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      };
                      exportBastToExcel(currentBast);
                      showToast('success', 'Download Excel BAST', `File Excel BAST ${currentBast.woNumber} berhasil diunduh.`);
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Export Formulir BAST & Lampiran Visual ke Microsoft Excel (.xls)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Excel (.xls)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 ml-auto">
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

      {/* PDF Viewer */}
      <PDFViewerModal 
        file={previewPdf} 
        onClose={() => {
          setPreviewPdf(null);
          setPreviewingBastContext(null);
        }} 
        onDownloadWord={previewingBastContext ? () => {
          exportBastToWord(previewingBastContext);
          showToast('success', 'Download Word BAST', `Dokumen BAST ${previewingBastContext.woNumber} berhasil diunduh dalam format .doc.`);
        } : undefined}
        onDownloadExcel={previewingBastContext ? () => {
          exportBastToExcel(previewingBastContext);
          showToast('success', 'Download Excel BAST', `Dokumen BAST ${previewingBastContext.woNumber} berhasil diunduh dalam format .xls.`);
        } : undefined}
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
