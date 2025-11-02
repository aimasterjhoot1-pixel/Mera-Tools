import { useState } from 'react';
import FileUploader, { UploadedFile } from '../../components/FileUploader';
import toast from 'react-hot-toast';

export default function OCR() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [language, setLanguage] = useState('eng');

  const handleFileSelect = async (files: UploadedFile[]) => {
    if (files.length === 0) return;
    setUploadedFile(files[0]);
    setExtractedText('');
    toast.success('File loaded');
  };

  const handleOCR = async () => {
    if (!uploadedFile) return;

    setProcessing(true);
    setExtractedText('');
    
    try {
      // Load Tesseract.js
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(language);

      // Perform OCR
      const { data: { text } } = await worker.recognize(uploadedFile.file);
      
      setExtractedText(text);
      await worker.terminate();
      
      toast.success('Text extracted successfully!');
    } catch (error) {
      toast.error(`OCR error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('OCR error:', error);
    } finally {
      setProcessing(false);
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
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  <div>
                    <p className="font-medium text-blue-900">Processing...</p>
                    <p className="text-sm text-blue-700">
                      This may take a minute for large files. OCR runs in your browser.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              <strong>Note:</strong> OCR processing happens entirely in your browser using Tesseract.js.
              For very large files or better accuracy, consider using server-side OCR processing.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

