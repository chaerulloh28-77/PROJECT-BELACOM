import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  X,
  Eye,
  FileText,
  Mail
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { PenagihanItem, StatusPenagihan, PDFFileMeta } from '../types';
import { TouchButton } from '../components/TouchButton';
import { PDFUploader } from '../components/PDFUploader';
import { PDFViewerModal } from '../components/PDFViewerModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { SendEmailModal } from '../components/SendEmailModal';
import { EmailAttachment } from '../utils/emailTemplate';

export const PenagihanPage: React.FC = () => {
  const { penagihanList, addPenagihan, updatePenagihan, deletePenagihan, showToast, dailyReports } = useProjectContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<PDFFileMeta | null>(null);

  // Email Submission Modal State
  const [emailModalData, setEmailModalData] = useState<{
    requestType: 'Penagihan';
    woNumber: string;
    projectName: string;
    vendorName?: string;
    mitraPelaksana?: string;
    statusDokumen?: string;
    defaultRecipient?: string;
    defaultRecipientName?: string;
    availableAttachments: EmailAttachment[];
  } | null>(null);

  // Delete Target Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; billingCode: string } | null>(null);

  const [formData, setFormData] = useState<Omit<PenagihanItem, 'id' | 'createdAt' | 'updatedAt'>>({
    billingCode: 'TAG/BEL/2026/10-003',
    woNumber: 'WO-BEL-2026-0082',
    statusPenagihan: 'Dalam Review',
    invoicePdf: undefined,
    bastPdf: undefined,
    apdPdf: undefined,
    abdPdf: undefined,
    coreConnectionPdf: undefined,
    fotoDokumentasiPdf: undefined, // Max 4MB enforce
    dailyReportWorkType: 'Splicing FO Core 48 & Commissioning OTDR Test',
    dailyReportReleaseDate: new Date().toISOString().substring(0, 10),
    dailyReportStartDate: new Date().toISOString().substring(0, 10),
    dailyReportFinishDate: new Date(Date.now() + 5 * 86400000).toISOString().substring(0, 10),
    dailyReportDurationDays: 5,
    dailyReportEstimatedDistanceMeters: 1200,
    dailyReportEstimatedDistancePdf: undefined,
    dailyReportTotalDistanceMeters: 1195,
    dailyReportTotalDistancePdf: undefined,
    poPdf: undefined,
    dataMaterialPdf: undefined,
    boqPdf: undefined,
    fakturPajakPdf: undefined,
    rfsPdf: undefined,
    totalNominalRupiah: 145000000,
    remarks: 'Paket berkas penagihan lengkap 13 item telah diverifikasi.'
  });

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      billingCode: `TAG/BEL/2026/10-${Math.floor(100 + Math.random() * 900)}`,
      woNumber: `WO-BEL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      statusPenagihan: 'Dalam Review',
      invoicePdf: undefined,
      bastPdf: undefined,
      apdPdf: undefined,
      abdPdf: undefined,
      coreConnectionPdf: undefined,
      fotoDokumentasiPdf: undefined,
      dailyReportWorkType: 'Splicing FO Core & Testing Interkoneksi POP',
      dailyReportReleaseDate: new Date().toISOString().substring(0, 10),
      dailyReportStartDate: new Date().toISOString().substring(0, 10),
      dailyReportFinishDate: new Date(Date.now() + 6 * 86400000).toISOString().substring(0, 10),
      dailyReportDurationDays: 6,
      dailyReportEstimatedDistanceMeters: 1800,
      dailyReportEstimatedDistancePdf: undefined,
      dailyReportTotalDistanceMeters: 1780,
      dailyReportTotalDistancePdf: undefined,
      poPdf: undefined,
      dataMaterialPdf: undefined,
      boqPdf: undefined,
      fakturPajakPdf: undefined,
      rfsPdf: undefined,
      totalNominalRupiah: 185000000,
      remarks: 'Seluruh lampiran penagihan lengkap dan siap kirim.'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: PenagihanItem) => {
    setEditingId(p.id);
    setFormData({ ...p });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.billingCode.trim() || !formData.woNumber.trim()) {
      showToast('error', 'Validasi Gagal', 'Harap isi Kode Penagihan dan Nomor WO!');
      return;
    }

    if (editingId) {
      updatePenagihan(editingId, formData);
    } else {
      addPenagihan(formData);
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deletePenagihan(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const filteredPenagihan = penagihanList.filter(p =>
    p.billingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.woNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.dailyReportWorkType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
            <CreditCard className="w-4 h-4" /> Paket Berkas Penagihan Lengkap
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Halaman Penagihan Belacom</h2>
          <p className="text-xs text-slate-400">Verifikasi 13 Komponen Berkas Penagihan Lengkap Kepada Klien</p>
        </div>

        <TouchButton
          variant="primary"
          size="md"
          icon={<Plus className="w-5 h-5" />}
          onClick={handleOpenAddModal}
          showFingerIcon
        >
          + Buat Paket Penagihan
        </TouchButton>
      </div>

      {/* Search */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Kode Penagihan atau No. WO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-3 py-2 outline-none"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPenagihan.map((penagihan) => (
          <div key={penagihan.id} className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-xl transition-all">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">KODE PENAGIHAN</span>
                <span className="text-base font-extrabold text-cyan-400 font-mono">{penagihan.billingCode}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                penagihan.statusPenagihan === 'Lunas' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                penagihan.statusPenagihan === 'Disetujui' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                penagihan.statusPenagihan === 'Dalam Review' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {penagihan.statusPenagihan}
              </span>
            </div>

            <div className="space-y-3 mb-4 text-xs font-mono">
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 text-[10px] block">REF WO NUMBER</span>
                  <span className="text-white font-bold">{penagihan.woNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px] block">TOTAL NOMINAL</span>
                  <span className="text-emerald-400 font-extrabold text-sm">
                    Rp {penagihan.totalNominalRupiah.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px]">
                <span className="text-slate-500 block text-[10px] uppercase">Pekerjaan Daily Report Team:</span>
                <span className="text-slate-200 font-sans font-semibold block">{penagihan.dailyReportWorkType}</span>
                <span className="text-amber-400 text-[10px] mt-0.5 block">
                  {penagihan.dailyReportStartDate} s/d {penagihan.dailyReportFinishDate} ({penagihan.dailyReportDurationDays} Hari)
                </span>
              </div>

              {/* 13 Item Berkas List Badges with interactive preview onClick */}
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1.5">13 KOMPONEN BERKAS PDF (KLIK UNTUK PRATINJAU):</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
                  {penagihan.invoicePdf && (
                    <button onClick={() => setPreviewPdf(penagihan.invoicePdf!)} className="p-1 bg-slate-950 rounded border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500 text-left truncate cursor-pointer flex items-center gap-1" title="Lihat Invoice PDF">
                      <Eye className="w-3 h-3 text-cyan-400 shrink-0" /> 1. Invoice
                    </button>
                  )}
                  {penagihan.bastPdf && (
                    <button onClick={() => setPreviewPdf(penagihan.bastPdf!)} className="p-1 bg-slate-950 rounded border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500 text-left truncate cursor-pointer flex items-center gap-1" title="Lihat BAST PDF">
                      <Eye className="w-3 h-3 text-cyan-400 shrink-0" /> 2. BAST
                    </button>
                  )}
                  {penagihan.apdPdf && (
                    <button onClick={() => setPreviewPdf(penagihan.apdPdf!)} className="p-1 bg-slate-950 rounded border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500 text-left truncate cursor-pointer flex items-center gap-1" title="Lihat APD PDF">
                      <Eye className="w-3 h-3 text-cyan-400 shrink-0" /> 4. APD
                    </button>
                  )}
                  {penagihan.abdPdf && (
                    <button onClick={() => setPreviewPdf(penagihan.abdPdf!)} className="p-1 bg-slate-950 rounded border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500 text-left truncate cursor-pointer flex items-center gap-1" title="Lihat ABD PDF">
                      <Eye className="w-3 h-3 text-cyan-400 shrink-0" /> 5. ABD
                    </button>
                  )}
                  {penagihan.coreConnectionPdf && (
                    <button onClick={() => setPreviewPdf(penagihan.coreConnectionPdf!)} className="p-1 bg-slate-950 rounded border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500 text-left truncate cursor-pointer flex items-center gap-1" title="Lihat Core Conn PDF">
                      <Eye className="w-3 h-3 text-cyan-400 shrink-0" /> 6. Core Conn
                    </button>
                  )}
                  {penagihan.fotoDokumentasiPdf && (
                    <button onClick={() => setPreviewPdf(penagihan.fotoDokumentasiPdf!)} className="p-1 bg-slate-950 rounded border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 hover:border-rose-500 text-left truncate cursor-pointer flex items-center gap-1" title="Lihat Foto Docs PDF">
                      <FileText className="w-3 h-3 text-rose-400 shrink-0" /> 7. Foto Docs
                    </button>
                  )}
                  {penagihan.dailyReportEstimatedDistancePdf && (
                    <button onClick={() => setPreviewPdf(penagihan.dailyReportEstimatedDistancePdf!)} className="p-1 bg-slate-950 rounded border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500 text-left truncate cursor-pointer flex items-center gap-1" title="Lihat Est Jarak PDF">
                      <Eye className="w-3 h-3 text-cyan-400 shrink-0" /> 8. Est Jarak
                    </button>
                  )}
                  {penagihan.dailyReportTotalDistancePdf && (
                    <button onClick={() => setPreviewPdf(penagihan.dailyReportTotalDistancePdf!)} className="p-1 bg-slate-950 rounded border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500 text-left truncate cursor-pointer flex items-center gap-1" title="Lihat Tot Jarak PDF">
                      <Eye className="w-3 h-3 text-cyan-400 shrink-0" /> 8. Tot Jarak
                    </button>
                  )}
                  {penagihan.poPdf && (
                    <button onClick={() => setPreviewPdf(penagihan.poPdf!)} className="p-1 bg-slate-950 rounded border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500 text-left truncate cursor-pointer flex items-center gap-1" title="Lihat PO PDF">
                      <Eye className="w-3 h-3 text-cyan-400 shrink-0" /> 9. PO PDF
                    </button>
                  )}
                  {penagihan.dataMaterialPdf && (
                    <button onClick={() => setPreviewPdf(penagihan.dataMaterialPdf!)} className="p-1 bg-slate-950 rounded border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500 text-left truncate cursor-pointer flex items-center gap-1" title="Lihat Data Material PDF">
                      <Eye className="w-3 h-3 text-cyan-400 shrink-0" /> 10. Material
                    </button>
                  )}
                  {penagihan.boqPdf && (
                    <button onClick={() => setPreviewPdf(penagihan.boqPdf!)} className="p-1 bg-slate-950 rounded border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500 text-left truncate cursor-pointer flex items-center gap-1" title="Lihat BOQ PDF">
                      <Eye className="w-3 h-3 text-cyan-400 shrink-0" /> 11. BOQ PDF
                    </button>
                  )}
                  {penagihan.fakturPajakPdf && (
                    <button onClick={() => setPreviewPdf(penagihan.fakturPajakPdf!)} className="p-1 bg-slate-950 rounded border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500 text-left truncate cursor-pointer flex items-center gap-1" title="Lihat Faktur Pajak PDF">
                      <Eye className="w-3 h-3 text-cyan-400 shrink-0" /> 12. F. Pajak
                    </button>
                  )}
                  {penagihan.rfsPdf && (
                    <button onClick={() => setPreviewPdf(penagihan.rfsPdf!)} className="p-1 bg-slate-950 rounded border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500 text-left truncate cursor-pointer flex items-center gap-1" title="Lihat RFS PDF">
                      <FileText className="w-3 h-3 text-cyan-400 shrink-0" /> 13. RFS PDF
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">{penagihan.remarks}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const attachments: EmailAttachment[] = [];
                    if (penagihan.invoicePdf) attachments.push({ name: penagihan.invoicePdf.name, url: penagihan.invoicePdf.url, sizeBytes: penagihan.invoicePdf.sizeBytes });
                    if (penagihan.bastPdf) attachments.push({ name: penagihan.bastPdf.name, url: penagihan.bastPdf.url, sizeBytes: penagihan.bastPdf.sizeBytes });
                    if (penagihan.apdPdf) attachments.push({ name: penagihan.apdPdf.name, url: penagihan.apdPdf.url, sizeBytes: penagihan.apdPdf.sizeBytes });
                    if (penagihan.abdPdf) attachments.push({ name: penagihan.abdPdf.name, url: penagihan.abdPdf.url, sizeBytes: penagihan.abdPdf.sizeBytes });
                    if (penagihan.coreConnectionPdf) attachments.push({ name: penagihan.coreConnectionPdf.name, url: penagihan.coreConnectionPdf.url, sizeBytes: penagihan.coreConnectionPdf.sizeBytes });
                    if (penagihan.fotoDokumentasiPdf) attachments.push({ name: penagihan.fotoDokumentasiPdf.name, url: penagihan.fotoDokumentasiPdf.url, sizeBytes: penagihan.fotoDokumentasiPdf.sizeBytes });
                    if (penagihan.dailyReportEstimatedDistancePdf) attachments.push({ name: penagihan.dailyReportEstimatedDistancePdf.name, url: penagihan.dailyReportEstimatedDistancePdf.url, sizeBytes: penagihan.dailyReportEstimatedDistancePdf.sizeBytes });
                    if (penagihan.dailyReportTotalDistancePdf) attachments.push({ name: penagihan.dailyReportTotalDistancePdf.name, url: penagihan.dailyReportTotalDistancePdf.url, sizeBytes: penagihan.dailyReportTotalDistancePdf.sizeBytes });
                    if (penagihan.poPdf) attachments.push({ name: penagihan.poPdf.name, url: penagihan.poPdf.url, sizeBytes: penagihan.poPdf.sizeBytes });
                    if (penagihan.dataMaterialPdf) attachments.push({ name: penagihan.dataMaterialPdf.name, url: penagihan.dataMaterialPdf.url, sizeBytes: penagihan.dataMaterialPdf.sizeBytes });
                    if (penagihan.boqPdf) attachments.push({ name: penagihan.boqPdf.name, url: penagihan.boqPdf.url, sizeBytes: penagihan.boqPdf.sizeBytes });
                    if (penagihan.fakturPajakPdf) attachments.push({ name: penagihan.fakturPajakPdf.name, url: penagihan.fakturPajakPdf.url, sizeBytes: penagihan.fakturPajakPdf.sizeBytes });
                    if (penagihan.rfsPdf) attachments.push({ name: penagihan.rfsPdf.name, url: penagihan.rfsPdf.url, sizeBytes: penagihan.rfsPdf.sizeBytes });

                    if (attachments.length === 0) {
                      attachments.push(
                        { name: `Invoice_Penagihan_${penagihan.billingCode.replace(/\//g, '_')}.pdf`, sizeBytes: 1540000 },
                        { name: `BAST_${penagihan.woNumber}.pdf`, sizeBytes: 1420000 },
                        { name: `APD_Relokasi_${penagihan.woNumber}.pdf`, sizeBytes: 980000 },
                        { name: `ABD_Relokasi_${penagihan.woNumber}.pdf`, sizeBytes: 910000 },
                        { name: `Core_Connection_${penagihan.woNumber}.pdf`, sizeBytes: 850000 },
                        { name: `Dokumentasi_Foto_${penagihan.woNumber}.pdf`, sizeBytes: 2400000 },
                        { name: `Daily_Report_Team_${penagihan.woNumber}.pdf`, sizeBytes: 1100000 },
                        { name: `PO_Telkom_${penagihan.woNumber}.pdf`, sizeBytes: 890000 },
                        { name: `Data_Material_${penagihan.woNumber}.pdf`, sizeBytes: 760000 },
                        { name: `BOQ_Approved_${penagihan.woNumber}.pdf`, sizeBytes: 950000 },
                        { name: `Faktur_Pajak_${penagihan.woNumber}.pdf`, sizeBytes: 620000 },
                        { name: `RFS_ReadyForService_${penagihan.woNumber}.pdf`, sizeBytes: 1250000 }
                      );
                    }

                    const relatedDaily = dailyReports.find(d => d.woNumber === penagihan.woNumber);
                    const uraian = penagihan.dailyReportWorkType || relatedDaily?.workType || `Paket Tagihan ${penagihan.billingCode}`;
                    const statusDok = penagihan.statusPenagihan === 'Disetujui' || penagihan.statusPenagihan === 'Lunas'
                      ? 'Lengkap 13 Checklist (Terverifikasi)'
                      : 'Lengkap 13 Checklist (Dalam Verifikasi)';

                    setEmailModalData({
                      requestType: 'Penagihan',
                      woNumber: penagihan.woNumber,
                      projectName: uraian,
                      vendorName: 'Belacom',
                      mitraPelaksana: 'PT. Belacom Indonesia Telecom',
                      statusDokumen: statusDok,
                      defaultRecipient: 'penagihan.kontrak@telkom.co.id',
                      defaultRecipientName: 'Tim Verifikasi Penagihan & Kontrak',
                      availableAttachments: attachments
                    });
                  }}
                  className="px-2 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20 cursor-pointer flex items-center gap-1 text-[11px] font-semibold transition-colors"
                  title="Kirim Email Resmi Penagihan ke SAP"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kirim Email</span>
                </button>
                <button onClick={() => handleOpenEditModal(penagihan)} className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 hover:bg-cyan-500/20 cursor-pointer" title="Edit Penagihan">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteTarget({ id: penagihan.id, billingCode: penagihan.billingCode })} className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20 cursor-pointer" title="Hapus Penagihan">
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                {editingId ? 'Edit Paket Penagihan' : 'Input Paket Penagihan Baru (13 Item)'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Kode Penagihan</label>
                  <input
                    type="text"
                    required
                    value={formData.billingCode}
                    onChange={(e) => setFormData(p => ({ ...p, billingCode: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs font-bold text-cyan-400 rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">3. WO Ref Number</label>
                  <input
                    type="text"
                    required
                    value={formData.woNumber}
                    onChange={(e) => setFormData(p => ({ ...p, woNumber: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Status Penagihan</label>
                  <select
                    value={formData.statusPenagihan}
                    onChange={(e) => setFormData(p => ({ ...p, statusPenagihan: e.target.value as StatusPenagihan }))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Dalam Review">Dalam Review</option>
                    <option value="Disetujui">Disetujui</option>
                    <option value="Lunas">Lunas</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>
              </div>

              {/* 13 Item Berkas Upload Grid */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase font-mono">
                  13 Komponen Lengkap Berkas Penagihan
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <PDFUploader label="1. Invoice Upload PDF" value={formData.invoicePdf} onChange={(f) => setFormData(p => ({ ...p, invoicePdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="2. BAST Upload PDF" value={formData.bastPdf} onChange={(f) => setFormData(p => ({ ...p, bastPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="4. APD Upload PDF" value={formData.apdPdf} onChange={(f) => setFormData(p => ({ ...p, apdPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="5. ABD Upload PDF" value={formData.abdPdf} onChange={(f) => setFormData(p => ({ ...p, abdPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="6. Core Connection PDF" value={formData.coreConnectionPdf} onChange={(f) => setFormData(p => ({ ...p, coreConnectionPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="7. Foto Docs PDF (Max 4MB)" value={formData.fotoDokumentasiPdf} onChange={(f) => setFormData(p => ({ ...p, fotoDokumentasiPdf: f }))} onPreview={(f) => setPreviewPdf(f)} maxSizeMB={4} />
                  <PDFUploader label="9. PO Upload PDF" value={formData.poPdf} onChange={(f) => setFormData(p => ({ ...p, poPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="10. Data Material PDF" value={formData.dataMaterialPdf} onChange={(f) => setFormData(p => ({ ...p, dataMaterialPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="11. BOQ Upload PDF" value={formData.boqPdf} onChange={(f) => setFormData(p => ({ ...p, boqPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="12. Faktur Pajak PDF" value={formData.fakturPajakPdf} onChange={(f) => setFormData(p => ({ ...p, fakturPajakPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="13. RFS Upload PDF" value={formData.rfsPdf} onChange={(f) => setFormData(p => ({ ...p, rfsPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                </div>
              </div>

              {/* 8. Daily Report Team Details */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase font-mono">
                  8. Daily Report Team Penagihan
                </h4>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Work Type (Core Search / Manual)</label>
                  <input
                    type="text"
                    required
                    value={formData.dailyReportWorkType}
                    onChange={(e) => setFormData(p => ({ ...p, dailyReportWorkType: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Release Date</label>
                    <input type="date" value={formData.dailyReportReleaseDate} onChange={(e) => setFormData(p => ({ ...p, dailyReportReleaseDate: e.target.value }))} className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Start Date</label>
                    <input type="date" value={formData.dailyReportStartDate} onChange={(e) => setFormData(p => ({ ...p, dailyReportStartDate: e.target.value }))} className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Finish Date</label>
                    <input type="date" value={formData.dailyReportFinishDate} onChange={(e) => setFormData(p => ({ ...p, dailyReportFinishDate: e.target.value }))} className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Durasi (Hari)</label>
                    <input type="number" value={formData.dailyReportDurationDays} onChange={(e) => setFormData(p => ({ ...p, dailyReportDurationDays: parseInt(e.target.value) || 1 }))} className="w-full bg-slate-900 border border-slate-800 text-xs text-amber-400 font-bold rounded-xl p-2 outline-none font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <PDFUploader label="Estimasi Jarak (m) PDF" value={formData.dailyReportEstimatedDistancePdf} onChange={(f) => setFormData(p => ({ ...p, dailyReportEstimatedDistancePdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="Total Jarak (m) PDF" value={formData.dailyReportTotalDistancePdf} onChange={(f) => setFormData(p => ({ ...p, dailyReportTotalDistancePdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Total Nominal Penagihan (Rupiah)</label>
                <input
                  type="number"
                  value={formData.totalNominalRupiah}
                  onChange={(e) => setFormData(p => ({ ...p, totalNominalRupiah: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-950 border border-slate-800 text-sm text-emerald-400 font-extrabold rounded-xl p-3 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Catatan / Remarks Penagihan</label>
                <textarea
                  rows={2}
                  value={formData.remarks}
                  onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))}
                  placeholder="Catatan status penagihan..."
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-3 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <TouchButton variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
                  Batal
                </TouchButton>
                <TouchButton variant="primary" size="md" type="submit" showFingerIcon>
                  Simpan Paket Penagihan
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
        title="Konfirmasi Hapus Paket Penagihan"
        itemIdentifier={deleteTarget?.billingCode}
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
