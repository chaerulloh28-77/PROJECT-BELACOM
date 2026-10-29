/**
 * Utility helper for exporting Excel spreadsheets (.xlsx) with embedded high-res images
 * using ExcelJS and file-saver.
 * PT Belacom Indonesia Telecom
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DailyReportItem, BASTItem, PenagihanItem, PDFFileMeta } from '../types';
import { calculateWorkDays } from './dateUtils';
import { generateVisualDocDataUrl } from './bastExportHelper';

interface ExtractedImage {
  base64: string;
  extension: 'png' | 'jpeg' | 'gif';
}

/**
 * Validates and extracts Base64 image data from a PDFFileMeta or string.
 * Returns null if not a valid base64 image.
 */
export function extractImageData(fileMeta?: PDFFileMeta | string): ExtractedImage | null {
  if (!fileMeta) return null;

  let dataUrl: string | undefined;
  if (typeof fileMeta === 'string') {
    dataUrl = fileMeta;
  } else {
    dataUrl = fileMeta.imageDataUrl || fileMeta.url;
  }

  if (!dataUrl || typeof dataUrl !== 'string') return null;

  if (!dataUrl.startsWith('data:image/')) return null;

  try {
    const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/i);
    if (match) {
      let mimeExt = match[1].toLowerCase();
      if (mimeExt === 'jpg' || mimeExt === 'webp') mimeExt = 'jpeg';
      const cleanBase64 = match[2].trim();

      if (cleanBase64 && cleanBase64.length > 50) {
        return {
          base64: cleanBase64,
          extension: mimeExt as 'png' | 'jpeg' | 'gif'
        };
      }
    }

    if (dataUrl.startsWith('data:image/svg+xml')) {
      const svgMatch = dataUrl.match(/^data:image\/svg\+xml;(base64|utf8),(.*)$/i);
      if (svgMatch) {
        const encoding = svgMatch[1].toLowerCase();
        const content = svgMatch[2];
        if (encoding === 'base64' && content.length > 50) {
          return {
            base64: content.trim(),
            extension: 'png'
          };
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Format date for Excel display
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
  return generateVisualDocDataUrl(fallbackCat, fileMeta?.name || `${fallbackCat}.jpg`, woNumber, bastNumber);
}

/**
 * Helper to process a cell: embeds image if available, writes PDF badge text if document, or '-'
 * Applies symmetrical offset padding (4%) inside the cell so photos do not touch or overlap borders.
 */
function processFileCell(
  workbook: ExcelJS.Workbook,
  worksheet: ExcelJS.Worksheet,
  colIndex: number, // 1-indexed for cell access
  rowIndex: number, // 1-indexed for cell access
  fileMeta?: PDFFileMeta | string
): void {
  const cell = worksheet.getCell(rowIndex, colIndex);

  cell.border = {
    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
  };

  if (!fileMeta) {
    cell.value = '-';
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    return;
  }

  const fileName = typeof fileMeta === 'string' ? 'Dokumen.pdf' : (fileMeta.name || 'Dokumen.pdf');
  const imgData = extractImageData(fileMeta);

  if (imgData) {
    try {
      const imageId = workbook.addImage({
        base64: imgData.base64,
        extension: imgData.extension
      });

      // Anchor with 4% symmetrical padding inside the cell to lock aspect ratio & prevent border overlap
      worksheet.addImage(imageId, {
        tl: { col: colIndex - 1 + 0.04, row: rowIndex - 1 + 0.04 } as any,
        br: { col: colIndex - 0.04, row: rowIndex - 0.04 } as any,
        editAs: 'oneCell'
      });

      cell.value = '';
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    } catch {
      cell.value = `[DOKUMEN PDF]\n${fileName}`;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.font = { bold: true, size: 9, color: { argb: 'FF0284C7' } };
    }
  } else {
    cell.value = `[DOKUMEN PDF]\n${fileName}`;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.font = { bold: true, size: 9, color: { argb: 'FF0284C7' } };
  }
}

/**
 * Apply header styles to a worksheet title and column headers
 */
function setupWorksheetHeader(
  worksheet: ExcelJS.Worksheet,
  title: string,
  totalColumns: number,
  columnDefinitions: { header: string; width: number }[]
): void {
  // Title Row
  worksheet.mergeCells(1, 1, 1, totalColumns);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = `PT. BELACOM INDONESIA TELECOM — ${title}`;
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF38BDF8' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 34;

  // Subtitle / Meta Row
  worksheet.mergeCells(2, 1, 2, totalColumns);
  const metaCell = worksheet.getCell(2, 1);
  metaCell.value = `Tanggal Cetak: ${new Date().toLocaleString('id-ID')} | Belacom Controlling System`;
  metaCell.font = { size: 9, color: { argb: 'FF94A3B8' } };
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  // Empty row spacer
  worksheet.getRow(3).height = 8;

  // Column Headers (Row 4)
  columnDefinitions.forEach((colDef, idx) => {
    const colNum = idx + 1;
    const cell = worksheet.getCell(4, colNum);
    cell.value = colDef.header;
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FF38BDF8' } },
      right: { style: 'thin', color: { argb: 'FF334155' } }
    };

    worksheet.getColumn(colNum).width = colDef.width;
  });

  worksheet.getRow(4).height = 30;
}

/**
 * Setup 2-level structured header for Daily Report Excel
 */
function setupDailyReportHeader(
  worksheet: ExcelJS.Worksheet,
  title: string,
  totalColumns: number,
  columns: { header: string; width: number }[]
): void {
  // Title Row 1
  worksheet.mergeCells(1, 1, 1, totalColumns);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = `PT. BELACOM INDONESIA TELECOM — ${title}`;
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF38BDF8' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 34;

  // Subtitle / Meta Row 2
  worksheet.mergeCells(2, 1, 2, totalColumns);
  const metaCell = worksheet.getCell(2, 1);
  metaCell.value = `Tanggal Cetak: ${new Date().toLocaleString('id-ID')} | Belacom Controlling System`;
  metaCell.font = { size: 9, color: { argb: 'FF94A3B8' } };
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  // Row 3 Spacer
  worksheet.getRow(3).height = 8;

  // Two-level Category Group Header (Row 4)
  // Group 1: Cols 1 to 10 - INFORMASI WORK ORDER & LAPANGAN
  worksheet.mergeCells(4, 1, 4, 10);
  const g1 = worksheet.getCell(4, 1);
  g1.value = 'INFORMASI WORK ORDER & LAPANGAN';
  g1.font = { bold: true, size: 11, color: { argb: 'FF38BDF8' } };
  g1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  g1.alignment = { horizontal: 'center', vertical: 'middle' };

  // Group 2: Cols 11 to 15 - KELOMPOK TAGGING END TO END
  worksheet.mergeCells(4, 11, 4, 15);
  const g2 = worksheet.getCell(4, 11);
  g2.value = 'KELOMPOK TAGGING END TO END';
  g2.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  g2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0369A1' } };
  g2.alignment = { horizontal: 'center', vertical: 'middle' };

  // Group 3: Cols 16 to 20 - KELOMPOK DOKUMEN & FOTO DOKUMENTASI
  worksheet.mergeCells(4, 16, 4, 20);
  const g3 = worksheet.getCell(4, 16);
  g3.value = 'KELOMPOK DOKUMEN & FOTO DOKUMENTASI';
  g3.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  g3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };
  g3.alignment = { horizontal: 'center', vertical: 'middle' };

  for (let col = 1; col <= totalColumns; col++) {
    const c = worksheet.getCell(4, col);
    c.border = {
      top: { style: 'medium', color: { argb: 'FF38BDF8' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } }
    };
  }
  worksheet.getRow(4).height = 28;

  // Individual Column Sub-headers (Row 5)
  columns.forEach((colDef, idx) => {
    const colNum = idx + 1;
    const cell = worksheet.getCell(5, colNum);
    cell.value = colDef.header;
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };

    if (colNum <= 10) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    } else if (colNum <= 15) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    }

    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FF38BDF8' } },
      right: { style: 'thin', color: { argb: 'FF334155' } }
    };

    worksheet.getColumn(colNum).width = colDef.width;
  });

  worksheet.getRow(5).height = 32;
}

/**
 * 1. Export Rekap Daily Report ke File Excel (.xlsx) dengan 10 Kolom Lampiran Dokumen Visual
 */
export async function exportDailyReportToExcel(reports: DailyReportItem[], customFilename?: string): Promise<void> {
  if (reports.length === 0) return;

  const title = reports.length === 1
    ? `REKAP DAILY REPORT - WO ${reports[0].woNumber}`
    : `REKAP KESELURUHAN DAILY REPORT (${reports.length} WORK ORDER)`;

  const filename = customFilename || (
    reports.length === 1
      ? `DailyReport_${reports[0].woNumber.replace(/[/\\?%*:|"<>]/g, '_')}.xlsx`
      : `Rekap_DailyReport_Semua_WO_${new Date().toISOString().slice(0, 10)}.xlsx`
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Belacom System';
  const worksheet = workbook.addWorksheet('Daily Report');

  // 20 Columns: 10 Info Columns + 10 Document Attachment Columns (Width 46)
  const columns = [
    { header: 'No', width: 6 },
    { header: 'No. WO', width: 22 },
    { header: 'Kategori WO', width: 28 },
    { header: 'Uraian Pekerjaan & Rute', width: 38 },
    { header: 'Assignment', width: 14 },
    { header: 'Tim', width: 12 },
    { header: 'Status WO', width: 14 },
    { header: 'Tgl Rilis', width: 14 },
    { header: 'Tgl Selesai', width: 14 },
    { header: 'Durasi', width: 12 },
    // Tagging End to End (Cols 11-15)
    { header: '1. Foto Geotagging Site A (Origin)', width: 46 },
    { header: '2. Dokumen Bukti Tagging Site A', width: 46 },
    { header: '3. Foto Geotagging Site B (Destination)', width: 46 },
    { header: '4. Dokumen Bukti Tagging Site B', width: 46 },
    { header: '5. File Peta Rute', width: 46 },
    // Dokumen & Foto Dokumentasi (Cols 16-20)
    { header: '6. Foto Closure', width: 46 },
    { header: '7. Pengujian OPM', width: 46 },
    { header: '8. Pengujian OLS', width: 46 },
    { header: '9. Dokumentasi BTS', width: 46 },
    { header: '10. OTDR Trace Test', width: 46 }
  ];

  setupDailyReportHeader(worksheet, title, columns.length, columns);

  reports.forEach((item, index) => {
    const rowIndex = index + 6; // Rows 1-5 used by title & 2-level headers
    worksheet.getRow(rowIndex).height = 210; // Row height 210pt for clear large image thumbnails

    worksheet.getCell(rowIndex, 1).value = index + 1;
    worksheet.getCell(rowIndex, 1).alignment = { horizontal: 'center', vertical: 'middle' };

    const woCell = worksheet.getCell(rowIndex, 2);
    woCell.value = item.woNumber;
    woCell.font = { bold: true, color: { argb: 'FF0284C7' } };
    woCell.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.getCell(rowIndex, 3).value = item.woType || '-';
    worksheet.getCell(rowIndex, 3).alignment = { vertical: 'middle', wrapText: true };

    const workRouteText = `${item.workType || '-'}\n${item.originLocation ? `Awal: ${item.originLocation}` : ''} ${item.destinationLocation ? `-> Akhir: ${item.destinationLocation}` : ''}`.trim();
    worksheet.getCell(rowIndex, 4).value = workRouteText;
    worksheet.getCell(rowIndex, 4).alignment = { vertical: 'middle', wrapText: true };

    worksheet.getCell(rowIndex, 5).value = item.assignment || '-';
    worksheet.getCell(rowIndex, 5).alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.getCell(rowIndex, 6).value = item.team || '-';
    worksheet.getCell(rowIndex, 6).alignment = { horizontal: 'center', vertical: 'middle' };

    const statusCell = worksheet.getCell(rowIndex, 7);
    statusCell.value = item.statusWo || '-';
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
    statusCell.font = { bold: true };

    worksheet.getCell(rowIndex, 8).value = formatDateIndo(item.releaseDate);
    worksheet.getCell(rowIndex, 8).alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.getCell(rowIndex, 9).value = formatDateIndo(item.finishDate);
    worksheet.getCell(rowIndex, 9).alignment = { horizontal: 'center', vertical: 'middle' };

    const workDays = calculateWorkDays(item.startDate, item.finishDate) || item.durationDays || 1;
    worksheet.getCell(rowIndex, 10).value = `${workDays} Hari`;
    worksheet.getCell(rowIndex, 10).alignment = { horizontal: 'center', vertical: 'middle' };

    // 10 Document Attachment Columns:
    // 1. Foto Geotagging Site A (Origin)
    const file1 = item.originPhotoFile || (item as any).originGeotagPhoto;
    processFileCell(workbook, worksheet, 11, rowIndex, file1);

    // 2. Dokumen Bukti Tagging Site A
    const file2 = item.originTaggingDocFile || (item as any).originTaggingDoc;
    processFileCell(workbook, worksheet, 12, rowIndex, file2);

    // 3. Foto Geotagging Site B (Destination)
    const file3 = item.destinationPhotoFile || (item as any).destinationGeotagPhoto;
    processFileCell(workbook, worksheet, 13, rowIndex, file3);

    // 4. Dokumen Bukti Tagging Site B
    const file4 = item.destinationTaggingDocFile || (item as any).destinationTaggingDoc;
    processFileCell(workbook, worksheet, 14, rowIndex, file4);

    // 5. File Peta Rute
    const file5 = item.routeMapFile;
    processFileCell(workbook, worksheet, 15, rowIndex, file5);

    // 6. Foto Closure
    const file6 = item.documentation?.fotoClosurePdf || (item as any).closurePhoto || (item as any).fotoClosurePdf;
    processFileCell(workbook, worksheet, 16, rowIndex, file6);

    // 7. Pengujian OPM
    const file7 = item.documentation?.opmPdf || (item as any).opmTestPhoto || (item as any).opmPdf;
    processFileCell(workbook, worksheet, 17, rowIndex, file7);

    // 8. Pengujian OLS
    const file8 = item.documentation?.olsPdf || (item as any).olsTestPhoto || (item as any).olsPdf;
    processFileCell(workbook, worksheet, 18, rowIndex, file8);

    // 9. Dokumentasi BTS
    const file9 = item.documentation?.btsPdf || (item as any).btsDocPhoto || (item as any).btsPdf;
    processFileCell(workbook, worksheet, 19, rowIndex, file9);

    // 10. OTDR Trace Test
    const file10 = item.documentation?.otdrPdf || (item as any).otdrTracePhoto || (item as any).otdrPdf;
    processFileCell(workbook, worksheet, 20, rowIndex, file10);

    // Grid borders #D1D5DB
    for (let c = 1; c <= columns.length; c++) {
      worksheet.getCell(rowIndex, c).border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
}


/**
 * Setup 2-level structured header for BAST Excel
 */
function setupBASTHeader(
  worksheet: ExcelJS.Worksheet,
  title: string,
  totalColumns: number,
  columns: { header: string; width: number }[]
): void {
  // Title Row 1
  worksheet.mergeCells(1, 1, 1, totalColumns);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = `PT. BELACOM INDONESIA TELECOM — ${title}`;
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF38BDF8' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 34;

  // Subtitle / Meta Row 2
  worksheet.mergeCells(2, 1, 2, totalColumns);
  const metaCell = worksheet.getCell(2, 1);
  metaCell.value = `Tanggal Cetak: ${new Date().toLocaleString('id-ID')} | Belacom Controlling System`;
  metaCell.font = { size: 9, color: { argb: 'FF94A3B8' } };
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  // Row 3 Spacer
  worksheet.getRow(3).height = 8;

  // Two-level Category Group Header (Row 4)
  // Group 1: Cols 1 to 11 - INFORMASI & TIMELINE BAST LAPANGAN
  worksheet.mergeCells(4, 1, 4, 11);
  const g1 = worksheet.getCell(4, 1);
  g1.value = 'INFORMASI & TIMELINE BAST LAPANGAN';
  g1.font = { bold: true, size: 11, color: { argb: 'FF38BDF8' } };
  g1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  g1.alignment = { horizontal: 'center', vertical: 'middle' };

  // Group 2: Cols 12 to 15 - DOKUMEN & FOTO LAMPIRAN BAST (4 SLOT EVIDENSE)
  worksheet.mergeCells(4, 12, 4, 15);
  const g2 = worksheet.getCell(4, 12);
  g2.value = 'DOKUMEN & FOTO LAMPIRAN BAST (4 SLOT EVIDENSE)';
  g2.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  g2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };
  g2.alignment = { horizontal: 'center', vertical: 'middle' };

  for (let col = 1; col <= totalColumns; col++) {
    const c = worksheet.getCell(4, col);
    c.border = {
      top: { style: 'medium', color: { argb: 'FF38BDF8' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } }
    };
  }
  worksheet.getRow(4).height = 28;

  // Individual Column Sub-headers (Row 5)
  columns.forEach((colDef, idx) => {
    const colNum = idx + 1;
    const cell = worksheet.getCell(5, colNum);
    cell.value = colDef.header;
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };

    if (colNum <= 11) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    }

    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FF38BDF8' } },
      right: { style: 'thin', color: { argb: 'FF334155' } }
    };

    worksheet.getColumn(colNum).width = colDef.width;
  });

  worksheet.getRow(5).height = 32;
}

/**
 * 2. Export Rekap BAST ke File Excel (.xlsx) dengan 4 Slot Lampiran Gambar Berukuran Besar
 */
export async function exportBASTToExcel(items: BASTItem[], customFilename?: string): Promise<void> {
  if (items.length === 0) return;

  const title = items.length === 1
    ? `BERKAS BAST - WO ${items[0].woNumber}`
    : `REKAP KESELURUHAN BAST (${items.length} DOKUMEN BAST)`;

  const filename = customFilename || (
    items.length === 1
      ? `BAST_${items[0].woNumber.replace(/[/\\?%*:|"<>]/g, '_')}.xlsx`
      : `Rekap_BAST_Semua_WO_${new Date().toISOString().slice(0, 10)}.xlsx`
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Belacom System';
  const worksheet = workbook.addWorksheet('Rekap BAST');

  // 15 Columns: 11 Timeline & Info + 4 Attachment Document Columns (Width 50)
  const columns = [
    { header: 'No', width: 6 },
    { header: 'No. BAST', width: 24 },
    { header: 'No. WO', width: 20 },
    { header: 'Deskripsi Pekerjaan Teknis', width: 36 },
    { header: 'Release Date', width: 14 },
    { header: 'Start Date', width: 14 },
    { header: 'Finish Date', width: 14 },
    { header: 'ABD Date', width: 14 },
    { header: 'Core Connection Date', width: 18 },
    { header: 'Durasi (Hari)', width: 14 },
    { header: 'Status Alur BAST', width: 18 },
    // 4 Slot Documents (Width 50)
    { header: '1. Lampiran Foto / Dokumen APD', width: 50 },
    { header: '2. Lampiran Foto / Dokumen ABD', width: 50 },
    { header: '3. Lampiran Core Connection', width: 50 },
    { header: '4. Foto Dokumentasi Lapangan', width: 50 }
  ];

  setupBASTHeader(worksheet, title, columns.length, columns);

  items.forEach((item, index) => {
    const rowIndex = index + 6; // Rows 1-5 used by title & 2-level headers
    worksheet.getRow(rowIndex).height = 210; // Row height 210pt for clear large image thumbnails

    worksheet.getCell(rowIndex, 1).value = index + 1;
    worksheet.getCell(rowIndex, 1).alignment = { horizontal: 'center', vertical: 'middle' };

    const bastNo = item.bastNumber || `BAST/${item.woNumber}/BELACOM/${new Date().getFullYear()}`;
    const bastCell = worksheet.getCell(rowIndex, 2);
    bastCell.value = bastNo;
    bastCell.font = { bold: true, color: { argb: 'FF059669' } };
    bastCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const woCell = worksheet.getCell(rowIndex, 3);
    woCell.value = item.woNumber;
    woCell.font = { bold: true, color: { argb: 'FF0284C7' } };
    woCell.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.getCell(rowIndex, 4).value = item.workType || '-';
    worksheet.getCell(rowIndex, 4).alignment = { vertical: 'middle', wrapText: true };

    worksheet.getCell(rowIndex, 5).value = formatDateIndo(item.releaseDate);
    worksheet.getCell(rowIndex, 5).alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.getCell(rowIndex, 6).value = formatDateIndo(item.startDate);
    worksheet.getCell(rowIndex, 6).alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.getCell(rowIndex, 7).value = formatDateIndo(item.finishDate);
    worksheet.getCell(rowIndex, 7).alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.getCell(rowIndex, 8).value = formatDateIndo(item.abdDate || item.finishDate);
    worksheet.getCell(rowIndex, 8).alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.getCell(rowIndex, 9).value = formatDateIndo(item.coreConnectionDate || item.finishDate);
    worksheet.getCell(rowIndex, 9).alignment = { horizontal: 'center', vertical: 'middle' };

    const workDays = item.durasiDate ?? item.durationDays ?? calculateWorkDays(item.startDate, item.finishDate) ?? 1;
    worksheet.getCell(rowIndex, 10).value = `${workDays} Hari`;
    worksheet.getCell(rowIndex, 10).alignment = { horizontal: 'center', vertical: 'middle' };

    const statusCell = worksheet.getCell(rowIndex, 11);
    statusCell.value = item.statusBast || '-';
    statusCell.font = { bold: true };
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Column 12: Lampiran 1 (Foto/Dokumen APD)
    const apdFile = item.apdPdf || (item as any).apdFile;
    processFileCell(workbook, worksheet, 12, rowIndex, apdFile);

    // Column 13: Lampiran 2 (Foto/Dokumen ABD)
    const abdFile = item.abdPdf || (item as any).abdFile;
    processFileCell(workbook, worksheet, 13, rowIndex, abdFile);

    // Column 14: Lampiran 3 (Foto/Dokumen Core Connection)
    const coreFile = item.coreConnectionPdf || (item as any).coreConnectionFile;
    processFileCell(workbook, worksheet, 14, rowIndex, coreFile);

    // Column 15: Lampiran 4 (Foto Dokumentasi Lapangan)
    const docFile = item.fotoDokumentasiPdf || (item as any).dokumentasiSelesaiPdf || (item.fotoDokumentasiPdfs && item.fotoDokumentasiPdfs[0]);
    processFileCell(workbook, worksheet, 15, rowIndex, docFile);

    // Grid borders #D1D5DB
    for (let c = 1; c <= columns.length; c++) {
      worksheet.getCell(rowIndex, c).border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
}

/**
 * 3. Export Rekap Berkas Penagihan (.xlsx) dengan 9 Susunan Berkas Aplikasi Berukuran Besar
 */
export async function exportPenagihanToExcel(penagihanList: PenagihanItem[], customFilename?: string): Promise<void> {
  if (penagihanList.length === 0) return;

  const title = `REKAP KESELURUHAN BERKAS PENAGIHAN (${penagihanList.length} PAKET TAGIHAN)`;

  const filename = customFilename || `Rekap_Berkas_Penagihan_${new Date().toISOString().slice(0, 10)}.xlsx`;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Belacom System';
  const worksheet = workbook.addWorksheet('Rekap Penagihan');

  const columns = [
    { header: 'No', width: 6 },
    { header: 'Kode Penagihan', width: 22 },
    { header: 'Ref No. WO', width: 20 },
    { header: 'Tanggal Submit', width: 16 },
    { header: 'Total Nominal (Rp)', width: 22 },
    { header: 'Pekerjaan & Durasi', width: 35 },
    { header: 'Status Penagihan', width: 16 },
    { header: '1. Invoice / Kwitansi', width: 55 },
    { header: '2. BAST', width: 55 },
    { header: '3. APD', width: 55 },
    { header: '4. ABD', width: 55 },
    { header: '5. Core Connection', width: 55 },
    { header: '6. Foto Dokumentasi', width: 55 },
    { header: '7. PO', width: 55 },
    { header: '8. Data Material', width: 55 },
    { header: '9. BOQ', width: 55 }
  ];

  setupWorksheetHeader(worksheet, title, columns.length, columns);

  penagihanList.forEach((item, index) => {
    const rowIndex = index + 5;
    worksheet.getRow(rowIndex).height = 210;

    worksheet.getCell(rowIndex, 1).value = index + 1;
    worksheet.getCell(rowIndex, 1).alignment = { horizontal: 'center', vertical: 'middle' };

    const codeCell = worksheet.getCell(rowIndex, 2);
    codeCell.value = item.billingCode;
    codeCell.font = { bold: true, color: { argb: 'FF0284C7' } };
    codeCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const woCell = worksheet.getCell(rowIndex, 3);
    woCell.value = item.woNumber;
    woCell.font = { bold: true, color: { argb: 'FF059669' } };
    woCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const submitDate = item.tanggalSubmit || item.createdAt?.substring(0, 10);
    worksheet.getCell(rowIndex, 4).value = formatDateIndo(submitDate);
    worksheet.getCell(rowIndex, 4).alignment = { horizontal: 'center', vertical: 'middle' };

    const nominalCell = worksheet.getCell(rowIndex, 5);
    nominalCell.value = item.totalNominalRupiah || 0;
    nominalCell.numFmt = '"Rp "#,##0';
    nominalCell.font = { bold: true, color: { argb: 'FF059669' } };
    nominalCell.alignment = { horizontal: 'right', vertical: 'middle' };

    const workText = `${item.dailyReportWorkType || 'Pekerjaan Penagihan'}\n(${item.dailyReportStartDate || '-'} s/d ${item.dailyReportFinishDate || '-'} - ${item.dailyReportDurationDays || 0} Hari)`;
    worksheet.getCell(rowIndex, 6).value = workText;
    worksheet.getCell(rowIndex, 6).alignment = { vertical: 'middle', wrapText: true };

    const statusCell = worksheet.getCell(rowIndex, 7);
    statusCell.value = item.statusPenagihan || '-';
    statusCell.font = { bold: true };
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // 9 Berkas Penagihan:
    processFileCell(workbook, worksheet, 8, rowIndex, item.invoicePdf || item.kwitansiPdf);
    processFileCell(workbook, worksheet, 9, rowIndex, item.bastPdf);
    processFileCell(workbook, worksheet, 10, rowIndex, item.apdPdf);
    processFileCell(workbook, worksheet, 11, rowIndex, item.abdPdf);
    processFileCell(workbook, worksheet, 12, rowIndex, item.coreConnectionPdf);
    const fotoFile = item.fotoDokumentasiPdf || (item.fotoDokumentasiPdfs && item.fotoDokumentasiPdfs[0]);
    processFileCell(workbook, worksheet, 13, rowIndex, fotoFile);
    processFileCell(workbook, worksheet, 14, rowIndex, item.poPdf);
    processFileCell(workbook, worksheet, 15, rowIndex, item.dataMaterialPdf);
    processFileCell(workbook, worksheet, 16, rowIndex, item.boqPdf);

    for (let c = 1; c <= columns.length; c++) {
      worksheet.getCell(rowIndex, c).border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
}

/**
 * 4. Export Single Penagihan (.xlsx) - Ekspor Satuan Tagihan Berkas Lengkap dengan Gambar Visual Berukuran Besar
 */
export async function exportSinglePenagihanToExcel(item: PenagihanItem): Promise<void> {
  if (!item) return;

  const cleanCode = (item.billingCode || 'TAGIHAN').replace(/[/\\?%*:|"<>]/g, '_');
  const cleanWO = (item.woNumber || 'WO').replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `Berkas_Penagihan_${cleanCode}_${cleanWO}.xlsx`;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Belacom System';
  const worksheet = workbook.addWorksheet('Berkas Penagihan');

  worksheet.getColumn(1).width = 30;
  worksheet.getColumn(2).width = 65;

  // Title Row 1
  worksheet.mergeCells(1, 1, 1, 2);
  const title1 = worksheet.getCell(1, 1);
  title1.value = 'PT. BELACOM INDONESIA TELECOM';
  title1.font = { bold: true, size: 14, color: { argb: 'FF38BDF8' } };
  title1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  // Title Row 2
  worksheet.mergeCells(2, 1, 2, 2);
  const title2 = worksheet.getCell(2, 1);
  title2.value = 'PAKET DOKUMEN BERKAS LENGKAP PENAGIHAN';
  title2.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
  title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 30;

  // Subtitle / Meta Row 3
  worksheet.mergeCells(3, 1, 3, 2);
  const metaCell = worksheet.getCell(3, 1);
  metaCell.value = `Kode Tagihan: ${item.billingCode} | Ref WO: ${item.woNumber} | Belacom Controlling System`;
  metaCell.font = { size: 9, color: { argb: 'FF94A3B8' } };
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(3).height = 22;

  // Row 4 Spacer
  worksheet.getRow(4).height = 8;

  // Summary Table (Rows 5–10)
  const summaryRows = [
    { key: 'Kode Penagihan', value: item.billingCode, isBold: true, color: 'FF0284C7' },
    { key: 'Nomor Ref. WO', value: item.woNumber, isBold: true, color: 'FF059669' },
    { key: 'Tanggal Submit', value: formatDateIndo(item.tanggalSubmit || item.createdAt?.substring(0, 10)) },
    { key: 'Status Penagihan', value: item.statusPenagihan || 'Dalam Review', isBold: true, color: 'FFD97706' },
    { key: 'Total Nominal (Rp)', value: item.totalNominalRupiah || 0, isRupiah: true },
    { key: 'Catatan / Remarks', value: item.remarks || '-' }
  ];

  summaryRows.forEach((s, idx) => {
    const rIdx = 5 + idx;
    worksheet.getRow(rIdx).height = 24;

    const keyCell = worksheet.getCell(rIdx, 1);
    keyCell.value = s.key;
    keyCell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    keyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    keyCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    keyCell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } }
    };

    const valCell = worksheet.getCell(rIdx, 2);
    if (s.isRupiah) {
      valCell.value = Number(s.value);
      valCell.numFmt = '"Rp "#,##0';
      valCell.font = { bold: true, size: 11, color: { argb: 'FF059669' } };
    } else {
      valCell.value = String(s.value);
      valCell.font = { bold: s.isBold || false, size: 10, color: s.color ? { argb: s.color } : { argb: 'FFFFFFFF' } };
    }
    valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    valCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: true };
    valCell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } }
    };
  });

  // Row 11 Spacer
  worksheet.getRow(11).height = 12;

  // 9 Document Components (Mulai Row 12)
  const docList = [
    { label: '1. INVOICE / KWITANSI', file: item.invoicePdf || item.kwitansiPdf },
    { label: '2. BERITA ACARA SERAH TERIMA (BAST)', file: item.bastPdf },
    { label: '3. ALAT PELINDUNG DIRI (APD)', file: item.apdPdf },
    { label: '4. AS BUILT DRAWING (ABD)', file: item.abdPdf },
    { label: '5. CORE CONNECTION DOKUMEN', file: item.coreConnectionPdf },
    { label: '6. FOTO DOKUMENTASI LAPANGAN', file: item.fotoDokumentasiPdf || (item.fotoDokumentasiPdfs && item.fotoDokumentasiPdfs[0]) },
    { label: '7. PURCHASE ORDER (PO)', file: item.poPdf },
    { label: '8. DATA MATERIAL LAPANGAN', file: item.dataMaterialPdf },
    { label: '9. BILL OF QUANTITIES (BOQ)', file: item.boqPdf }
  ];

  let currRow = 12;

  docList.forEach((doc) => {
    // Header for document
    worksheet.mergeCells(currRow, 1, currRow, 2);
    const hCell = worksheet.getCell(currRow, 1);
    hCell.value = doc.label;
    hCell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    hCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } }; // Slate Teal
    hCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    worksheet.getRow(currRow).height = 28;

    // Content for document (Height 240pt, Column Widths 30+65=95)
    const contentRow = currRow + 1;
    worksheet.getRow(contentRow).height = 240; // 220-260 pt range

    worksheet.mergeCells(contentRow, 1, contentRow, 2);
    const cCell = worksheet.getCell(contentRow, 1);

    cCell.border = {
      top: { style: 'medium', color: { argb: 'FF0D9488' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'medium', color: { argb: 'FFD1D5DB' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
    };

    if (!doc.file) {
      cCell.value = '[ Belum Ada File Upload ]';
      cCell.alignment = { horizontal: 'center', vertical: 'middle' };
      cCell.font = { italic: true, size: 10, color: { argb: 'FF94A3B8' } };
      cCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    } else {
      const imgData = extractImageData(doc.file);
      const fileName = doc.file.name || 'Dokumen.pdf';

      if (imgData) {
        try {
          const imageId = workbook.addImage({
            base64: imgData.base64,
            extension: imgData.extension
          });

          worksheet.addImage(imageId, {
            tl: { col: 0.04, row: contentRow - 1 + 0.04 } as any,
            br: { col: 1.96, row: contentRow - 0.04 } as any,
            editAs: 'oneCell'
          });

          cCell.value = '';
          cCell.alignment = { horizontal: 'center', vertical: 'middle' };
        } catch {
          cCell.value = `📄 [DOKUMEN PDF RESMI TERLAMPIR]\n${fileName}`;
          cCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cCell.font = { bold: true, size: 11, color: { argb: 'FF0284C7' } };
          cCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        }
      } else {
        cCell.value = `📄 [DOKUMEN PDF RESMI TERLAMPIR]\n${fileName}`;
        cCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cCell.font = { bold: true, size: 11, color: { argb: 'FF0284C7' } };
        cCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      }
    }

    currRow += 3;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
}

