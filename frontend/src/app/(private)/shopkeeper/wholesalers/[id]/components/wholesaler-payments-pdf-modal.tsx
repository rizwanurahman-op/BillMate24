'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, Loader2, X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/config/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { FilterState } from './transaction-filters';
import { PdfViewer } from '@/components/app/pdf-viewer';

import { Wholesaler } from '@/types';

interface WholesalerPaymentsPdfModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    wholesaler: Wholesaler;
    filters?: FilterState;
}

export function WholesalerPaymentsPdfModal({ open, onOpenChange, wholesaler, filters }: WholesalerPaymentsPdfModalProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generatePdf = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('entityId', wholesaler._id);
            queryParams.append('entityType', 'wholesaler');

            if (filters?.startDate) queryParams.append('startDate', filters.startDate);
            if (filters?.endDate) queryParams.append('endDate', filters.endDate);

            const response = await api.get(`/payments/export?${queryParams.toString()}`);
            const payments = response.data.data;

            const doc = new jsPDF();
            const now = new Date();

            // --- Header Section ---
            doc.setFillColor(21, 128, 61); // Green 700
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text("PAYMENT HISTORY REPORT", 14, 22);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Wholesaler: ${wholesaler.name}`, 14, 30);

            // Added Date Range Display
            let dateRangeText = "Date Range: All Time";
            if (filters?.startDate && filters?.endDate) {
                dateRangeText = `Date Range: ${format(new Date(filters.startDate), 'dd MMM yyyy')} - ${format(new Date(filters.endDate), 'dd MMM yyyy')}`;
            }
            doc.text(dateRangeText, 14, 35);

            doc.setFontSize(8);
            doc.text(`Generated: ${format(now, 'dd MMM yyyy, hh:mm a')}`, 196, 22, { align: 'right' });

            // --- Info Bar ---
            doc.setFillColor(240, 253, 244); // Green 50
            doc.rect(14, 45, 182, 12, 'F');
            doc.setDrawColor(187, 247, 208); // Green 200
            doc.rect(14, 45, 182, 12);

            doc.setTextColor(21, 128, 61);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text("TRANSACTION SUMMARY FOR:", 18, 52.5);
            doc.setFont('helvetica', 'normal');
            doc.text(wholesaler.name.toUpperCase(), 62, 52.5);

            // Add Filter Info if exists
            if (filters?.timeFilter && filters.timeFilter !== 'all') {
                doc.setFont('helvetica', 'bold');
                doc.text(`FILTER: ${filters.timeFilter.replace('_', ' ').toUpperCase()}`, 192, 52.5, { align: 'right' });
            }

            // --- Table Section ---
            const tableColumn = ["SL", "DATE", "AMOUNT PAID", "PAYMENT METHOD", "REMARKS / NOTES"];
            const tableRows = payments.map((p: any, index: number) => [
                (index + 1).toString(),
                format(new Date(p.createdAt), 'dd MMM yyyy, hh:mm a'),
                p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                p.paymentMethod?.toUpperCase() || '-',
                p.notes || '-'
            ]);

            // Totals
            const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);

            tableRows.push([
                "", "TOTAL PAYMENTS RECORDED",
                totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                "", ""
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 65,
                theme: 'grid',
                headStyles: {
                    fillColor: [21, 128, 61],
                    textColor: [255, 255, 255],
                    fontSize: 8,
                    fontStyle: 'bold',
                    halign: 'center',
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: [15, 23, 42],
                    lineColor: [226, 232, 240]
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 10 },
                    1: { halign: 'center', cellWidth: 35 },
                    2: { halign: 'right', fontStyle: 'bold', textColor: [21, 128, 61], cellWidth: 30 },
                    3: { halign: 'center', cellWidth: 30 },
                    4: { cellWidth: 'auto' }
                },
                didParseCell: function (data) {
                    if (data.row.index === tableRows.length - 1) {
                        data.cell.styles.fillColor = [21, 128, 61];
                        data.cell.styles.textColor = [255, 255, 255];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            });

            const blob = doc.output('bloburl');
            setPdfDataUrl(blob.toString());
        } catch (err: any) {
            console.error('PDF Generation Error:', err);
            setError('Failed to generate PDF. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [wholesaler, filters]);

    useEffect(() => {
        if (open) generatePdf();
        else setPdfDataUrl(null);
    }, [open, generatePdf]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-4xl h-[85vh] sm:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-none sm:border">
                <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b flex flex-row items-center justify-between space-y-0 bg-white z-20">
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Printer className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        {t('Preview Report')}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={() => {
                                if (pdfDataUrl) {
                                    const link = document.createElement('a');
                                    link.href = pdfDataUrl;
                                    link.download = `Payments_${wholesaler.name}_${format(new Date(), 'dd-MM-yy')}.pdf`;
                                    link.click();
                                }
                            }}
                            disabled={!pdfDataUrl || loading}
                            className="bg-green-600 hover:bg-green-700 h-8 sm:h-9 text-xs sm:text-sm"
                        >
                            <Download className="h-3.5 w-3.5 mr-1.5 sm:mr-2" />
                            {t('Download')}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-gray-50 p-2 sm:p-4 overflow-hidden relative flex flex-col">
                    {loading && !pdfDataUrl && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-30">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                                <p className="text-sm font-medium text-gray-600 italic">Preparing Payments History...</p>
                            </div>
                        </div>
                    )}

                    {error ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white rounded-xl border-red-50">
                            <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                            <p className="text-red-600 font-medium">{error}</p>
                            <Button variant="outline" size="sm" onClick={generatePdf} className="mt-4">Try Again</Button>
                        </div>
                    ) : pdfDataUrl ? (
                        <PdfViewer url={pdfDataUrl} title="Payments Preview" />
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
