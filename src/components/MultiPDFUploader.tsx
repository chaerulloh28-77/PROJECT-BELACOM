import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Eye,
  Trash2,
  AlertCircle,
  RefreshCw,
  Loader2,
  FileText,
  Plus,
  Zap
} from 'lucide-react';
import { PDFFileMeta } from '../types';
import { getFileExtension } from '../utils/fileHelper';
import { generateVisualDocDataUrl } from '../utils/bastExportHelper';
import { compressImageFile, isImageFile, formatBytes } from '../utils/fileCompressor';

interface MultiPDFUploaderProps {
  label: string;
  values?: PDFFileMeta[];
  singleValue?: PDFFileMeta;
  onChange: (files: PDFFileMeta[]) => void;
  maxSizeMB?: number;
  required?: boolean;
  onPreview?: (file: PDFFileMeta) => void;
  woNumber?: string;
}

export const MultiPDFUploader: React.FC<MultiPDFUploaderProps> = ({
  label,
  values,
  singleValue,
  onChange,
  maxSizeMB = 100,
  required = false,
  onPreview,
  woNumber = 'WO-BEL-2026'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memproses...');

  // Normalize current file list
  const currentFiles: PDFFileMeta[] =
    values && values.length > 0
      ? values
      : singleValue
      ? [singleValue]
      : [];

  const processSingleFile = async (file: File): Promise<PDFFileMeta> => {
    const isImage = isImageFile(file);
    const isLarge = file.size > 5 * 1024 * 1024;

    if (isImage) {
      setLoadingText(`Mengompresi ${file.name}...`);
      const compressResult = await compressImageFile(file, {
        targetMaxSizeBytes: 850 * 1024,
        maxDimension: 1600,
        quality: 0.8
      });

      return {
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
    }

    // Non-image document with progress tracking for large files
    setLoadingText(isLarge ? 'Memproses berkas besar...' : `Membaca ${file.name}...`);
    await new Promise((resolve) => setTimeout(resolve, 30));

    return new Promise<PDFFileMeta>((resolve) => {
      const reader = new FileReader();

      reader.onprogress = (e) => {
        if (e.lengthComputable && isLarge) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setLoadingText(`Memproses berkas besar... ${percent}%`);
        }
      };

      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        const visualImg = generateVisualDocDataUrl(label, file.name, woNumber, `BAST/${woNumber}/2026`);

        resolve({
          id: 'doc-' + Math.random().toString(36).substring(2, 9),
          name: file.name,
          sizeBytes: file.size,
          uploadDate: new Date().toISOString().split('T')[0],
          pages: 1,
          url: dataUrl || URL.createObjectURL(file),
          fileType: file.type || 'application/octet-stream',
          imageDataUrl: visualImg
        });
      };

      reader.onerror = () => {
        const visualImg = generateVisualDocDataUrl(label, file.name, woNumber, `BAST/${woNumber}/2026`);
        resolve({
          id: 'doc-' + Math.random().toString(36).substring(2, 9),
          name: file.name,
          sizeBytes: file.size,
          uploadDate: new Date().toISOString().split('T')[0],
          pages: 1,
          url: URL.createObjectURL(file),
          fileType: file.type || 'application/octet-stream',
          imageDataUrl: visualImg
        });
      };

      reader.readAsDataURL(file);
    });
  };

  const processFileList = async (fileList: FileList | File[]) => {
    setErrorMsg(null);
    const filesToProcess = Array.from(fileList);
    if (filesToProcess.length === 0) return;

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    for (const file of filesToProcess) {
      if (!isImageFile(file) && file.size > maxSizeBytes) {
        setErrorMsg(`Ukuran berkas melebihi kapasitas maksimal ${maxSizeMB} MB. Silakan pilih berkas yang lebih kecil.`);
        return;
      }
    }

    setIsLoading(true);

    try {
      const newMetas: PDFFileMeta[] = [];
      for (const file of filesToProcess) {
        const meta = await processSingleFile(file);
        newMetas.push(meta);
      }

      setIsLoading(false);
      onChange([...currentFiles, ...newMetas]);
    } catch (err) {
      console.error('Error processing files in MultiPDFUploader:', err);
      setErrorMsg('Gagal memproses beberapa berkas.');
      setIsLoading(false);
    }
  };

  const handleAddFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileList(e.target.files);
    }
    e.target.value = '';
  };

  const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (replacingIndex !== null && e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (!isImageFile(file) && file.size > maxSizeBytes) {
        setErrorMsg(`Ukuran berkas melebihi kapasitas maksimal ${maxSizeMB} MB. Silakan pilih berkas yang lebih kecil.`);
        setReplacingIndex(null);
        e.target.value = '';
        return;
      }

      setIsLoading(true);
      try {
        const updatedMeta = await processSingleFile(file);
        const updatedList = [...currentFiles];
        updatedList[replacingIndex] = updatedMeta;
        setIsLoading(false);
        setReplacingIndex(null);
        onChange(updatedList);
      } catch (err) {
        console.error('Error replacing file:', err);
        setErrorMsg('Gagal mengganti berkas.');
        setIsLoading(false);
        setReplacingIndex(null);
      }
    }
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    const updatedList = currentFiles.filter((_, i) => i !== index);
    onChange(updatedList);
  };

  return (
    <div className="w-full font-sans">
      <div className="flex items-center justify-between mb-1.5">
        <label
          onClick={() => fileInputRef.current?.click()}
          className="block text-xs font-semibold text-slate-300 cursor-pointer hover:text-cyan-300 transition-colors"
          title={`${label} (Kapasitas hingga ${maxSizeMB} MB)`}
        >
          {label} {required && <span className="text-rose-400">*</span>}
          {currentFiles.length > 0 && (
            <span className="ml-2 font-mono text-[10px] text-cyan-400 font-normal">
              ({currentFiles.length} Berkas)
            </span>
          )}
        </label>

        {currentFiles.length > 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[11px] font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/80 hover:bg-cyan-900/80 px-2 py-1 rounded-lg border border-cyan-800/80 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Foto</span>
          </button>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAddFilesChange}
        accept="*/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={replaceInputRef}
        onChange={handleReplaceFileChange}
        accept="*/*"
        className="hidden"
      />

      {/* Uploaded Files List */}
      {currentFiles.length > 0 ? (
        <div className="space-y-2">
          {currentFiles.map((file, index) => {
            const ext = getFileExtension(file.name);
            const isImageOrVisual =
              Boolean(file.imageDataUrl) ||
              ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF', 'SVG'].includes(ext) ||
              (file.url?.startsWith('data:image/') ?? false);

            const previewImageSrc =
              file.imageDataUrl || (file.url?.startsWith('data:image/') ? file.url : undefined);

            const fileSizeFormatted = file.sizeBytes ? formatBytes(file.sizeBytes) : 'Auto';

            return (
              <div
                key={file.id || index}
                onClick={() => onPreview && onPreview(file)}
                className="h-12 px-3 bg-slate-900/90 hover:bg-slate-800/90 hover:border-cyan-500/50 rounded-xl border border-slate-750 flex items-center justify-between gap-2 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                    #{index + 1}
                  </span>

                  {isImageOrVisual && previewImageSrc ? (
                    <img
                      src={previewImageSrc}
                      alt={file.name}
                      className="w-8 h-8 rounded-md object-cover border border-slate-700 shrink-0 bg-slate-950"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-cyan-400" />
                    </div>
                  )}

                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate" title={file.name}>
                      {file.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <span>{fileSizeFormatted}</span>
                      <span>·</span>
                      <span>{file.uploadDate || '2026-10-26'}</span>
                      {file.isCompressed && file.compressionRatio && (
                        <>
                          <span>·</span>
                          <span
                            className="inline-flex items-center gap-0.5 text-emerald-400 font-bold bg-emerald-950/80 px-1 rounded border border-emerald-850"
                            title={`Terkonversi: ${file.compressionRatio}`}
                          >
                            <Zap className="w-2.5 h-2.5" />
                            <span>{file.compressionRatio}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onPreview) onPreview(file);
                    }}
                    className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                    title="Lihat / Preview Foto"
                    aria-label={`Lihat ${file.name}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReplacingIndex(index);
                      replaceInputRef.current?.click();
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Ganti Foto Ini"
                    aria-label={`Ganti ${file.name}`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(index);
                    }}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    title="Hapus Foto Ini"
                    aria-label={`Hapus ${file.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add another file compact button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 px-3 border border-dashed border-slate-700/80 hover:border-cyan-500/60 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 text-xs font-semibold text-cyan-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Foto Dokumentasi Lainnya</span>
          </button>
        </div>
      ) : (
        /* Empty Dropzone */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files) processFileList(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="h-12 px-3 border border-dashed border-slate-700/80 hover:border-cyan-500/60 rounded-xl bg-slate-900/50 hover:bg-slate-800/60 flex items-center justify-center gap-2 text-slate-400 hover:text-cyan-400 transition-all cursor-pointer group"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
              <span className="text-xs font-mono text-cyan-400">{loadingText}</span>
            </div>
          ) : (
            <>
              <UploadCloud className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium tracking-wide">Upload here</span>
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">(Hingga {maxSizeMB} MB)</span>
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
