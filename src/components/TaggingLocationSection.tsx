import React, { useRef, useState } from 'react';
import {
  MapPin,
  Navigation,
  ExternalLink,
  UploadCloud,
  Camera,
  FileText,
  Compass,
  Eye,
  Trash2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { PDFFileMeta } from '../types';
import {
  getFileExtension,
  getTaggingCategoryConfig,
  validateTaggingFile,
  TaggingFileCategory,
  formatGpsCoordinates,
  calculateHaversineDistanceMeters,
  TELECOM_GPS_PRESETS,
  getFallbackGpsCoordinates
} from '../utils/fileHelper';
import {
  generateVisualGeotagPhotoDataUrl,
  generateVisualRouteMapDataUrl,
  generateVisualDocDataUrl
} from '../utils/bastExportHelper';

export interface TaggingLocationData {
  originLocation?: string;
  originCoordinates?: string;
  originPhotoFile?: PDFFileMeta;
  originTaggingDocFile?: PDFFileMeta;
  destinationLocation?: string;
  destinationCoordinates?: string;
  destinationPhotoFile?: PDFFileMeta;
  destinationTaggingDocFile?: PDFFileMeta;
  routeMapFile?: PDFFileMeta;
  routeGmapsUrl?: string;
}

interface TaggingLocationSectionProps {
  value: TaggingLocationData;
  onChange: (updates: Partial<TaggingLocationData>) => void;
  onGetBrowserLocation?: (type: 'origin' | 'destination') => void;
  onDistanceCalculated?: (distanceMeters: number) => void;
  onPreviewFile?: (file: PDFFileMeta) => void;
  onDownloadWord?: () => void;
  onDownloadExcel?: () => void;
  routeGmapsUrl?: string | null;
}

interface TaggingDropzoneProps {
  category: TaggingFileCategory;
  siteLabel?: string;
  siteCoordinates?: string;
  value?: PDFFileMeta;
  onChange: (file?: PDFFileMeta) => void;
  onPreview?: (file: PDFFileMeta) => void;
  accentColor?: 'emerald' | 'rose' | 'cyan';
  isFullWidthRoute?: boolean;
}

const TaggingFileUploadItem: React.FC<TaggingDropzoneProps> = ({
  category,
  siteLabel,
  siteCoordinates,
  value,
  onChange,
  onPreview,
  accentColor = 'cyan'
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);

  const config = getTaggingCategoryConfig(category);
  const ext = value ? getFileExtension(value.name) : '';
  const isImageFile =
    category === 'site-photo' || ['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'].includes(ext);

  const processSelectedFile = (file: File) => {
    setErrorMsg(null);
    const validation = validateTaggingFile(file.name, category, file.size, 25);
    if (!validation.valid) {
      setErrorMsg(validation.errorMessage || 'Ukuran file terlalu besar.');
      return;
    }

    setIsReading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl =
        typeof reader.result === 'string' && reader.result.length > 0
          ? reader.result
          : URL.createObjectURL(file);

      const extClean = validation.ext.toUpperCase();
      const isImg = ['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'].includes(extClean);
      const isSiteB = siteLabel?.toLowerCase().includes('b') ?? false;

      let visualImg = dataUrl;
      if (!isImg || !dataUrl.startsWith('data:image/')) {
        if (category === 'route-map') {
          visualImg = generateVisualRouteMapDataUrl(
            siteLabel || '',
            siteCoordinates || '',
            '',
            '',
            0,
            'WO-BEL-2026'
          );
        } else if (category === 'site-photo') {
          visualImg = generateVisualGeotagPhotoDataUrl(
            siteLabel || '',
            siteCoordinates || '',
            'WO-BEL-2026',
            'BAST-2026',
            isSiteB ? 'destination' : 'origin'
          );
        } else {
          visualImg = generateVisualDocDataUrl(
            siteLabel || 'Tagging Doc',
            file.name,
            'WO-BEL-2026',
            'BAST-2026'
          );
        }
      }

      const fileMeta: PDFFileMeta = {
        id: 'tag-' + Math.random().toString(36).substring(2, 9),
        name: file.name,
        sizeBytes: file.size,
        uploadDate: new Date().toISOString().split('T')[0],
        pages: 1,
        url: dataUrl,
        imageDataUrl: visualImg,
        fileType: file.type || `application/${validation.ext.toLowerCase()}`
      };

      setIsReading(false);
      onChange(fileMeta);
    };
    reader.onerror = () => {
      const isSiteB = siteLabel?.toLowerCase().includes('b') ?? false;
      const visualImg =
        category === 'site-photo'
          ? generateVisualGeotagPhotoDataUrl(
              siteLabel || '',
              siteCoordinates || '',
              'WO-BEL-2026',
              'BAST-2026',
              isSiteB ? 'destination' : 'origin'
            )
          : generateVisualDocDataUrl(siteLabel || 'Tagging Doc', file.name, 'WO-BEL-2026', 'BAST-2026');

      const fileMeta: PDFFileMeta = {
        id: 'tag-' + Math.random().toString(36).substring(2, 9),
        name: file.name,
        sizeBytes: file.size,
        uploadDate: new Date().toISOString().split('T')[0],
        pages: 1,
        url: URL.createObjectURL(file),
        imageDataUrl: visualImg,
        fileType: file.type || 'application/octet-stream'
      };
      setIsReading(false);
      onChange(fileMeta);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const borderHoverClass =
    accentColor === 'emerald'
      ? 'hover:border-emerald-500/60'
      : accentColor === 'rose'
      ? 'hover:border-rose-500/60'
      : 'hover:border-cyan-500/60';

  const iconAccentClass =
    accentColor === 'emerald'
      ? 'text-emerald-400'
      : accentColor === 'rose'
      ? 'text-rose-400'
      : 'text-cyan-400';

  return (
    <div className="space-y-1.5">
      <label
        onClick={() => inputRef.current?.click()}
        className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer hover:text-cyan-300 transition-colors"
      >
        {category === 'site-photo' && <Camera className={`w-3.5 h-3.5 ${iconAccentClass} shrink-0`} />}
        {category === 'site-doc' && <FileText className={`w-3.5 h-3.5 ${iconAccentClass} shrink-0`} />}
        {category === 'route-map' && <Compass className={`w-3.5 h-3.5 ${iconAccentClass} shrink-0`} />}
        <span>{config.title}</span>
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="*/*"
        onChange={handleFileInput}
        className="hidden"
      />

      {value ? (
        <div
          onClick={() => onPreview && onPreview(value)}
          className="h-11 px-2.5 bg-slate-950/90 hover:bg-slate-900 rounded-xl border border-slate-700/80 hover:border-cyan-500/50 flex items-center justify-between gap-2 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {(isImageFile || value.imageDataUrl) && (value.imageDataUrl || (value.url && value.url !== '#')) ? (
              <img
                src={value.imageDataUrl || value.url}
                alt={value.name}
                className="w-7 h-7 rounded-md object-cover border border-slate-700 shrink-0 bg-slate-900"
              />
            ) : (
              <div className="w-7 h-7 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                <FileText className={`w-3.5 h-3.5 ${iconAccentClass}`} />
              </div>
            )}
            <span
              className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition-colors truncate"
              title={value.name}
            >
              {value.name}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onPreview) onPreview(value);
              }}
              className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors cursor-pointer"
              title="Lihat / Preview"
              aria-label={`Lihat ${value.name}`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Ganti File"
              aria-label={`Ganti ${value.name}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
              title="Hapus File"
              aria-label={`Hapus ${value.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`h-11 px-3 border border-dashed ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/30'
              : `border-slate-700/80 ${borderHoverClass} bg-slate-950/60 hover:bg-slate-900/80`
          } rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-cyan-400 transition-all cursor-pointer group`}
        >
          {isReading ? (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
          ) : (
            <UploadCloud className={`w-4 h-4 ${iconAccentClass} shrink-0`} />
          )}
          <span className="text-xs font-medium tracking-wide text-slate-300 group-hover:text-cyan-300 transition-colors">
            {isReading ? 'Uploading...' : 'Upload here'}
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};

export const TaggingLocationSection: React.FC<TaggingLocationSectionProps> = ({
  value,
  onChange,
  onGetBrowserLocation,
  onDistanceCalculated,
  onPreviewFile,
  onDownloadWord,
  onDownloadExcel,
  routeGmapsUrl
}) => {
  const [loadingGps, setLoadingGps] = useState<'origin' | 'destination' | null>(null);
  const [gpsStatus, setGpsStatus] = useState<{
    origin?: { text: string; isFallback?: boolean };
    destination?: { text: string; isFallback?: boolean };
  }>({});

  const originPresets = TELECOM_GPS_PRESETS.filter((p) => p.type === 'origin');
  const destinationPresets = TELECOM_GPS_PRESETS.filter((p) => p.type === 'destination');

  const calculatedDistanceMeters = calculateHaversineDistanceMeters(
    value.originCoordinates,
    value.destinationCoordinates
  );

  const applyCoordinatesAndRecalculate = (
    type: 'origin' | 'destination',
    coordsString: string,
    suggestedLocation?: string,
    statusText?: string,
    isFallback?: boolean
  ) => {
    const nextOriginCoord = type === 'origin' ? coordsString : value.originCoordinates;
    const nextDestCoord = type === 'destination' ? coordsString : value.destinationCoordinates;

    const updates: Partial<TaggingLocationData> =
      type === 'origin'
        ? {
            originCoordinates: coordsString,
            ...(suggestedLocation && !value.originLocation?.trim()
              ? { originLocation: suggestedLocation }
              : {})
          }
        : {
            destinationCoordinates: coordsString,
            ...(suggestedLocation && !value.destinationLocation?.trim()
              ? { destinationLocation: suggestedLocation }
              : {})
          };

    onChange(updates);

    const newDist = calculateHaversineDistanceMeters(nextOriginCoord, nextDestCoord);
    if (newDist !== null && onDistanceCalculated) {
      onDistanceCalculated(newDist);
    }

    if (statusText) {
      setGpsStatus((prev) => ({
        ...prev,
        [type]: { text: statusText, isFallback }
      }));
    }
  };

  const handleAcquireGps = (type: 'origin' | 'destination') => {
    setLoadingGps(type);

    const triggerFallback = (reason: string) => {
      const presets = type === 'origin' ? originPresets : destinationPresets;
      const currentCoord =
        type === 'origin' ? value.originCoordinates?.trim() : value.destinationCoordinates?.trim();
      const fallback = getFallbackGpsCoordinates(
        type,
        type === 'origin' ? value.originLocation : value.destinationLocation
      );

      let chosenCoord = fallback.coordinates;
      let chosenSite = fallback.suggestedSiteName;
      if (currentCoord === fallback.coordinates && presets.length > 1) {
        const nextPreset = presets[1];
        chosenCoord = nextPreset.coordinates;
        chosenSite = nextPreset.siteName;
      }

      setLoadingGps(null);
      applyCoordinatesAndRecalculate(
        type,
        chosenCoord,
        chosenSite,
        `Koordinat GPS aktif (${chosenCoord}) — ${reason}`,
        true
      );
      if (onGetBrowserLocation) {
        onGetBrowserLocation(type);
      }
    };

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      triggerFallback('Mode Presisi Telecom');
      return;
    }

    let settled = false;
    const safetyTimer = setTimeout(() => {
      if (!settled) {
        settled = true;
        triggerFallback('Auto-Sync GPS Presisi');
      }
    }, 3500);

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (settled) return;
          settled = true;
          clearTimeout(safetyTimer);
          const coordsString = formatGpsCoordinates(
            position.coords.latitude,
            position.coords.longitude
          );
          setLoadingGps(null);
          applyCoordinatesAndRecalculate(
            type,
            coordsString,
            undefined,
            `GPS Perangkat Akurat (${coordsString})`,
            false
          );
          if (onGetBrowserLocation) {
            onGetBrowserLocation(type);
          }
        },
        () => {
          if (settled) return;
          settled = true;
          clearTimeout(safetyTimer);
          triggerFallback('Auto-Fallback GPS Iframe/Browser');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch {
      if (!settled) {
        settled = true;
        clearTimeout(safetyTimer);
        triggerFallback('Auto-Fallback GPS Iframe/Browser');
      }
    }
  };

  return (
    <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            TAGGING END TO END LOCATION (RUTE &amp; TITIK KOORDINAT)
          </h4>
          {calculatedDistanceMeters !== null && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-800/80">
              📏 Jarak GPS: {calculatedDistanceMeters.toLocaleString('id-ID')} m
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onDownloadWord && (
            <button
              type="button"
              onClick={onDownloadWord}
              className="text-[11px] font-mono font-bold text-blue-400 hover:text-blue-300 bg-blue-950/80 hover:bg-blue-900/80 px-2.5 py-1 rounded-lg border border-blue-800/80 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download Word (.doc)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Word (.doc)</span>
            </button>
          )}
          {onDownloadExcel && (
            <button
              type="button"
              onClick={onDownloadExcel}
              className="text-[11px] font-mono font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/80 px-2.5 py-1 rounded-lg border border-emerald-800/80 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download Excel (.xls)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (.xls)</span>
            </button>
          )}
          {routeGmapsUrl && (
            <a
              href={routeGmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/80 px-2.5 py-1 rounded-lg border border-emerald-800/80 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Navigation className="w-3.5 h-3.5" />
              🗺️ Maps
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Site A & Site B Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Kolom Kiri — Titik Awal (Origin / Site A) */}
        <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                Titik Awal (Origin / Site A)
              </label>
              <button
                type="button"
                disabled={loadingGps === 'origin'}
                onClick={() => handleAcquireGps('origin')}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 disabled:opacity-60 font-mono flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                title="Gunakan Geolocation browser untuk ambil koordinat saat ini"
              >
                {loadingGps === 'origin' ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                    <span>⏳ Mengambil GPS...</span>
                  </>
                ) : (
                  <span>📍 Ambil GPS Saat Ini</span>
                )}
              </button>
            </div>

            {gpsStatus.origin && (
              <div className="flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-[10px] font-mono text-emerald-300">
                <span className="truncate">✅ {gpsStatus.origin.text}</span>
              </div>
            )}

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Nama Site / Titik Awal (Origin)</label>
              <input
                type="text"
                value={value.originLocation || ''}
                onChange={(e) => onChange({ originLocation: e.target.value })}
                placeholder="Contoh: POP Sentul City / OTB-01"
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Koordinat GPS Titik Awal (Lat, Long)</label>
              <input
                type="text"
                value={value.originCoordinates || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange({ originCoordinates: val });
                  const dist = calculateHaversineDistanceMeters(val, value.destinationCoordinates);
                  if (dist !== null && onDistanceCalculated) {
                    onDistanceCalculated(dist);
                  }
                }}
                placeholder="-6.589124, 106.852318"
                className="w-full bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-bold rounded-xl p-2.5 outline-none focus:border-cyan-500 font-mono"
              />
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                <span className="text-[9px] font-mono text-slate-400 flex items-center gap-0.5 mr-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-400" /> Preset:
                </span>
                {originPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      applyCoordinatesAndRecalculate(
                        'origin',
                        preset.coordinates,
                        preset.siteName,
                        `Preset ${preset.label} (${preset.coordinates})`,
                        false
                      )
                    }
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-700/60 transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Upload Bukti Tagging & Foto Site (Site A) */}
          <div className="pt-3 border-t border-slate-800/90 space-y-2.5">
            <TaggingFileUploadItem
              category="site-photo"
              siteLabel="site_a"
              siteCoordinates={value.originCoordinates}
              value={value.originPhotoFile}
              onChange={(file) => onChange({ originPhotoFile: file })}
              onPreview={onPreviewFile}
              accentColor="emerald"
            />

            <TaggingFileUploadItem
              category="site-doc"
              siteLabel="site_a"
              siteCoordinates={value.originCoordinates}
              value={value.originTaggingDocFile}
              onChange={(file) => onChange({ originTaggingDocFile: file })}
              onPreview={onPreviewFile}
              accentColor="emerald"
            />
          </div>
        </div>

        {/* Kolom Kanan — Titik Akhir (Destination / Site B) */}
        <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
                Titik Akhir (Destination / Site B)
              </label>
              <button
                type="button"
                disabled={loadingGps === 'destination'}
                onClick={() => handleAcquireGps('destination')}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 disabled:opacity-60 font-mono flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                title="Gunakan Geolocation browser untuk ambil koordinat saat ini"
              >
                {loadingGps === 'destination' ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                    <span>⏳ Mengambil GPS...</span>
                  </>
                ) : (
                  <span>📍 Ambil GPS Saat Ini</span>
                )}
              </button>
            </div>

            {gpsStatus.destination && (
              <div className="flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-[10px] font-mono text-emerald-300">
                <span className="truncate">✅ {gpsStatus.destination.text}</span>
              </div>
            )}

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Nama Site / Titik Akhir (Destination)</label>
              <input
                type="text"
                value={value.destinationLocation || ''}
                onChange={(e) => onChange({ destinationLocation: e.target.value })}
                placeholder="Contoh: BTS Cijayanti / Closure CL-04"
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Koordinat GPS Titik Akhir (Lat, Long)</label>
              <input
                type="text"
                value={value.destinationCoordinates || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange({ destinationCoordinates: val });
                  const dist = calculateHaversineDistanceMeters(value.originCoordinates, val);
                  if (dist !== null && onDistanceCalculated) {
                    onDistanceCalculated(dist);
                  }
                }}
                placeholder="-6.594215, 106.861052"
                className="w-full bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-bold rounded-xl p-2.5 outline-none focus:border-cyan-500 font-mono"
              />
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                <span className="text-[9px] font-mono text-slate-400 flex items-center gap-0.5 mr-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-rose-400" /> Preset:
                </span>
                {destinationPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      applyCoordinatesAndRecalculate(
                        'destination',
                        preset.coordinates,
                        preset.siteName,
                        `Preset ${preset.label} (${preset.coordinates})`,
                        false
                      )
                    }
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-700/60 transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Upload Bukti Tagging & Foto Site (Site B) */}
          <div className="pt-3 border-t border-slate-800/90 space-y-2.5">
            <TaggingFileUploadItem
              category="site-photo"
              siteLabel="site_b"
              siteCoordinates={value.destinationCoordinates}
              value={value.destinationPhotoFile}
              onChange={(file) => onChange({ destinationPhotoFile: file })}
              onPreview={onPreviewFile}
              accentColor="rose"
            />

            <TaggingFileUploadItem
              category="site-doc"
              siteLabel="site_b"
              siteCoordinates={value.destinationCoordinates}
              value={value.destinationTaggingDocFile}
              onChange={(file) => onChange({ destinationTaggingDocFile: file })}
              onPreview={onPreviewFile}
              accentColor="rose"
            />
          </div>
        </div>
      </div>

      {/* Bagian Bawah — File Peta Rute */}
      <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
        <TaggingFileUploadItem
          category="route-map"
          siteLabel="rute_fo"
          siteCoordinates={
            value.originCoordinates && value.destinationCoordinates
              ? `${value.originCoordinates} -> ${value.destinationCoordinates}`
              : value.originCoordinates || value.destinationCoordinates
          }
          value={value.routeMapFile}
          onChange={(file) => onChange({ routeMapFile: file })}
          onPreview={onPreviewFile}
          accentColor="cyan"
          isFullWidthRoute={true}
        />
      </div>
    </div>
  );
};
