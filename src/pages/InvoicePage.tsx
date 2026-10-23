import React, { useState } from 'react';
import { 
  Receipt, 
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
import { InvoiceItem, StatusInvoice, PDFFileMeta } from '../types';
import { TouchButton } from '../components/TouchButton';
import { PDFUploader } from '../components/PDFUploader';
import { PDFViewerModal } from '../components/PDFViewerModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { SendEmailModal } from '../components/SendEmailModal';
import { EmailAttachment } from '../utils/emailTemplate';

export const InvoicePage: React.FC = () => {
  const { invoices, addInvoice, updateInvoice, deleteInvoice, showToast, bastList, dailyReports } = useProjectContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<PDFFileMeta | null>(null);

  // Email Submission Modal State
  const [emailModalData, setEmailModalData] = useState<{
    requestType: 'Invoice';
    woNumber: string;
    projectName: string;
    vendorName?: string;
    wilayahOperasi?: string;
    nomorBastAcuan?: string;
    defaultRecipient?: string;
    defaultRecipientName?: string;
    availableAttachments: EmailAttachment[];
  } | null>(null);

  // Delete Target Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; invoiceNumber: string } | null>(null);

  const [formData, setFormData] = useState<Omit<InvoiceItem, 'id' | 'createdAt' | 'updatedAt'>>({
    invoiceNumber: 'INV/BEL/2026/10-020',
    woNumber: 'WO-BEL-2026-0082',
    statusInvoice: 'Submit',
    boqPdf: undefined,
    poNumber: 'PO-TELKOM-889900',
    poPdf: undefined,
    fakturPajakNumber: '010.003-26.88990011',
    fakturPajakPdf: undefined,
    rfsNumber: 'RFS-BEL-2026-050',
    rfsPdf: undefined,
    amountRupiah: 150000000,
    issueDate: new Date().toISOString().substring(0, 10)
  });

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      invoiceNumber: `INV/BEL/2026/10-${Math.floor(100 + Math.random() * 900)}`,
      woNumber: `WO-BEL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      statusInvoice: 'Submit',
      boqPdf: undefined,
      poNumber: `PO-TELKOM-${Math.floor(100000 + Math.random() * 900000)}`,
      poPdf: undefined,
      fakturPajakNumber: `010.003-26.${Math.floor(10000000 + Math.random() * 90000000)}`,
      fakturPajakPdf: undefined,
      rfsNumber: `RFS-BEL-2026-${Math.floor(100 + Math.random() * 900)}`,
      rfsPdf: undefined,
      amountRupiah: 175000000,
      issueDate: new Date().toISOString().substring(0, 10)
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (inv: InvoiceItem) => {
    setEditingId(inv.id);
    setFormData({ ...inv });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.invoiceNumber.trim() || !formData.woNumber.trim() || formData.amountRupiah <= 0) {
      showToast('error', 'Validasi Gagal', 'Harap isi Nomor Invoice, Ref WO, dan Nominal Rupiah valid!');
      return;
    }

    if (editingId) {
      updateInvoice(editingId, formData);
    } else {
      addInvoice(formData);
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteInvoice(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const filteredInvoices = invoices.filter(i => 
    i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.woNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.poNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
            <Receipt className="w-4 h-4" /> Manajemen Penagihan & Invoice
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Invoice Belacom</h2>
          <p className="text-xs text-slate-400">Verifikasi BOQ, PO, Faktur Pajak, & RFS</p>
        </div>

        <TouchButton
          variant="primary"
          size="md"
          icon={<Plus className="w-5 h-5" />}
          onClick={handleOpenAddModal}
          showFingerIcon
        >
          + Buat Invoice Baru
        </TouchButton>
      </div>

      {/* Search */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No. Invoice, WO, atau PO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-3 py-2 outline-none"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">No Invoice & Ref WO</th>
                <th className="py-2.5 px-3 font-semibold">Nominal Rupiah</th>
                <th className="py-2.5 px-3 font-semibold">Detail PO & Faktur Pajak</th>
                <th className="py-2.5 px-3 font-semibold">Dokumen PDF (BOQ, PO, FP, RFS)</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status Invoice</th>
                <th className="py-2.5 px-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-850/60 transition-colors">
                  
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-cyan-400 font-mono block">{inv.invoiceNumber}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Ref WO: {inv.woNumber}</span>
                  </td>

                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 text-sm">
                    Rp {inv.amountRupiah.toLocaleString('id-ID')}
                  </td>

                  <td className="py-2.5 px-3 font-mono text-[11px]">
                    <div className="text-slate-200">PO: {inv.poNumber}</div>
                    <div className="text-slate-400 text-[10px]">FP: {inv.fakturPajakNumber || '-'}</div>
                  </td>

                  <td className="py-2.5 px-3 font-mono">
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {inv.boqPdf && (
                        <button onClick={() => setPreviewPdf(inv.boqPdf!)} className="px-1.5 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded flex items-center gap-1 cursor-pointer transition-colors" title="Lihat BOQ PDF">
                          <Eye className="w-3 h-3 text-cyan-400" /> BOQ
                        </button>
                      )}
                      {inv.poPdf && (
                        <button onClick={() => setPreviewPdf(inv.poPdf!)} className="px-1.5 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded flex items-center gap-1 cursor-pointer transition-colors" title="Lihat PO PDF">
                          <Eye className="w-3 h-3 text-cyan-400" /> PO
                        </button>
                      )}
                      {inv.fakturPajakPdf && (
                        <button onClick={() => setPreviewPdf(inv.fakturPajakPdf!)} className="px-1.5 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded flex items-center gap-1 cursor-pointer transition-colors" title="Lihat Faktur Pajak PDF">
                          <Eye className="w-3 h-3 text-cyan-400" /> Faktur Pajak
                        </button>
                      )}
                      {inv.rfsPdf && (
                        <button onClick={() => setPreviewPdf(inv.rfsPdf!)} className="px-1.5 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded flex items-center gap-1 cursor-pointer transition-colors" title="Lihat RFS PDF">
                          <FileText className="w-3 h-3 text-cyan-400" /> RFS
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                      inv.statusInvoice === 'Done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      inv.statusInvoice === 'Submit' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                      inv.statusInvoice === 'Revision' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {inv.statusInvoice}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const attachments: EmailAttachment[] = [];
                          if (inv.boqPdf) attachments.push({ name: inv.boqPdf.name, url: inv.boqPdf.url, sizeBytes: inv.boqPdf.sizeBytes });
                          if (inv.poPdf) attachments.push({ name: inv.poPdf.name, url: inv.poPdf.url, sizeBytes: inv.poPdf.sizeBytes });
                          if (inv.fakturPajakPdf) attachments.push({ name: inv.fakturPajakPdf.name, url: inv.fakturPajakPdf.url, sizeBytes: inv.fakturPajakPdf.sizeBytes });
                          if (inv.rfsPdf) attachments.push({ name: inv.rfsPdf.name, url: inv.rfsPdf.url, sizeBytes: inv.rfsPdf.sizeBytes });

                          if (attachments.length === 0) {
                            attachments.push(
                              { name: `Invoice_${inv.invoiceNumber.replace(/\//g, '_')}.pdf`, sizeBytes: 1540000 },
                              { name: `PO_${inv.poNumber}.pdf`, sizeBytes: 890000 },
                              { name: `FakturPajak_${inv.fakturPajakNumber}.pdf`, sizeBytes: 620000 },
                              { name: `BOQ_Relokasi_${inv.woNumber}.pdf`, sizeBytes: 1120000 }
                            );
                          }

                          const relatedBast = bastList.find(b => b.woNumber === inv.woNumber);
                          const relatedDaily = dailyReports.find(d => d.woNumber === inv.woNumber);
                          const uraian = relatedBast?.workType || relatedDaily?.workType || `Penagihan Invoice ${inv.invoiceNumber} (Rp ${inv.amountRupiah.toLocaleString('id-ID')})`;
                          const wilayah = relatedDaily?.assignment ? `Area ${relatedDaily.assignment}` : 'Area Jabodetabek';
                          const bastAcuan = relatedBast ? `BAST/${inv.woNumber}/BELACOM/${new Date().getFullYear()}` : `BAST-REF-${inv.woNumber}`;

                          setEmailModalData({
                            requestType: 'Invoice',
                            woNumber: inv.woNumber,
                            projectName: uraian,
                            vendorName: 'Belacom',
                            wilayahOperasi: wilayah,
                            nomorBastAcuan: bastAcuan,
                            defaultRecipient: 'finance.payment@telkom.co.id',
                            defaultRecipientName: 'Tim Finance & Accounting / Tim Verifikasi Pembayaran',
                            availableAttachments: attachments
                          });
                        }}
                        className="px-2 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20 cursor-pointer flex items-center gap-1 text-[11px] font-semibold transition-colors"
                        title="Kirim Email Resmi Invoice ke SAP"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">Email</span>
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(inv)}
                        className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 hover:bg-cyan-500/20 cursor-pointer"
                        title="Edit Invoice"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: inv.id, invoiceNumber: inv.invoiceNumber })}
                        className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                        title="Hapus Invoice"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-cyan-400" />
                {editingId ? 'Edit Invoice' : 'Input Invoice Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">1. Status Invoice Option</label>
                  <select
                    value={formData.statusInvoice}
                    onChange={(e) => setFormData(p => ({ ...p, statusInvoice: e.target.value as StatusInvoice }))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                  >
                    <option value="Not Yet">Not Yet</option>
                    <option value="Submit">Submit</option>
                    <option value="Revision">Revision</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Nomor Invoice</label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData(p => ({ ...p, invoiceNumber: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs font-bold text-cyan-400 rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Nomor Ref WO</label>
                  <input
                    type="text"
                    required
                    value={formData.woNumber}
                    onChange={(e) => setFormData(p => ({ ...p, woNumber: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">3. Purchase Order (PO Number)</label>
                  <input
                    type="text"
                    value={formData.poNumber}
                    onChange={(e) => setFormData(p => ({ ...p, poNumber: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono mb-2"
                  />
                  <PDFUploader
                    label="PO Upload PDF"
                    value={formData.poPdf}
                    onChange={(f) => setFormData(p => ({ ...p, poPdf: f }))}
                    onPreview={(f) => setPreviewPdf(f)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">4. Faktur Pajak Number</label>
                  <input
                    type="text"
                    value={formData.fakturPajakNumber}
                    onChange={(e) => setFormData(p => ({ ...p, fakturPajakNumber: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono mb-2"
                  />
                  <PDFUploader
                    label="Faktur Pajak Upload PDF"
                    value={formData.fakturPajakPdf}
                    onChange={(f) => setFormData(p => ({ ...p, fakturPajakPdf: f }))}
                    onPreview={(f) => setPreviewPdf(f)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PDFUploader
                  label="2. BOQ Upload PDF"
                  value={formData.boqPdf}
                  onChange={(f) => setFormData(p => ({ ...p, boqPdf: f }))}
                  onPreview={(f) => setPreviewPdf(f)}
                />
                <PDFUploader
                  label="5. RFS Upload PDF / Link"
                  value={formData.rfsPdf}
                  onChange={(f) => setFormData(p => ({ ...p, rfsPdf: f }))}
                  onPreview={(f) => setPreviewPdf(f)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Nominal Tagihan (Rupiah)</label>
                  <input
                    type="number"
                    value={formData.amountRupiah}
                    onChange={(e) => setFormData(p => ({ ...p, amountRupiah: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-bold rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Tanggal Terbit</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData(p => ({ ...p, issueDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <TouchButton variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
                  Batal
                </TouchButton>
                <TouchButton variant="primary" size="md" type="submit" showFingerIcon>
                  Simpan Invoice
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
        title="Konfirmasi Hapus Invoice"
        itemIdentifier={deleteTarget?.invoiceNumber}
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
