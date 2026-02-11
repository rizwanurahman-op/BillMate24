'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/config/axios';
import { PdfViewer } from '@/components/app/pdf-viewer';

interface InvoicePdfPreviewProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoiceId: string;
    invoiceNumber: string;
    templateId?: string;
    colorScheme?: string;
    status?: string;
    onFinalize?: () => void;
}

export function InvoicePdfPreview({
    open,
    onOpenChange,
    invoiceId,
    invoiceNumber,
    templateId = 'modern',
    colorScheme = 'blue',
    status,
    onFinalize,
}: InvoicePdfPreviewProps) {
    const [loading, setLoading] = useState(true);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            loadPdf();
        } else {
            if (pdfBlobUrl) {
                URL.revokeObjectURL(pdfBlobUrl);
                setPdfBlobUrl(null);
            }
        }
        return () => {
            if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
        };
    }, [open, invoiceId, templateId, colorScheme]);

    const loadPdf = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/invoices/${invoiceId}/pdf`, {
                params: {
                    template: templateId,
                    color: colorScheme
                },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setPdfBlobUrl(url);
            setLoading(false);
        } catch (err: any) {
            console.error('PDF load error:', err);
            setError('Failed to load PDF. Please try again.');
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!pdfBlobUrl) return;
        const link = document.createElement('a');
        link.href = pdfBlobUrl;
        link.download = `Invoice_${invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = async () => {
        // Attempt to share the PDF file directly if supported
        if (pdfBlobUrl && navigator.share && navigator.canShare) {
            try {
                const response = await fetch(pdfBlobUrl);
                const blob = await response.blob();
                const file = new File([blob], `Invoice_${invoiceNumber}.pdf`, { type: 'application/pdf' });

                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Invoice ${invoiceNumber}`,
                        text: `Invoice from ${invoiceNumber}`,
                    });
                    return; // Successfully shared file
                }
            } catch (err) {
                console.error('File sharing failed:', err);
            }
        }

        // Fallback to link sharing
        try {
            const response = await api.post(`/invoices/${invoiceId}/share`);
            if (response.data.success) {
                window.open(response.data.data.url, '_blank');
            }
        } catch (error) {
            console.error('Error sharing invoice link:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-[95vw] h-[85vh] sm:h-[90vh] p-0 flex flex-col overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-4 md:px-6 py-4 border-b flex-shrink-0 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="w-full md:w-auto">
                            <DialogTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Invoice Preview
                            </DialogTitle>
                            <p className="text-sm text-gray-600 mt-1">{invoiceNumber}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                            {status === 'draft' && onFinalize && (
                                <Button
                                    onClick={onFinalize}
                                    className="flex-1 md:flex-none gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-xs md:text-sm h-9 md:h-10 px-3"
                                >
                                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Finalize
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={handleShare}
                                className="flex-1 md:flex-none gap-2 text-xs md:text-sm h-9 md:h-10 px-3"
                            >
                                <Share2 className="w-3 h-3 md:w-4 md:h-4" />
                                Share
                            </Button>
                            <Button
                                onClick={handleDownload}
                                className="flex-1 md:flex-none gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs md:text-sm h-9 md:h-10 px-3"
                            >
                                <Download className="w-3 h-3 md:w-4 md:h-4" />
                                Download PDF
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* PDF Viewer */}
                <div className="flex-1 overflow-hidden relative bg-gray-100">
                    {loading && !pdfBlobUrl && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                <p className="text-gray-600 font-medium tracking-wide">Preparing Preview...</p>
                            </div>
                        </div>
                    )}

                    {error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 text-center">
                            <div className="bg-red-50 p-4 rounded-full mb-4">
                                <X className="h-8 w-8 text-red-500" />
                            </div>
                            <p className="text-gray-900 font-semibold mb-2">{error}</p>
                            <Button variant="outline" onClick={loadPdf}>Try Again</Button>
                        </div>
                    ) : pdfBlobUrl ? (
                        <PdfViewer url={pdfBlobUrl} title="Invoice PDF Preview" />
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
