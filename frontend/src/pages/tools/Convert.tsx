import { useState } from 'react';
import FileUploader, { UploadedFile } from '../../components/FileUploader';
import toast from 'react-hot-toast';

// Utilities for client-side conversions
async function arrayBufferFromFile(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}

async function wordToPdf(file: File): Promise<Blob> {
  const [{ default: jsPDF }, { default: html2canvas }, mammoth] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
    import('mammoth'),
  ]);

  const buffer = await arrayBufferFromFile(file);
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buffer });

  // Create an offscreen container to render HTML
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '794px'; // ~A4 width in px @96dpi
  container.style.padding = '24px';
  container.style.background = '#fff';
  container.innerHTML = html;
  document.body.appendChild(container);

  // Wait a tick for layout
  await new Promise((r) => setTimeout(r, 50));

  // Render to canvas
  const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff' });
  document.body.removeChild(container);

  // Prepare jsPDF A4
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Scale canvas to fit width and paginate by height
  const imgData = canvas.toDataURL('image/png');
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight <= pageHeight) {
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  } else {
    // Slice the canvas vertically into pages
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    const pageCanvas = document.createElement('canvas');
    const pageCtx = pageCanvas.getContext('2d');
    if (!pageCtx) throw new Error('Page canvas context not available');

    const pageHeightPx = Math.floor((pageHeight * canvas.width) / pageWidth);
    let renderedHeight = 0;
    let isFirstPage = true;

    while (renderedHeight < canvas.height) {
      const sliceHeight = Math.min(pageHeightPx, canvas.height - renderedHeight);
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
      pageCtx.drawImage(
        canvas,
        0,
        renderedHeight,
        canvas.width,
        sliceHeight,
        0,
        0,
        pageCanvas.width,
        pageCanvas.height
      );
      const sliceImg = pageCanvas.toDataURL('image/png');
      if (!isFirstPage) pdf.addPage();
      pdf.addImage(sliceImg, 'PNG', 0, 0, imgWidth, (sliceHeight * imgWidth) / canvas.width);
      isFirstPage = false;
      renderedHeight += sliceHeight;
    }
  }

  return pdf.output('blob');
}

async function imagesToPdf(files: File[]): Promise<Blob> {
  const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);

  const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  let first = true;
  for (const file of files) {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (e) => reject(e);
      image.src = URL.createObjectURL(file);
    });

    const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    const x = (pageWidth - w) / 2;
    const y = (pageHeight - h) / 2;

    if (!first) pdf.addPage();
    pdf.addImage(img, 'JPEG', x, y, w, h, undefined, 'FAST');
    first = false;

    URL.revokeObjectURL(img.src);
  }

  return pdf.output('blob');
}

type ConversionType = 'word-to-pdf' | 'pdf-to-word' | 'images-to-pdf' | 'pdf-to-images' | 'html-to-pdf' | 'pdf-to-text';

interface ConversionOption {
  type: ConversionType;
  label: string;
  description: string;
  accept?: Record<string, string[]>;
}

const conversionOptions: ConversionOption[] = [
  {
    type: 'word-to-pdf',
    label: 'Word → PDF',
    description: 'Convert .docx files to PDF',
    accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
  },
  {
    type: 'pdf-to-word',
    label: 'PDF → Word',
    description: 'Convert PDF to .docx (basic formatting)',
    accept: { 'application/pdf': ['.pdf'] },
  },
  {
    type: 'images-to-pdf',
    label: 'Images → PDF',
    description: 'Combine images into a PDF',
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
  },
  {
    type: 'pdf-to-images',
    label: 'PDF → Images',
    description: 'Convert each page to an image',
    accept: { 'application/pdf': ['.pdf'] },
  },
  {
    type: 'html-to-pdf',
    label: 'HTML → PDF',
    description: 'Convert HTML file to PDF',
    accept: { 'text/html': ['.html'] },
  },
  {
    type: 'pdf-to-text',
    label: 'PDF → Text',
    description: 'Extract plain text from PDF',
    accept: { 'application/pdf': ['.pdf'] },
  },
];

export default function Convert() {
  const [selectedType, setSelectedType] = useState<ConversionType | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFileSelect = async (files: UploadedFile[]) => {
    if (files.length === 0) return;

    if (selectedType === 'images-to-pdf' || selectedType === null) {
      setUploadedFiles([...uploadedFiles, ...files]);
      toast.success(`${files.length} file(s) added`);
    } else {
      setUploadedFiles(files.slice(0, 1));
      toast.success('File loaded');
    }
  };

  const handleConvert = async () => {
    if (!selectedType || uploadedFiles.length === 0) {
      toast.error('Please select conversion type and upload file(s)');
      return;
    }

    setProcessing(true);
    try {
      switch (selectedType) {
        case 'word-to-pdf': {
          const file = uploadedFiles[0].file;
          const blob = await wordToPdf(file);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name.replace(/\.docx$/i, '.pdf');
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Converted Word to PDF');
          break;
        }
        case 'pdf-to-word':
          toast.error('PDF to Word conversion requires server-side processing');
          break;
        case 'images-to-pdf': {
          const files = uploadedFiles.map((f) => f.file).sort((a, b) => a.name.localeCompare(b.name));
          const blob = await imagesToPdf(files);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `images_${Date.now()}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Created PDF from images');
          break;
        }
        case 'pdf-to-images':
          toast.error('PDF to images requires pdf.js rendering');
          break;
        case 'html-to-pdf':
          toast.error('HTML to PDF requires headless browser rendering');
          break;
        case 'pdf-to-text':
          toast.error('PDF text extraction requires pdf.js or OCR');
          break;
      }
    } catch (error) {
      toast.error(`Conversion error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const selectedOption = conversionOptions.find((opt) => opt.type === selectedType);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Convert Documents</h1>
          <p className="text-gray-600">
            Convert between PDF, Word, PowerPoint, images, HTML, and text formats.
          </p>
        </div>

        {/* Conversion Type Selection */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Select Conversion Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {conversionOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => {
                  setSelectedType(option.type);
                  setUploadedFiles([]);
                }}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedType === option.type
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">🔄</div>
                <div className="font-semibold mb-1">{option.label}</div>
                <div className="text-xs text-gray-600">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* File Upload */}
        {selectedType && (
          <div className="space-y-6">
            <FileUploader
              onFilesSelected={handleFileSelect}
              accept={selectedOption?.accept}
              multiple={selectedType === 'images-to-pdf'}
              maxSize={50 * 1024 * 1024}
            />

            {uploadedFiles.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">
                  {uploadedFiles.length} file(s) ready
                </h3>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{file.name}</span>
                      <button
                        onClick={() => setUploadedFiles(uploadedFiles.filter((f) => f.id !== file.id))}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleConvert}
                  disabled={processing}
                  className="btn-primary w-full mt-4 py-3"
                >
                  {processing ? 'Converting...' : 'Convert & Download'}
                </button>
              </div>
            )}
          </div>
        )}

        {selectedType && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            <strong>Note:</strong> Some conversions may require server-side processing. Word → PDF and Images → PDF are performed in your browser.
          </div>
        )}
      </div>
    </div>
  );
}

