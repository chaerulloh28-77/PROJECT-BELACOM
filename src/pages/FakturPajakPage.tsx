import React, { useState, useMemo } from 'react';
import { 
  FileCheck, 
  Plus, 
  Search, 
  Printer, 
  Eye, 
  Edit3, 
  Trash2, 
  X, 
  Building2, 
  User, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Copy,
  Download,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { 
  FakturPajakItem, 
  FakturPajakItemLine, 
  StatusFakturPajak 
} from '../types';
import { TouchButton } from '../components/TouchButton';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { BELACOM_PKP_PRESET, FIBER_MEDIA_INDONESIA_PRESET } from '../data/mockData';

// Helper format NPWP (XX.XXX.XXX.X-XXX.XXX)
const formatNPWP = (val: string): string => {
  const digits = val.replace(/\D/g, '');
  if (digits.length >= 15) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}.${digits.slice(8, 9)}-${digits.slice(9, 12)}.${digits.slice(12, 15)}${digits.length > 15 ? '.' + digits.slice(15) : ''}`;
  }
  return val;
};

// Helper format NSFP (XXX.XXX-XX.XXXXXXXXX)
const formatNSFP = (val: string): string => {
  const digits = val.replace(/\D/g, '');
  if (digits.length === 16) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}-${digits.slice(6, 8)}.${digits.slice(8)}`;
  }
  return val;
};

// Official DJP QR Code SVG Component
const DJPQRCodeSvg: React.FC<{ nsfp: string; buyerName: string; dpp: number; ppn: number }> = ({ nsfp, buyerName, dpp, ppn }) => {
  // SVG simulation of authentic 2D matrix QR code with DJP signature styling
  return (
    <div className="flex flex-col items-center">
      <div className="w-28 h-28 border border-slate-900 bg-white p-1 rounded-sm shadow-sm flex items-center justify-center relative">
        <svg viewBox="0 0 100 100" className="w-full h-full text-black">
          {/* Outer corners */}
          <rect x="5" y="5" width="26" height="26" fill="black" />
          <rect x="9" y="9" width="18" height="18" fill="white" />
          <rect x="13" y="13" width="10" height="10" fill="black" />

          <rect x="69" y="5" width="26" height="26" fill="black" />
          <rect x="73" y="9" width="18" height="18" fill="white" />
          <rect x="77" y="13" width="10" height="10" fill="black" />

          <rect x="5" y="69" width="26" height="26" fill="black" />
          <rect x="9" y="73" width="18" height="18" fill="white" />
          <rect x="13" y="77" width="10" height="10" fill="black" />

          {/* Alignment pattern */}
          <rect x="68" y="68" width="18" height="18" fill="black" />
          <rect x="72" y="72" width="10" height="10" fill="white" />
          <rect x="76" y="76" width="2" height="2" fill="black" />

          {/* Timing patterns */}
          <line x1="33" y1="18" x2="67" y2="18" stroke="black" strokeWidth="2" strokeDasharray="3,3" />
          <line x1="18" y1="33" x2="18" y2="67" stroke="black" strokeWidth="2" strokeDasharray="3,3" />

          {/* Matrix data cells */}
          <rect x="36" y="8" width="4" height="4" fill="black" />
          <rect x="44" y="8" width="4" height="4" fill="black" />
          <rect x="56" y="8" width="4" height="4" fill="black" />
          <rect x="40" y="16" width="4" height="4" fill="black" />
          <rect x="48" y="16" width="4" height="4" fill="black" />
          <rect x="60" y="16" width="4" height="4" fill="black" />

          <rect x="8" y="36" width="4" height="4" fill="black" />
          <rect x="8" y="48" width="4" height="4" fill="black" />
          <rect x="8" y="56" width="4" height="4" fill="black" />
          <rect x="16" y="40" width="4" height="4" fill="black" />
          <rect x="16" y="52" width="4" height="4" fill="black" />
          <rect x="16" y="60" width="4" height="4" fill="black" />

          <rect x="35" y="35" width="4" height="4" fill="black" />
          <rect x="45" y="35" width="4" height="4" fill="black" />
          <rect x="55" y="35" width="4" height="4" fill="black" />
          <rect x="65" y="35" width="4" height="4" fill="black" />
          <rect x="40" y="45" width="4" height="4" fill="black" />
          <rect x="50" y="45" width="4" height="4" fill="black" />
          <rect x="60" y="45" width="4" height="4" fill="black" />
          <rect x="35" y="55" width="4" height="4" fill="black" />
          <rect x="45" y="55" width="4" height="4" fill="black" />
          <rect x="55" y="55" width="4" height="4" fill="black" />
          <rect x="65" y="55" width="4" height="4" fill="black" />

          <rect x="36" y="72" width="4" height="4" fill="black" />
          <rect x="48" y="72" width="4" height="4" fill="black" />
          <rect x="56" y="72" width="4" height="4" fill="black" />
          <rect x="40" y="80" width="4" height="4" fill="black" />
          <rect x="48" y="80" width="4" height="4" fill="black" />
          <rect x="60" y="80" width="4" height="4" fill="black" />

          {/* Center tiny DJP mark */}
          <rect x="45" y="45" width="10" height="10" fill="white" />
          <rect x="47" y="47" width="6" height="6" fill="#0f172a" />
        </svg>
      </div>
      <span className="text-[9px] text-slate-600 font-mono text-center mt-1 font-semibold leading-tight">
        Scan Validasi DJP
      </span>
    </div>
  );
};

export const FakturPajakPage: React.FC = () => {
  const { 
    fakturPajakList, 
    addFakturPajak, 
    updateFakturPajak, 
    deleteFakturPajak, 
    showToast 
  } = useProjectContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'SEMUA' | StatusFakturPajak>('SEMUA');
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [previewFaktur, setPreviewFaktur] = useState<FakturPajakItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nsfp: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const defaultLineItem: FakturPajakItemLine = {
    id: 'item-' + Date.now(),
    itemNumber: 1,
    itemCode: '000000',
    name: 'Jasa Penarikan Kabel Fiber Optic & Splicing Interkoneksi POP (Ref WO-BEL-2026-0082)',
    quantity: 1,
    unit: 'Paket',
    unitPrice: 145000000,
    totalPrice: 145000000,
    discount: 0,
    ppnbm: 0,
    netPrice: 145000000
  };

  const [formData, setFormData] = useState<Omit<FakturPajakItem, 'id' | 'createdAt' | 'updatedAt'>>({
    nsfp: '04002600421285795',
    invoiceReference: 'INV233/FMI/JASA/MS-2026',
    fakturDate: new Date().toISOString().substring(0, 10),
    status: 'Approval Sukses',
    seller: { ...BELACOM_PKP_PRESET },
    buyer: { ...FIBER_MEDIA_INDONESIA_PRESET },
    items: [{ ...defaultLineItem }],
    totalGross: 145000000,
    totalDiscount: 0,
    downPayment: 0,
    dpp: 145000000,
    ppnRate: 11,
    ppnAmount: 15950000,
    ppnbmAmount: 0,
    signingCity: 'KOTA BEKASI',
    signatoryName: 'RIO',
    signatoryTitle: 'Kuasa Direksi / Pejabat Penandatangan e-Faktur',
    notes: 'Referensi tagihan INV233/FMI/JASA/MS-2026 atas pekerjaan Belacom.'
  });

  // Calculate totals whenever items or downPayment or ppnRate change
  const recalculateFinancials = (
    items: FakturPajakItemLine[], 
    downPayment: number, 
    ppnRate: number
  ) => {
    const totalGross = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const ppnbmAmount = items.reduce((sum, item) => sum + (item.ppnbm || 0), 0);
    const dpp = Math.max(0, totalGross - totalDiscount - downPayment);
    const ppnAmount = Math.round(dpp * (ppnRate / 100));

    return {
      totalGross,
      totalDiscount,
      downPayment,
      dpp,
      ppnRate,
      ppnAmount,
      ppnbmAmount
    };
  };

  // Handle open add modal
  const handleOpenAdd = () => {
    setEditingId(null);
    const initialItems: FakturPajakItemLine[] = [
      {
        id: 'item-' + Date.now(),
        itemNumber: 1,
        itemCode: '000000',
        name: 'Jasa Penarikan Kabel Fiber Optic & Splicing Interkoneksi POP',
        quantity: 1,
        unit: 'Paket',
        unitPrice: 150000000,
        totalPrice: 150000000,
        discount: 0,
        ppnbm: 0,
        netPrice: 150000000
      }
    ];
    const financials = recalculateFinancials(initialItems, 0, 11);
    
    // Generate new sample NSFP
    const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
    const newNsfp = `040026${randomSuffix}`;

    setFormData({
      nsfp: newNsfp,
      invoiceReference: `INV${Math.floor(200 + Math.random() * 100)}/FMI/JASA/MS-2026`,
      fakturDate: new Date().toISOString().substring(0, 10),
      status: 'Approval Sukses',
      seller: { ...BELACOM_PKP_PRESET },
      buyer: { ...FIBER_MEDIA_INDONESIA_PRESET },
      items: initialItems,
      ...financials,
      signingCity: 'KOTA BEKASI',
      signatoryName: 'RIO',
      signatoryTitle: 'Kuasa Direksi / Pejabat Penandatangan e-Faktur',
      notes: 'Faktur Pajak resmi Belacom Teknologi Indonesia - PT Fiber Media Indonesia'
    });
    setIsFormModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (fp: FakturPajakItem) => {
    setEditingId(fp.id);
    setFormData({
      nsfp: fp.nsfp,
      invoiceReference: fp.invoiceReference,
      fakturDate: fp.fakturDate,
      status: fp.status,
      seller: { ...fp.seller },
      buyer: { ...fp.buyer },
      items: fp.items.map(i => ({ ...i })),
      totalGross: fp.totalGross,
      totalDiscount: fp.totalDiscount,
      downPayment: fp.downPayment,
      dpp: fp.dpp,
      ppnRate: fp.ppnRate,
      ppnAmount: fp.ppnAmount,
      ppnbmAmount: fp.ppnbmAmount,
      signingCity: fp.signingCity,
      signatoryName: fp.signatoryName,
      signatoryTitle: fp.signatoryTitle || 'Kuasa Direksi / Pejabat Penandatangan e-Faktur',
      notes: fp.notes || ''
    });
    setIsFormModalOpen(true);
  };

  // Item Line updates
  const handleItemChange = (index: number, field: keyof FakturPajakItemLine, value: any) => {
    const updated = [...formData.items];
    const current = { ...updated[index], [field]: value };
    
    // Recalculate line total
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      const q = field === 'quantity' ? Number(value) : current.quantity;
      const p = field === 'unitPrice' ? Number(value) : current.unitPrice;
      const d = field === 'discount' ? Number(value) : current.discount;
      current.totalPrice = q * p;
      current.netPrice = Math.max(0, current.totalPrice - d);
    }
    updated[index] = current;
    
    const financials = recalculateFinancials(updated, formData.downPayment, formData.ppnRate);
    setFormData(prev => ({
      ...prev,
      items: updated,
      ...financials
    }));
  };

  const handleAddItem = () => {
    const newItem: FakturPajakItemLine = {
      id: 'item-' + Date.now() + Math.random().toString(36).substr(2, 4),
      itemNumber: formData.items.length + 1,
      itemCode: '000000',
      name: '',
      quantity: 1,
      unit: 'Paket',
      unitPrice: 0,
      totalPrice: 0,
      discount: 0,
      ppnbm: 0,
      netPrice: 0
    };
    const updated = [...formData.items, newItem];
    const financials = recalculateFinancials(updated, formData.downPayment, formData.ppnRate);
    setFormData(prev => ({
      ...prev,
      items: updated,
      ...financials
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) {
      showToast('error', 'Minimal 1 Item', 'Faktur Pajak wajib memiliki minimal 1 baris barang/jasa.');
      return;
    }
    const updated = formData.items.filter((_, idx) => idx !== index).map((it, idx) => ({
      ...it,
      itemNumber: idx + 1
    }));
    const financials = recalculateFinancials(updated, formData.downPayment, formData.ppnRate);
    setFormData(prev => ({
      ...prev,
      items: updated,
      ...financials
    }));
  };

  // Handle Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nsfp.trim()) {
      showToast('error', 'Validasi Gagal', 'Harap isi Nomor Seri Faktur Pajak (NSFP).');
      return;
    }
    if (!formData.buyer.name.trim()) {
      showToast('error', 'Validasi Gagal', 'Nama Pembeli / Penerima Jasa wajib diisi.');
      return;
    }

    if (editingId) {
      updateFakturPajak(editingId, { ...formData });
    } else {
      addFakturPajak({ ...formData });
    }
    setIsFormModalOpen(false);
  };

  // Print A4 Handler
  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return fakturPajakList.filter(fp => {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        fp.nsfp.toLowerCase().includes(q) ||
        fp.invoiceReference.toLowerCase().includes(q) ||
        fp.buyer.name.toLowerCase().includes(q) ||
        fp.seller.name.toLowerCase().includes(q);
      
      const matchStatus = statusFilter === 'SEMUA' || fp.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [fakturPajakList, searchQuery, statusFilter]);

  // Statistics
  const totalDpp = useMemo(() => fakturPajakList.reduce((acc, curr) => acc + (curr.dpp || 0), 0), [fakturPajakList]);
  const totalPpn = useMemo(() => fakturPajakList.reduce((acc, curr) => acc + (curr.ppnAmount || 0), 0), [fakturPajakList]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs uppercase tracking-wider font-semibold">
            <FileCheck className="w-4 h-4" /> Modul e-Faktur Pajak Resmi DJP
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Faktur Pajak Belacom</h2>
          <p className="text-xs text-slate-400">Standar Format Elektronik Direktorat Jenderal Pajak (DJP) & Integrasi Invoice</p>
        </div>

        <TouchButton
          variant="primary"
          size="md"
          icon={<Plus className="w-5 h-5" />}
          onClick={handleOpenAdd}
          showFingerIcon
        >
          + Buat Faktur Pajak
        </TouchButton>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Total Faktur Pajak</span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">{fakturPajakList.length}</span>
            <span className="text-[10px] text-emerald-400 mt-0.5 block">Dokumen Resmi DJP</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Total DPP (Dasar Pengenaan Pajak)</span>
            <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">
              Rp {totalDpp.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Akumulasi Nilai Jasa/Barang</span>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Total PPN 11% Terkumpul</span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
              Rp {totalPpn.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Kewajiban PPN Keluaran</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari NSFP, Ref Invoice, atau Klien..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-3 py-2 outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {(['SEMUA', 'Approval Sukses', 'Draft', 'Siap Upload DJP'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Faktur Pajak */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Kode & Nomor Seri (NSFP)</th>
                <th className="py-2.5 px-3 font-semibold">Ref Invoice & Tanggal</th>
                <th className="py-2.5 px-3 font-semibold">Pembeli / Penerima Jasa</th>
                <th className="py-2.5 px-3 font-semibold text-right">DPP (Rupiah)</th>
                <th className="py-2.5 px-3 font-semibold text-right">PPN 11%</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status DJP</th>
                <th className="py-2.5 px-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredList.map((fp) => (
                <tr key={fp.id} className="hover:bg-slate-850/60 transition-colors">
                  
                  {/* NSFP */}
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-rose-400 font-mono block text-xs">
                      {formatNSFP(fp?.nsfp || '')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Penandatangan: {fp?.signatoryName || '-'}
                    </span>
                  </td>

                  {/* Ref Invoice & Tanggal */}
                  <td className="py-2.5 px-3 font-mono text-[11px]">
                    <span className="font-semibold text-cyan-300 block">{fp?.invoiceReference || '-'}</span>
                    <span className="text-[10px] text-slate-400">Tgl: {fp?.fakturDate || '-'}</span>
                  </td>

                  {/* Pembeli */}
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-200 block text-xs">{fp?.buyer?.name || '-'}</span>
                    <span className="text-[10px] font-mono text-slate-400">NPWP: {formatNPWP(fp?.buyer?.npwp || '')}</span>
                  </td>

                  {/* DPP */}
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-100 text-right">
                    Rp {(fp?.dpp || 0).toLocaleString('id-ID')}
                  </td>

                  {/* PPN */}
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 text-right">
                    Rp {(fp?.ppnAmount || 0).toLocaleString('id-ID')}
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      fp?.status === 'Approval Sukses'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : fp?.status === 'Siap Upload DJP'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : fp?.status === 'Draft'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {fp?.status === 'Approval Sukses' && <CheckCircle2 className="w-2.5 h-2.5" />}
                      {fp?.status === 'Draft' && <Clock className="w-2.5 h-2.5" />}
                      {fp?.status === 'Siap Upload DJP' && <AlertCircle className="w-2.5 h-2.5" />}
                      {fp?.status || 'Draft'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setPreviewFaktur(fp)}
                        className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                        title="Lihat Pratinjau Lembar A4 e-Faktur Resmi"
                      >
                        <Eye className="w-3.5 h-3.5 text-rose-400" />
                        <span className="hidden sm:inline">e-Faktur</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(fp)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
                        title="Edit Faktur Pajak"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteTarget({ id: fp.id, nsfp: fp.nsfp })}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
                        title="Hapus Faktur Pajak"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 font-mono text-xs">
                    Tidak ada Faktur Pajak yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM INPUT / EDIT MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-4">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-white text-base">
                  {editingId ? 'Edit Faktur Pajak' : 'Buat Faktur Pajak Baru (Standar e-Faktur DJP)'}
                </h3>
              </div>
              <button 
                onClick={() => setIsFormModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleFormSubmit} className="p-5 overflow-y-auto space-y-5 text-xs text-slate-200">
              
              {/* Preset Buttons */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Preset Default PKP & Klien</span>
                  <span className="text-[11px] text-slate-400">Muat profil penjual Belacom dan pembeli Fiber Media Indonesia</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      seller: { ...BELACOM_PKP_PRESET },
                      buyer: { ...FIBER_MEDIA_INDONESIA_PRESET }
                    }));
                    showToast('info', 'Preset Dimuat', 'Data PKP Belacom & Client Fiber Media Indonesia diterapkan.');
                  }}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg flex items-center gap-1.5 font-semibold font-mono text-[11px] cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" /> Auto-fill Belacom & FMI
                </button>
              </div>

              {/* Row 1: Header NSFP, Ref Invoice, Tanggal, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="sm:col-span-1">
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Kode & No. Seri (NSFP) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nsfp}
                    onChange={(e) => setFormData(prev => ({ ...prev, nsfp: e.target.value }))}
                    placeholder="04002600421285795"
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-rose-300 font-mono rounded-lg p-2.5 outline-none focus:border-rose-500"
                  />
                  <span className="text-[9px] text-slate-500 mt-0.5 block font-mono">16 Digit Standar DJP</span>
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Referensi Nomor Invoice
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceReference}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceReference: e.target.value }))}
                    placeholder="INV233/FMI/JASA/MS-2026"
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono rounded-lg p-2.5 outline-none focus:border-rose-500"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Tanggal Faktur Pajak
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fakturDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, fakturDate: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono rounded-lg p-2.5 outline-none focus:border-rose-500"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Status e-Faktur
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as StatusFakturPajak }))}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono rounded-lg p-2.5 outline-none focus:border-rose-500"
                  >
                    <option value="Approval Sukses">Approval Sukses</option>
                    <option value="Draft">Draft</option>
                    <option value="Siap Upload DJP">Siap Upload DJP</option>
                    <option value="Batal">Batal</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Penjual (PKP) & Pembeli Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Penjual (PKP) */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold uppercase font-mono text-[11px]">
                    <Building2 className="w-3.5 h-3.5" /> Pengusaha Kena Pajak (Penjual)
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Nama PKP</label>
                    <input
                      type="text"
                      value={formData.seller.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        seller: { ...prev.seller, name: e.target.value }
                      }))}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg p-2 outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">NPWP Penjual (16 Digit)</label>
                    <input
                      type="text"
                      value={formData.seller.npwp}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        seller: { ...prev.seller, npwp: e.target.value }
                      }))}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-mono rounded-lg p-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Alamat Lengkap PKP</label>
                    <textarea
                      rows={2}
                      value={formData.seller.address}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        seller: { ...prev.seller, address: e.target.value }
                      }))}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg p-2 outline-none"
                    />
                  </div>
                </div>

                {/* Pembeli Barang / Penerima Jasa */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase font-mono text-[11px]">
                    <User className="w-3.5 h-3.5" /> Pembeli Barang / Penerima Jasa
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Nama Pembeli / Perusahaan *</label>
                    <input
                      type="text"
                      required
                      value={formData.buyer.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        buyer: { ...prev.buyer, name: e.target.value }
                      }))}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg p-2 outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">NPWP Pembeli (16 Digit)</label>
                    <input
                      type="text"
                      value={formData.buyer.npwp}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        buyer: { ...prev.buyer, npwp: e.target.value }
                      }))}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-mono rounded-lg p-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Alamat Lengkap Pembeli</label>
                    <textarea
                      rows={2}
                      value={formData.buyer.address}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        buyer: { ...prev.buyer, address: e.target.value }
                      }))}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg p-2 outline-none"
                    />
                  </div>
                </div>

              </div>

              {/* Row 3: Dynamic Table of Items */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-100 uppercase font-mono text-xs">
                      Rincian Barang Kena Pajak / Jasa Kena Pajak
                    </h4>
                    <span className="text-[10px] text-slate-400">Kode Barang DJP, deskripsi pekerjaan, harga satuan, dan diskon</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-mono font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Baris
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-2 w-8">No</th>
                        <th className="p-2 w-24">Kode</th>
                        <th className="p-2">Uraian Barang / Jasa</th>
                        <th className="p-2 w-16 text-center">Qty</th>
                        <th className="p-2 w-20">Satuan</th>
                        <th className="p-2 w-32 text-right">Harga Satuan</th>
                        <th className="p-2 w-28 text-right">Potongan</th>
                        <th className="p-2 w-32 text-right">Subtotal</th>
                        <th className="p-2 w-8 text-center">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono">
                      {formData.items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-900/40">
                          <td className="p-2 text-slate-500">{index + 1}</td>
                          
                          <td className="p-1">
                            <input
                              type="text"
                              value={item.itemCode}
                              onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded p-1 outline-none font-mono"
                              placeholder="000000"
                            />
                          </td>

                          <td className="p-1">
                            <input
                              type="text"
                              required
                              value={item.name}
                              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 text-[11px] text-white rounded p-1 outline-none font-sans"
                              placeholder="Nama Barang / Jasa Kena Pajak..."
                            />
                          </td>

                          <td className="p-1 text-center">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full bg-slate-900 border border-slate-800 text-[11px] text-white text-center rounded p-1 outline-none font-mono"
                            />
                          </td>

                          <td className="p-1">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded p-1 outline-none font-mono"
                              placeholder="Paket/Bln"
                            />
                          </td>

                          <td className="p-1 text-right">
                            <input
                              type="number"
                              min={0}
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', parseInt(e.target.value) || 0)}
                              className="w-full bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 text-right rounded p-1 outline-none font-mono"
                            />
                          </td>

                          <td className="p-1 text-right">
                            <input
                              type="number"
                              min={0}
                              value={item.discount}
                              onChange={(e) => handleItemChange(index, 'discount', parseInt(e.target.value) || 0)}
                              className="w-full bg-slate-900 border border-slate-800 text-[11px] text-amber-400 text-right rounded p-1 outline-none font-mono"
                            />
                          </td>

                          <td className="p-2 text-right font-bold text-white">
                            Rp {(item.netPrice || 0).toLocaleString('id-ID')}
                          </td>

                          <td className="p-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculation Summary Block */}
                <div className="border-t border-slate-800 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 block">Dikurangi Uang Muka yang Telah Diterima (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.downPayment}
                      onChange={(e) => {
                        const dp = parseInt(e.target.value) || 0;
                        const financials = recalculateFinancials(formData.items, dp, formData.ppnRate);
                        setFormData(prev => ({ ...prev, ...financials }));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-amber-300 font-mono rounded-lg p-2 outline-none"
                    />

                    <div className="pt-2">
                      <label className="text-[10px] text-slate-400 block mb-1">Catatan Tambahan / Keterangan</label>
                      <input
                        type="text"
                        value={formData.notes || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Contoh: Pembayaran invoice nomor ..."
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg p-2 outline-none"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Harga Jual / Penggantian:</span>
                      <span>Rp {formData.totalGross.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-amber-400/80">
                      <span>Dikurangi Potongan Harga:</span>
                      <span>Rp {formData.totalDiscount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-amber-400/80">
                      <span>Dikurangi Uang Muka:</span>
                      <span>Rp {formData.downPayment.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-white border-t border-slate-800 pt-1.5">
                      <span>Dasar Pengenaan Pajak (DPP):</span>
                      <span className="text-cyan-400">Rp {formData.dpp.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-400">
                      <span>Jumlah PPN (11% x DPP):</span>
                      <span>Rp {formData.ppnAmount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total PPnBM:</span>
                      <span>Rp {formData.ppnbmAmount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Row 4: Pengesahan & Penandatangan */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Kota Tempat Pengesahan</label>
                  <input
                    type="text"
                    value={formData.signingCity}
                    onChange={(e) => setFormData(prev => ({ ...prev, signingCity: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg p-2 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Nama Penandatangan Elektronik</label>
                  <input
                    type="text"
                    required
                    value={formData.signatoryName}
                    onChange={(e) => setFormData(prev => ({ ...prev, signatoryName: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-rose-300 font-bold rounded-lg p-2 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Jabatan Penandatangan</label>
                  <input
                    type="text"
                    value={formData.signatoryTitle || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, signatoryTitle: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg p-2 outline-none"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <TouchButton variant="secondary" size="md" type="button" onClick={() => setIsFormModalOpen(false)}>
                  Batal
                </TouchButton>
                <TouchButton variant="primary" size="md" type="submit" showFingerIcon>
                  {editingId ? 'Simpan Perubahan' : 'Terbitkan Faktur Pajak'}
                </TouchButton>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL DJP A4 e-FAKTUR PREVIEW MODAL */}
      {previewFaktur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
            
            {/* Modal Header Toolbar (Hidden in print) */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950 print:hidden">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-white text-xs sm:text-sm font-mono">
                  Pratinjau Resmi Lembar e-Faktur Pajak Standar DJP
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {previewFaktur.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-900/40 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak / Simpan PDF
                </button>
                <button
                  onClick={() => setPreviewFaktur(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 PAPER CONTAINER */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950/80 flex justify-center print:p-0 print:bg-white print:overflow-visible">
              
              {/* Authentic DJP Document Sheet */}
              <div 
                id="djp-efaktur-print-area"
                className="w-full max-w-[794px] bg-white text-slate-900 p-6 sm:p-8 font-sans border-2 border-slate-950 shadow-2xl print:border-2 print:border-black print:shadow-none print:p-6 print:m-0 text-[11px] leading-tight"
                style={{ minHeight: '1050px' }}
              >
                
                {/* Header Judul Resmi */}
                <div className="text-center pb-2 mb-3 border-b-2 border-slate-950">
                  <h1 className="text-xl sm:text-2xl font-serif font-black tracking-widest uppercase underline decoration-double">
                    FAKTUR PAJAK
                  </h1>
                </div>

                {/* Kode dan Nomor Seri Faktur Pajak */}
                <div className="border-b-2 border-slate-950 pb-2 mb-2 font-mono">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="w-64 font-bold text-slate-900">Kode dan Nomor Seri Faktur Pajak :</span>
                    <span className="font-extrabold text-slate-950 tracking-wider text-sm">
                      {formatNSFP(previewFaktur.nsfp)}
                    </span>
                  </div>
                </div>

                {/* Pengusaha Kena Pajak */}
                <div className="border-b-2 border-slate-950 pb-2 mb-2">
                  <div className="font-bold uppercase tracking-wider text-xs bg-slate-100 p-1 mb-1 border border-slate-300">
                    Pengusaha Kena Pajak
                  </div>
                  <div className="grid grid-cols-1 gap-0.5 pl-1">
                    <div className="flex">
                      <span className="w-24 text-slate-700">Nama</span>
                      <span className="w-3">:</span>
                      <span className="font-bold text-slate-950">{previewFaktur.seller.name}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 text-slate-700 shrink-0">Alamat</span>
                      <span className="w-3 shrink-0">:</span>
                      <span className="text-slate-800">{previewFaktur.seller.address}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-700">NPWP</span>
                      <span className="w-3">:</span>
                      <span className="font-mono font-bold text-slate-950">{formatNPWP(previewFaktur.seller.npwp)}</span>
                    </div>
                  </div>
                </div>

                {/* Pembeli Barang Kena Pajak / Penerima Jasa Kena Pajak */}
                <div className="border-b-2 border-slate-950 pb-2 mb-3">
                  <div className="font-bold uppercase tracking-wider text-xs bg-slate-100 p-1 mb-1 border border-slate-300">
                    Pembeli Barang Kena Pajak / Penerima Jasa Kena Pajak
                  </div>
                  <div className="grid grid-cols-1 gap-0.5 pl-1">
                    <div className="flex">
                      <span className="w-24 text-slate-700">Nama</span>
                      <span className="w-3">:</span>
                      <span className="font-bold text-slate-950">{previewFaktur.buyer.name}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 text-slate-700 shrink-0">Alamat</span>
                      <span className="w-3 shrink-0">:</span>
                      <span className="text-slate-800">{previewFaktur.buyer.address}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-700">NPWP</span>
                      <span className="w-3">:</span>
                      <span className="font-mono font-bold text-slate-950">{formatNPWP(previewFaktur.buyer.npwp)}</span>
                    </div>
                  </div>
                </div>

                {/* Tabel Barang Kena Pajak / Jasa Kena Pajak */}
                <div className="border border-slate-950 mb-3">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-950 text-slate-950 font-bold uppercase text-center">
                        <th className="border-r border-slate-950 p-1.5 w-8">No. Urut</th>
                        <th className="border-r border-slate-950 p-1.5">
                          Nama Barang Kena Pajak / Jasa Kena Pajak
                        </th>
                        <th className="p-1.5 w-44 text-right">
                          Harga Jual / Penggantian / Uang Muka / Termin (Rp)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-400">
                      {previewFaktur.items.map((item, index) => (
                        <tr key={item.id} className="align-top">
                          <td className="border-r border-slate-950 p-1.5 text-center font-mono">
                            {index + 1}
                          </td>
                          <td className="border-r border-slate-950 p-1.5">
                            <div className="font-semibold text-slate-950">{item.name}</div>
                            <div className="text-[9px] text-slate-600 font-mono mt-0.5">
                              {item.quantity} {item.unit} x Rp {item.unitPrice.toLocaleString('id-ID')}
                              {item.discount > 0 && ` (Potongan: Rp ${item.discount.toLocaleString('id-ID')})`}
                            </div>
                            <div className="text-[8px] text-slate-400 font-mono">
                              Kode Barang/Jasa: {item.itemCode || '000000'}
                            </div>
                          </td>
                          <td className="p-1.5 text-right font-mono font-bold text-slate-950">
                            Rp {item.netPrice.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                      
                      {/* Empty padding rows to preserve authentic height */}
                      {previewFaktur.items.length === 1 && (
                        <tr className="h-16">
                          <td className="border-r border-slate-950"></td>
                          <td className="border-r border-slate-950"></td>
                          <td></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Perhitungan Pajak Ringkasan */}
                <div className="border border-slate-950 mb-4 font-mono text-[10px]">
                  <div className="flex border-b border-slate-950">
                    <div className="w-2/3 p-1.5 font-sans font-medium text-slate-800 border-r border-slate-950">
                      Harga Jual / Penggantian
                    </div>
                    <div className="w-1/3 p-1.5 text-right font-bold text-slate-950">
                      Rp {previewFaktur.totalGross.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="flex border-b border-slate-950">
                    <div className="w-2/3 p-1.5 font-sans font-medium text-slate-800 border-r border-slate-950">
                      Dikurangi Potongan Harga
                    </div>
                    <div className="w-1/3 p-1.5 text-right text-slate-800">
                      Rp {previewFaktur.totalDiscount.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="flex border-b border-slate-950">
                    <div className="w-2/3 p-1.5 font-sans font-medium text-slate-800 border-r border-slate-950">
                      Dikurangi Uang Muka yang telah diterima
                    </div>
                    <div className="w-1/3 p-1.5 text-right text-slate-800">
                      Rp {previewFaktur.downPayment.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="flex border-b border-slate-950 bg-slate-50 font-bold">
                    <div className="w-2/3 p-1.5 font-sans text-slate-950 border-r border-slate-950">
                      Dasar Pengenaan Pajak (DPP)
                    </div>
                    <div className="w-1/3 p-1.5 text-right text-slate-950">
                      Rp {previewFaktur.dpp.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="flex border-b border-slate-950 bg-slate-50 font-bold">
                    <div className="w-2/3 p-1.5 font-sans text-slate-950 border-r border-slate-950">
                      Jumlah PPN = {previewFaktur.ppnRate}% x Dasar Pengenaan Pajak
                    </div>
                    <div className="w-1/3 p-1.5 text-right text-slate-950">
                      Rp {previewFaktur.ppnAmount.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="flex">
                    <div className="w-2/3 p-1.5 font-sans font-medium text-slate-800 border-r border-slate-950">
                      Total PPnBM (Pajak Penjualan atas Barang Mewah)
                    </div>
                    <div className="w-1/3 p-1.5 text-right text-slate-800">
                      Rp {previewFaktur.ppnbmAmount.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                {/* Klausul Legal DJP dan Tanda Tangan Elektronik */}
                <div className="border border-slate-950 p-3 mb-4 text-[9px] text-slate-700 leading-normal">
                  <p className="font-semibold text-slate-900 mb-1">
                    Sesuai dengan ketentuan yang berlaku, Direktorat Jenderal Pajak mengatur bahwa Faktur Pajak ini telah ditandatangani secara elektronik sehingga tidak memerlukan tanda tangan basah pada Faktur Pajak ini.
                  </p>
                  <p className="italic text-slate-600">
                    Pemberitahuan: Faktur Pajak ini telah dilaporkan ke Direktorat Jenderal Pajak dan telah memperoleh persetujuan sesuai dengan ketentuan peraturan perpajakan yang berlaku (UU PPN Pasal 13 ayat 9 / UU KUP Pasal 14 ayat 4).
                  </p>
                </div>

                {/* Footer Signatory Box & QR Code */}
                <div className="flex items-end justify-between pt-2">
                  <div className="w-48 text-[9px] text-slate-500 font-mono">
                    <div>No. Ref: {previewFaktur.invoiceReference}</div>
                    <div>Dicetak pada: {new Date().toLocaleDateString('id-ID')}</div>
                    <div>Sistem: BELACOM Project ERP</div>
                  </div>

                  {/* QR Code DJP Verification */}
                  <div className="flex flex-col items-center">
                    <DJPQRCodeSvg 
                      nsfp={previewFaktur.nsfp} 
                      buyerName={previewFaktur.buyer.name} 
                      dpp={previewFaktur.dpp} 
                      ppn={previewFaktur.ppnAmount} 
                    />
                  </div>

                  {/* Signatory Name */}
                  <div className="text-right w-64">
                    <div className="font-mono text-[10px] text-slate-800">
                      {previewFaktur.signingCity}, {previewFaktur.fakturDate}
                    </div>
                    <div className="mt-14 font-extrabold uppercase text-slate-950 tracking-wider text-xs underline">
                      {previewFaktur.signatoryName}
                    </div>
                    <div className="text-[9px] text-slate-600 font-sans mt-0.5">
                      {previewFaktur.signatoryTitle || 'Kuasa Direksi / Pejabat Penandatangan'}
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={true}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteFakturPajak(deleteTarget.id);
            setDeleteTarget(null);
          }}
          title="Konfirmasi Hapus Faktur Pajak"
          itemIdentifier={`NSFP: ${formatNSFP(deleteTarget.nsfp)}`}
          message="Faktur Pajak ini akan dihapus secara permanen dari sistem dan tidak dapat dipulihkan."
        />
      )}

    </div>
  );
};
