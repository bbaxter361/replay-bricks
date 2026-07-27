import test from 'node:test';
import assert from 'node:assert/strict';
import { buildUploadedDocText, isImageFile, isPdfFile } from '../src/utils/uploadReader.js';

test('detects image uploads by mime type and extension', () => {
  assert.equal(isImageFile({ type: 'image/png', name: 'scan.bin' }), true);
  assert.equal(isImageFile({ type: '', name: 'calendar.JPG' }), true);
  assert.equal(isImageFile({ type: 'application/pdf', name: 'calendar.pdf' }), false);
});

test('detects PDF uploads by mime type and extension', () => {
  assert.equal(isPdfFile({ type: 'application/pdf', name: 'scan.bin' }), true);
  assert.equal(isPdfFile({ type: '', name: 'calendar.PDF' }), true);
  assert.equal(isPdfFile({ type: 'image/png', name: 'calendar.png' }), false);
});

test('packages OCR text so Spring can read images and scanned PDFs', () => {
  const docText = buildUploadedDocText({
    fileName: 'calendar-scan.png',
    extractedText: '10:00 Chair Yoga\n2:00 Bingo',
    source: 'ocr',
  });

  assert.match(docText, /calendar-scan\.png/);
  assert.match(docText, /OCR text extracted/);
  assert.match(docText, /Chair Yoga/);
  assert.match(docText, /Bingo/);
});

test('packages an honest no-text upload note', () => {
  const docText = buildUploadedDocText({
    fileName: 'blurry-photo.jpg',
    extractedText: '',
    source: 'ocr',
    warning: 'Image OCR did not find readable text.',
  });

  assert.match(docText, /could not find readable text/);
  assert.match(docText, /clearer image/);
});
