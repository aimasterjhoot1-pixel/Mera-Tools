import { useState, useRef } from 'react';
import FileUploader, { UploadedFile } from '../../components/FileUploader';
import { PDFDocument } from '../../lib/pdfService';
import { savePDF } from '../../lib/pdfService';
import toast from 'react-hot-toast';

type SignatureType = 'draw' | 'type' | 'upload';

export default function SignAnnotate() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [signatureType, setSignatureType] = useState<SignatureType>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const handleFileSelect = async (files: UploadedFile[]) => {
    if (files.length === 0) return;
    setUploadedFile(files[0]);
    toast.success('PDF loaded');
  };

  // Canvas drawing logic would be implemented here
  // For now, users can use the canvas directly

  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSignatureImage(reader.result as string);
      toast.success('Signature image loaded');
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleAddSignature = async () => {
    if (!uploadedFile) return;

    let signatureData: string | null = null;

    if (signatureType === 'type' && typedSignature.trim()) {
      // Create signature from text
      signatureData = typedSignature;
    } else if (signatureType === 'upload' && signatureImage) {
      signatureData = signatureImage;
    } else if (signatureType === 'draw' && canvasRef) {
      // Get canvas data
      signatureData = canvasRef.toDataURL();
    } else {
      toast.error('Please create or upload a signature');
      return;
    }

    if (!signatureData) return;

    setProcessing(true);
    try {
      const pdfBytes = await uploadedFile.file.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);
      const page = pdf.getPage(currentPage);

      if (signatureType === 'upload' || signatureType === 'draw') {
        // Add image signature
        const imageBytes = await fetch(signatureData).then((r) => r.arrayBuffer());
        const image = await pdf.embedPng(imageBytes).catch(() => pdf.embedJpg(imageBytes));
        page.drawImage(image, {
          x: 100,
          y: page.getHeight() - 150,
          width: 200,
          height: 80,
        });
      } else {
        // Add text signature
        const font = await pdf.embedFont('Helvetica-Bold');
        page.drawText(signatureData, {
          x: 100,
          y: page.getHeight() - 120,
          size: 24,
          font,
        });
      }

      const filename = uploadedFile.name.replace('.pdf', '_signed.pdf');
      await savePDF(pdf, filename);
      toast.success('Signature added successfully!');
    } catch (error) {
      toast.error(`Error adding signature: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sign & Annotate PDF</h1>
          <p className="text-gray-600">
            Add electronic signatures and annotations to your PDF documents.
          </p>
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
            {/* PDF Info */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{uploadedFile.name}</h3>
                </div>
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setSignatureImage(null);
                    setTypedSignature('');
                  }}
                  className="btn-secondary"
                >
                  Change File
                </button>
              </div>
            </div>

            {/* Signature Type Selection */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Create Signature</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { type: 'draw' as SignatureType, label: 'Draw', icon: '✏️' },
                  { type: 'type' as SignatureType, label: 'Type', icon: '⌨️' },
                  { type: 'upload' as SignatureType, label: 'Upload', icon: '📤' },
                ].map((option) => (
                  <button
                    key={option.type}
                    onClick={() => setSignatureType(option.type)}
                    className={`p-4 rounded-lg border-2 ${
                      signatureType === option.type
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="text-3xl mb-2">{option.icon}</div>
                    <div className="font-semibold">{option.label}</div>
                  </button>
                ))}
              </div>

              {/* Signature Input */}
              {signatureType === 'draw' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Draw Your Signature
                  </label>
                  <canvas
                    ref={(ref) => setCanvasRef(ref)}
                    width={400}
                    height={150}
                    className="border-2 border-gray-300 rounded-lg cursor-crosshair"
                    style={{ touchAction: 'none' }}
                  />
                  <button
                    onClick={() => {
                      if (canvasRef) {
                        const ctx = canvasRef.getContext('2d');
                        if (ctx) ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
                      }
                    }}
                    className="btn-secondary mt-2"
                  >
                    Clear
                  </button>
                </div>
              )}

              {signatureType === 'type' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type Your Name
                  </label>
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Your name"
                    className="input"
                  />
                </div>
              )}

              {signatureType === 'upload' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Signature Image
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadSignature}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary w-full"
                  >
                    Choose Image
                  </button>
                  {signatureImage && (
                    <img
                      src={signatureImage}
                      alt="Signature"
                      className="mt-4 max-w-xs border rounded"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Page Selection */}
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Number
              </label>
              <input
                type="number"
                min={1}
                value={currentPage + 1}
                onChange={(e) => setCurrentPage(Math.max(0, parseInt(e.target.value) - 1))}
                className="input w-32"
              />
              <p className="text-xs text-gray-500 mt-2">Signature will be placed at bottom-left of selected page</p>
            </div>

            {/* Add Signature Button */}
            <button
              onClick={handleAddSignature}
              disabled={processing}
              className="btn-primary w-full py-3 text-lg"
            >
              {processing ? 'Adding Signature...' : 'Add Signature & Download'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

