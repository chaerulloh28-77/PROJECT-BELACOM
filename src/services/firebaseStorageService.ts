/**
 * Firebase Storage Service & Multi-Device Cloud Sync
 * Mengunggah berkas fisik (Excel BAST, Foto Daily Report, Tagging, dll.)
 * ke Firebase Storage dengan URL HTTPS resmi, smart caching lokal ke IndexedDB,
 * dan background retry saat sinkronisasi tertunda (offline-resilient).
 */

import { storage } from '../lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PDFFileMeta } from '../types';
import { dataUrlToBlob, base64ToBlob } from '../utils/fileDownloadHelper';
import { saveFileBlob, getFileBlob } from '../utils/localFirstDB';

/**
 * Membersihkan nama berkas agar aman untuk path Firebase Storage
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_');
}

/**
 * Konversi input (File, Blob, Data URL, atau Base64) menjadi Blob biner
 */
function ensureBlob(
  input: Blob | File | string, 
  mimeType: string = 'application/octet-stream',
  fileName: string = 'file'
): Blob {
  if (input instanceof Blob) {
    return input;
  }
  if (typeof input === 'string') {
    if (input.startsWith('data:')) {
      return dataUrlToBlob(input, mimeType, fileName);
    }
    return base64ToBlob(input, mimeType, fileName);
  }
  return new Blob([input], { type: mimeType });
}

/**
 * Mengunggah fisik berkas ke Firebase Storage dan mengembalikan URL HTTPS resmi
 */
export async function uploadBlobToFirebaseStorage(
  fileOrBlobOrDataUrl: Blob | File | string,
  destinationPath: string,
  mimeType: string = 'application/octet-stream',
  fileName: string = 'file'
): Promise<{ downloadUrl: string; storagePath: string } | null> {
  if (!storage) {
    console.warn('[CloudStorage] Firebase Storage belum diinisialisasi atau offline.');
    return null;
  }

  try {
    const cleanPath = destinationPath.replace(/^\/+/, '');
    const blob = ensureBlob(fileOrBlobOrDataUrl, mimeType, fileName);
    const fileRef = storageRef(storage, cleanPath);

    const metadata = {
      contentType: mimeType || 'application/octet-stream',
      customMetadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString()
      }
    };

    const uploadResult = await uploadBytes(fileRef, blob, metadata);
    const downloadUrl = await getDownloadURL(uploadResult.ref);

    return {
      downloadUrl,
      storagePath: cleanPath
    };
  } catch (error) {
    console.warn(`[CloudStorage] Gagal mengunggah ke ${destinationPath}:`, error);
    return null;
  }
}

/**
 * Unggah Berkas Excel BAST ke folder: /basts/excel/
 */
export async function uploadBastExcelFile(
  fileOrDataUrl: File | Blob | string,
  fileName: string,
  fileId?: string
): Promise<{ downloadUrl: string; storagePath: string } | null> {
  const safeId = fileId || 'ex_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  const safeName = sanitizeFileName(fileName);
  const path = `basts/excel/${safeId}_${safeName}`;
  const mime = fileName.endsWith('.xlsx') 
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : fileName.endsWith('.xls') 
      ? 'application/vnd.ms-excel'
      : 'application/octet-stream';

  return uploadBlobToFirebaseStorage(fileOrDataUrl, path, mime, fileName);
}

/**
 * Unggah Foto Daily Report ke folder: /daily_reports/photos/
 */
export async function uploadDailyReportPhoto(
  fileOrDataUrl: File | Blob | string,
  fileName: string,
  fileId?: string
): Promise<{ downloadUrl: string; storagePath: string } | null> {
  const safeId = fileId || 'photo_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  const safeName = sanitizeFileName(fileName);
  const path = `daily_reports/photos/${safeId}_${safeName}`;
  const mime = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';

  return uploadBlobToFirebaseStorage(fileOrDataUrl, path, mime, fileName);
}

/**
 * Unggah Berkas Dokumen Umum (APD, ABD, Core Connection, PO, Faktur Pajak, dll.)
 */
export async function uploadGeneralDocFile(
  fileOrDataUrl: File | Blob | string,
  fileName: string,
  folder: 'basts' | 'daily_reports' | 'penagihan' = 'basts',
  fileId?: string
): Promise<{ downloadUrl: string; storagePath: string } | null> {
  const safeId = fileId || 'doc_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  const safeName = sanitizeFileName(fileName);
  const path = `${folder}/docs/${safeId}_${safeName}`;
  let mime = 'application/pdf';
  if (fileName.match(/\.(xlsx|xls)$/i)) mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  else if (fileName.match(/\.(docx|doc)$/i)) mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  else if (fileName.match(/\.(png|jpg|jpeg|webp)$/i)) mime = 'image/jpeg';

  return uploadBlobToFirebaseStorage(fileOrDataUrl, path, mime, fileName);
}

/**
 * Smart Caching & Cross-Device URL Resolution:
 * 1. Cek apakah perangkat ini sudah memiliki salinan lokal di IndexedDB (cepat & hemat kuota).
 * 2. Jika belum (misal dibuka dari HP/laptop lain), ambil dari cloud `downloadUrl`.
 * 3. Simpan salinan unduhan cloud ke IndexedDB lokal perangkat baru (smart caching).
 */
export async function resolveFileUrlWithCache(file: PDFFileMeta): Promise<{ url: string; isCachedLocally: boolean }> {
  if (!file) {
    return { url: '', isCachedLocally: false };
  }

  // 1. Cek penyimpanan lokal IndexedDB
  if (file.id) {
    try {
      const localRecord = await getFileBlob(file.id);
      if (localRecord && localRecord.dataUrl && localRecord.dataUrl.length > 50) {
        return { url: localRecord.dataUrl, isCachedLocally: true };
      }
    } catch {
      // lanjut ke cloud
    }
  }

  // 2. Jika berkas memiliki cloud downloadUrl atau URL HTTPS
  const cloudUrl = file.downloadUrl || (file.url && file.url.startsWith('http') ? file.url : '');
  if (cloudUrl) {
    // Jalankan smart caching di background (non-blocking) untuk menyimpan salinan ke IndexedDB perangkat ini
    cacheCloudFileToIndexedDB(file.id, cloudUrl, file.name, file.fileType || file.mimeType).catch(() => {});
    return { url: cloudUrl, isCachedLocally: false };
  }

  // 3. Fallback ke URL Base64/Blob lokal jika tersedia langsung pada objek
  if (file.url && file.url !== '#' && file.url.length > 30) {
    if (file.id) {
      saveFileBlob(file.id, {
        name: file.name,
        dataUrl: file.url,
        mimeType: file.fileType || file.mimeType,
        sizeBytes: file.sizeBytes
      }).catch(() => {});
    }
    return { url: file.url, isCachedLocally: true };
  }

  if (file.imageDataUrl && file.imageDataUrl.length > 30) {
    return { url: file.imageDataUrl, isCachedLocally: true };
  }

  return { url: '', isCachedLocally: false };
}

/**
 * Background Smart Cache: Mengunduh berkas dari Firebase Storage dan menyimpannya ke IndexedDB lokal
 */
async function cacheCloudFileToIndexedDB(
  fileId: string, 
  cloudUrl: string, 
  fileName: string, 
  mimeType?: string
): Promise<void> {
  if (!fileId || !cloudUrl || typeof window === 'undefined') return;

  try {
    const response = await fetch(cloudUrl, { mode: 'cors' });
    if (!response.ok) return;

    const blob = await response.blob();
    const reader = new FileReader();

    await new Promise<void>((resolve, reject) => {
      reader.onload = async () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        if (dataUrl) {
          await saveFileBlob(fileId, {
            name: fileName,
            dataUrl,
            mimeType: mimeType || blob.type || 'application/octet-stream',
            sizeBytes: blob.size
          });
        }
        resolve();
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.debug('[CloudStorage] Smart cache skipped or CORS restricted:', err);
  }
}

/**
 * Menemukan dan mengunggah berkas yang belum memiliki cloud download URL
 * untuk sinkronisasi multi-device penuh
 */
export async function uploadPendingFileMetasInObject<T>(
  data: T, 
  folder: 'basts' | 'daily_reports' | 'penagihan'
): Promise<{ updatedData: T; uploadedCount: number }> {
  if (!data || typeof data !== 'object') {
    return { updatedData: data, uploadedCount: 0 };
  }

  let totalUploaded = 0;

  async function walk(obj: any): Promise<any> {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return Promise.all(obj.map(item => walk(item)));
    }

    // Deteksi apakah objek adalah PDFFileMeta
    if (obj.id && obj.name && typeof obj.sizeBytes === 'number') {
      const fileMeta = { ...obj } as PDFFileMeta;

      // Jika belum memiliki downloadUrl resmi di cloud
      if (!fileMeta.downloadUrl) {
        let contentToUpload: string | null = null;

        if (fileMeta.url && fileMeta.url.startsWith('data:')) {
          contentToUpload = fileMeta.url;
        } else if (fileMeta.imageDataUrl && fileMeta.imageDataUrl.startsWith('data:')) {
          contentToUpload = fileMeta.imageDataUrl;
        } else {
          // Cari di IndexedDB lokal
          const localRecord = await getFileBlob(fileMeta.id);
          if (localRecord && localRecord.dataUrl) {
            contentToUpload = localRecord.dataUrl;
          }
        }

        if (contentToUpload) {
          let uploadRes: { downloadUrl: string; storagePath: string } | null = null;

          if (folder === 'basts' && (fileMeta.name.endsWith('.xlsx') || fileMeta.name.endsWith('.xls'))) {
            uploadRes = await uploadBastExcelFile(contentToUpload, fileMeta.name, fileMeta.id);
          } else if (folder === 'daily_reports' && (fileMeta.name.match(/\.(jpg|jpeg|png|webp)$/i))) {
            uploadRes = await uploadDailyReportPhoto(contentToUpload, fileMeta.name, fileMeta.id);
          } else {
            uploadRes = await uploadGeneralDocFile(contentToUpload, fileMeta.name, folder, fileMeta.id);
          }

          if (uploadRes && uploadRes.downloadUrl) {
            fileMeta.downloadUrl = uploadRes.downloadUrl;
            fileMeta.storagePath = uploadRes.storagePath;
            fileMeta.url = uploadRes.downloadUrl;
            totalUploaded++;
          }
        }
      }

      return fileMeta;
    }

    const copy = { ...obj };
    for (const key of Object.keys(copy)) {
      const val = copy[key];
      if (val && typeof val === 'object') {
        copy[key] = await walk(val);
      }
    }
    return copy;
  }

  const updatedData = await walk(data);
  return { updatedData, uploadedCount: totalUploaded };
}
