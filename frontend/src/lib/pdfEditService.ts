import { PDFDocument, PDFFont, rgb, PDFImage } from 'pdf-lib';
import { saveAs } from 'file-saver';

export interface EditOperation {
  type: 'text' | 'image' | 'draw' | 'highlight';
  page: number;
  data: Record<string, unknown>;
  id: string;
  timestamp: number;
}

export class PDFEditor {
  private pdf: PDFDocument | null = null;
  private operations: EditOperation[] = [];
  private undoStack: EditOperation[][] = [];
  private redoStack: EditOperation[][] = [];

  async loadPDF(file: File): Promise<void> {
    const arrayBuffer = await file.arrayBuffer();
    this.pdf = await PDFDocument.load(arrayBuffer);
    this.operations = [];
    this.undoStack = [];
    this.redoStack = [];
  }

  async loadPDFFromBytes(bytes: Uint8Array): Promise<void> {
    this.pdf = await PDFDocument.load(bytes);
    this.operations = [];
    this.undoStack = [];
    this.redoStack = [];
  }

  private saveState(): void {
    if (this.operations.length > 0) {
      this.undoStack.push([...this.operations]);
      this.redoStack = []; // Clear redo stack on new operation
    }
  }

  /**
   * Add text to PDF
   */
  async addText(
    pageIndex: number,
    text: string,
    x: number,
    y: number,
    options?: {
      size?: number;
      color?: { r: number; g: number; b: number };
      font?: PDFFont;
    }
  ): Promise<string> {
    if (!this.pdf) throw new Error('PDF not loaded');

    this.saveState();

    const page = this.pdf.getPage(pageIndex);
    const font = options?.font || await this.pdf.embedFont('Helvetica');
    const color = options?.color || { r: 0, g: 0, b: 0 };

    page.drawText(text, {
      x,
      y,
      size: options?.size || 12,
      font,
      color: rgb(color.r, color.g, color.b),
    });

    const id = `text-${Date.now()}-${Math.random()}`;
    this.operations.push({
      type: 'text',
      page: pageIndex,
      data: { text, x, y, options },
      id,
      timestamp: Date.now(),
    });

    return id;
  }

  /**
   * Add image to PDF
   */
  async addImage(
    pageIndex: number,
    imageFile: File,
    x: number,
    y: number,
    options?: { width?: number; height?: number }
  ): Promise<string> {
    if (!this.pdf) throw new Error('PDF not loaded');

    this.saveState();

    const page = this.pdf.getPage(pageIndex);
    const imageBytes = await imageFile.arrayBuffer();
    let image: PDFImage;

    if (imageFile.type === 'image/png') {
      image = await this.pdf.embedPng(imageBytes);
    } else if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
      image = await this.pdf.embedJpg(imageBytes);
    } else {
      throw new Error('Unsupported image type');
    }

    const width = options?.width || image.width;
    const height = options?.height || image.height;

    page.drawImage(image, {
      x,
      y,
      width,
      height,
    });

    const id = `image-${Date.now()}-${Math.random()}`;
    this.operations.push({
      type: 'image',
      page: pageIndex,
      data: { x, y, options, imageData: await imageFile.arrayBuffer() },
      id,
      timestamp: Date.now(),
    });

    return id;
  }

  /**
   * Add highlight annotation
   */
  async addHighlight(
    pageIndex: number,
    x: number,
    y: number,
    width: number,
    height: number,
    color?: { r: number; g: number; b: number }
  ): Promise<string> {
    if (!this.pdf) throw new Error('PDF not loaded');

    this.saveState();

    const page = this.pdf.getPage(pageIndex);
    const highlightColor = color || { r: 1, g: 1, b: 0 }; // Yellow default

    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: rgb(highlightColor.r, highlightColor.g, highlightColor.b),
      opacity: 0.5,
    });

    const id = `highlight-${Date.now()}-${Math.random()}`;
    this.operations.push({
      type: 'highlight',
      page: pageIndex,
      data: { x, y, width, height, color: highlightColor },
      id,
      timestamp: Date.now(),
    });

    return id;
  }

  /**
   * Undo last operation
   */
  undo(): boolean {
    if (this.undoStack.length === 0) return false;

    const lastState = this.undoStack.pop()!;
    this.redoStack.push([...this.operations]);
    this.operations = lastState;
    return true;
  }

  /**
   * Redo last undone operation
   */
  redo(): boolean {
    if (this.redoStack.length === 0) return false;

    const redoState = this.redoStack.pop()!;
    this.undoStack.push([...this.operations]);
    this.operations = redoState;
    return true;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getOperations(): EditOperation[] {
    return [...this.operations];
  }

  /**
   * Export PDF
   */
  async export(filename: string = 'edited.pdf'): Promise<void> {
    if (!this.pdf) throw new Error('PDF not loaded');

    const pdfBytes = await this.pdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, filename);
  }

  /**
   * Get PDF bytes
   */
  async getPDFBytes(): Promise<Uint8Array> {
    if (!this.pdf) throw new Error('PDF not loaded');
    return this.pdf.save();
  }

  getPageCount(): number {
    if (!this.pdf) return 0;
    return this.pdf.getPageCount();
  }
}

