import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Eye,
  Download,
  Trash2,
  AlertCircle,
  RefreshCw,
  Loader2,
  FileText,
  FileSpreadsheet,
  Zap
} from 'lucide-react';
import { PDFFileMeta } from '../types';
import { getFileExtension, getFileBadgeStyle } from '../utils/fileHelper';
import { generateVisualDocDataUrl } from '../utils/bastExportHelper';
import { compressImageFile, isImageFile, formatBytes } from '../utils/fileCompressor';
import { downloadFileMeta } from '../utils/fileDownloadHelper';

interface PDFUploaderProps {
  label: string;
  value?: PDFFileMeta;
  onChange: (file?: PDFFileMeta) => void;
  maxSizeMB?: number;
  required?: boolean;
  onPreview?: (file: PDFFileMeta) => void;
  accept?: string;
  woNumber?: string;
  placeholderText?: string;
  showCapacityLabel?: boolean;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({
  label,
  value,
  onChange,
  maxSizeMB = 100,
  required = false,
  onPreview,
  accept,
  woNumber = 'WO-BEL-2026',
  placeholderText = 'Upload here',
  showCapacityLabel = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memproses...');

  const processFile = async (file: File) => {
    setErrorMsg(null);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const isImage = isImageFile(file);
    const isLargeFile = file.size > 5 * 1024 * 1024;

    // Format validation if accept filter is specified
    if (accept && accept !== '*/*') {
      const allowed = accept
        .split(',')
        .map(s => s.trim().toLowerCase().replace(/^\./, ''));
      
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const isAllowed = allowed.some(a => {
        if (a === fileExt) return true;
        if ((a === 'jpg' || a === 'jpeg') && (fileExt === 'jpg' || fileExt === 'jpeg')) return true;
        if (a.includes('/') && file.type) {
          if (a === 'image/*' && file.type.startsWith('image/')) return true;
          if (a === file.type) return true;
        }
        return false;
      });

      if (!isAllowed) {
        setErrorMsg(`Format berkas .${fileExt.toUpperCase()} tidak didukung. Format yang diizinkan: ${accept}`);
        return;
      }
    }

    // Jika non-gambar dan melebihi kapasitas maksimal 100 MB, tolak dengan pesan jelas
    if (!isImage && file.size > maxSizeBytes) {
      setErrorMsg(`Ukuran berkas melebihi kapasitas maksimal ${maxSizeMB} MB. Silakan pilih berkas yang lebih kecil.`);
      return;
    }

    setIsLoading(true);
    setLoadingText(
      isImage
        ? 'Mengompresi berkas...'
        : isLargeFile
        ? 'Memproses berkas besar...'
        : 'Membaca dokumen...'
    );

    // Yield singkat agar UI loader ter-render sebelum kalkulasi intensif
    await new Promise((resolve) => setTimeout(resolve, 30));

    try {
      if (isImage) {
        const compressResult = await compressImageFile(file, {
          targetMaxSizeBytes: 850 * 1024,
          maxDimension: 1600,
          quality: 0.8
        });

        const fileMeta: PDFFileMeta = {
          id: 'doc-' + Math.random().toString(36).substring(2, 9),
          name: file.name,
          sizeBytes: compressResult.compressedSizeBytes,
          originalSizeBytes: compressResult.originalSizeBytes,
          isCompressed: compressResult.wasCompressed,
          compressionRatio: compressResult.wasCompressed ? compressResult.compressionRatio : undefined,
          reductionPercent: compressResult.wasCompressed ? compressResult.reductionPercent : undefined,
          uploadDate: new Date().toISOString().split('T')[0],
          pages: 1,
          url: compressResult.dataUrl,
          fileType: compressResult.mimeType,
          imageDataUrl: compressResult.dataUrl
        };

        setIsLoading(false);
        onChange(fileMeta);
      } else {
        const reader = new FileReader();

        reader.onprogress = (e) => {
          if (e.lengthComputable && e.total > 5 * 1024 * 1024) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setLoadingText(`Memproses berkas besar... ${percent}%`);
          }
        };

        reader.onload = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : '';
          const visualImg = generateVisualDocDataUrl(label, file.name, woNumber, `BAST/${woNumber}/2026`);

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
      }
    } catch (err) {
      console.error('Error processing file:', err);
      setErrorMsg('Gagal memproses berkas. Silakan coba kembali.');
      setIsLoading(false);
    }
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
  const badgeStyle = value ? getFileBadgeStyle(value.name) : null;
  const previewImageSrc = value?.imageDataUrl || (value?.url?.startsWith('data:image/') ? value.url : undefined);

  return (
    <div className="w-full font-sans">
      <div className="flex items-center justify-between mb-1.5 h-5">
        <label
          onClick={() => fileInputRef.current?.click()}
          className="block text-xs font-medium text-slate-200 cursor-pointer hover:text-cyan-300 transition-colors truncate"
          title={label}
        >
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
        {showCapacityLabel && (
          <span className="text-[9px] font-mono text-slate-500 hidden sm:inline">
            Maks. {maxSizeMB} MB
          </span>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept || "*/*"}
        className="hidden"
      />

      {value ? (
        <div className="relative rounded-xl border border-slate-700/80 bg-slate-900/90 hover:border-cyan-400/80 transition-all p-2.5 flex flex-col justify-between h-[140px] shadow-lg group font-sans">
          <div 
            onClick={() => onPreview && onPreview(value)}
            className="flex items-start gap-2 cursor-pointer overflow-hidden"
            title="Klik untuk pratinjau"
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${badgeStyle?.bgClass || 'bg-slate-800'} border ${badgeStyle?.borderClass || 'border-slate-700'}`}>
              {['XLS', 'XLSX', 'CSV'].includes(ext) ? (
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              ) : ['DOC', 'DOCX'].includes(ext) ? (
                <FileText className="w-4 h-4 text-blue-400" />
              ) : ['JPG', 'JPEG', 'PNG', 'WEBP'].includes(ext) && previewImageSrc ? (
                <img src={previewImageSrc} alt={value.name} className="w-4 h-4 object-cover rounded" />
              ) : (
                <FileText className="w-4 h-4 text-rose-400" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-mono font-bold text-slate-100 truncate group-hover:text-cyan-300 transition-colors" title={value.name}>
                {value.name}
              </p>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {badgeStyle && (
                  <span className={`px-1 py-0.2 rounded text-[9px] font-bold font-mono leading-tight ${badgeStyle.bgClass} ${badgeStyle.textClass} border ${badgeStyle.borderClass}`}>
                    [{badgeStyle.ext}]
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-mono">
                  {value.sizeBytes ? formatBytes(value.sizeBytes) : ''}
                </span>

                {value.isCompressed && value.compressionRatio && (
                  <span
                    className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/90 px-1 py-0.2 rounded border border-emerald-850 truncate max-w-[110px]"
                    title={`Terkonversi: ${value.compressionRatio} (Hemat ${value.reductionPercent || 0}%)`}
                  >
                    <Zap className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                    <span>{value.compressionRatio}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 mt-auto">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPreview) onPreview(value);
                }}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer transition-colors px-1 py-0.5 rounded hover:bg-cyan-950/60"
                title="Lihat Pratinjau Isi Dokumen"
              >
                <Eye className="w-3 h-3" />
                <span>Lihat</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadFileMeta(value);
                }}
                className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 cursor-pointer transition-colors px-1 py-0.5 rounded hover:bg-emerald-950/60"
                title="Langsung Unduh Berkas Ini"
              >
                <Download className="w-3 h-3" />
                <span>Unduh</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-mono flex items-center gap-0.5 transition-colors cursor-pointer"
                title="Ganti Berkas"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Ganti</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(undefined);
                }}
                className="px-1.5 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-[10px] font-mono flex items-center gap-0.5 transition-colors cursor-pointer"
                title="Hapus Berkas"
              >
                <Trash2 className="w-2.5 h-2.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="h-[140px] p-2.5 border-2 border-dashed border-slate-700/80 hover:border-cyan-500/80 rounded-xl bg-slate-950/60 hover:bg-slate-900/80 flex flex-col items-center justify-center text-center cursor-pointer group shadow-inner transition-all"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-1.5">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              <span className="text-[11px] font-mono text-cyan-400 font-bold text-center px-2">{loadingText}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center w-full px-1">
              <div className="p-2 rounded-xl bg-slate-900 group-hover:bg-cyan-500/10 border border-slate-800 group-hover:border-cyan-500/30 transition-colors text-slate-400 group-hover:text-cyan-400 mb-2">
                <UploadCloud className="w-5 h-5" />
              </div>
              <span className="text-[11px] text-slate-400 group-hover:text-cyan-300 font-medium leading-snug px-1 line-clamp-2 block transition-colors">
                {placeholderText}
              </span>
              {showCapacityLabel && (
                <span className="text-[9px] text-slate-500 font-mono block mt-1">
                  Kapasitas hingga {maxSizeMB} MB
                </span>
              )}
            </div>
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
