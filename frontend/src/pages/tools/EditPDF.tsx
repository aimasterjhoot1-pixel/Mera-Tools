import { useState, useRef } from 'react';
import FileUploader, { UploadedFile } from '../../components/FileUploader';
import { PDFEditor } from '../../lib/pdfEditService';
import toast from 'react-hot-toast';
import PDFViewer from '../../components/PDFViewer';

export default function EditPDF() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [editor, setEditor] = useState<PDFEditor | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: UploadedFile[]) => {
    if (files.length === 0) return;

    const file = files[0];
    setUploadedFile(file);

    try {
      const pdfEditor = new PDFEditor();
      await pdfEditor.loadPDF(file.file);
      setEditor(pdfEditor);
      setCurrentPage(0);
      toast.success('PDF loaded successfully');
    } catch (error) {
      toast.error(`Error loading PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAddText = async () => {
    if (!editor || !textInput.trim()) return;

    try {
      // Get page dimensions
      const page = editor['pdf']?.getPage(currentPage);
      if (!page) return;

      const { width, height } = page.getSize();
      await editor.addText(
        currentPage,
        textInput,
        width / 2 - 50, // Center-ish
        height / 2,
        { size: 12 }
      );
      toast.success('Text added');
      setTextInput('');
    } catch (error) {
      toast.error(`Error adding text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor || !e.target.files?.[0]) return;

    try {
      const page = editor['pdf']?.getPage(currentPage);
      if (!page) return;

      const { width, height } = page.getSize();
      await editor.addImage(
        currentPage,
        e.target.files[0],
        width / 4,
        height / 4,
        { width: 200, height: 200 }
      );
      toast.success('Image added');
    } catch (error) {
      toast.error(`Error adding image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUndo = () => {
    if (!editor) return;
    const success = editor.undo();
    if (success) {
      toast.success('Undone');
    } else {
      toast('Nothing to undo');
    }
  };

  const handleRedo = () => {
    if (!editor) return;
    const success = editor.redo();
    if (success) {
      toast.success('Redone');
    } else {
      toast('Nothing to redo');
    }
  };

  const handleDownload = async () => {
    if (!editor || !uploadedFile) return;

    try {
      const filename = uploadedFile.name.replace('.pdf', '_edited.pdf');
      await editor.export(filename);
      toast.success('PDF downloaded');
    } catch (error) {
      toast.error(`Error downloading: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const pageCount = numPages || editor?.getPageCount() || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Edit PDF</h1>
          <p className="text-gray-600">
            Add text, images, draw, highlight, and annotate your PDF. All processing happens in your browser.
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Toolbar */}
            <div className="lg:col-span-1">
              <div className="card space-y-4">
                <h2 className="text-lg font-semibold mb-4">Tools</h2>

                {/* Text Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Text
                  </label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="input mb-2"
                    placeholder="Enter text..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddText()}
                  />
                  <button onClick={handleAddText} className="btn-primary w-full">
                    Add Text
                  </button>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Image
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAddImage}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary w-full"
                  >
                    Choose Image
                  </button>
                </div>

                {/* Undo/Redo */}
                <div className="flex gap-2">
                  <button
                    onClick={handleUndo}
                    disabled={!editor?.canUndo()}
                    className="btn-secondary flex-1"
                  >
                    ↶ Undo
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={!editor?.canRedo()}
                    className="btn-secondary flex-1"
                  >
                    ↷ Redo
                  </button>
                </div>

                {/* Page Navigation */}
                {pageCount > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page {currentPage + 1} of {pageCount}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                        className="btn-secondary flex-1"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(pageCount - 1, currentPage + 1))}
                        disabled={currentPage === pageCount - 1}
                        className="btn-secondary flex-1"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* Zoom Controls */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zoom
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn-secondary"
                      onClick={() => setZoom((z) => Math.max(0.5, parseFloat((z - 0.1).toFixed(2))))}
                    >
                      -
                    </button>
                    <span className="text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
                    <button
                      className="btn-secondary"
                      onClick={() => setZoom((z) => Math.min(3, parseFloat((z + 0.1).toFixed(2))))}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Download */}
                <button onClick={handleDownload} className="btn-primary w-full">
                  Download PDF
                </button>

                {/* Reset */}
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setEditor(null);
                    setCurrentPage(0);
                  }}
                  className="btn-secondary w-full"
                >
                  Start Over
                </button>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="lg:col-span-3">
              <div className="card bg-gray-100 min-h-[600px] flex items-center justify-center">
                {uploadedFile ? (
                  <div className="w-full h-full">
                    <PDFViewer
                      source={uploadedFile.file}
                      pageNumber={currentPage + 1}
                      scale={zoom}
                      onDocumentLoaded={(n) => setNumPages(n)}
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">📄</div>
                    <p className="text-lg">PDF Editor Canvas</p>
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

