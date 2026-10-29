import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Eye,
  Trash2,
  AlertCircle,
  RefreshCw,
  Loader2,
  FileText
} from 'lucide-react';
import { PDFFileMeta } from '../types';
import { getFileExtension } from '../utils/fileHelper';
import { generateVisualDocDataUrl } from '../utils/bastExportHelper';

interface PDFUploaderProps {
  label: string;
  value?: PDFFileMeta;
  onChange: (file?: PDFFileMeta) => void;
  maxSizeMB?: number;
  required?: boolean;
  onPreview?: (file: PDFFileMeta) => void;
  accept?: string;
  woNumber?: string;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({
  label,
  value,
  onChange,
  maxSizeMB = 25,
  required = false,
  onPreview,
  woNumber = 'WO-BEL-2026'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = (file: File) => {
    setErrorMsg(null);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMsg(`Ukuran file melebihi batas maksimal ${maxSizeMB} MB.`);
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const ext = getFileExtension(file.name);
      const isImg = ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF', 'SVG'].includes(ext);

      const visualImg = isImg && dataUrl
        ? dataUrl
        : generateVisualDocDataUrl(label, file.name, woNumber, `BAST/${woNumber}/2026`);

      const fileMeta: PDFFileMeta = {
        id: 'doc-' + Math.random().toString(36).substring(2, 9),
        name: file.name,
        sizeBytes: file.size,
        uploadDate: new Date().toISOString().split('T')[0],
        pages: Math.floor(Math.random() * 5) + 1,
        url: dataUrl || URL.createObjectURL(file),
        fileType: file.type || 'application/octet-stream',
        imageDataUrl: visualImg
      };

      setIsLoading(false);
      onChange(fileMeta);
    };

    reader.onerror = () => {
      const visualImg = generateVisualDocDataUrl(label, file.name, woNumber, `BAST/${woNumber}/2026`);
      const fileMeta: PDFFileMeta = {
        id: 'doc-' + Math.random().toString(36).substring(2, 9),
        name: file.name,
        sizeBytes: file.size,
        uploadDate: new Date().toISOString().split('T')[0],
        pages: 1,
        url: URL.createObjectURL(file),
        fileType: file.type || 'application/octet-stream',
        imageDataUrl: visualImg
      };
      setIsLoading(false);
      onChange(fileMeta);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMsg(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const ext = value ? getFileExtension(value.name) : '';
  const isImageOrVisual =
    Boolean(value?.imageDataUrl) ||
    ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF', 'SVG'].includes(ext) ||
    (value?.url?.startsWith('data:image/') ?? false);

  const previewImageSrc = value?.imageDataUrl || (value?.url?.startsWith('data:image/') ? value.url : undefined);

  return (
    <div className="w-full font-sans">
      <label
        onClick={() => fileInputRef.current?.click()}
        className="block text-xs font-semibold text-slate-300 mb-1.5 cursor-pointer hover:text-cyan-300 transition-colors truncate"
      >
        {label} {required && <span className="text-rose-400">*</span>}
      </label>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="*/*"
        className="hidden"
      />

      {value ? (
        <div
          onClick={() => onPreview && onPreview(value)}
          className="group relative rounded-2xl border border-slate-700/80 bg-slate-900/90 hover:border-cyan-400/80 transition-all overflow-hidden cursor-pointer shadow-xl p-2.5 flex flex-col gap-2 font-sans"
        >
          {/* Large Preview Container (min-h 220px) */}
          <div className="w-full h-48 sm:h-56 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center relative border border-slate-800/90 shadow-inner group-hover:border-cyan-500/40 transition-colors">
            {previewImageSrc ? (
              <img
                src={previewImageSrc}
                alt={value.name}
                className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-4 text-slate-400 space-y-2">
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400">
                  <FileText className="w-10 h-10" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-300 text-center truncate max-w-xs">
                  {value.name}
                </span>
                <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                  {ext || 'DOKUMEN PDF'}
                </span>
              </div>
            )}

            {/* Hover Fullscreen Lightbox Overlay */}
            <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
              <div className="p-2.5 rounded-full bg-cyan-500 text-slate-950 shadow-glow animate-bounce">
                <Eye className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-xl bg-slate-900/90 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/40 shadow-xl">
                🔍 Klik untuk Buka Foto Ukuran Penuh
              </span>
            </div>
          </div>

          {/* Card Footer Details & Actions */}
          <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
            <div className="overflow-hidden">
              <span
                className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors block truncate font-mono"
                title={value.name}
              >
                {value.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                {value.uploadDate} · {value.sizeBytes ? `${(value.sizeBytes / 1024).toFixed(1)} KB` : 'Dokumen Valid'}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPreview) onPreview(value);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Lihat ukuran penuh"
              >
                <Eye className="w-3.5 h-3.5" /> Full
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                title="Ganti Berkas"
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
                title="Hapus Berkas"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="h-32 sm:h-36 px-4 border-2 border-dashed border-slate-700/80 hover:border-cyan-500/80 rounded-2xl bg-slate-950/60 hover:bg-slate-900/80 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-cyan-400 transition-all cursor-pointer group shadow-inner"
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
              <span className="text-xs font-mono text-cyan-400 font-bold">Memproses Berkas...</span>
            </div>
          ) : (
            <>
              <div className="p-2.5 rounded-xl bg-slate-900 group-hover:bg-cyan-500/10 border border-slate-800 group-hover:border-cyan-500/30 transition-colors text-slate-400 group-hover:text-cyan-400">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-slate-300 group-hover:text-cyan-300 block">
                  Unggah Berkas / Foto {label}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                  Drag & Drop atau Klik (PNG, JPG, WEBP, PDF s/d {maxSizeMB}MB)
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-rose-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
