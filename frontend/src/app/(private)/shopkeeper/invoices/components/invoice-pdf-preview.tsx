'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, X } from 'lucide-react';
import { useState } from 'react';
import api from '@/config/axios';

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

    // Get the base URL from axios config
    const apiBaseUrl = api.defaults.baseURL || 'http://localhost:5000/api';

    // Get access token from cookies for iframe authentication
    const getAccessToken = () => {
        if (typeof document !== 'undefined') {
            const cookies = document.cookie.split(';');
            const tokenCookie = cookies.find(c => c.trim().startsWith('accessToken='));
            return tokenCookie ? tokenCookie.split('=')[1] : null;
        }
        return null;
    };

    const token = getAccessToken();
    const pdfUrl = `${apiBaseUrl}/invoices/${invoiceId}/pdf?template=${templateId}&color=${colorScheme}&token=${token}`;
    const downloadUrl = `${apiBaseUrl}/invoices/${invoiceId}/download?template=${templateId}&color=${colorScheme}&token=${token}`;

    const handleDownload = () => {
        window.open(downloadUrl, '_blank');
    };

    const handleShare = async () => {
        try {
            const response = await api.post(`/invoices/${invoiceId}/share`);

            if (response.data.success) {
                window.open(response.data.data.url, '_blank');
            }
        } catch (error) {
            console.error('Error sharing invoice:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-0 flex flex-col">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b flex-shrink-0 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Invoice Preview
                            </DialogTitle>
                            <p className="text-sm text-gray-600 mt-1">{invoiceNumber}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {status === 'draft' && onFinalize && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={onFinalize}
                                    className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Finalize Invoice
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleShare}
                                className="gap-2"
                            >
                                <Share2 className="w-4 h-4" />
                                Share
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleDownload}
                                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                                <Download className="w-4 h-4" />
                                Download PDF
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* PDF Viewer */}
                <div className="flex-1 overflow-hidden relative bg-gray-100">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                <p className="text-gray-600">Loading PDF...</p>
                            </div>
                        </div>
                    )}
                    <iframe
                        src={`${pdfUrl}#toolbar=0`}
                        className="w-full h-full border-0"
                        title="Invoice PDF Preview"
                        onLoad={() => setLoading(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
