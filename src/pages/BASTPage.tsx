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
  Mail
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { BASTItem, WOOption, StatusBAST, PDFFileMeta } from '../types';
import { TouchButton } from '../components/TouchButton';
import { PDFUploader } from '../components/PDFUploader';
import { PDFViewerModal } from '../components/PDFViewerModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { SendEmailModal } from '../components/SendEmailModal';
import { EmailAttachment } from '../utils/emailTemplate';

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
    durationDays: 4,
    estimatedDistanceMeters: 1200,
    estimatedDistancePdf: undefined,
    totalDistanceMeters: 1195,
    totalDistancePdf: undefined,
    fotoDokumentasiPdf: undefined, // Max 4MB enforce
    statusBast: 'Submit',
    notes: ''
  });

  const woOptions: WOOption[] = [
    'Plan Network Interconection POP',
    'Splice Interconnection POP Mini',
    'Splice Interconnection Site',
    'Splice Interconnection POP'
  ];

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      woNumber: `WO-BEL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      woType: 'Splice Interconnection POP Mini',
      apdPdf: undefined,
      abdPdf: undefined,
      coreConnectionPdf: undefined,
      workType: 'Pencarian Core & Splicing Interkoneksi POP',
      releaseDate: new Date().toISOString().substring(0, 10),
      startDate: new Date().toISOString().substring(0, 10),
      finishDate: new Date(Date.now() + 5 * 86400000).toISOString().substring(0, 10),
      durationDays: 5,
      estimatedDistanceMeters: 1500,
      estimatedDistancePdf: undefined,
      totalDistanceMeters: 1480,
      totalDistancePdf: undefined,
      fotoDokumentasiPdf: undefined,
      statusBast: 'Submit',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: BASTItem) => {
    setEditingId(item.id);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.woNumber.trim() || !formData.workType.trim()) {
      showToast('error', 'Validasi Gagal', 'Harap isi bidang No WO dan Jenis Pekerjaan!');
      return;
    }

    if (editingId) {
      updateBAST(editingId, formData);
    } else {
      addBAST(formData);
    }
    setIsModalOpen(false);
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
          <h2 className="text-xl font-bold text-white mt-1">Dokumen BAST Belacom</h2>
          <p className="text-xs text-slate-400">Verifikasi Berkas APD, ABD, Core Connection, & Daily Report</p>
        </div>

        <TouchButton
          variant="primary"
          size="md"
          icon={<Plus className="w-5 h-5" />}
          onClick={handleOpenAddModal}
          showFingerIcon
        >
          + Buat BAST Baru
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
                
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Release Date:</span>
                    <span className="text-slate-200">{bast.releaseDate}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Timeline:</span>
                    <span className="text-slate-200">{bast.startDate} - {bast.finishDate}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Durasi & Distance:</span>
                    <span className="text-amber-400 font-bold">{bast.durationDays} Hari ({bast.totalDistanceMeters}m)</span>
                  </div>
                </div>

                {/* PDF Attachments interactive click-to-view badges */}
                <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-mono">
                  {bast.apdPdf && (
                    <button onClick={() => setPreviewPdf(bast.apdPdf!)} className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/20 flex items-center gap-1 cursor-pointer transition-colors" title="Lihat APD PDF">
                      <Eye className="w-3 h-3 text-cyan-400" /> APD
                    </button>
                  )}
                  {bast.abdPdf && (
                    <button onClick={() => setPreviewPdf(bast.abdPdf!)} className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/20 flex items-center gap-1 cursor-pointer transition-colors" title="Lihat ABD PDF">
                      <Eye className="w-3 h-3 text-cyan-400" /> ABD
                    </button>
                  )}
                  {bast.coreConnectionPdf && (
                    <button onClick={() => setPreviewPdf(bast.coreConnectionPdf!)} className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/20 flex items-center gap-1 cursor-pointer transition-colors" title="Lihat Core Connection PDF">
                      <Eye className="w-3 h-3 text-cyan-400" /> Core Conn
                    </button>
                  )}
                  {bast.fotoDokumentasiPdf && (
                    <button onClick={() => setPreviewPdf(bast.fotoDokumentasiPdf!)} className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded border border-rose-500/20 flex items-center gap-1 cursor-pointer transition-colors" title="Lihat Foto Dokumentasi PDF">
                      <FileText className="w-3 h-3" /> Foto Docs (≤4MB)
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
                    const attachments: EmailAttachment[] = [];
                    if (bast.apdPdf) attachments.push({ name: bast.apdPdf.name, url: bast.apdPdf.url, sizeBytes: bast.apdPdf.sizeBytes });
                    if (bast.abdPdf) attachments.push({ name: bast.abdPdf.name, url: bast.abdPdf.url, sizeBytes: bast.abdPdf.sizeBytes });
                    if (bast.coreConnectionPdf) attachments.push({ name: bast.coreConnectionPdf.name, url: bast.coreConnectionPdf.url, sizeBytes: bast.coreConnectionPdf.sizeBytes });
                    if (bast.fotoDokumentasiPdf) attachments.push({ name: bast.fotoDokumentasiPdf.name, url: bast.fotoDokumentasiPdf.url, sizeBytes: bast.fotoDokumentasiPdf.sizeBytes });
                    if (bast.estimatedDistancePdf) attachments.push({ name: bast.estimatedDistancePdf.name, url: bast.estimatedDistancePdf.url, sizeBytes: bast.estimatedDistancePdf.sizeBytes });
                    if (bast.totalDistancePdf) attachments.push({ name: bast.totalDistancePdf.name, url: bast.totalDistancePdf.url, sizeBytes: bast.totalDistancePdf.sizeBytes });

                    if (attachments.length === 0) {
                      attachments.push(
                        { name: `BAST_${bast.woNumber}.pdf`, sizeBytes: 1420000 },
                        { name: `APD_${bast.woNumber}.pdf`, sizeBytes: 980000 },
                        { name: `Core_Connection_${bast.woNumber}.pdf`, sizeBytes: 850000 },
                        { name: `Dokumentasi_Splicing_${bast.woNumber}.pdf`, sizeBytes: 2400000 }
                      );
                    }

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
                {editingId ? 'Edit Dokumen BAST' : 'Buat Dokumen BAST Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">6. WO Option</label>
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
                  <label className="text-xs font-semibold text-slate-300 block mb-1">No. WO (Nomor Referensi)</label>
                  <input
                    type="text"
                    required
                    value={formData.woNumber}
                    onChange={(e) => setFormData(p => ({ ...p, woNumber: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-cyan-400 font-bold rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <PDFUploader
                  label="1. APD Upload PDF"
                  value={formData.apdPdf}
                  onChange={(f) => setFormData(p => ({ ...p, apdPdf: f }))}
                  onPreview={(f) => setPreviewPdf(f)}
                />
                <PDFUploader
                  label="2. ABD Upload PDF"
                  value={formData.abdPdf}
                  onChange={(f) => setFormData(p => ({ ...p, abdPdf: f }))}
                  onPreview={(f) => setPreviewPdf(f)}
                />
                <PDFUploader
                  label="3. Core Connection PDF"
                  value={formData.coreConnectionPdf}
                  onChange={(f) => setFormData(p => ({ ...p, coreConnectionPdf: f }))}
                  onPreview={(f) => setPreviewPdf(f)}
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase font-mono">
                  4. Rincian Daily Report BAST
                </h4>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Work Type (Core Search / Manual)</label>
                  <input
                    type="text"
                    required
                    value={formData.workType}
                    onChange={(e) => setFormData(p => ({ ...p, workType: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Release Date</label>
                    <input
                      type="date"
                      value={formData.releaseDate}
                      onChange={(e) => setFormData(p => ({ ...p, releaseDate: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Finish Date</label>
                    <input
                      type="date"
                      value={formData.finishDate}
                      onChange={(e) => setFormData(p => ({ ...p, finishDate: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Durasi (Hari)</label>
                    <input
                      type="number"
                      value={formData.durationDays}
                      onChange={(e) => setFormData(p => ({ ...p, durationDays: parseInt(e.target.value) || 1 }))}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-amber-400 font-bold rounded-xl p-2 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <PDFUploader
                    label="Estimasi Jarak (m) PDF"
                    value={formData.estimatedDistancePdf}
                    onChange={(f) => setFormData(p => ({ ...p, estimatedDistancePdf: f }))}
                    onPreview={(f) => setPreviewPdf(f)}
                  />
                  <PDFUploader
                    label="Total Jarak (m) PDF"
                    value={formData.totalDistancePdf}
                    onChange={(f) => setFormData(p => ({ ...p, totalDistancePdf: f }))}
                    onPreview={(f) => setPreviewPdf(f)}
                  />
                </div>
              </div>

              <div>
                <PDFUploader
                  label="5. Foto Dokumentasi PDF (Maksimal Ukuran File 4 MB)"
                  value={formData.fotoDokumentasiPdf}
                  onChange={(f) => setFormData(p => ({ ...p, fotoDokumentasiPdf: f }))}
                  onPreview={(f) => setPreviewPdf(f)}
                  maxSizeMB={4}
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
