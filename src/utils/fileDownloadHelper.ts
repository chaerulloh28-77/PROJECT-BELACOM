/**
 * Helper Unduh Berkas Otomatis Global
 * Mengunduh berkas Base64 / Data URL / Blob URL langsung ke perangkat
 * tanpa membuka tab baru atau merusak data asli.
 */

import { PDFFileMeta } from '../types';

/**
 * Konversi Data URL base64 menjadi Blob
 */
export const dataUrlToBlob = (dataUrl: string, fallbackMime: string = 'application/octet-stream'): Blob => {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) {
      return new Blob([dataUrl], { type: fallbackMime });
    }
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : fallbackMime;
    const isBase64 = parts[0].includes(';base64');

    if (isBase64) {
      const byteCharacters = atob(parts[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mime });
    } else {
      const decoded = decodeURIComponent(parts[1]);
      return new Blob([decoded], { type: mime });
    }
  } catch (err) {
    console.warn('Gagal decode base64 dataUrl, fallback ke Blob biasa:', err);
    return new Blob([dataUrl], { type: fallbackMime });
  }
};

/**
 * Download berkas langsung ke komputer pengguna
 * @param fileData Data URL string, blob URL, atau raw data
 * @param fileName Nama berkas lengkap dengan ekstensi (contoh: 'Invoice-WO-123.pdf')
 * @param mimeType Optional MIME type
 */
export const downloadFile = (fileData: string, fileName: string, mimeType?: string): void => {
  if (!fileData) {
    console.error('Data berkas kosong, tidak dapat mengunduh:', fileName);
    return;
  }

  const cleanName = fileName && fileName.trim().length > 0 ? fileName.trim() : 'dokumen_belacom';
  let blobUrl: string = '';
  let shouldRevoke = false;

  try {
    if (fileData.startsWith('data:')) {
      const blob = dataUrlToBlob(fileData, mimeType || 'application/octet-stream');
      blobUrl = URL.createObjectURL(blob);
      shouldRevoke = true;
    } else if (fileData.startsWith('blob:')) {
      blobUrl = fileData;
    } else if (fileData.startsWith('http://') || fileData.startsWith('https://') || fileData.startsWith('/')) {
      blobUrl = fileData;
    } else {
      const blob = new Blob([fileData], { type: mimeType || 'application/octet-stream' });
      blobUrl = URL.createObjectURL(blob);
      shouldRevoke = true;
    }

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = cleanName;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      if (shouldRevoke && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    }, 250);
  } catch (error) {
    console.error('Error saat download file:', error);
    // Fallback direct navigation
    window.location.href = fileData;
  }
};

/**
 * Unduh berkas langsung dari objek PDFFileMeta
 */
export const downloadFileMeta = (file: PDFFileMeta): void => {
  if (!file) return;
  const targetData = file.url || file.imageDataUrl || '';
  if (!targetData || targetData === '#') {
    // Generate fallback dummy content jika url belum tersedia
    const dummyText = `PT. Belacom Indonesia Telecom\nBerkas: ${file.name}\nTanggal: ${file.uploadDate}\nUkuran: ${file.sizeBytes} bytes\nID: ${file.id}`;
    const blob = new Blob([dummyText], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, file.name, file.fileType);
    return;
  }
  downloadFile(targetData, file.name, file.fileType || file.mimeType);
};
