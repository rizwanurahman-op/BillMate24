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
import { FilterState } from './sales-filters';

interface DueCustomerPaymentsPdfModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: {
        _id: string;
        name: string;
        phone?: string;
        totalPaid: number;
    };
    filters?: FilterState;
}

export function DueCustomerPaymentsPdfModal({ open, onOpenChange, customer, filters }: DueCustomerPaymentsPdfModalProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generatePdf = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filters?.startDate) params.set('startDate', filters.startDate);
            if (filters?.endDate) params.set('endDate', filters.endDate);

            const response = await api.get(`/payments/customer/${customer._id}?${params.toString()}`);
            const payments = response.data.data;

            const doc = new jsPDF();
            const now = new Date();

            // --- Header Section ---
            doc.setFillColor(16, 185, 129); // Emerald 500
            doc.rect(0, 0, 210, 45, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text("PAYMENT HISTORY REPORT", 14, 20);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Customer: ${customer.name}`, 14, 28);
            if (customer.phone) doc.text(`Phone: ${customer.phone}`, 14, 33);

            if (filters?.startDate && filters?.endDate) {
                doc.text(`Range: ${format(new Date(filters.startDate), 'dd MMM yyyy')} - ${format(new Date(filters.endDate), 'dd MMM yyyy')}`, 14, 38);
            } else if (filters?.timeFilter && filters.timeFilter !== 'all') {
                doc.text(`Filter: ${filters.timeFilter.replace('_', ' ')}`, 14, 38);
            }

            doc.setFontSize(8);
            doc.text(`Generated: ${format(now, 'dd MMM yyyy, hh:mm a')}`, 196, 20, { align: 'right' });

            const currentTotal = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
            doc.text(`Filtered Total: ${currentTotal.toLocaleString('en-IN')}`, 196, 28, { align: 'right' });
            doc.text(`Overall Total: ${customer.totalPaid.toLocaleString('en-IN')}`, 196, 33, { align: 'right' });

            // --- Table Section ---
            const tableColumn = ["DATE", "AMOUNT", "METHOD", "NOTES"];
            const tableRows = payments.map((p: any) => [
                format(new Date(p.createdAt), 'dd/MM/yyyy hh:mm a'),
                p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                p.paymentMethod?.toUpperCase() || '-',
                p.notes || '-'
            ]);

            tableRows.push([
                "GRAND TOTAL",
                currentTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                "",
                ""
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 55,
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129] },
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
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="h-5 w-5 text-emerald-600" />
                        Preview Payment History
                    </DialogTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
                        <Button
                            size="sm"
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = pdfDataUrl!;
                                link.download = `Payments_${customer.name}_${format(new Date(), 'dd-MMM-yyyy')}.pdf`;
                                link.click();
                            }}
                            disabled={!pdfDataUrl}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                    </div>
                </DialogHeader>
                <div className="flex-1 bg-gray-100 p-4 relative">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                            <p className="text-sm text-gray-500">Generating PDF...</p>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full text-red-500">{error}</div>
                    ) : (
                        <iframe src={pdfDataUrl!} className="w-full h-full rounded border" />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
