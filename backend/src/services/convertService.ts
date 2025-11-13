import fs from 'fs';
import path from 'path';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { v4 as uuidv4 } from 'uuid';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { TMP_DIR } from '../config';

// Set up pdfjs-dist worker (use built-in in Node.js)
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.js';

class ConvertService {
  /**
   * Extract text from PDF using pdfjs-dist
   */
  private async extractTextFromPDF(pdfBytes: Uint8Array): Promise<string> {
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => {
          // Check if item has 'str' property (TextItem type)
          if ('str' in item && typeof item.str === 'string') {
            return item.str;
          }
          return '';
        })
        .join(' ');
      fullText += `Page ${i}:\n${pageText}\n\n`;
    }

    return fullText.trim();
  }

  /**
   * Convert PDF to Word document
   */
  private async pdfToWord(pdfBytes: Uint8Array): Promise<Buffer> {
    const text = await this.extractTextFromPDF(pdfBytes);
    
    // Split text into paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    
    // Create Word document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs.map((para) => {
            // Check if it's a page header
            if (para.startsWith('Page ')) {
              return new Paragraph({
                text: para,
                heading: HeadingLevel.HEADING_2,
              });
            }
            // Regular paragraph
            return new Paragraph({
              children: [
                new TextRun({
                  text: para,
                  font: 'Calibri',
                  size: 24, // 12pt in half-points
                }),
              ],
            });
          }),
        },
      ],
    });

    // Generate Word document buffer
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  /**
   * Convert PDF to Text
   */
  private async pdfToText(pdfBytes: Uint8Array): Promise<string> {
    return await this.extractTextFromPDF(pdfBytes);
  }

  /**
   * Main convert method
   */
  async convert(
    fileId: string,
    targetFormat: string,
    _options?: Record<string, unknown>
  ): Promise<{ fileId: string; format?: string }> {
    const metadataPath = path.join(TMP_DIR, `${fileId}.meta.json`);

    if (!fs.existsSync(metadataPath)) {
      throw new Error(`File ${fileId} not found`);
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const pdfBytes = fs.readFileSync(metadata.filePath);

    let outputBuffer: Buffer;
    let outputExtension: string;
    let outputMimeType: string;

    switch (targetFormat) {
      case 'pdf-to-word':
      case 'docx': {
        outputBuffer = await this.pdfToWord(pdfBytes);
        outputExtension = '.docx';
        outputMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      }
      case 'pdf-to-text':
      case 'txt': {
        const text = await this.pdfToText(pdfBytes);
        outputBuffer = Buffer.from(text, 'utf-8');
        outputExtension = '.txt';
        outputMimeType = 'text/plain';
        break;
      }
      default:
        throw new Error(`Unsupported conversion format: ${targetFormat}`);
    }

    // Save converted file
    const newFileId = uuidv4();
    const outputPath = path.join(TMP_DIR, `${newFileId}${outputExtension}`);
    fs.writeFileSync(outputPath, outputBuffer);

    // Save metadata
    const newMetadata = {
      fileId: newFileId,
      originalName: metadata.originalName.replace(/\.pdf$/i, outputExtension),
      size: outputBuffer.length,
      mimetype: outputMimeType,
      uploadedAt: new Date().toISOString(),
      filePath: outputPath,
    };
    fs.writeFileSync(
      path.join(TMP_DIR, `${newFileId}.meta.json`),
      JSON.stringify(newMetadata)
    );

    return { fileId: newFileId, format: outputExtension };
  }
}

export const convertService = new ConvertService();

