import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import { TMP_DIR } from '../config';

class FormService {
  async fillForm(fileId: string, fields: Record<string, unknown>): Promise<{ fileId: string }> {
    const metadataPath = path.join(TMP_DIR, `${fileId}.meta.json`);

    if (!fs.existsSync(metadataPath)) {
      throw new Error(`File ${fileId} not found`);
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const pdfBytes = fs.readFileSync(metadata.filePath);
    const pdf = await PDFDocument.load(pdfBytes);

    const form = pdf.getForm();
    Object.entries(fields).forEach(([fieldName, value]) => {
      try {
        const field = form.getTextField(fieldName);
        field.setText(String(value));
      } catch (error) {
        console.warn(`Field ${fieldName} not found or not editable`);
      }
    });

    form.flatten();

    const newFileId = uuidv4();
    const outputPath = path.join(TMP_DIR, `${newFileId}.pdf`);
    const filledBytes = await pdf.save();
    fs.writeFileSync(outputPath, filledBytes);

    // Save metadata
    const newMetadata = {
      fileId: newFileId,
      originalName: metadata.originalName.replace('.pdf', '_filled.pdf'),
      size: filledBytes.length,
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

export const formService = new FormService();

