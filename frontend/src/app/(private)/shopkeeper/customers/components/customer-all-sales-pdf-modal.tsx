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

interface CustomerAllSalesPdfModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entityType?: 'due_customer' | 'normal_customer';
    filters?: {
        search?: string;
        paymentMethod?: string;
        startDate?: string;
        endDate?: string;
    };
}

export function CustomerAllSalesPdfModal({ open, onOpenChange, entityType = 'due_customer', filters }: CustomerAllSalesPdfModalProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generatePdf = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('entityType', entityType);
            queryParams.append('billType', 'sale');
            if (filters?.search) queryParams.append('search', filters.search);
            if (filters?.paymentMethod && filters.paymentMethod !== 'all') queryParams.append('paymentMethod', filters.paymentMethod);
            if (filters?.startDate) queryParams.append('startDate', filters.startDate);
            if (filters?.endDate) queryParams.append('endDate', filters.endDate);

            const response = await api.get(`/bills/export?${queryParams.toString()}`);
            const bills = response.data.data;

            if (!bills || bills.length === 0) {
                setError('No sales bills found for the selected filters.');
                setLoading(false);
                return;
            }

            const doc = new jsPDF();
            const now = new Date();

            // --- Header Section ---
            doc.setFillColor(5, 150, 105); // Emerald 600
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            const title = entityType === 'due_customer' ? "DUE CUSTOMER SALES REPORT" : "NORMAL CUSTOMER SALES REPORT";
            doc.text(title, 14, 22);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text("Comprehensive Sale Bills History Report", 14, 30);

            doc.setFontSize(8);
            doc.text(`File Ref: ${entityType === 'due_customer' ? 'DCB' : 'NCB'}-${format(now, 'yyyyMMdd')}`, 196, 18, { align: 'right' });
            doc.text(`Generated: ${format(now, 'dd MMM yyyy, hh:mm a')}`, 196, 24, { align: 'right' });

            // --- Info Bar ---
            doc.setFillColor(236, 253, 245); // Emerald 50
            doc.rect(0, 40, 210, 20, 'F');
            doc.setDrawColor(167, 243, 208); // Emerald 200
            doc.line(0, 40, 210, 40);
            doc.line(0, 60, 210, 60);

            doc.setTextColor(5, 150, 105); // Emerald 600
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text("REPORT SCOPE:", 14, 52);

            doc.setFont('helvetica', 'normal');
            let filterDesc = entityType === 'due_customer' ? "All Due Customer Sale Bills" : "All Normal Customer Sale Bills";
            if (filters?.startDate && filters?.endDate) {
                filterDesc = `Range: ${format(new Date(filters.startDate), 'dd MMM yyyy')} - ${format(new Date(filters.endDate), 'dd MMM yyyy')}`;
            }

            doc.text(filterDesc, 45, 52);

            // --- Table Section ---
            const tableColumn = ["SL", "CUSTOMER", "BILL #", "AMOUNT", "PAID", "DUE", "DATE"];

            const tableRows = bills.map((b: any, index: number) => [
                (index + 1).toString(),
                b.entityName,
                b.billNumber,
                b.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                b.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                b.dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                format(new Date(b.createdAt), 'dd/MM/yy')
            ]);

            // Totals
            const totalAmount = bills.reduce((sum: number, b: any) => sum + b.totalAmount, 0);
            const totalPaid = bills.reduce((sum: number, b: any) => sum + b.paidAmount, 0);
            const totalDue = bills.reduce((sum: number, b: any) => sum + b.dueAmount, 0);

            tableRows.push([
                "",
                "GRAND TOTAL",
                "",
                totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                ""
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 70,
                theme: 'grid',
                headStyles: {
                    fillColor: [5, 150, 105],
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
                    0: { halign: 'center', cellWidth: 10 },    // SL
                    1: { fontStyle: 'bold', cellWidth: 'auto' }, // CUSTOMER
                    2: { halign: 'center', cellWidth: 25 },    // BILL #
                    3: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105], cellWidth: 28 }, // AMOUNT
                    4: { halign: 'right', cellWidth: 22 },     // PAID
                    5: { halign: 'right', textColor: [185, 28, 28], cellWidth: 22 }, // DUE
                    6: { halign: 'center', cellWidth: 20 }     // DATE
                },
                didParseCell: function (data) {
                    if (data.row.index === tableRows.length - 1) {
                        data.cell.styles.fillColor = [5, 150, 105];
                        data.cell.styles.textColor = [255, 255, 255];
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fontSize = 9;
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
            link.download = `Customer_Sales_${format(new Date(), 'dd-MMM-yyyy')}.pdf`;
            link.click();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-4xl h-[85vh] sm:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-none sm:border">
                <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b flex flex-row items-center justify-between space-y-0 bg-white z-20">
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg truncate mr-2">
                        <Printer className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
                        <span className="truncate">Preview Sales Report</span>
                    </DialogTitle>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="hidden sm:flex"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleDownload}
                            disabled={!pdfDataUrl || loading}
                            className="bg-emerald-600 hover:bg-emerald-700 h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
                        >
                            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Download
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-gray-50 p-2 sm:p-4 overflow-hidden relative flex flex-col">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-30">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                                <p className="text-sm font-medium text-gray-600 italic">Preparing Sales Report...</p>
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
                                title="Sales Report Preview"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 italic">
                            No preview available
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
