import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import { TMP_DIR } from '../config';

class SplitService {
  async split(
    fileId: string,
    ranges: Array<{ start: number; end: number }>
  ): Promise<{ fileId: string }> {
    const metadataPath = path.join(TMP_DIR, `${fileId}.meta.json`);

    if (!fs.existsSync(metadataPath)) {
      throw new Error(`File ${fileId} not found`);
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const pdfBytes = fs.readFileSync(metadata.filePath);
    const pdf = await PDFDocument.load(pdfBytes);

    // For simplicity, extract first range (can be extended for multiple outputs)
    const range = ranges[0];
    const pageIndices = Array.from(
      { length: range.end - range.start + 1 },
      (_, i) => range.start + i
    );

    const newPDF = await PDFDocument.create();
    const pages = await newPDF.copyPages(pdf, pageIndices);
    pages.forEach((page) => newPDF.addPage(page));

    const newFileId = uuidv4();
    const outputPath = path.join(TMP_DIR, `${newFileId}.pdf`);
    const newBytes = await newPDF.save();
    fs.writeFileSync(outputPath, newBytes);

    // Save metadata
    const newMetadata = {
      fileId: newFileId,
      originalName: `split_${Date.now()}.pdf`,
      size: newBytes.length,
      mimetype: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      filePath: outputPath,
    };
    fs.writeFileSync(
      path.join(TMP_DIR, `${newFileId}.meta.json`),
      JSON.stringify(newMetadata)
    );

    return { fileId: newFileId };
  }
}

export const splitService = new SplitService();

