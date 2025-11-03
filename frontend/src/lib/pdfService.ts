import { PDFDocument, PDFPage, PDFFont, rgb, PDFImage } from 'pdf-lib';
import { saveAs } from 'file-saver';

/**
 * Load a PDF from a file
 */
export async function loadPDF(file: File): Promise<PDFDocument> {
  const arrayBuffer = await file.arrayBuffer();
  return PDFDocument.load(arrayBuffer);
}

/**
 * Load a PDF from bytes
 */
export async function loadPDFFromBytes(bytes: Uint8Array): Promise<PDFDocument> {
  return PDFDocument.load(bytes);
}

/**
 * Save PDF to file
 */
export async function savePDF(pdfDoc: PDFDocument, filename: string): Promise<void> {
  const pdfBytes = await pdfDoc.save();
  // Convert Uint8Array to ArrayBuffer slice for proper Blob creation
  const buffer: ArrayBuffer = pdfBytes.buffer instanceof ArrayBuffer 
    ? pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength)
    : new Uint8Array(pdfBytes).buffer;
  const blob = new Blob([buffer], { type: 'application/pdf' });
  saveAs(blob, filename);
}

/**
 * Get PDF metadata
 */
export async function getPDFMetadata(file: File): Promise<{ pages: number; size: number }> {
  const pdf = await loadPDF(file);
  return {
    pages: pdf.getPageCount(),
    size: file.size,
  };
}

/**
 * Extract text from PDF (client-side, basic)
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  // This is a simplified version - for better results use pdf.js or server-side OCR
  const pdf = await loadPDF(file);
  const pageCount = pdf.getPageCount();
  let text = '';

  // Note: pdf-lib doesn't extract text well. This is a placeholder.
  // For real text extraction, use pdf.js or server-side processing
  for (let i = 0; i < pageCount; i++) {
    text += `Page ${i + 1}\n[Text extraction requires pdf.js or server-side OCR]\n\n`;
  }

  return text;
}

export { PDFDocument, PDFPage, PDFFont, rgb, PDFImage };