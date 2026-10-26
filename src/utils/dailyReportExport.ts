import { DailyReportItem, PDFFileMeta } from '../types';

export type TechnicalVisualSlot =
  | 'tagging-photo-a'
  | 'tagging-doc-a'
  | 'tagging-photo-b'
  | 'tagging-doc-b'
  | 'tagging-route'
  | 'doc-closure'
  | 'doc-opm'
  | 'doc-ols'
  | 'doc-bts'
  | 'doc-otdr';

export interface TechnicalCanvasOptions {
  slot: TechnicalVisualSlot;
  title?: string;
  fileName?: string;
  woNumber?: string;
  pic?: string;
  siteName?: string;
  coordinates?: string;
  destSiteName?: string;
  destCoordinates?: string;
  distanceMeters?: number;
}

const FALLBACK_1X1_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const escapeHtml = (str?: string | number | null): string => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

export const generateTechnicalCanvasDataUrl = (options: TechnicalCanvasOptions): string => {
  const {
    slot,
    title = 'Dokumentasi Teknis Belacom',
    fileName = 'berkas_teknis.png',
    woNumber = 'WO-BEL-2026',
    pic = 'Tim Lapangan Belacom',
    siteName = 'POP Sentul City / OTB-01',
    coordinates = '-6.589124, 106.852318',
    destSiteName = 'BTS Cijayanti / Closure CL-04',
    destCoordinates = '-6.594215, 106.861052',
    distanceMeters = 1119
  } = options;

  if (typeof document === 'undefined') {
    return FALLBACK_1X1_PNG;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 520;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return FALLBACK_1X1_PNG;
  }

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 520, 360);
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(0.6, '#1e293b');
  bgGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 520, 360);

  // Technical grid lines
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.lineWidth = 1;
  for (let x = 40; x < 520; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 360);
    ctx.stroke();
  }
  for (let y = 40; y < 360; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(520, y);
    ctx.stroke();
  }

  // Outer frame
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, 508, 348);

  // Top Header Bar
  ctx.fillStyle = '#020617';
  ctx.fillRect(10, 10, 500, 44);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, 500, 44);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('PT. BELACOM INDONESIA TELECOM · VERIFIED VISUAL', 22, 30);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px monospace';
  ctx.fillText(`NO. WO: ${woNumber}   |   PIC: ${pic}`, 22, 46);

  // Center visual area (y: 62 -> 242)
  if (slot === 'tagging-photo-a' || slot === 'tagging-photo-b' || slot === 'tagging-doc-a' || slot === 'tagging-doc-b') {
    const isSiteB = slot.endsWith('-b');
    const isDoc = slot.includes('-doc-');
    const accent = isSiteB ? '#f43f5e' : '#10b981';

    // Radar / GPS Crosshair
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(135, 150, 52, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(135, 150, 28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(135, 150, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(70, 150);
    ctx.lineTo(200, 150);
    ctx.moveTo(135, 85);
    ctx.lineTo(135, 215);
    ctx.stroke();

    // Right info box
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.fillRect(215, 76, 285, 150);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(215, 76, 285, 150);

    ctx.fillStyle = accent;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(
      isDoc
        ? `DOKUMEN BUKTI TAGGING (${isSiteB ? 'SITE B' : 'SITE A'})`
        : `FOTO GEOTAGGING LOKASI (${isSiteB ? 'SITE B' : 'SITE A'})`,
      228,
      100
    );

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`LOKASI : ${(siteName || '-').substring(0, 26)}`, 228, 128);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`KOORD  : ${coordinates || '-6.589124, 106.852318'}`, 228, 154);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px monospace';
    ctx.fillText(`STATUS : GPS LOCK HIGH ACCURACY`, 228, 180);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`FILE   : ${(fileName || '-').substring(0, 27)}`, 228, 204);
  } else if (slot === 'tagging-route') {
    // Route Map Visualization between Site A and Site B
    ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
    ctx.fillRect(22, 68, 476, 165);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(22, 68, 476, 165);

    // Route curve
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(85, 185);
    ctx.bezierCurveTo(190, 90, 310, 210, 430, 115);
    ctx.stroke();

    // Origin Node (Site A)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(85, 185, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('SITE A (ORIGIN)', 42, 212);
    ctx.fillStyle = '#34d399';
    ctx.font = '10px monospace';
    ctx.fillText((coordinates || '-6.589124, 106.852318').substring(0, 22), 42, 225);

    // Destination Node (Site B)
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(430, 115, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('SITE B (DEST)', 375, 92);
    ctx.fillStyle = '#fda4af';
    ctx.font = '10px monospace';
    ctx.fillText((destCoordinates || '-6.594215, 106.861052').substring(0, 22), 345, 142);

    // Distance pill in center
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(185, 130, 155, 32);
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(185, 130, 155, 32);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`JARAK: ${distanceMeters || 1119} METER`, 198, 150);
  } else if (slot === 'doc-opm' || slot === 'doc-ols') {
    const isOpm = slot === 'doc-opm';
    // Digital Optical Meter Display
    ctx.fillStyle = '#022c22';
    ctx.fillRect(40, 74, 440, 155);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(40, 74, 440, 155);

    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(
      isOpm
        ? 'OPTICAL POWER METER (OPM) CALIBRATED TEST'
        : 'OPTICAL LIGHT SOURCE (OLS) LASER TRANSMITTER',
      58,
      102
    );

    ctx.fillStyle = '#ecfdf5';
    ctx.font = 'bold 34px monospace';
    ctx.fillText(isOpm ? '-14.82 dBm' : '-03.00 dBm', 58, 152);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('λ 1310nm / 1550nm  ·  STATUS: PASS OK', 58, 185);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = '11px monospace';
    ctx.fillText(`REFLOSS: 0.18 dB/km   |   CORE: FO-48 INTERCONNECTION`, 58, 212);
  } else if (slot === 'doc-otdr') {
    // OTDR Trace Graph Curve
    ctx.fillStyle = '#020617';
    ctx.fillRect(35, 72, 450, 158);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(35, 72, 450, 158);

    // Graph axes
    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(65, 88);
    ctx.lineTo(65, 205);
    ctx.lineTo(465, 205);
    ctx.stroke();

    // OTDR trace slope with reflective peaks
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(65, 105);
    ctx.lineTo(75, 90);
    ctx.lineTo(85, 118);
    ctx.lineTo(210, 145);
    ctx.lineTo(216, 132);
    ctx.lineTo(222, 150);
    ctx.lineTo(395, 182);
    ctx.lineTo(404, 125);
    ctx.lineTo(412, 202);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('OTDR TRACE GRAPH · λ 1550nm · TOTAL LOSS: 0.21 dB/km (PASS)', 75, 96);
  } else {
    // Closure / BTS Hardware Visual
    const isClosure = slot === 'doc-closure';
    ctx.fillStyle = '#090d16';
    ctx.fillRect(38, 72, 444, 158);
    ctx.strokeStyle = isClosure ? '#f59e0b' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(38, 72, 444, 158);

    // Draw technical rack / splice cassette bays
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(58, 90 + i * 30, 180, 22);
      ctx.fillStyle = isClosure ? '#fbbf24' : '#38bdf8';
      ctx.fillRect(66, 96 + i * 30, 35, 10);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(220, 101 + i * 30, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(
      isClosure ? 'JOINT CLOSURE DOME & SPLICE TRAY' : 'DOKUMENTASI PERANGKAT BTS / ODF',
      252,
      110
    );
    ctx.fillStyle = '#38bdf8';
    ctx.font = '12px monospace';
    ctx.fillText('CORE SPLICING : 48 CORE FO', 252, 138);
    ctx.fillStyle = '#34d399';
    ctx.fillText('INSPECTION    : VERIFIED QA PASS', 252, 162);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`SITE : ${(siteName || 'POP / BTS').substring(0, 22)}`, 252, 186);
  }

  // Footer Stamp Box (y: 248 -> 344)
  ctx.fillStyle = '#020617';
  ctx.fillRect(10, 248, 500, 96);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(10, 248, 500, 96);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`DOKUMEN : ${(title || '').toUpperCase().substring(0, 44)}`, 22, 270);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '12px monospace';
  ctx.fillText(`BERKAS  : ${(fileName || '-').substring(0, 48)}`, 22, 292);

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(
    `KOORDINAT: ${(coordinates || '-6.589124, 106.852318').substring(0, 45)}`,
    22,
    314
  );

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px monospace';
  const dateStamp = new Date().toISOString().substring(0, 10);
  ctx.fillText(`TANGGAL : ${dateStamp}   |   PT. BELACOM INDONESIA TELECOM`, 22, 334);

  return canvas.toDataURL('image/png');
};

export const convertUploadedFileToImageBase64 = (
  file: File,
  fallbackOptions: TechnicalCanvasOptions
): Promise<{ fileUrl: string; imageDataUrl: string }> => {
  return new Promise((resolve) => {
    const isImage =
      file.type.startsWith('image/') ||
      /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = typeof reader.result === 'string' ? reader.result : '';
      if (!isImage) {
        const canvasImg = generateTechnicalCanvasDataUrl({
          ...fallbackOptions,
          fileName: file.name
        });
        resolve({
          fileUrl: resultStr || canvasImg,
          imageDataUrl: canvasImg
        });
        return;
      }

      // Normalize uploaded image via HTMLImageElement + Canvas so Word/Excel always gets a clean PNG/JPEG Base64
      if (typeof document !== 'undefined' && resultStr.startsWith('data:image/')) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 520;
          canvas.height = 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 520, 360);
            ctx.drawImage(img, 0, 0, 520, 316);
            // Bottom stamp bar
            ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
            ctx.fillRect(0, 316, 520, 44);
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 11px monospace';
            ctx.fillText(
              `${fallbackOptions.woNumber || 'WO-BELACOM'} · ${file.name.substring(0, 36)}`,
              12,
              334
            );
            ctx.fillStyle = '#34d399';
            ctx.font = '10px monospace';
            ctx.fillText(
              `GPS: ${fallbackOptions.coordinates || '-6.589124, 106.852318'} · PIC: ${fallbackOptions.pic || 'Tim Belacom'}`,
              12,
              350
            );
            const normalized = canvas.toDataURL('image/jpeg', 0.92);
            resolve({
              fileUrl: resultStr,
              imageDataUrl: normalized
            });
            return;
          }
          resolve({
            fileUrl: resultStr,
            imageDataUrl: resultStr
          });
        };
        img.onerror = () => {
          resolve({
            fileUrl: resultStr,
            imageDataUrl: resultStr
          });
        };
        img.src = resultStr;
        return;
      }

      const fallbackImg = generateTechnicalCanvasDataUrl({
        ...fallbackOptions,
        fileName: file.name
      });
      resolve({
        fileUrl: resultStr || fallbackImg,
        imageDataUrl: resultStr.startsWith('data:image/') ? resultStr : fallbackImg
      });
    };
    reader.onerror = () => {
      const fallbackImg = generateTechnicalCanvasDataUrl({
        ...fallbackOptions,
        fileName: file.name
      });
      resolve({
        fileUrl: fallbackImg,
        imageDataUrl: fallbackImg
      });
    };
    reader.readAsDataURL(file);
  });
};

export interface ResolvedVisualAttachment {
  no: number;
  sectionCategory: 'Tagging Location' | 'Dokumen Bagian 18';
  docTypeLabel: string;
  fileName: string;
  detailText: string;
  imageDataUrl: string;
  isUploaded: boolean;
}

export const ensureFileVisualBase64 = (
  fileMeta: PDFFileMeta | undefined,
  options: TechnicalCanvasOptions
): string => {
  if (
    fileMeta?.imageDataUrl &&
    (fileMeta.imageDataUrl.startsWith('data:image/png;base64,') ||
      fileMeta.imageDataUrl.startsWith('data:image/jpeg;base64,') ||
      fileMeta.imageDataUrl.startsWith('data:image/'))
  ) {
    return fileMeta.imageDataUrl;
  }
  if (
    fileMeta?.url &&
    (fileMeta.url.startsWith('data:image/png;base64,') ||
      fileMeta.url.startsWith('data:image/jpeg;base64,'))
  ) {
    return fileMeta.url;
  }
  return generateTechnicalCanvasDataUrl({
    ...options,
    fileName: fileMeta?.name ?? options.fileName
  });
};

export const resolveDailyReportAttachments = (
  report: Partial<DailyReportItem>
): ResolvedVisualAttachment[] => {
  const woNumber = report?.woNumber ?? 'WO-BEL-2026';
  const pic = report?.pic ?? 'Tim Belacom';
  const origSite = report?.originLocation || 'POP Sentul City / OTB-01';
  const origCoord = report?.originCoordinates || '-6.589124, 106.852318';
  const destSite = report?.destinationLocation || 'BTS Cijayanti / Closure CL-04';
  const destCoord = report?.destinationCoordinates || '-6.594215, 106.861052';
  const dist = report?.totalDistanceMeters ?? report?.estimatedDistanceMeters ?? 1119;
  const docs = report?.documentation ?? {};

  const items: ResolvedVisualAttachment[] = [
    {
      no: 1,
      sectionCategory: 'Tagging Location',
      docTypeLabel: 'Foto Geotagging Site A (Origin)',
      fileName: report?.originPhotoFile?.name ?? 'foto_geotag_site_a.jpg',
      detailText: `${origSite} (${origCoord})`,
      imageDataUrl: ensureFileVisualBase64(report?.originPhotoFile, {
        slot: 'tagging-photo-a',
        title: 'Foto Geotagging Site A (Origin)',
        fileName: report?.originPhotoFile?.name ?? 'foto_geotag_site_a.jpg',
        woNumber,
        pic,
        siteName: origSite,
        coordinates: origCoord
      }),
      isUploaded: Boolean(report?.originPhotoFile)
    },
    {
      no: 2,
      sectionCategory: 'Tagging Location',
      docTypeLabel: 'Dokumen Bukti Tagging Site A',
      fileName: report?.originTaggingDocFile?.name ?? 'bukti_tagging_site_a.gpx',
      detailText: `Bukti Koordinat Site A: ${origCoord}`,
      imageDataUrl: ensureFileVisualBase64(report?.originTaggingDocFile, {
        slot: 'tagging-doc-a',
        title: 'Dokumen Bukti Tagging Site A',
        fileName: report?.originTaggingDocFile?.name ?? 'bukti_tagging_site_a.gpx',
        woNumber,
        pic,
        siteName: origSite,
        coordinates: origCoord
      }),
      isUploaded: Boolean(report?.originTaggingDocFile)
    },
    {
      no: 3,
      sectionCategory: 'Tagging Location',
      docTypeLabel: 'Foto Geotagging Site B (Destination)',
      fileName: report?.destinationPhotoFile?.name ?? 'foto_geotag_site_b.jpg',
      detailText: `${destSite} (${destCoord})`,
      imageDataUrl: ensureFileVisualBase64(report?.destinationPhotoFile, {
        slot: 'tagging-photo-b',
        title: 'Foto Geotagging Site B (Destination)',
        fileName: report?.destinationPhotoFile?.name ?? 'foto_geotag_site_b.jpg',
        woNumber,
        pic,
        siteName: destSite,
        coordinates: destCoord
      }),
      isUploaded: Boolean(report?.destinationPhotoFile)
    },
    {
      no: 4,
      sectionCategory: 'Tagging Location',
      docTypeLabel: 'Dokumen Bukti Tagging Site B',
      fileName: report?.destinationTaggingDocFile?.name ?? 'bukti_tagging_site_b.gpx',
      detailText: `Bukti Koordinat Site B: ${destCoord}`,
      imageDataUrl: ensureFileVisualBase64(report?.destinationTaggingDocFile, {
        slot: 'tagging-doc-b',
        title: 'Dokumen Bukti Tagging Site B',
        fileName: report?.destinationTaggingDocFile?.name ?? 'bukti_tagging_site_b.gpx',
        woNumber,
        pic,
        siteName: destSite,
        coordinates: destCoord
      }),
      isUploaded: Boolean(report?.destinationTaggingDocFile)
    },
    {
      no: 5,
      sectionCategory: 'Tagging Location',
      docTypeLabel: 'File Peta Rute End-to-End',
      fileName: report?.routeMapFile?.name ?? 'peta_rute_end_to_end.kml',
      detailText: `${origSite} ➔ ${destSite} (${dist} m)`,
      imageDataUrl: ensureFileVisualBase64(report?.routeMapFile, {
        slot: 'tagging-route',
        title: 'Peta Rute End-to-End Location',
        fileName: report?.routeMapFile?.name ?? 'peta_rute_end_to_end.kml',
        woNumber,
        pic,
        siteName: origSite,
        coordinates: origCoord,
        destSiteName: destSite,
        destCoordinates: destCoord,
        distanceMeters: dist
      }),
      isUploaded: Boolean(report?.routeMapFile)
    },
    {
      no: 6,
      sectionCategory: 'Dokumen Bagian 18',
      docTypeLabel: '18.1 Foto Closure Doc',
      fileName: docs?.fotoClosurePdf?.name ?? 'foto_closure_doc.png',
      detailText: `Dokumentasi Joint Closure FO · WO: ${woNumber}`,
      imageDataUrl: ensureFileVisualBase64(docs?.fotoClosurePdf, {
        slot: 'doc-closure',
        title: '18.1 Foto Closure Doc',
        fileName: docs?.fotoClosurePdf?.name ?? 'foto_closure_doc.png',
        woNumber,
        pic,
        siteName: origSite,
        coordinates: origCoord
      }),
      isUploaded: Boolean(docs?.fotoClosurePdf)
    },
    {
      no: 7,
      sectionCategory: 'Dokumen Bagian 18',
      docTypeLabel: '18.2 Pengujian OPM Doc',
      fileName: docs?.opmPdf?.name ?? 'pengujian_opm_doc.png',
      detailText: `Hasil Ukur Redaman OPM (-14.82 dBm PASS) · PIC: ${pic}`,
      imageDataUrl: ensureFileVisualBase64(docs?.opmPdf, {
        slot: 'doc-opm',
        title: '18.2 Pengujian OPM Doc',
        fileName: docs?.opmPdf?.name ?? 'pengujian_opm_doc.png',
        woNumber,
        pic,
        siteName: origSite,
        coordinates: origCoord
      }),
      isUploaded: Boolean(docs?.opmPdf)
    },
    {
      no: 8,
      sectionCategory: 'Dokumen Bagian 18',
      docTypeLabel: '18.3 Pengujian OLS Doc',
      fileName: docs?.olsPdf?.name ?? 'pengujian_ols_doc.png',
      detailText: `Kalibrasi Sumber Cahaya OLS (1550nm STABLE) · PIC: ${pic}`,
      imageDataUrl: ensureFileVisualBase64(docs?.olsPdf, {
        slot: 'doc-ols',
        title: '18.3 Pengujian OLS Doc',
        fileName: docs?.olsPdf?.name ?? 'pengujian_ols_doc.png',
        woNumber,
        pic,
        siteName: origSite,
        coordinates: origCoord
      }),
      isUploaded: Boolean(docs?.olsPdf)
    },
    {
      no: 9,
      sectionCategory: 'Dokumen Bagian 18',
      docTypeLabel: '18.4 Dokumentasi BTS Doc',
      fileName: docs?.btsPdf?.name ?? 'dokumentasi_bts_doc.png',
      detailText: `Terminasi Perangkat BTS / ODF · Lokasi: ${destSite}`,
      imageDataUrl: ensureFileVisualBase64(docs?.btsPdf, {
        slot: 'doc-bts',
        title: '18.4 Dokumentasi BTS Doc',
        fileName: docs?.btsPdf?.name ?? 'dokumentasi_bts_doc.png',
        woNumber,
        pic,
        siteName: destSite,
        coordinates: destCoord
      }),
      isUploaded: Boolean(docs?.btsPdf)
    },
    {
      no: 10,
      sectionCategory: 'Dokumen Bagian 18',
      docTypeLabel: '18.5 OTDR Trace Test Doc',
      fileName: docs?.otdrPdf?.name ?? 'otdr_trace_test_doc.png',
      detailText: `Kurva OTDR End-to-End (${dist} m · 0.21 dB/km PASS)`,
      imageDataUrl: ensureFileVisualBase64(docs?.otdrPdf, {
        slot: 'doc-otdr',
        title: '18.5 OTDR Trace Test Doc',
        fileName: docs?.otdrPdf?.name ?? 'otdr_trace_test_doc.png',
        woNumber,
        pic,
        siteName: `${origSite} - ${destSite}`,
        coordinates: `${origCoord} -> ${destCoord}`,
        distanceMeters: dist
      }),
      isUploaded: Boolean(docs?.otdrPdf)
    }
  ];

  return items;
};

export const buildDailyReportWordHtml = (report: Partial<DailyReportItem>): string => {
  const attachments = resolveDailyReportAttachments(report);
  const taggingItems = attachments.filter((a) => a.sectionCategory === 'Tagging Location');
  const section18Items = attachments.filter((a) => a.sectionCategory === 'Dokumen Bagian 18');

  const origSite = report?.originLocation || 'POP Sentul City / OTB-01';
  const origCoord = report?.originCoordinates || '-6.589124, 106.852318';
  const destSite = report?.destinationLocation || 'BTS Cijayanti / Closure CL-04';
  const destCoord = report?.destinationCoordinates || '-6.594215, 106.861052';

  const photoSiteA = taggingItems[0];
  const docSiteA = taggingItems[1];
  const photoSiteB = taggingItems[2];
  const docSiteB = taggingItems[3];
  const routeVisual = taggingItems[4];

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>Daily Report - ${escapeHtml(report?.woNumber || 'WO-BELACOM')}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page { size: A4 portrait; margin: 1.5cm; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #0f172a; line-height: 1.4; }
    .kop-box { border-bottom: 3px solid #0284c7; padding-bottom: 10px; margin-bottom: 14px; text-align: center; }
    .kop-title { font-size: 13pt; font-weight: bold; color: #0f172a; text-transform: uppercase; margin: 0; }
    .kop-sub { font-size: 9.5pt; color: #0369a1; font-weight: bold; margin-top: 4px; }
    .sec-header { background: #0f172a; color: #ffffff; font-weight: bold; font-size: 10pt; padding: 6px 10px; margin-top: 14px; margin-bottom: 6px; text-transform: uppercase; }
    table.grid { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    table.grid th, table.grid td { border: 1px solid #94a3b8; padding: 6px 8px; font-size: 9.5pt; vertical-align: top; }
    table.grid th { background: #e2e8f0; color: #0f172a; font-weight: bold; text-align: left; }
    .img-cell { text-align: center; vertical-align: middle; background: #f8fafc; padding: 8px; }
    .caption { font-size: 8.5pt; color: #334155; margin-top: 4px; font-weight: bold; }
    .sub-caption { font-size: 8pt; color: #64748b; }
  </style>
</head>
<body>
  <div class="kop-box">
    <p class="kop-title">LAPORAN HARIAN (DAILY REPORT) - RUTE KOORDINAT &amp; DOKUMENTASI VISUAL PT BELACOM INDONESIA TELECOM</p>
    <p class="kop-sub">Sistem Informasi Controlling Project Fiber Optic &amp; Interkoneksi Telekomunikasi</p>
  </div>

  <div class="sec-header">I. TABEL INFORMASI UMUM WORK ORDER (WO)</div>
  <table class="grid">
    <tr>
      <th width="22%">No. WO</th>
      <td width="28%"><strong>${escapeHtml(report?.woNumber || '-')}</strong></td>
      <th width="22%">Tanggal Start / Finish</th>
      <td width="28%">${escapeHtml(report?.startDate || '-')} s/d ${escapeHtml(report?.finishDate || '-')}</td>
    </tr>
    <tr>
      <th>WO Option / Kategori</th>
      <td>${escapeHtml(report?.woType || '-')}</td>
      <th>Durasi Pelaksanaan</th>
      <td><strong>${escapeHtml(report?.durationDays ?? 1)} Hari Kerja</strong></td>
    </tr>
    <tr>
      <th>Area Assignment &amp; Tim</th>
      <td>${escapeHtml(report?.assignment || '-')} / Tim ${escapeHtml(report?.team || '-')}</td>
      <th>Estimasi Jarak (Meter)</th>
      <td>${escapeHtml(report?.estimatedDistanceMeters ?? 0)} Meter</td>
    </tr>
    <tr>
      <th>PIC Lapangan</th>
      <td><strong>${escapeHtml(report?.pic || '-')}</strong></td>
      <th>Total Jarak (Meter)</th>
      <td>${escapeHtml(report?.totalDistanceMeters ?? 0)} Meter</td>
    </tr>
    <tr>
      <th>Status WO / Team</th>
      <td>${escapeHtml(report?.statusWo || '-')} (${escapeHtml(report?.statusTeamProject || '-')})</td>
      <th>Panjang Alur (Meter)</th>
      <td><strong>${escapeHtml(report?.pathLengthMeters ?? 0)} Meter</strong></td>
    </tr>
    <tr>
      <th>Work Type (Uraian Pekerjaan)</th>
      <td colspan="3">${escapeHtml(report?.workType || '-')}</td>
    </tr>
  </table>

  <div class="sec-header">BAGIAN A - TABEL &amp; VISUAL TAGGING END TO END LOCATION (RUTE &amp; TITIK KOORDINAT)</div>
  <table class="grid">
    <tr>
      <th width="50%">Titik Awal (Origin / Site A)</th>
      <th width="50%">Titik Akhir (Destination / Site B)</th>
    </tr>
    <tr>
      <td>
        <strong>Nama Site A:</strong> ${escapeHtml(origSite)}<br/>
        <strong>Koordinat GPS (Lat, Long):</strong> ${escapeHtml(origCoord)}<br/>
        <strong>Berkas Foto Site A:</strong> ${escapeHtml(photoSiteA?.fileName)}<br/>
        <strong>Berkas Bukti Tagging A:</strong> ${escapeHtml(docSiteA?.fileName)}
      </td>
      <td>
        <strong>Nama Site B:</strong> ${escapeHtml(destSite)}<br/>
        <strong>Koordinat GPS (Lat, Long):</strong> ${escapeHtml(destCoord)}<br/>
        <strong>Berkas Foto Site B:</strong> ${escapeHtml(photoSiteB?.fileName)}<br/>
        <strong>Berkas Bukti Tagging B:</strong> ${escapeHtml(docSiteB?.fileName)}
      </td>
    </tr>
    <tr>
      <td class="img-cell">
        <img src="${photoSiteA?.imageDataUrl}" width="260" height="180" style="width:260px; height:180px; border:1px solid #94a3b8; padding:4px;" />
        <div class="caption">Foto Geotagging Site A (${escapeHtml(photoSiteA?.fileName)})</div>
        <div class="sub-caption">Koordinat: ${escapeHtml(origCoord)}</div>
      </td>
      <td class="img-cell">
        <img src="${photoSiteB?.imageDataUrl}" width="260" height="180" style="width:260px; height:180px; border:1px solid #94a3b8; padding:4px;" />
        <div class="caption">Foto Geotagging Site B (${escapeHtml(photoSiteB?.fileName)})</div>
        <div class="sub-caption">Koordinat: ${escapeHtml(destCoord)}</div>
      </td>
    </tr>
    <tr>
      <td class="img-cell">
        <img src="${docSiteA?.imageDataUrl}" width="260" height="180" style="width:260px; height:180px; border:1px solid #94a3b8; padding:4px;" />
        <div class="caption">Dokumen Bukti Tagging Site A (${escapeHtml(docSiteA?.fileName)})</div>
      </td>
      <td class="img-cell">
        <img src="${docSiteB?.imageDataUrl}" width="260" height="180" style="width:260px; height:180px; border:1px solid #94a3b8; padding:4px;" />
        <div class="caption">Dokumen Bukti Tagging Site B (${escapeHtml(docSiteB?.fileName)})</div>
      </td>
    </tr>
    <tr>
      <td colspan="2" class="img-cell">
        <img src="${routeVisual?.imageDataUrl}" width="260" height="180" style="width:260px; height:180px; border:1px solid #94a3b8; padding:4px;" />
        <div class="caption">Visual Peta Rute End-to-End (${escapeHtml(routeVisual?.fileName)})</div>
        <div class="sub-caption">${escapeHtml(origSite)} (${escapeHtml(origCoord)}) ➔ ${escapeHtml(destSite)} (${escapeHtml(destCoord)})</div>
      </td>
    </tr>
  </table>

  <div class="sec-header">BAGIAN B - TABEL GRID 18. DOKUMEN &amp; FOTO DOKUMENTASI LAPANGAN</div>
  <table class="grid">
    <tr>
      <td width="50%" class="img-cell">
        <img src="${section18Items[0]?.imageDataUrl}" width="260" height="180" style="width:260px; height:180px; border:1px solid #94a3b8; padding:4px;" />
        <div class="caption">1. Foto Closure Doc</div>
        <div class="sub-caption">Nama File: ${escapeHtml(section18Items[0]?.fileName)}</div>
      </td>
      <td width="50%" class="img-cell">
        <img src="${section18Items[1]?.imageDataUrl}" width="260" height="180" style="width:260px; height:180px; border:1px solid #94a3b8; padding:4px;" />
        <div class="caption">2. Pengujian OPM Doc</div>
        <div class="sub-caption">Nama File: ${escapeHtml(section18Items[1]?.fileName)}</div>
      </td>
    </tr>
    <tr>
      <td width="50%" class="img-cell">
        <img src="${section18Items[2]?.imageDataUrl}" width="260" height="180" style="width:260px; height:180px; border:1px solid #94a3b8; padding:4px;" />
        <div class="caption">3. Pengujian OLS Doc</div>
        <div class="sub-caption">Nama File: ${escapeHtml(section18Items[2]?.fileName)}</div>
      </td>
      <td width="50%" class="img-cell">
        <img src="${section18Items[3]?.imageDataUrl}" width="260" height="180" style="width:260px; height:180px; border:1px solid #94a3b8; padding:4px;" />
        <div class="caption">4. Dokumentasi BTS Doc</div>
        <div class="sub-caption">Nama File: ${escapeHtml(section18Items[3]?.fileName)}</div>
      </td>
    </tr>
    <tr>
      <td width="50%" class="img-cell">
        <img src="${section18Items[4]?.imageDataUrl}" width="260" height="180" style="width:260px; height:180px; border:1px solid #94a3b8; padding:4px;" />
        <div class="caption">5. OTDR Trace Test Doc</div>
        <div class="sub-caption">Nama File: ${escapeHtml(section18Items[4]?.fileName)}</div>
      </td>
      <td width="50%">
        <strong>19. Catatan / Remarks Lapangan:</strong><br/><br/>
        ${escapeHtml(report?.remarks || 'Pekerjaan penarikan, terminasi, tagging lokasi end-to-end, serta pengujian OPM/OLS/OTDR telah dilaksanakan sesuai standar teknis PT. Belacom Indonesia Telecom.')}
        <br/><br/>
        <strong>Ringkasan Status Berkas:</strong><br/>
        - Tagging End-to-End Location: 5 Visual Terlampir<br/>
        - Dokumen &amp; Foto Bagian 18: 5 Visual Terlampir
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const buildDailyReportExcelHtml = (
  reportsInput: Partial<DailyReportItem> | Array<Partial<DailyReportItem>>
): string => {
  const reports = Array.isArray(reportsInput) ? reportsInput : [reportsInput];

  const reportSectionsHtml = reports
    .map((report, idx) => {
      const attachments = resolveDailyReportAttachments(report);
      const origSite = report?.originLocation || 'POP Sentul City / OTB-01';
      const origCoord = report?.originCoordinates || '-6.589124, 106.852318';
      const destSite = report?.destinationLocation || 'BTS Cijayanti / Closure CL-04';
      const destCoord = report?.destinationCoordinates || '-6.594215, 106.861052';

      const attachmentRowsHtml = attachments
        .map(
          (att) => `
      <tr height="165" style="height:124pt;">
        <td style="text-align:center; vertical-align:middle; border:1px solid #64748b;">${att.no}</td>
        <td style="vertical-align:middle; border:1px solid #64748b; font-weight:bold;">${escapeHtml(att.sectionCategory)}</td>
        <td style="vertical-align:middle; border:1px solid #64748b;">${escapeHtml(att.docTypeLabel)}</td>
        <td style="vertical-align:middle; border:1px solid #64748b; font-family:monospace;">${escapeHtml(att.fileName)}</td>
        <td style="vertical-align:middle; border:1px solid #64748b;">${escapeHtml(att.detailText)}</td>
        <td width="230" style="width:175pt; text-align:center; vertical-align:middle; border:1px solid #64748b; padding:6px;">
          <img src="${att.imageDataUrl}" width="210" height="150" />
        </td>
      </tr>`
        )
        .join('');

      return `
    <table>
      <tr>
        <td colspan="6" style="background:#0f172a; color:#ffffff; font-weight:bold; font-size:12pt; padding:8px;">
          LAPORAN HARIAN (DAILY REPORT) #${idx + 1} - NO. WO: ${escapeHtml(report?.woNumber || '-')} | PT BELACOM INDONESIA TELECOM
        </td>
      </tr>
      <tr>
        <td style="background:#e2e8f0; font-weight:bold; border:1px solid #64748b;">No. WO</td>
        <td style="border:1px solid #64748b; font-weight:bold;">${escapeHtml(report?.woNumber || '-')}</td>
        <td style="background:#e2e8f0; font-weight:bold; border:1px solid #64748b;">WO Option</td>
        <td style="border:1px solid #64748b;">${escapeHtml(report?.woType || '-')}</td>
        <td style="background:#e2e8f0; font-weight:bold; border:1px solid #64748b;">Area / Tim / PIC</td>
        <td style="border:1px solid #64748b;">${escapeHtml(report?.assignment || '-')} / ${escapeHtml(report?.team || '-')} / ${escapeHtml(report?.pic || '-')}</td>
      </tr>
      <tr>
        <td style="background:#e2e8f0; font-weight:bold; border:1px solid #64748b;">Titik Awal (Site A)</td>
        <td style="border:1px solid #64748b;">${escapeHtml(origSite)}</td>
        <td style="background:#e2e8f0; font-weight:bold; border:1px solid #64748b;">Koordinat Site A</td>
        <td style="border:1px solid #64748b; font-family:monospace;">${escapeHtml(origCoord)}</td>
        <td style="background:#e2e8f0; font-weight:bold; border:1px solid #64748b;">Tanggal &amp; Durasi</td>
        <td style="border:1px solid #64748b;">${escapeHtml(report?.startDate || '-')} s/d ${escapeHtml(report?.finishDate || '-')} (${escapeHtml(report?.durationDays ?? 1)} Hari)</td>
      </tr>
      <tr>
        <td style="background:#e2e8f0; font-weight:bold; border:1px solid #64748b;">Titik Akhir (Site B)</td>
        <td style="border:1px solid #64748b;">${escapeHtml(destSite)}</td>
        <td style="background:#e2e8f0; font-weight:bold; border:1px solid #64748b;">Koordinat Site B</td>
        <td style="border:1px solid #64748b; font-family:monospace;">${escapeHtml(destCoord)}</td>
        <td style="background:#e2e8f0; font-weight:bold; border:1px solid #64748b;">Estimasi / Total / Alur</td>
        <td style="border:1px solid #64748b;">${escapeHtml(report?.estimatedDistanceMeters ?? 0)}m / ${escapeHtml(report?.totalDistanceMeters ?? 0)}m / ${escapeHtml(report?.pathLengthMeters ?? 0)}m</td>
      </tr>
      <tr>
        <td style="background:#e2e8f0; font-weight:bold; border:1px solid #64748b;">Work Type</td>
        <td colspan="3" style="border:1px solid #64748b;">${escapeHtml(report?.workType || '-')}</td>
        <td style="background:#e2e8f0; font-weight:bold; border:1px solid #64748b;">Remarks</td>
        <td style="border:1px solid #64748b;">${escapeHtml(report?.remarks || '-')}</td>
      </tr>
      <tr><td colspan="6"></td></tr>
      <tr style="background:#0284c7; color:#ffffff; font-weight:bold;">
        <th style="border:1px solid #0f172a; padding:6px;">No</th>
        <th style="border:1px solid #0f172a; padding:6px;">Kategori Bagian</th>
        <th style="border:1px solid #0f172a; padding:6px;">Jenis Dokumen</th>
        <th style="border:1px solid #0f172a; padding:6px;">Nama File</th>
        <th style="border:1px solid #0f172a; padding:6px;">Titik Koordinat / Detail</th>
        <th width="230" style="width:175pt; border:1px solid #0f172a; padding:6px;">Gambar Dokumentasi</th>
      </tr>
      ${attachmentRowsHtml}
      <tr><td colspan="6"></td></tr>
    </table>`;
    })
    .join('<br/>');

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Daily Report Visual</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
</head>
<body>
  ${reportSectionsHtml}
</body>
</html>`;
};

export const triggerBlobDownload = (content: string, mimeType: string, filename: string) => {
  if (typeof document === 'undefined') return;
  const blob = new Blob(['\ufeff', content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

export const downloadDailyReportWord = (report: Partial<DailyReportItem>) => {
  const html = buildDailyReportWordHtml(report);
  const cleanWo = (report?.woNumber || 'WO-BELACOM').replace(/[^a-zA-Z0-9_-]/g, '_');
  triggerBlobDownload(
    html,
    'application/msword;charset=utf-8',
    `Daily_Report_${cleanWo}_Visual.doc`
  );
};

export const downloadDailyReportExcel = (report: Partial<DailyReportItem>) => {
  const html = buildDailyReportExcelHtml(report);
  const cleanWo = (report?.woNumber || 'WO-BELACOM').replace(/[^a-zA-Z0-9_-]/g, '_');
  triggerBlobDownload(
    html,
    'application/vnd.ms-excel;charset=utf-8',
    `Daily_Report_${cleanWo}_Visual.xls`
  );
};

export const downloadAllDailyReportsExcel = (reports: Array<Partial<DailyReportItem>>) => {
  const html = buildDailyReportExcelHtml(reports);
  const dateStr = new Date().toISOString().substring(0, 10);
  triggerBlobDownload(
    html,
    'application/vnd.ms-excel;charset=utf-8',
    `Rekap_Daily_Report_Belacom_Visual_${dateStr}.xls`
  );
};
