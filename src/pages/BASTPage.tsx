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
  Mail,
  MapPin,
  Navigation,
  ExternalLink
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { BASTItem, WOOption, StatusBAST, PDFFileMeta } from '../types';
import { TouchButton } from '../components/TouchButton';
import { PDFUploader } from '../components/PDFUploader';
import { PDFViewerModal } from '../components/PDFViewerModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { SendEmailModal } from '../components/SendEmailModal';
import { EmailAttachment } from '../utils/emailTemplate';
import { getDefaultWorkTypeForWoOption, getGoogleMapsRouteUrl } from './DailyReportPage';
import { getFileBadgeStyle } from '../utils/fileHelper';

export const BASTPage: React.FC = () => {
  const { bastList, addBAST, updateBAST, deleteBAST, showToast, dailyReports } = useProjectContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<PDFFileMeta | null>(null);

  // Email Submission Modal State
  const [emailModalData, setEmailModalData] = useState<{
    bastId?: string;
    requestType: 'BAST';
    woNumber: string;
    projectName: string;
    vendorName?: string;
    segmentLocation?: string;
    realisasiJarak?: string;
    documentNumber?: string;
    availableAttachments: EmailAttachment[];
  } | null>(null);

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
    statusBast: 'Submit',
    notes: '',
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

  const allWOTypeFilterOptions: string[] = Array.from(
    new Set([...defaultWOOptions, ...bastList.map(b => b.woType), ...dailyReports.map(r => r.woType)].filter(Boolean))
  );
  const woOptions: WOOption[] = allWOTypeFilterOptions;

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
      statusBast: 'Submit',
      notes: '',
      originLocation: '',
      originCoordinates: '',
      destinationLocation: '',
      destinationCoordinates: '',
      routeGmapsUrl: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: BASTItem) => {
    setEditingId(item.id);
    setIsCustomWoType(!defaultWOOptions.includes(item.woType));
    setFormData({
      ...item,
      durasiDate: item.durasiDate ?? item.durationDays,
      abdDate: item.abdDate || item.finishDate || new Date().toISOString().substring(0, 10),
      coreConnectionDate: item.coreConnectionDate || item.finishDate || new Date().toISOString().substring(0, 10),
      originLocation: item.originLocation || '',
      originCoordinates: item.originCoordinates || '',
      destinationLocation: item.destinationLocation || '',
      destinationCoordinates: item.destinationCoordinates || '',
      routeGmapsUrl: item.routeGmapsUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleSelectWoNumber = (selectedWo: string) => {
    const matchingDaily = dailyReports.find(d => d.woNumber.toLowerCase() === selectedWo.toLowerCase());
    if (matchingDaily) {
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
        originLocation: matchingDaily.originLocation || '',
        originCoordinates: matchingDaily.originCoordinates || '',
        destinationLocation: matchingDaily.destinationLocation || '',
        destinationCoordinates: matchingDaily.destinationCoordinates || '',
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
                    <button onClick={() => setPreviewPdf(bast.apdPdf!)} className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-slate-750 flex items-center gap-1 cursor-pointer transition-colors" title={`Lihat ${bast.apdPdf.name}`}>
                      <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(bast.apdPdf.name).bgClass} ${getFileBadgeStyle(bast.apdPdf.name).textClass}`}>
                        [{getFileBadgeStyle(bast.apdPdf.name).ext}]
                      </span> APD
                    </button>
                  )}
                  {bast.abdPdf && (
                    <button onClick={() => setPreviewPdf(bast.abdPdf!)} className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-slate-750 flex items-center gap-1 cursor-pointer transition-colors" title={`Lihat ${bast.abdPdf.name}`}>
                      <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(bast.abdPdf.name).bgClass} ${getFileBadgeStyle(bast.abdPdf.name).textClass}`}>
                        [{getFileBadgeStyle(bast.abdPdf.name).ext}]
                      </span> ABD
                    </button>
                  )}
                  {bast.coreConnectionPdf && (
                    <button onClick={() => setPreviewPdf(bast.coreConnectionPdf!)} className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-slate-750 flex items-center gap-1 cursor-pointer transition-colors" title={`Lihat ${bast.coreConnectionPdf.name}`}>
                      <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(bast.coreConnectionPdf.name).bgClass} ${getFileBadgeStyle(bast.coreConnectionPdf.name).textClass}`}>
                        [{getFileBadgeStyle(bast.coreConnectionPdf.name).ext}]
                      </span> Core Conn
                    </button>
                  )}
                  {bast.fotoDokumentasiPdf && (
                    <button onClick={() => setPreviewPdf(bast.fotoDokumentasiPdf!)} className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-slate-750 flex items-center gap-1 cursor-pointer transition-colors" title={`Lihat ${bast.fotoDokumentasiPdf.name}`}>
                      <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${getFileBadgeStyle(bast.fotoDokumentasiPdf.name).bgClass} ${getFileBadgeStyle(bast.fotoDokumentasiPdf.name).textClass}`}>
                        [{getFileBadgeStyle(bast.fotoDokumentasiPdf.name).ext}]
                      </span> Foto Docs
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">{bast.id}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const baseUrl = 'https://project-belacom-xi9s.vercel.app';
                    const attachments: EmailAttachment[] = [
                      { 
                        name: `BAST_${bast.woNumber}.pdf`, 
                        url: `${baseUrl}/viewer?type=bast&wo=${encodeURIComponent(bast.woNumber)}`, 
                        sizeBytes: 1420000 
                      },
                      { 
                        name: bast.apdPdf?.name || `APD_${bast.woNumber}.pdf`, 
                        url: bast.apdPdf?.url || `${baseUrl}/viewer?type=apd&wo=${encodeURIComponent(bast.woNumber)}`, 
                        sizeBytes: bast.apdPdf?.sizeBytes || 980000 
                      },
                      { 
                        name: bast.abdPdf?.name || `ABD_${bast.woNumber}.pdf`, 
                        url: bast.abdPdf?.url || `${baseUrl}/viewer?type=abd&wo=${encodeURIComponent(bast.woNumber)}`, 
                        sizeBytes: bast.abdPdf?.sizeBytes || 1100000 
                      },
                      { 
                        name: bast.coreConnectionPdf?.name || `Core_Connection_${bast.woNumber}.pdf`, 
                        url: bast.coreConnectionPdf?.url || `${baseUrl}/viewer?type=core&wo=${encodeURIComponent(bast.woNumber)}`, 
                        sizeBytes: bast.coreConnectionPdf?.sizeBytes || 850000 
                      },
                      { 
                        name: bast.fotoDokumentasiPdf?.name || `Dokumentasi_Splicing_${bast.woNumber}.pdf`, 
                        url: bast.fotoDokumentasiPdf?.url || `${baseUrl}/viewer?type=foto&wo=${encodeURIComponent(bast.woNumber)}`, 
                        sizeBytes: bast.fotoDokumentasiPdf?.sizeBytes || 2400000 
                      }
                    ];

                    const relatedDaily = dailyReports.find(d => d.woNumber === bast.woNumber);
                    const segment = relatedDaily?.assignment ? `Area ${relatedDaily.assignment}` : (bast.notes || 'Area Jabodetabek');
                    const distance = bast.totalDistanceMeters 
                      ? `${bast.totalDistanceMeters.toLocaleString('id-ID')} m` 
                      : (bast.estimatedDistanceMeters ? `${bast.estimatedDistanceMeters.toLocaleString('id-ID')} m` : '-');
                    const docNumber = `BAST/${bast.woNumber}/BELACOM/${new Date().getFullYear()}`;

                    setEmailModalData({
                      bastId: bast.id,
                      requestType: 'BAST',
                      woNumber: bast.woNumber,
                      projectName: bast.workType,
                      vendorName: 'Belacom',
                      segmentLocation: segment,
                      realisasiJarak: distance,
                      documentNumber: docNumber,
                      availableAttachments: attachments
                    });
                  }}
                  className="px-2 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20 cursor-pointer flex items-center gap-1 text-[11px] font-semibold transition-colors"
                  title="Kirim Email Resmi BAST ke SAP"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kirim Email</span>
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

              {/* Tagging End to End Location Section */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
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

              <div>
                <PDFUploader
                  label="5. Foto Dokumentasi File (Maksimal Ukuran File 10 MB)"
                  value={formData.fotoDokumentasiPdf}
                  onChange={(f) => setFormData(p => ({ ...p, fotoDokumentasiPdf: f }))}
                  onPreview={(f) => setPreviewPdf(f)}
                  maxSizeMB={10}
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

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <TouchButton variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
                  Batal
                </TouchButton>
                <TouchButton variant="primary" size="md" type="submit" showFingerIcon>
                  Simpan Dokumen BAST
                </TouchButton>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      <PDFViewerModal file={previewPdf} onClose={() => setPreviewPdf(null)} />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        title="Konfirmasi Hapus Dokumen BAST"
        itemIdentifier={deleteTarget?.woNumber}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Send Email Modal */}
      {emailModalData && (
        <SendEmailModal
          isOpen={true}
          onClose={() => setEmailModalData(null)}
          defaultData={emailModalData}
        />
      )}

    </div>
  );
};
