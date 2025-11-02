import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import { TMP_DIR } from '../config';

type Quality = 'high' | 'medium' | 'low';

class CompressService {
  async compress(fileId: string, quality: Quality): Promise<{ fileId: string }> {
    const metadataPath = path.join(TMP_DIR, `${fileId}.meta.json`);

    if (!fs.existsSync(metadataPath)) {
      throw new Error(`File ${fileId} not found`);
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const pdfBytes = fs.readFileSync(metadata.filePath);
    const pdf = await PDFDocument.load(pdfBytes);

      // Simple compression (in production, use advanced compression libraries)
      const saveOptions: { useObjectStreams?: boolean } = {
        useObjectStreams: quality === 'low',
      };

    const compressedBytes = await pdf.save(saveOptions);

    const newFileId = uuidv4();
    const outputPath = path.join(TMP_DIR, `${newFileId}.pdf`);
    fs.writeFileSync(outputPath, compressedBytes);

    // Save metadata
    const newMetadata = {
      fileId: newFileId,
      originalName: metadata.originalName.replace('.pdf', '_compressed.pdf'),
      size: compressedBytes.length,
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

export const compressService = new CompressService();

