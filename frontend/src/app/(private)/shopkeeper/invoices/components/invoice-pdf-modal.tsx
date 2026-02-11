'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Share2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Invoice } from '@/types/invoice';
import api from '@/config/axios';
import { toast } from 'sonner';
import Script from 'next/script';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface InvoicePdfModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoice: Partial<Invoice>;
    templateId: string;
    colorScheme: string;
    colorSchemes: Array<{ id: string; name: string; primary: string; secondary: string; accent: string }>;
}

export function InvoicePdfModal({
    open,
    onOpenChange,
    invoice,
    templateId,
    colorScheme,
}: InvoicePdfModalProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string>('');
    const [isMobile, setIsMobile] = useState(false);
    const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.0);

    useEffect(() => {
        setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }, []);

    // Use the invoice's saved template and color scheme
    const finalTemplateId = invoice.templateId || templateId || 'modern';
    const finalColorScheme = invoice.colorScheme || colorScheme || 'blue';

    useEffect(() => {
        if (open && invoice._id) {
            loadPdf();
        } else {
            // Cleanup blob URL when modal closes
            if (pdfBlobUrl) {
                URL.revokeObjectURL(pdfBlobUrl);
                setPdfBlobUrl('');
            }
        }

        return () => {
            if (pdfBlobUrl) {
                URL.revokeObjectURL(pdfBlobUrl);
            }
        };
    }, [open, invoice._id]);

    const loadPdf = async () => {
        setLoading(true);
        setError(null);
        setNumPages(null);
        setCurrentPage(1);

        try {
            const response = await api.get(`/invoices/${invoice._id}/pdf`, {
                params: {
                    template: finalTemplateId,
                    color: finalColorScheme
                },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setPdfBlobUrl(url);
            setLoading(false);
        } catch (err: any) {
            console.error('PDF load error:', err);
            setError(err.response?.data?.message || 'Failed to load PDF. Please try again.');
            setLoading(false);
        }
    };

    // Render PDF page to canvas
    useEffect(() => {
        if (pdfjsLoaded && pdfBlobUrl && isMobile && open) {
            renderPdfPage();
        }
    }, [pdfjsLoaded, pdfBlobUrl, currentPage, scale, isMobile, open]);

    const renderPdfPage = async () => {
        try {
            const pdfjsLib = (window as any).pdfjsLib;
            if (!pdfjsLib) return;

            const loadingTask = pdfjsLib.getDocument(pdfBlobUrl);
            const pdf = await loadingTask.promise;
            setNumPages(pdf.numPages);

            const page = await pdf.getPage(currentPage);
            const viewport = page.getViewport({ scale: scale * 1.5 }); // High-DPI render

            const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
            if (!canvas) return;

            const context = canvas.getContext('2d');
            if (!context) return;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            await page.render(renderContext).promise;
        } catch (err) {
            console.error('Error rendering PDF page:', err);
        }
    };

    const handleDownload = async () => {
        try {
            const response = await api.get(`/invoices/${invoice._id}/download`, {
                params: {
                    template: finalTemplateId,
                    color: finalColorScheme
                },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice_${invoice.invoiceNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('PDF downloaded successfully');
        } catch (error: any) {
            console.error('Download error:', error);
            toast.error('Failed to download PDF');
        }
    };

    const handleShare = async () => {
        try {
            const response = await api.post(`/invoices/${invoice._id}/share`);
            if (response.data.success) {
                const shareUrl = response.data.data.url;

                // Try native share API first
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: `Invoice #${invoice.invoiceNumber}`,
                            text: `Invoice for ${invoice.customerName}`,
                            url: shareUrl,
                        });
                        toast.success('Shared successfully');
                        return;
                    } catch (shareError) {
                        // User cancelled or share failed, continue to WhatsApp fallback
                    }
                }

                // Fallback to WhatsApp
                const message = `📄 *Invoice #${invoice.invoiceNumber}*\n\nCustomer: ${invoice.customerName}\nAmount: ₹${invoice.total}\n\nView Invoice: ${shareUrl}`;
                const whatsappUrl = `https://wa.me/${invoice.customerPhone || ''}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
                toast.success('Opening WhatsApp...');
            }
        } catch (error) {
            console.error('Error sharing invoice:', error);
            toast.error('Failed to generate share link');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-lg sm:rounded-xl">
                <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b flex-shrink-0 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                        <div className="flex-1">
                            <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Invoice Preview
                            </DialogTitle>
                            <p className="text-sm text-gray-500 mt-1 font-medium">{invoice.invoiceNumber}</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <Button
                                variant="outline"
                                onClick={handleShare}
                                disabled={loading}
                                className="flex-1 sm:flex-none gap-2 bg-white border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 transition-colors shadow-sm"
                            >
                                <Share2 className="w-4 h-4" />
                                Share
                            </Button>
                            <Button
                                onClick={handleDownload}
                                disabled={loading}
                                className="flex-1 sm:flex-none gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all"
                            >
                                <Download className="w-4 h-4" />
                                Download PDF
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden relative bg-gray-100 flex flex-col">
                    <Script
                        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
                        onLoad={() => {
                            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
                            setPdfjsLoaded(true);
                        }}
                    />

                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                <p className="text-gray-600 font-medium">Preparing Preview...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white p-6">
                            <div className="text-center max-w-md">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                                    <AlertCircle className="h-8 w-8 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load PDF</h3>
                                <p className="text-gray-600 mb-4">{error}</p>
                                <Button onClick={loadPdf} variant="outline">
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    ) : pdfBlobUrl ? (
                        <>
                            {isMobile ? (
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    {/* Mobile Controls */}
                                    <div className="bg-white border-b px-2 py-2 flex items-center justify-between shadow-sm z-10">
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage <= 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className="text-xs font-medium text-gray-600">
                                                {currentPage} / {numPages || '?'}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setCurrentPage(prev => Math.min(numPages || prev, prev + 1))}
                                                disabled={numPages ? currentPage >= numPages : false}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setScale(prev => Math.max(0.5, prev - 0.2))}
                                            >
                                                <ZoomOut className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setScale(prev => Math.min(3, prev + 0.2))}
                                            >
                                                <ZoomIn className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    {/* Canvas Area */}
                                    <div className="flex-1 overflow-auto bg-gray-200 p-4 flex justify-center items-start">
                                        <div className="bg-white shadow-lg origin-top transition-transform duration-200">
                                            <canvas id="pdf-canvas" className="max-w-full h-auto shadow-sm" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <iframe
                                    src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                                    className="w-full h-full border-0"
                                    title="Invoice PDF Preview"
                                />
                            )}
                        </>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
