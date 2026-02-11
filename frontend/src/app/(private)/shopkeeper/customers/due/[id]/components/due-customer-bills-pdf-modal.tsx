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

interface DueCustomerBillsPdfModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: {
        _id: string;
        name: string;
        phone?: string;
        address?: string;
        totalSales: number;
        totalPaid: number;
        outstandingDue: number;
    };
    filters: {
        search?: string;
        startDate?: string;
        endDate?: string;
    };
}

export function DueCustomerBillsPdfModal({ open, onOpenChange, customer, filters }: DueCustomerBillsPdfModalProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generatePdf = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('entityId', customer._id);
            queryParams.append('billType', 'sale');
            queryParams.append('limit', '500'); // Export more items
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);

            const response = await api.get(`/bills/export?${queryParams.toString()}`);
            const bills = response.data.data;

            const doc = new jsPDF();
            const now = new Date();

            // --- Header Section ---
            doc.setFillColor(79, 70, 229); // Indigo 600
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text("SALE BILLS REPORT", 14, 20);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Customer: ${customer.name}`, 14, 28);
            if (customer.phone) doc.text(`Phone: ${customer.phone}`, 14, 33);

            doc.setFontSize(8);
            doc.text(`Generated: ${format(now, 'dd MMM yyyy, hh:mm a')}`, 196, 20, { align: 'right' });
            doc.text(`Total Sales: ${customer.totalSales.toLocaleString('en-IN')}`, 196, 28, { align: 'right' });

            // --- Table Section ---
            const tableColumn = ["DATE", "BILL #", "TOTAL AMOUNT", "PAID", "DUE", "METHOD"];
            const tableRows = bills.map((bill: any) => [
                format(new Date(bill.createdAt), 'dd/MM/yyyy'),
                bill.billNumber,
                bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                bill.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                bill.dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                bill.paymentMethod?.toUpperCase() || '-'
            ]);

            // Summary Totals from Wholesaler Object for absolute accuracy
            tableRows.push([
                "",
                "GRAND TOTAL",
                customer.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                customer.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                customer.outstandingDue.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                ""
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 50,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] },
                didParseCell: (data) => {
                    if (data.row.index === tableRows.length - 1) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [243, 244, 246];
                    }
                }
            });

            const blob = doc.output('bloburl');
            setPdfDataUrl(blob.toString());
        } catch (err: any) {
            console.error('PDF Generation Error:', err);
            setError('Failed to generate PDF');
        } finally {
            setLoading(false);
        }
    }, [customer, filters]);

    useEffect(() => {
        if (open) generatePdf();
    }, [open, generatePdf]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-4xl h-[85vh] sm:h-[90vh] flex flex-col p-0 border-none sm:border overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="h-5 w-5 text-indigo-600" />
                        Preview Sale Bills
                    </DialogTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
                        <Button
                            size="sm"
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = pdfDataUrl!;
                                link.download = `Bills_${customer.name}_${format(new Date(), 'dd-MMM-yyyy')}.pdf`;
                                link.click();
                            }}
                            disabled={!pdfDataUrl}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                    </div>
                </DialogHeader>
                <div className="flex-1 bg-gray-100 p-4 relative">
                    {loading && !pdfDataUrl && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-30">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                <p className="text-sm font-medium text-gray-600 italic">Preparing Bills Report...</p>
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
                        <PdfViewer url={pdfDataUrl} title="Bills Preview" />
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
