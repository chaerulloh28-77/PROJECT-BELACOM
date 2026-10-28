import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateVisualGeotagPhotoDataUrl,
  generateVisualRouteMapDataUrl,
  generateVisualDocDataUrl
} from './bastExportHelper';

describe('bastExportHelper Visual Generators', () => {
  it('generates visual SVG data URLs for Geotagging Photos with coordinates and site names', () => {
    const originPhoto = generateVisualGeotagPhotoDataUrl(
      'POP Sentul City',
      '-6.589124, 106.852318',
      'WO-BEL-2026-0082',
      'BAST-0082',
      'origin'
    );
    assert.ok(originPhoto.startsWith('data:image/svg+xml;utf8,'));
    assert.ok(originPhoto.includes('POP%20Sentul%20City'));
    assert.ok(originPhoto.includes('-6.589124'));

    const destPhoto = generateVisualGeotagPhotoDataUrl(
      'BTS Cijayanti',
      '-6.594215, 106.861052',
      'WO-BEL-2026-0082',
      'BAST-0082',
      'destination'
    );
    assert.ok(destPhoto.startsWith('data:image/svg+xml;utf8,'));
    assert.ok(destPhoto.includes('BTS%20Cijayanti'));
  });

  it('generates visual SVG data URL for Route Map with distance and points', () => {
    const routeMap = generateVisualRouteMapDataUrl(
      'POP Sentul City / OTB-01',
      '-6.589124, 106.852318',
      'BTS Cijayanti / Closure CL-04',
      '-6.594215, 106.861052',
      1200,
      'WO-BEL-2026-0082'
    );
    assert.ok(routeMap.startsWith('data:image/svg+xml;utf8,'));
    assert.ok(routeMap.includes('POP%20Sentul%20City'));
    assert.ok(routeMap.includes('1.200%20Meter'));
  });

  it('generates visual SVG data URL for different technical document categories', () => {
    const apdDoc = generateVisualDocDataUrl(
      'APD',
      'APD_WO-BEL-2026-0082.pdf',
      'WO-BEL-2026-0082',
      'BAST-0082'
    );
    assert.ok(apdDoc.startsWith('data:image/svg+xml;utf8,'));
    assert.ok(apdDoc.includes('APD_WO-BEL-2026-0082.pdf'));

    const fotoDoc = generateVisualDocDataUrl(
      'FOTO DOKUMENTASI',
      'FOTO_CLOSURE.jpg',
      'WO-BEL-2026-0082',
      'BAST-0082'
    );
    assert.ok(fotoDoc.startsWith('data:image/svg+xml;utf8,'));
    assert.ok(fotoDoc.includes('FOTO%20DOKUMENTASI'));
  });
});
