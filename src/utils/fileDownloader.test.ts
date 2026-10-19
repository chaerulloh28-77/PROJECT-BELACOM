import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  buildPdfRawContent, 
  generatePdfBase64, 
  prepareAttachmentsForResend 
} from './fileDownloader.ts';

test('buildPdfRawContent generates valid PDF header and structure', () => {
  const content = buildPdfRawContent('APD_TEST.pdf');
  assert.equal(content.startsWith('%PDF-1.5'), true);
  assert.equal(content.includes('PT. BELACOM INDONESIA TELECOM'), true);
  assert.equal(content.includes('APD_TEST.pdf'), true);
  assert.equal(content.endsWith('%%EOF'), true);
});

test('generatePdfBase64 returns valid non-empty base64 string', () => {
  const base64 = generatePdfBase64('SURAT_RFS.pdf');
  assert.equal(typeof base64, 'string');
  assert.equal(base64.length > 50, true);
  // Verify it decodes back to PDF header
  const decoded = Buffer.from(base64, 'base64').toString('utf-8');
  assert.equal(decoded.startsWith('%PDF-1.5'), true);
});

test('prepareAttachmentsForResend maps files into filename and content payload', async () => {
  const input = [
    { name: 'APD_RELOKASI.pdf' },
    { name: 'BOQ_SURVEY' }
  ];

  const prepared = await prepareAttachmentsForResend(input);
  assert.equal(prepared.length, 2);
  assert.equal(prepared[0].filename, 'APD_RELOKASI.pdf');
  assert.equal(prepared[1].filename, 'BOQ_SURVEY.pdf');
  assert.equal(typeof prepared[0].content, 'string');
  assert.equal(prepared[0].content.length > 50, true);
});
