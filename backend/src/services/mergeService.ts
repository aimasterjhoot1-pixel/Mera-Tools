import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import { TMP_DIR } from '../config';

class MergeService {
  async merge(fileIds: string[], options?: { order?: number[] }): Promise<{ fileId: string }> {
    const mergedPDF = await PDFDocument.create();
    const order = options?.order || fileIds.map((_, i) => i);

    for (const index of order) {
      const fileId = fileIds[index];
      const metadataPath = path.join(TMP_DIR, `${fileId}.meta.json`);

      if (!fs.existsSync(metadataPath)) {
        throw new Error(`File ${fileId} not found`);
      }

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      const pdfBytes = fs.readFileSync(metadata.filePath);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = await mergedPDF.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => mergedPDF.addPage(page));
    }

    const newFileId = uuidv4();
    const outputPath = path.join(TMP_DIR, `${newFileId}.pdf`);
    const mergedBytes = await mergedPDF.save();
    fs.writeFileSync(outputPath, mergedBytes);

    // Save metadata
    const newMetadata = {
      fileId: newFileId,
      originalName: `merged_${Date.now()}.pdf`,
      size: mergedBytes.length,
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

export const mergeService = new MergeService();

