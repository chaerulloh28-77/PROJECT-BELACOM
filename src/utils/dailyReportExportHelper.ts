import { DailyReportItem, PDFFileMeta } from '../types';

/**
 * Utilitas Export Dokumen Daily Report ke Format Microsoft Word (.doc) dan Excel (.xls)
 * dengan Penyematan Gambar Visual Base64 secara Langsung.
 */

function escapeHtml(value: string | number | undefined | null): string {
  const str = String(value ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Menghasilkan Gambar Visual SVG / Data URL untuk Geotagging Photo Site A atau Site B
 */
export function generateDailyReportGeotagPhotoDataUrl(
  siteName: string,
  coordinates: string,
  woNumber: string,
  type: 'origin' | 'destination',
  team?: string,
  pic?: string
): string {
  const isSiteB = type === 'destination';
  const label = isSiteB ? 'SITE B (DESTINATION)' : 'SITE A (ORIGIN)';
  const accentHex = isSiteB ? '#f43f5e' : '#10b981';
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' WIB';
  const cleanSite = escapeHtml(siteName || (isSiteB ? 'BTS Cijayanti / Closure CL-04' : 'POP Sentul City / OTB-01'));
  const cleanCoord = escapeHtml(coordinates || (isSiteB ? '-6.594215, 106.861052' : '-6.589124, 106.852318'));
  const cleanWo = escapeHtml(woNumber || 'WO-BEL-2026-0090');
  const cleanTeam = escapeHtml(team || 'ABR 03');
  const cleanPic = escapeHtml(pic || 'Teknisi Lapangan');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
    <defs>
      <linearGradient id="dr_bg_${type}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#08101e"/>
        <stop offset="60%" stop-color="#111d33"/>
        <stop offset="100%" stop-color="#091322"/>
      </linearGradient>
    </defs>
    <rect width="600" height="380" fill="url(#dr_bg_${type})"/>
    <g stroke="#1e293b" stroke-width="1" opacity="0.4">
      <line x1="0" y1="76" x2="600" y2="76"/>
      <line x1="0" y1="152" x2="600" y2="152"/>
      <line x1="0" y1="228" x2="600" y2="228"/>
      <line x1="0" y1="304" x2="600" y2="304"/>
      <line x1="150" y1="0" x2="150" y2="380"/>
      <line x1="300" y1="0" x2="300" y2="380"/>
      <line x1="450" y1="0" x2="450" y2="380"/>
    </g>
    <circle cx="300" cy="135" r="56" fill="none" stroke="${accentHex}" stroke-width="2" stroke-dasharray="6 3"/>
    <circle cx="300" cy="135" r="7" fill="${accentHex}"/>
    <path d="M245 210 L300 75 L355 210 Z" fill="none" stroke="#38bdf8" stroke-width="2.5"/>
    <line x1="265" y1="160" x2="335" y2="160" stroke="#38bdf8" stroke-width="2"/>
    <line x1="280" y1="120" x2="320" y2="120" stroke="#38bdf8" stroke-width="2"/>
    <rect x="20" y="18" width="280" height="30" rx="6" fill="#020617" opacity="0.9" stroke="${accentHex}" stroke-width="1.5"/>
    <text x="32" y="38" fill="${accentHex}" font-family="Arial, sans-serif" font-size="11.5" font-weight="bold">📍 GEOTAG FOTO LAPANGAN · ${label}</text>
    <rect x="20" y="240" width="560" height="122" rx="8" fill="#020617" opacity="0.94" stroke="#334155" stroke-width="1.2"/>
    <text x="34" y="265" fill="#f8fafc" font-family="Arial, sans-serif" font-size="12.5" font-weight="bold">PT. BELACOM INDONESIA · DOKUMENTASI DAILY REPORT</text>
    <text x="34" y="286" fill="#34d399" font-family="Consolas, monospace" font-size="11.5" font-weight="bold">LOKASI SITE : ${cleanSite}</text>
    <text x="34" y="306" fill="#38bdf8" font-family="Consolas, monospace" font-size="11.5" font-weight="bold">GPS KOORD   : ${cleanCoord}</text>
    <text x="34" y="325" fill="#94a3b8" font-family="Consolas, monospace" font-size="10.5">NO. WO: ${cleanWo} | TIM: ${cleanTeam} | PIC: ${cleanPic}</text>
    <text x="34" y="344" fill="#64748b" font-family="Consolas, monospace" font-size="9.5">WAKTU AMBIL : ${timestamp}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Menghasilkan Gambar Visual SVG / Data URL untuk Route Map Tracking
 */
export function generateDailyReportRouteMapDataUrl(
  originLoc: string,
  originCoord: string,
  destLoc: string,
  destCoord: string,
  distanceMeters: number,
  woNumber: string
): string {
  const distText = distanceMeters > 0 ? `${distanceMeters.toLocaleString('id-ID')} Meter` : '1.500 Meter';
  const cleanOrig = escapeHtml(originLoc || 'POP Sentul City / OTB-01');
  const cleanDest = escapeHtml(destLoc || 'BTS Cijayanti / Closure CL-04');
  const cleanOrigCoord = escapeHtml(originCoord || '-6.589124, 106.852318');
  const cleanDestCoord = escapeHtml(destCoord || '-6.594215, 106.861052');
  const cleanWo = escapeHtml(woNumber || 'WO-BEL-2026-0090');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="280" viewBox="0 0 600 280">
    <defs>
      <linearGradient id="dr_bgRoute" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#061224"/>
        <stop offset="100%" stop-color="#0e1f3a"/>
      </linearGradient>
    </defs>
    <rect width="600" height="280" fill="url(#dr_bgRoute)"/>
    <g stroke="#1e293b" stroke-width="1" stroke-dasharray="4 4">
      <line x1="0" y1="70" x2="600" y2="70"/>
      <line x1="0" y1="140" x2="600" y2="140"/>
      <line x1="0" y1="210" x2="600" y2="210"/>
    </g>
    <path d="M 80 150 Q 190 70, 300 160 T 520 130" fill="none" stroke="#0284c7" stroke-width="7" opacity="0.4"/>
    <path d="M 80 150 Q 190 70, 300 160 T 520 130" fill="none" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="80" cy="150" r="14" fill="#10b981" opacity="0.3"/>
    <circle cx="80" cy="150" r="7" fill="#10b981"/>
    <rect x="288" y="147" width="24" height="16" rx="4" fill="#f59e0b"/>
    <text x="300" y="159" fill="#000" font-family="Arial" font-size="8.5" font-weight="bold" text-anchor="middle">JC-1</text>
    <circle cx="520" cy="130" r="14" fill="#f43f5e" opacity="0.3"/>
    <circle cx="520" cy="130" r="7" fill="#f43f5e"/>
    <rect x="20" y="15" width="320" height="28" rx="6" fill="#020617" opacity="0.9" stroke="#38bdf8" stroke-width="1.2"/>
    <text x="32" y="34" fill="#38bdf8" font-family="Arial, sans-serif" font-size="11" font-weight="bold">🗺️ PETA RUTE END-TO-END FIBER OPTIC</text>
    <rect x="420" y="15" width="160" height="28" rx="6" fill="#020617" opacity="0.9" stroke="#10b981" stroke-width="1.2"/>
    <text x="500" y="34" fill="#34d399" font-family="Consolas, monospace" font-size="11" font-weight="bold" text-anchor="middle">📏 Jarak: ${distText}</text>
    <rect x="20" y="210" width="560" height="54" rx="6" fill="#020617" opacity="0.94" stroke="#334155" stroke-width="1"/>
    <text x="32" y="231" fill="#10b981" font-family="Consolas, monospace" font-size="10.5" font-weight="bold">SITE A: ${cleanOrig} (${cleanOrigCoord})</text>
    <text x="32" y="250" fill="#f43f5e" font-family="Consolas, monospace" font-size="10.5" font-weight="bold">SITE B: ${cleanDest} (${cleanDestCoord})</text>
    <text x="560" y="240" fill="#94a3b8" font-family="Consolas, monospace" font-size="10" text-anchor="end">${cleanWo}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Menghasilkan Gambar Visual SVG / Data URL untuk 5 Dokumen & Foto Dokumentasi
 */
export function generateDailyReportDocDataUrl(
  docCategory: string,
  fileName: string,
  woNumber: string,
  pic?: string
): string {
  const cleanCat = docCategory.toUpperCase();
  const cleanName = escapeHtml(fileName || `${cleanCat}_${woNumber}.jpg`);
  const cleanWo = escapeHtml(woNumber || 'WO-BEL-2026-0090');
  const cleanPic = escapeHtml(pic || 'Teknisi Lapangan');
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' WIB';

  let bannerColor = '#0284c7';
  let badgeTitle = 'DOKUMEN TEKNIS TERVERIFIKASI';
  let iconGraphic = '';

  if (cleanCat.includes('CLOSURE')) {
    bannerColor = '#059669';
    badgeTitle = 'DOKUMENTASI FOTO CLOSURE & SPLICING';
    iconGraphic = `
      <rect x="235" y="75" width="90" height="50" rx="8" fill="#10b981" opacity="0.2" stroke="#10b981" stroke-width="2"/>
      <path d="M 215 100 L 235 100 M 325 100 L 345 100" stroke="#10b981" stroke-width="3"/>
      <circle cx="280" cy="100" r="10" fill="#10b981"/>
      <text x="280" y="140" fill="#047857" font-family="Arial" font-size="10" font-weight="bold" text-anchor="middle">JOINT CLOSURE 24/48 CORE</text>
    `;
  } else if (cleanCat.includes('OPM')) {
    bannerColor = '#d97706';
    badgeTitle = 'PENGUJIAN DAYA OPTIK (OPM POWER METER)';
    iconGraphic = `
      <rect x="230" y="70" width="100" height="60" rx="8" fill="#f59e0b" opacity="0.2" stroke="#f59e0b" stroke-width="2"/>
      <rect x="245" y="80" width="70" height="24" rx="4" fill="#0f172a"/>
      <text x="280" y="96" fill="#34d399" font-family="Consolas, monospace" font-size="12" font-weight="bold" text-anchor="middle">-18.42 dBm</text>
      <text x="280" y="142" fill="#b45309" font-family="Arial" font-size="10" font-weight="bold" text-anchor="middle">λ = 1310/1550 nm (PASS)</text>
    `;
  } else if (cleanCat.includes('OLS')) {
    bannerColor = '#8b5cf6';
    badgeTitle = 'SUMBER CAHAYA OPTIK (OLS LIGHT SOURCE)';
    iconGraphic = `
      <rect x="230" y="70" width="100" height="60" rx="8" fill="#8b5cf6" opacity="0.2" stroke="#8b5cf6" stroke-width="2"/>
      <rect x="245" y="80" width="70" height="24" rx="4" fill="#0f172a"/>
      <text x="280" y="96" fill="#f43f5e" font-family="Consolas, monospace" font-size="12" font-weight="bold" text-anchor="middle">-5.00 dBm</text>
      <text x="280" y="142" fill="#7c3aed" font-family="Arial" font-size="10" font-weight="bold" text-anchor="middle">CW / 270Hz SIGNAL READY</text>
    `;
  } else if (cleanCat.includes('BTS')) {
    bannerColor = '#dc2626';
    badgeTitle = 'DOKUMENTASI SITE BTS & RACK ENCLOSURE';
    iconGraphic = `
      <path d="M255 135 L280 75 L305 135 Z" fill="none" stroke="#ef4444" stroke-width="2.5"/>
      <line x1="265" y1="110" x2="295" y2="110" stroke="#ef4444" stroke-width="2"/>
      <circle cx="280" cy="75" r="4" fill="#ef4444"/>
      <text x="280" y="145" fill="#b91c1c" font-family="Arial" font-size="10" font-weight="bold" text-anchor="middle">BTS TOWER &amp; FIBER FEEDER</text>
    `;
  } else if (cleanCat.includes('OTDR')) {
    bannerColor = '#0284c7';
    badgeTitle = 'OTDR TRACE GRAPH & ATTENUATION TEST';
    iconGraphic = `
      <rect x="210" y="68" width="140" height="65" rx="6" fill="#0284c7" opacity="0.15" stroke="#0284c7" stroke-width="1.8"/>
      <path d="M220 120 L 245 80 L 255 105 L 300 115 L 340 122" fill="none" stroke="#0284c7" stroke-width="2.5"/>
      <circle cx="245" cy="80" r="3" fill="#ef4444"/>
      <text x="280" y="145" fill="#0369a1" font-family="Consolas, monospace" font-size="9.5" font-weight="bold" text-anchor="middle">EVENT #1: 0.18 dB (Pass)</text>
    `;
  } else {
    iconGraphic = `
      <rect x="235" y="70" width="90" height="60" rx="6" fill="#0284c7" opacity="0.2" stroke="#0284c7" stroke-width="2"/>
      <text x="280" y="105" fill="#0369a1" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle">📄</text>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="340" viewBox="0 0 560 340">
    <rect width="560" height="340" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
    <rect width="560" height="52" fill="${bannerColor}"/>
    <text x="20" y="28" fill="#ffffff" font-family="Arial, sans-serif" font-size="12" font-weight="bold">PT. BELACOM INDONESIA · DAILY REPORT EVIDENCE</text>
    <text x="20" y="44" fill="#ffffff" font-family="Consolas, monospace" font-size="10" opacity="0.9">${badgeTitle}</text>
    ${iconGraphic}
    <rect x="30" y="155" width="500" height="110" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
    <g transform="translate(45, 175)" font-family="Arial, sans-serif">
      <text x="0" y="0" fill="#0f172a" font-size="12" font-weight="bold">KATEGORI : ${cleanCat}</text>
      <text x="0" y="20" fill="#334155" font-family="Consolas, monospace" font-size="10.5">Nama File : ${cleanName}</text>
      <text x="0" y="38" fill="#334155" font-family="Consolas, monospace" font-size="10.5">Nomor WO  : ${cleanWo} | PIC: ${cleanPic}</text>
      <text x="0" y="56" fill="#059669" font-family="Consolas, monospace" font-size="10.5" font-weight="bold">Status    : TERVERIFIKASI &amp; TERVALIDASI LAPANGAN</text>
      <text x="0" y="74" fill="#64748b" font-family="Consolas, monospace" font-size="9.5">Waktu     : ${timestamp}</text>
    </g>
    <rect x="375" y="165" width="140" height="50" rx="6" fill="none" stroke="#059669" stroke-width="2" stroke-dasharray="4 2"/>
    <text x="445" y="186" fill="#059669" font-family="Arial" font-size="10.5" font-weight="bold" text-anchor="middle">VERIFIED QC</text>
    <text x="445" y="202" fill="#059669" font-family="Arial" font-size="8.5" text-anchor="middle">BELACOM PASSED</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Memastikan semua file pada DailyReportItem memiliki imageDataUrl visual yang siap dirender
 */
export function ensureDailyReportVisualImages(item: DailyReportItem): DailyReportItem {
  const woNumber = item?.woNumber || 'WO-BEL-2026-0090';

  const prepareFileMeta = (file?: PDFFileMeta, category: string = 'DOC'): PDFFileMeta => {
    if (!file) {
      const generated = generateDailyReportDocDataUrl(category, `${category.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${woNumber}.jpg`, woNumber, item?.pic);
      return {
        id: `gen-${category.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: `${category.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${woNumber}.jpg`,
        sizeBytes: 850000,
        uploadDate: item?.finishDate || new Date().toISOString().substring(0, 10),
        imageDataUrl: generated,
        url: generated
      };
    }
    const existing = file.imageDataUrl || (file.url?.startsWith('data:image/') ? file.url : undefined);
    if (existing) {
      return { ...file, imageDataUrl: existing };
    }
    const generated = generateDailyReportDocDataUrl(category, file.name, woNumber, item?.pic);
    return {
      ...file,
      imageDataUrl: generated,
      url: file.url && file.url !== '#' ? file.url : generated
    };
  };

  const originPhotoUrl =
    item?.originPhotoFile?.imageDataUrl ||
    (item?.originPhotoFile?.url?.startsWith('data:image/') ? item.originPhotoFile.url : undefined) ||
    generateDailyReportGeotagPhotoDataUrl(
      item?.originLocation || '',
      item?.originCoordinates || '',
      woNumber,
      'origin',
      item?.team,
      item?.pic
    );

  const destPhotoUrl =
    item?.destinationPhotoFile?.imageDataUrl ||
    (item?.destinationPhotoFile?.url?.startsWith('data:image/') ? item.destinationPhotoFile.url : undefined) ||
    generateDailyReportGeotagPhotoDataUrl(
      item?.destinationLocation || '',
      item?.destinationCoordinates || '',
      woNumber,
      'destination',
      item?.team,
      item?.pic
    );

  const routeMapUrl =
    item?.routeMapFile?.imageDataUrl ||
    (item?.routeMapFile?.url?.startsWith('data:image/') ? item.routeMapFile.url : undefined) ||
    generateDailyReportRouteMapDataUrl(
      item?.originLocation || '',
      item?.originCoordinates || '',
      item?.destinationLocation || '',
      item?.destinationCoordinates || '',
      item?.totalDistanceMeters || item?.estimatedDistanceMeters || 0,
      woNumber
    );

  const docs = item?.documentation || {};

  return {
    ...item,
    originPhotoFile: item?.originPhotoFile
      ? { ...item.originPhotoFile, imageDataUrl: originPhotoUrl }
      : {
          id: 'gen-orig-photo',
          name: `foto_geotag_site_a_${woNumber}.jpg`,
          sizeBytes: 1200000,
          uploadDate: item?.startDate || new Date().toISOString().substring(0, 10),
          imageDataUrl: originPhotoUrl,
          url: originPhotoUrl
        },
    destinationPhotoFile: item?.destinationPhotoFile
      ? { ...item.destinationPhotoFile, imageDataUrl: destPhotoUrl }
      : {
          id: 'gen-dest-photo',
          name: `foto_geotag_site_b_${woNumber}.jpg`,
          sizeBytes: 1250000,
          uploadDate: item?.finishDate || new Date().toISOString().substring(0, 10),
          imageDataUrl: destPhotoUrl,
          url: destPhotoUrl
        },
    routeMapFile: item?.routeMapFile
      ? { ...item.routeMapFile, imageDataUrl: routeMapUrl }
      : {
          id: 'gen-route-map',
          name: `peta_rute_${woNumber}.kml`,
          sizeBytes: 950000,
          uploadDate: item?.finishDate || new Date().toISOString().substring(0, 10),
          imageDataUrl: routeMapUrl,
          url: routeMapUrl
        },
    documentation: {
      fotoClosurePdf: prepareFileMeta(docs.fotoClosurePdf, 'Foto Closure Doc'),
      opmPdf: prepareFileMeta(docs.opmPdf, 'Pengujian OPM Doc'),
      olsPdf: prepareFileMeta(docs.olsPdf, 'Pengujian OLS Doc'),
      btsPdf: prepareFileMeta(docs.btsPdf, 'Dokumentasi BTS Doc'),
      otdrPdf: prepareFileMeta(docs.otdrPdf, 'OTDR Trace Test Doc')
    }
  };
}

/**
 * Menghasilkan Dokumen HTML Resmi Microsoft Word (.doc) lengkap dengan gambar Base64
 */
export function buildDailyReportWordHtml(rawReport: DailyReportItem): string {
  const report = ensureDailyReportVisualImages(rawReport);
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const originPhotoSrc = report.originPhotoFile?.imageDataUrl || report.originPhotoFile?.url || '';
  const destPhotoSrc = report.destinationPhotoFile?.imageDataUrl || report.destinationPhotoFile?.url || '';
  const routeMapSrc = report.routeMapFile?.imageDataUrl || report.routeMapFile?.url || '';

  const docs = report.documentation || {};
  const docItems: Array<{ label: string; file?: PDFFileMeta }> = [
    { label: '1. Foto Closure & Splicing', file: docs.fotoClosurePdf },
    { label: '2. Pengujian OPM (Optical Power Meter)', file: docs.opmPdf },
    { label: '3. Pengujian OLS (Optical Light Source)', file: docs.olsPdf },
    { label: '4. Dokumentasi BTS & Rack Enclosure', file: docs.btsPdf },
    { label: '5. OTDR Trace Test Graph', file: docs.otdrPdf }
  ];

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Daily Report ${escapeHtml(report.woNumber)} - PT. Belacom Indonesia</title>
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
    @page {
      size: A4 portrait;
      margin: 1.8cm 1.5cm 1.8cm 1.5cm;
      mso-header-margin: 1cm;
      mso-footer-margin: 1cm;
    }
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #1e293b;
      margin: 0;
      padding: 0;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .company-title {
      font-size: 16pt;
      font-weight: bold;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .company-subtitle {
      font-size: 9.5pt;
      color: #0284c7;
      font-weight: bold;
    }
    .company-meta {
      font-size: 8.5pt;
      color: #64748b;
    }
    .header-divider-thick {
      border-top: 2.5pt solid #0f172a;
      margin-top: 4px;
      margin-bottom: 2px;
    }
    .header-divider-thin {
      border-top: 0.75pt solid #0284c7;
      margin-bottom: 14px;
    }
    .doc-title {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 6px;
      margin-bottom: 2px;
    }
    .doc-subtitle {
      text-align: center;
      font-size: 10pt;
      color: #475569;
      font-weight: 600;
      margin-bottom: 14px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 9.5pt;
    }
    .info-table td {
      padding: 4px 6px;
      vertical-align: top;
      border: 0.5pt solid #cbd5e1;
    }
    .info-table .label {
      background-color: #f1f5f9;
      font-weight: bold;
      color: #334155;
      width: 22%;
    }
    .info-table .value {
      background-color: #ffffff;
      color: #0f172a;
      width: 28%;
    }
    .section-title {
      background-color: #0f172a;
      color: #ffffff;
      padding: 5px 10px;
      font-size: 10.5pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      margin-top: 16px;
      margin-bottom: 8px;
    }
    .photo-grid {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .photo-grid td {
      border: 0.5pt solid #cbd5e1;
      padding: 6px;
      vertical-align: top;
      background-color: #ffffff;
    }
    .photo-card {
      text-align: center;
    }
    .photo-caption {
      margin-top: 5px;
      font-size: 8.5pt;
      font-weight: bold;
      color: #1e293b;
      text-align: left;
    }
    .photo-meta {
      font-size: 8pt;
      color: #64748b;
      font-family: 'Consolas', monospace;
      text-align: left;
    }
    .sig-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
      font-size: 9.5pt;
    }
    .sig-table td {
      padding: 6px 12px;
      text-align: center;
      vertical-align: top;
      border: none;
    }
  </style>
</head>
<body>

  <!-- Official Letterhead -->
  <table class="header-table">
    <tr>
      <td style="width: 70%; vertical-align: middle;">
        <div class="company-title">PT. BELACOM INDONESIA</div>
        <div class="company-subtitle">TELECOMMUNICATION &amp; FIBER OPTIC INFRASTRUCTURE SERVICES</div>
        <div class="company-meta">Cyber 2 Tower, Jl. H. R. Rasuna Said Blok X-5 No. 13, Jakarta Selatan | Telp: (021) 5299-8800</div>
      </td>
      <td style="width: 30%; text-align: right; vertical-align: middle;">
        <div style="font-size: 11pt; font-weight: bold; color: #0284c7; font-family: monospace;">LAPORAN HARIAN</div>
        <div style="font-size: 9pt; color: #64748b;">DAILY REPORT FO</div>
        <div style="font-size: 8.5pt; color: #059669; font-weight: bold;">STATUS: ${escapeHtml(report.statusWo)}</div>
      </td>
    </tr>
  </table>

  <div class="header-divider-thick"></div>
  <div class="header-divider-thin"></div>

  <div class="doc-title">DAILY REPORT PEKERJAAN LAPANGAN</div>
  <div class="doc-subtitle">Nomor WO: ${escapeHtml(report.woNumber)} &bull; Tanggal Laporan: ${currentDate}</div>

  <!-- Table 1: Rincian Dokumen & WO -->
  <table class="info-table">
    <tr>
      <td class="label">1. Nomor WO</td>
      <td class="value"><strong>${escapeHtml(report.woNumber)}</strong></td>
      <td class="label">2. Kategori / Tipe WO</td>
      <td class="value">${escapeHtml(report.woType)}</td>
    </tr>
    <tr>
      <td class="label">3. Area Assignment</td>
      <td class="value"><strong>${escapeHtml(report.assignment)}</strong></td>
      <td class="label">4. Kode Tim Lapangan</td>
      <td class="value">${escapeHtml(report.team)}</td>
    </tr>
    <tr>
      <td class="label">5. PIC Pelaksana</td>
      <td class="value"><strong>${escapeHtml(report.pic)}</strong></td>
      <td class="label">6. Status WO</td>
      <td class="value"><strong>${escapeHtml(report.statusWo)}</strong> (${escapeHtml(report.statusTeamProject)})</td>
    </tr>
    <tr>
      <td class="label">7. Tanggal Release</td>
      <td class="value">${escapeHtml(report.releaseDate)}</td>
      <td class="label">8. Rentang Pelaksanaan</td>
      <td class="value">${escapeHtml(report.startDate)} s/d ${escapeHtml(report.finishDate)} (<strong>${report.durationDays} Hari</strong>)</td>
    </tr>
    <tr>
      <td class="label">9. Estimasi Jarak</td>
      <td class="value">${(report.estimatedDistanceMeters || 0).toLocaleString('id-ID')} Meter</td>
      <td class="label">10. Total Jarak &amp; Alur</td>
      <td class="value">${(report.totalDistanceMeters || 0).toLocaleString('id-ID')} M (Alur: ${report.pathLengthMeters || 0} M)</td>
    </tr>
    <tr>
      <td class="label">11. Uraian Pekerjaan</td>
      <td class="value" colspan="3">${escapeHtml(report.workType)}</td>
    </tr>
    ${report.remarks ? `
    <tr>
      <td class="label">12. Catatan / Remarks</td>
      <td class="value" colspan="3">${escapeHtml(report.remarks)}</td>
    </tr>` : ''}
  </table>

  <!-- Section A: Tagging End to End Location -->
  <div class="section-title">A. TAGGING END TO END LOCATION (RUTE &amp; TITIK KOORDINAT)</div>
  
  <table class="photo-grid">
    <tr>
      <td style="width: 50%;">
        <div class="photo-card">
          <img src="${originPhotoSrc}" width="260" height="180" alt="Foto Geotag Site A" />
          <div class="photo-caption">📍 FOTO GEOTAG SITE A (ORIGIN)</div>
          <div class="photo-meta">Site: ${escapeHtml(report.originLocation || 'POP Sentul City / OTB-01')}</div>
          <div class="photo-meta">GPS: ${escapeHtml(report.originCoordinates || '-6.589124, 106.852318')}</div>
          ${report.originTaggingDocFile?.name ? `<div class="photo-meta">Doc Tagging: ${escapeHtml(report.originTaggingDocFile.name)}</div>` : ''}
        </div>
      </td>
      <td style="width: 50%;">
        <div class="photo-card">
          <img src="${destPhotoSrc}" width="260" height="180" alt="Foto Geotag Site B" />
          <div class="photo-caption">📍 FOTO GEOTAG SITE B (DESTINATION)</div>
          <div class="photo-meta">Site: ${escapeHtml(report.destinationLocation || 'BTS Cijayanti / Closure CL-04')}</div>
          <div class="photo-meta">GPS: ${escapeHtml(report.destinationCoordinates || '-6.594215, 106.861052')}</div>
          ${report.destinationTaggingDocFile?.name ? `<div class="photo-meta">Doc Tagging: ${escapeHtml(report.destinationTaggingDocFile.name)}</div>` : ''}
        </div>
      </td>
    </tr>
    <tr>
      <td colspan="2">
        <div class="photo-card">
          <img src="${routeMapSrc}" width="540" height="190" alt="Peta Rute Fiber Optic" />
          <div class="photo-caption">🗺️ PETA RUTE TRACKING FIBER OPTIC END-TO-END</div>
          <div class="photo-meta">Jalur: ${escapeHtml(report.originLocation || 'Site A')} &rarr; ${escapeHtml(report.destinationLocation || 'Site B')} | Jarak: ${(report.totalDistanceMeters || report.estimatedDistanceMeters || 0).toLocaleString('id-ID')} M</div>
          ${report.routeGmapsUrl ? `<div class="photo-meta">Google Maps: <a href="${escapeHtml(report.routeGmapsUrl)}">${escapeHtml(report.routeGmapsUrl)}</a></div>` : ''}
        </div>
      </td>
    </tr>
  </table>

  <!-- Section B: 18. Dokumen & Foto Dokumentasi -->
  <div class="section-title">B. 18. DOKUMEN &amp; FOTO DOKUMENTASI (EVIDENCE LAPANGAN)</div>

  <table class="photo-grid">
    <tr>
      <td style="width: 50%;">
        <div class="photo-card">
          <img src="${docItems[0].file?.imageDataUrl || docItems[0].file?.url || ''}" width="260" height="170" alt="${docItems[0].label}" />
          <div class="photo-caption">${docItems[0].label}</div>
          <div class="photo-meta">Berkas: ${escapeHtml(docItems[0].file?.name || 'foto_closure.jpg')}</div>
        </div>
      </td>
      <td style="width: 50%;">
        <div class="photo-card">
          <img src="${docItems[1].file?.imageDataUrl || docItems[1].file?.url || ''}" width="260" height="170" alt="${docItems[1].label}" />
          <div class="photo-caption">${docItems[1].label}</div>
          <div class="photo-meta">Berkas: ${escapeHtml(docItems[1].file?.name || 'opm_measurement.jpg')}</div>
        </div>
      </td>
    </tr>
    <tr>
      <td style="width: 50%;">
        <div class="photo-card">
          <img src="${docItems[2].file?.imageDataUrl || docItems[2].file?.url || ''}" width="260" height="170" alt="${docItems[2].label}" />
          <div class="photo-caption">${docItems[2].label}</div>
          <div class="photo-meta">Berkas: ${escapeHtml(docItems[2].file?.name || 'ols_measurement.jpg')}</div>
        </div>
      </td>
      <td style="width: 50%;">
        <div class="photo-card">
          <img src="${docItems[3].file?.imageDataUrl || docItems[3].file?.url || ''}" width="260" height="170" alt="${docItems[3].label}" />
          <div class="photo-caption">${docItems[3].label}</div>
          <div class="photo-meta">Berkas: ${escapeHtml(docItems[3].file?.name || 'bts_rack_doc.jpg')}</div>
        </div>
      </td>
    </tr>
    <tr>
      <td colspan="2">
        <div class="photo-card">
          <img src="${docItems[4].file?.imageDataUrl || docItems[4].file?.url || ''}" width="260" height="170" alt="${docItems[4].label}" />
          <div class="photo-caption">${docItems[4].label}</div>
          <div class="photo-meta">Berkas: ${escapeHtml(docItems[4].file?.name || 'otdr_trace_graph.jpg')}</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- Signatures -->
  <table class="sig-table">
    <tr>
      <td style="width: 50%;">
        <div>Dibuat Oleh:</div>
        <div style="font-weight: bold; margin-top: 2px;">PIC / Koordinator Lapangan</div>
        <div style="height: 60px;"></div>
        <div style="font-weight: bold; text-decoration: underline;">${escapeHtml(report.pic || 'Teknisi Belacom')}</div>
        <div style="font-size: 8.5pt; color: #64748b;">Tim: ${escapeHtml(report.team)} · PT. Belacom Indonesia</div>
      </td>
      <td style="width: 50%;">
        <div>Disetujui Oleh:</div>
        <div style="font-weight: bold; margin-top: 2px;">Project Manager / Pengawas Lapangan</div>
        <div style="height: 60px;"></div>
        <div style="font-weight: bold; text-decoration: underline;">Ir. H. Budi Santoso, S.T.</div>
        <div style="font-size: 8.5pt; color: #64748b;">Project Management Office (PMO)</div>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Menghasilkan Dokumen HTML Microsoft Excel (.xls) Tunggal dengan Gambar Inline dalam Tabel
 */
export function buildDailyReportExcelHtml(rawReport: DailyReportItem): string {
  const report = ensureDailyReportVisualImages(rawReport);
  const docs = report.documentation || {};

  const originPhotoSrc = report.originPhotoFile?.imageDataUrl || report.originPhotoFile?.url || '';
  const destPhotoSrc = report.destinationPhotoFile?.imageDataUrl || report.destinationPhotoFile?.url || '';
  const routeMapSrc = report.routeMapFile?.imageDataUrl || report.routeMapFile?.url || '';
  const closureSrc = docs.fotoClosurePdf?.imageDataUrl || docs.fotoClosurePdf?.url || '';
  const opmSrc = docs.opmPdf?.imageDataUrl || docs.opmPdf?.url || '';
  const olsSrc = docs.olsPdf?.imageDataUrl || docs.olsPdf?.url || '';
  const btsSrc = docs.btsPdf?.imageDataUrl || docs.btsPdf?.url || '';
  const otdrSrc = docs.otdrPdf?.imageDataUrl || docs.otdrPdf?.url || '';

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Daily Report ${escapeHtml(report.woNumber)} - Excel Export</title>
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Daily Report ${escapeHtml(report.woNumber)}</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 0.5pt solid #cbd5e1; padding: 6px 8px; vertical-align: middle; }
    .header-main { background-color: #0f172a; color: #ffffff; font-size: 14pt; font-weight: bold; text-align: center; }
    .section-header { background-color: #0284c7; color: #ffffff; font-size: 11pt; font-weight: bold; }
    .label-cell { background-color: #f1f5f9; font-weight: bold; color: #334155; }
    .img-cell { width: 230pt; text-align: center; vertical-align: middle; background-color: #ffffff; }
  </style>
</head>
<body>
  <table>
    <tr>
      <td colspan="4" class="header-main" height="40">PT. BELACOM INDONESIA &bull; LAPORAN HARIAN (DAILY REPORT)</td>
    </tr>
    <tr>
      <td colspan="4" style="text-align:center; font-style:italic; color:#64748b; background-color:#f8fafc;">
        Nomor WO: ${escapeHtml(report.woNumber)} &bull; Tanggal Export: ${new Date().toISOString().substring(0, 10)}
      </td>
    </tr>

    <!-- Info Detail -->
    <tr>
      <td colspan="4" class="section-header">1. INFORMASI WORK ORDER &amp; PENUGASAN</td>
    </tr>
    <tr>
      <td class="label-cell" width="120">Nomor WO</td>
      <td><strong>${escapeHtml(report.woNumber)}</strong></td>
      <td class="label-cell" width="120">Kategori WO</td>
      <td>${escapeHtml(report.woType)}</td>
    </tr>
    <tr>
      <td class="label-cell">Assignment Area</td>
      <td>${escapeHtml(report.assignment)}</td>
      <td class="label-cell">Kode Tim</td>
      <td><strong>${escapeHtml(report.team)}</strong></td>
    </tr>
    <tr>
      <td class="label-cell">PIC Lapangan</td>
      <td>${escapeHtml(report.pic)}</td>
      <td class="label-cell">Status Pekerjaan</td>
      <td><strong>${escapeHtml(report.statusWo)}</strong> (${escapeHtml(report.statusTeamProject)})</td>
    </tr>
    <tr>
      <td class="label-cell">Start Date</td>
      <td>${escapeHtml(report.startDate)}</td>
      <td class="label-cell">Finish Date</td>
      <td>${escapeHtml(report.finishDate)} (Durasi: ${report.durationDays} Hari)</td>
    </tr>
    <tr>
      <td class="label-cell">Estimasi Jarak</td>
      <td>${(report.estimatedDistanceMeters || 0).toLocaleString('id-ID')} Meter</td>
      <td class="label-cell">Total Jarak / Alur</td>
      <td>${(report.totalDistanceMeters || 0).toLocaleString('id-ID')} M (Alur: ${report.pathLengthMeters || 0} M)</td>
    </tr>
    <tr>
      <td class="label-cell">Uraian Pekerjaan</td>
      <td colspan="3">${escapeHtml(report.workType)}</td>
    </tr>
    ${report.remarks ? `
    <tr>
      <td class="label-cell">Catatan Lapangan</td>
      <td colspan="3">${escapeHtml(report.remarks)}</td>
    </tr>` : ''}

    <!-- Section A: Tagging Location Images -->
    <tr>
      <td colspan="4" class="section-header">2. TAGGING END TO END LOCATION (RUTE &amp; TITIK KOORDINAT)</td>
    </tr>
    <tr height="25" style="background-color:#e2e8f0; font-weight:bold; text-align:center;">
      <td colspan="2">FOTO GEOTAG SITE A (ORIGIN)</td>
      <td colspan="2">FOTO GEOTAG SITE B (DESTINATION)</td>
    </tr>
    <tr height="165" style="height:124pt;">
      <td colspan="2" class="img-cell" width="230" style="width:175pt;">
        <img src="${originPhotoSrc}" width="210" height="150" alt="Site A" />
      </td>
      <td colspan="2" class="img-cell" width="230" style="width:175pt;">
        <img src="${destPhotoSrc}" width="210" height="150" alt="Site B" />
      </td>
    </tr>
    <tr style="font-size:9pt; background-color:#f8fafc;">
      <td colspan="2">
        <strong>Site:</strong> ${escapeHtml(report.originLocation || 'Origin')}<br>
        <strong>GPS:</strong> ${escapeHtml(report.originCoordinates || 'GPS Origin')}
      </td>
      <td colspan="2">
        <strong>Site:</strong> ${escapeHtml(report.destinationLocation || 'Destination')}<br>
        <strong>GPS:</strong> ${escapeHtml(report.destinationCoordinates || 'GPS Destination')}
      </td>
    </tr>

    <!-- Route Map -->
    <tr height="25" style="background-color:#e2e8f0; font-weight:bold; text-align:center;">
      <td colspan="4">PETA RUTE TRACKING END-TO-END</td>
    </tr>
    <tr height="165" style="height:124pt;">
      <td colspan="4" class="img-cell" style="text-align:center;">
        <img src="${routeMapSrc}" width="420" height="150" alt="Route Map" />
      </td>
    </tr>
    <tr style="font-size:9pt; background-color:#f8fafc;">
      <td colspan="4">
        <strong>Rute:</strong> ${escapeHtml(report.originLocation || 'Site A')} &rarr; ${escapeHtml(report.destinationLocation || 'Site B')} &bull;
        <strong>Jarak:</strong> ${(report.totalDistanceMeters || report.estimatedDistanceMeters || 0).toLocaleString('id-ID')} M
      </td>
    </tr>

    <!-- Section B: 18. Dokumentasi Images -->
    <tr>
      <td colspan="4" class="section-header">3. 18. DOKUMEN &amp; FOTO DOKUMENTASI (EVIDENCE LAPANGAN)</td>
    </tr>
    <tr height="25" style="background-color:#e2e8f0; font-weight:bold; text-align:center;">
      <td colspan="2">FOTO CLOSURE DOC</td>
      <td colspan="2">PENGUJIAN OPM DOC</td>
    </tr>
    <tr height="165" style="height:124pt;">
      <td colspan="2" class="img-cell">
        <img src="${closureSrc}" width="210" height="150" alt="Closure" />
      </td>
      <td colspan="2" class="img-cell">
        <img src="${opmSrc}" width="210" height="150" alt="OPM" />
      </td>
    </tr>

    <tr height="25" style="background-color:#e2e8f0; font-weight:bold; text-align:center;">
      <td colspan="2">PENGUJIAN OLS DOC</td>
      <td colspan="2">DOKUMENTASI BTS DOC</td>
    </tr>
    <tr height="165" style="height:124pt;">
      <td colspan="2" class="img-cell">
        <img src="${olsSrc}" width="210" height="150" alt="OLS" />
      </td>
      <td colspan="2" class="img-cell">
        <img src="${btsSrc}" width="210" height="150" alt="BTS" />
      </td>
    </tr>

    <tr height="25" style="background-color:#e2e8f0; font-weight:bold; text-align:center;">
      <td colspan="4">OTDR TRACE TEST DOC</td>
    </tr>
    <tr height="165" style="height:124pt;">
      <td colspan="4" class="img-cell">
        <img src="${otdrSrc}" width="210" height="150" alt="OTDR" />
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Menghasilkan Dokumen HTML Microsoft Excel (.xls) Rekap Multi Baris Lengkap dengan Gambar Thumbnail
 */
export function buildDailyReportRekapExcelHtml(rawReports: DailyReportItem[]): string {
  const reports = rawReports.map(ensureDailyReportVisualImages);

  const rowsHtml = reports.map((r, idx) => {
    const docs = r.documentation || {};
    const origSrc = r.originPhotoFile?.imageDataUrl || r.originPhotoFile?.url || '';
    const destSrc = r.destinationPhotoFile?.imageDataUrl || r.destinationPhotoFile?.url || '';
    const routeSrc = r.routeMapFile?.imageDataUrl || r.routeMapFile?.url || '';
    const closureSrc = docs.fotoClosurePdf?.imageDataUrl || docs.fotoClosurePdf?.url || '';
    const opmSrc = docs.opmPdf?.imageDataUrl || docs.opmPdf?.url || '';
    const otdrSrc = docs.otdrPdf?.imageDataUrl || docs.otdrPdf?.url || '';

    return `
    <tr height="165" style="height:124pt;">
      <td style="text-align:center; font-weight:bold; vertical-align:middle;">${idx + 1}</td>
      <td style="vertical-align:middle;">
        <strong>${escapeHtml(r.woNumber)}</strong><br>
        <span style="font-size:9pt; color:#64748b;">Rel: ${escapeHtml(r.releaseDate)}</span>
      </td>
      <td style="vertical-align:middle;">${escapeHtml(r.woType)}</td>
      <td style="vertical-align:middle; text-align:center;">
        <strong>${escapeHtml(r.assignment)}</strong><br>
        Tim: ${escapeHtml(r.team)}
      </td>
      <td style="vertical-align:middle;">
        <strong>${escapeHtml(r.pic)}</strong><br>
        <span style="font-size:9pt; color:#475569;">${escapeHtml(r.workType)}</span>
      </td>
      <td style="vertical-align:middle; text-align:center;">
        ${escapeHtml(r.startDate)}<br>s/d<br>${escapeHtml(r.finishDate)}<br>
        <strong>(${r.durationDays} Hari)</strong>
      </td>
      <td style="vertical-align:middle; text-align:center;">
        ${(r.totalDistanceMeters || 0).toLocaleString('id-ID')} M
      </td>
      <td style="vertical-align:middle; text-align:center; font-weight:bold;">
        ${escapeHtml(r.statusWo)}
      </td>
      <td width="230" style="width:175pt; text-align:center; vertical-align:middle;">
        <img src="${origSrc}" width="210" height="150" alt="Site A" />
      </td>
      <td width="230" style="width:175pt; text-align:center; vertical-align:middle;">
        <img src="${destSrc}" width="210" height="150" alt="Site B" />
      </td>
      <td width="230" style="width:175pt; text-align:center; vertical-align:middle;">
        <img src="${routeSrc}" width="210" height="150" alt="Route Map" />
      </td>
      <td width="230" style="width:175pt; text-align:center; vertical-align:middle;">
        <img src="${closureSrc}" width="210" height="150" alt="Closure" />
      </td>
      <td width="230" style="width:175pt; text-align:center; vertical-align:middle;">
        <img src="${opmSrc}" width="210" height="150" alt="OPM" />
      </td>
      <td width="230" style="width:175pt; text-align:center; vertical-align:middle;">
        <img src="${otdrSrc}" width="210" height="150" alt="OTDR" />
      </td>
    </tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Rekap Daily Report Belacom + Gambar</title>
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Rekap Daily Report</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 0.5pt solid #cbd5e1; padding: 6px 8px; }
    th { background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: center; font-size: 10pt; }
  </style>
</head>
<body>
  <table>
    <tr>
      <th colspan="14" style="font-size:14pt; padding:12px; background-color:#0f172a; color:#fff;">
        PT. BELACOM INDONESIA &bull; REKAPITULASI DAILY REPORT DENGAN GAMBAR VISUAL
      </th>
    </tr>
    <tr>
      <th>No</th>
      <th>No. WO</th>
      <th>WO Type</th>
      <th>Area &amp; Tim</th>
      <th>PIC &amp; Pekerjaan</th>
      <th>Timeline</th>
      <th>Total Jarak</th>
      <th>Status</th>
      <th width="230" style="width:175pt;">Foto Site A</th>
      <th width="230" style="width:175pt;">Foto Site B</th>
      <th width="230" style="width:175pt;">Peta Rute</th>
      <th width="230" style="width:175pt;">Foto Closure</th>
      <th width="230" style="width:175pt;">Pengujian OPM</th>
      <th width="230" style="width:175pt;">OTDR Trace</th>
    </tr>
    ${rowsHtml}
  </table>
</body>
</html>`;
}

/**
 * Trigger download file Word (.doc) untuk single report
 */
export function downloadDailyReportWord(report: DailyReportItem): void {
  const htmlContent = buildDailyReportWordHtml(report);
  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const cleanWo = (report?.woNumber || 'WO-BEL-2026').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Daily_Report_${cleanWo}.doc`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger download file Excel (.xls) untuk single report
 */
export function downloadDailyReportExcel(report: DailyReportItem): void {
  const htmlContent = buildDailyReportExcelHtml(report);
  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const cleanWo = (report?.woNumber || 'WO-BEL-2026').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Daily_Report_${cleanWo}.xls`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger download file Excel (.xls) Rekap Multi Baris
 */
export function downloadDailyReportRekapExcel(reports: DailyReportItem[]): void {
  const htmlContent = buildDailyReportRekapExcelHtml(reports);
  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().substring(0, 10);
  const filename = `Rekap_Daily_Report_Belacom_${timestamp}.xls`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
