import { useState, useRef, useEffect, useCallback } from 'react';
import FileUploader, { UploadedFile } from '../../components/FileUploader';
import { PDFDocument } from '../../lib/pdfService';
import { savePDF } from '../../lib/pdfService';
import toast from 'react-hot-toast';
import PDFViewer from '../../components/PDFViewer';
import * as pdfjsLib from 'pdfjs-dist';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;

type SignatureType = 'draw' | 'type' | 'upload' | 'extract';

interface DraggableSignature {
  id: string;
  data: string; // base64 image
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export default function SignAnnotate() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [signatureType, setSignatureType] = useState<SignatureType>('type');
  const [typedSignature, setTypedSignature] = useState('');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signatureStyles, setSignatureStyles] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<number>(-1);
  const [drawingCanvasRef, setDrawingCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [pdfCanvasRef, setPdfCanvasRef] = useState<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [placedSignatures, setPlacedSignatures] = useState<DraggableSignature[]>([]);
  const [selectedSignature, setSelectedSignature] = useState<DraggableSignature | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1.0);
  const drawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  // Generate 5 signature styles from text
  const generateSignatureStyles = useCallback((text: string): string[] => {
    if (!text.trim()) return [];

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const styles: string[] = [];

    // Style 1: Cursive
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'italic 48px "Brush Script MT", cursive';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    styles.push(canvas.toDataURL());

    // Style 2: Formal
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 36px "Times New Roman", serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    styles.push(canvas.toDataURL());

    // Style 3: Elegant
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '36px "Garamond", serif';
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 2;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    styles.push(canvas.toDataURL());

    // Style 4: Bold
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 42px "Arial", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    styles.push(canvas.toDataURL());

    // Style 5: Script
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '48px "Lucida Handwriting", cursive';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    styles.push(canvas.toDataURL());

    return styles;
  }, []);

  // Extract signature from image (basic implementation - finds white/transparent background)
  const extractSignatureFromImage = useCallback((imageData: string): Promise<string> => {
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageData);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;

        // Find bounding box of non-white/non-transparent pixels
        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = 0;
        let maxY = 0;

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            // Check if pixel is not white/transparent
            if (a > 10 && (r < 250 || g < 250 || b < 250)) {
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }

        // Crop to signature area with padding
        const padding = 10;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = width;
        cropCanvas.height = height;
        const cropCtx = cropCanvas.getContext('2d');
        if (!cropCtx) {
          resolve(imageData);
          return;
        }

        cropCtx.drawImage(
          canvas,
          Math.max(0, minX - padding),
          Math.max(0, minY - padding),
          width,
          height,
          0,
          0,
          width,
          height
        );

        resolve(cropCanvas.toDataURL());
      };
      img.src = imageData;
    });
  }, []);

  const handleFileSelect = async (files: UploadedFile[]) => {
    if (files.length === 0) return;
    setUploadedFile(files[0]);
    
    // Load PDF to get page count
    try {
      const arrayBuffer = await files[0].file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      setNumPages(pdf.numPages);
      setCurrentPage(1);
      toast.success('PDF loaded');
    } catch (error) {
      toast.error('Failed to load PDF');
    }
  };

  // Canvas drawing handlers
  useEffect(() => {
    if (!drawingCanvasRef || signatureType !== 'draw') return;

    const canvas = drawingCanvasRef;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      drawingRef.current = true;
      const point = getPoint(e);
      lastPointRef.current = point;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!drawingRef.current) return;
      e.preventDefault();
      const point = getPoint(e);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      lastPointRef.current = point;
    };

    const stopDrawing = () => {
      drawingRef.current = false;
    };

    const getPoint = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (e instanceof MouseEvent) {
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      } else {
        const touch = e.touches[0] || e.changedTouches[0];
        return {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      }
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [drawingCanvasRef, signatureType]);

  // Generate styles when text changes
  useEffect(() => {
    if (signatureType === 'type' && typedSignature.trim()) {
      const styles = generateSignatureStyles(typedSignature);
      setSignatureStyles(styles);
      if (styles.length > 0) {
        setSelectedStyle(0);
      }
    }
  }, [typedSignature, signatureType, generateSignatureStyles]);

  const handleUploadSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageData = reader.result as string;
      
      if (signatureType === 'extract') {
        toast.loading('Extracting signature from image...', { id: 'extract' });
        const extracted = await extractSignatureFromImage(imageData);
        setSignatureImage(extracted);
        toast.success('Signature extracted!', { id: 'extract' });
      } else {
        setSignatureImage(imageData);
        toast.success('Signature image loaded');
      }
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  // Add signature to PDF viewer
  const addSignatureToViewer = () => {
    let signatureData: string | null = null;

    if (signatureType === 'type' && selectedStyle >= 0 && signatureStyles[selectedStyle]) {
      signatureData = signatureStyles[selectedStyle];
    } else if (signatureType === 'upload' && signatureImage) {
      signatureData = signatureImage;
    } else if (signatureType === 'extract' && signatureImage) {
      signatureData = signatureImage;
    } else if (signatureType === 'draw' && drawingCanvasRef) {
      signatureData = drawingCanvasRef.toDataURL();
    } else {
      toast.error('Please create or select a signature');
      return;
    }

    if (!signatureData) return;

    // Create draggable signature
    const newSignature: DraggableSignature = {
      id: `sig-${Date.now()}`,
      data: signatureData,
      x: 100,
      y: 100,
      width: 200,
      height: 80,
      page: currentPage,
    };

    setPlacedSignatures([...placedSignatures, newSignature]);
    setSelectedSignature(newSignature);
    toast.success('Signature added! Drag it to position, then click "Apply Signatures"');
  };

  // Handle drag
  const handleMouseDown = (e: React.MouseEvent, signature: DraggableSignature) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedSignature(signature);
    setIsDragging(true);
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.parentElement?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left - signature.x * scale,
        y: e.clientY - rect.top - signature.y * scale,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !selectedSignature || !pdfCanvasRef) return;

      const container = pdfCanvasRef;
      const rect = container.getBoundingClientRect();
      const x = Math.max(0, (e.clientX - rect.left - dragStart.x) / scale);
      const y = Math.max(0, (e.clientY - rect.top - dragStart.y) / scale);

      setPlacedSignatures(
        placedSignatures.map((sig) =>
          sig.id === selectedSignature.id
            ? { ...sig, x, y, page: currentPage }
            : sig
        )
      );
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedSignature, dragStart, placedSignatures, currentPage, scale, pdfCanvasRef]);

  // Apply signatures to PDF
  const handleApplySignatures = async () => {
    if (!uploadedFile || placedSignatures.length === 0) {
      toast.error('Please add at least one signature');
      return;
    }

    setProcessing(true);
    try {
      const pdfBytes = await uploadedFile.file.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);

      // Group signatures by page
      const signaturesByPage: { [page: number]: DraggableSignature[] } = {};
      placedSignatures.forEach((sig) => {
        if (!signaturesByPage[sig.page]) {
          signaturesByPage[sig.page] = [];
        }
        signaturesByPage[sig.page].push(sig);
      });

      // Add signatures to each page
      for (const [pageNumStr, sigs] of Object.entries(signaturesByPage)) {
        const pageNum = parseInt(pageNumStr) - 1; // Convert to 0-based
        if (pageNum < 0 || pageNum >= pdf.getPageCount()) continue;

        const page = pdf.getPage(pageNum);
        const { width: pageWidth, height: pageHeight } = page.getSize();

        for (const sig of sigs) {
          try {
            // Convert base64 to image
            const base64Data = sig.data.split(',')[1] || sig.data;
            const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
            
            let image;
            try {
              image = await pdf.embedPng(imageBytes);
            } catch {
              image = await pdf.embedJpg(imageBytes);
            }

            // Get PDF page dimensions to scale coordinates properly
            
            // Get actual rendered canvas dimensions from PDF viewer
            // We need to map viewer coordinates to PDF coordinates
            // PDF uses points (1/72 inch), viewer uses pixels
            // Approximate scale: assume viewer renders at 96 DPI (1.33x PDF points)
            const viewerWidth = 800; // Approximate default viewer width
            const viewerHeight = 600; // Approximate default viewer height
            const scaleX = pageWidth / viewerWidth;
            const scaleY = pageHeight / viewerHeight;
            
            // Convert viewer coordinates to PDF coordinates
            // PDF origin is bottom-left, viewer origin is top-left
            const pdfX = sig.x * scaleX;
            const pdfY = pageHeight - (sig.y * scaleY) - (sig.height * scaleY);
            const sigWidth = sig.width * scaleX;
            const sigHeight = sig.height * scaleY;

            page.drawImage(image, {
              x: Math.max(0, Math.min(pdfX, pageWidth)),
              y: Math.max(0, Math.min(pdfY, pageHeight)),
              width: Math.min(sigWidth, pageWidth - Math.max(0, pdfX)),
              height: Math.min(sigHeight, pageHeight - Math.max(0, pdfY)),
            });
          } catch (error) {
            console.error('Error adding signature:', error);
            toast.error(`Error adding signature on page ${pageNum + 1}`);
          }
        }
      }

      const filename = uploadedFile.name.replace('.pdf', '_signed.pdf');
      await savePDF(pdf, filename);
      toast.success('Signatures applied successfully!');
    } catch (error) {
      toast.error(`Error applying signatures: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sign & Annotate PDF</h1>
          <p className="text-gray-600">
            Add electronic signatures to your PDF documents. Drag and drop signatures anywhere on the document.
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
                  <p className="text-sm text-gray-600">{numPages} page(s)</p>
                </div>
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setSignatureImage(null);
                    setTypedSignature('');
                    setPlacedSignatures([]);
                    setSelectedSignature(null);
                  }}
                  className="btn-secondary"
                >
                  Change File
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Signature Creation */}
              <div className="lg:col-span-1 space-y-6">
                {/* Signature Type Selection */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Create Signature</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { type: 'type' as SignatureType, label: 'Type', icon: '⌨️' },
                      { type: 'draw' as SignatureType, label: 'Draw', icon: '✏️' },
                      { type: 'upload' as SignatureType, label: 'Upload', icon: '📤' },
                      { type: 'extract' as SignatureType, label: 'Extract', icon: '🔍' },
                    ].map((option) => (
                      <button
                        key={option.type}
                        onClick={() => setSignatureType(option.type)}
                        className={`p-3 rounded-lg border-2 ${
                          signatureType === option.type
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="text-2xl mb-1">{option.icon}</div>
                        <div className="text-xs font-semibold">{option.label}</div>
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
                        ref={(ref) => setDrawingCanvasRef(ref)}
                        width={400}
                        height={150}
                        className="border-2 border-gray-300 rounded-lg cursor-crosshair w-full"
                        style={{ touchAction: 'none' }}
                      />
                      <button
                        onClick={() => {
                          if (drawingCanvasRef) {
                            const ctx = drawingCanvasRef.getContext('2d');
                            if (ctx) ctx.clearRect(0, 0, drawingCanvasRef.width, drawingCanvasRef.height);
                          }
                        }}
                        className="btn-secondary mt-2 w-full"
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
                      {signatureStyles.length > 0 && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Style
                          </label>
                          <div className="grid grid-cols-1 gap-2">
                            {signatureStyles.map((style, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedStyle(index)}
                                className={`p-2 border-2 rounded ${
                                  selectedStyle === index
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-200'
                                }`}
                              >
                                <img src={style} alt={`Style ${index + 1}`} className="w-full h-12 object-contain" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {(signatureType === 'upload' || signatureType === 'extract') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {signatureType === 'extract' ? 'Upload Image (Signature will be extracted)' : 'Upload Signature Image'}
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
                          className="mt-4 w-full border rounded"
                        />
                      )}
                    </div>
                  )}

                  <button
                    onClick={addSignatureToViewer}
                    className="btn-primary w-full mt-4"
                  >
                    Add Signature to Document
                  </button>
                </div>

                {/* Page Navigation */}
                <div className="card">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page {currentPage} of {numPages}
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="btn-secondary flex-1"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                      disabled={currentPage === numPages}
                      className="btn-secondary flex-1"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - PDF Viewer */}
              <div className="lg:col-span-2">
                <div className="card">
                  <div className="relative bg-gray-100 rounded-lg overflow-auto" style={{ minHeight: '600px' }}>
                    {uploadedFile && (
                      <div className="relative inline-block">
                        <div ref={(ref) => setPdfCanvasRef(ref)}>
                          <PDFViewer
                            source={uploadedFile.file}
                            pageNumber={currentPage}
                            scale={scale}
                            onDocumentLoaded={setNumPages}
                          />
                        </div>
                        {/* Signature Overlays */}
                        {placedSignatures
                          .filter((sig) => sig.page === currentPage)
                          .map((sig) => {
                            const isSelected = selectedSignature?.id === sig.id;
                            return (
                              <div
                                key={sig.id}
                                className={`absolute border-2 ${
                                  isSelected ? 'border-primary-500 shadow-lg' : 'border-transparent'
                                } cursor-move`}
                                style={{
                                  left: `${sig.x * scale}px`,
                                  top: `${sig.y * scale}px`,
                                  width: `${sig.width * scale}px`,
                                  height: `${sig.height * scale}px`,
                                  zIndex: isSelected ? 20 : 10,
                                }}
                                onMouseDown={(e) => handleMouseDown(e, sig)}
                              >
                                <img
                                  src={sig.data}
                                  alt="Signature"
                                  className="w-full h-full object-contain pointer-events-none"
                                  draggable={false}
                                />
                                {isSelected && (
                                  <div className="absolute -top-8 left-0 bg-primary-500 text-white px-2 py-1 rounded text-xs">
                                    Drag to move
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                  
                  {/* Zoom Controls */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setScale(Math.max(0.5, scale - 0.25))}
                        className="btn-secondary"
                      >
                        Zoom Out
                      </button>
                      <button
                        onClick={() => setScale(Math.min(2.0, scale + 0.25))}
                        className="btn-secondary"
                      >
                        Zoom In
                      </button>
                    </div>
                    <span className="text-sm text-gray-600">{Math.round(scale * 100)}%</span>
                  </div>
                </div>

                {/* Apply Signatures Button */}
                <button
                  onClick={handleApplySignatures}
                  disabled={processing || placedSignatures.length === 0}
                  className="btn-primary w-full py-3 text-lg mt-4"
                >
                  {processing ? 'Applying Signatures...' : `Apply ${placedSignatures.length} Signature(s) & Download`}
                </button>

                {placedSignatures.length > 0 && (
                  <div className="card mt-4">
                    <h4 className="font-semibold mb-2">Placed Signatures ({placedSignatures.length})</h4>
                    <div className="space-y-2">
                      {placedSignatures.map((sig, index) => (
                        <div
                          key={sig.id}
                          className={`p-2 border rounded cursor-pointer ${
                            selectedSignature?.id === sig.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200'
                          }`}
                          onClick={() => setSelectedSignature(sig)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Signature {index + 1} - Page {sig.page}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPlacedSignatures(placedSignatures.filter((s) => s.id !== sig.id));
                                if (selectedSignature?.id === sig.id) {
                                  setSelectedSignature(null);
                                }
                              }}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
