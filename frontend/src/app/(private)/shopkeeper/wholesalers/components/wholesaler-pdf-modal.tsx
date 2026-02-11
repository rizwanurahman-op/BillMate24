'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/config/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { PdfViewer } from '@/components/app/pdf-viewer';

interface WholesalerPdfModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: {
        search?: string;
        status?: string;
        duesFilter?: string;
        sortBy?: string;
    };
}

export function WholesalerPdfModal({ open, onOpenChange, filters }: WholesalerPdfModalProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generatePdf = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams();
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
            if (filters.duesFilter && filters.duesFilter !== 'all') queryParams.append('duesFilter', filters.duesFilter);
            if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);

            const response = await api.get(`/wholesalers/export?${queryParams.toString()}`);
            const wholesalers = response.data.data;

            const doc = new jsPDF();
            const now = new Date();

            // --- Header Section ---
            doc.setFillColor(30, 58, 138); // Deep Blue
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text("WHOLESALERS REPORT", 14, 22);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text("Official Business Contact & Dues Summary", 14, 30);

            doc.setFontSize(8);
            doc.text(`File Ref: WH-${format(now, 'yyyyMMdd')}`, 196, 18, { align: 'right' });
            doc.text(`Generated: ${format(now, 'dd MMM yyyy, hh:mm a')}`, 196, 24, { align: 'right' });

            // --- Info Bar ---
            doc.setFillColor(248, 250, 252); // Slate 50
            doc.rect(0, 40, 210, 20, 'F');
            doc.setDrawColor(226, 232, 240); // Slate 200
            doc.line(0, 40, 210, 40);
            doc.line(0, 60, 210, 60);

            doc.setTextColor(71, 85, 105); // Slate 600
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text("REPORT SCOPE:", 14, 52);

            doc.setFont('helvetica', 'normal');
            let filterDesc = "All Wholesalers";
            if (filters.status && filters.status !== 'all') filterDesc += ` | Status: ${filters.status.toUpperCase()}`;
            if (filters.duesFilter && filters.duesFilter !== 'all') filterDesc += ` | Dues: ${filters.duesFilter.replace('_', ' ').toUpperCase()}`;

            doc.text(filterDesc, 45, 52);

            // --- Table Section ---
            const tableColumn = ["SL", "WHOLESALER NAME", "PHONE", "PURCHASED", "PAID", "OUTSTANDING", "STATUS"];

            const tableRows = wholesalers.map((w: any, index: number) => [
                (index + 1).toString(),
                w.name,
                w.phone || '-',
                w.totalPurchased.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                w.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                w.outstandingDue.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                w.isActive ? 'ACTIVE' : 'INACTIVE'
            ]);

            // Totals
            const totalPurchased = wholesalers.reduce((sum: number, w: any) => sum + w.totalPurchased, 0);
            const totalPaid = wholesalers.reduce((sum: number, w: any) => sum + w.totalPaid, 0);
            const totalOutstanding = wholesalers.reduce((sum: number, w: any) => sum + w.outstandingDue, 0);

            tableRows.push([
                "",
                "GRAND TOTAL",
                "",
                totalPurchased.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                ""
            ]);

            tableRows.push([
                "",
                "* Totals include opening balances",
                "",
                "",
                "",
                "",
                ""
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 70,
                theme: 'grid',
                headStyles: {
                    fillColor: [30, 58, 138],
                    textColor: [255, 255, 255],
                    fontSize: 8,
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle',
                    cellPadding: 4,
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: [15, 23, 42],
                    lineColor: [226, 232, 240],
                    cellPadding: 3
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 12 },    // SL
                    1: { fontStyle: 'bold', textColor: [30, 58, 138], cellWidth: 'auto' }, // NAME
                    2: { halign: 'center', cellWidth: 26 },    // PHONE
                    3: { halign: 'right', fontStyle: 'bold', cellWidth: 28 }, // PURCHASED
                    4: { halign: 'right', cellWidth: 22 },     // PAID
                    5: { halign: 'right', textColor: [185, 28, 28], cellWidth: 32 }, // OUTSTANDING (Increased to prevent 'G' wrapping)
                    6: { halign: 'center', cellWidth: 20 }     // STATUS
                },
                didParseCell: function (data) {
                    // Highlight Grand Total Row
                    if (data.row.index === tableRows.length - 2) {
                        data.cell.styles.fillColor = [30, 58, 138];
                        data.cell.styles.textColor = [255, 255, 255];
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fontSize = 9;
                    }

                    // Style the note row
                    if (data.row.index === tableRows.length - 1) {
                        data.cell.styles.fontStyle = 'italic';
                        data.cell.styles.textColor = [100, 116, 139];
                        data.cell.styles.fontSize = 7;
                    }

                    // Status Colors
                    if (data.column.index === 6 && data.row.index < tableRows.length - 2) {
                        if (data.cell.raw === 'ACTIVE') {
                            data.cell.styles.textColor = [21, 128, 61]; // Green 700
                        } else {
                            data.cell.styles.textColor = [100, 116, 139]; // Slate 500
                        }
                    }
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
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
    }, [filters]);

    useEffect(() => {
        if (open) {
            generatePdf();
        } else {
            setPdfDataUrl(null);
        }
    }, [open, generatePdf]);

    const handleDownload = () => {
        if (pdfDataUrl) {
            const link = document.createElement('a');
            link.href = pdfDataUrl;
            link.download = `Wholesalers_Report_${format(new Date(), 'dd-MMM-yyyy')}.pdf`;
            link.click();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-4xl h-[85vh] sm:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-none sm:border">
                <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b flex flex-row items-center justify-between space-y-0 bg-white z-20">
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg truncate mr-2">
                        <Printer className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0" />
                        <span className="truncate">{t('Preview Report')}</span>
                    </DialogTitle>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="hidden sm:flex"
                        >
                            {t('Cancel')}
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleDownload}
                            disabled={!pdfDataUrl || loading}
                            className="bg-blue-600 hover:bg-blue-700 h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
                        >
                            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            {t('Download')}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-gray-50 p-2 sm:p-4 overflow-hidden relative flex flex-col">
                    {loading && !pdfDataUrl && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-30">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                <p className="text-sm font-medium text-gray-600 italic">Preparing Report Data...</p>
                            </div>
                        </div>
                    )}

                    {error ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white rounded-xl shadow-inner border border-red-50">
                            <div className="bg-red-50 p-3 rounded-full mb-3 text-red-500">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <p className="text-red-600 font-medium mb-2">{error}</p>
                            <Button variant="outline" size="sm" onClick={generatePdf}>
                                Try Again
                            </Button>
                        </div>
                    ) : pdfDataUrl ? (
                        <PdfViewer url={pdfDataUrl} title="Wholesaler Report Preview" />
                    ) : null}
                </div>

                <div className="sm:hidden p-3 border-t bg-white flex justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="text-gray-500 font-normal"
                    >
                        Close Preview
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
