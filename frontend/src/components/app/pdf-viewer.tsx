'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PdfViewerProps {
    url: string; // Blob URL or public URL
    title?: string;
    className?: string;
}

export function PdfViewer({ url, title = 'PDF Preview', className = '' }: PdfViewerProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [isRendering, setIsRendering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoadingDoc, setIsLoadingDoc] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const pdfDocRef = useRef<any>(null);
    const renderTaskRef = useRef<any>(null);
    const loadingTaskRef = useRef<any>(null);

    // Initial check for pdfjs availability
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
            setPdfjsLoaded(true);
        }
    }, [isMobile]);

    // Reset page when URL changes
    useEffect(() => {
        setCurrentPage(1);
        setNumPages(null);
        pdfDocRef.current = null;
    }, [url]);

    // Initial document loading
    useEffect(() => {
        if (!pdfjsLoaded || !url || !isMobile) return;

        let isMounted = true;
        const loadDocument = async () => {
            setIsLoadingDoc(true);
            setError(null);
            try {
                const pdfjsLib = (window as any).pdfjsLib;
                if (!pdfjsLib) return;

                // Ensure worker is set
                if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
                }

                // Destroy previous loading task if it exists
                if (loadingTaskRef.current) {
                    try {
                        await loadingTaskRef.current.destroy();
                    } catch (e) { }
                }

                const loadingTask = pdfjsLib.getDocument(url);
                loadingTaskRef.current = loadingTask;

                const pdf = await loadingTask.promise;
                if (isMounted) {
                    pdfDocRef.current = pdf;
                    setNumPages(pdf.numPages);
                    setError(null);
                    setIsLoadingDoc(false);
                }
            } catch (err: any) {
                if (err.name === 'WorkerHookClosedException') return;
                console.error('Error loading PDF document:', err);
                if (isMounted) {
                    setError('Failed to load PDF document.');
                    setIsLoadingDoc(false);
                }
            }
        };

        loadDocument();

        return () => {
            isMounted = false;
        };
    }, [pdfjsLoaded, url, isMobile]);

    useEffect(() => {
        return () => {
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }
            if (loadingTaskRef.current) {
                loadingTaskRef.current.destroy();
            }
        };
    }, []);

    const renderPdfPage = async () => {
        if (!pdfDocRef.current || !canvasRef.current || !isMobile) return;

        // Cancel any existing render task
        if (renderTaskRef.current) {
            try {
                await renderTaskRef.current.cancel();
            } catch (err) { }
        }

        setIsRendering(true);
        setError(null);

        try {
            const pdf = pdfDocRef.current;
            const page = await pdf.getPage(currentPage);

            // Higher factor for much better clarity on mobile (e.g. scale * 2.5 for HD view)
            const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
            const scaleFactor = scale * (dpr > 1 ? 2.5 : 2.0); // Upscale for clarity
            const viewport = page.getViewport({ scale: scaleFactor });

            const canvas = canvasRef.current;
            const context = canvas.getContext('2d', { alpha: false });
            if (!context) throw new Error('Could not get canvas context');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Ensure smooth rendering
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
                intent: 'display'
            };

            const renderTask = page.render(renderContext);
            renderTaskRef.current = renderTask;

            try {
                await renderTask.promise;
                renderTaskRef.current = null;
            } catch (err: any) {
                if (err.name === 'RenderingCancelledException') return;
                throw err;
            }
        } catch (err: any) {
            console.error('Error rendering PDF page:', err);
            setError('Failed to render PDF preview.');
        } finally {
            setIsRendering(true); // Keep it true briefly to prevent flicker
            setTimeout(() => setIsRendering(false), 50);
        }
    };

    useEffect(() => {
        if (pdfDocRef.current && isMobile) {
            renderPdfPage();
        }
    }, [currentPage, scale, isMobile, numPages]); // Added numPages to trigger initial render after loading

    return (
        <div className={`w-full h-full flex flex-col ${className}`}>
            <Script
                src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
                strategy="lazyOnload"
                onLoad={() => {
                    const pdfjsLib = (window as any).pdfjsLib;
                    if (pdfjsLib) {
                        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
                        setPdfjsLoaded(true);
                    }
                }}
            />

            {isMobile ? (
                <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
                    {/* Controls */}
                    <div className="bg-white border-b px-3 py-2 flex items-center justify-between shadow-sm z-10">
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage <= 1 || isRendering || isLoadingDoc}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full min-w-[40px] text-center">
                                {currentPage} / {numPages || '?'}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCurrentPage(prev => Math.min(numPages || prev, prev + 1))}
                                disabled={numPages ? currentPage >= numPages : true || isRendering || isLoadingDoc}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setScale(prev => Math.max(0.4, prev - 0.2))}
                                disabled={isRendering || isLoadingDoc}
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setScale(prev => Math.min(3, prev + 0.2))}
                                disabled={isRendering || isLoadingDoc}
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto p-4 flex justify-center items-start scrollbar-hide">
                        <div className="bg-white shadow-xl rounded-sm overflow-hidden relative min-h-[100px] min-w-[200px]">
                            {(isRendering || isLoadingDoc) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] z-10">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">
                                            {isLoadingDoc ? 'Loading...' : 'Rendering...'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {error ? (
                                <div className="p-8 text-center bg-white">
                                    <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
                                    <p className="text-sm text-red-600 font-medium">{error}</p>
                                    <div className="flex flex-col gap-2 mt-4">
                                        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                                            Reload Page
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setIsMobile(false)}>
                                            Switch to Desktop View
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <canvas ref={canvasRef} className="max-w-full h-auto" />
                            )}

                            {!numPages && !isLoadingDoc && !error && (
                                <div className="p-8 text-center text-gray-400 italic text-sm">
                                    Initiating document preview...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Page swipe helper hint */}
                    {numPages && numPages > 1 && (
                        <div className="py-1 px-4 text-center bg-blue-50/50 border-t">
                            <p className="text-[10px] text-blue-600 font-medium uppercase tracking-wider">
                                Page {currentPage} of {numPages}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <iframe
                    src={`${url}#toolbar=0&navpanes=0&scrollbar=1`}
                    className="w-full h-full border-0"
                    title={title}
                />
            )}
        </div>
    );
}
