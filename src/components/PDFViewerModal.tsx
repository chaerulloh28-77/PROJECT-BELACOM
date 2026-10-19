import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Lock,
  Calendar,
  Building,
  FileCheck
} from 'lucide-react';
import { PDFFileMeta } from '../types';
import { TouchButton } from './TouchButton';

interface PDFViewerModalProps {
  file: PDFFileMeta | null;
  onClose: () => void;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({ file, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  if (!file) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    let fileUrl = file.url;
    if (!fileUrl || fileUrl === '#') {
      const pdfContent = `%PDF-1.5 %Dokumen Resmi Controlling Project Belacom\n1 0 obj << /Title (${file.name}) /Author (PT Belacom Indonesia Telecom) >> endobj\nxref\n0 1\n0000000000 65535 f\ntrailer << /Root 1 0 R >>\n%%EOF`;
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      fileUrl = URL.createObjectURL(blob);
    }
    element.href = fileUrl;
    element.download = file.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Cetak - ${file.name}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
              .header { border-bottom: 3px solid #0284c7; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
              .title { font-size: 20px; font-weight: bold; color: #0f172a; text-transform: uppercase; }
              .stamp { border: 2px solid #059669; color: #059669; padding: 6px 12px; font-size: 12px; font-weight: bold; border-radius: 6px; text-transform: uppercase; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; padding: 20px; border-radius: 8px; font-size: 13px; margin-bottom: 30px; }
              .doc-body { border: 1px solid #e2e8f0; padding: 30px; min-height: 400px; border-radius: 8px; background: #fff; }
              .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #64748b; border-top: 1fr solid #e2e8f0; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="title">PT. BELACOM INDONESIA TELECOM</div>
                <div style="font-size: 12px; color: #64748b;">Sistem Informasi Controlling Project Telecom</div>
              </div>
              <div class="stamp">TERVERIFIKASI DIGITAL</div>
            </div>
            
            <div class="info-grid">
              <div><strong>Nama Berkas:</strong> ${file.name}</div>
              <div><strong>ID Dokumen:</strong> ${file.id}</div>
              <div><strong>Ukuran File:</strong> ${formatSize(file.sizeBytes)}</div>
              <div><strong>Tanggal Unggah:</strong> ${file.uploadDate}</div>
            </div>

            <div class="doc-body">
              <h3 style="margin-top:0;">DOKUMEN RESMI SERTIFIKASI TELECOM</h3>
              <p>Dokumen ini disahkan secara digital dalam sistem Controlling Project Belacom untuk verifikasi pekerjaan jaringan fiber optic, pengujian OTDR, OPM/OLS, BAST, dan Paket Penagihan Klien.</p>
              <br/><br/>
              <div style="margin-top: 100px; display: flex; justify-content: space-between; text-align: center;">
                <div>
                  <p>Diperiksa Oleh,</p>
                  <br/><br/><br/>
                  <p><strong>Tim Controlling Belacom</strong></p>
                </div>
                <div>
                  <p>Disetujui Oleh,</p>
                  <br/><br/><br/>
                  <p><strong>Manager Infrastructure Klien</strong></p>
                </div>
              </div>
            </div>

            <div class="footer">
              Controlling Project Belacom © 2026 · Hak Cipta Dilindungi
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const isRealPdfUrl = file.url && file.url !== '#' && (file.url.startsWith('blob:') || file.url.startsWith('data:') || file.url.startsWith('http'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
        isFullscreen ? 'w-full h-full max-w-none rounded-none' : 'max-w-4xl w-full max-h-[92vh] h-[85vh]'
      }`}>
        
        {/* Header Modal */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md" title={file.name}>
                  {file.name}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <CheckCircle2 className="w-3 h-3" /> Terverifikasi
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Ukuran: {formatSize(file.sizeBytes)} · ID: {file.id} · Dimuat: {file.uploadDate}
              </p>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Zoom controls */}
            <div className="hidden sm:flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 font-mono text-xs text-slate-300">
              <button
                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
                className="p-1 hover:text-cyan-400 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-bold text-[11px] text-cyan-400">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
                className="p-1 hover:text-cyan-400 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Toggle Fullscreen */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              title={isFullscreen ? 'Kecilkan Window' : 'Layar Penuh'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer ml-1"
              title="Tutup (X)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Document Viewer Workspace */}
        <div className="flex-1 bg-slate-950 overflow-auto p-4 sm:p-6 flex items-center justify-center relative">
          
          <div
            className="transition-transform duration-200 origin-top w-full max-w-3xl flex justify-center"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {isRealPdfUrl ? (
              <iframe
                src={file.url}
                title={file.name}
                className="w-full h-[65vh] rounded-xl border border-slate-800 bg-white shadow-2xl"
              />
            ) : (
              /* Interactive Mock PDF Render Page */
              <div className="w-full bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 border border-slate-200 space-y-6 select-none font-sans text-left">
                
                {/* PDF Header Stamp Lockup */}
                <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
                      <Building className="w-5 h-5 text-cyan-600" />
                      PT. BELACOM INDONESIA TELECOM
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Sistem Controlling Project · Berkas Hasil Pengujian & Lampiran Resmi
                    </p>
                  </div>

                  <div className="px-3 py-1.5 bg-emerald-50 border-2 border-emerald-600 text-emerald-700 rounded-xl text-xs font-mono font-bold tracking-wider uppercase text-center shrink-0 flex items-center gap-1.5 shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Terverifikasi Digital
                  </div>
                </div>

                {/* Info Metadata Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">NAMA BERKAS PDF</span>
                    <strong className="text-slate-900 text-sm block truncate">{file.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">ID SERTIFIKAT DIGITAL</span>
                    <strong className="text-cyan-700 font-bold block">{file.id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">UKURAN BERKAS & HALAMAN</span>
                    <span className="text-slate-800 font-bold block">{formatSize(file.sizeBytes)} ({file.pages || 3} Halaman)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">TANGGAL UNGGAH SYSTEM</span>
                    <span className="text-slate-800 font-bold block">{file.uploadDate}</span>
                  </div>
                </div>

                {/* Simulated Document Content Body */}
                <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/50 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase font-mono border-b border-slate-200 pb-2">
                    <FileCheck className="w-4 h-4 text-cyan-600" /> RINGKASAN VALIDASI TEKNIS TELEKOMUNIKASI
                  </div>

                  <p className="text-xs leading-relaxed text-slate-600">
                    Berkas ini merupakan lampiran terverifikasi sah dalam sistem Controlling Project Belacom. Mengkonfirmasi bahwa pengujian fisik jaringan fiber optic, pengukuran optical power meter (OPM/OLS), sertifikasi OTDR trace, hasil BAST, BOQ, maupun berkas penagihan telah melalui uji integritas parameter operasional.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] font-mono">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <span className="text-slate-400 block text-[9px]">OTDR LOSS ATTENUATION</span>
                      <strong className="text-emerald-600">0.02 dB/km (Nominal Passed)</strong>
                    </div>
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <span className="text-slate-400 block text-[9px]">ENKRIPSI DATA FILE</span>
                      <strong className="text-slate-800">SHA-256 Validated</strong>
                    </div>
                  </div>
                </div>

                {/* Signature Stamps */}
                <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 text-center font-mono text-xs">
                  <div>
                    <p className="text-slate-500 text-[10px]">PENGUJI TERVERIFIKASI</p>
                    <div className="h-12 flex items-center justify-center text-cyan-600 font-bold italic text-sm">
                      Belacom QA Controller
                    </div>
                    <p className="font-bold text-slate-800 text-[11px]">PT. Belacom Indonesia Telecom</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px]">VERIFIKASI CLIENT</p>
                    <div className="h-12 flex items-center justify-center text-emerald-600 font-bold italic text-sm">
                      Signed & Approved
                    </div>
                    <p className="font-bold text-slate-800 text-[11px]">Client Telecom Representative</p>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Footer Actions Modal */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">Dokumen Terenkripsi Belacom Core</span>
          </div>

          <div className="flex items-center gap-2">
            <TouchButton
              variant="secondary"
              size="sm"
              icon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              Cetak Dokumen
            </TouchButton>

            <TouchButton
              variant="primary"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={handleDownload}
              showFingerIcon
            >
              Download Berkas
            </TouchButton>
          </div>
        </div>

      </div>
    </div>
  );
};
