export function buildImageDocText(fileName, ocrText) {
  const cleanedText = (ocrText || '').trim();

  if (!cleanedText) {
    return `[Image upload: ${fileName}]\n\nOCR could not find readable text in this image. Amanda may need to describe the image or upload a document/PDF version if she wants Spring to reason about non-text visual details.`;
  }

  return `[Image upload: ${fileName}]\n\nOCR text extracted from the image:\n\`\`\`\n${cleanedText}\n\`\`\``;
}
