import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import { TMP_DIR } from '../config';

class SignService {
  async addSignature(
    fileId: string,
    signature: string, // base64
    page: number,
    x: number,
    y: number,
    scale: number
  ): Promise<{ fileId: string }> {
    const metadataPath = path.join(TMP_DIR, `${fileId}.meta.json`);

    if (!fs.existsSync(metadataPath)) {
      throw new Error(`File ${fileId} not found`);
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const pdfBytes = fs.readFileSync(metadata.filePath);
    const pdf = await PDFDocument.load(pdfBytes);

    // Decode base64 signature
    const signatureBytes = Buffer.from(signature.split(',')[1] || signature, 'base64');
    const signatureImage = await pdf.embedPng(signatureBytes).catch(() =>
      pdf.embedJpg(signatureBytes)
    );

    const pdfPage = pdf.getPage(page);
    pdfPage.drawImage(signatureImage, {
      x,
      y,
      width: signatureImage.width * scale,
      height: signatureImage.height * scale,
    });

    const newFileId = uuidv4();
    const outputPath = path.join(TMP_DIR, `${newFileId}.pdf`);
    const signedBytes = await pdf.save();
    fs.writeFileSync(outputPath, signedBytes);

    // Save metadata
    const newMetadata = {
      fileId: newFileId,
      originalName: metadata.originalName.replace('.pdf', '_signed.pdf'),
      size: signedBytes.length,
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

export const signService = new SignService();

