import { createRequire } from 'module';
const require_ = createRequire(import.meta.url);
try {
  const pdf = require_('pdf-parse');
  console.log('pdf-parse OK:', typeof pdf);
} catch(e) { console.error('pdf-parse FAIL:', e.message); }

try {
  const mammoth = require_('mammoth');
  console.log('mammoth OK:', typeof mammoth);
} catch(e) { console.error('mammoth FAIL:', e.message); }

try {
  const XLSX = require_('xlsx');
  console.log('xlsx OK:', typeof XLSX);
} catch(e) { console.error('xlsx FAIL:', e.message); }

console.log('All checks done');
