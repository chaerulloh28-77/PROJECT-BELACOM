import {
  FormInvoiceLineItem,
  FormFakturPajakLineItem,
  calculateInvoiceItemTotal,
  calculateFormInvoiceTotals,
  calculateFakturPajakTotals,
  formatRupiahDisplay,
} from './formCalculations';

export interface FormInvoiceWordPayload {
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
}

export interface FormFakturPajakWordPayload {
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
}

function escapeHtml(value: string | number | undefined | null): string {
  const str = String(value ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildFormInvoiceWordHtml(data: FormInvoiceWordPayload): string {
  const safeItems = Array.isArray(data.items) ? data.items : [];
  const totals = calculateFormInvoiceTotals(
    safeItems,
    data.ppnEnabled ? data.ppnRate : 0
  );
  const minRows = Math.max(5, safeItems.length);
  const blankCount = Math.max(0, minRows - safeItems.length);

  const itemRowsHtml = safeItems
    .map((item, idx) => {
      const rowTotal = calculateInvoiceItemTotal(item.quantity, item.unitPrice);
      return `
        <tr>
          <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:left;font-family:Consolas,monospace;font-size:10.5pt;">${idx + 1}</td>
          <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:left;font-size:10.5pt;">${escapeHtml(
            item.description || `[Nama Item / Layanan Contoh ${idx + 1}]`
          )}</td>
          <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right;font-family:Consolas,monospace;font-size:10.5pt;">${escapeHtml(
            item.quantity
          )}</td>
          <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right;font-family:Consolas,monospace;font-size:10.5pt;">${escapeHtml(
            formatRupiahDisplay(item.unitPrice)
          )}</td>
          <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right;font-family:Consolas,monospace;font-size:10.5pt;">${escapeHtml(
            formatRupiahDisplay(rowTotal)
          )}</td>
        </tr>
      `;
    })
    .join('');

  const blankRowsHtml = Array.from({ length: blankCount })
    .map(
      () => `
        <tr>
          <td style="border:1px solid #cbd5e1;padding:8px 10px;">&nbsp;</td>
          <td style="border:1px solid #cbd5e1;padding:8px 10px;">&nbsp;</td>
          <td style="border:1px solid #cbd5e1;padding:8px 10px;">&nbsp;</td>
          <td style="border:1px solid #cbd5e1;padding:8px 10px;">&nbsp;</td>
          <td style="border:1px solid #cbd5e1;padding:8px 10px;">&nbsp;</td>
        </tr>
      `
    )
    .join('');

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>Form Invoice - ${escapeHtml(data.invoiceNumber || 'INV-2026-001')}</title>
  <style>
    @page Section1 {
      size: 21cm 29.7cm;
      margin: 2cm 2cm 2cm 2cm;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      font-size: 10.5pt;
      line-height: 1.45;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
  </style>
</head>
<body>
  <div class="Section1">
    <table style="width:100%;border:none;margin-bottom:24px;">
      <tr>
        <td style="width:50%;vertical-align:top;border:none;">
          <div style="font-size:26pt;font-weight:bold;color:#1b365d;letter-spacing:0.5px;">INVOICE</div>
        </td>
        <td style="width:50%;vertical-align:top;border:none;font-size:10.5pt;color:#334155;">
          <div style="font-weight:bold;color:#0f172a;margin-bottom:2px;">${escapeHtml(
            data.companyName || '[NAMA PERUSAHAAN ANDA]'
          )}</div>
          <div>${escapeHtml(data.companyAddress1 || 'Alamat Perusahaan Baris 1')}</div>
          <div>${escapeHtml(data.companyAddress2 || 'Alamat Perusahaan Baris 2')}</div>
          <div>Telepon: ${escapeHtml(data.companyPhone || '(021) XXXXXXX')}</div>
          <div>Email: ${escapeHtml(data.companyEmail || 'info@perusahaan.com')}</div>
        </td>
      </tr>
    </table>

    <table style="width:100%;border:none;margin-bottom:22px;">
      <tr>
        <td style="width:50%;vertical-align:top;border:none;padding-right:16px;">
          <div style="font-weight:bold;color:#0f172a;text-transform:uppercase;margin-bottom:6px;">DITAGIHKAN KEPADA:</div>
          <div style="font-weight:bold;color:#0f172a;">${escapeHtml(
            data.clientName || '[Nama Pelanggan/Perusahaan]'
          )}</div>
          <div>${escapeHtml(data.clientAddress1 || '[Alamat Pelanggan Baris 1]')}</div>
          <div>${escapeHtml(data.clientAddress2 || '[Alamat Pelanggan Baris 2]')}</div>
          <div>${escapeHtml(data.clientContact || '[Telepon / Kontak]')}</div>
        </td>
        <td style="width:50%;vertical-align:top;border:none;">
          <div style="font-weight:bold;color:#0f172a;text-transform:uppercase;margin-bottom:6px;">INFORMASI INVOICE:</div>
          <div><strong>Nomor Invoice:</strong> ${escapeHtml(
            data.invoiceNumber || 'INV-2026-001'
          )}</div>
          <div><strong>Tanggal:</strong> ${escapeHtml(
            data.invoiceDate || '26 Oktober 2026'
          )}</div>
          <div><strong>Metode Pembayaran:</strong> ${escapeHtml(
            data.paymentMethod || 'Transfer Bank'
          )}</div>
        </td>
      </tr>
    </table>

    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      <thead>
        <tr style="background-color:#1b365d;color:#ffffff;">
          <th style="border:1px solid #cbd5e1;padding:9px 10px;text-align:left;width:8%;color:#ffffff;background-color:#1b365d;">No.</th>
          <th style="border:1px solid #cbd5e1;padding:9px 10px;text-align:left;width:44%;color:#ffffff;background-color:#1b365d;">Deskripsi Produk / Jasa</th>
          <th style="border:1px solid #cbd5e1;padding:9px 10px;text-align:center;width:12%;color:#ffffff;background-color:#1b365d;">Kuantitas</th>
          <th style="border:1px solid #cbd5e1;padding:9px 10px;text-align:left;width:18%;color:#ffffff;background-color:#1b365d;">Harga Satuan</th>
          <th style="border:1px solid #cbd5e1;padding:9px 10px;text-align:left;width:18%;color:#ffffff;background-color:#1b365d;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
        ${blankRowsHtml}
        <tr>
          <td colspan="3" style="border:none;padding:8px 10px;"></td>
          <td style="border-bottom:1px solid #cbd5e1;padding:8px 10px;font-weight:bold;color:#0f172a;">Subtotal</td>
          <td style="border-bottom:1px solid #cbd5e1;padding:8px 10px;text-align:right;font-weight:bold;font-family:Consolas,monospace;color:#0f172a;">${escapeHtml(
            formatRupiahDisplay(totals.subtotal)
          )}</td>
        </tr>
        <tr>
          <td colspan="3" style="border:none;padding:8px 10px;"></td>
          <td style="border-bottom:1px solid #cbd5e1;padding:8px 10px;font-weight:bold;color:#0f172a;">PPN (${
            data.ppnEnabled ? data.ppnRate : 0
          }%)</td>
          <td style="border-bottom:1px solid #cbd5e1;padding:8px 10px;text-align:right;font-weight:bold;font-family:Consolas,monospace;color:#0f172a;">${escapeHtml(
            formatRupiahDisplay(totals.ppnAmount)
          )}</td>
        </tr>
        <tr>
          <td colspan="3" style="border:none;padding:8px 10px;"></td>
          <td style="border-bottom:1px solid #cbd5e1;padding:9px 10px;font-weight:bold;color:#0f172a;">Total Tagihan</td>
          <td style="border-bottom:1px solid #cbd5e1;padding:9px 10px;text-align:right;font-weight:bold;font-family:Consolas,monospace;color:#0f172a;">${escapeHtml(
            formatRupiahDisplay(totals.grandTotal)
          )}</td>
        </tr>
      </tbody>
    </table>

    <table style="width:100%;border:none;margin-top:30px;">
      <tr>
        <td style="width:55%;vertical-align:top;border:none;">
          <div style="font-weight:bold;color:#0f172a;margin-bottom:4px;">Informasi Pembayaran Bank:</div>
          <div>Nama Bank: ${escapeHtml(data.bankName || 'Bank Central Contoh')}</div>
          <div>Nomor Rekening: ${escapeHtml(data.bankAccountNumber || '123-456-7890')}</div>
          <div>Atas Nama: ${escapeHtml(
            data.bankAccountHolder || 'PT. Perusahaan Anda Sukses'
          )}</div>
        </td>
        <td style="width:45%;vertical-align:top;text-align:center;border:none;">
          <div style="margin-bottom:64px;color:#0f172a;">Hormat Kami,</div>
          <div style="border-top:1px solid #0f172a;display:inline-block;padding-top:6px;min-width:200px;font-weight:bold;color:#0f172a;">
            ${escapeHtml(data.signatoryName || '[Nama & Tanda Tangan]')}
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

export function buildFormFakturPajakWordHtml(data: FormFakturPajakWordPayload): string {
  const safeItems = Array.isArray(data.items) ? data.items : [];
  const taxTotals = calculateFakturPajakTotals(
    safeItems,
    data.potonganHarga,
    data.uangMukaDiterima,
    data.totalPpnbm,
    11
  );
  const totalRows = Math.max(5, safeItems.length);
  const rows = Array.from({ length: totalRows }, (_, idx) => {
    return safeItems[idx] || { id: `empty-${idx}`, name: '', amount: 0 };
  });
  const hasAnyAmount = taxTotals.jumlahHargaJual > 0;
  const dotsLong = '..............................................................................';
  const dotsAmount = '.................................';

  const itemRowsHtml = rows
    .map(
      (row, idx) => `
      <tr>
        <td style="border:1px solid #334155;padding:7px 8px;text-align:left;font-family:Consolas,monospace;font-size:10pt;">${
          idx + 1
        }</td>
        <td style="border:1px solid #334155;padding:7px 10px;text-align:left;font-size:10pt;">${escapeHtml(
          row.name?.trim() ? row.name : dotsLong
        )}</td>
        <td style="border:1px solid #334155;padding:7px 10px;text-align:right;font-family:Consolas,monospace;font-size:10pt;">${escapeHtml(
          row.amount > 0 ? formatRupiahDisplay(row.amount) : dotsAmount
        )}</td>
      </tr>
    `
    )
    .join('');

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>Form Faktur Pajak - ${escapeHtml(data.nsfpCode || 'DJP')}</title>
  <style>
    @page Section1 {
      size: 21cm 29.7cm;
      margin: 1.8cm 1.8cm 1.8cm 1.8cm;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000000;
      font-size: 10pt;
      line-height: 1.4;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
  </style>
</head>
<body>
  <div class="Section1">
    <div style="text-align:center;font-size:16pt;font-weight:bold;margin-bottom:14px;letter-spacing:0.5px;">
      FAKTUR PAJAK
    </div>

    <div style="font-weight:bold;margin-bottom:12px;font-size:10.5pt;">
      Kode &amp; Nomor Seri Faktur Pajak :
      <span style="font-family:Consolas,monospace;margin-left:8px;">${escapeHtml(
        data.nsfpCode?.trim() || '..................................................................'
      )}</span>
    </div>

    <table style="width:100%;border:1px solid #1e293b;margin-bottom:12px;">
      <tr>
        <td colspan="2" style="background-color:#e2e8f0;border:1px solid #1e293b;padding:6px 10px;font-weight:bold;text-transform:uppercase;">
          PENGUSAHA KENA PAJAK
        </td>
      </tr>
      <tr>
        <td style="width:24%;border:1px solid #cbd5e1;padding:6px 10px;">Nama :</td>
        <td style="width:76%;border:1px solid #cbd5e1;padding:6px 10px;font-weight:bold;">${escapeHtml(
          data.pkpName?.trim() || dotsLong
        )}</td>
      </tr>
      <tr>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;">Alamat :</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;">${escapeHtml(
          data.pkpAddress?.trim() || dotsLong
        )}</td>
      </tr>
      <tr>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;">NPWP / TIN :</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;font-family:Consolas,monospace;">${escapeHtml(
          data.pkpNpwp?.trim() || dotsLong
        )}</td>
      </tr>
    </table>

    <table style="width:100%;border:1px solid #1e293b;margin-bottom:14px;">
      <tr>
        <td colspan="2" style="background-color:#e2e8f0;border:1px solid #1e293b;padding:6px 10px;font-weight:bold;text-transform:uppercase;">
          PEMBELI BARANG KENA PAJAK / PENERIMA JASA KENA PAJAK
        </td>
      </tr>
      <tr>
        <td style="width:24%;border:1px solid #cbd5e1;padding:6px 10px;">Nama :</td>
        <td style="width:76%;border:1px solid #cbd5e1;padding:6px 10px;font-weight:bold;">${escapeHtml(
          data.buyerName?.trim() || dotsLong
        )}</td>
      </tr>
      <tr>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;">Alamat :</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;">${escapeHtml(
          data.buyerAddress?.trim() || dotsLong
        )}</td>
      </tr>
      <tr>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;">NPWP / NIK / TIN :</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;font-family:Consolas,monospace;">${escapeHtml(
          data.buyerNpwpNik?.trim() || dotsLong
        )}</td>
      </tr>
    </table>

    <table style="width:100%;border:1px solid #1e293b;margin-bottom:24px;">
      <thead>
        <tr style="background-color:#001489;color:#ffffff;">
          <th style="border:1px solid #1e293b;padding:8px;text-align:left;width:8%;background-color:#001489;color:#ffffff;">No.</th>
          <th style="border:1px solid #1e293b;padding:8px 10px;text-align:left;width:60%;background-color:#001489;color:#ffffff;">Nama Barang Kena Pajak / Jasa Kena Pajak</th>
          <th style="border:1px solid #1e293b;padding:8px 10px;text-align:left;width:32%;background-color:#001489;color:#ffffff;">Harga Jual/Penggantian/Uang Muka/Termin (Rp)</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
        <tr>
          <td colspan="2" style="border:1px solid #334155;padding:7px 10px;font-weight:bold;">Harga Jual / Penggantian / Uang Muka / Termin</td>
          <td style="border:1px solid #334155;padding:7px 10px;text-align:right;font-family:Consolas,monospace;font-weight:bold;">${escapeHtml(
            hasAnyAmount ? formatRupiahDisplay(taxTotals.jumlahHargaJual) : dotsAmount
          )}</td>
        </tr>
        <tr>
          <td colspan="2" style="border:1px solid #334155;padding:7px 10px;font-weight:bold;">Dikurangi Potongan Harga</td>
          <td style="border:1px solid #334155;padding:7px 10px;text-align:right;font-family:Consolas,monospace;">${escapeHtml(
            hasAnyAmount || taxTotals.potonganHarga > 0
              ? formatRupiahDisplay(taxTotals.potonganHarga)
              : dotsAmount
          )}</td>
        </tr>
        <tr>
          <td colspan="2" style="border:1px solid #334155;padding:7px 10px;font-weight:bold;">Dikurangi Uang Muka yang telah diterima</td>
          <td style="border:1px solid #334155;padding:7px 10px;text-align:right;font-family:Consolas,monospace;">${escapeHtml(
            hasAnyAmount || taxTotals.uangMukaDiterima > 0
              ? formatRupiahDisplay(taxTotals.uangMukaDiterima)
              : dotsAmount
          )}</td>
        </tr>
        <tr>
          <td colspan="2" style="border:1px solid #334155;padding:7px 10px;font-weight:bold;">Dasar Pengenaan Pajak (DPP)</td>
          <td style="border:1px solid #334155;padding:7px 10px;text-align:right;font-family:Consolas,monospace;font-weight:bold;">${escapeHtml(
            hasAnyAmount ? formatRupiahDisplay(taxTotals.dpp) : dotsAmount
          )}</td>
        </tr>
        <tr>
          <td colspan="2" style="border:1px solid #334155;padding:7px 10px;font-weight:bold;">PPN = 11% x DPP</td>
          <td style="border:1px solid #334155;padding:7px 10px;text-align:right;font-family:Consolas,monospace;font-weight:bold;">${escapeHtml(
            hasAnyAmount ? formatRupiahDisplay(taxTotals.ppn) : dotsAmount
          )}</td>
        </tr>
        <tr>
          <td colspan="2" style="border:1px solid #334155;padding:7px 10px;font-weight:bold;">Total PPnBM (Pajak Penjualan Barang Mewah)</td>
          <td style="border:1px solid #334155;padding:7px 10px;text-align:right;font-family:Consolas,monospace;">${escapeHtml(
            hasAnyAmount || taxTotals.totalPpnbm > 0
              ? formatRupiahDisplay(taxTotals.totalPpnbm)
              : dotsAmount
          )}</td>
        </tr>
      </tbody>
    </table>

    <table style="width:100%;border:none;margin-top:20px;">
      <tr>
        <td style="width:52%;border:none;"></td>
        <td style="width:48%;border:none;text-align:left;">
          <div>${escapeHtml(data.titimangsaCity?.trim() || '.........................')}, ${escapeHtml(
            data.titimangsaDate?.trim() || '..............................'
          )}</div>
          <div style="margin-top:4px;margin-bottom:60px;">Nama &amp; Tanda Tangan Pengurus / Kuasa PKP</div>
          <div style="font-weight:bold;">( ${escapeHtml(
            data.signatoryName?.trim() ||
              '............................................................'
          )} )</div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

function triggerWordDownload(htmlContent: string, filename: string): void {
  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportFormInvoiceToWord(data: FormInvoiceWordPayload): void {
  const html = buildFormInvoiceWordHtml(data);
  const safeNo = (data.invoiceNumber || 'INV-2026-001').replace(/[^a-zA-Z0-9_-]/g, '_');
  triggerWordDownload(html, `Form_Invoice_${safeNo}.doc`);
}

export function exportFormFakturPajakToWord(data: FormFakturPajakWordPayload): void {
  const html = buildFormFakturPajakWordHtml(data);
  const safeCode = (data.nsfpCode || 'DJP').replace(/[^a-zA-Z0-9_-]/g, '_');
  triggerWordDownload(html, `Form_Faktur_Pajak_${safeCode}.doc`);
}
