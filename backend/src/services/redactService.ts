import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import { TMP_DIR } from '../config';

class RedactService {
  async redact(
    fileId: string,
    redactions: Array<{
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }>
  ): Promise<{ fileId: string }> {
    const metadataPath = path.join(TMP_DIR, `${fileId}.meta.json`);

    if (!fs.existsSync(metadataPath)) {
      throw new Error(`File ${fileId} not found`);
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const pdfBytes = fs.readFileSync(metadata.filePath);
    const pdf = await PDFDocument.load(pdfBytes);

    // Apply redactions
    redactions.forEach((redaction) => {
      const page = pdf.getPage(redaction.page);
      page.drawRectangle({
        x: redaction.x,
        y: redaction.y,
        width: redaction.width,
        height: redaction.height,
        color: rgb(0, 0, 0),
      });
    });

    const newFileId = uuidv4();
    const outputPath = path.join(TMP_DIR, `${newFileId}.pdf`);
    const redactedBytes = await pdf.save();
    fs.writeFileSync(outputPath, redactedBytes);

    // Save metadata
    const newMetadata = {
      fileId: newFileId,
      originalName: metadata.originalName.replace('.pdf', '_redacted.pdf'),
      size: redactedBytes.length,
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

export const redactService = new RedactService();

