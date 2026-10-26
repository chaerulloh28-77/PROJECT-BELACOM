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
          className="h-11 px-2.5 bg-slate-900/90 hover:bg-slate-800/90 hover:border-cyan-500/50 rounded-xl border border-slate-700/80 flex items-center justify-between gap-2 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {isImageOrVisual && previewImageSrc ? (
              <img
                src={previewImageSrc}
                alt={value.name}
                className="w-7 h-7 rounded-md object-cover border border-slate-700 shrink-0 bg-slate-950"
              />
            ) : (
              <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
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
                fileInputRef.current?.click();
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
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="h-11 px-3 border border-dashed border-slate-700/80 hover:border-cyan-500/60 rounded-xl bg-slate-900/50 hover:bg-slate-800/60 flex items-center justify-center gap-2 text-slate-400 hover:text-cyan-400 transition-all cursor-pointer group"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
          ) : (
            <UploadCloud className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          )}
          <span className="text-xs font-medium tracking-wide">
            {isLoading ? 'Uploading...' : 'Upload here'}
          </span>
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
