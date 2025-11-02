import { useState } from 'react';
import FileUploader, { UploadedFile } from '../../components/FileUploader';
import { PDFDocument } from '../../lib/pdfService';
import { savePDF } from '../../lib/pdfService';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

type Mode = 'merge' | 'split';

export default function MergeSplit() {
  const [mode, setMode] = useState<Mode>('merge');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [originalPDF, setOriginalPDF] = useState<PDFDocument | null>(null);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  const handleFileSelect = async (selectedFiles: UploadedFile[]) => {
    if (mode === 'merge') {
      setFiles([...files, ...selectedFiles]);
      toast.success(`${selectedFiles.length} file(s) added`);
    } else {
      // Split mode - only one file
      if (selectedFiles.length > 0) {
        setFiles([selectedFiles[0]]);
        try {
          const pdf = await PDFDocument.load(await selectedFiles[0].file.arrayBuffer());
          setOriginalPDF(pdf);
          const pageCount = pdf.getPageCount();
          setSelectedPages(Array.from({ length: pageCount }, (_, i) => i));
          toast.success('PDF loaded');
      } catch (error) {
        toast.error(`Error loading PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error('Please upload at least 2 PDFs to merge');
      return;
    }

    setProcessing(true);
    try {
      const mergedPDF = await PDFDocument.create();

      for (const file of files) {
        const pdfBytes = await file.file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPDF.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPDF.addPage(page));
      }

      const filename = `merged_${Date.now()}.pdf`;
      await savePDF(mergedPDF, filename);
      toast.success('PDFs merged successfully!');
    } catch (error) {
      toast.error(`Error merging PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleSplit = async () => {
    if (!originalPDF || selectedPages.length === 0) {
      toast.error('Please select pages to extract');
      return;
    }

    setProcessing(true);
    try {
      const newPDF = await PDFDocument.create();
      const pages = await newPDF.copyPages(originalPDF, selectedPages);
      pages.forEach((page) => newPDF.addPage(page));

      const filename = `split_${Date.now()}.pdf`;
      await savePDF(newPDF, filename);
      toast.success('Pages extracted successfully!');
    } catch (error) {
      toast.error(`Error splitting PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const togglePage = (pageIndex: number) => {
    if (selectedPages.includes(pageIndex)) {
      setSelectedPages(selectedPages.filter((p) => p !== pageIndex));
    } else {
      setSelectedPages([...selectedPages, pageIndex].sort((a, b) => a - b));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Merge & Split PDFs</h1>
          <p className="text-gray-600 mb-4">
            Combine multiple PDFs into one, or extract specific pages from a PDF.
          </p>

          {/* Mode Toggle */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                setMode('merge');
                setFiles([]);
                setOriginalPDF(null);
                setSelectedPages([]);
              }}
              className={`btn ${mode === 'merge' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Merge PDFs
            </button>
            <button
              onClick={() => {
                setMode('split');
                setFiles([]);
                setOriginalPDF(null);
                setSelectedPages([]);
              }}
              className={`btn ${mode === 'split' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Split PDF
            </button>
          </div>
        </div>

        {mode === 'merge' ? (
          <>
            {files.length === 0 ? (
              <FileUploader
                onFilesSelected={handleFileSelect}
                accept={{ 'application/pdf': ['.pdf'] }}
                multiple={true}
                maxSize={50 * 1024 * 1024}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    {files.length} file(s) ready to merge
                  </h2>
                  <FileUploader
                    onFilesSelected={handleFileSelect}
                    accept={{ 'application/pdf': ['.pdf'] }}
                    multiple={true}
                    maxSize={50 * 1024 * 1024}
                    className="max-w-md"
                  />
                </div>

                {/* File List with Drag Reorder */}
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl">📄</span>
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                        <button
                          onClick={() => handleRemoveFile(file.id)}
                          className="btn-secondary text-sm"
                          aria-label="Remove file"
                        >
                          Remove
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button
                  onClick={handleMerge}
                  disabled={processing || files.length < 2}
                  className="btn-primary w-full py-3 text-lg"
                >
                  {processing ? 'Merging...' : 'Merge PDFs'}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {files.length === 0 ? (
              <FileUploader
                onFilesSelected={handleFileSelect}
                accept={{ 'application/pdf': ['.pdf'] }}
                multiple={false}
                maxSize={50 * 1024 * 1024}
              />
            ) : originalPDF && (
              <div className="space-y-6">
                <div className="card">
                  <h2 className="text-xl font-semibold mb-4">
                    Select Pages to Extract ({selectedPages.length} selected)
                  </h2>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-4">
                    {Array.from({ length: originalPDF.getPageCount() }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => togglePage(index)}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          selectedPages.includes(index)
                            ? 'bg-primary-100 border-primary-500'
                            : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-2xl mb-2">📄</div>
                        <div className="text-sm font-medium">Page {index + 1}</div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        const all = Array.from({ length: originalPDF.getPageCount() }, (_, i) => i);
                        setSelectedPages(all);
                      }}
                      className="btn-secondary text-sm"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedPages([])}
                      className="btn-secondary text-sm"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSplit}
                  disabled={processing || selectedPages.length === 0}
                  className="btn-primary w-full py-3 text-lg"
                >
                  {processing ? 'Extracting...' : `Extract ${selectedPages.length} Page(s)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

