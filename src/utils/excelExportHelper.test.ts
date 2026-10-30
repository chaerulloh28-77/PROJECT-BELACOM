import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPhotoVisualUrl } from './excelExportHelper';

test('getPhotoVisualUrl returns imageDataUrl if present', () => {
  const meta = {
    id: '1',
    name: 'photo.jpg',
    sizeBytes: 100,
    uploadDate: '2026-10-27',
    imageDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  };
  const url = getPhotoVisualUrl(meta, 'TEST', 'WO-101', 'BAST-101');
  assert.strictEqual(url, meta.imageDataUrl);
});

test('getPhotoVisualUrl generates SVG data URL fallback if imageDataUrl is missing', () => {
  const meta = {
    id: '2',
    name: 'photo.pdf',
    sizeBytes: 200,
    uploadDate: '2026-10-27'
  };
  const url = getPhotoVisualUrl(meta, 'FOTO CLOSURE', 'WO-102', 'BAST-102');
  assert.ok(url.startsWith('data:image/svg+xml;utf8,'));
});

import { cleanBase64, calculateFitDimensions, parseImageDimensionsFromBuffer } from './pdfToImage';
import { extractSafeImageBuffer } from './excelExportWithImages';

test('calculateFitDimensions preserves aspect ratio and respects bounds', () => {
  // Landscape image 1600x900 into max 260x320
  const fitLandscape = calculateFitDimensions(1600, 900, 260, 320);
  assert.strictEqual(fitLandscape.width, 260);
  assert.strictEqual(fitLandscape.height, 146); // 260 * (900/1600) = 146.25 -> 146

  // Portrait image 600x1200 into max 260x320
  const fitPortrait = calculateFitDimensions(600, 1200, 260, 320);
  assert.strictEqual(fitPortrait.height, 320);
  assert.strictEqual(fitPortrait.width, 160); // 320 * (600/1200) = 160
});

test('cleanBase64 strips data URI and cleans whitespace', () => {
  const raw = 'data:image/png;base64,   iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==  ';
  const clean = cleanBase64(raw);
  assert.ok(clean);
  assert.strictEqual(clean.includes('data:'), false);
  assert.strictEqual(clean.includes(' '), false);
  assert.ok(clean.length >= 50);
});

test('cleanBase64 returns null for corrupt or short inputs', () => {
  assert.strictEqual(cleanBase64(null), null);
  assert.strictEqual(cleanBase64(''), null);
  assert.strictEqual(cleanBase64('abc!@#$notvalid'), null);
  assert.strictEqual(cleanBase64('short'), null);
});

test('extractSafeImageBuffer returns null for empty or corrupted metadata', () => {
  assert.strictEqual(extractSafeImageBuffer(null), null);
  assert.strictEqual(extractSafeImageBuffer(''), null);
  assert.strictEqual(extractSafeImageBuffer({ id: 'x', name: 'corrupt', sizeBytes: 0, uploadDate: '' }), null);
});

