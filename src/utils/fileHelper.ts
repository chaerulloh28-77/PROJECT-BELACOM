export const getFileExtension = (filename?: string): string => {
  if (!filename) return 'FILE';
  const clean = filename.trim();
  const parts = clean.split('.');
  if (parts.length <= 1) return 'FILE';
  return parts.pop()!.toUpperCase();
};

export interface FileBadgeStyle {
  ext: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  label: string;
}

export const getFileBadgeStyle = (filename?: string): FileBadgeStyle => {
  const ext = getFileExtension(filename);

  switch (ext) {
    case 'PDF':
      return {
        ext: 'PDF',
        bgClass: 'bg-rose-950/80',
        textClass: 'text-rose-400',
        borderClass: 'border-rose-800/80',
        label: 'PDF Document'
      };
    case 'DOC':
    case 'DOCX':
      return {
        ext,
        bgClass: 'bg-blue-950/80',
        textClass: 'text-blue-400',
        borderClass: 'border-blue-800/80',
        label: 'Word Document'
      };
    case 'XLS':
    case 'XLSX':
    case 'CSV':
      return {
        ext,
        bgClass: 'bg-emerald-950/80',
        textClass: 'text-emerald-400',
        borderClass: 'border-emerald-800/80',
        label: 'Excel Spreadsheet'
      };
    case 'JPG':
    case 'JPEG':
    case 'PNG':
    case 'WEBP':
    case 'GIF':
    case 'SVG':
      return {
        ext,
        bgClass: 'bg-purple-950/80',
        textClass: 'text-purple-300',
        borderClass: 'border-purple-800/80',
        label: 'Image File'
      };
    case 'ZIP':
    case 'RAR':
    case '7Z':
    case 'TAR':
      return {
        ext,
        bgClass: 'bg-amber-950/80',
        textClass: 'text-amber-400',
        borderClass: 'border-amber-800/80',
        label: 'Archive Package'
      };
    case 'DWG':
    case 'CAD':
    case 'DXF':
      return {
        ext,
        bgClass: 'bg-cyan-950/80',
        textClass: 'text-cyan-300',
        borderClass: 'border-cyan-800/80',
        label: 'CAD Drawing'
      };
    case 'GPX':
      return {
        ext: 'GPX',
        bgClass: 'bg-teal-950/80',
        textClass: 'text-teal-300',
        borderClass: 'border-teal-800/80',
        label: 'GPS Exchange Track'
      };
    case 'KML':
    case 'KMZ':
      return {
        ext,
        bgClass: 'bg-indigo-950/80',
        textClass: 'text-indigo-300',
        borderClass: 'border-indigo-800/80',
        label: 'Google Earth / GIS Route Map'
      };
    case 'TXT':
    case 'RTF':
      return {
        ext,
        bgClass: 'bg-slate-900',
        textClass: 'text-slate-300',
        borderClass: 'border-slate-700',
        label: 'Text File'
      };
    default:
      return {
        ext,
        bgClass: 'bg-slate-950',
        textClass: 'text-cyan-400',
        borderClass: 'border-slate-800',
        label: `${ext} File`
      };
  }
};

export type TaggingFileCategory = 'site-photo' | 'site-doc' | 'route-map';

export interface TaggingCategoryConfig {
  category: TaggingFileCategory;
  title: string;
  subtitle: string;
  acceptAttr: string;
  allowedExtensions: string[];
  sampleExtensions: string[];
  formatBadgeText: string;
}

export const getTaggingCategoryConfig = (category: TaggingFileCategory): TaggingCategoryConfig => {
  switch (category) {
    case 'site-photo':
      return {
        category: 'site-photo',
        title: 'Foto Geotagging / Site',
        subtitle: '',
        acceptAttr: '*/*',
        allowedExtensions: ['*'],
        sampleExtensions: [],
        formatBadgeText: ''
      };
    case 'site-doc':
      return {
        category: 'site-doc',
        title: 'Dokumen Bukti Tagging',
        subtitle: '',
        acceptAttr: '*/*',
        allowedExtensions: ['*'],
        sampleExtensions: [],
        formatBadgeText: ''
      };
    case 'route-map':
      return {
        category: 'route-map',
        title: 'File Peta Rute',
        subtitle: '',
        acceptAttr: '*/*',
        allowedExtensions: ['*'],
        sampleExtensions: [],
        formatBadgeText: ''
      };
  }
};

export interface TaggingFileValidationResult {
  valid: boolean;
  ext: string;
  allowedExtensions: string[];
  errorMessage?: string;
}

export const validateTaggingFile = (
  filename: string,
  category: TaggingFileCategory,
  sizeBytes?: number,
  maxSizeMB: number = 25
): TaggingFileValidationResult => {
  const config = getTaggingCategoryConfig(category);
  const ext = getFileExtension(filename);

  if (!filename || !filename.trim()) {
    return {
      valid: false,
      ext,
      allowedExtensions: config.allowedExtensions,
      errorMessage: 'Nama file tidak valid.'
    };
  }

  if (typeof sizeBytes === 'number' && sizeBytes > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      ext,
      allowedExtensions: config.allowedExtensions,
      errorMessage: `Ukuran file melebihi batas maksimal ${maxSizeMB} MB! (${(sizeBytes / (1024 * 1024)).toFixed(2)} MB)`
    };
  }

  return {
    valid: true,
    ext,
    allowedExtensions: config.allowedExtensions
  };
};

export interface ParsedCoordinates {
  lat: number;
  lng: number;
}

export const formatGpsCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

export const parseGpsCoordinates = (coordStr?: string): ParsedCoordinates | null => {
  if (!coordStr || !coordStr.trim()) return null;
  const parts = coordStr.split(',').map((s) => s.trim());
  if (parts.length < 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
};

export const calculateHaversineDistanceMeters = (
  originCoord?: string,
  destCoord?: string
): number | null => {
  const orig = parseGpsCoordinates(originCoord);
  const dest = parseGpsCoordinates(destCoord);
  if (!orig || !dest) return null;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(dest.lat - orig.lat);
  const dLng = toRad(dest.lng - orig.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(orig.lat)) *
      Math.cos(toRad(dest.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightMeters = Math.round(R * c);
  return straightMeters;
};

export interface TelecomGpsPreset {
  id: string;
  label: string;
  siteName: string;
  coordinates: string;
  type: 'origin' | 'destination';
}

export const TELECOM_GPS_PRESETS: TelecomGpsPreset[] = [
  {
    id: 'pop-sentul',
    label: 'POP Sentul City',
    siteName: 'POP Sentul City / OTB-01',
    coordinates: '-6.589124, 106.852318',
    type: 'origin'
  },
  {
    id: 'pop-cibinong',
    label: 'POP Cibinong Center',
    siteName: 'POP Cibinong Core / ODF-02',
    coordinates: '-6.481920, 106.854110',
    type: 'origin'
  },
  {
    id: 'pop-tb-simatupang',
    label: 'POP TB Simatupang',
    siteName: 'POP Jabo 1 Simatupang / Rack-A1',
    coordinates: '-6.292415, 106.801542',
    type: 'origin'
  },
  {
    id: 'bts-cijayanti',
    label: 'BTS Cijayanti',
    siteName: 'BTS Cijayanti / Closure CL-04',
    coordinates: '-6.594215, 106.861052',
    type: 'destination'
  },
  {
    id: 'bts-babakan-madang',
    label: 'BTS Babakan Madang',
    siteName: 'BTS Babakan Madang / ODP-12',
    coordinates: '-6.578430, 106.869820',
    type: 'destination'
  },
  {
    id: 'bts-depok-margonda',
    label: 'BTS Margonda Raya',
    siteName: 'BTS Depok Margonda / Closure JB-08',
    coordinates: '-6.372814, 106.831905',
    type: 'destination'
  }
];

export const getFallbackGpsCoordinates = (
  type: 'origin' | 'destination',
  existingSiteName?: string
): { coordinates: string; suggestedSiteName: string } => {
  if (type === 'origin') {
    return {
      coordinates: '-6.589124, 106.852318',
      suggestedSiteName: existingSiteName?.trim() || 'POP Sentul City / OTB-01'
    };
  }
  return {
    coordinates: '-6.594215, 106.861052',
    suggestedSiteName: existingSiteName?.trim() || 'BTS Cijayanti / Closure CL-04'
  };
};

export const createSampleTaggingFileDataUrl = (
  category: TaggingFileCategory,
  ext: string,
  siteLabel: string = 'Site_A',
  coordinates?: string
): string => {
  const cleanExt = ext.toUpperCase();
  const displayCoord = coordinates?.trim() || (siteLabel.toLowerCase().includes('b') ? '-6.594215, 106.861052' : '-6.589124, 106.852318');
  const displaySite = siteLabel.toUpperCase().replace(/_/g, ' ');
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' WIB';

  if (category === 'site-photo' || ['JPG', 'JPEG', 'PNG', 'WEBP'].includes(cleanExt)) {
    const isSiteB = siteLabel.toLowerCase().includes('b');
    const accentHex = isSiteB ? '#f43f5e' : '#10b981';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="55%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#090d16"/>
        </linearGradient>
      </defs>
      <rect width="640" height="400" fill="url(#bg)"/>
      <g stroke="#334155" stroke-width="1" opacity="0.35">
        <line x1="0" y1="80" x2="640" y2="80"/>
        <line x1="0" y1="160" x2="640" y2="160"/>
        <line x1="0" y1="240" x2="640" y2="240"/>
        <line x1="0" y1="320" x2="640" y2="320"/>
        <line x1="160" y1="0" x2="160" y2="400"/>
        <line x1="320" y1="0" x2="320" y2="400"/>
        <line x1="480" y1="0" x2="480" y2="400"/>
      </g>
      <circle cx="320" cy="155" r="58" fill="none" stroke="${accentHex}" stroke-width="2.5" stroke-dasharray="6 4"/>
      <circle cx="320" cy="155" r="10" fill="${accentHex}"/>
      <path d="M260 235 L320 95 L380 235 Z" fill="none" stroke="#38bdf8" stroke-width="3"/>
      <line x1="282" y1="185" x2="358" y2="185" stroke="#38bdf8" stroke-width="2.5"/>
      <rect x="20" y="20" width="235" height="34" rx="8" fill="#020617" opacity="0.85" stroke="${accentHex}" stroke-width="1.5"/>
      <text x="34" y="42" fill="${accentHex}" font-family="monospace" font-size="14" font-weight="bold">GEOTAG VERIFIED · ${cleanExt}</text>
      <rect x="20" y="265" width="600" height="115" rx="12" fill="#020617" opacity="0.9" stroke="#334155" stroke-width="1.5"/>
      <text x="38" y="294" fill="#f8fafc" font-family="monospace" font-size="16" font-weight="bold">PT. BELACOM INDONESIA · BUKTI GEOTAGGING ${displaySite}</text>
      <text x="38" y="320" fill="#34d399" font-family="monospace" font-size="15" font-weight="bold">GPS LAT/LONG : ${displayCoord}</text>
      <text x="38" y="344" fill="#38bdf8" font-family="monospace" font-size="13">TIMESTAMP    : ${timestamp}</text>
      <text x="38" y="365" fill="#94a3b8" font-family="monospace" font-size="12">STATUS       : HIGH-ACCURACY TELECOM SITE TAGGING</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  if (cleanExt === 'GPX') {
    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Belacom Telecom Controlling System">
  <metadata>
    <name>Tagging Track ${displaySite}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <wpt lat="-6.589124" lon="106.852318">
    <name>${displaySite} (${displayCoord})</name>
    <desc>Bukti Pelacakan Koordinat GPS Fiber Optic Belacom</desc>
  </wpt>
</gpx>`;
    return `data:application/gpx+xml;utf8,${encodeURIComponent(gpxContent)}`;
  }

  if (cleanExt === 'KML' || cleanExt === 'KMZ') {
    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Peta Rute End-to-End Fiber Optic (${displaySite})</name>
    <Placemark>
      <name>Jalur Interkoneksi Site A - Site B</name>
      <LineString>
        <coordinates>106.852318,-6.589124,0 106.861052,-6.594215,0</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;
    return `data:application/vnd.google-earth.kml+xml;utf8,${encodeURIComponent(kmlContent)}`;
  }

  // Default for PDF or other docs
  const textContent = `PT. BELACOM INDONESIA TELECOM - DOKUMEN BUKTI TAGGING (${cleanExt})\nLokasi: ${displaySite}\nKoordinat GPS: ${displayCoord}\nWaktu: ${timestamp}`;
  return `data:text/plain;utf8,${encodeURIComponent(textContent)}`;
};

