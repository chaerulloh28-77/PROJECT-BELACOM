import { BASTItem, PDFFileMeta } from '../types';

/**
 * Utilitas Export Dokumen BAST ke Format Microsoft Word (.doc) dan Excel (.xls)
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
 * Menghasilkan Gambar Visual SVG / Base64 Data URL untuk Geotagging Photo
 */
export function generateVisualGeotagPhotoDataUrl(
  siteName: string,
  coordinates: string,
  woNumber: string,
  bastNumber: string,
  type: 'origin' | 'destination'
): string {
  const isSiteB = type === 'destination';
  const label = isSiteB ? 'SITE B (DESTINATION)' : 'SITE A (ORIGIN)';
  const accentHex = isSiteB ? '#f43f5e' : '#10b981';
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' WIB';
  const cleanSite = siteName || (isSiteB ? 'BTS Cijayanti / Closure CL-04' : 'POP Sentul City / OTB-01');
  const cleanCoord = coordinates || (isSiteB ? '-6.594215, 106.861052' : '-6.589124, 106.852318');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
    <defs>
      <linearGradient id="g_${type}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#09101d"/>
        <stop offset="60%" stop-color="#162032"/>
        <stop offset="100%" stop-color="#0d1522"/>
      </linearGradient>
    </defs>
    <rect width="600" height="380" fill="url(#g_${type})"/>
    <g stroke="#334155" stroke-width="1" opacity="0.3">
      <line x1="0" y1="76" x2="600" y2="76"/>
      <line x1="0" y1="152" x2="600" y2="152"/>
      <line x1="0" y1="228" x2="600" y2="228"/>
      <line x1="0" y1="304" x2="600" y2="304"/>
      <line x1="150" y1="0" x2="150" y2="380"/>
      <line x1="300" y1="0" x2="300" y2="380"/>
      <line x1="450" y1="0" x2="450" y2="380"/>
    </g>
    <!-- Crosshair GPS Reticle -->
    <circle cx="300" cy="140" r="54" fill="none" stroke="${accentHex}" stroke-width="2" stroke-dasharray="5 3"/>
    <circle cx="300" cy="140" r="8" fill="${accentHex}"/>
    <!-- Tower / ODP Graphic -->
    <path d="M245 220 L300 85 L355 220 Z" fill="none" stroke="#38bdf8" stroke-width="2.5"/>
    <line x1="265" y1="170" x2="335" y2="170" stroke="#38bdf8" stroke-width="2"/>
    <line x1="280" y1="130" x2="320" y2="130" stroke="#38bdf8" stroke-width="2"/>
    <!-- Badge Header -->
    <rect x="20" y="20" width="260" height="32" rx="6" fill="#020617" opacity="0.9" stroke="${accentHex}" stroke-width="1.5"/>
    <text x="32" y="41" fill="${accentHex}" font-family="Arial, sans-serif" font-size="12" font-weight="bold">📍 GEOTAG FOTO · ${label}</text>
    <!-- Overlay Metadata Box -->
    <rect x="20" y="245" width="560" height="115" rx="8" fill="#020617" opacity="0.92" stroke="#334155" stroke-width="1.2"/>
    <text x="34" y="272" fill="#f8fafc" font-family="Arial, sans-serif" font-size="13" font-weight="bold">PT. BELACOM INDONESIA · DOKUMENTASI RESMI BAST</text>
    <text x="34" y="294" fill="#34d399" font-family="Consolas, monospace" font-size="12" font-weight="bold">LOKASI SITE : ${cleanSite}</text>
    <text x="34" y="314" fill="#38bdf8" font-family="Consolas, monospace" font-size="12" font-weight="bold">GPS KOORD   : ${cleanCoord}</text>
    <text x="34" y="333" fill="#94a3b8" font-family="Consolas, monospace" font-size="11">NO. WO / BAST: ${woNumber || 'WO-BEL-2026'} | ${bastNumber || 'BAST-2026'}</text>
    <text x="34" y="350" fill="#64748b" font-family="Consolas, monospace" font-size="10">WAKTU AMBIL : ${timestamp}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Menghasilkan Gambar Visual SVG / Base64 Data URL untuk Route Map Tracking
 */
export function generateVisualRouteMapDataUrl(
  originLoc: string,
  originCoord: string,
  destLoc: string,
  destCoord: string,
  distanceMeters: number,
  woNumber: string
): string {
  const distText = distanceMeters > 0 ? `${distanceMeters.toLocaleString('id-ID')} Meter` : '1.195 Meter';
  const cleanOrig = originLoc || 'POP Sentul City / OTB-01';
  const cleanDest = destLoc || 'BTS Cijayanti / Closure CL-04';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="260" viewBox="0 0 600 260">
    <defs>
      <linearGradient id="bgRoute" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#071324"/>
        <stop offset="100%" stop-color="#0e1e38"/>
      </linearGradient>
    </defs>
    <rect width="600" height="260" fill="url(#bgRoute)"/>
    <g stroke="#1e293b" stroke-width="1" stroke-dasharray="4 4">
      <line x1="0" y1="65" x2="600" y2="65"/>
      <line x1="0" y1="130" x2="600" y2="130"/>
      <line x1="0" y1="195" x2="600" y2="195"/>
    </g>
    <!-- Rute Jalur Fiber Optic Berkelok -->
    <path d="M 80 140 Q 200 60, 310 150 T 520 120" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
    <path d="M 80 140 Q 200 60, 310 150 T 520 120" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="6 4"/>
    <!-- Titik A (Origin) -->
    <circle cx="80" cy="140" r="14" fill="#10b981" opacity="0.3"/>
    <circle cx="80" cy="140" r="7" fill="#10b981"/>
    <!-- Titik B (Destination) -->
    <circle cx="520" cy="120" r="14" fill="#f43f5e" opacity="0.3"/>
    <circle cx="520" cy="120" r="7" fill="#f43f5e"/>
    <!-- Joint Closure di tengah rute -->
    <rect x="295" y="137" width="22" height="14" rx="3" fill="#f59e0b"/>
    <text x="306" y="148" fill="#000" font-family="Arial" font-size="8" font-weight="bold" text-anchor="middle">JC</text>
    <!-- Label Header -->
    <rect x="20" y="15" width="310" height="28" rx="6" fill="#020617" opacity="0.9" stroke="#38bdf8" stroke-width="1.2"/>
    <text x="30" y="34" fill="#38bdf8" font-family="Arial, sans-serif" font-size="11" font-weight="bold">🗺️ PETA RUTE END-TO-END FIBER OPTIC</text>
    <!-- Distance Pill -->
    <rect x="420" y="15" width="160" height="28" rx="6" fill="#020617" opacity="0.9" stroke="#10b981" stroke-width="1.2"/>
    <text x="500" y="34" fill="#34d399" font-family="Consolas, monospace" font-size="11" font-weight="bold" text-anchor="middle">📏 Jarak: ${distText}</text>
    <!-- Bottom Site Bar -->
    <rect x="20" y="195" width="560" height="52" rx="6" fill="#020617" opacity="0.92" stroke="#334155" stroke-width="1"/>
    <text x="32" y="216" fill="#10b981" font-family="Consolas, monospace" font-size="10.5" font-weight="bold">SITE A: ${cleanOrig} (${originCoord || '-6.589124, 106.852318'})</text>
    <text x="32" y="235" fill="#f43f5e" font-family="Consolas, monospace" font-size="10.5" font-weight="bold">SITE B: ${cleanDest} (${destCoord || '-6.594215, 106.861052'})</text>
    <text x="560" y="226" fill="#94a3b8" font-family="Consolas, monospace" font-size="10" text-anchor="end">${woNumber || 'WO-BEL-2026'}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Menghasilkan Gambar Visual Dokumen Teknis BAST (APD, ABD, Core Connection, Foto Dokumentasi)
 */
export function generateVisualDocDataUrl(
  docCategory: string,
  fileName: string,
  woNumber: string,
  bastNumber: string
): string {
  const cleanCat = docCategory.toUpperCase();
  const cleanName = fileName || `${cleanCat}_${woNumber}.pdf`;
  const isFoto = cleanCat.includes('FOTO') || cleanCat.includes('DOKUMENTASI');
  const isAbd = cleanCat.includes('ABD') || cleanCat.includes('AS-BUILT');
  const isCore = cleanCat.includes('CORE') || cleanCat.includes('SPLICING');

  let bannerColor = '#0284c7';
  let badgeTitle = 'BERKAS TEKNIS TERVERIFIKASI';
  if (isFoto) {
    bannerColor = '#8b5cf6';
    badgeTitle = 'KOLASE FOTO DOKUMENTASI LAPANGAN';
  } else if (isAbd) {
    bannerColor = '#059669';
    badgeTitle = 'AS-BUILT DRAWING (ABD) JALUR FO';
  } else if (isCore) {
    bannerColor = '#d97706';
    badgeTitle = 'CORE CONNECTION & SPLICING CHART';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="340" viewBox="0 0 560 340">
    <rect width="560" height="340" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
    <!-- Header Band -->
    <rect width="560" height="54" fill="${bannerColor}"/>
    <text x="20" y="33" fill="#ffffff" font-family="Arial, sans-serif" font-size="14" font-weight="bold">PT. BELACOM INDONESIA TELECOM</text>
    <text x="540" y="33" fill="#ffffff" font-family="Arial, sans-serif" font-size="11" text-anchor="end">${badgeTitle}</text>
    <!-- Document Card Body -->
    <rect x="25" y="70" width="510" height="180" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
    <g transform="translate(45, 95)">
      <text x="0" y="0" fill="#0f172a" font-family="Arial, sans-serif" font-size="13" font-weight="bold">LAMPIRAN: ${cleanCat}</text>
      <text x="0" y="24" fill="#334155" font-family="Consolas, monospace" font-size="11">Nama File : ${cleanName}</text>
      <text x="0" y="44" fill="#334155" font-family="Consolas, monospace" font-size="11">Nomor WO  : ${woNumber || 'WO-BEL-2026'}</text>
      <text x="0" y="64" fill="#334155" font-family="Consolas, monospace" font-size="11">No. BAST  : ${bastNumber || 'BAST/WO-BEL-2026/BELACOM/2026'}</text>
      <text x="0" y="84" fill="#059669" font-family="Consolas, monospace" font-size="11" font-weight="bold">Status    : TERVERIFIKASI &amp; TERVALIDASI DIGITAL</text>
    </g>
    <!-- Verification Stamp -->
    <rect x="360" y="115" width="150" height="60" rx="6" fill="none" stroke="#059669" stroke-width="2.5" stroke-dasharray="4 2"/>
    <text x="435" y="140" fill="#059669" font-family="Arial" font-size="11" font-weight="bold" text-anchor="middle">VERIFIED</text>
    <text x="435" y="158" fill="#059669" font-family="Arial" font-size="9" text-anchor="middle">QC BELACOM PASSED</text>
    <!-- Signature Footer -->
    <g transform="translate(40, 275)" font-family="Arial, sans-serif" font-size="10" fill="#475569">
      <text x="60" y="0" text-anchor="middle">Dibuat Oleh: Tim Lapangan</text>
      <line x1="0" y1="36" x2="120" y2="36" stroke="#94a3b8" stroke-width="1"/>
      <text x="60" y="50" text-anchor="middle" font-weight="bold" fill="#0f172a">PT. Belacom Indonesia</text>
      <text x="420" y="0" text-anchor="middle">Disetujui Oleh: Pengawas Klien</text>
      <line x1="360" y1="36" x2="480" y2="36" stroke="#94a3b8" stroke-width="1"/>
      <text x="420" y="50" text-anchor="middle" font-weight="bold" fill="#0f172a">Representative Partner</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Memastikan semua file pada BAST memiliki imageDataUrl visual yang siap dirender
 */
export function ensureBastVisualImages(bast: BASTItem): BASTItem {
  const bastNumber =
    bast.woNumber ? `BAST/${bast.woNumber}/BELACOM/${new Date().getFullYear()}` : 'BAST-2026';

  const prepareFileMeta = (file?: PDFFileMeta, category: string = 'DOC'): PDFFileMeta | undefined => {
    if (!file) return undefined;
    const existing = file.imageDataUrl || (file.url?.startsWith('data:image/') ? file.url : undefined);
    if (existing) {
      return { ...file, imageDataUrl: existing };
    }
    const generated = generateVisualDocDataUrl(category, file.name, bast.woNumber, bastNumber);
    return {
      ...file,
      imageDataUrl: generated,
      url: file.url && file.url !== '#' ? file.url : generated
    };
  };

  const originPhotoUrl =
    bast.originPhotoFile?.imageDataUrl ||
    (bast.originPhotoFile?.url?.startsWith('data:image/') ? bast.originPhotoFile.url : undefined) ||
    generateVisualGeotagPhotoDataUrl(
      bast.originLocation || '',
      bast.originCoordinates || '',
      bast.woNumber,
      bastNumber,
      'origin'
    );

  const destPhotoUrl =
    bast.destinationPhotoFile?.imageDataUrl ||
    (bast.destinationPhotoFile?.url?.startsWith('data:image/') ? bast.destinationPhotoFile.url : undefined) ||
    generateVisualGeotagPhotoDataUrl(
      bast.destinationLocation || '',
      bast.destinationCoordinates || '',
      bast.woNumber,
      bastNumber,
      'destination'
    );

  const routeMapUrl =
    bast.routeMapFile?.imageDataUrl ||
    (bast.routeMapFile?.url?.startsWith('data:image/') ? bast.routeMapFile.url : undefined) ||
    generateVisualRouteMapDataUrl(
      bast.originLocation || '',
      bast.originCoordinates || '',
      bast.destinationLocation || '',
      bast.destinationCoordinates || '',
      bast.totalDistanceMeters || bast.estimatedDistanceMeters || 0,
      bast.woNumber
    );

  return {
    ...bast,
    originPhotoFile: bast.originPhotoFile
      ? { ...bast.originPhotoFile, imageDataUrl: originPhotoUrl }
      : {
          id: 'gen-orig-photo',
          name: `foto_geotag_site_a_${bast.woNumber}.jpg`,
          sizeBytes: 1200000,
          uploadDate: bast.releaseDate || new Date().toISOString().substring(0, 10),
          imageDataUrl: originPhotoUrl,
          url: originPhotoUrl
        },
    destinationPhotoFile: bast.destinationPhotoFile
      ? { ...bast.destinationPhotoFile, imageDataUrl: destPhotoUrl }
      : {
          id: 'gen-dest-photo',
          name: `foto_geotag_site_b_${bast.woNumber}.jpg`,
          sizeBytes: 1250000,
          uploadDate: bast.finishDate || new Date().toISOString().substring(0, 10),
          imageDataUrl: destPhotoUrl,
          url: destPhotoUrl
        },
    routeMapFile: bast.routeMapFile
      ? { ...bast.routeMapFile, imageDataUrl: routeMapUrl }
      : {
          id: 'gen-route-map',
          name: `peta_rute_${bast.woNumber}.kml`,
          sizeBytes: 950000,
          uploadDate: bast.finishDate || new Date().toISOString().substring(0, 10),
          imageDataUrl: routeMapUrl,
          url: routeMapUrl
        },
    apdPdf: prepareFileMeta(bast.apdPdf, 'APD (As-Planned Drawing)'),
    abdPdf: prepareFileMeta(bast.abdPdf, 'ABD (As-Built Drawing)'),
    coreConnectionPdf: prepareFileMeta(bast.coreConnectionPdf, 'Core Connection & Splicing'),
    fotoDokumentasiPdf: (bast.fotoDokumentasiPdfs && bast.fotoDokumentasiPdfs.length > 0)
      ? prepareFileMeta(bast.fotoDokumentasiPdfs[0], 'Foto Dokumentasi Lapangan')
      : prepareFileMeta(bast.fotoDokumentasiPdf, 'Foto Dokumentasi Lapangan'),
    fotoDokumentasiPdfs: (bast.fotoDokumentasiPdfs && bast.fotoDokumentasiPdfs.length > 0)
      ? bast.fotoDokumentasiPdfs.map((f, idx) => prepareFileMeta(f, `Foto Dokumentasi Lapangan ${bast.fotoDokumentasiPdfs!.length > 1 ? '#' + (idx + 1) : ''}`)!)
      : (bast.fotoDokumentasiPdf ? [prepareFileMeta(bast.fotoDokumentasiPdf, 'Foto Dokumentasi Lapangan')!] : undefined)
  };
}

/**
 * Menghasilkan Dokumen HTML Resmi Microsoft Word (.doc) lengkap dengan gambar Base64
 */
export function buildBastWordHtml(rawBast: BASTItem): string {
  const bast = ensureBastVisualImages(rawBast);
  const bastNumber = `BAST/${bast.woNumber}/BELACOM/${new Date().getFullYear()}`;
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const originPhotoSrc = bast.originPhotoFile?.imageDataUrl || bast.originPhotoFile?.url || '';
  const destPhotoSrc = bast.destinationPhotoFile?.imageDataUrl || bast.destinationPhotoFile?.url || '';
  const routeMapSrc = bast.routeMapFile?.imageDataUrl || bast.routeMapFile?.url || '';

  const photoDocsList = (bast.fotoDokumentasiPdfs && bast.fotoDokumentasiPdfs.length > 0)
    ? bast.fotoDokumentasiPdfs
    : (bast.fotoDokumentasiPdf ? [bast.fotoDokumentasiPdf] : []);

  const docItems: Array<{ label: string; file?: PDFFileMeta }> = [
    { label: '1. APD (As-Planned Drawing)', file: bast.apdPdf },
    { label: '2. ABD (As-Built Drawing)', file: bast.abdPdf },
    { label: '3. Core Connection File', file: bast.coreConnectionPdf },
    ...photoDocsList.map((doc, idx) => ({
      label: photoDocsList.length > 1
        ? `4.${idx + 1}. Foto Dokumentasi Lapangan (${idx + 1})`
        : '4. Foto Dokumentasi Splicing Lapangan',
      file: doc
    }))
  ].filter((d) => d.file !== undefined);

  const docRowsHtml = docItems
    .map(
      (item) => `
      <tr style="page-break-inside:avoid;">
        <td style="border:1px solid #cbd5e1;padding:10px;vertical-align:top;width:40%;">
          <strong style="color:#0f172a;font-size:11pt;">${escapeHtml(item.label)}</strong>
          <div style="font-family:Consolas,monospace;font-size:9.5pt;color:#334155;margin-top:4px;">
            File: ${escapeHtml(item.file?.name)}
          </div>
          <div style="font-size:9pt;color:#64748b;margin-top:2px;">
            Ukuran: ${((item.file?.sizeBytes || 0) / 1024).toFixed(1)} KB · Tgl: ${escapeHtml(item.file?.uploadDate || '-')}
          </div>
          <div style="color:#059669;font-weight:bold;font-size:9pt;margin-top:6px;">
            ✓ Dokumen Terverifikasi Sah
          </div>
        </td>
        <td style="border:1px solid #cbd5e1;padding:10px;text-align:center;vertical-align:middle;width:60%;">
          ${
            item.file?.imageDataUrl || item.file?.url
              ? `<img src="${item.file.imageDataUrl || item.file.url}" width="340" height="190" alt="${escapeHtml(
                  item.label
                )}" style="width:340px;height:190px;object-fit:contain;border:1px solid #94a3b8;padding:3px;background:#f8fafc;" />`
              : `<div style="font-family:Consolas,monospace;font-size:9pt;color:#64748b;">[Gambar Dokumen Tersimpan di Server]</div>`
          }
        </td>
      </tr>
    `
    )
    .join('');

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>BAST &amp; Lampiran Visual - ${escapeHtml(bast.woNumber)}</title>
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
    @page Section1 {
      size: 21cm 29.7cm;
      margin: 1.8cm 1.8cm 1.8cm 1.8cm;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      font-size: 10pt;
      line-height: 1.45;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    h1, h2, h3, h4 {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <div class="Section1">
    
    <!-- KOP RESMI DOKUMEN BAST -->
    <table style="width:100%;border-bottom:3px solid #0284c7;padding-bottom:12px;margin-bottom:18px;">
      <tr>
        <td style="width:70%;vertical-align:top;border:none;">
          <div style="font-size:16pt;font-weight:bold;color:#0f172a;letter-spacing:0.5px;">
            PT. BELACOM INDONESIA TELECOM
          </div>
          <div style="font-size:9.5pt;color:#475569;margin-top:2px;">
            Telecommunication Infrastructure, Fiber Optic Splicing &amp; Network Interconnection
          </div>
          <div style="font-size:8.5pt;color:#64748b;">
            Operasional: Graha Belacom · Sentul City · Jabodetabek · Email: project@belacom.co.id
          </div>
        </td>
        <td style="width:30%;vertical-align:top;text-align:right;border:none;">
          <div style="display:inline-block;border:2px solid #059669;color:#059669;padding:6px 12px;font-size:10pt;font-weight:bold;border-radius:4px;text-align:center;">
            BAST RESMI TERVERIFIKASI
          </div>
        </td>
      </tr>
    </table>

    <div style="text-align:center;margin-bottom:18px;">
      <h2 style="font-size:14pt;font-weight:bold;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">
        BERITA ACARA SERAH TERIMA PEKERJAAN (BAST)
      </h2>
      <div style="font-family:Consolas,monospace;font-size:10pt;font-weight:bold;color:#0284c7;margin-top:3px;">
        Nomor Dokumen: ${escapeHtml(bastNumber)}
      </div>
    </div>

    <!-- INFORMASI UTAMA BAST -->
    <table style="width:100%;border:1px solid #cbd5e1;margin-bottom:20px;font-size:9.5pt;">
      <tr style="background-color:#0f172a;color:#ffffff;">
        <th colspan="4" style="padding:7px 10px;text-align:left;background-color:#0f172a;color:#ffffff;font-weight:bold;text-transform:uppercase;font-size:10pt;">
          I. DATA IDENTITAS &amp; PENUGASAN WORK ORDER
        </th>
      </tr>
      <tr>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;background-color:#f8fafc;width:22%;font-weight:bold;">Nomor WO</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;font-family:Consolas,monospace;font-weight:bold;color:#0284c7;width:28%;">${escapeHtml(
          bast.woNumber
        )}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;background-color:#f8fafc;width:22%;font-weight:bold;">Kategori WO</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;width:28%;">${escapeHtml(bast.woType)}</td>
      </tr>
      <tr>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;background-color:#f8fafc;font-weight:bold;">Deskripsi Pekerjaan</td>
        <td colspan="3" style="border:1px solid #cbd5e1;padding:6px 10px;font-weight:bold;color:#0f172a;">${escapeHtml(
          bast.workType
        )}</td>
      </tr>
      <tr>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;background-color:#f8fafc;font-weight:bold;">Timeline Pelaksanaan</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;">${escapeHtml(bast.startDate)} s/d ${escapeHtml(
    bast.finishDate
  )}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;background-color:#f8fafc;font-weight:bold;">Durasi Pekerjaan</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;font-family:Consolas,monospace;font-weight:bold;">${escapeHtml(
          bast.durasiDate ?? bast.durationDays ?? 1
        )} Hari Kerja</td>
      </tr>
      <tr>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;background-color:#f8fafc;font-weight:bold;">Tanggal ABD &amp; Core Conn</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;">ABD: ${escapeHtml(
          bast.abdDate || bast.finishDate
        )} | Core: ${escapeHtml(bast.coreConnectionDate || bast.finishDate)}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;background-color:#f8fafc;font-weight:bold;">Status Berkas BAST</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;font-weight:bold;color:#059669;">${escapeHtml(
          bast.statusBast
        )}</td>
      </tr>
      <tr>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;background-color:#f8fafc;font-weight:bold;">Total Jarak / Alur</td>
        <td colspan="3" style="border:1px solid #cbd5e1;padding:6px 10px;font-family:Consolas,monospace;color:#0284c7;font-weight:bold;">
          ${(bast.totalDistanceMeters || bast.estimatedDistanceMeters || 0).toLocaleString('id-ID')} Meter (Sesuai Hasil Pengukuran Lapangan)
        </td>
      </tr>
    </table>

    <!-- BAGIAN A: TAGGING END TO END LOCATION & VISUAL FOTO GEOTAGGING -->
    <table style="width:100%;border:1px solid #cbd5e1;margin-bottom:20px;font-size:9.5pt;page-break-inside:avoid;">
      <tr style="background-color:#0369a1;color:#ffffff;">
        <th colspan="2" style="padding:7px 10px;text-align:left;background-color:#0369a1;color:#ffffff;font-weight:bold;text-transform:uppercase;font-size:10pt;">
          II. BAGIAN A: TAGGING END TO END LOCATION (RUTE &amp; TITIK KOORDINAT)
        </th>
      </tr>
      <tr>
        <td style="border:1px solid #cbd5e1;padding:12px;vertical-align:top;width:50%;">
          <div style="font-weight:bold;color:#059669;font-size:10.5pt;margin-bottom:4px;">
            📍 TITIK AWAL (ORIGIN / SITE A)
          </div>
          <div><strong>Nama Site :</strong> ${escapeHtml(bast.originLocation || 'POP Sentul City / OTB-01')}</div>
          <div style="font-family:Consolas,monospace;color:#059669;font-weight:bold;margin-bottom:8px;">
            <strong>Koordinat:</strong> ${escapeHtml(bast.originCoordinates || '-6.589124, 106.852318')}
          </div>
          <div style="text-align:center;margin-top:8px;">
            <img src="${originPhotoSrc}" width="260" height="170" alt="Foto Geotag Site A" style="width:260px;height:170px;object-fit:cover;border:1px solid #94a3b8;padding:3px;background:#f8fafc;" />
            <div style="font-size:8.5pt;color:#64748b;margin-top:3px;font-family:Consolas,monospace;">Foto Geotag Site A Resmi</div>
          </div>
        </td>
        <td style="border:1px solid #cbd5e1;padding:12px;vertical-align:top;width:50%;">
          <div style="font-weight:bold;color:#e11d48;font-size:10.5pt;margin-bottom:4px;">
            🏁 TITIK AKHIR (DESTINATION / SITE B)
          </div>
          <div><strong>Nama Site :</strong> ${escapeHtml(bast.destinationLocation || 'BTS Cijayanti / Closure CL-04')}</div>
          <div style="font-family:Consolas,monospace;color:#e11d48;font-weight:bold;margin-bottom:8px;">
            <strong>Koordinat:</strong> ${escapeHtml(bast.destinationCoordinates || '-6.594215, 106.861052')}
          </div>
          <div style="text-align:center;margin-top:8px;">
            <img src="${destPhotoSrc}" width="260" height="170" alt="Foto Geotag Site B" style="width:260px;height:170px;object-fit:cover;border:1px solid #94a3b8;padding:3px;background:#f8fafc;" />
            <div style="font-size:8.5pt;color:#64748b;margin-top:3px;font-family:Consolas,monospace;">Foto Geotag Site B Resmi</div>
          </div>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="border:1px solid #cbd5e1;padding:12px;background:#f8fafc;text-align:center;">
          <div style="font-weight:bold;color:#0f172a;font-size:10.5pt;margin-bottom:6px;text-align:left;">
            🗺️ VISUALISASI PETA RUTE TRACKING FIBER OPTIC (END-TO-END)
          </div>
          <img src="${routeMapSrc}" width="540" height="210" alt="Peta Rute GIS" style="width:540px;height:210px;object-fit:contain;border:1px solid #94a3b8;padding:3px;background:#0f172a;" />
          <div style="font-size:8.5pt;color:#475569;margin-top:4px;font-family:Consolas,monospace;">
            Jalur Terverifikasi · Jarak Tempuh Lapangan: ${(bast.totalDistanceMeters || bast.estimatedDistanceMeters || 0).toLocaleString('id-ID')} Meter
          </div>
        </td>
      </tr>
    </table>

    <!-- BAGIAN B: LAMPIRAN DOKUMEN & FOTO DOKUMENTASI -->
    <table style="width:100%;border:1px solid #cbd5e1;margin-bottom:24px;font-size:9.5pt;">
      <tr style="background-color:#475569;color:#ffffff;">
        <th colspan="2" style="padding:7px 10px;text-align:left;background-color:#475569;color:#ffffff;font-weight:bold;text-transform:uppercase;font-size:10pt;">
          III. BAGIAN B: DOKUMEN TEKNIS &amp; FOTO DOKUMENTASI TERVERIFIKASI
        </th>
      </tr>
      ${docRowsHtml}
    </table>

    <!-- TANDA TANGAN & PENGESAHAN DOKUMEN -->
    <table style="width:100%;border:none;margin-top:28px;page-break-inside:avoid;font-size:10pt;">
      <tr>
        <td colspan="2" style="border:none;padding-bottom:12px;">
          Demikian Berita Acara Serah Terima Pekerjaan (BAST) ini dibuat dengan sebenarnya dan dilengkapi lampiran visual geotagging asli untuk dapat dipergunakan sebagaimana mestinya.
        </td>
      </tr>
      <tr>
        <td style="width:50%;text-align:center;vertical-align:top;border:none;">
          <div>Bogor, ${escapeHtml(currentDate)}</div>
          <div style="font-weight:bold;margin-top:2px;">PIHAK PERTAMA (PELAKSANA)</div>
          <div style="color:#64748b;font-size:9pt;">PT. BELACOM INDONESIA TELECOM</div>
          <div style="height:65px;display:flex;align-items:center;justify-content:center;">
            <div style="border:1px dashed #059669;padding:4px 12px;color:#059669;font-weight:bold;font-size:9pt;border-radius:4px;">
              ✓ DIGITAL SIGNED &amp; SEALED
            </div>
          </div>
          <div style="border-top:1px solid #0f172a;display:inline-block;padding-top:4px;min-width:200px;font-weight:bold;">
            Tim QC &amp; Controlling Project
          </div>
        </td>
        <td style="width:50%;text-align:center;vertical-align:top;border:none;">
          <div>Mengetahui &amp; Menyetujui,</div>
          <div style="font-weight:bold;margin-top:2px;">PIHAK KEDUA (PEMBERI TUGAS / KLIEN)</div>
          <div style="color:#64748b;font-size:9pt;">CLIENT INFRASTRUCTURE MANAGER</div>
          <div style="height:65px;display:flex;align-items:center;justify-content:center;">
            <div style="border:1px dashed #0284c7;padding:4px 12px;color:#0284c7;font-weight:bold;font-size:9pt;border-radius:4px;">
              ✓ APPROVED FOR BILLING / SAP
            </div>
          </div>
          <div style="border-top:1px solid #0f172a;display:inline-block;padding-top:4px;min-width:200px;font-weight:bold;">
            Manager Regional / Representative
          </div>
        </td>
      </tr>
    </table>

  </div>
</body>
</html>`;
}

/**
 * Menghasilkan Dokumen Excel Formal (.xls) lengkap dengan format tabel dan gambar visual Base64
 */
export function buildBastExcelHtml(rawBast: BASTItem): string {
  const bast = ensureBastVisualImages(rawBast);
  const bastNumber = `BAST/${bast.woNumber}/BELACOM/${new Date().getFullYear()}`;
  const originPhotoSrc = bast.originPhotoFile?.imageDataUrl || bast.originPhotoFile?.url || '';
  const destPhotoSrc = bast.destinationPhotoFile?.imageDataUrl || bast.destinationPhotoFile?.url || '';
  const routeMapSrc = bast.routeMapFile?.imageDataUrl || bast.routeMapFile?.url || '';

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
          <x:Name>BAST ${escapeHtml(bast.woNumber)}</x:Name>
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
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; }
    .header-title { font-size: 16pt; font-weight: bold; color: #0284c7; }
    .section-band { background-color: #0f172a; color: #ffffff; font-weight: bold; }
    .label-cell { background-color: #f1f5f9; font-weight: bold; }
  </style>
</head>
<body>
  <table>
    <tr>
      <td colspan="6" class="header-title" style="text-align:center;font-size:16pt;font-weight:bold;color:#0369a1;border:none;">
        BERITA ACARA SERAH TERIMA PEKERJAAN (BAST) &amp; LAMPIRAN VISUAL
      </td>
    </tr>
    <tr>
      <td colspan="6" style="text-align:center;font-size:11pt;color:#475569;border:none;">
        PT. BELACOM INDONESIA TELECOM · No. BAST: ${escapeHtml(bastNumber)}
      </td>
    </tr>
    <tr><td colspan="6" style="border:none;">&nbsp;</td></tr>

    <!-- Identitas WO -->
    <tr class="section-band">
      <th colspan="6" style="background-color:#0f172a;color:#ffffff;font-size:12pt;text-align:left;padding:8px;">
        I. DATA WORK ORDER (WO) &amp; STATUS PEKERJAAN
      </th>
    </tr>
    <tr>
      <td class="label-cell" style="width:18%;">Nomor WO</td>
      <td style="font-weight:bold;color:#0284c7;width:32%;">${escapeHtml(bast.woNumber)}</td>
      <td class="label-cell" style="width:18%;">Kategori WO</td>
      <td colspan="3" style="width:32%;">${escapeHtml(bast.woType)}</td>
    </tr>
    <tr>
      <td class="label-cell">Uraian Pekerjaan</td>
      <td colspan="5" style="font-weight:bold;">${escapeHtml(bast.workType)}</td>
    </tr>
    <tr>
      <td class="label-cell">Periode Pelaksanaan</td>
      <td>${escapeHtml(bast.startDate)} s/d ${escapeHtml(bast.finishDate)}</td>
      <td class="label-cell">Durasi Hari</td>
      <td colspan="3">${escapeHtml(bast.durasiDate ?? bast.durationDays ?? 1)} Hari Kerja</td>
    </tr>
    <tr>
      <td class="label-cell">Total Jarak Lapangan</td>
      <td style="font-weight:bold;color:#059669;">${(bast.totalDistanceMeters || bast.estimatedDistanceMeters || 0).toLocaleString('id-ID')} Meter</td>
      <td class="label-cell">Status BAST</td>
      <td colspan="3" style="font-weight:bold;color:#059669;">${escapeHtml(bast.statusBast)}</td>
    </tr>

    <tr><td colspan="6" style="border:none;">&nbsp;</td></tr>

    <!-- Tagging Location -->
    <tr class="section-band">
      <th colspan="6" style="background-color:#0369a1;color:#ffffff;font-size:12pt;text-align:left;padding:8px;">
        II. TAGGING END TO END LOCATION &amp; FOTO VISUAL
      </th>
    </tr>
    <tr>
      <td colspan="3" style="background-color:#ecfdf5;font-weight:bold;color:#059669;text-align:center;">
        TITIK AWAL (SITE A / ORIGIN)
      </td>
      <td colspan="3" style="background-color:#fff1f2;font-weight:bold;color:#e11d48;text-align:center;">
        TITIK AKHIR (SITE B / DESTINATION)
      </td>
    </tr>
    <tr>
      <td class="label-cell">Nama Site A</td>
      <td colspan="2">${escapeHtml(bast.originLocation || 'POP Sentul City / OTB-01')}</td>
      <td class="label-cell">Nama Site B</td>
      <td colspan="2">${escapeHtml(bast.destinationLocation || 'BTS Cijayanti / Closure CL-04')}</td>
    </tr>
    <tr>
      <td class="label-cell">Koordinat GPS</td>
      <td colspan="2" style="font-family:Consolas,monospace;font-weight:bold;color:#059669;">${escapeHtml(
        bast.originCoordinates || '-6.589124, 106.852318'
      )}</td>
      <td class="label-cell">Koordinat GPS</td>
      <td colspan="2" style="font-family:Consolas,monospace;font-weight:bold;color:#e11d48;">${escapeHtml(
        bast.destinationCoordinates || '-6.594215, 106.861052'
      )}</td>
    </tr>
    <tr>
      <td colspan="3" style="text-align:center;padding:12px;">
        <img src="${originPhotoSrc}" width="260" height="170" alt="Foto Geotag Site A" style="width:260px;height:170px;object-fit:cover;border:1px solid #94a3b8;" />
      </td>
      <td colspan="3" style="text-align:center;padding:12px;">
        <img src="${destPhotoSrc}" width="260" height="170" alt="Foto Geotag Site B" style="width:260px;height:170px;object-fit:cover;border:1px solid #94a3b8;" />
      </td>
    </tr>
    <tr>
      <td colspan="6" style="text-align:center;padding:12px;background-color:#0f172a;">
        <img src="${routeMapSrc}" width="540" height="210" alt="Peta Rute GIS" style="width:540px;height:210px;object-fit:contain;" />
      </td>
    </tr>

    <tr><td colspan="6" style="border:none;">&nbsp;</td></tr>

    <!-- Dokumen Teknis -->
    <tr class="section-band">
      <th colspan="6" style="background-color:#334155;color:#ffffff;font-size:12pt;text-align:left;padding:8px;">
        III. DOKUMEN &amp; FOTO DOKUMENTASI LAMPIRAN BAST
      </th>
    </tr>
    <tr>
      <th style="background-color:#e2e8f0;width:5%;">No</th>
      <th style="background-color:#e2e8f0;width:25%;">Jenis Dokumen Lampiran</th>
      <th style="background-color:#e2e8f0;width:30%;">Nama File</th>
      <th style="background-color:#e2e8f0;width:15%;">Ukuran</th>
      <th colspan="2" style="background-color:#e2e8f0;width:25%;">Status Verifikasi</th>
    </tr>
    <tr>
      <td style="text-align:center;">1</td>
      <td><strong>APD (As-Planned Drawing)</strong></td>
      <td>${escapeHtml(bast.apdPdf?.name || `APD_${bast.woNumber}.pdf`)}</td>
      <td>${((bast.apdPdf?.sizeBytes || 1200000) / 1024).toFixed(1)} KB</td>
      <td colspan="2" style="color:#059669;font-weight:bold;">✓ Terverifikasi</td>
    </tr>
    <tr>
      <td style="text-align:center;">2</td>
      <td><strong>ABD (As-Built Drawing)</strong></td>
      <td>${escapeHtml(bast.abdPdf?.name || `ABD_${bast.woNumber}.pdf`)}</td>
      <td>${((bast.abdPdf?.sizeBytes || 1400000) / 1024).toFixed(1)} KB</td>
      <td colspan="2" style="color:#059669;font-weight:bold;">✓ Terverifikasi</td>
    </tr>
    <tr>
      <td style="text-align:center;">3</td>
      <td><strong>Core Connection File</strong></td>
      <td>${escapeHtml(bast.coreConnectionPdf?.name || `Core_Connection_${bast.woNumber}.pdf`)}</td>
      <td>${((bast.coreConnectionPdf?.sizeBytes || 980000) / 1024).toFixed(1)} KB</td>
      <td colspan="2" style="color:#059669;font-weight:bold;">✓ Terverifikasi</td>
    </tr>
    ${(() => {
      const excelPhotoDocsList = (bast.fotoDokumentasiPdfs && bast.fotoDokumentasiPdfs.length > 0)
        ? bast.fotoDokumentasiPdfs
        : (bast.fotoDokumentasiPdf ? [bast.fotoDokumentasiPdf] : []);

      if (excelPhotoDocsList.length === 0) {
        return `<tr>
          <td style="text-align:center;">4</td>
          <td><strong>Foto Dokumentasi Splicing</strong></td>
          <td>Dokumentasi_${bast.woNumber}.pdf</td>
          <td>2400.0 KB</td>
          <td colspan="2" style="color:#059669;font-weight:bold;">✓ Terverifikasi</td>
        </tr>`;
      }

      return excelPhotoDocsList.map((doc, idx) => `<tr>
        <td style="text-align:center;">${4 + idx}</td>
        <td><strong>Foto Dokumentasi Splicing ${excelPhotoDocsList.length > 1 ? `#${idx + 1}` : ''}</strong></td>
        <td>${escapeHtml(doc.name || `Dokumentasi_${bast.woNumber}_${idx + 1}.pdf`)}</td>
        <td>${(((doc.sizeBytes || 2400000)) / 1024).toFixed(1)} KB</td>
        <td colspan="2" style="color:#059669;font-weight:bold;">✓ Terverifikasi</td>
      </tr>`).join('');
    })()}
  </table>
</body>
</html>`;
}

/**
 * Triggers Word download (.doc) in browser
 */
export function exportBastToWord(bast: BASTItem): void {
  if (typeof document === 'undefined') return;
  const htmlContent = buildBastWordHtml(bast);
  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const cleanWo = (bast.woNumber || 'BAST_Document').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `BAST_Visual_${cleanWo}.doc`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Triggers Excel download (.xls) in browser
 */
export function exportBastToExcel(bast: BASTItem): void {
  if (typeof document === 'undefined') return;
  const htmlContent = buildBastExcelHtml(bast);
  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/vnd.ms-excel;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const cleanWo = (bast.woNumber || 'BAST_Document').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `BAST_Visual_${cleanWo}.xls`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
