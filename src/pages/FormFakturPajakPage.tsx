import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Plus,
  Trash2,
  Save,
  ShieldCheck,
  Building2,
  UserCheck,
  Calculator,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import {
  FormFakturPajakLineItem,
  calculateFakturPajakTotals,
  formatRupiahDisplay,
} from '../utils/formCalculations';
import { exportFormFakturPajakToWord } from '../utils/formWordExport';

export interface FormFakturPajakDraft {
  id: string;
  nsfpCode: string;
  pkpName: string;
  pkpAddress: string;
  pkpNpwp: string;
  buyerName: string;
  buyerAddress: string;
  buyerNpwpNik: string;
  items: FormFakturPajakLineItem[];
  potonganHarga: number;
  uangMukaDiterima: number;
  totalPpnbm: number;
  titimangsaCity: string;
  titimangsaDate: string;
  signatoryName: string;
  updatedAt: string;
}

const STORAGE_KEY_FAKTUR_PAJAK_DRAFTS = 'belacom_form_faktur_pajak_drafts_v1';

const DEFAULT_FAKTUR_PAJAK_DRAFT: Omit<FormFakturPajakDraft, 'id' | 'updatedAt'> = {
  nsfpCode: '010.000-26.00000125',
  pkpName: 'PT. BELACOM INDONESIA TELECOM',
  pkpAddress: 'Jl. TB Simatupang Kav. 88, Jakarta Selatan, DKI Jakarta 12520',
  pkpNpwp: '01.234.567.8-012.000',
  buyerName: 'PT. Mitra Jaringan Nusantara',
  buyerAddress: 'Gedung Cyber Lt. 8, Jl. Kuningan Barat No. 8, Jakarta Selatan',
  buyerNpwpNik: '02.876.543.2-045.000',
  items: [
    {
      id: 'fp-1',
      name: 'Jasa Konstruksi & Interkoneksi Jaringan Fiber Optik POP (Area Jabo 1)',
      amount: 15000000,
    },
    {
      id: 'fp-2',
      name: 'Jasa Splicing Core, Terminasi OTB & Pengujian End-to-End OTDR/OPM',
      amount: 10000000,
    },
  ],
  potonganHarga: 0,
  uangMukaDiterima: 0,
  totalPpnbm: 0,
  titimangsaCity: 'Jakarta',
  titimangsaDate: '26 Oktober 2026',
  signatoryName: 'Budi Santoso, S.E. (Direktur Keuangan)',
};

const DOTS_LONG =
  '.....................................................................................';
const DOTS_AMOUNT = '.................................';

export const FormFakturPajakPage: React.FC = () => {
  const { showToast } = useProjectContext();

  const [formState, setFormState] = useState<Omit<FormFakturPajakDraft, 'id' | 'updatedAt'>>(() => {
    try {
      const savedActive = localStorage.getItem('belacom_form_faktur_pajak_active_v1');
      if (savedActive) {
        return { ...DEFAULT_FAKTUR_PAJAK_DRAFT, ...JSON.parse(savedActive) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_FAKTUR_PAJAK_DRAFT;
  });

  const [savedDrafts, setSavedDrafts] = useState<FormFakturPajakDraft[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FAKTUR_PAJAK_DRAFTS);
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
      localStorage.setItem('belacom_form_faktur_pajak_active_v1', JSON.stringify(formState));
    } catch {
      // ignore
    }
  }, [formState]);

  const taxTotals = calculateFakturPajakTotals(
    formState.items,
    formState.potonganHarga,
    formState.uangMukaDiterima,
    formState.totalPpnbm,
    11
  );

  const handleFieldChange = <K extends keyof typeof formState>(
    field: K,
    value: (typeof formState)[K]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (
    id: string,
    field: keyof FormFakturPajakLineItem,
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
    const newItem: FormFakturPajakLineItem = {
      id: 'fp-' + Date.now(),
      name: '',
      amount: 0,
    };
    setFormState((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleRemoveItem = (id: string) => {
    if (formState.items.length <= 1) {
      showToast('error', 'Minimal 1 Baris', 'Tabel transaksi Faktur Pajak minimal memiliki 1 baris.');
      return;
    }
    setFormState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const handleSaveDraft = () => {
    const codeLabel = formState.nsfpCode.trim() || 'DRAF-TANPA-NSFP';
    const now = new Date().toLocaleString('id-ID');
    const newDraft: FormFakturPajakDraft = {
      ...formState,
      nsfpCode: codeLabel,
      id: 'DRAFT-FP-' + Date.now(),
      updatedAt: now,
    };
    const updated = [newDraft, ...savedDrafts.filter((d) => d.nsfpCode !== codeLabel)];
    setSavedDrafts(updated);
    localStorage.setItem(STORAGE_KEY_FAKTUR_PAJAK_DRAFTS, JSON.stringify(updated));
    showToast('success', 'Draf Faktur Pajak Disimpan', `NSFP ${codeLabel} berhasil disimpan.`);
  };

  const handleLoadDraft = (draft: FormFakturPajakDraft) => {
    const { id: _id, updatedAt: _u, ...rest } = draft;
    setFormState(rest);
    showToast('info', 'Draf Dimuat', `Draf Faktur Pajak ${draft.nsfpCode} telah dimuat.`);
  };

  const handleDeleteDraft = (id: string) => {
    const updated = savedDrafts.filter((d) => d.id !== id);
    setSavedDrafts(updated);
    localStorage.setItem(STORAGE_KEY_FAKTUR_PAJAK_DRAFTS, JSON.stringify(updated));
    showToast('info', 'Draf Dihapus', 'Draf Faktur Pajak telah dihapus.');
  };

  const handleDownloadWord = (targetData: Omit<FormFakturPajakDraft, 'id' | 'updatedAt'> = formState) => {
    exportFormFakturPajakToWord(targetData);
    showToast(
      'success',
      'Berhasil Mengunduh Word',
      `Dokumen Word Faktur Pajak (${targetData.nsfpCode || 'DJP'}) berhasil diunduh.`
    );
  };

  // Ensure at least 5 rows in the preview table (rows 1..5) matching the DJP template
  const totalPreviewRows = Math.max(5, formState.items.length);
  const previewRows = Array.from({ length: totalPreviewRows }, (_, idx) => {
    return formState.items[idx] || { id: `empty-${idx}`, name: '', amount: 0 };
  });

  const hasAnyAmount = taxTotals.jumlahHargaJual > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 lg:p-6 shadow-lg">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Form Faktur Pajak (Standar Konvensional)
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm whitespace-nowrap shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Draf</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadWord(formState)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download Word (.doc)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Workspace: Left = Form Editor, Right = Live A4 Faktur Pajak Sheet */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Inputs (5 Cols on XL) */}
        <div className="xl:col-span-5 space-y-5">
          {/* 1. Header Resmi (NSFP) & 2. Identitas PKP Penjual */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>1. Kode NSFP & Identitas PKP (Penjual)</span>
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Kode & Nomor Seri Faktur Pajak (NSFP)
              </label>
              <input
                type="text"
                value={formState.nsfpCode}
                onChange={(e) => handleFieldChange('nsfpCode', e.target.value)}
                placeholder="010.000-26.00000125"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block">
                Pengusaha Kena Pajak (Penjual)
              </span>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama PKP
                </label>
                <input
                  type="text"
                  value={formState.pkpName}
                  onChange={(e) => handleFieldChange('pkpName', e.target.value)}
                  placeholder="PT. BELACOM INDONESIA TELECOM"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Alamat Lengkap PKP
                </label>
                <input
                  type="text"
                  value={formState.pkpAddress}
                  onChange={(e) => handleFieldChange('pkpAddress', e.target.value)}
                  placeholder="Alamat lengkap Pengusaha Kena Pajak"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  NPWP / TIN PKP
                </label>
                <input
                  type="text"
                  value={formState.pkpNpwp}
                  onChange={(e) => handleFieldChange('pkpNpwp', e.target.value)}
                  placeholder="01.234.567.8-012.000"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Identitas Pembeli BKP / Penerima JKP */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span>2. Identitas Pembeli BKP / Penerima JKP</span>
            </h2>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nama Pembeli / Penerima Jasa
              </label>
              <input
                type="text"
                value={formState.buyerName}
                onChange={(e) => handleFieldChange('buyerName', e.target.value)}
                placeholder="Nama Perusahaan / Pelanggan Pembeli"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Alamat Lengkap Pembeli
              </label>
              <input
                type="text"
                value={formState.buyerAddress}
                onChange={(e) => handleFieldChange('buyerAddress', e.target.value)}
                placeholder="Alamat lengkap Pembeli BKP / Penerima JKP"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                NPWP / NIK / TIN Pembeli
              </label>
              <input
                type="text"
                value={formState.buyerNpwpNik}
                onChange={(e) => handleFieldChange('buyerNpwpNik', e.target.value)}
                placeholder="02.876.543.2-045.000"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 4. Tabel Transaksi BKP / JKP */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                <span>3. Rincian BKP / JKP</span>
              </h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div className="space-y-3">
              {formState.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-400">
                      Baris #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label={`Hapus Baris ${idx + 1}`}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Nama Barang Kena Pajak / Jasa Kena Pajak
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      placeholder="Uraian BKP / JKP..."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Harga Jual / Penggantian / Uang Muka / Termin (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={item.amount}
                      onChange={(e) =>
                        handleItemChange(item.id, 'amount', Number(e.target.value))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Kalkulasi Pajak & 6. Otorisasi */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Calculator className="w-4 h-4 text-blue-400" />
              <span>4. Kalkulasi Pajak (DPP, PPN 11%, PPnBM) & Otorisasi</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Potongan Harga (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formState.potonganHarga}
                  onChange={(e) =>
                    handleFieldChange('potonganHarga', Number(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Uang Muka (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formState.uangMukaDiterima}
                  onChange={(e) =>
                    handleFieldChange('uangMukaDiterima', Number(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Total PPnBM (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formState.totalPpnbm}
                  onChange={(e) =>
                    handleFieldChange('totalPpnbm', Number(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Harga Jual / Penggantian:</span>
                <span className="text-slate-200 tabular-nums">
                  {formatRupiahDisplay(taxTotals.jumlahHargaJual)}
                </span>
              </div>
              <div className="flex justify-between text-slate-300 font-bold">
                <span>Dasar Pengenaan Pajak (DPP):</span>
                <span className="text-cyan-400 tabular-nums">
                  {formatRupiahDisplay(taxTotals.dpp)}
                </span>
              </div>
              <div className="flex justify-between text-slate-300 font-bold">
                <span>PPN = 11% x DPP:</span>
                <span className="text-emerald-400 tabular-nums">
                  {formatRupiahDisplay(taxTotals.ppn)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Kota (Titimangsa)
                </label>
                <input
                  type="text"
                  value={formState.titimangsaCity}
                  onChange={(e) => handleFieldChange('titimangsaCity', e.target.value)}
                  placeholder="Jakarta"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tanggal (Titimangsa)
                </label>
                <input
                  type="text"
                  value={formState.titimangsaDate}
                  onChange={(e) => handleFieldChange('titimangsaDate', e.target.value)}
                  placeholder="26 Oktober 2026"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pengurus / Kuasa PKP
                </label>
                <input
                  type="text"
                  value={formState.signatoryName}
                  onChange={(e) => handleFieldChange('signatoryName', e.target.value)}
                  placeholder="Nama Pejabat PKP"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live A4 DJP Faktur Pajak Preview matching attached PDF (7 Cols on XL) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pratinjau Lembar Cetak Standar (A4 - Formulir Faktur Pajak)
            </span>
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sesuai Format Konvensional</span>
            </span>
          </div>

          <div
            id="printable-faktur-pajak"
            className="bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 p-7 sm:p-10 min-h-[860px] flex flex-col justify-between font-sans"
          >
            <div className="space-y-5">
              {/* Center Title: FAKTUR PAJAK */}
              <div className="text-center pt-1 pb-2">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-wide text-black uppercase">
                  FAKTUR PAJAK
                </h2>
              </div>

              {/* Kode & Nomor Seri Faktur Pajak */}
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-bold text-black">
                <span>Kode &amp; Nomor Seri Faktur Pajak :</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formState.nsfpCode.trim()
                    ? formState.nsfpCode
                    : '..................................................................'}
                </span>
              </div>

              {/* Box 1: PENGUSAHA KENA PAJAK */}
              <div className="border border-slate-800 text-xs sm:text-sm">
                <div className="bg-slate-200 border-b border-slate-800 px-3 py-1.5 font-bold text-black uppercase">
                  PENGUSAHA KENA PAJAK
                </div>
                <div className="divide-y divide-slate-300">
                  <div className="grid grid-cols-12 px-3 py-1.5">
                    <span className="col-span-3 text-slate-900">Nama :</span>
                    <span className="col-span-9 font-medium text-slate-900 truncate">
                      {formState.pkpName.trim() || DOTS_LONG}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 px-3 py-1.5">
                    <span className="col-span-3 text-slate-900">Alamat :</span>
                    <span className="col-span-9 text-slate-900 truncate">
                      {formState.pkpAddress.trim() || DOTS_LONG}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 px-3 py-1.5">
                    <span className="col-span-3 text-slate-900">NPWP / TIN :</span>
                    <span className="col-span-9 font-mono text-slate-900 truncate">
                      {formState.pkpNpwp.trim() || DOTS_LONG}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 2: PEMBELI BARANG KENA PAJAK / PENERIMA JASA KENA PAJAK */}
              <div className="border border-slate-800 text-xs sm:text-sm">
                <div className="bg-slate-200 border-b border-slate-800 px-3 py-1.5 font-bold text-black uppercase">
                  PEMBELI BARANG KENA PAJAK / PENERIMA JASA KENA PAJAK
                </div>
                <div className="divide-y divide-slate-300">
                  <div className="grid grid-cols-12 px-3 py-1.5">
                    <span className="col-span-3 text-slate-900">Nama :</span>
                    <span className="col-span-9 font-medium text-slate-900 truncate">
                      {formState.buyerName.trim() || DOTS_LONG}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 px-3 py-1.5">
                    <span className="col-span-3 text-slate-900">Alamat :</span>
                    <span className="col-span-9 text-slate-900 truncate">
                      {formState.buyerAddress.trim() || DOTS_LONG}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 px-3 py-1.5">
                    <span className="col-span-3 text-slate-900">NPWP / NIK / TIN :</span>
                    <span className="col-span-9 font-mono text-slate-900 truncate">
                      {formState.buyerNpwpNik.trim() || DOTS_LONG}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Table: Royal Navy Header (#001489) matching the attached PDF */}
              <div className="w-full">
                <table className="w-full table-fixed border-collapse border border-slate-800 text-xs sm:text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#001489' }} className="text-white">
                      <th className="border border-slate-800 px-2.5 py-2.5 text-left font-bold w-[8%]">
                        No.
                      </th>
                      <th className="border border-slate-800 px-3 py-2.5 text-left font-bold w-[60%]">
                        Nama Barang Kena Pajak / Jasa Kena Pajak
                      </th>
                      <th className="border border-slate-800 px-3 py-2.5 text-left font-bold w-[32%]">
                        Harga Jual/Penggantian/Uang Muka/Termin (Rp)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr key={row.id} className="text-slate-900">
                        <td className="border border-slate-600 px-2.5 py-2 text-left font-mono">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-600 px-3 py-2 truncate overflow-hidden">
                          {row.name.trim() ? row.name : DOTS_LONG}
                        </td>
                        <td className="border border-slate-600 px-3 py-2 text-right font-mono tabular-nums truncate overflow-hidden">
                          {row.amount > 0
                            ? formatRupiahDisplay(row.amount)
                            : DOTS_AMOUNT}
                        </td>
                      </tr>
                    ))}

                    {/* 6 Tax Calculation Rows matching the PDF */}
                    <tr>
                      <td
                        colSpan={2}
                        className="border border-slate-600 px-3 py-2 font-bold text-black"
                      >
                        Harga Jual / Penggantian / Uang Muka / Termin
                      </td>
                      <td className="border border-slate-600 px-3 py-2 text-right font-mono font-bold tabular-nums text-slate-900 truncate overflow-hidden">
                        {hasAnyAmount
                          ? formatRupiahDisplay(taxTotals.jumlahHargaJual)
                          : DOTS_AMOUNT}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={2}
                        className="border border-slate-600 px-3 py-2 font-bold text-black"
                      >
                        Dikurangi Potongan Harga
                      </td>
                      <td className="border border-slate-600 px-3 py-2 text-right font-mono tabular-nums text-slate-900 truncate overflow-hidden">
                        {hasAnyAmount || taxTotals.potonganHarga > 0
                          ? formatRupiahDisplay(taxTotals.potonganHarga)
                          : DOTS_AMOUNT}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={2}
                        className="border border-slate-600 px-3 py-2 font-bold text-black"
                      >
                        Dikurangi Uang Muka yang telah diterima
                      </td>
                      <td className="border border-slate-600 px-3 py-2 text-right font-mono tabular-nums text-slate-900 truncate overflow-hidden">
                        {hasAnyAmount || taxTotals.uangMukaDiterima > 0
                          ? formatRupiahDisplay(taxTotals.uangMukaDiterima)
                          : DOTS_AMOUNT}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={2}
                        className="border border-slate-600 px-3 py-2 font-bold text-black"
                      >
                        Dasar Pengenaan Pajak (DPP)
                      </td>
                      <td className="border border-slate-600 px-3 py-2 text-right font-mono font-bold tabular-nums text-slate-900 truncate overflow-hidden">
                        {hasAnyAmount
                          ? formatRupiahDisplay(taxTotals.dpp)
                          : DOTS_AMOUNT}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={2}
                        className="border border-slate-600 px-3 py-2 font-bold text-black"
                      >
                        PPN = 11% x DPP
                      </td>
                      <td className="border border-slate-600 px-3 py-2 text-right font-mono font-bold tabular-nums text-slate-900 truncate overflow-hidden">
                        {hasAnyAmount
                          ? formatRupiahDisplay(taxTotals.ppn)
                          : DOTS_AMOUNT}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={2}
                        className="border border-slate-600 px-3 py-2 font-bold text-black"
                      >
                        Total PPnBM (Pajak Penjualan Barang Mewah)
                      </td>
                      <td className="border border-slate-600 px-3 py-2 text-right font-mono tabular-nums text-slate-900 truncate overflow-hidden">
                        {hasAnyAmount || taxTotals.totalPpnbm > 0
                          ? formatRupiahDisplay(taxTotals.totalPpnbm)
                          : DOTS_AMOUNT}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Right: Titimangsa & Otorisasi Pengurus / Kuasa PKP */}
              <div className="pt-6 flex justify-end text-xs sm:text-sm text-slate-900">
                <div className="w-72 space-y-1.5 text-left">
                  <p>
                    {formState.titimangsaCity.trim() || '.........................'},{' '}
                    {formState.titimangsaDate.trim() || '..............................'}
                  </p>
                  <p>Nama &amp; Tanda Tangan Pengurus / Kuasa PKP</p>
                  <div className="h-16" />
                  <p className="font-medium">
                    ({' '}
                    {formState.signatoryName.trim()
                      ? formState.signatoryName
                      : '............................................................'}{' '}
                    )
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Faktur Pajak Drafts List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">
              Daftar Draf Form Faktur Pajak Tersimpan ({savedDrafts.length})
            </h3>
          </div>
        </div>

        {savedDrafts.length === 0 ? (
          <p className="text-xs text-slate-400">
            Belum ada draf Faktur Pajak yang disimpan. Klik tombol <strong>Simpan Draf</strong> di atas untuk menyimpan draf administrasi pajak internal Anda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Kode &amp; Nomor Seri (NSFP)</th>
                  <th className="py-2.5 px-3">Pembeli BKP / Penerima JKP</th>
                  <th className="py-2.5 px-3 text-right">DPP</th>
                  <th className="py-2.5 px-3 text-right">PPN (11%)</th>
                  <th className="py-2.5 px-3 text-right">Terakhir Disimpan</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {savedDrafts.map((d) => {
                  const dCalc = calculateFakturPajakTotals(
                    d.items,
                    d.potonganHarga,
                    d.uangMukaDiterima,
                    d.totalPpnbm,
                    11
                  );
                  return (
                    <tr key={d.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-400">
                        {d.nsfpCode}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">
                        {d.buyerName || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-200 tabular-nums">
                        {formatRupiahDisplay(dCalc.dpp)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 tabular-nums">
                        {formatRupiahDisplay(dCalc.ppn)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        {d.updatedAt}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleLoadDraft(d)}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold cursor-pointer"
                          >
                            Muat Draf
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadWord(d)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold cursor-pointer"
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
