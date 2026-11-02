/**
 * Utility Kompresi Berkas Otomatis Client-Side
 * Mengompres berkas gambar (JPG, JPEG, PNG, WEBP) via HTML5 Canvas
 * untuk menghemat bandwidth dan kapasitas Firebase Realtime Database.
 */

export interface CompressionOptions {
  maxDimension?: number;      // Resolusi maksimal lebar/tinggi (default: 1600px)
  quality?: number;           // Kualitas awal kompresi JPEG/WEBP (default: 0.8)
  minQuality?: number;        // Batas bawah kualitas (default: 0.5)
  targetMaxSizeBytes?: number; // Target ukuran maksimal setelah kompresi (default: 850 KB)
  compressionThresholdBytes?: number; // Batas ukuran file mulai dikompres (default: 1 MB)
}

export interface CompressionResult {
  dataUrl: string;
  blob?: Blob;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  wasCompressed: boolean;
  compressionRatio: string;   // Contoh: "4.8 MB → 720 KB"
  reductionPercent: number;    // Contoh: 85 (%)
  mimeType: string;
}

/**
 * Format ukuran byte menjadi teks ramah pengguna (B, KB, MB)
 */
export const formatBytes = (bytes: number): string => {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Cek apakah berkas atau nama berkas merupakan format gambar yang didukung
 */
export const isImageFile = (fileOrName: File | string): boolean => {
  if (typeof fileOrName === 'string') {
    const ext = fileOrName.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'jfif'].includes(ext);
  }
  if (fileOrName.type && fileOrName.type.startsWith('image/')) {
    // Exclude svg since it's vector
    return !fileOrName.type.includes('svg');
  }
  const ext = fileOrName.name.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'jfif'].includes(ext);
};

/**
 * Baca berkas menjadi HTMLImageElement
 */
const loadImageElement = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Gagal memuat gambar untuk kompresi: ' + err));
    img.src = src;
  });
};

/**
 * Kompresi berkas gambar otomatis menggunakan HTML5 Canvas
 */
export const compressImageFile = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const {
    maxDimension = 1600,
    quality = 0.8,
    minQuality = 0.5,
    targetMaxSizeBytes = 850 * 1024, // 850 KB
    compressionThresholdBytes = 1024 * 1024 // 1 MB
  } = options;

  const originalSizeBytes = file.size;

  // Baca file sumber ke dataUrl
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.readAsDataURL(file);
  });

  // Jika ukuran file asli sudah di bawah threshold dan dimensinya wajar, tidak perlu kompres agresif
  if (originalSizeBytes <= compressionThresholdBytes) {
    return {
      dataUrl: rawDataUrl,
      originalSizeBytes,
      compressedSizeBytes: originalSizeBytes,
      wasCompressed: false,
      compressionRatio: `${formatBytes(originalSizeBytes)}`,
      reductionPercent: 0,
      mimeType: file.type || 'image/jpeg'
    };
  }

  // Muat ke elemen Image
  const img = await loadImageElement(rawDataUrl);

  // Hitung dimensi proporsional baru
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  // Siapkan canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      dataUrl: rawDataUrl,
      originalSizeBytes,
      compressedSizeBytes: originalSizeBytes,
      wasCompressed: false,
      compressionRatio: `${formatBytes(originalSizeBytes)}`,
      reductionPercent: 0,
      mimeType: file.type || 'image/jpeg'
    };
  }

  // Gambar dengan smoothing high quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Target output type (prefer image/jpeg untuk kompresi efektif)
  const outputMime = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';

  // Iterasi pencarian kompresi optimal
  let currentQuality = quality;
  let finalDataUrl = canvas.toDataURL(outputMime, currentQuality);
  let estimatedSizeBytes = Math.round((finalDataUrl.length * 3) / 4);

  // Jika masih di atas target ukuran dan kualitas masih di atas minQuality, turunkan bertahap
  while (estimatedSizeBytes > targetMaxSizeBytes && currentQuality > minQuality) {
    currentQuality = Math.max(minQuality, currentQuality - 0.1);
    finalDataUrl = canvas.toDataURL(outputMime, currentQuality);
    estimatedSizeBytes = Math.round((finalDataUrl.length * 3) / 4);
  }

  // Jika setelah kompresi hasilnya malah lebih besar (kasus jarang), pakai yang lebih kecil
  if (estimatedSizeBytes >= originalSizeBytes) {
    return {
      dataUrl: rawDataUrl,
      originalSizeBytes,
      compressedSizeBytes: originalSizeBytes,
      wasCompressed: false,
      compressionRatio: `${formatBytes(originalSizeBytes)}`,
      reductionPercent: 0,
      mimeType: file.type || 'image/jpeg'
    };
  }

  const reductionPercent = Math.max(0, Math.round(((originalSizeBytes - estimatedSizeBytes) / originalSizeBytes) * 100));
  const compressionRatio = `${formatBytes(originalSizeBytes)} → ${formatBytes(estimatedSizeBytes)}`;

  return {
    dataUrl: finalDataUrl,
    originalSizeBytes,
    compressedSizeBytes: estimatedSizeBytes,
    wasCompressed: true,
    compressionRatio,
    reductionPercent,
    mimeType: outputMime
  };
};
