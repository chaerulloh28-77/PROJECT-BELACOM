import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ImageRun,
  PageBreak,
  ShadingType,
  VerticalAlign,
  Header,
  Footer,
  PageNumber
} from 'docx';
import fileSaver from 'file-saver';
const saveAs = (fileSaver as any)?.saveAs || (fileSaver as any)?.default || fileSaver;
import { PenagihanItem, BASTItem, PDFFileMeta } from '../types';
import { extractValidatedImageWithDimensions } from './pdfToImage';
import { evaluateBASTWorkflow } from './bastWorkflowHelper';

type AlignmentTypeValue = (typeof AlignmentType)[keyof typeof AlignmentType];

/**
 * Helper to construct table cells with standardized border & padding
 */
function createStyledCell(
  text: string,
  options?: {
    bold?: boolean;
    color?: string;
    bgColor?: string;
    widthPercent?: number;
    align?: AlignmentTypeValue;
    fontSize?: number;
    italic?: boolean;
  }
): TableCell {
  const {
    bold = false,
    color = '0F172A',
    bgColor,
    widthPercent,
    align = AlignmentType.LEFT,
    fontSize = 19, // 9.5pt in half-points
    italic = false
  } = options || {};

  return new TableCell({
    width: widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined,
    shading: bgColor ? { fill: bgColor, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: {
      top: 130,
      bottom: 130,
      left: 160,
      right: 160
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' }
    },
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text,
            bold,
            italics: italic,
            color,
            size: fontSize,
            font: 'Arial'
          })
        ]
      })
    ]
  });
}

/**
 * Calculates proportional Word image dimensions (max width 500pt, proportional height, max 620pt)
 */
function getWordProportionalDimensions(naturalWidth: number, naturalHeight: number): { width: number; height: number } {
  const nw = naturalWidth > 0 ? naturalWidth : 800;
  const nh = naturalHeight > 0 ? naturalHeight : 600;

  const maxWidthPt = 500;
  const maxHeightPt = 620;

  const widthRatio = maxWidthPt / nw;
  const heightRatio = maxHeightPt / nh;
  const scale = Math.min(widthRatio, heightRatio, 1.0);

  const w = Math.round(nw * scale);
  const h = Math.round(nh * scale);

  return {
    width: Math.max(w, 100),
    height: Math.max(h, 80)
  };
}

/**
 * 1. Export single Penagihan item into an official, symmetrical, professional Word (.docx) document
 * with 100% full visual images for all 10 document components (preserving natural aspect ratio).
 */
export async function exportSinglePenagihanToWord(item: PenagihanItem): Promise<void> {
  const fileComponents: Array<{
    number: number;
    title: string;
    file?: PDFFileMeta;
  }> = [
    { number: 1, title: 'Invoice / Kwitansi', file: item.invoicePdf || item.kwitansiPdf },
    { number: 2, title: 'Berita Acara Serah Terima (BAST)', file: item.bastPdf },
    { number: 3, title: 'As Planned Drawing (APD)', file: item.apdPdf },
    { number: 4, title: 'As Built Drawing (ABD)', file: item.abdPdf },
    { number: 5, title: 'Core Connection', file: item.coreConnectionPdf },
    { number: 6, title: 'Foto Dokumentasi Lapangan', file: item.fotoDokumentasiPdf },
    { number: 7, title: 'Purchase Order (PO)', file: item.poPdf },
    { number: 8, title: 'Data Material', file: item.dataMaterialPdf },
    { number: 9, title: 'Bill of Quantity (BOQ)', file: item.boqPdf },
    { number: 10, title: 'Faktur Pajak', file: item.fakturPajakPdf }
  ];

  const docElements: (Paragraph | Table)[] = [];

  // ==========================================
  // PAGE 1: KOP, RINGKASAN & TABEL VERIFIKASI
  // ==========================================

  // Kop Perusahaan Resmi
  docElements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'PT. BELACOM INDONESIA TELECOM',
          bold: true,
          size: 30, // 15pt
          color: '0369A1', // Sky-700
          font: 'Arial'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'PAKET BERKAS LAMPIRAN PENAGIHAN RESMI',
          bold: true,
          size: 24, // 12pt
          color: '0F172A',
          font: 'Arial'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 260 },
      children: [
        new TextRun({
          text: 'Sistem Pengelolaan Berkas, Work Order & Billing Kontrol Proyek',
          italics: true,
          size: 18,
          color: '64748B',
          font: 'Arial'
        })
      ]
    })
  );

  // Subheader: Ringkasan Identitas Penagihan
  docElements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 80, after: 100 },
      children: [
        new TextRun({
          text: 'I. IDENTITAS & RINGKASAN TAGIHAN',
          bold: true,
          size: 21,
          color: '0F172A',
          font: 'Arial'
        })
      ]
    })
  );

  // Metadata Table (2 Columns)
  const metaRowsData: [string, string][] = [
    ['Kode Penagihan', item.billingCode || '-'],
    ['Nomor Referensi Work Order (WO)', item.woNumber || '-'],
    ['Tanggal Submit Dokumen', item.tanggalSubmit || item.createdAt?.substring(0, 10) || '-'],
    ['Status Penagihan', item.statusPenagihan || 'Dalam Review'],
    ['Total Nominal Penagihan (IDR)', `Rp ${(item.totalNominalRupiah || 0).toLocaleString('id-ID')}`],
    ['Jenis Pekerjaan Lapangan', item.dailyReportWorkType || 'Pekerjaan Penagihan Lapangan'],
    [
      'Durasi Pelaksanaan Lapangan',
      item.dailyReportStartDate
        ? `${item.dailyReportStartDate} s/d ${item.dailyReportFinishDate || '-'} (${item.dailyReportDurationDays || 0} Hari)`
        : '-'
    ],
    ['Catatan / Remarks Penagihan', item.remarks || 'Paket berkas penagihan lengkap telah diverifikasi dan siap diproses.']
  ];

  const metaTableRows = metaRowsData.map(([label, val]) => {
    return new TableRow({
      children: [
        createStyledCell(label, {
          bold: true,
          bgColor: 'F1F5F9',
          color: '334155',
          widthPercent: 36,
          fontSize: 18
        }),
        createStyledCell(val, {
          bold: label.includes('Nomor Referensi') || label.includes('Kode Penagihan') || label.includes('Total Nominal'),
          color: label.includes('Total Nominal') ? '047857' : '0F172A',
          bgColor: 'FFFFFF',
          widthPercent: 64,
          fontSize: 18
        })
      ]
    });
  });

  docElements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: metaTableRows
    })
  );

  // Spacing
  docElements.push(
    new Paragraph({
      spacing: { before: 240, after: 100 },
      children: [
        new TextRun({
          text: 'II. MATRIKS VERIFIKASI 10 KOMPONEN BERKAS',
          bold: true,
          size: 21,
          color: '0F172A',
          font: 'Arial'
        })
      ]
    })
  );

  // Verification Checklist Table (10 Files)
  const checklistHeaderRow = new TableRow({
    children: [
      createStyledCell('No', { bold: true, bgColor: '0284C7', color: 'FFFFFF', widthPercent: 8, align: AlignmentType.CENTER }),
      createStyledCell('Komponen Berkas Penagihan', { bold: true, bgColor: '0284C7', color: 'FFFFFF', widthPercent: 40 }),
      createStyledCell('Status Berkas', { bold: true, bgColor: '0284C7', color: 'FFFFFF', widthPercent: 24, align: AlignmentType.CENTER }),
      createStyledCell('Keterangan / Nama File', { bold: true, bgColor: '0284C7', color: 'FFFFFF', widthPercent: 28 })
    ]
  });

  const checklistRows = fileComponents.map((comp) => {
    const isAvailable = Boolean(comp.file && (comp.file.url || comp.file.name || comp.file.imageDataUrl));
    const statusText = isAvailable ? '✓ TERSEDIA' : '— TIDAK ADA';
    const statusColor = isAvailable ? '047857' : '94A3B8';
    const statusBg = isAvailable ? 'ECFDF5' : 'F8FAFC';
    const fileName = comp.file?.name
      ? comp.file.name
      : isAvailable
      ? 'Dokumen Terlampir'
      : '-';

    return new TableRow({
      children: [
        createStyledCell(`${comp.number}`, { bold: true, widthPercent: 8, align: AlignmentType.CENTER, fontSize: 17 }),
        createStyledCell(comp.title, { bold: isAvailable, widthPercent: 40, fontSize: 17 }),
        createStyledCell(statusText, {
          bold: true,
          color: statusColor,
          bgColor: statusBg,
          widthPercent: 24,
          align: AlignmentType.CENTER,
          fontSize: 17
        }),
        createStyledCell(fileName, { italic: !isAvailable, color: isAvailable ? '334155' : '94A3B8', widthPercent: 28, fontSize: 17 })
      ]
    });
  });

  docElements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [checklistHeaderRow, ...checklistRows]
    })
  );

  // Verification Sign-off Box at bottom of Page 1
  docElements.push(
    new Paragraph({
      spacing: { before: 240, after: 80 },
      children: [
        new TextRun({
          text: 'Tanda Terima & Pengesahan:',
          bold: true,
          size: 17,
          color: '475569',
          font: 'Arial'
        })
      ]
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            createStyledCell('Dibuat & Diverifikasi Oleh:\nStaff Billing & Project Controlling\n\n\n__________________________\nPT. BELACOM INDONESIA TELECOM', {
              widthPercent: 50,
              fontSize: 16,
              align: AlignmentType.CENTER
            }),
            createStyledCell('Disetujui Oleh:\nManajer Operasional / Klien PIC\n\n\n__________________________\n(Tanda Tangan & Cap Resmi)', {
              widthPercent: 50,
              fontSize: 16,
              align: AlignmentType.CENTER
            })
          ]
        })
      ]
    })
  );

  // =========================================================================
  // ATTACHMENT PAGES (SEPARATE PAGE PER COMPONENT - 100% VISUAL IMAGES)
  // =========================================================================

  for (const comp of fileComponents) {
    if (!comp.file || (!comp.file.url && !comp.file.name && !comp.file.imageDataUrl)) {
      continue;
    }

    const validated = await extractValidatedImageWithDimensions(comp.file, {
      docTitle: comp.title,
      woNumber: item.woNumber,
      billingCode: item.billingCode
    });

    if (!validated || !validated.buffer || validated.buffer.length < 100) {
      continue; // Skip invalid or corrupted drawing safely
    }

    // Proportional dimensions
    const fitDim = getWordProportionalDimensions(validated.naturalWidth, validated.naturalHeight);

    // Page break to start fresh page
    docElements.push(
      new Paragraph({
        children: [new PageBreak()]
      })
    );

    // Lampiran Header
    docElements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: `LAMPIRAN ${String(comp.number).padStart(2, '0')}: ${comp.title.toUpperCase()}`,
            bold: true,
            size: 23,
            color: '0284C7',
            font: 'Arial'
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: `Kode Penagihan: ${item.billingCode}  |  Nomor Ref WO: ${item.woNumber}  |  Dokumen: ${comp.file.name || comp.title}`,
            size: 16,
            color: '64748B',
            font: 'Arial'
          })
        ]
      })
    );

    // Centered, Proportional ImageRun (aspect ratio strictly preserved)
    docElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 120 },
        children: [
          new ImageRun({
            type: validated.extension === 'jpeg' ? 'jpg' : 'png',
            data: validated.buffer,
            transformation: {
              width: fitDim.width,
              height: fitDim.height
            }
          })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: `Visual Dokumen: ${comp.file.name || comp.title} (Resolusi Asli: ${validated.naturalWidth} x ${validated.naturalHeight} px)`,
            italics: true,
            size: 15,
            color: '64748B',
            font: 'Arial'
          })
        ]
      })
    );
  }

  // Build Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1200,
              bottom: 1200,
              left: 1200,
              right: 1200
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `BELACOM PROJECT  |  ${item.billingCode}  |  Ref: ${item.woNumber}`,
                    size: 15,
                    color: '94A3B8',
                    font: 'Arial'
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Halaman ',
                    size: 15,
                    color: '94A3B8',
                    font: 'Arial'
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 15,
                    color: '94A3B8',
                    font: 'Arial'
                  }),
                  new TextRun({
                    text: ' dari ',
                    size: 15,
                    color: '94A3B8',
                    font: 'Arial'
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 15,
                    color: '94A3B8',
                    font: 'Arial'
                  })
                ]
              })
            ]
          })
        },
        children: docElements
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const cleanBillingCode = (item.billingCode || 'TAGIHAN').replace(/[/\\?%*:|"<>]/g, '_');
  const cleanWoNumber = (item.woNumber || 'WO').replace(/[/\\?%*:|"<>]/g, '_');
  const fileName = `Tagihan_${cleanBillingCode}_${cleanWoNumber}.docx`;
  saveAs(blob, fileName);
}

/**
 * 2. Export single BAST item into an official, symmetrical Word (.docx) document
 * with 4 document components (APD, ABD, Core Connection, Foto Dokumentasi)
 * preserving natural aspect ratio.
 */
export async function exportSingleBASTToWord(bast: BASTItem): Promise<void> {
  const bastNo = bast.bastNumber || `BAST/${bast.woNumber}/BELACOM/${new Date().getFullYear()}`;
  const evalWf = evaluateBASTWorkflow(bast);

  const fileComponents: Array<{
    number: number;
    title: string;
    file?: PDFFileMeta;
  }> = [
    { number: 1, title: 'As Planned Drawing (APD)', file: bast.apdPdf },
    { number: 2, title: 'As Built Drawing (ABD)', file: bast.abdPdf },
    { number: 3, title: 'Dokumen Core Connection', file: bast.coreConnectionPdf },
    { 
      number: 4, 
      title: 'Foto Dokumentasi Lapangan', 
      file: bast.fotoDokumentasiPdf || (bast.fotoDokumentasiPdfs && bast.fotoDokumentasiPdfs[0]) 
    }
  ];

  const docElements: (Paragraph | Table)[] = [];

  // ==========================================
  // PAGE 1: KOP, RINGKASAN & TABEL VERIFIKASI
  // ==========================================

  // Kop Perusahaan
  docElements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'PT. BELACOM INDONESIA TELECOM',
          bold: true,
          size: 30, // 15pt
          color: '047857', // Emerald-700
          font: 'Arial'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'BERITA ACARA SERAH TERIMA (BAST) PEKERJAAN',
          bold: true,
          size: 24, // 12pt
          color: '0F172A',
          font: 'Arial'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 260 },
      children: [
        new TextRun({
          text: 'Dokumen Resmi Pelaporan Hasil Pekerjaan & Serah Terima Infrastruktur Telekomunikasi',
          italics: true,
          size: 18,
          color: '64748B',
          font: 'Arial'
        })
      ]
    })
  );

  // Subheader: Ringkasan Informasi BAST
  docElements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 80, after: 100 },
      children: [
        new TextRun({
          text: 'I. INFORMASI UTAMA & TIMELINE BAST',
          bold: true,
          size: 21,
          color: '0F172A',
          font: 'Arial'
        })
      ]
    })
  );

  // Metadata Table (2 Columns)
  const metaRowsData: [string, string][] = [
    ['Nomor Resmi BAST', bastNo],
    ['Nomor Referensi Work Order (WO)', bast.woNumber || '-'],
    ['Kategori / Tipe Work Order', bast.woType || '-'],
    ['Deskripsi Pekerjaan Teknis', bast.workType || '-'],
    ['Tanggal Rilis (Release Date)', bast.releaseDate || '-'],
    ['Tanggal Mulai (Start Date)', bast.startDate || '-'],
    ['Tanggal Selesai (Finish Date)', bast.finishDate || '-'],
    ['Tanggal ABD & Core Connection', `${bast.abdDate || bast.finishDate || '-'} / ${bast.coreConnectionDate || bast.finishDate || '-'}`],
    ['Durasi Pelaksanaan', `${bast.durasiDate ?? bast.durationDays ?? 1} Hari Kerja`],
    ['Status BAST Lapangan', bast.statusBast || 'Submit'],
    ['Tahapan Alur Sub-Routing', `${evalWf.currentStageTitle} (${evalWf.percent}% selesai)`],
    ['Catatan / Remarks Pelaksanaan', bast.notes || 'Pekerjaan telah selesai dilaksanakan sesuai spesifikasi teknis dan SOP keselamatan.']
  ];

  const metaTableRows = metaRowsData.map(([label, val]) => {
    return new TableRow({
      children: [
        createStyledCell(label, {
          bold: true,
          bgColor: 'F1F5F9',
          color: '334155',
          widthPercent: 36,
          fontSize: 18
        }),
        createStyledCell(val, {
          bold: label.includes('Nomor Resmi BAST') || label.includes('Nomor Referensi') || label.includes('Status BAST'),
          color: label.includes('Nomor Resmi BAST') ? '047857' : label.includes('Nomor Referensi') ? '0284C7' : '0F172A',
          bgColor: 'FFFFFF',
          widthPercent: 64,
          fontSize: 18
        })
      ]
    });
  });

  docElements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: metaTableRows
    })
  );

  // Spacing
  docElements.push(
    new Paragraph({
      spacing: { before: 240, after: 100 },
      children: [
        new TextRun({
          text: 'II. MATRIKS VERIFIKASI 4 KOMPONEN LAMPIRAN EVIDENSE',
          bold: true,
          size: 21,
          color: '0F172A',
          font: 'Arial'
        })
      ]
    })
  );

  // Verification Checklist Table (4 Files)
  const checklistHeaderRow = new TableRow({
    children: [
      createStyledCell('No', { bold: true, bgColor: '059669', color: 'FFFFFF', widthPercent: 8, align: AlignmentType.CENTER }),
      createStyledCell('Komponen Lampiran BAST', { bold: true, bgColor: '059669', color: 'FFFFFF', widthPercent: 40 }),
      createStyledCell('Status Berkas', { bold: true, bgColor: '059669', color: 'FFFFFF', widthPercent: 24, align: AlignmentType.CENTER }),
      createStyledCell('Nama Berkas / File', { bold: true, bgColor: '059669', color: 'FFFFFF', widthPercent: 28 })
    ]
  });

  const checklistRows = fileComponents.map((comp) => {
    const isAvailable = Boolean(comp.file && (comp.file.url || comp.file.name || comp.file.imageDataUrl));
    const statusText = isAvailable ? '✓ TERSEDIA' : '— TIDAK ADA';
    const statusColor = isAvailable ? '047857' : '94A3B8';
    const statusBg = isAvailable ? 'ECFDF5' : 'F8FAFC';
    const fileName = comp.file?.name
      ? comp.file.name
      : isAvailable
      ? 'Dokumen Terlampir'
      : '-';

    return new TableRow({
      children: [
        createStyledCell(`${comp.number}`, { bold: true, widthPercent: 8, align: AlignmentType.CENTER, fontSize: 17 }),
        createStyledCell(comp.title, { bold: isAvailable, widthPercent: 40, fontSize: 17 }),
        createStyledCell(statusText, {
          bold: true,
          color: statusColor,
          bgColor: statusBg,
          widthPercent: 24,
          align: AlignmentType.CENTER,
          fontSize: 17
        }),
        createStyledCell(fileName, { italic: !isAvailable, color: isAvailable ? '334155' : '94A3B8', widthPercent: 28, fontSize: 17 })
      ]
    });
  });

  docElements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [checklistHeaderRow, ...checklistRows]
    })
  );

  // Sign-off / Signature box
  docElements.push(
    new Paragraph({
      spacing: { before: 240, after: 80 },
      children: [
        new TextRun({
          text: 'Pihak-Pihak Terkait Serah Terima:',
          bold: true,
          size: 17,
          color: '475569',
          font: 'Arial'
        })
      ]
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            createStyledCell('Pihak Pertama (Pelaksana Pekerjaan):\nTeam Lead / Project Coordinator\n\n\n__________________________\nPT. BELACOM INDONESIA TELECOM', {
              widthPercent: 50,
              fontSize: 16,
              align: AlignmentType.CENTER
            }),
            createStyledCell('Pihak Kedua (Pengawas / Pemberi Tugas):\nSite Representative / QC Inspector\n\n\n__________________________\n(Tanda Tangan & Nama Terang)', {
              widthPercent: 50,
              fontSize: 16,
              align: AlignmentType.CENTER
            })
          ]
        })
      ]
    })
  );

  // =========================================================================
  // ATTACHMENT PAGES (4 SLOTS - 100% VISUAL IMAGES PROPORTIONAL)
  // =========================================================================

  for (const comp of fileComponents) {
    if (!comp.file || (!comp.file.url && !comp.file.name && !comp.file.imageDataUrl)) {
      continue;
    }

    const validated = await extractValidatedImageWithDimensions(comp.file, {
      docTitle: comp.title,
      woNumber: bast.woNumber,
      billingCode: bastNo
    });

    if (!validated || !validated.buffer || validated.buffer.length < 100) {
      continue;
    }

    const fitDim = getWordProportionalDimensions(validated.naturalWidth, validated.naturalHeight);

    // Page break to start fresh page
    docElements.push(
      new Paragraph({
        children: [new PageBreak()]
      })
    );

    // Lampiran Header
    docElements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: `LAMPIRAN ${String(comp.number).padStart(2, '0')}: ${comp.title.toUpperCase()}`,
            bold: true,
            size: 23,
            color: '047857',
            font: 'Arial'
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: `No. BAST: ${bastNo}  |  Nomor Ref WO: ${bast.woNumber}  |  File: ${comp.file.name || comp.title}`,
            size: 16,
            color: '64748B',
            font: 'Arial'
          })
        ]
      })
    );

    // Centered, Proportional ImageRun
    docElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 120 },
        children: [
          new ImageRun({
            type: validated.extension === 'jpeg' ? 'jpg' : 'png',
            data: validated.buffer,
            transformation: {
              width: fitDim.width,
              height: fitDim.height
            }
          })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: `Evidense Lapangan: ${comp.file.name || comp.title} (Dimensi: ${validated.naturalWidth} x ${validated.naturalHeight} px)`,
            italics: true,
            size: 15,
            color: '64748B',
            font: 'Arial'
          })
        ]
      })
    );
  }

  // Build Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1200,
              bottom: 1200,
              left: 1200,
              right: 1200
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `BELACOM PROJECT  |  BAST WO: ${bast.woNumber}`,
                    size: 15,
                    color: '94A3B8',
                    font: 'Arial'
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Halaman ',
                    size: 15,
                    color: '94A3B8',
                    font: 'Arial'
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 15,
                    color: '94A3B8',
                    font: 'Arial'
                  }),
                  new TextRun({
                    text: ' dari ',
                    size: 15,
                    color: '94A3B8',
                    font: 'Arial'
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 15,
                    color: '94A3B8',
                    font: 'Arial'
                  })
                ]
              })
            ]
          })
        },
        children: docElements
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const cleanWoNumber = (bast.woNumber || 'WO').replace(/[/\\?%*:|"<>]/g, '_');
  const fileName = `BAST_${cleanWoNumber}.docx`;
  saveAs(blob, fileName);
}
