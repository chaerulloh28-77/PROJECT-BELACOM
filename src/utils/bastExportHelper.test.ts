import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateVisualGeotagPhotoDataUrl,
  generateVisualRouteMapDataUrl,
  generateVisualDocDataUrl,
  ensureBastVisualImages,
  buildBastWordHtml,
  buildBastExcelHtml
} from './bastExportHelper';
import { BASTItem } from '../types';

describe('bastExportHelper with Visual Image Generation', () => {
  const mockBast: BASTItem = {
    id: 'bast-test-1',
    woNumber: 'WO-BEL-2026-0082',
    woType: 'Splice Interconnection POP Mini',
    workType: 'Splicing FO Core 48 & Commissioning OTDR Test',
    releaseDate: '2026-10-04',
    startDate: '2026-10-04',
    finishDate: '2026-10-08',
    abdDate: '2026-10-08',
    coreConnectionDate: '2026-10-07',
    durationDays: 4,
    durasiDate: 4,
    estimatedDistanceMeters: 1200,
    totalDistanceMeters: 1195,
    statusBast: 'Submit',
    originLocation: 'POP Sentul City / OTB-01',
    originCoordinates: '-6.589124, 106.852318',
    destinationLocation: 'BTS Cijayanti / Closure CL-04',
    destinationCoordinates: '-6.594215, 106.861052',
    createdAt: '2026-10-04T08:00:00Z',
    updatedAt: '2026-10-08T08:00:00Z'
  };

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
      'POP Sentul City',
      '-6.589124, 106.852318',
      'BTS Cijayanti',
      '-6.594215, 106.861052',
      1195,
      'WO-BEL-2026-0082'
    );
    assert.ok(routeMap.startsWith('data:image/svg+xml;utf8,'));
    assert.ok(routeMap.includes('1.195%20Meter'));
  });

  it('generates visual SVG data URL for technical documents (APD, ABD, Core Conn)', () => {
    const apdVisual = generateVisualDocDataUrl(
      'APD (As-Planned Drawing)',
      'apd_sentul.pdf',
      'WO-BEL-2026-0082',
      'BAST-0082'
    );
    assert.ok(apdVisual.startsWith('data:image/svg+xml;utf8,'));
    assert.ok(apdVisual.includes('PT.%20BELACOM%20INDONESIA'));
  });

  it('ensureBastVisualImages guarantees all attachments have visual imageDataUrl', () => {
    const prepared = ensureBastVisualImages(mockBast);
    assert.ok(prepared.originPhotoFile?.imageDataUrl);
    assert.ok(prepared.destinationPhotoFile?.imageDataUrl);
    assert.ok(prepared.routeMapFile?.imageDataUrl);
  });

  it('buildBastWordHtml includes embedded visual img tags and official BAST headers', () => {
    const wordHtml = buildBastWordHtml(mockBast);
    assert.ok(wordHtml.includes('BERITA ACARA SERAH TERIMA PEKERJAAN (BAST)'));
    assert.ok(wordHtml.includes('WO-BEL-2026-0082'));
    assert.ok(wordHtml.includes('<img src="data:image/'));
    assert.ok(wordHtml.includes('TAGGING END TO END LOCATION'));
    assert.ok(wordHtml.includes('xmlns:w="urn:schemas-microsoft-com:office:word"'));
  });

  it('buildBastExcelHtml includes spreadsheet tables and visual img tags', () => {
    const excelHtml = buildBastExcelHtml(mockBast);
    assert.ok(excelHtml.includes('BERITA ACARA SERAH TERIMA PEKERJAAN (BAST)'));
    assert.ok(excelHtml.includes('xmlns:x="urn:schemas-microsoft-com:office:excel"'));
    assert.ok(excelHtml.includes('<img src="data:image/'));
  });

  it('handles multiple photo documentation files in Word and Excel exports', () => {
    const multiDocBast: BASTItem = {
      ...mockBast,
      fotoDokumentasiPdfs: [
        {
          id: 'doc-1',
          name: 'Foto_Splicing_Closure_1.jpg',
          sizeBytes: 1500000,
          uploadDate: '2026-10-04',
          imageDataUrl: 'data:image/jpeg;base64,mockImage1'
        },
        {
          id: 'doc-2',
          name: 'Foto_Splicing_Closure_2.jpg',
          sizeBytes: 1800000,
          uploadDate: '2026-10-04',
          imageDataUrl: 'data:image/jpeg;base64,mockImage2'
        },
        {
          id: 'doc-3',
          name: 'Pengujian_OPM_Result.jpg',
          sizeBytes: 2100000,
          uploadDate: '2026-10-05',
          imageDataUrl: 'data:image/jpeg;base64,mockImage3'
        }
      ]
    };

    const wordHtml = buildBastWordHtml(multiDocBast);
    assert.ok(wordHtml.includes('Foto_Splicing_Closure_1.jpg'));
    assert.ok(wordHtml.includes('Foto_Splicing_Closure_2.jpg'));
    assert.ok(wordHtml.includes('Pengujian_OPM_Result.jpg'));
    assert.ok(wordHtml.includes('Foto Dokumentasi Lapangan (1)'));
    assert.ok(wordHtml.includes('Foto Dokumentasi Lapangan (2)'));
    assert.ok(wordHtml.includes('Foto Dokumentasi Lapangan (3)'));

    const excelHtml = buildBastExcelHtml(multiDocBast);
    assert.ok(excelHtml.includes('Foto_Splicing_Closure_1.jpg'));
    assert.ok(excelHtml.includes('Foto_Splicing_Closure_2.jpg'));
    assert.ok(excelHtml.includes('Pengujian_OPM_Result.jpg'));
    assert.ok(excelHtml.includes('Foto Dokumentasi Splicing #1'));
    assert.ok(excelHtml.includes('Foto Dokumentasi Splicing #2'));
    assert.ok(excelHtml.includes('Foto Dokumentasi Splicing #3'));
  });
});
