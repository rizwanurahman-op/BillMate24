'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/config/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

import { Wholesaler } from '@/types';

interface WholesalerBillsPdfModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    wholesaler: Wholesaler;
    filters: {
        startDate?: string;
        endDate?: string;
        search?: string;
    };
}

export function WholesalerBillsPdfModal({ open, onOpenChange, wholesaler, filters }: WholesalerBillsPdfModalProps) {
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
            queryParams.append('billType', 'purchase');
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            if (filters.search) queryParams.append('search', filters.search);

            const response = await api.get(`/bills/export?${queryParams.toString()}`);
            const bills = response.data.data;

            const doc = new jsPDF();
            const now = new Date();

            // --- Header Section ---
            doc.setFillColor(30, 58, 138); // Deep Blue
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text("PURCHASE BILLS REPORT", 14, 22);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Wholesaler: ${wholesaler.name}`, 14, 30);

            doc.setFontSize(8);
            doc.text(`Generated: ${format(now, 'dd MMM yyyy, hh:mm a')}`, 196, 22, { align: 'right' });

            // --- Info Bar ---
            doc.setFillColor(248, 250, 252); // Slate 50
            doc.rect(14, 45, 182, 12, 'F');
            doc.setDrawColor(226, 232, 240); // Slate 200
            doc.rect(14, 45, 182, 12);

            doc.setTextColor(71, 85, 105);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text("REPORT SCOPE:", 18, 52.5);
            doc.setFont('helvetica', 'normal');

            let scopeText = "All History";
            if (filters.startDate && filters.endDate) {
                scopeText = `Range: ${format(new Date(filters.startDate), 'dd MMM yyyy')} - ${format(new Date(filters.endDate), 'dd MMM yyyy')}`;
            }
            if (filters.search) scopeText += ` | Search: "${filters.search}"`;
            doc.text(scopeText, 45, 52.5);

            // --- Table Section ---
            const tableColumn = ["SL", "DATE", "BILL NUMBER", "PURCHASED", "PAID", "DUE", "METHOD"];
            const tableRows = bills.map((bill: any, index: number) => [
                (index + 1).toString(),
                format(new Date(bill.createdAt), 'dd/MM/yy'),
                bill.billNumber,
                bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                bill.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                bill.dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                bill.paymentMethod?.toUpperCase() || '-'
            ]);

            // Totals
            const totalAmount = bills.reduce((sum: number, b: any) => sum + b.totalAmount, 0);
            const totalPaid = bills.reduce((sum: number, b: any) => sum + b.paidAmount, 0);
            const totalDue = bills.reduce((sum: number, b: any) => sum + b.dueAmount, 0);

            // Inferred Opening Balance / Balance B/F
            // This is more robust as it handles manual payments and filtered views correctly
            const initialPurchased = Math.max(0, wholesaler.totalPurchased - totalAmount);
            const initialPaid = Math.max(0, wholesaler.totalPaid - totalPaid);
            const initialDue = initialPurchased - initialPaid;

            const isFilteredSearch = !!filters.search;

            if (!isFilteredSearch && (Math.abs(initialPurchased) > 0.01 || Math.abs(initialPaid) > 0.01)) {
                tableRows.push([
                    "",
                    "",
                    "OPENING BALANCE / B.F.",
                    initialPurchased.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                    initialPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                    initialDue.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                    "-"
                ]);
            }

            // For Grand Total:
            // If it's a search, show only search totals.
            // If it's a full report (with or without dates), show everything including B/F.
            const grandPurchased = isFilteredSearch ? totalAmount : wholesaler.totalPurchased;
            const grandPaid = isFilteredSearch ? totalPaid : wholesaler.totalPaid;
            const grandDue = isFilteredSearch ? totalDue : wholesaler.outstandingDue;

            tableRows.push([
                "", "", "GRAND TOTAL",
                grandPurchased.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                grandPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                grandDue.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                ""
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 65,
                theme: 'grid',
                headStyles: {
                    fillColor: [30, 58, 138],
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
                    1: { halign: 'center', cellWidth: 20 },
                    2: { fontStyle: 'bold', textColor: [30, 58, 138], cellWidth: 40 },
                    3: { halign: 'right', fontStyle: 'bold', cellWidth: 28 },
                    4: { halign: 'right', cellWidth: 28 },
                    5: { halign: 'right', textColor: [185, 28, 28], cellWidth: 28 },
                    6: { halign: 'center', cellWidth: 20 }
                },
                didParseCell: function (data) {
                    if (data.row.index === tableRows.length - 1) {
                        data.cell.styles.fillColor = [30, 58, 138];
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
    }, [filters, wholesaler]);

    useEffect(() => {
        if (open) generatePdf();
        else setPdfDataUrl(null);
    }, [open, generatePdf]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-none sm:border">
                <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b flex flex-row items-center justify-between space-y-0 bg-white z-20">
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Printer className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        {t('Preview Report')}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={() => {
                                if (pdfDataUrl) {
                                    const link = document.createElement('a');
                                    link.href = pdfDataUrl;
                                    link.download = `Bills_${wholesaler.name}_${format(new Date(), 'dd-MM-yy')}.pdf`;
                                    link.click();
                                }
                            }}
                            disabled={!pdfDataUrl || loading}
                            className="bg-blue-600 hover:bg-blue-700 h-8 sm:h-9 text-xs sm:text-sm"
                        >
                            <Download className="h-3.5 w-3.5 mr-1.5 sm:mr-2" />
                            {t('Download')}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-gray-50 p-2 sm:p-4 overflow-hidden relative flex flex-col">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-30">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                <p className="text-sm font-medium text-gray-600 italic">Preparing Bills Report...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white rounded-xl border-red-50">
                            <X className="h-10 w-10 text-red-500 mb-2" />
                            <p className="text-red-600 font-medium">{error}</p>
                            <Button variant="outline" size="sm" onClick={generatePdf} className="mt-4">Try Again</Button>
                        </div>
                    ) : (
                        <iframe src={`${pdfDataUrl}#toolbar=0&navpanes=0&scrollbar=1`} className="w-full h-full rounded-lg border bg-white" title="Bills Preview" />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
