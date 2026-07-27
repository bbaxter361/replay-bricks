export function buildUploadedDocText({ fileName, extractedText, source = 'file', warning = '' }) {
  const cleanText = String(extractedText || '').trim();
  const label = source === 'ocr' ? 'OCR text extracted from the upload' : 'Text extracted from the upload';
  const warningText = warning ? `\n\nWarning: ${warning}` : '';

  if (!cleanText) {
    return `[Upload: ${fileName}]${warningText}\n\nSpring could not find readable text in this upload. If this is a photo or scanned PDF, try a clearer image with higher contrast or crop to the page content.`;
  }

  return `[Upload: ${fileName}]${warningText}\n\n${label}:\n\`\`\`\n${cleanText}\n\`\`\``;
}

export function isImageFile(file) {
  return Boolean(file?.type?.startsWith('image/')) || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file?.name || '');
}

export function isPdfFile(file) {
  return file?.type === 'application/pdf' || /\.pdf$/i.test(file?.name || '');
}

async function createOcrWorker() {
  const { createWorker } = await import('tesseract.js');
  return createWorker('eng');
}

async function recognizeImageSource(source) {
  const worker = await createOcrWorker();
  try {
    const result = await worker.recognize(source);
    return result?.data?.text || '';
  } finally {
    await worker.terminate();
  }
}

export async function extractImageText(file) {
  return recognizeImageSource(file);
}

export async function extractScannedPdfText(file, { maxPages = 4 } = {}) {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const workerInstance = await createOcrWorker();
  const pages = [];

  try {
    const pageCount = Math.min(pdf.numPages, maxPages);
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvasContext: context, viewport }).promise;
      const result = await workerInstance.recognize(canvas);
      const text = result?.data?.text?.trim();
      if (text) pages.push(`--- PDF page ${pageNumber} OCR ---\n${text}`);
    }
  } finally {
    await workerInstance.terminate();
    await pdf.destroy();
  }

  return pages.join('\n\n');
}
