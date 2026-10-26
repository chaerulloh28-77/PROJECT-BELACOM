import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Plus,
  Trash2,
  Save,
  Building2,
  UserCheck,
  Landmark,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import {
  FormInvoiceLineItem,
  calculateInvoiceItemTotal,
  calculateFormInvoiceTotals,
  formatRupiahDisplay,
} from '../utils/formCalculations';
import { exportFormInvoiceToWord } from '../utils/formWordExport';

export interface FormInvoiceDraft {
  id: string;
  companyName: string;
  companyAddress1: string;
  companyAddress2: string;
  companyPhone: string;
  companyEmail: string;
  clientName: string;
  clientAddress1: string;
  clientAddress2: string;
  clientContact: string;
  invoiceNumber: string;
  invoiceDate: string;
  paymentMethod: string;
  items: FormInvoiceLineItem[];
  ppnEnabled: boolean;
  ppnRate: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  signatoryName: string;
  updatedAt: string;
}

const STORAGE_KEY_FORM_INVOICE_DRAFTS = 'belacom_form_invoice_drafts_v1';

const DEFAULT_INVOICE_DRAFT: Omit<FormInvoiceDraft, 'id' | 'updatedAt'> = {
  companyName: 'PT. BELACOM INDONESIA TELECOM',
  companyAddress1: 'Jl. TB Simatupang Kav. 88, Jakarta Selatan',
  companyAddress2: 'DKI Jakarta 12520, Indonesia',
  companyPhone: '(021) 789-4560',
  companyEmail: 'finance@belacom.co.id',
  clientName: 'PT. Mitra Jaringan Nusantara',
  clientAddress1: 'Gedung Cyber Lt. 8, Jl. Kuningan Barat No. 8',
  clientAddress2: 'Jakarta Selatan, DKI Jakarta 12710',
  clientContact: '(021) 520-1122 / procurement@mitrajaringan.co.id',
  invoiceNumber: 'INV-2026-001',
  invoiceDate: '26 Oktober 2026',
  paymentMethod: 'Transfer Bank',
  items: [
    {
      id: 'item-1',
      description: 'Pekerjaan Interkoneksi Jaringan Fiber Optik POP & Splicing Core',
      quantity: 2,
      unitPrice: 500000,
    },
    {
      id: 'item-2',
      description: 'Pengujian OTDR, OPM, OLS & Dokumentasi As-Built Drawing (ABD)',
      quantity: 1,
      unitPrice: 750000,
    },
  ],
  ppnEnabled: true,
  ppnRate: 11,
  bankName: 'Bank Central Asia (BCA)',
  bankAccountNumber: '123-456-7890',
  bankAccountHolder: 'PT. Belacom Indonesia Telecom',
  signatoryName: 'Direktur Keuangan & Administrasi',
};

export const FormInvoicePage: React.FC = () => {
  const { showToast } = useProjectContext();

  const [formState, setFormState] = useState<Omit<FormInvoiceDraft, 'id' | 'updatedAt'>>(() => {
    try {
      const savedCurrent = localStorage.getItem('belacom_form_invoice_active_v1');
      if (savedCurrent) {
        return { ...DEFAULT_INVOICE_DRAFT, ...JSON.parse(savedCurrent) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_INVOICE_DRAFT;
  });

  const [savedDrafts, setSavedDrafts] = useState<FormInvoiceDraft[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FORM_INVOICE_DRAFTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('belacom_form_invoice_active_v1', JSON.stringify(formState));
    } catch {
      // ignore
    }
  }, [formState]);

  const totals = calculateFormInvoiceTotals(
    formState.items,
    formState.ppnEnabled ? formState.ppnRate : 0
  );

  const handleFieldChange = <K extends keyof typeof formState>(
    field: K,
    value: (typeof formState)[K]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (
    id: string,
    field: keyof FormInvoiceLineItem,
    value: string | number
  ) => {
    setFormState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleAddItem = () => {
    const newItem: FormInvoiceLineItem = {
      id: 'item-' + Date.now(),
      description: '',
      quantity: 1,
      unitPrice: 0,
    };
    setFormState((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleRemoveItem = (id: string) => {
    if (formState.items.length <= 1) {
      showToast('error', 'Minimal 1 Baris', 'Tabel transaksi minimal harus memiliki 1 baris item.');
      return;
    }
    setFormState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const handleSaveDraft = () => {
    if (!formState.invoiceNumber.trim()) {
      showToast('error', 'Nomor Invoice Wajib Diisi', 'Silakan masukkan Nomor Invoice sebelum menyimpan draf.');
      return;
    }
    const now = new Date().toLocaleString('id-ID');
    const newDraft: FormInvoiceDraft = {
      ...formState,
      id: 'DRAFT-INV-' + Date.now(),
      updatedAt: now,
    };
    const updated = [newDraft, ...savedDrafts.filter((d) => d.invoiceNumber !== formState.invoiceNumber)];
    setSavedDrafts(updated);
    localStorage.setItem(STORAGE_KEY_FORM_INVOICE_DRAFTS, JSON.stringify(updated));
    showToast('success', 'Draf Invoice Disimpan', `Formulir Invoice ${formState.invoiceNumber} berhasil disimpan.`);
  };

  const handleLoadDraft = (draft: FormInvoiceDraft) => {
    const { id: _id, updatedAt: _u, ...rest } = draft;
    setFormState(rest);
    showToast('info', 'Draf Dimuat', `Draf Invoice ${draft.invoiceNumber} dimuat ke editor.`);
  };

  const handleDeleteDraft = (id: string) => {
    const updated = savedDrafts.filter((d) => d.id !== id);
    setSavedDrafts(updated);
    localStorage.setItem(STORAGE_KEY_FORM_INVOICE_DRAFTS, JSON.stringify(updated));
    showToast('info', 'Draf Dihapus', 'Draf Form Invoice telah dihapus.');
  };

  const handleDownloadWord = (targetData: Omit<FormInvoiceDraft, 'id' | 'updatedAt'> = formState) => {
    exportFormInvoiceToWord(targetData);
    showToast(
      'success',
      'Berhasil Mengunduh Word',
      `Dokumen Word Form Invoice (${targetData.invoiceNumber || 'INV-2026-001'}) berhasil diunduh.`
    );
  };

  // Ensure minimum 5 rows in the printed/preview table to match the official layout
  const minTableRows = Math.max(5, formState.items.length);
  const blankRowCount = Math.max(0, minTableRows - formState.items.length);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 lg:p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Form Invoice (Faktur Tagihan Komersial)
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm whitespace-nowrap"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Draf</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadWord(formState)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Download Word (.doc)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Workspace: Left = Form Editor, Right = Live A4 Commercial Invoice Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Inputs (5 Cols on XL) */}
        <div className="xl:col-span-5 space-y-5">
          {/* Section 1: Header Profil Usaha */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>1. Header Profil Usaha</span>
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama Perusahaan Anda
                </label>
                <input
                  type="text"
                  value={formState.companyName}
                  onChange={(e) => handleFieldChange('companyName', e.target.value)}
                  placeholder="[NAMA PERUSAHAAN ANDA]"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Alamat Perusahaan Baris 1
                  </label>
                  <input
                    type="text"
                    value={formState.companyAddress1}
                    onChange={(e) => handleFieldChange('companyAddress1', e.target.value)}
                    placeholder="Alamat Perusahaan Baris 1"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Alamat Perusahaan Baris 2
                  </label>
                  <input
                    type="text"
                    value={formState.companyAddress2}
                    onChange={(e) => handleFieldChange('companyAddress2', e.target.value)}
                    placeholder="Alamat Perusahaan Baris 2"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="text"
                    value={formState.companyPhone}
                    onChange={(e) => handleFieldChange('companyPhone', e.target.value)}
                    placeholder="(021) XXXXXXX"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Perusahaan
                  </label>
                  <input
                    type="email"
                    value={formState.companyEmail}
                    onChange={(e) => handleFieldChange('companyEmail', e.target.value)}
                    placeholder="info@perusahaan.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 & 3: Bill To & Detail Invoice */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>2. Informasi Penagihan (Bill To) & Detail Invoice</span>
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama Pelanggan / Perusahaan (Ditagihkan Kepada)
                </label>
                <input
                  type="text"
                  value={formState.clientName}
                  onChange={(e) => handleFieldChange('clientName', e.target.value)}
                  placeholder="[Nama Pelanggan/Perusahaan]"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Alamat Pelanggan Baris 1
                  </label>
                  <input
                    type="text"
                    value={formState.clientAddress1}
                    onChange={(e) => handleFieldChange('clientAddress1', e.target.value)}
                    placeholder="[Alamat Pelanggan Baris 1]"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Alamat Pelanggan Baris 2
                  </label>
                  <input
                    type="text"
                    value={formState.clientAddress2}
                    onChange={(e) => handleFieldChange('clientAddress2', e.target.value)}
                    placeholder="[Alamat Pelanggan Baris 2]"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Telepon / Kontak Pelanggan
                </label>
                <input
                  type="text"
                  value={formState.clientContact}
                  onChange={(e) => handleFieldChange('clientContact', e.target.value)}
                  placeholder="[Telepon / Kontak]"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nomor Invoice
                </label>
                <input
                  type="text"
                  value={formState.invoiceNumber}
                  onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                  placeholder="INV-2026-001"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Metode Pembayaran
                </label>
                <input
                  type="text"
                  value={formState.paymentMethod}
                  onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                  placeholder="Transfer Bank"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tanggal Penerbitan
                </label>
                <input
                  type="text"
                  value={formState.invoiceDate}
                  onChange={(e) => handleFieldChange('invoiceDate', e.target.value)}
                  placeholder="26 Oktober 2026"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Tabel Transaksi Utama */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>3. Tabel Transaksi Utama</span>
              </h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div className="space-y-3">
              {formState.items.map((item, idx) => {
                const rowTotal = calculateInvoiceItemTotal(item.quantity, item.unitPrice);
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        Item #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        aria-label={`Hapus Item ${idx + 1}`}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Deskripsi Produk / Jasa
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(item.id, 'description', e.target.value)
                        }
                        placeholder={`[Nama Item / Layanan Contoh ${idx + 1}]`}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Kuantitas
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(item.id, 'quantity', Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Harga Satuan (Rp)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(item.id, 'unitPrice', Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Total Otomatis
                        </label>
                        <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800 text-xs font-mono font-bold text-emerald-400 truncate">
                          {formatRupiahDisplay(rowTotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.ppnEnabled}
                  onChange={(e) => handleFieldChange('ppnEnabled', e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span>Hitung PPN ({formState.ppnRate}%) Otomatis</span>
              </label>
              <div className="text-right font-mono text-xs">
                <span className="text-slate-400 mr-2">Total Tagihan:</span>
                <span className="font-bold text-cyan-400 text-sm">
                  {formatRupiahDisplay(totals.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Informasi Bank & Otorisasi */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Landmark className="w-4 h-4 text-cyan-400" />
              <span>4. Informasi Bank & Otorisasi Tanda Tangan</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama Bank
                </label>
                <input
                  type="text"
                  value={formState.bankName}
                  onChange={(e) => handleFieldChange('bankName', e.target.value)}
                  placeholder="Bank Central Contoh"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  value={formState.bankAccountNumber}
                  onChange={(e) => handleFieldChange('bankAccountNumber', e.target.value)}
                  placeholder="123-456-7890"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Atas Nama Rekening
                </label>
                <input
                  type="text"
                  value={formState.bankAccountHolder}
                  onChange={(e) => handleFieldChange('bankAccountHolder', e.target.value)}
                  placeholder="PT. Perusahaan Anda Sukses"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama Pejabat / Penandatangan
                </label>
                <input
                  type="text"
                  value={formState.signatoryName}
                  onChange={(e) => handleFieldChange('signatoryName', e.target.value)}
                  placeholder="[Nama & Tanda Tangan]"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live A4 Commercial Invoice Document Preview matching attached PDF (7 Cols on XL) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pratinjau Lembar Cetak Standar (A4 - Formulir Invoice)
            </span>
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sinkron Otomatis dengan Form</span>
            </span>
          </div>

          <div
            id="printable-form-invoice"
            className="bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 p-8 sm:p-12 min-h-[840px] flex flex-col justify-between font-sans"
          >
            <div className="space-y-8">
              {/* Top Header: Left INVOICE, Right Company Profile */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                <div>
                  <h2
                    className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                    style={{ color: '#1b365d' }}
                  >
                    INVOICE
                  </h2>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 space-y-0.5 sm:min-w-[270px]">
                  <p className="font-bold text-slate-900">
                    {formState.companyName || '[NAMA PERUSAHAAN ANDA]'}
                  </p>
                  <p>{formState.companyAddress1 || 'Alamat Perusahaan Baris 1'}</p>
                  <p>{formState.companyAddress2 || 'Alamat Perusahaan Baris 2'}</p>
                  <p>Telepon: {formState.companyPhone || '(021) XXXXXXX'}</p>
                  <p>Email: {formState.companyEmail || 'info@perusahaan.com'}</p>
                </div>
              </div>

              {/* Middle Section: DITAGIHKAN KEPADA & INFORMASI INVOICE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-1 text-xs sm:text-sm text-slate-700">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wide mb-1.5">
                    DITAGIHKAN KEPADA:
                  </h3>
                  <p className="font-semibold text-slate-900">
                    {formState.clientName || '[Nama Pelanggan/Perusahaan]'}
                  </p>
                  <p>{formState.clientAddress1 || '[Alamat Pelanggan Baris 1]'}</p>
                  <p>{formState.clientAddress2 || '[Alamat Pelanggan Baris 2]'}</p>
                  <p>{formState.clientContact || '[Telepon / Kontak]'}</p>
                </div>

                <div className="space-y-1 text-xs sm:text-sm text-slate-700 sm:pl-4">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wide mb-1.5">
                    INFORMASI INVOICE:
                  </h3>
                  <p>
                    <span className="font-bold text-slate-800">Nomor Invoice:</span>{' '}
                    <span className="font-mono">{formState.invoiceNumber || 'INV-2026-001'}</span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-800">Tanggal:</span>{' '}
                    {formState.invoiceDate || '26 Oktober 2026'}
                  </p>
                  <p>
                    <span className="font-bold text-slate-800">Metode Pembayaran:</span>{' '}
                    {formState.paymentMethod || 'Transfer Bank'}
                  </p>
                </div>
              </div>

              {/* Main Transaction Table */}
              <div className="pt-2 overflow-x-auto">
                <table className="w-full border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#1b365d' }} className="text-white">
                      <th className="border border-slate-300 px-3 py-2.5 text-left font-bold w-12">
                        No.
                      </th>
                      <th className="border border-slate-300 px-3 py-2.5 text-left font-bold">
                        Deskripsi Produk / Jasa
                      </th>
                      <th className="border border-slate-300 px-3 py-2.5 text-center font-bold w-24">
                        Kuantitas
                      </th>
                      <th className="border border-slate-300 px-3 py-2.5 text-left font-bold w-36">
                        Harga Satuan
                      </th>
                      <th className="border border-slate-300 px-3 py-2.5 text-left font-bold w-36">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formState.items.map((item, index) => {
                      const rowTotal = calculateInvoiceItemTotal(
                        item.quantity,
                        item.unitPrice
                      );
                      return (
                        <tr key={item.id} className="text-slate-900">
                          <td className="border border-slate-300 px-3 py-2 text-left font-mono">
                            {index + 1}
                          </td>
                          <td className="border border-slate-300 px-3 py-2">
                            {item.description || `[Nama Item / Layanan Contoh ${index + 1}]`}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-right font-mono tabular-nums">
                            {item.quantity}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-right font-mono tabular-nums">
                            {formatRupiahDisplay(item.unitPrice)}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-right font-mono tabular-nums">
                            {formatRupiahDisplay(rowTotal)}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Blank filler rows matching the standard PDF form */}
                    {Array.from({ length: blankRowCount }).map((_, idx) => (
                      <tr key={`blank-${idx}`}>
                        <td className="border border-slate-300 px-3 py-2.5">&nbsp;</td>
                        <td className="border border-slate-300 px-3 py-2.5">&nbsp;</td>
                        <td className="border border-slate-300 px-3 py-2.5">&nbsp;</td>
                        <td className="border border-slate-300 px-3 py-2.5">&nbsp;</td>
                        <td className="border border-slate-300 px-3 py-2.5">&nbsp;</td>
                      </tr>
                    ))}

                    {/* Summary Rows: Subtotal, PPN (11%), Total Tagihan */}
                    <tr>
                      <td colSpan={3} className="px-3 py-2 border-none" />
                      <td className="border-b border-slate-300 px-3 py-2 font-bold text-slate-900">
                        Subtotal
                      </td>
                      <td className="border-b border-slate-300 px-3 py-2 text-right font-bold font-mono tabular-nums text-slate-900">
                        {formatRupiahDisplay(totals.subtotal)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-3 py-2 border-none" />
                      <td className="border-b border-slate-300 px-3 py-2 font-bold text-slate-900">
                        PPN ({formState.ppnEnabled ? formState.ppnRate : 0}%)
                      </td>
                      <td className="border-b border-slate-300 px-3 py-2 text-right font-bold font-mono tabular-nums text-slate-900">
                        {formatRupiahDisplay(totals.ppnAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-3 py-2 border-none" />
                      <td className="border-b border-slate-300 px-3 py-2.5 font-bold text-slate-900">
                        Total Tagihan
                      </td>
                      <td className="border-b border-slate-300 px-3 py-2.5 text-right font-bold font-mono tabular-nums text-slate-900">
                        {formatRupiahDisplay(totals.grandTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Section: Bank Info & Official Authorization Signature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 text-xs sm:text-sm text-slate-700">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 mb-1">
                    Informasi Pembayaran Bank:
                  </h4>
                  <p>Nama Bank: {formState.bankName || 'Bank Central Contoh'}</p>
                  <p>Nomor Rekening: {formState.bankAccountNumber || '123-456-7890'}</p>
                  <p>Atas Nama: {formState.bankAccountHolder || 'PT. Perusahaan Anda Sukses'}</p>
                </div>

                <div className="flex flex-col items-center justify-between text-center sm:pl-12">
                  <p className="text-slate-900 font-medium">Hormat Kami,</p>
                  <div className="h-16" />
                  <div className="w-52 border-t border-slate-800 pt-1.5">
                    <p className="text-slate-900 font-medium">
                      {formState.signatoryName || '[Nama & Tanda Tangan]'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Drafts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Daftar Draf Form Invoice Tersimpan ({savedDrafts.length})
            </h3>
          </div>
        </div>

        {savedDrafts.length === 0 ? (
          <p className="text-xs text-slate-400">
            Belum ada draf Form Invoice yang disimpan. Klik tombol <strong>Simpan Draf</strong> di atas untuk menyimpan draf penagihan usaha Anda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Nomor Invoice</th>
                  <th className="py-2.5 px-3">Ditagihkan Kepada (Bill To)</th>
                  <th className="py-2.5 px-3">Tanggal Invoice</th>
                  <th className="py-2.5 px-3 text-right">Total Tagihan</th>
                  <th className="py-2.5 px-3 text-right">Terakhir Disimpan</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {savedDrafts.map((d) => {
                  const dTotals = calculateFormInvoiceTotals(
                    d.items,
                    d.ppnEnabled ? d.ppnRate : 0
                  );
                  return (
                    <tr key={d.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">
                        {d.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">{d.clientName}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {d.invoiceDate}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 tabular-nums">
                        {formatRupiahDisplay(dTotals.grandTotal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        {d.updatedAt}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleLoadDraft(d)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold cursor-pointer"
                          >
                            Muat Draf
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadWord(d)}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold cursor-pointer"
                          >
                            Word
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDraft(d.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
