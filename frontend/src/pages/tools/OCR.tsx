import { useState } from 'react';
import FileUploader, { UploadedFile } from '../../components/FileUploader';
import toast from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function OCR() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [language, setLanguage] = useState('eng');
  const [progress, setProgress] = useState({ status: '', progress: 0 });

  const handleFileSelect = async (files: UploadedFile[]) => {
    if (files.length === 0) return;
    setUploadedFile(files[0]);
    setExtractedText('');
    toast.success('File loaded');
  };

  // Convert PDF page to image
  const pdfPageToImage = async (pdf: any, pageNum: number): Promise<string> => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas context not available');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Convert canvas to data URL
    return canvas.toDataURL('image/png');
  };

  const handleOCR = async () => {
    if (!uploadedFile) return;

    setProcessing(true);
    setExtractedText('');
    setProgress({ status: 'Initializing OCR...', progress: 0 });
    
    try {
      // Load Tesseract.js
      const { createWorker } = await import('tesseract.js');
      setProgress({ status: 'Loading OCR engine...', progress: 10 });
      const worker = await createWorker(language);
      setProgress({ status: 'OCR engine loaded', progress: 20 });

      let fullText = '';
      const file = uploadedFile.file;

      // Check if file is PDF
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setProgress({ status: 'Processing PDF...', progress: 30 });
        
        // Convert PDF to images
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        setProgress({ status: `Processing ${numPages} page(s)...`, progress: 40 });

        // Process each page
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          setProgress({ 
            status: `Processing page ${pageNum} of ${numPages}...`, 
            progress: 40 + (pageNum / numPages) * 50 
          });

          // Convert PDF page to image
          const imageDataUrl = await pdfPageToImage(pdf, pageNum);
          
          // Perform OCR on the image
          const { data: { text } } = await worker.recognize(imageDataUrl);
          
          fullText += `\n\n--- Page ${pageNum} ---\n\n${text}`;
        }
      } else {
        // Process image directly
        setProgress({ status: 'Processing image...', progress: 50 });
        const { data: { text } } = await worker.recognize(file);
        fullText = text;
      }

      setProgress({ status: 'Finalizing...', progress: 90 });
      setExtractedText(fullText.trim());
      await worker.terminate();
      
      setProgress({ status: 'Complete!', progress: 100 });
      toast.success('Text extracted successfully!');
    } catch (error) {
      toast.error(`OCR error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('OCR error:', error);
      setProgress({ status: 'Error occurred', progress: 0 });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress({ status: '', progress: 0 }), 2000);
    }
  };

  const handleDownloadText = () => {
    if (!extractedText) return;

    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = uploadedFile?.name.replace(/\.[^/.]+$/, '_extracted.txt') || 'extracted.txt';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Text downloaded!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">OCR - Extract Text</h1>
          <p className="text-gray-600">
            Extract text from scanned documents and images using Optical Character Recognition.
          </p>
        </div>

        {!uploadedFile ? (
          <FileUploader
            onFilesSelected={handleFileSelect}
            accept={{
              'application/pdf': ['.pdf'],
              'image/*': ['.jpg', '.jpeg', '.png', '.tiff'],
            }}
            multiple={false}
            maxSize={50 * 1024 * 1024}
          />
        ) : (
          <div className="space-y-6">
            {/* File Info */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{uploadedFile.name}</h3>
                </div>
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setExtractedText('');
                  }}
                  className="btn-secondary"
                >
                  Change File
                </button>
              </div>
            </div>

            {/* Language Selection */}
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input"
              >
                <option value="eng">English</option>
                <option value="spa">Spanish</option>
                <option value="fra">French</option>
                <option value="deu">German</option>
                <option value="chi_sim">Chinese (Simplified)</option>
                <option value="jpn">Japanese</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Note: Additional languages require downloading language data (first use may be slower)
              </p>
            </div>

            {/* Process Button */}
            <button
              onClick={handleOCR}
              disabled={processing}
              className="btn-primary w-full py-3 text-lg"
            >
              {processing ? 'Processing OCR...' : 'Extract Text'}
            </button>

            {/* Extracted Text */}
            {extractedText && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Extracted Text</h3>
                  <button onClick={handleDownloadText} className="btn-secondary">
                    Download Text
                  </button>
                </div>
                <textarea
                  value={extractedText}
                  readOnly
                  className="input min-h-[300px] font-mono text-sm"
                  placeholder="Extracted text will appear here..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  {extractedText.split('\n').length} lines • {extractedText.length} characters
                </p>
              </div>
            )}

            {processing && (
              <div className="card bg-blue-50 border border-blue-200">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">{progress.status || 'Processing...'}</p>
                      <p className="text-sm text-blue-700">
                        This may take a minute for large files. OCR runs in your browser.
                      </p>
                    </div>
                  </div>
                  {progress.progress > 0 && (
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <strong>Note:</strong> OCR processing happens entirely in your browser using Tesseract.js.
              PDF files are automatically converted to images before processing. For best results, use high-quality scanned documents.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

