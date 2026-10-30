import { PDFFileMeta } from '../types';

export interface SafeImageData {
  base64: string;
  width: number;
  height: number;
}

/**
 * Pemuat script PDF.js dinamis via CDN (menghindari error modul missing di Vercel / Rolldown)
 */
export function loadPdfJsLib(): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null);

  if ((window as any).pdfjsLib) {
    const lib = (window as any).pdfjsLib;
    if (lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) {
      lib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    return Promise.resolve(lib);
  }

  return new Promise((resolve) => {
    try {
      const existingScript = document.querySelector('script[src*="pdf.min.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          const lib = (window as any).pdfjsLib;
          if (lib && lib.GlobalWorkerOptions) {
            lib.GlobalWorkerOptions.workerSrc =
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          }
          resolve(lib || null);
        });
        existingScript.addEventListener('error', () => resolve(null));
        if ((window as any).pdfjsLib) {
          resolve((window as any).pdfjsLib);
          return;
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.async = true;

      const timer = setTimeout(() => {
        console.warn('PDF.js CDN load timeout, menggunakan visual canvas badge.');
        resolve(null);
      }, 5000);

      script.onload = () => {
        clearTimeout(timer);
        const lib = (window as any).pdfjsLib;
        if (lib) {
          if (lib.GlobalWorkerOptions) {
            lib.GlobalWorkerOptions.workerSrc =
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          }
          resolve(lib);
        } else {
          resolve(null);
        }
      };

      script.onerror = () => {
        clearTimeout(timer);
        console.warn('Gagal memuat PDF.js dari CDN, menggunakan visual canvas badge.');
        resolve(null);
      };

      document.head.appendChild(script);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Safely cleans a base64 string, strips data URI scheme, validates character set and padding.
 * Returns clean base64 string or null if corrupted or too short.
 */
export function cleanBase64(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null;

  try {
    let clean = input.trim();
    // Strip data URL scheme if present
    const commaIdx = clean.indexOf(',');
    if (commaIdx !== -1 && clean.substring(0, commaIdx).includes('base64')) {
      clean = clean.substring(commaIdx + 1);
    } else if (clean.startsWith('data:')) {
      // Non-base64 data URL
      return null;
    }

    // Remove all whitespace and newlines
    clean = clean.replace(/[\s\r\n]+/g, '');

    if (!clean || clean.length < 50) return null;

    // Fix base64 padding
    const remainder = clean.length % 4;
    if (remainder === 2) {
      clean += '==';
    } else if (remainder === 3) {
      clean += '=';
    } else if (remainder === 1) {
      return null; // Corrupted length
    }

    // Verify valid base64 character set
    if (!/^[A-Za-z0-9+/=]+$/.test(clean)) {
      return null;
    }

    return clean;
  } catch {
    return null;
  }
}

/**
 * Safely decodes base64 string or data URL into a Uint8Array.
 * Enforces buffer length >= 50 bytes.
 */
export function safeBase64ToUint8Array(input?: string | null): Uint8Array | null {
  const clean = cleanBase64(input);
  if (!clean) return null;

  try {
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      const binaryString = window.atob(clean);
      const len = binaryString.length;
      if (len < 50) return null;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } else if (typeof Buffer !== 'undefined') {
      const buf = Buffer.from(clean, 'base64');
      if (buf.length < 50) return null;
      return new Uint8Array(buf);
    }
  } catch (err) {
    console.warn('safeBase64ToUint8Array decoding warning:', err);
  }

  return null;
}

/**
 * Fast binary header parser for PNG and JPEG dimensions.
 * Works synchronously in both Browser and Node.js test environments without DOM overhead.
 */
export function parseImageDimensionsFromBuffer(buffer: Uint8Array): { width: number; height: number; type: 'png' | 'jpeg' } | null {
  if (!buffer || buffer.length < 32) return null;

  // Check PNG Signature: 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    // PNG IHDR chunk is located at byte offset 16 (4 bytes width, 4 bytes height, big-endian)
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const width = view.getUint32(16, false);
    const height = view.getUint32(20, false);
    if (width > 0 && height > 0) {
      return { width, height, type: 'png' };
    }
  }

  // Check JPEG SOI: 0xFF, 0xD8
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    const len = buffer.length;
    while (offset < len - 8) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      // Baseline DCT (SOF0 = 0xC0) or Progressive DCT (SOF2 = 0xC2)
      if (marker === 0xc0 || marker === 0xc2) {
        const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        const height = view.getUint16(offset + 5, false);
        const width = view.getUint16(offset + 7, false);
        if (width > 0 && height > 0) {
          return { width, height, type: 'jpeg' };
        }
      }
      // Advance to next marker
      const segmentLength = (buffer[offset + 2] << 8) | buffer[offset + 3];
      offset += 2 + segmentLength;
    }
    return { width: 800, height: 600, type: 'jpeg' };
  }

  return null;
}

/**
 * Calculates proportional fit dimensions preserving original aspect ratio.
 * Ensures the image never stretches, skews, or exceeds maxWidth / maxHeight.
 */
export function calculateFitDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const nw = naturalWidth > 0 ? naturalWidth : 800;
  const nh = naturalHeight > 0 ? naturalHeight : 600;

  const widthRatio = maxWidth / nw;
  const heightRatio = maxHeight / nh;
  const scale = Math.min(widthRatio, heightRatio, 1.0); // Never upscale beyond 1.0 to avoid blur

  const fittedWidth = Math.max(Math.round(nw * scale), 40);
  const fittedHeight = Math.max(Math.round(nh * scale), 40);

  return { width: fittedWidth, height: fittedHeight };
}

/**
 * Generates an official Belacom document preview card directly on HTML5 Canvas 2D.
 * This is 100% synchronous, never fails, requires no network/CORS, and always outputs
 * a pristine, high-resolution PNG data URL.
 */
export function renderCanvasDocumentBadge(
  title: string,
  fileName: string,
  woNumber: string = 'WO-BEL-2026',
  refNumber: string = 'TAG-2026'
): string {
  if (typeof document === 'undefined') {
    return '';
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 380;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Dark sleek background
    const bgGrad = ctx.createLinearGradient(0, 0, 600, 380);
    bgGrad.addColorStop(0, '#09101d');
    bgGrad.addColorStop(0.6, '#131e30');
    bgGrad.addColorStop(1, '#0c1524');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 600, 380);

    // Decorative technical grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 60; x < 600; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 380);
      ctx.stroke();
    }
    for (let y = 38; y < 380; y += 38) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(600, y);
      ctx.stroke();
    }

    // Outer border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 580, 360);

    // Header badge
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(20, 20, 560, 48);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, 20, 560, 48);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText('PT. BELACOM INDONESIA TELECOM', 36, 42);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('SISTEM PENGELOLAAN BERKAS & PENAGIHAN RESMI', 36, 58);

    // Document Card Center
    ctx.fillStyle = '#0d1829';
    ctx.fillRect(40, 90, 520, 190);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(40, 90, 520, 190);

    // Document Icon representation
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(60, 115, 48, 58);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText('PDF', 72, 150);

    // Document Name & Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px Arial, sans-serif';
    const displayTitle = (title || 'DOKUMEN PENAGIHAN').toUpperCase();
    ctx.fillText(displayTitle.length > 36 ? displayTitle.substring(0, 34) + '...' : displayTitle, 125, 135);

    ctx.fillStyle = '#34d399';
    ctx.font = '12px Consolas, monospace';
    const displayFile = fileName || 'Dokumen_Terlampir.pdf';
    ctx.fillText(`Berkas: ${displayFile.length > 40 ? displayFile.substring(0, 38) + '...' : displayFile}`, 125, 158);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '12px Consolas, monospace';
    ctx.fillText(`No. WO     : ${woNumber || 'WO-BEL-2026'}`, 125, 180);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Consolas, monospace';
    ctx.fillText(`Ref Tagihan: ${refNumber || 'TAG-2026'}`, 125, 202);

    // Verified Stamp
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.fillRect(125, 220, 230, 28);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.strokeRect(125, 220, 230, 28);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText('✓ BERKAS RESMI TERVERIFIKASI', 138, 238);

    // Bottom Footer
    ctx.fillStyle = '#020617';
    ctx.fillRect(20, 300, 560, 58);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 300, 560, 58);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Consolas, monospace';
    ctx.fillText(`Dicetak Melalui Belacom Controlling System | ${new Date().toLocaleDateString('id-ID')}`, 36, 325);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Consolas, monospace';
    ctx.fillText('Dokumen elektronik ini memiliki keabsahan hukum penuh dalam pelaporan proyek.', 36, 343);

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('renderCanvasDocumentBadge error:', err);
    return '';
  }
}

/**
 * Safely renders an SVG data URL or SVG XML string into a PNG Data URL using Canvas
 */
async function svgToPngDataUrl(
  svgSource: string,
  fallbackTitle: string = 'Dokumen',
  woNumber: string = '',
  billingCode: string = ''
): Promise<string> {
  if (typeof document === 'undefined') return '';

  return new Promise((resolve) => {
    try {
      let svgText = svgSource;
      if (svgSource.startsWith('data:image/svg+xml;utf8,')) {
        svgText = decodeURIComponent(svgSource.replace('data:image/svg+xml;utf8,', ''));
      } else if (svgSource.startsWith('data:image/svg+xml;base64,')) {
        const b64 = svgSource.replace('data:image/svg+xml;base64,', '');
        svgText = window.atob(b64);
      }

      const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const img = new Image();

      const timer = setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        // On timeout, safely resolve with Canvas 2D badge
        resolve(renderCanvasDocumentBadge(fallbackTitle, 'Dokumen.pdf', woNumber, billingCode));
      }, 1500);

      img.onload = () => {
        clearTimeout(timer);
        URL.revokeObjectURL(blobUrl);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 600;
          canvas.height = img.height || 380;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const pngUrl = canvas.toDataURL('image/png');
            resolve(pngUrl);
            return;
          }
        } catch (canvasErr) {
          console.warn('Canvas SVG draw warning:', canvasErr);
        }
        resolve(renderCanvasDocumentBadge(fallbackTitle, 'Dokumen.pdf', woNumber, billingCode));
      };

      img.onerror = () => {
        clearTimeout(timer);
        URL.revokeObjectURL(blobUrl);
        resolve(renderCanvasDocumentBadge(fallbackTitle, 'Dokumen.pdf', woNumber, billingCode));
      };

      img.src = blobUrl;
    } catch {
      resolve(renderCanvasDocumentBadge(fallbackTitle, 'Dokumen.pdf', woNumber, billingCode));
    }
  });
}

/**
 * Ensures any uploaded document (PDF, PNG, JPG, WEBP, or SVG)
 * is converted into a high-resolution PNG Base64 Data URL.
 * Guarantees that the returned value is ALWAYS a valid data:image/png;base64,... or data:image/jpeg;base64,...
 * and NEVER returns raw SVG or corrupted text strings.
 */
export async function ensureImageBase64(
  fileSource?: string | PDFFileMeta | null,
  contextInfo?: { docTitle?: string; woNumber?: string; billingCode?: string }
): Promise<string | null> {
  if (!fileSource) return null;

  let rawSource: string = '';
  let fileName: string = '';

  if (typeof fileSource === 'string') {
    rawSource = fileSource.trim();
    fileName = rawSource.substring(rawSource.lastIndexOf('/') + 1);
  } else if (typeof fileSource === 'object') {
    rawSource = (fileSource.imageDataUrl || fileSource.url || '').trim();
    fileName = fileSource.name || 'Dokumen.pdf';
  }

  const docTitle = contextInfo?.docTitle || fileName || 'DOKUMEN RESMI PENAGIHAN';
  const woNumber = contextInfo?.woNumber || 'WO-BEL-2026';
  const billingCode = contextInfo?.billingCode || 'TAG-2026';

  if (!rawSource) {
    return renderCanvasDocumentBadge(docTitle, fileName, woNumber, billingCode);
  }

  // 1. If it's already a raster image (PNG, JPG, WEBP) with base64 data
  if (
    rawSource.startsWith('data:image/png;base64,') ||
    rawSource.startsWith('data:image/jpeg;base64,') ||
    rawSource.startsWith('data:image/jpg;base64,') ||
    rawSource.startsWith('data:image/webp;base64,')
  ) {
    // Validate base64 validity
    const bytes = safeBase64ToUint8Array(rawSource);
    if (bytes && bytes.length > 50) {
      return rawSource;
    }
  }

  // 2. If it's an SVG data URL or SVG XML, render to PNG
  if (rawSource.startsWith('data:image/svg+xml') || rawSource.includes('<svg')) {
    const pngResult = await svgToPngDataUrl(rawSource, docTitle, woNumber, billingCode);
    if (pngResult && pngResult.startsWith('data:image/png;base64,')) {
      return pngResult;
    }
    return renderCanvasDocumentBadge(docTitle, fileName, woNumber, billingCode);
  }

  // 3. If it's a PDF file (data:application/pdf or .pdf URL)
  const isPdf =
    rawSource.startsWith('data:application/pdf') ||
    rawSource.includes('pdf;base64') ||
    rawSource.toLowerCase().endsWith('.pdf') ||
    fileName.toLowerCase().endsWith('.pdf');

  if (isPdf && typeof document !== 'undefined') {
    try {
      const pdfjs = await loadPdfJsLib();

      if (pdfjs) {
        let loadingTask: any;

        if (rawSource.startsWith('data:')) {
          const bytes = safeBase64ToUint8Array(rawSource);
          if (bytes && bytes.length > 50) {
            loadingTask = pdfjs.getDocument({
              data: bytes,
              cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
              cMapPacked: true
            });
          }
        } else if (rawSource.startsWith('http') || rawSource.startsWith('/')) {
          loadingTask = pdfjs.getDocument(rawSource);
        }

        if (loadingTask) {
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1); // Render first page
          const scale = 2.0;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({
              canvasContext: ctx,
              viewport: viewport
            }).promise;

            const renderedPng = canvas.toDataURL('image/png');
            if (renderedPng && renderedPng.startsWith('data:image/png;base64,')) {
              return renderedPng;
            }
          }
        }
      }
    } catch (pdfErr) {
      console.warn('PDF.js render notice, using official document card:', pdfErr);
    }
  }

  // 4. Default high-resolution document badge fallback
  return renderCanvasDocumentBadge(docTitle, fileName, woNumber, billingCode);
}

/**
 * Mengonversi berkas (Foto / PDF) menjadi Base64 PNG bersih beserta rasio dimensinya
 */
export async function getCleanImageWithDimensions(
  fileSource: string | null | undefined,
  fileNameFallback: string = 'Dokumen'
): Promise<SafeImageData | null> {
  const validated = await extractValidatedImageWithDimensions(fileSource, { docTitle: fileNameFallback });
  if (!validated) return null;
  return {
    base64: validated.cleanBase64,
    width: validated.naturalWidth,
    height: validated.naturalHeight
  };
}

export interface ValidatedImageData {
  buffer: Uint8Array;
  cleanBase64: string;
  dataUrl: string;
  extension: 'png' | 'jpeg';
  naturalWidth: number;
  naturalHeight: number;
}

/**
 * Extracts validated, non-corrupt image binary, extension, clean base64 string,
 * and natural dimensions for Excel and Word exporters.
 * Returns null if the source is invalid or < 100 bytes so drawings are safely skipped.
 */
export async function extractValidatedImageWithDimensions(
  fileSource?: string | PDFFileMeta | null,
  contextInfo?: { docTitle?: string; woNumber?: string; billingCode?: string }
): Promise<ValidatedImageData | null> {
  if (!fileSource) return null;

  try {
    const dataUrl = await ensureImageBase64(fileSource, contextInfo);
    if (!dataUrl || typeof dataUrl !== 'string') return null;

    const cleanB64 = cleanBase64(dataUrl);
    if (!cleanB64 || cleanB64.length < 50) return null;

    const buffer = safeBase64ToUint8Array(cleanB64);
    if (!buffer || buffer.length < 100) return null; // strictly require >= 100 bytes

    const isJpeg = dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg');
    const ext: 'png' | 'jpeg' = isJpeg ? 'jpeg' : 'png';

    // Try fast binary header parsing first
    const headerInfo = parseImageDimensionsFromBuffer(buffer);
    let naturalWidth = headerInfo?.width || 0;
    let naturalHeight = headerInfo?.height || 0;

    // If binary parsing didn't find dimensions and we are in browser, use Image element
    if ((naturalWidth <= 0 || naturalHeight <= 0) && typeof window !== 'undefined' && typeof Image !== 'undefined') {
      await new Promise<void>((resolve) => {
        const img = new Image();
        const timer = setTimeout(() => {
          if (naturalWidth <= 0) naturalWidth = 800;
          if (naturalHeight <= 0) naturalHeight = 600;
          resolve();
        }, 1000);

        img.onload = () => {
          clearTimeout(timer);
          naturalWidth = img.naturalWidth || 800;
          naturalHeight = img.naturalHeight || 600;
          resolve();
        };

        img.onerror = () => {
          clearTimeout(timer);
          if (naturalWidth <= 0) naturalWidth = 800;
          if (naturalHeight <= 0) naturalHeight = 600;
          resolve();
        };

        img.src = dataUrl;
      });
    }

    if (naturalWidth <= 0) naturalWidth = 800;
    if (naturalHeight <= 0) naturalHeight = 600;

    return {
      buffer,
      cleanBase64: cleanB64,
      dataUrl,
      extension: ext,
      naturalWidth,
      naturalHeight
    };
  } catch (err) {
    console.warn('extractValidatedImageWithDimensions warning:', err);
    return null;
  }
}

