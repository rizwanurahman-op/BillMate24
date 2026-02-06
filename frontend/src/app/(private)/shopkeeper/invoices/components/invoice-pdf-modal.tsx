'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, Loader2, X, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoicePreview } from './invoice-preview';
import { Invoice } from '@/types/invoice';

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
    colorSchemes
}: InvoicePdfModalProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generatePdf = useCallback(async () => {
        if (!invoice) return;
        setLoading(true);
        setError(null);
        try {
            // Wait for fonts to be ready
            try {
                if (typeof document !== 'undefined' && 'fonts' in document) {
                    await (document as any).fonts.ready;
                }
            } catch (e) {
                console.warn('Font loading check failed');
            }

            // delay for rendering
            await new Promise(resolve => setTimeout(resolve, 1500));

            const captureElement = document.getElementById('pixel-perfect-invoice-capture');
            if (!captureElement) {
                throw new Error('Capture area not ready. Please try again.');
            }

            const canvas = await html2canvas(captureElement, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 1000,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.getElementById('pixel-perfect-invoice-capture');
                    if (el) {
                        el.style.position = 'relative';
                        el.style.left = '0';
                        el.style.top = '0';
                        el.style.opacity = '1';
                        el.style.visibility = 'visible';
                        el.style.display = 'block';

                        // Fix for Tailwind 4 / Modern Browser 'lab' color issues
                        const allElements = el.getElementsByTagName('*');
                        for (let i = 0; i < allElements.length; i++) {
                            const node = allElements[i] as HTMLElement;
                            if (node.style) {
                                // Force standard colors if computed styles use lab/oklch
                                const computed = window.getComputedStyle(node);
                                if (computed.backgroundColor.includes('lab') || computed.backgroundColor.includes('oklch')) {
                                    node.style.backgroundColor = 'white';
                                }
                                if (computed.color.includes('lab') || computed.color.includes('oklch')) {
                                    node.style.color = 'black';
                                }
                            }
                        }
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png', 1.0);

            let pdf: any;
            try {
                const { jsPDF: NamedjsPDF } = await import('jspdf');
                pdf = new NamedjsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            } catch (e) {
                const DefaultjsPDF = require('jspdf');
                pdf = new DefaultjsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            }

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            const blob = pdf.output('blob');
            setPdfBlob(blob);
            const dataUrl = URL.createObjectURL(blob);
            setPdfDataUrl(dataUrl);

        } catch (err: any) {
            console.error('PDF Generation Detailed Error:', err);
            setError('Design conflict detected. Attempting automatic fix...');
            // Auto-retry once with a small delay
            setTimeout(() => {
                if (open) generatePdf();
            }, 1000);
        } finally {
            setLoading(false);
        }
    }, [invoice, templateId, colorScheme, colorSchemes, t, open]);

    useEffect(() => {
        if (open) {
            generatePdf();
        } else {
            // Clean up
            if (pdfDataUrl) URL.revokeObjectURL(pdfDataUrl);
            setPdfDataUrl(null);
            setPdfBlob(null);
        }
    }, [open, generatePdf]);

    const handleDownload = () => {
        if (pdfDataUrl) {
            const link = document.createElement('a');
            link.href = pdfDataUrl;
            link.download = `Invoice_${invoice.invoiceNumber}.pdf`;
            link.click();
        }
    };

    const handleShareWhatsApp = async () => {
        if (!pdfBlob) return;

        try {
            const file = new File([pdfBlob], `Invoice_${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Invoice #${invoice.invoiceNumber}`,
                    text: `Sharing invoice for ${invoice.customerName || 'customer'}`
                });
            } else {
                // Fallback: Just open WhatsApp with a message and encourage them to attach the downloaded file
                handleDownload();
                const message = `📄 *Invoice #${invoice.invoiceNumber}*\n\nCustomer: ${invoice.customerName}\nAmount: ${invoice.total}\n\nI am sending you the invoice PDF. Please check your downloads.`;
                const whatsappUrl = `https://wa.me/${invoice.customerPhone || ''}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
            }
        } catch (error) {
            console.error('Error sharing:', error);
            // Default WhatsApp link share as second fallback
            const message = `📄 *Invoice #${invoice.invoiceNumber}*\n\nCustomer: ${invoice.customerName}\nAmount: ${invoice.total}`;
            const whatsappUrl = `https://wa.me/${invoice.customerPhone || ''}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-4xl h-[85vh] sm:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0 bg-white z-20">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Printer className="h-4 w-4 text-blue-600" />
                        <span>{t('invoices.preview')}</span>
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleShareWhatsApp}
                            disabled={!pdfDataUrl || loading}
                            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 h-8"
                        >
                            <Share2 className="h-4 w-4 mr-2" />
                            {t('common.share')}
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleDownload}
                            disabled={!pdfDataUrl || loading}
                            className="bg-blue-600 hover:bg-blue-700 h-8"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {t('common.download')}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-gray-50 p-2 overflow-hidden relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-30">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                <p className="text-sm font-medium text-gray-600 italic">Generating Professional PDF...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white rounded-xl shadow-inner border border-red-50">
                            <div className="bg-red-50 p-3 rounded-full mb-3 text-red-500">
                                <X className="h-6 w-6" />
                            </div>
                            <p className="text-red-600 font-medium mb-2">{error}</p>
                            <Button variant="outline" size="sm" onClick={generatePdf}>
                                Try Again
                            </Button>
                        </div>
                    ) : pdfDataUrl ? (
                        <div className="w-full h-full rounded-lg overflow-hidden border shadow-sm bg-white relative">
                            <iframe
                                src={`${pdfDataUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                                className="w-full h-full"
                                title="Invoice PDF Preview"
                            />
                        </div>
                    ) : null}
                </div>

                {/* Hidden element for PDF capture - ensures exact design match */}
                <div className="fixed left-[-9999px] top-0 overflow-hidden" style={{ width: '800px' }}>
                    <div id="pixel-perfect-invoice-capture" className="bg-white p-8">
                        <InvoicePreview
                            invoice={invoice}
                            templateId={templateId}
                            colorScheme={colorScheme}
                            colorSchemes={colorSchemes}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Utility to convert Hex to RGB
function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}
