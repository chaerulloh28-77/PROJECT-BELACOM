export interface FormInvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface FormInvoiceTotals {
  itemTotals: number[];
  subtotal: number;
  ppnAmount: number;
  grandTotal: number;
}

export interface FormFakturPajakLineItem {
  id: string;
  name: string;
  amount: number;
}

export interface FormFakturPajakTotals {
  jumlahHargaJual: number;
  potonganHarga: number;
  uangMukaDiterima: number;
  dpp: number;
  ppn: number;
  totalPpnbm: number;
}

export function calculateInvoiceItemTotal(quantity: number, unitPrice: number): number {
  const safeQty = Math.max(0, Number(quantity) || 0);
  const safePrice = Math.max(0, Number(unitPrice) || 0);
  return Math.round(safeQty * safePrice);
}

export function calculateFormInvoiceTotals(
  items: Array<{ quantity: number; unitPrice: number }>,
  ppnRatePercent = 11
): FormInvoiceTotals {
  const safeItems = Array.isArray(items) ? items : [];
  const itemTotals = safeItems.map((item) =>
    calculateInvoiceItemTotal(item?.quantity ?? 0, item?.unitPrice ?? 0)
  );
  const subtotal = itemTotals.reduce((acc, val) => acc + val, 0);
  const safeRate = Math.max(0, Number(ppnRatePercent) || 0);
  const ppnAmount = Math.round(subtotal * (safeRate / 100));
  const grandTotal = subtotal + ppnAmount;

  return {
    itemTotals,
    subtotal,
    ppnAmount,
    grandTotal,
  };
}

export function calculateFakturPajakTotals(
  items: Array<{ amount: number }>,
  potonganHargaInput: number,
  uangMukaInput: number,
  ppnbmInput = 0,
  ppnRatePercent = 11
): FormFakturPajakTotals {
  const safeItems = Array.isArray(items) ? items : [];
  const jumlahHargaJual = safeItems.reduce(
    (acc, item) => acc + Math.max(0, Math.round(Number(item?.amount) || 0)),
    0
  );
  const potonganHarga = Math.max(0, Math.round(Number(potonganHargaInput) || 0));
  const uangMukaDiterima = Math.max(0, Math.round(Number(uangMukaInput) || 0));
  const dpp = Math.max(0, jumlahHargaJual - potonganHarga - uangMukaDiterima);
  const safeRate = Math.max(0, Number(ppnRatePercent) || 0);
  const ppn = Math.round(dpp * (safeRate / 100));
  const totalPpnbm = Math.max(0, Math.round(Number(ppnbmInput) || 0));

  return {
    jumlahHargaJual,
    potonganHarga,
    uangMukaDiterima,
    dpp,
    ppn,
    totalPpnbm,
  };
}

export function formatRupiahDisplay(amount: number, includePrefix = true): string {
  const safeNum = Math.round(Number(amount) || 0);
  const formatted = safeNum.toLocaleString('id-ID');
  return includePrefix ? `Rp ${formatted}` : formatted;
}
