import React, { useState } from 'react';
import { 
  FileCheck2, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  X,
  Clock,
  Eye,
  Mail
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { RFSItem, StatusRFS, PDFFileMeta } from '../types';
import { TouchButton } from '../components/TouchButton';
import { PDFUploader } from '../components/PDFUploader';
import { PDFViewerModal } from '../components/PDFViewerModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { SendEmailModal } from '../components/SendEmailModal';
import { EmailAttachment } from '../utils/emailTemplate';

export const RFSPage: React.FC = () => {
  const { rfsList, addRFS, updateRFS, deleteRFS, showToast, dailyReports } = useProjectContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<PDFFileMeta | null>(null);

  // Email Submission Modal State
  const [emailModalData, setEmailModalData] = useState<{
    requestType: 'RFS';
    woNumber: string;
    projectName: string;
    vendorName?: string;
    lingkupTugas?: string;
    segmenJaringan?: string;
    statusJaringan?: string;
    defaultRecipient?: string;
    defaultRecipientName?: string;
    availableAttachments: EmailAttachment[];
  } | null>(null);

  // Delete Target Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; rfsNumber: string } | null>(null);

  const [formData, setFormData] = useState<Omit<RFSItem, 'id' | 'createdAt' | 'updatedAt'>>({
    rfsNumber: 'RFS-BEL-2026-044',
    woNumber: 'WO-BEL-2026-0082',
    companyHeader: {
      companyName: 'PT. BELACOM INDONESIA TELECOM',
      phone: '021-88992026',
      email: 'project.control@belacom.co.id',
      address: 'Gedung Cyber 2 Tower Lt. 18, Jl. H.R. Rasuna Said X5 No. 13, Jakarta Selatan',
      letterNumber: '088/BELACOM-OPS/RFS/X/2026'
    },
    clientInfo: {
      clientCompanyName: 'PT. TELKOMSEL INDONESIA',
      picName: 'Bpk. Aris Munandar'
    },
    scopeOfService: 'Pekerjaan Splicing Interkoneksi Fiber Optic POP Mini ke Node Distribution & OTDR Testing.',
    boqPdf: undefined,
    sphPdf: undefined,
    timelinePdf: undefined,
    statusRfs: 'Submit',
    submissionDate: new Date().toISOString().substring(0, 10)
  });

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      rfsNumber: `RFS-BEL-2026-${Math.floor(100 + Math.random() * 900)}`,
      woNumber: `WO-BEL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      companyHeader: {
        companyName: 'PT. BELACOM INDONESIA TELECOM',
        phone: '021-88992026',
        email: 'project.control@belacom.co.id',
        address: 'Gedung Cyber 2 Tower Lt. 18, Jl. H.R. Rasuna Said X5 No. 13, Jakarta Selatan',
        letterNumber: `${Math.floor(100 + Math.random() * 900)}/BELACOM-OPS/RFS/X/2026`
      },
      clientInfo: {
        clientCompanyName: 'PT. INDOSAT OOREDOO HUTCHISON',
        picName: 'Ibu Dian Safitri'
      },
      scopeOfService: 'Pekerjaan Interkoneksi Core FO & Sertifikasi Siap Operasi (RFS).',
      boqPdf: undefined,
      sphPdf: undefined,
      timelinePdf: undefined,
      statusRfs: 'Submit',
      submissionDate: new Date().toISOString().substring(0, 10)
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rfs: RFSItem) => {
    setEditingId(rfs.id);
    setFormData({ ...rfs });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyHeader.companyName.trim() || !formData.clientInfo.clientCompanyName.trim()) {
      showToast('error', 'Validasi Gagal', 'Harap isi Nama Perusahaan dan Nama Perusahaan Klien!');
      return;
    }

    if (editingId) {
      updateRFS(editingId, formData);
    } else {
      addRFS(formData);
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteRFS(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const filteredRfs = rfsList.filter(r => 
    r.rfsNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.clientInfo.clientCompanyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.companyHeader.letterNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
            <FileCheck2 className="w-4 h-4" /> Request For Service (RFS) Management
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Surat & Sertifikat RFS Belacom</h2>
          <p className="text-xs text-slate-400">Identitas Kop Surat, Informasi Klien, Scope of Service, SPH & Timeline</p>
        </div>

        <TouchButton
          variant="primary"
          size="md"
          icon={<Plus className="w-5 h-5" />}
          onClick={handleOpenAddModal}
          showFingerIcon
        >
          + Buat Dokumen RFS
        </TouchButton>
      </div>

      {/* Search */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No RFS, Nama Klien, atau No Surat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-3 py-2 outline-none"
          />
        </div>
      </div>

      {/* RFS Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredRfs.map((rfs) => (
          <div key={rfs.id} className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-xl transition-all">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div>
                <span className="text-xs text-slate-500 font-mono block">NO. SURAT RFS</span>
                <span className="text-sm font-extrabold text-cyan-400 font-mono">{rfs.rfsNumber}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                rfs.statusRfs === 'Done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                rfs.statusRfs === 'Submit' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {rfs.statusRfs}
              </span>
            </div>

            <div className="space-y-3 mb-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono">
                <div className="font-bold text-white text-xs">{rfs.companyHeader.companyName}</div>
                <div className="text-slate-400 text-[11px]">No Surat: {rfs.companyHeader.letterNumber}</div>
                <div className="text-slate-500 text-[10px]">Telp: {rfs.companyHeader.phone} · Email: {rfs.companyHeader.email}</div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">PENERIMA / KLIEN:</div>
                <div className="font-bold text-cyan-300">{rfs.clientInfo.clientCompanyName}</div>
                <div className="text-slate-400 text-[11px]">PIC: {rfs.clientInfo.picName}</div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block mb-1">SCOPE OF SERVICE:</span>
                <p className="p-2.5 bg-slate-950 rounded-lg text-slate-300 text-xs border border-slate-800">
                  {rfs.scopeOfService}
                </p>
              </div>

              {/* Interactive attachments preview badges */}
              <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
                {rfs.boqPdf && (
                  <button onClick={() => setPreviewPdf(rfs.boqPdf!)} className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/20 flex items-center gap-1 cursor-pointer transition-colors" title="Lihat BOQ PDF">
                    <Eye className="w-3 h-3 text-cyan-400" /> BOQ PDF
                  </button>
                )}
                {rfs.sphPdf && (
                  <button onClick={() => setPreviewPdf(rfs.sphPdf!)} className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/20 flex items-center gap-1 cursor-pointer transition-colors" title="Lihat SPH PDF">
                    <Eye className="w-3 h-3 text-cyan-400" /> SPH PDF
                  </button>
                )}
                {rfs.timelinePdf && (
                  <button onClick={() => setPreviewPdf(rfs.timelinePdf!)} className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded border border-amber-500/20 flex items-center gap-1 cursor-pointer transition-colors" title="Lihat Timeline PDF">
                    <Clock className="w-3 h-3 text-amber-400" /> Timeline PDF
                  </button>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">Diserahkan: {rfs.submissionDate}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const attachments: EmailAttachment[] = [];
                    if (rfs.boqPdf) attachments.push({ name: rfs.boqPdf.name, url: rfs.boqPdf.url, sizeBytes: rfs.boqPdf.sizeBytes });
                    if (rfs.sphPdf) attachments.push({ name: rfs.sphPdf.name, url: rfs.sphPdf.url, sizeBytes: rfs.sphPdf.sizeBytes });
                    if (rfs.timelinePdf) attachments.push({ name: rfs.timelinePdf.name, url: rfs.timelinePdf.url, sizeBytes: rfs.timelinePdf.sizeBytes });

                    if (attachments.length === 0) {
                      attachments.push(
                        { name: `Surat_RFS_${rfs.rfsNumber}.pdf`, sizeBytes: 1350000 },
                        { name: `BOQ_Final_${rfs.woNumber}.pdf`, sizeBytes: 940000 },
                        { name: `SPH_Pengajuan_${rfs.rfsNumber}.pdf`, sizeBytes: 780000 },
                        { name: `Jadwal_Pelaksanaan_${rfs.woNumber}.pdf`, sizeBytes: 1150000 }
                      );
                    }

                    const relatedDaily = dailyReports.find(d => d.woNumber === rfs.woNumber);
                    const lingkup = rfs.scopeOfService || relatedDaily?.workType || 'Instalasi & Pengujian Fiber Optic';
                    const segmen = relatedDaily?.assignment ? `Segmen Area ${relatedDaily.assignment}` : 'Segmen Distribusi Fiber Optic';
                    const status = rfs.statusRfs === 'Done' ? 'Request For Service (RFS) - Aktif 100%' : 'Request For Service (RFS) - Aktif Normal';

                    setEmailModalData({
                      requestType: 'RFS',
                      woNumber: rfs.woNumber,
                      projectName: lingkup,
                      vendorName: 'Belacom',
                      lingkupTugas: lingkup,
                      segmenJaringan: segmen,
                      statusJaringan: status,
                      defaultRecipient: 'noc.operations@telkom.co.id',
                      defaultRecipientName: rfs.clientInfo?.picName || 'Tim Pengawas & Operasional Jaringan',
                      availableAttachments: attachments
                    });
                  }}
                  className="px-2 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20 cursor-pointer flex items-center gap-1 text-[11px] font-semibold transition-colors"
                  title="Kirim Email Resmi RFS ke SAP"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kirim Email</span>
                </button>
                <button onClick={() => handleOpenEditModal(rfs)} className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 hover:bg-cyan-500/20 cursor-pointer" title="Edit RFS">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteTarget({ id: rfs.id, rfsNumber: rfs.rfsNumber })} className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20 cursor-pointer" title="Hapus RFS">
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
                <FileCheck2 className="w-5 h-5 text-cyan-400" />
                {editingId ? 'Edit Dokumen RFS' : 'Input Dokumen RFS Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase font-mono">
                  1. Identitas & Kop Surat Perusahaan (Belacom)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Nama Perusahaan (Textarea)</label>
                    <textarea
                      rows={2}
                      required
                      value={formData.companyHeader.companyName}
                      onChange={(e) => setFormData(p => ({ ...p, companyHeader: { ...p.companyHeader, companyName: e.target.value } }))}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">No. Telp (Phone Number)</label>
                    <input
                      type="tel"
                      value={formData.companyHeader.phone}
                      onChange={(e) => setFormData(p => ({ ...p, companyHeader: { ...p.companyHeader, phone: e.target.value } }))}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Email (Textarea)</label>
                    <textarea
                      rows={2}
                      value={formData.companyHeader.email}
                      onChange={(e) => setFormData(p => ({ ...p, companyHeader: { ...p.companyHeader, email: e.target.value } }))}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">No. Surat (Textarea)</label>
                    <textarea
                      rows={2}
                      value={formData.companyHeader.letterNumber}
                      onChange={(e) => setFormData(p => ({ ...p, companyHeader: { ...p.companyHeader, letterNumber: e.target.value } }))}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-cyan-400 font-bold rounded-xl p-2.5 outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Alamat Perusahaan (Textarea)</label>
                  <textarea
                    rows={2}
                    value={formData.companyHeader.address}
                    onChange={(e) => setFormData(p => ({ ...p, companyHeader: { ...p.companyHeader, address: e.target.value } }))}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase font-mono">
                  2. Informasi Penerima (Klien)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Nama Perusahaan Klien (Textarea)</label>
                    <textarea
                      rows={2}
                      required
                      value={formData.clientInfo.clientCompanyName}
                      onChange={(e) => setFormData(p => ({ ...p, clientInfo: { ...p.clientInfo, clientCompanyName: e.target.value } }))}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Nama PIC (Textarea)</label>
                    <textarea
                      rows={2}
                      required
                      value={formData.clientInfo.picName}
                      onChange={(e) => setFormData(p => ({ ...p, clientInfo: { ...p.clientInfo, picName: e.target.value } }))}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">3. Scope of Service (Textarea)</label>
                <textarea
                  rows={3}
                  required
                  value={formData.scopeOfService}
                  onChange={(e) => setFormData(p => ({ ...p, scopeOfService: e.target.value }))}
                  placeholder="Rincian ruang lingkup pekerjaan RFS..."
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-3 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <PDFUploader
                  label="4. BOQ Upload PDF"
                  value={formData.boqPdf}
                  onChange={(f) => setFormData(p => ({ ...p, boqPdf: f }))}
                  onPreview={(f) => setPreviewPdf(f)}
                />
                <PDFUploader
                  label="4. SPH Upload PDF"
                  value={formData.sphPdf}
                  onChange={(f) => setFormData(p => ({ ...p, sphPdf: f }))}
                  onPreview={(f) => setPreviewPdf(f)}
                />
                <PDFUploader
                  label="5. Timeline Upload PDF"
                  value={formData.timelinePdf}
                  onChange={(f) => setFormData(p => ({ ...p, timelinePdf: f }))}
                  onPreview={(f) => setPreviewPdf(f)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Status RFS Option</label>
                <select
                  value={formData.statusRfs}
                  onChange={(e) => setFormData(p => ({ ...p, statusRfs: e.target.value as StatusRFS }))}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                >
                  <option value="Not Yet">Not Yet</option>
                  <option value="Submit">Submit</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <TouchButton variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
                  Batal
                </TouchButton>
                <TouchButton variant="primary" size="md" type="submit" showFingerIcon>
                  Simpan Dokumen RFS
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
        title="Konfirmasi Hapus Dokumen RFS"
        itemIdentifier={deleteTarget?.rfsNumber}
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
