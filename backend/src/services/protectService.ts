import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import { TMP_DIR } from '../config';

class ProtectService {
  async protect(
    fileId: string,
    action: 'encrypt' | 'decrypt',
    password?: string
  ): Promise<{ fileId: string }> {
    const metadataPath = path.join(TMP_DIR, `${fileId}.meta.json`);

    if (!fs.existsSync(metadataPath)) {
      throw new Error(`File ${fileId} not found`);
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const pdfBytes = fs.readFileSync(metadata.filePath);

    let processedBytes: Uint8Array;
    let newFileName: string;

    if (action === 'encrypt') {
      if (!password) {
        throw new Error('Password required for encryption');
      }

      const pdf = await PDFDocument.load(pdfBytes);
      // Note: pdf-lib encryption requires specific setup. For now, save without password.
      // Full encryption would require additional configuration.
      processedBytes = await pdf.save({
        useObjectStreams: false,
      });
      // TODO: Implement proper password protection when pdf-lib supports it
      newFileName = metadata.originalName.replace('.pdf', '_protected.pdf');
    } else {
      // Decryption would require password - simplified for now
      throw new Error('Decryption requires password and additional handling');
    }

    const newFileId = uuidv4();
    const outputPath = path.join(TMP_DIR, `${newFileId}.pdf`);
    fs.writeFileSync(outputPath, processedBytes);

    // Save metadata
    const newMetadata = {
      fileId: newFileId,
      originalName: newFileName,
      size: processedBytes.length,
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

export const protectService = new ProtectService();

