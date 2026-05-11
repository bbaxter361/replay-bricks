import assert from 'node:assert/strict';
import test from 'node:test';

import { buildImageDocText } from './imageUploadText.js';

test('packages OCR text from an uploaded image for text-only AI models', () => {
  const text = buildImageDocText('calendar.png', '  Morning stretch at 10 AM  ');

  assert.match(text, /calendar\.png/);
  assert.match(text, /Morning stretch at 10 AM/);
  assert.doesNotMatch(text, /base64|image_url/i);
});

test('packages an honest no-text note when OCR finds no readable text', () => {
  const text = buildImageDocText('photo.jpg', '');

  assert.match(text, /photo\.jpg/);
  assert.match(text, /could not find readable text/i);
});
