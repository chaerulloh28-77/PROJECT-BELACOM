/**
 * Utilitas Generator Visual SVG Base64 untuk Geotagging & Dokumen Lampiran
 * PT Belacom Indonesia Telecom
 */

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
