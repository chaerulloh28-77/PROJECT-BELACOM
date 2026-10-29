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
  FileSpreadsheet
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { PenagihanItem, StatusPenagihan, PDFFileMeta } from '../types';
import { TouchButton } from '../components/TouchButton';
import { PDFUploader } from '../components/PDFUploader';
import { PDFViewerModal } from '../components/PDFViewerModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { exportPenagihanToExcel, exportSinglePenagihanToExcel } from '../utils/excelExportWithImages';

export const PenagihanPage: React.FC = () => {
  const { penagihanList, addPenagihan, updatePenagihan, deletePenagihan, showToast, dailyReports } = useProjectContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<PDFFileMeta | null>(null);

  // Delete Target Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; billingCode: string } | null>(null);

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
    Boolean(p.dailyReportWorkType?.toLowerCase().includes(searchQuery.toLowerCase()))
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
          <p className="text-xs text-slate-400">Verifikasi Komponen Berkas Penagihan Lengkap Kepada Klien</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <TouchButton
            variant="success"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4" />}
            onClick={() => {
              exportPenagihanToExcel(filteredPenagihan);
              showToast('success', 'Rekap Excel Penagihan Diunduh', 'Rekap Excel 9 berkas penagihan berhasil diunduh dalam format .xlsx!');
            }}
          >
            Export Rekap Berkas Penagihan (.xlsx)
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

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">No & Kode Penagihan</th>
                <th className="py-2.5 px-3 font-semibold">Total Nominal</th>
                <th className="py-2.5 px-3 font-semibold">Pekerjaan & Durasi</th>
                <th className="py-2.5 px-3 font-semibold">Komponen Berkas PDF</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredPenagihan.map((penagihan, index) => (
                <tr key={penagihan.id} className="hover:bg-slate-850/60 transition-colors">
                  
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-[11px]">#{index + 1}</span>
                      <div>
                        <span className="font-bold text-cyan-400 font-mono block">{penagihan.billingCode}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">Ref WO: {penagihan.woNumber}</span>
                        <span className="text-[10px] text-emerald-400 font-mono block">Tgl Submit: {penagihan.tanggalSubmit || penagihan.createdAt?.substring(0, 10) || '-'}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 text-sm">
                    Rp {penagihan.totalNominalRupiah.toLocaleString('id-ID')}
                  </td>

                  <td className="py-2.5 px-3 font-mono text-[11px]">
                    <div className="text-slate-200 font-sans font-semibold">{penagihan.dailyReportWorkType || '-'}</div>
                    <div className="text-amber-400 text-[10px]">
                      {penagihan.dailyReportStartDate} s/d {penagihan.dailyReportFinishDate} ({penagihan.dailyReportDurationDays || 0} Hari)
                    </div>
                  </td>

                  <td className="py-2.5 px-3 font-mono">
                    <div className="flex flex-wrap gap-1 text-[10px] max-w-xs">
                      {(penagihan.invoicePdf || penagihan.kwitansiPdf) && (
                        <button onClick={() => setPreviewPdf(penagihan.invoicePdf || penagihan.kwitansiPdf!)} className="px-1.5 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded flex items-center gap-1 cursor-pointer transition-colors" title="Lihat Invoice / Kwitansi PDF">
                          <Eye className="w-3 h-3 text-cyan-400" /> Inv / Kwitansi
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
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                      penagihan.statusPenagihan === 'Lunas' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      penagihan.statusPenagihan === 'Disetujui' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                      penagihan.statusPenagihan === 'Dalam Review' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {penagihan.statusPenagihan}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          exportSinglePenagihanToExcel(penagihan);
                          showToast('success', 'Excel Tagihan Diunduh', `Berkas penagihan ${penagihan.billingCode} berhasil diunduh dalam format .xlsx!`);
                        }}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer transition-colors"
                        title="Download Excel Dokumen Tagihan Ini"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(penagihan)}
                        className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 hover:bg-cyan-500/20 cursor-pointer"
                        title="Edit Penagihan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: penagihan.id, billingCode: penagihan.billingCode })}
                        className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                        title="Hapus Penagihan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
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

              {/* Komponen Berkas Upload Grid */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase font-mono">
                  Komponen Berkas Penagihan
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <PDFUploader label="1. Invoice / Kwitansi" value={formData.invoicePdf} onChange={(f) => setFormData(p => ({ ...p, invoicePdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="2. BAST" value={formData.bastPdf} onChange={(f) => setFormData(p => ({ ...p, bastPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="3. APD" value={formData.apdPdf} onChange={(f) => setFormData(p => ({ ...p, apdPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="4. ABD" value={formData.abdPdf} onChange={(f) => setFormData(p => ({ ...p, abdPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="5. Core Connection" value={formData.coreConnectionPdf} onChange={(f) => setFormData(p => ({ ...p, coreConnectionPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="6. Foto Dokumentasi" value={formData.fotoDokumentasiPdf} onChange={(f) => setFormData(p => ({ ...p, fotoDokumentasiPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="7. Purchase Order (PO)" value={formData.poPdf} onChange={(f) => setFormData(p => ({ ...p, poPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="8. Data Material" value={formData.dataMaterialPdf} onChange={(f) => setFormData(p => ({ ...p, dataMaterialPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
                  <PDFUploader label="9. BOQ" value={formData.boqPdf} onChange={(f) => setFormData(p => ({ ...p, boqPdf: f }))} onPreview={(f) => setPreviewPdf(f)} />
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
                <div>
                  {editingId && (
                    <TouchButton
                      variant="success"
                      size="md"
                      type="button"
                      icon={<FileSpreadsheet className="w-4 h-4" />}
                      onClick={() => {
                        exportSinglePenagihanToExcel({ id: editingId, ...formData } as PenagihanItem);
                        showToast('success', 'Excel Tagihan Diunduh', `Berkas penagihan ${formData.billingCode} berhasil diunduh!`);
                      }}
                    >
                      Export Excel Tagihan Ini (.xlsx)
                    </TouchButton>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <TouchButton variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </TouchButton>
                  <TouchButton variant="primary" size="md" type="submit" showFingerIcon>
                    Simpan Paket Penagihan
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
