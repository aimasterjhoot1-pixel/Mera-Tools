import fs from 'fs';
import path from 'path';
import { TMP_DIR } from '../config';

class OCRService {
  async ocr(fileId: string, _options?: { language?: string }): Promise<{ text: string }> {
    const metadataPath = path.join(TMP_DIR, `${fileId}.meta.json`);

    if (!fs.existsSync(metadataPath)) {
      throw new Error(`File ${fileId} not found`);
    }

    // OCR processing would require Tesseract.js or server-side Tesseract
    // This is a placeholder - in production, implement actual OCR
    throw new Error('OCR processing requires Tesseract.js integration (server-side or WASM)');
  }
}

export const ocrService = new OCRService();

