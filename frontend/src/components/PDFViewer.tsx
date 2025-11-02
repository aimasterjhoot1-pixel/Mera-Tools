import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, RenderTask, RenderParameters } from 'pdfjs-dist/types/src/display/api';
import 'pdfjs-dist/web/pdf_viewer.css';

// Configure the worker for pdf.js (Vite-friendly)
// Using url import so Vite can bundle the worker
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PDFViewerProps {
  source: File | Uint8Array | ArrayBuffer;
  pageNumber: number; // 1-based
  scale?: number; // zoom scale
  onDocumentLoaded?: (numPages: number) => void;
}

export default function PDFViewer({ source, pageNumber, scale = 1.0, onDocumentLoaded }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let pdfDoc: PDFDocumentProxy | null = null;
    let renderTask: RenderTask | null = null;

    async function loadAndRender() {
      try {
        setLoading(true);
        setError(null);

        const data = source instanceof File ? await source.arrayBuffer() : source;
        const loadingTask = pdfjsLib.getDocument({ data });
        pdfDoc = await loadingTask.promise as PDFDocumentProxy;

        if (onDocumentLoaded) onDocumentLoaded(pdfDoc.numPages);

        const pageIndex = Math.min(Math.max(pageNumber, 1), pdfDoc.numPages);
        const page = await pdfDoc.getPage(pageIndex);

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const renderContext: RenderParameters = {
          canvasContext: context as unknown as CanvasRenderingContext2D,
          viewport,
        } as unknown as RenderParameters;

        // Cancel previous render if any
        if (renderTask) {
          try {
            await renderTask.cancel();
          } catch {}
        }

        renderTask = page.render(renderContext);
        await renderTask.promise;
        if (!isCancelled) setLoading(false);
      } catch (e) {
        if (!isCancelled) {
          setError(e instanceof Error ? e.message : 'Failed to render PDF');
          setLoading(false);
        }
      }
    }

    loadAndRender();

    return () => {
      isCancelled = true;
      try {
        if (renderTask) renderTask.cancel();
        if (pdfDoc) pdfDoc.destroy();
      } catch {}
    };
  }, [source, pageNumber, scale, onDocumentLoaded]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg overflow-auto">
      {error ? (
        <div className="text-red-600 text-sm p-4">{error}</div>
      ) : (
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}
          <canvas ref={canvasRef} className="bg-white" />
        </div>
      )}
    </div>
  );
}
