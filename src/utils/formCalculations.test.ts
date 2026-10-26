import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateInvoiceItemTotal,
  calculateFormInvoiceTotals,
  calculateFakturPajakTotals,
  formatRupiahDisplay,
} from './formCalculations';
import {
  buildFormInvoiceWordHtml,
  buildFormFakturPajakWordHtml,
} from './formWordExport';

test('calculateInvoiceItemTotal computes quantity * unitPrice accurately', () => {
  assert.equal(calculateInvoiceItemTotal(2, 500000), 1000000);
  assert.equal(calculateInvoiceItemTotal(1, 750000), 750000);
  assert.equal(calculateInvoiceItemTotal(-3, 500000), 0);
});

test('calculateFormInvoiceTotals matches sample PDF invoice totals (Subtotal 1.750.000, PPN 192.500, Total 1.942.500)', () => {
  const totals = calculateFormInvoiceTotals([
    { quantity: 2, unitPrice: 500000 },
    { quantity: 1, unitPrice: 750000 },
  ]);
  assert.deepEqual(totals.itemTotals, [1000000, 750000]);
  assert.equal(totals.subtotal, 1750000);
  assert.equal(totals.ppnAmount, 192500);
  assert.equal(totals.grandTotal, 1942500);
});

test('calculateFakturPajakTotals computes Harga Jual, DPP, and 11% PPN accurately', () => {
  const res = calculateFakturPajakTotals(
    [
      { amount: 15000000 },
      { amount: 10000000 },
    ],
    1000000,
    4000000,
    0
  );
  assert.equal(res.jumlahHargaJual, 25000000);
  assert.equal(res.potonganHarga, 1000000);
  assert.equal(res.uangMukaDiterima, 4000000);
  assert.equal(res.dpp, 20000000);
  assert.equal(res.ppn, 2200000);
  assert.equal(res.totalPpnbm, 0);
});

test('formatRupiahDisplay formats numbers with Indonesian thousand separators', () => {
  assert.equal(formatRupiahDisplay(1942500), 'Rp 1.942.500');
  assert.equal(formatRupiahDisplay(1750000, false), '1.750.000');
});

test('buildFormInvoiceWordHtml produces valid Word document HTML with invoice details and totals', () => {
  const html = buildFormInvoiceWordHtml({
    companyName: 'PT. BELACOM INDONESIA TELECOM',
    companyAddress1: 'Jl. TB Simatupang',
    companyAddress2: 'Jakarta Selatan',
    companyPhone: '(021) 789-4560',
    companyEmail: 'finance@belacom.co.id',
    clientName: 'PT. Mitra Jaringan Nusantara',
    clientAddress1: 'Gedung Cyber',
    clientAddress2: 'Jakarta Selatan',
    clientContact: '021-5201122',
    invoiceNumber: 'INV-2026-001',
    invoiceDate: '26 Oktober 2026',
    paymentMethod: 'Transfer Bank',
    items: [
      { id: '1', description: 'Layanan 1', quantity: 2, unitPrice: 500000 },
      { id: '2', description: 'Layanan 2', quantity: 1, unitPrice: 750000 },
    ],
    ppnEnabled: true,
    ppnRate: 11,
    bankName: 'BCA',
    bankAccountNumber: '123-456-7890',
    bankAccountHolder: 'PT. Belacom Indonesia Telecom',
    signatoryName: 'Direktur Keuangan',
  });
  assert.ok(html.includes('INVOICE'));
  assert.ok(html.includes('INV-2026-001'));
  assert.ok(html.includes('Rp 1.942.500'));
});

test('buildFormFakturPajakWordHtml produces valid Word document HTML with DJP sections and PPN 11%', () => {
  const html = buildFormFakturPajakWordHtml({
    nsfpCode: '010.000-26.00000125',
    pkpName: 'PT. BELACOM INDONESIA TELECOM',
    pkpAddress: 'Jakarta Selatan',
    pkpNpwp: '01.234.567.8-012.000',
    buyerName: 'PT. Mitra Jaringan Nusantara',
    buyerAddress: 'Jakarta Selatan',
    buyerNpwpNik: '02.876.543.2-045.000',
    items: [{ id: '1', name: 'Jasa Interkoneksi FO', amount: 10000000 }],
    potonganHarga: 0,
    uangMukaDiterima: 0,
    totalPpnbm: 0,
    titimangsaCity: 'Jakarta',
    titimangsaDate: '26 Oktober 2026',
    signatoryName: 'Budi Santoso',
  });
  assert.ok(html.includes('FAKTUR PAJAK'));
  assert.ok(html.includes('010.000-26.00000125'));
  assert.ok(html.includes('Rp 1.100.000'));
});
