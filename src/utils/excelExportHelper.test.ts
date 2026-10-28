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
