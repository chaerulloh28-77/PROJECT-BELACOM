/**
 * Local-First IndexedDB Persistence Vault
 * Memberikan penyimpanan lokal aman tanpa batas kuota localStorage untuk
 * transaksi BAST, Daily Report, Titik FO, Penagihan, dan binary blob file besar.
 */

import { PDFFileMeta } from '../types';

const DB_NAME = 'belacom_local_vault';
const DB_VERSION = 1;

export interface FileBlobRecord {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
  sizeBytes: number;
  savedAt: string;
}

let dbInstancePromise: Promise<IDBDatabase> | null = null;

/**
 * Inisialisasi koneksi IndexedDB dengan 3 store utama:
 * - records: menyimpan array koleksi data utama
 * - file_blobs: menyimpan payload Base64/blob biner berkas besar
 * - drafts: menyimpan cache draft input form yang belum disimpan
 */
export function getLocalVaultDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB tidak didukung pada environment ini'));
  }

  if (dbInstancePromise) {
    return dbInstancePromise;
  }

  dbInstancePromise = new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('records')) {
          db.createObjectStore('records');
        }
        if (!db.objectStoreNames.contains('file_blobs')) {
          db.createObjectStore('file_blobs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts');
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('[LocalVault] Gagal membuka IndexedDB:', request.error);
        reject(request.error);
      };
    } catch (err) {
      reject(err);
    }
  });

  return dbInstancePromise;
}

/**
 * Menyimpan data koleksi (misal: 'dailyReports', 'basts', 'penagihan') ke IndexedDB
 * dengan fallback otomatis ke localStorage jika IndexedDB bermasalah.
 */
export async function saveLocalCollection<T>(key: string, data: T[]): Promise<void> {
  try {
    const db = await getLocalVaultDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['records'], 'readwrite');
      const store = transaction.objectStore('records');
      const req = store.put(data, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[LocalVault] Gagal simpan ${key} ke IndexedDB, beralih ke localStorage:`, err);
    try {
      localStorage.setItem(`belacom_vault_${key}`, JSON.stringify(data));
    } catch (lsErr) {
      console.warn(`[LocalVault] LocalStorage juga penuh/gagal untuk ${key}:`, lsErr);
    }
  }
}

/**
 * Membaca data koleksi dari IndexedDB (atau fallback localStorage)
 */
export async function getLocalCollection<T>(key: string): Promise<T[] | null> {
  try {
    const db = await getLocalVaultDB();
    const result = await new Promise<T[] | undefined>((resolve, reject) => {
      const transaction = db.transaction(['records'], 'readonly');
      const store = transaction.objectStore('records');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (result && Array.isArray(result)) {
      return result;
    }
  } catch (err) {
    console.warn(`[LocalVault] Gagal baca ${key} dari IndexedDB:`, err);
  }

  // Fallback ke localStorage
  try {
    const raw = localStorage.getItem(`belacom_vault_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore error
  }

  return null;
}

/**
 * Menyimpan binary blob / Base64 berkas besar ke IndexedDB khusus store 'file_blobs'
 */
export async function saveFileBlob(
  fileId: string, 
  meta: { name: string; dataUrl: string; mimeType?: string; sizeBytes?: number }
): Promise<void> {
  if (!fileId || !meta.dataUrl) return;

  try {
    const db = await getLocalVaultDB();
    const record: FileBlobRecord = {
      id: fileId,
      name: meta.name || 'berkas',
      dataUrl: meta.dataUrl,
      mimeType: meta.mimeType || 'application/octet-stream',
      sizeBytes: meta.sizeBytes || meta.dataUrl.length,
      savedAt: new Date().toISOString()
    };

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['file_blobs'], 'readwrite');
      const store = transaction.objectStore('file_blobs');
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[LocalVault] Gagal simpan file blob ${fileId} ke IndexedDB:`, err);
  }
}

/**
 * Mengambil binary blob berkas dari IndexedDB berdasarkan ID file
 */
export async function getFileBlob(fileId: string): Promise<FileBlobRecord | null> {
  if (!fileId) return null;

  try {
    const db = await getLocalVaultDB();
    return await new Promise<FileBlobRecord | null>((resolve, reject) => {
      const transaction = db.transaction(['file_blobs'], 'readonly');
      const store = transaction.objectStore('file_blobs');
      const req = store.get(fileId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[LocalVault] Gagal ambil file blob ${fileId} dari IndexedDB:`, err);
    return null;
  }
}

/**
 * Menghapus file blob dari IndexedDB
 */
export async function removeFileBlob(fileId: string): Promise<void> {
  if (!fileId) return;

  try {
    const db = await getLocalVaultDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['file_blobs'], 'readwrite');
      const store = transaction.objectStore('file_blobs');
      const req = store.delete(fileId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[LocalVault] Gagal hapus file blob ${fileId}:`, err);
  }
}

/**
 * Menyimpan draft input form sementara
 */
export async function saveFormDraft(formType: 'bast' | 'daily_report' | 'penagihan' | string, draft: any): Promise<void> {
  try {
    const db = await getLocalVaultDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');
      const req = store.put(draft, formType);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      sessionStorage.setItem(`belacom_draft_${formType}`, JSON.stringify(draft));
    } catch {
      // Ignore
    }
  }
}

/**
 * Membaca draft form
 */
export async function getFormDraft<T>(formType: 'bast' | 'daily_report' | 'penagihan' | string): Promise<T | null> {
  try {
    const db = await getLocalVaultDB();
    const result = await new Promise<T | undefined>((resolve, reject) => {
      const transaction = db.transaction(['drafts'], 'readonly');
      const store = transaction.objectStore('drafts');
      const req = store.get(formType);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (result) return result;
  } catch {
    // fallback
  }

  try {
    const raw = sessionStorage.getItem(`belacom_draft_${formType}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }

  return null;
}

/**
 * Membersihkan draft form setelah submit berhasil
 */
export async function clearFormDraft(formType: 'bast' | 'daily_report' | 'penagihan' | string): Promise<void> {
  try {
    const db = await getLocalVaultDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');
      const req = store.delete(formType);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // fallback
  }

  try {
    sessionStorage.removeItem(`belacom_draft_${formType}`);
  } catch {
    // Ignore
  }
}

/**
 * Optimasi Payload Cloud:
 * Mengekstrak string Base64 raksasa dari objek (foto, excel, PDF) dan menyimpannya di IndexedDB lokal.
 * Node JSON yang dikirim ke Firebase hanya memuat metadata file (nama, ukuran, tanggal, tipe)
 * dengan url yang disederhanakan dan flag `hasLocalBlob: true` agar Firebase RTDB tidak overflow!
 */
export async function extractAndStoreBlobsLocally<T>(data: T): Promise<T> {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Jika berupa array
  if (Array.isArray(data)) {
    const processedArray = await Promise.all(data.map(item => extractAndStoreBlobsLocally(item)));
    return processedArray as unknown as T;
  }

  const obj = { ...(data as Record<string, any>) };

  // Deteksi apakah objek ini merupakan PDFFileMeta dengan payload Base64 besar
  const hasLargeDataUrl = typeof obj.url === 'string' && obj.url.startsWith('data:') && obj.url.length > 500;
  const hasLargeImageData = typeof obj.imageDataUrl === 'string' && obj.imageDataUrl.startsWith('data:') && obj.imageDataUrl.length > 500;

  if (obj.id && obj.name && (hasLargeDataUrl || hasLargeImageData)) {
    const targetUrl = obj.url || obj.imageDataUrl || '';
    // Simpan ke IndexedDB lokal
    await saveFileBlob(obj.id, {
      name: obj.name,
      dataUrl: targetUrl,
      mimeType: obj.mimeType || obj.fileType,
      sizeBytes: obj.sizeBytes || targetUrl.length
    });

    // Sanitasi objek untuk Firebase RTDB: jangan kirim jutaan karakter Base64 ke cloud
    obj.hasLocalBlob = true;
    obj.url = ''; // Simpan metadata kosong di RTDB untuk menghemat kuota 1 GB
    if (obj.imageDataUrl) {
      delete obj.imageDataUrl;
    }
    return obj as T;
  }

  // Proses properti anak secara rekursif
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && typeof val === 'object') {
      obj[key] = await extractAndStoreBlobsLocally(val);
    }
  }

  return obj as T;
}

/**
 * Menghidrasi kembali file metadata dengan dataUrl dari IndexedDB lokal jika ada
 */
export async function hydrateBlobsFromLocal<T>(data: T): Promise<T> {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    const hydratedArray = await Promise.all(data.map(item => hydrateBlobsFromLocal(item)));
    return hydratedArray as unknown as T;
  }

  const obj = { ...(data as Record<string, any>) };

  if (obj.id && obj.name && (!obj.url || obj.url === '#' || obj.url === '' || obj.hasLocalBlob)) {
    const localRecord = await getFileBlob(obj.id);
    if (localRecord && localRecord.dataUrl) {
      obj.url = localRecord.dataUrl;
      obj.imageDataUrl = localRecord.dataUrl;
    }
    return obj as T;
  }

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && typeof val === 'object') {
      obj[key] = await hydrateBlobsFromLocal(val);
    }
  }

  return obj as T;
}
