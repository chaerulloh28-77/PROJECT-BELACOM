/**
 * Utilitas Ekspor Dokumen Excel (.xls) dengan Pratinjau Visual Gambar/Foto Dokumentasi
 * PT Belacom Indonesia Telecom
 * 
 * Format: HTML-based XML Spreadsheet (.xls)
 * Mendukung rendering gambar visual langsung dalam sel tabel Excel.
 */

import { DailyReportItem, BASTItem, PDFFileMeta } from '../types';
import { generateVisualDocDataUrl } from './bastExportHelper';
import { calculateWorkDays } from './dateUtils';

/**
 * Mendapatkan Data URL gambar visual (dari imageDataUrl, url, atau SVG visual generator fallback)
 */
export function getPhotoVisualUrl(
  fileMeta?: PDFFileMeta,
  fallbackCat: string = 'FOTO DOKUMENTASI',
  woNumber: string = '',
  bastNumber: string = ''
): string {
  if (fileMeta?.imageDataUrl && fileMeta.imageDataUrl.startsWith('data:')) {
    return fileMeta.imageDataUrl;
  }
  if (fileMeta?.url && fileMeta.url.startsWith('data:image/')) {
    return fileMeta.url;
  }
  // Generator visual SVG fallback jika tidak ada data URL gambar
  return generateVisualDocDataUrl(fallbackCat, fileMeta?.name || `${fallbackCat}.jpg`, woNumber, bastNumber);
}

/**
 * Format helper tanggal Indonesia
 */
function formatDateIndo(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Ekspor Rekap Daily Report ke File Excel (.xls) dengan Visual Gambar Dokumentasi
 */
export function exportDailyReportToExcel(reports: DailyReportItem[], customFilename?: string): void {
  if (typeof document === 'undefined' || reports.length === 0) return;

  const title = reports.length === 1 
    ? `REKAP DAILY REPORT - WO ${reports[0].woNumber}` 
    : `REKAP KESELURUHAN DAILY REPORT (${reports.length} WORK ORDER)`;

  const filename = customFilename || (
    reports.length === 1 
      ? `DailyReport_${reports[0].woNumber.replace(/[/\\?%*:|"<>]/g, '_')}.xls`
      : `Rekap_DailyReport_Semua_WO_${new Date().toISOString().slice(0, 10)}.xls`
  );

  let html = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <style>
      body { font-family: Calibri, Arial, sans-serif; margin: 0; padding: 10px; background-color: #ffffff; }
      table { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 11pt; }
      .title-cell { background-color: #0f172a; color: #38bdf8; font-size: 16pt; font-weight: bold; text-align: center; padding: 14px; border: 1px solid #0284c7; }
      .meta-cell { background-color: #1e293b; color: #cbd5e1; font-size: 10pt; text-align: center; padding: 6px; border: 1px solid #334155; }
      th { background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: center; padding: 10px 8px; border: 1px solid #334155; font-size: 10.5pt; vertical-align: middle; }
      td { border: 1px solid #cbd5e1; padding: 8px 10px; vertical-align: middle; text-align: left; }
      tr.even { background-color: #f8fafc; }
      tr.odd { background-color: #ffffff; }
      .center { text-align: center; }
      .font-mono { font-family: Consolas, monospace; }
      .bold { font-weight: bold; }
      .badge-done { background-color: #d1fae5; color: #065f46; font-weight: bold; padding: 4px 8px; border-radius: 4px; text-align: center; }
      .badge-progress { background-color: #e0f2fe; color: #0369a1; font-weight: bold; padding: 4px 8px; border-radius: 4px; text-align: center; }
      .badge-cancel { background-color: #ffe4e6; color: #9f1239; font-weight: bold; padding: 4px 8px; border-radius: 4px; text-align: center; }
      .img-cell { text-align: center; padding: 6px; background-color: #09101d; }
      img.doc-img { max-width: 140px; max-height: 100px; width: 140px; height: 90px; object-fit: contain; border: 1px solid #334155; border-radius: 4px; display: block; margin: 0 auto; }
      .img-label { font-size: 8.5pt; color: #94a3b8; font-family: Consolas, monospace; margin-top: 3px; display: block; text-align: center; }
    </style>
  </head>
  <body>
    <table>
      <thead>
        <tr>
          <th colspan="15" class="title-cell">PT. BELACOM INDONESIA TELECOM — ${title}</th>
        </tr>
        <tr>
          <td colspan="15" class="meta-cell">Tanggal Cetak: ${new Date().toLocaleString('id-ID')} | Total Item: ${reports.length} Work Order</td>
        </tr>
        <tr>
          <th style="width: 40px;">No</th>
          <th style="width: 130px;">No. WO</th>
          <th style="width: 140px;">Kategori WO</th>
          <th style="width: 180px;">Uraian Pekerjaan</th>
          <th style="width: 90px;">Assignment</th>
          <th style="width: 80px;">Tim</th>
          <th style="width: 100px;">Status WO</th>
          <th style="width: 90px;">Tgl Rilis</th>
          <th style="width: 90px;">Tgl Selesai</th>
          <th style="width: 70px;">Durasi</th>
          <th style="width: 160px;">Foto Closure</th>
          <th style="width: 160px;">Foto OPM Test</th>
          <th style="width: 160px;">Foto OLS Test</th>
          <th style="width: 160px;">Foto BTS</th>
          <th style="width: 160px;">Foto OTDR Trace</th>
        </tr>
      </thead>
      <tbody>
  `;

  reports.forEach((item, index) => {
    const rowClass = index % 2 === 0 ? 'even' : 'odd';
    
    // Status Badge CSS Class
    let statusClass = 'badge-progress';
    if (item.statusWo === 'Done') statusClass = 'badge-done';
    else if (item.statusWo === 'Cancel') statusClass = 'badge-cancel';

    // Photos
    const closureImg = getPhotoVisualUrl(item.documentation?.fotoClosurePdf, 'FOTO CLOSURE', item.woNumber);
    const opmImg = getPhotoVisualUrl(item.documentation?.opmPdf, 'OPM TEST RESULT', item.woNumber);
    const olsImg = getPhotoVisualUrl(item.documentation?.olsPdf, 'OLS TEST RESULT', item.woNumber);
    const btsImg = getPhotoVisualUrl(item.documentation?.btsPdf, 'FOTO LOKASI BTS', item.woNumber);
    const otdrImg = getPhotoVisualUrl(item.documentation?.otdrPdf, 'OTDR TRACE TEST', item.woNumber);

    html += `
        <tr class="${rowClass}">
          <td class="center bold">${index + 1}</td>
          <td class="bold font-mono" style="color: #0284c7;">${item.woNumber}</td>
          <td>${item.woType}</td>
          <td>${item.workType || '-'}</td>
          <td class="center">${item.assignment}</td>
          <td class="center bold font-mono">${item.team}</td>
          <td class="center"><span class="${statusClass}">${item.statusWo}</span></td>
          <td class="center">${formatDateIndo(item.releaseDate)}</td>
          <td class="center">${formatDateIndo(item.finishDate)}</td>
          <td class="center font-mono">${calculateWorkDays(item.startDate, item.finishDate) || item.durationDays || 1} Hari</td>
          <td class="img-cell">
            <img class="doc-img" src="${closureImg}" alt="Closure" />
            <span class="img-label">${item.documentation?.fotoClosurePdf?.name || 'Closure.jpg'}</span>
          </td>
          <td class="img-cell">
            <img class="doc-img" src="${opmImg}" alt="OPM" />
            <span class="img-label">${item.documentation?.opmPdf?.name || 'OPM_Test.jpg'}</span>
          </td>
          <td class="img-cell">
            <img class="doc-img" src="${olsImg}" alt="OLS" />
            <span class="img-label">${item.documentation?.olsPdf?.name || 'OLS_Test.jpg'}</span>
          </td>
          <td class="img-cell">
            <img class="doc-img" src="${btsImg}" alt="BTS" />
            <span class="img-label">${item.documentation?.btsPdf?.name || 'BTS_Site.jpg'}</span>
          </td>
          <td class="img-cell">
            <img class="doc-img" src="${otdrImg}" alt="OTDR" />
            <span class="img-label">${item.documentation?.otdrPdf?.name || 'OTDR_Trace.jpg'}</span>
          </td>
        </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  </body>
  </html>
  `;

  downloadExcelBlob(html, filename);
}

/**
 * Ekspor Rekap BAST ke File Excel (.xls) dengan Visual Gambar Dokumentasi & Sub-Routing Workflow Status
 */
export function exportBASTToExcel(items: BASTItem[], customFilename?: string): void {
  if (typeof document === 'undefined' || items.length === 0) return;

  const title = items.length === 1 
    ? `BERKAS BAST - WO ${items[0].woNumber}` 
    : `REKAP KESELURUHAN BAST (${items.length} DOKUMEN BAST)`;

  const filename = customFilename || (
    items.length === 1 
      ? `BAST_${items[0].woNumber.replace(/[/\\?%*:|"<>]/g, '_')}.xls`
      : `Rekap_BAST_Semua_WO_${new Date().toISOString().slice(0, 10)}.xls`
  );

  let html = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <style>
      body { font-family: Calibri, Arial, sans-serif; margin: 0; padding: 10px; background-color: #ffffff; }
      table { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 11pt; }
      .title-cell { background-color: #0f172a; color: #10b981; font-size: 16pt; font-weight: bold; text-align: center; padding: 14px; border: 1px solid #059669; }
      .meta-cell { background-color: #1e293b; color: #cbd5e1; font-size: 10pt; text-align: center; padding: 6px; border: 1px solid #334155; }
      th { background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: center; padding: 10px 8px; border: 1px solid #334155; font-size: 10.5pt; vertical-align: middle; }
      td { border: 1px solid #cbd5e1; padding: 8px 10px; vertical-align: middle; text-align: left; }
      tr.even { background-color: #f8fafc; }
      tr.odd { background-color: #ffffff; }
      .center { text-align: center; }
      .font-mono { font-family: Consolas, monospace; }
      .bold { font-weight: bold; }
      .badge-done { background-color: #d1fae5; color: #065f46; font-weight: bold; padding: 4px 8px; border-radius: 4px; text-align: center; }
      .badge-progress { background-color: #e0f2fe; color: #0369a1; font-weight: bold; padding: 4px 8px; border-radius: 4px; text-align: center; }
      .badge-rev { background-color: #fef3c7; color: #92400e; font-weight: bold; padding: 4px 8px; border-radius: 4px; text-align: center; }
      .wf-box { font-size: 9.5pt; line-height: 1.4; }
      .wf-step { font-weight: bold; color: #0f172a; }
      .wf-ok { color: #059669; font-weight: bold; }
      .wf-pending { color: #d97706; }
      .img-cell { text-align: center; padding: 6px; background-color: #09101d; }
      .img-container { display: flex; flex-direction: row; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap; }
      img.doc-img { max-width: 140px; max-height: 100px; width: 140px; height: 90px; object-fit: contain; border: 1px solid #334155; border-radius: 4px; display: inline-block; margin: 3px; }
      .img-label { font-size: 8.5pt; color: #94a3b8; font-family: Consolas, monospace; margin-top: 3px; display: block; text-align: center; }
    </style>
  </head>
  <body>
    <table>
      <thead>
        <tr>
          <th colspan="13" class="title-cell">PT. BELACOM INDONESIA TELECOM — ${title}</th>
        </tr>
        <tr>
          <td colspan="13" class="meta-cell">Tanggal Cetak: ${new Date().toLocaleString('id-ID')} | Total Dokumen BAST: ${items.length} Item</td>
        </tr>
        <tr>
          <th style="width: 40px;">No</th>
          <th style="width: 180px;">No. BAST</th>
          <th style="width: 130px;">No. WO</th>
          <th style="width: 140px;">Kategori WO</th>
          <th style="width: 180px;">Uraian Pekerjaan</th>
          <th style="width: 90px;">Tgl Rilis</th>
          <th style="width: 90px;">Tgl Selesai</th>
          <th style="width: 70px;">Durasi</th>
          <th style="width: 100px;">Status BAST</th>
          <th style="width: 220px;">Tahapan Sub-Routing Workflow (1 s/d 4)</th>
          <th style="width: 140px;">Nomor Ref Finance</th>
          <th style="width: 160px;">Catatan</th>
          <th style="width: 280px;">Foto Dokumentasi Lapangan (Gambar Visual)</th>
        </tr>
      </thead>
      <tbody>
  `;

  items.forEach((item, index) => {
    const rowClass = index % 2 === 0 ? 'even' : 'odd';
    const bastNo = item.bastNumber || `BAST/${item.woNumber}/BELACOM/${new Date().getFullYear()}`;
    
    // Status Badge
    let statusClass = 'badge-progress';
    if (item.statusBast === 'Done') statusClass = 'badge-done';

    // Sub Routing Workflow Steps (1 to 4)
    const wf = item.workflow;
    const st1Obj = wf?.stage1EmailUser || wf?.stage1EmailFmi;
    const st2Obj = wf?.stage2AdminUser || wf?.stage2AdminFmi;
    const st3Obj = wf?.stage3RoutingTtd;
    const st4Obj = wf?.stage4Finance;

    const st1 = st1Obj?.status || 'Pending';
    const st2 = st2Obj?.status || 'Menunggu Pengecekan';
    const st3 = st3Obj?.status || 'Menunggu TTD';
    const st4 = st4Obj?.status || 'Menunggu Finance';

    const wfHtml = `
      <div class="wf-box">
        <div><span class="wf-step">1. Email User:</span> <span class="${st1 === 'Selesai' || st1 === 'Sent' ? 'wf-ok' : 'wf-pending'}">${st1}</span> (${formatDateIndo(st1Obj?.tanggalKirim || st1Obj?.emailSentDate || item.releaseDate)})</div>
        <div><span class="wf-step">2. Admin User:</span> <span class="${st2 === 'Approved' ? 'wf-ok' : 'wf-pending'}">${st2}</span> ${st2Obj?.adminName ? `(${st2Obj.adminName})` : ''}</div>
        <div><span class="wf-step">3. Routing TTD:</span> <span class="${st3 === 'Selesai TTD' ? 'wf-ok' : 'wf-pending'}">${st3}</span> ${st3Obj?.approverNames ? `(${st3Obj.approverNames})` : ''}</div>
        <div><span class="wf-step">4. Finance:</span> <span class="${st4 === 'Siap Invoice' || st4 === 'Diterima Finance' ? 'wf-ok' : 'wf-pending'}">${st4}</span></div>
      </div>
    `;

    // Photos (multiple or single)
    const photosList = item.fotoDokumentasiPdfs && item.fotoDokumentasiPdfs.length > 0 
      ? item.fotoDokumentasiPdfs 
      : (item.fotoDokumentasiPdf ? [item.fotoDokumentasiPdf] : []);

    let photosHtml = '';
    if (photosList.length > 0) {
      photosHtml += '<div class="img-container">';
      photosList.forEach((photo, pIdx) => {
        const photoUrl = getPhotoVisualUrl(photo, `FOTO DOKUMENTASI #${pIdx + 1}`, item.woNumber, bastNo);
        photosHtml += `
          <div style="display: inline-block; text-align: center; margin: 4px;">
            <img class="doc-img" src="${photoUrl}" alt="Dokumentasi ${pIdx + 1}" />
            <span class="img-label">${photo.name || `Foto_${pIdx + 1}.jpg`}</span>
          </div>
        `;
      });
      photosHtml += '</div>';
    } else {
      const fallbackUrl = generateVisualDocDataUrl('FOTO DOKUMENTASI LAPANGAN', `DOKUMENTASI_${item.woNumber}.jpg`, item.woNumber, bastNo);
      photosHtml = `
        <div class="img-container">
          <div style="display: inline-block; text-align: center; margin: 4px;">
            <img class="doc-img" src="${fallbackUrl}" alt="Dokumentasi" />
            <span class="img-label">Dokumentasi_BAST_${item.woNumber}.jpg</span>
          </div>
        </div>
      `;
    }

    html += `
        <tr class="${rowClass}">
          <td class="center bold">${index + 1}</td>
          <td class="bold font-mono" style="color: #059669;">${bastNo}</td>
          <td class="bold font-mono" style="color: #0284c7;">${item.woNumber}</td>
          <td>${item.woType}</td>
          <td>${item.workType || '-'}</td>
          <td class="center">${formatDateIndo(item.releaseDate)}</td>
          <td class="center">${formatDateIndo(item.finishDate)}</td>
          <td class="center font-mono">${calculateWorkDays(item.startDate, item.finishDate) || item.durationDays || 1} Hari</td>
          <td class="center"><span class="${statusClass}">${item.statusBast}</span></td>
          <td>${wfHtml}</td>
          <td class="center font-mono">${st4Obj?.financeRefNumber || '-'}</td>
          <td>${item.notes || st2Obj?.notes || st3Obj?.notes || '-'}</td>
          <td class="img-cell">${photosHtml}</td>
        </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  </body>
  </html>
  `;

  downloadExcelBlob(html, filename);
}

/**
 * Trigger pengunduhan file Excel Blob di browser
 */
function downloadExcelBlob(htmlContent: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const element = document.createElement('a');
  element.href = url;
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
