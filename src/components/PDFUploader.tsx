import React, { useRef, useState } from 'react';
import { FileText, UploadCloud, Eye, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PDFFileMeta } from '../types';

interface PDFUploaderProps {
  label: string;
  value?: PDFFileMeta;
  onChange: (file?: PDFFileMeta) => void;
  maxSizeMB?: number; // Default 4MB for photo docs
  required?: boolean;
  onPreview?: (file: PDFFileMeta) => void;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({
  label,
  value,
  onChange,
  maxSizeMB = 4,
  required = false,
  onPreview
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Format file harus ber-ekstensi PDF!');
      return;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMsg(`Ukuran file melebihi batas maksimal ${maxSizeMB} MB! (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
      return;
    }

    const pdfMeta: PDFFileMeta = {
      id: 'pdf-' + Math.random().toString(36).substring(2, 9),
      name: file.name,
      sizeBytes: file.size,
      uploadDate: new Date().toISOString().split('T')[0],
      pages: Math.floor(Math.random() * 8) + 1,
      url: URL.createObjectURL(file)
    };

    onChange(pdfMeta);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMsg('File harus berupa PDF!');
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setErrorMsg(`Ukuran PDF melebihi ${maxSizeMB} MB!`);
        return;
      }
      const pdfMeta: PDFFileMeta = {
        id: 'pdf-' + Math.random().toString(36).substring(2, 9),
        name: file.name,
        sizeBytes: file.size,
        uploadDate: new Date().toISOString().split('T')[0],
        pages: Math.floor(Math.random() * 5) + 1,
        url: URL.createObjectURL(file)
      };
      onChange(pdfMeta);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const generateDemoPdf = () => {
    setErrorMsg(null);
    const demoMeta: PDFFileMeta = {
      id: 'pdf-' + Math.random().toString(36).substring(2, 9),
      name: `${label.toLowerCase().replace(/\s+/g, '_')}_sampel.pdf`,
      sizeBytes: Math.floor(Math.random() * (maxSizeMB * 0.8 * 1024 * 1024)) + 200000,
      uploadDate: new Date().toISOString().split('T')[0],
      pages: Math.floor(Math.random() * 4) + 1,
      url: '#'
    };
    onChange(demoMeta);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
        <span className="text-[11px] text-slate-500 font-mono">Max: {maxSizeMB} MB (PDF)</span>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,application/pdf"
        className="hidden"
      />

      {value ? (
        <div 
          onClick={() => onPreview && onPreview(value)}
          className="p-3 bg-slate-800/90 hover:bg-slate-750 hover:border-cyan-500/60 rounded-xl border border-cyan-500/30 flex items-center justify-between gap-3 shadow-inner transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg shrink-0 border border-rose-500/20 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors truncate" title={value.name}>
                {value.name}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span>{formatSize(value.sizeBytes)}</span>
                <span>·</span>
                <span>{value.pages || 1} Hal</span>
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3 inline" /> Valid
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onPreview) onPreview(value);
              }}
              className="px-2 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Pratinjau PDF"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pratinjau</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
              title="Hapus PDF"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700/80 hover:border-cyan-500/60 rounded-xl p-3 text-center bg-slate-900/50 hover:bg-slate-850 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-center gap-2 text-slate-400 group-hover:text-cyan-400">
            <UploadCloud className="w-5 h-5 shrink-0" />
            <span className="text-xs font-medium">Klik atau seret file PDF ke sini</span>
          </div>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-[11px] text-slate-500">Format PDF saja</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                generateDemoPdf();
              }}
              className="text-[10px] underline text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
            >
              + Buat Sampel PDF
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-rose-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
