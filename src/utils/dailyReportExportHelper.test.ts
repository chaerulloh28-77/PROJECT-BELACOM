import test from 'node:test';
import assert from 'node:assert';
import {
  generateDailyReportGeotagPhotoDataUrl,
  generateDailyReportRouteMapDataUrl,
  generateDailyReportDocDataUrl,
  ensureDailyReportVisualImages,
  buildDailyReportWordHtml,
  buildDailyReportExcelHtml,
  buildDailyReportRekapExcelHtml
} from './dailyReportExportHelper';
import { DailyReportItem } from '../types';

const mockReport: DailyReportItem = {
  id: 'dr-test-01',
  woType: 'Plan Network Interconection POP',
  monthReleaseWo: '2026-10',
  assignment: 'Jabo 1',
  team: 'ABR 03',
  statusWo: 'In Progress',
  pic: 'Ahmad Fauzi',
  workType: 'Penarikan FO 24 Core & Splicing',
  releaseDate: '2026-10-20',
  startDate: '2026-10-20',
  finishDate: '2026-10-25',
  durationDays: 6,
  woNumber: 'WO-BEL-2026-TEST',
  estimatedDistanceMeters: 1800,
  totalDistanceMeters: 1780,
  statusTeamProject: 'On Schedule',
  pathLengthMeters: 1780,
  originLocation: 'POP Sentul City / OTB-01',
  originCoordinates: '-6.589124, 106.852318',
  destinationLocation: 'BTS Cijayanti / Closure CL-04',
  destinationCoordinates: '-6.594215, 106.861052',
  remarks: 'Selesai splicing 24 core.',
  documentation: {},
  createdAt: '2026-10-20',
  updatedAt: '2026-10-25'
};

test('dailyReportExportHelper tests', async (t) => {
  await t.test('generates valid geotag photo svg', () => {
    const url = generateDailyReportGeotagPhotoDataUrl(
      'POP Sentul City',
      '-6.589124, 106.852318',
      'WO-BEL-2026-TEST',
      'origin',
      'ABR 03',
      'Ahmad Fauzi'
    );
    assert.ok(url.startsWith('data:image/svg+xml;utf8,'));
    assert.ok(url.includes('GEOTAG'));
  });

  await t.test('generates valid route map svg', () => {
    const url = generateDailyReportRouteMapDataUrl(
      'POP Sentul City',
      '-6.589124, 106.852318',
      'BTS Cijayanti',
      '-6.594215, 106.861052',
      1780,
      'WO-BEL-2026-TEST'
    );
    assert.ok(url.startsWith('data:image/svg+xml;utf8,'));
    assert.ok(url.includes('PETA'));
  });

  await t.test('generates valid doc data url', () => {
    const url = generateDailyReportDocDataUrl(
      'Foto Closure Doc',
      'foto_closure.jpg',
      'WO-BEL-2026-TEST',
      'Ahmad Fauzi'
    );
    assert.ok(url.startsWith('data:image/svg+xml;utf8,'));
    assert.ok(url.includes('CLOSURE'));
  });

  await t.test('ensureDailyReportVisualImages populates all 8 visual fields', () => {
    const enriched = ensureDailyReportVisualImages(mockReport);
    assert.ok(enriched.originPhotoFile?.imageDataUrl);
    assert.ok(enriched.destinationPhotoFile?.imageDataUrl);
    assert.ok(enriched.routeMapFile?.imageDataUrl);
    assert.ok(enriched.documentation?.fotoClosurePdf?.imageDataUrl);
    assert.ok(enriched.documentation?.opmPdf?.imageDataUrl);
    assert.ok(enriched.documentation?.olsPdf?.imageDataUrl);
    assert.ok(enriched.documentation?.btsPdf?.imageDataUrl);
    assert.ok(enriched.documentation?.otdrPdf?.imageDataUrl);
  });

  await t.test('buildDailyReportWordHtml contains headers, sections, and images', () => {
    const html = buildDailyReportWordHtml(mockReport);
    assert.ok(html.includes('PT. BELACOM INDONESIA'));
    assert.ok(html.includes('WO-BEL-2026-TEST'));
    assert.ok(html.includes('TAGGING END TO END LOCATION'));
    assert.ok(html.includes('18. DOKUMEN &amp; FOTO DOKUMENTASI'));
    assert.ok(html.includes('width="260" height="180"'));
  });

  await t.test('buildDailyReportExcelHtml contains proper table and cell heights', () => {
    const html = buildDailyReportExcelHtml(mockReport);
    assert.ok(html.includes('x:ExcelWorkbook'));
    assert.ok(html.includes('height="165"'));
    assert.ok(html.includes('width="230"'));
  });

  await t.test('buildDailyReportRekapExcelHtml builds multi-row rekap table', () => {
    const html = buildDailyReportRekapExcelHtml([mockReport]);
    assert.ok(html.includes('REKAPITULASI DAILY REPORT DENGAN GAMBAR VISUAL'));
    assert.ok(html.includes('WO-BEL-2026-TEST'));
    assert.ok(html.includes('Foto Site A'));
  });
});
