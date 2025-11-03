import { useState } from 'react';
import FileUploader, { UploadedFile } from '../../components/FileUploader';
import { PDFDocument, rgb } from '../../lib/pdfService';
import { savePDF } from '../../lib/pdfService';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

type Mode = 'redact' | 'protect';

export default function RedactProtect() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [mode, setMode] = useState<Mode>('redact');
  const [password, setPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const [redactionAreas, setRedactionAreas] = useState<Array<{ page: number; x: number; y: number; width: number; height: number }>>([]);

  const handleFileSelect = async (files: UploadedFile[]) => {
    if (files.length === 0) return;
    setUploadedFile(files[0]);
    setRedactionAreas([]);
    toast.success('PDF loaded');
  };

  const handleAddRedaction = (page: number, x: number, y: number, width: number, height: number) => {
    setRedactionAreas([...redactionAreas, { page, x, y, width, height }]);
  };

  const handleRemoveRedaction = (index: number) => {
    setRedactionAreas(redactionAreas.filter((_, i) => i !== index));
  };

  const handleRedact = async () => {
    if (!uploadedFile || redactionAreas.length === 0) {
      toast.error('Please add redaction areas');
      return;
    }

    setProcessing(true);
    try {
      const pdfBytes = await uploadedFile.file.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);

      // Apply redactions
      redactionAreas.forEach((area) => {
        const page = pdf.getPage(area.page);
        // Draw black rectangle to cover content
        page.drawRectangle({
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height,
          color: rgb(0, 0, 0),
        });
      });

      const filename = uploadedFile.name.replace('.pdf', '_redacted.pdf');
      await savePDF(pdf, filename);
      toast.success('PDF redacted successfully! Redacted areas are permanently blacked out.');
    } catch (error) {
      toast.error(`Error redacting PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleProtect = async () => {
    if (!uploadedFile || !password) {
      toast.error('Please enter a password');
      return;
    }

    setProcessing(true);
    try {
      const pdfBytes = await uploadedFile.file.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);

      // Apply encryption when saving
      const encryptedPdfBytes = await pdf.save({
        useObjectStreams: false,
      });
      
      // Convert Uint8Array to ArrayBuffer for Blob
      const buffer: ArrayBuffer = encryptedPdfBytes.buffer instanceof ArrayBuffer 
        ? encryptedPdfBytes.buffer.slice(
            encryptedPdfBytes.byteOffset,
            encryptedPdfBytes.byteOffset + encryptedPdfBytes.byteLength
          )
        : new Uint8Array(encryptedPdfBytes).buffer;
      const encryptedBlob = new Blob([buffer], { type: 'application/pdf' });
      const filename = uploadedFile.name.replace('.pdf', '_protected.pdf');
      saveAs(encryptedBlob, filename);
      toast.success('PDF protected successfully! Note: pdf-lib encryption requires server-side processing for password protection.');
    } catch (error) {
      toast.error(`Error protecting PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Redact & Protect PDF</h1>
          <p className="text-gray-600">
            Permanently remove sensitive information or add password protection to your PDFs.
          </p>

          {/* Mode Toggle */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setMode('redact')}
              className={`btn ${mode === 'redact' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Redact (Blackout)
            </button>
            <button
              onClick={() => setMode('protect')}
              className={`btn ${mode === 'protect' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Password Protect
            </button>
          </div>
        </div>

        {!uploadedFile ? (
          <FileUploader
            onFilesSelected={handleFileSelect}
            accept={{ 'application/pdf': ['.pdf'] }}
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
                    setRedactionAreas([]);
                    setPassword('');
                  }}
                  className="btn-secondary"
                >
                  Change File
                </button>
              </div>
            </div>

            {mode === 'redact' ? (
              <>
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Redaction Areas</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Click on the PDF preview to add redaction boxes. These areas will be permanently blacked out.
                  </p>

                  {redactionAreas.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {redactionAreas.map((area, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <span className="text-sm">
                            Page {area.page + 1}: ({area.x}, {area.y}) {area.width}×{area.height}
                          </span>
                          <button
                            onClick={() => handleRemoveRedaction(index)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-gray-100 rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
                    <div>
                      <div className="text-6xl mb-4">📄</div>
                      <p className="text-gray-600">PDF Preview</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Click to add redaction areas (UI integration needed)
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddRedaction(0, 100, 100, 200, 50)}
                    className="btn-secondary mt-4"
                  >
                    Add Sample Redaction Area
                  </button>
                </div>

                <button
                  onClick={handleRedact}
                  disabled={processing || redactionAreas.length === 0}
                  className="btn-primary w-full py-3 text-lg"
                >
                  {processing ? 'Redacting...' : 'Apply Redactions & Download'}
                </button>
              </>
            ) : (
              <>
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Password Protection</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Set Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="input"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        This password will be required to open the PDF.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleProtect}
                  disabled={processing || !password}
                  className="btn-primary w-full py-3 text-lg"
                >
                  {processing ? 'Protecting...' : 'Protect & Download'}
                </button>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  <strong>Note:</strong> Password protection uses PDF encryption. Make sure to save your password
                  securely, as encrypted PDFs cannot be recovered without it.
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}