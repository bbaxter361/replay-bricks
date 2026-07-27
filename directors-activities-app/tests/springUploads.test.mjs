import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Spring chat includes an upload control for files and images', async () => {
  const source = await readFile(new URL('../src/pages/SpringAssistant.jsx', import.meta.url), 'utf8');

  assert.match(source, /type="file"/);
  assert.match(source, /accept="image\/\*,\.pdf,\.doc,\.docx,\.xls,\.xlsx,\.csv,\.txt,\.rtf,\.md"/);
  assert.match(source, /Attach file/);
  assert.match(source, /uploadSpringFile/);
});

test('Spring API can upload a file and pass extracted text into chat', async () => {
  const source = await readFile(new URL('../src/services/springApi.js', import.meta.url), 'utf8');

  assert.match(source, /export async function uploadSpringFile/);
  assert.match(source, /formData\.append\('file', file\)/);
  assert.match(source, /springApiFetch\('\/api\/read-file'/);
  assert.match(source, /docText/);
  assert.match(source, /fileName/);
});

test('Spring keeps extracted file context in chat history for follow-up messages', async () => {
  const source = await readFile(new URL('../src/pages/SpringAssistant.jsx', import.meta.url), 'utf8');

  assert.match(source, /fileContextMessage/);
  assert.match(source, /appendSpringMessage', message: fileContextMessage/);
  assert.match(source, /historyForApi = \[\.\.\.state\.springMessages, userMessage, fileContextMessage\]/);
  assert.match(source, /hidden: true/);
  assert.match(source, /state\.springMessages\.filter\(\(item\) => !item\.hidden\)/);
});

test('Spring proxy allows multipart file upload to the live read-file endpoint', async () => {
  const source = await readFile(new URL('../netlify/functions/spring-proxy.js', import.meta.url), 'utf8');

  assert.match(source, /'\/api\/read-file'/);
  assert.match(source, /req\.arrayBuffer\(\)/);
  assert.match(source, /content-type/i);
  assert.match(source, /'\/api\/spring-proxy\/read-file'/);
});

test('Spring quick ask is available from the app shell', async () => {
  const layout = await readFile(new URL('../src/components/TopBar.jsx', import.meta.url), 'utf8');
  const quickAsk = await readFile(new URL('../src/components/SpringQuickAsk.jsx', import.meta.url), 'utf8');

  assert.match(layout, /SpringQuickAsk/);
  assert.match(quickAsk, /buildSpringSkillPrompt/);
  assert.match(quickAsk, /planLocalSpringResponse/);
  assert.match(quickAsk, /applySpringActionsToDispatch/);
});
