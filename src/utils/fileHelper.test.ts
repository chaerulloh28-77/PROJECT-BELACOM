import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getFileExtension,
  getFileBadgeStyle,
  getTaggingCategoryConfig,
  validateTaggingFile,
  formatGpsCoordinates,
  parseGpsCoordinates,
  calculateHaversineDistanceMeters,
  getFallbackGpsCoordinates,
  createSampleTaggingFileDataUrl
} from './fileHelper.ts';

describe('fileHelper & Tagging End to End Location File Validation', () => {
  it('extracts file extension accurately in uppercase', () => {
    assert.equal(getFileExtension('foto_site_a.jpg'), 'JPG');
    assert.equal(getFileExtension('bukti_tagging.gpx'), 'GPX');
    assert.equal(getFileExtension('rute_interkoneksi.kmz'), 'KMZ');
    assert.equal(getFileExtension('no_extension'), 'FILE');
  });

  it('returns dedicated badge styles for GPX, KML, and KMZ files', () => {
    const gpxBadge = getFileBadgeStyle('track_site_a.gpx');
    assert.equal(gpxBadge.ext, 'GPX');
    assert.equal(gpxBadge.label, 'GPS Exchange Track');

    const kmlBadge = getFileBadgeStyle('rute_kabel_fo.kml');
    assert.equal(kmlBadge.ext, 'KML');
    assert.equal(kmlBadge.label, 'Google Earth / GIS Route Map');

    const kmzBadge = getFileBadgeStyle('peta_jalur_utama.kmz');
    assert.equal(kmzBadge.ext, 'KMZ');
    assert.equal(kmzBadge.label, 'Google Earth / GIS Route Map');
  });

  it('configures Foto Geotagging / Site (site-photo) with clean title and universal accept', () => {
    const config = getTaggingCategoryConfig('site-photo');
    assert.equal(config.title, 'Foto Geotagging / Site');
    assert.equal(config.acceptAttr, '*/*');

    assert.equal(validateTaggingFile('site_a_geotag.jpg', 'site-photo').valid, true);
    assert.equal(validateTaggingFile('site_a_geotag.JPEG', 'site-photo').valid, true);
    assert.equal(validateTaggingFile('site_b_geotag.png', 'site-photo').valid, true);
    assert.equal(validateTaggingFile('dokumen.pdf', 'site-photo').valid, true);
  });

  it('configures Dokumen Bukti Tagging (site-doc) with clean title and universal accept', () => {
    const config = getTaggingCategoryConfig('site-doc');
    assert.equal(config.title, 'Dokumen Bukti Tagging');
    assert.equal(config.acceptAttr, '*/*');

    assert.equal(validateTaggingFile('bukti_tagging_site_a.pdf', 'site-doc').valid, true);
    assert.equal(validateTaggingFile('koordinat_gps_site_b.gpx', 'site-doc').valid, true);
    assert.equal(validateTaggingFile('arsip.zip', 'site-doc').valid, true);
  });

  it('configures File Peta Rute (route-map) with clean title, universal accept, and file size limits', () => {
    const config = getTaggingCategoryConfig('route-map');
    assert.equal(config.title, 'File Peta Rute');
    assert.equal(config.acceptAttr, '*/*');

    assert.equal(validateTaggingFile('rute_pop_sentul.kml', 'route-map').valid, true);
    assert.equal(validateTaggingFile('rute_bts_cijayanti.kmz', 'route-map').valid, true);
    assert.equal(validateTaggingFile('tracking_jalur.gpx', 'route-map').valid, true);
    assert.equal(validateTaggingFile('rute_peta.xlsx', 'route-map').valid, true);

    const oversized = validateTaggingFile('rute_besar.kmz', 'route-map', 20 * 1024 * 1024, 15);
    assert.equal(oversized.valid, false);
    assert.ok(oversized.errorMessage?.includes('15 MB'));
  });

  it('formats and parses 6-decimal GPS coordinates and calculates Haversine route distance', () => {
    const formatted = formatGpsCoordinates(-6.5891244, 106.8523182);
    assert.equal(formatted, '-6.589124, 106.852318');

    const parsed = parseGpsCoordinates(formatted);
    assert.deepEqual(parsed, { lat: -6.589124, lng: 106.852318 });
    assert.equal(parseGpsCoordinates('invalid'), null);

    const dist = calculateHaversineDistanceMeters('-6.589124, 106.852318', '-6.594215, 106.861052');
    assert.ok(typeof dist === 'number' && dist > 1000 && dist < 1300);

    const fallbackOrigin = getFallbackGpsCoordinates('origin');
    assert.equal(fallbackOrigin.coordinates, '-6.589124, 106.852318');
  });

  it('generates valid Data URLs for sample geotagging photos and GPX/KML route files', () => {
    const photoUrl = createSampleTaggingFileDataUrl('site-photo', 'JPG', 'site_a', '-6.589124, 106.852318');
    assert.ok(photoUrl.startsWith('data:image/svg+xml;utf8,'));

    const gpxUrl = createSampleTaggingFileDataUrl('site-doc', 'GPX', 'site_a');
    assert.ok(gpxUrl.startsWith('data:application/gpx+xml;utf8,'));

    const kmlUrl = createSampleTaggingFileDataUrl('route-map', 'KML', 'rute_fo');
    assert.ok(kmlUrl.startsWith('data:application/vnd.google-earth.kml+xml;utf8,'));
  });
});

