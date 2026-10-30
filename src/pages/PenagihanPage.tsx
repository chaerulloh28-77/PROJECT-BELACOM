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
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Calendar,
  DollarSign,
  FileCheck,
  Check
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { PenagihanItem, StatusPenagihan, PDFFileMeta } from '../types';
import { TouchButton } from '../components/TouchButton';
import { PDFUploader } from '../components/PDFUploader';
import { PDFViewerModal } from '../components/PDFViewerModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { exportPenagihanToExcel, exportSinglePenagihanToExcel } from '../utils/excelExportWithImages';
import { exportSinglePenagihanToWord } from '../utils/wordExportService';
import { handleDateInputClick } from '../utils/dateUtils';

export const PenagihanPage: React.FC = () => {
  const { penagihanList, addPenagihan, updatePenagihan, deletePenagihan, showToast } = useProjectContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<PDFFileMeta | null>(null);

  // Detail Modal State (Read / View Detail)
  const [selectedDetailItem, setSelectedDetailItem] = useState<PenagihanItem | null>(null);

  // Delete Target Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; billingCode: string } | null>(null);

  // Loading States for exports
  const [isExportingWord, setIsExportingWord] = useState<string | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<PenagihanItem, 'id' | 'createdAt' | 'updatedAt'>>({
    billingCode: 'TAG/BEL/2026/10-003',
    woNumber: 'WO-BEL-2026-0082',
    tanggalSubmit: new Date().toISOString().substring(0, 10),
    statusPenagihan: 'Dalam Review',
    invoicePdf: undefined,
    bastPdf: undefined,
    apdPdf: undefined,
    abdPdf: undefined,
    coreConnectionPdf: undefined,
    fotoDokumentasiPdf: undefined,
    poPdf: undefined,
    dataMaterialPdf: undefined,
    boqPdf: undefined,
    fakturPajakPdf: undefined,
    totalNominalRupiah: 145000000,
    remarks: 'Paket berkas penagihan lengkap telah diverifikasi.'
  });

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      billingCode: `TAG/BEL/2026/10-${Math.floor(100 + Math.random() * 900)}`,
      woNumber: `WO-BEL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      tanggalSubmit: new Date().toISOString().substring(0, 10),
      statusPenagihan: 'Dalam Review',
      invoicePdf: undefined,
      bastPdf: undefined,
      apdPdf: undefined,
      abdPdf: undefined,
      coreConnectionPdf: undefined,
      fotoDokumentasiPdf: undefined,
      poPdf: undefined,
      dataMaterialPdf: undefined,
      boqPdf: undefined,
      fakturPajakPdf: undefined,
      totalNominalRupiah: 185000000,
      remarks: 'Seluruh lampiran penagihan lengkap dan siap kirim.'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: PenagihanItem) => {
    setEditingId(p.id);
    setFormData({
      ...p,
      tanggalSubmit: p.tanggalSubmit || new Date().toISOString().substring(0, 10)
    });
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
      showToast('success', 'Tagihan Diperbarui', `Paket penagihan ${formData.billingCode} berhasil diperbarui.`);
      if (selectedDetailItem && selectedDetailItem.id === editingId) {
        setSelectedDetailItem({ ...selectedDetailItem, ...formData });
      }
    } else {
      addPenagihan(formData);
      showToast('success', 'Tagihan Disimpan', `Paket penagihan baru ${formData.billingCode} berhasil ditambahkan.`);
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deletePenagihan(deleteTarget.id);
      showToast('success', 'Tagihan Dihapus', `Data penagihan ${deleteTarget.billingCode} telah dihapus.`);
      if (selectedDetailItem && selectedDetailItem.id === deleteTarget.id) {
        setSelectedDetailItem(null);
      }
      setDeleteTarget(null);
    }
  };

  const handleExportWord = async (item: PenagihanItem) => {
    try {
      setIsExportingWord(item.id);
      showToast('info', 'Menyiapkan Word (.docx)', `Menyusun dokumen berkas resmi ${item.billingCode}...`);
      await exportSinglePenagihanToWord(item);
      showToast('success', 'Word Tagihan Diunduh', `Dokumen Word paket penagihan ${item.billingCode} berhasil diunduh (.docx)!`);
    } catch (err) {
      console.error('Word export error:', err);
      showToast('error', 'Gagal Ekspor Word', 'Terjadi kendala saat menyusun berkas Word.');
    } finally {
      setIsExportingWord(null);
    }
  };

  const handleExportExcel = async (item: PenagihanItem) => {
    try {
      setIsExportingExcel(item.id);
      showToast('info', 'Menyiapkan Excel (.xlsx)', `Menyusun dokumen ${item.billingCode}...`);
      await exportSinglePenagihanToExcel(item);
      showToast('success', 'Excel Tagihan Diunduh', `Berkas penagihan ${item.billingCode} berhasil diunduh dalam format .xlsx!`);
    } catch (err) {
      console.error('Excel export error:', err);
      showToast('error', 'Gagal Ekspor Excel', 'Terjadi kendala saat menyusun berkas Excel.');
    } finally {
      setIsExportingExcel(null);
    }
  };

  const filteredPenagihan = penagihanList.filter(p =>
    p.billingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.woNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    Boolean(p.dailyReportWorkType?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 10 Components List Helper
  const get10Components = (item: PenagihanItem) => [
    { num: 1, name: 'Invoice / Kwitansi', file: item.invoicePdf || item.kwitansiPdf },
    { num: 2, name: 'BAST', file: item.bastPdf },
    { num: 3, name: 'APD', file: item.apdPdf },
    { num: 4, name: 'ABD', file: item.abdPdf },
    { num: 5, name: 'Core Connection', file: item.coreConnectionPdf },
    { num: 6, name: 'Foto Dokumentasi Lapangan', file: item.fotoDokumentasiPdf },
    { num: 7, name: 'Purchase Order (PO)', file: item.poPdf },
    { num: 8, name: 'Data Material', file: item.dataMaterialPdf },
    { num: 9, name: 'BOQ', file: item.boqPdf },
    { num: 10, name: 'Faktur Pajak', file: item.fakturPajakPdf }
  ];

  return (
    <div className="space-y-6 pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
            <CreditCard className="w-4 h-4" /> Paket Berkas Penagihan Lengkap
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Halaman Penagihan Belacom</h2>
          <p className="text-xs text-slate-400">Verifikasi Komponen Berkas Penagihan Lengkap & Ekspor Dokumen Resmi</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <TouchButton
            variant="success"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4" />}
            onClick={async () => {
              try {
                showToast('info', 'Menyiapkan Rekap Excel', 'Menyusun berkas rekap penagihan...');
                await exportPenagihanToExcel(filteredPenagihan);
                showToast('success', 'Rekap Excel Penagihan Diunduh', 'Rekap Excel 10 berkas penagihan berhasil diunduh dalam format .xlsx!');
              } catch (err) {
                console.error('Rekap Excel error:', err);
                showToast('error', 'Gagal Ekspor', 'Terjadi kendala saat menyusun berkas rekap Excel.');
              }
            }}
          >
            Export Rekap Excel (.xlsx)
          </TouchButton>

          <TouchButton
            variant="primary"
            size="md"
            icon={<Plus className="w-5 h-5" />}
            onClick={handleOpenAddModal}
            showFingerIcon
          >
            + Buat Tagihan
          </TouchButton>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Kode Penagihan atau No. WO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-cyan-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono shrink-0">
          Total: <span className="font-bold text-cyan-400">{filteredPenagihan.length}</span> Paket Tagihan
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3.5 font-semibold">No & Kode Penagihan</th>
                <th className="py-3 px-3.5 font-semibold">Total Nominal</th>
                <th className="py-3 px-3.5 font-semibold">Pekerjaan & Durasi</th>
                <th className="py-3 px-3.5 font-semibold">10 Komponen Berkas PDF</th>
                <th className="py-3 px-3.5 font-semibold text-center">Status</th>
                <th className="py-3 px-3.5 font-semibold text-center">Aksi Dokumen & Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredPenagihan.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                    Belum ada data paket penagihan yang cocok.
                  </td>
                </tr>
              ) : (
                filteredPenagihan.map((penagihan, index) => {
                  const comps = get10Components(penagihan);
                  const availableCount = comps.filter(c => Boolean(c.file)).length;

                  return (
                    <tr key={penagihan.id} className="hover:bg-slate-850/60 transition-colors">
                      
                      {/* Identity */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono text-[11px]">#{index + 1}</span>
                          <div>
                            <span className="font-bold text-cyan-400 font-mono block text-xs">{penagihan.billingCode}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">Ref WO: {penagihan.woNumber}</span>
                            <span className="text-[10px] text-emerald-400 font-mono block">
                              Tgl Submit: {penagihan.tanggalSubmit || penagihan.createdAt?.substring(0, 10) || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Total Nominal */}
                      <td className="py-3 px-3.5 font-mono font-bold text-emerald-400 text-sm whitespace-nowrap">
                        Rp {penagihan.totalNominalRupiah.toLocaleString('id-ID')}
                      </td>

                      {/* Work Details */}
                      <td className="py-3 px-3.5 font-mono text-[11px]">
                        <div className="text-slate-200 font-sans font-semibold line-clamp-1">{penagihan.dailyReportWorkType || 'Pekerjaan FO'}</div>
                        <div className="text-amber-400 text-[10px]">
                          {penagihan.dailyReportStartDate || '-'} s/d {penagihan.dailyReportFinishDate || '-'} ({penagihan.dailyReportDurationDays || 0} Hari)
                        </div>
                      </td>

                      {/* 10 Document Slots */}
                      <td className="py-3 px-3.5 font-mono">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              availableCount === 10 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              availableCount >= 5 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                              'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {availableCount}/10 Dokumen
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 text-[10px] max-w-xs">
                            {(penagihan.invoicePdf || penagihan.kwitansiPdf) && (
                              <button onClick={() => setPreviewPdf(penagihan.invoicePdf || penagihan.kwitansiPdf!)} className="px-1.5 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded flex items-center gap-1 cursor-pointer transition-colors" title="Lihat Invoice / Kwitansi PDF">
                                <Eye className="w-3 h-3 text-cyan-400" /> Inv
                              </button>
                            )}
                            {penagihan.bastPdf && (
                              <button onClick={() => setPreviewPdf(penagihan.bastPdf!)} className="px-1.5 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded flex items-center gap-1 cursor-pointer transition-colors" title="Lihat BAST PDF">
                                <Eye className="w-3 h-3 text-cyan-400" /> BAST
                              </button>
                            )}
                            {penagihan.apdPdf && (
                              <button onClick={() => setPreviewPdf(penagihan.apdPdf!)} className="px-1.5 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded flex items-center gap-1 cursor-pointer transition-colors" title="Lihat APD PDF">
                                <Eye className="w-3 h-3 text-cyan-400" /> APD
                              </button>
                            )}
                            {penagihan.abdPdf && (
                              <button onClick={() => setPreviewPdf(penagihan.abdPdf!)} className="px-1.5 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded flex items-center gap-1 cursor-pointer transition-colors" title="Lihat ABD PDF">
                                <Eye className="w-3 h-3 text-cyan-400" /> ABD
                              </button>
                            )}
                            {penagihan.coreConnectionPdf && (
                              <button onClick={() => setPreviewPdf(penagihan.coreConnectionPdf!)} className="px-1.5 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded flex items-center gap-1 cursor-pointer transition-colors" title="Lihat Core Connection PDF">
                                <Eye className="w-3 h-3 text-cyan-400" /> Core
                              </button>
                            )}
                            {penagihan.fotoDokumentasiPdf && (
                              <button onClick={() => setPreviewPdf(penagihan.fotoDokumentasiPdf!)} className="px-1.5 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded flex items-center gap-1 cursor-pointer transition-colors" title="Lihat Foto Dokumentasi PDF">
                                <FileText className="w-3 h-3 text-rose-400" /> Foto
                              </button>
                            )}
                            {penagihan.poPdf && (
                              <button onClick={() => setPreviewPdf(penagihan.poPdf!)} className="px-1.5 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded flex items-center gap-1 cursor-pointer transition-colors" title="Lihat PO PDF">
                                <Eye className="w-3 h-3 text-cyan-400" /> PO
                              </button>
                            )}
                            {penagihan.dataMaterialPdf && (
                              <button onClick={() => setPreviewPdf(penagihan.dataMaterialPdf!)} className="px-1.5 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded flex items-center gap-1 cursor-pointer transition-colors" title="Lihat Data Material PDF">
                                <Eye className="w-3 h-3 text-cyan-400" /> Mat
                              </button>
                            )}
                            {penagihan.boqPdf && (
                              <button onClick={() => setPreviewPdf(penagihan.boqPdf!)} className="px-1.5 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded flex items-center gap-1 cursor-pointer transition-colors" title="Lihat BOQ PDF">
                                <Eye className="w-3 h-3 text-cyan-400" /> BOQ
                              </button>
                            )}
                            {penagihan.fakturPajakPdf && (
                              <button onClick={() => setPreviewPdf(penagihan.fakturPajakPdf!)} className="px-1.5 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded flex items-center gap-1 cursor-pointer transition-colors" title="Lihat Faktur Pajak PDF">
                                <Eye className="w-3 h-3 text-amber-400" /> Faktur
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold whitespace-nowrap ${
                          penagihan.statusPenagihan === 'Lunas' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          penagihan.statusPenagihan === 'Disetujui' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                          penagihan.statusPenagihan === 'Dalam Review' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {penagihan.statusPenagihan}
                        </span>
                      </td>

                      {/* Row Action Buttons: Detail, Edit, Export Word, Export Excel, Delete */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. Lihat Detail Modal */}
                          <button
                            onClick={() => setSelectedDetailItem(penagihan)}
                            className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 cursor-pointer transition-colors border border-sky-500/20"
                            title="Lihat Detail & Galeri 10 Dokumen"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Edit Tagihan Modal */}
                          <button
                            onClick={() => handleOpenEditModal(penagihan)}
                            className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 hover:bg-cyan-500/20 cursor-pointer transition-colors border border-slate-700"
                            title="Edit Data Penagihan"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Export Word (.docx) */}
                          <button
                            disabled={isExportingWord === penagihan.id}
                            onClick={() => handleExportWord(penagihan)}
                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 cursor-pointer transition-colors border border-blue-500/20 disabled:opacity-50"
                            title="Download Word Dokumen Tagihan (.docx)"
                          >
                            {isExportingWord === penagihan.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FileText className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* 4. Export Excel (.xlsx) */}
                          <button
                            disabled={isExportingExcel === penagihan.id}
                            onClick={() => handleExportExcel(penagihan)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer transition-colors border border-emerald-500/20 disabled:opacity-50"
                            title="Download Excel Dokumen Tagihan (.xlsx)"
                          >
                            {isExportingExcel === penagihan.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* 5. Hapus Penagihan */}
                          <button
                            onClick={() => setDeleteTarget({ id: penagihan.id, billingCode: penagihan.billingCode })}
                            className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-colors border border-slate-700"
                            title="Hapus Penagihan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: LIHAT DETAIL TAGIHAN (READ / DETAIL GALLERY) */}
      {/* ======================================================== */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Detail Paket Berkas Penagihan
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                      {selectedDetailItem.billingCode}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Verifikasi kelengkapan dokumen & inspeksi berkas lampiran</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDetailItem(null)} 
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Nomor Referensi WO</div>
                  <div className="text-sm font-bold text-white font-mono mt-1">{selectedDetailItem.woNumber}</div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Status Penagihan</div>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                      selectedDetailItem.statusPenagihan === 'Lunas' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      selectedDetailItem.statusPenagihan === 'Disetujui' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                      selectedDetailItem.statusPenagihan === 'Dalam Review' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {selectedDetailItem.statusPenagihan}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Tanggal Pengajuan</div>
                  <div className="text-xs font-bold text-slate-200 font-mono mt-1">
                    {selectedDetailItem.tanggalSubmit || selectedDetailItem.createdAt?.substring(0, 10) || '-'}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <div className="text-[11px] text-emerald-400 font-medium">Total Nominal Tagihan</div>
                  <div className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">
                    Rp {selectedDetailItem.totalNominalRupiah.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Work Details & Remarks */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2">
                  <span className="text-slate-400">Pekerjaan Lapangan:</span>
                  <span className="font-semibold text-slate-200">{selectedDetailItem.dailyReportWorkType || 'Pekerjaan Infrastruktur Telekomunikasi'}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2">
                  <span className="text-slate-400">Durasi Pelaksanaan:</span>
                  <span className="font-mono text-amber-400">
                    {selectedDetailItem.dailyReportStartDate || '-'} s/d {selectedDetailItem.dailyReportFinishDate || '-'} ({selectedDetailItem.dailyReportDurationDays || 0} Hari Kerja)
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pt-1">
                  <span className="text-slate-400 shrink-0">Catatan / Remarks:</span>
                  <span className="text-slate-300 italic text-right sm:text-left">{selectedDetailItem.remarks || 'Tidak ada catatan tambahan.'}</span>
                </div>
              </div>

              {/* Interactive Gallery: 10 Components */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> Matriks Galeri 10 Komponen Berkas
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {get10Components(selectedDetailItem).filter(c => Boolean(c.file)).length} dari 10 Berkas Tersedia
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {get10Components(selectedDetailItem).map((comp) => {
                    const isAttached = Boolean(comp.file && (comp.file.url || comp.file.name));

                    return (
                      <div
                        key={comp.num}
                        className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                          isAttached
                            ? 'bg-slate-950/80 border-slate-700/80 hover:border-cyan-500/50 shadow-sm'
                            : 'bg-slate-950/30 border-slate-800/40 opacity-75'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="text-[11px] font-bold text-slate-300 line-clamp-1">
                              {comp.num}. {comp.name}
                            </span>
                            {isAttached ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            )}
                          </div>

                          <div className="text-[10px] text-slate-400 mb-2 truncate">
                            {isAttached ? (
                              comp.file?.name || 'Dokumen Terlampir'
                            ) : (
                              <span className="italic text-slate-500">Belum diunggah</span>
                            )}
                          </div>
                        </div>

                        {isAttached && comp.file ? (
                          <button
                            type="button"
                            onClick={() => setPreviewPdf(comp.file!)}
                            className="w-full py-1.5 px-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 rounded-lg text-[10px] font-mono flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3 h-3" /> Pratinjau Berkas
                          </button>
                        ) : (
                          <div className="text-[10px] text-center text-slate-600 py-1 bg-slate-900 rounded-lg border border-slate-800">
                            Kosong
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-850 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <TouchButton
                  variant="primary"
                  size="sm"
                  icon={<FileText className="w-4 h-4" />}
                  disabled={isExportingWord === selectedDetailItem.id}
                  onClick={() => handleExportWord(selectedDetailItem)}
                >
                  {isExportingWord === selectedDetailItem.id ? 'Menyusun Word...' : 'Export Word (.docx)'}
                </TouchButton>

                <TouchButton
                  variant="success"
                  size="sm"
                  icon={<FileSpreadsheet className="w-4 h-4" />}
                  disabled={isExportingExcel === selectedDetailItem.id}
                  onClick={() => handleExportExcel(selectedDetailItem)}
                >
                  Export Excel (.xlsx)
                </TouchButton>
              </div>

              <div className="flex items-center gap-2">
                <TouchButton
                  variant="secondary"
                  size="sm"
                  icon={<Edit3 className="w-4 h-4" />}
                  onClick={() => {
                    const item = selectedDetailItem;
                    setSelectedDetailItem(null);
                    handleOpenEditModal(item);
                  }}
                >
                  Edit Data Tagihan
                </TouchButton>

                <TouchButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedDetailItem(null)}
                >
                  Tutup
                </TouchButton>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: INPUT / EDIT TAGIHAN (CREATE & UPDATE) */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                {editingId ? 'Edit Tagihan' : 'Input Tagihan Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                  <label className="text-xs font-semibold text-slate-300 block mb-1">WO Ref Number</label>
                  <input
                    type="text"
                    required
                    value={formData.woNumber}
                    onChange={(e) => setFormData(p => ({ ...p, woNumber: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Tanggal Submit</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalSubmit || new Date().toISOString().substring(0, 10)}
                    onChange={(e) => setFormData(p => ({ ...p, tanggalSubmit: e.target.value }))}
                    onClick={handleDateInputClick}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500 cursor-pointer"
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

              {/* Komponen Berkas Upload Grid */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase font-mono">
                  Komponen Berkas Penagihan (10 Slot Dokumen)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <PDFUploader label="1. Invoice / Kwitansi" value={formData.invoicePdf} onChange={(f) => setFormData(p => ({ ...p, invoicePdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="2. BAST" value={formData.bastPdf} onChange={(f) => setFormData(p => ({ ...p, bastPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="3. APD" value={formData.apdPdf} onChange={(f) => setFormData(p => ({ ...p, apdPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="4. ABD" value={formData.abdPdf} onChange={(f) => setFormData(p => ({ ...p, abdPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="5. Core Connection" value={formData.coreConnectionPdf} onChange={(f) => setFormData(p => ({ ...p, coreConnectionPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="6. Foto Dokumentasi" value={formData.fotoDokumentasiPdf} onChange={(f) => setFormData(p => ({ ...p, fotoDokumentasiPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="7. Purchase Order (PO)" value={formData.poPdf} onChange={(f) => setFormData(p => ({ ...p, poPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="8. Data Material" value={formData.dataMaterialPdf} onChange={(f) => setFormData(p => ({ ...p, dataMaterialPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="9. BOQ" value={formData.boqPdf} onChange={(f) => setFormData(p => ({ ...p, boqPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="10. Faktur Pajak" value={formData.fakturPajakPdf} onChange={(f) => setFormData(p => ({ ...p, fakturPajakPdf: f, fakturPajak: f ? (f.name || f.url) : null }))} onPreview={(f) => setPreviewPdf(f)} />
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

              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {editingId && (
                    <>
                      <TouchButton
                        variant="primary"
                        size="sm"
                        type="button"
                        icon={<FileText className="w-4 h-4" />}
                        onClick={() => handleExportWord({ id: editingId, ...formData } as PenagihanItem)}
                      >
                        Export Word (.docx)
                      </TouchButton>

                      <TouchButton
                        variant="success"
                        size="sm"
                        type="button"
                        icon={<FileSpreadsheet className="w-4 h-4" />}
                        onClick={() => handleExportExcel({ id: editingId, ...formData } as PenagihanItem)}
                      >
                        Export Excel (.xlsx)
                      </TouchButton>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <TouchButton variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </TouchButton>
                  <TouchButton variant="primary" size="md" type="submit" showFingerIcon>
                    {editingId ? 'Simpan Perubahan' : 'Simpan Paket Penagihan'}
                  </TouchButton>
                </div>
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

    </div>
  );
};
