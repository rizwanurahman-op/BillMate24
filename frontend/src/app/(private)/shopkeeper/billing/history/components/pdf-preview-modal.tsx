import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, X, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import api from '@/config/axios';
import { useTranslation } from 'react-i18next';

interface PdfPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: any;
}

export function PdfPreviewModal({ open, onOpenChange, filters }: PdfPreviewModalProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            generatePdf();
        } else {
            setPdfDataUrl(null);
            setError(null);
        }
    }, [open]);

    const generatePdf = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all data based on filters
            // Construct query params
            let url = `/bills/export?`;
            const params = new URLSearchParams();
            if (filters.billType && filters.billType !== 'all') params.append('billType', filters.billType);
            if (filters.paymentMethod && filters.paymentMethod !== 'all') params.append('paymentMethod', filters.paymentMethod);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.includeDeleted) params.append('includeDeleted', 'true');
            if (filters.showOnlyEdited) params.append('isEdited', 'true');
            if (filters.search) params.append('search', filters.search);

            const response = await api.get(url + params.toString());
            const bills = response.data.data;

            if (!bills || bills.length === 0) {
                setError('No bills found to generate report.');
                setLoading(false);
                return;
            }

            // Create PDF
            const doc = new jsPDF();

            // --- Header Section ---
            // Main Branding Header
            doc.setFillColor(30, 58, 138); // Deep Blue (Blue 900)
            doc.rect(0, 0, 210, 40, 'F');

            // Title
            doc.setFontSize(26);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text("BILLING HISTORY", 14, 22);

            // Subtitle / Company Name (Simulated)
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(191, 219, 254); // Light Blue (Blue 200)
            doc.text("Official Financial Report", 14, 30);

            // Generation Date - Right Aligned in Header
            doc.setFontSize(10);
            doc.setTextColor(255, 255, 255);
            doc.text(`Generated: ${format(new Date(), 'dd MMMM yyyy')}`, 196, 22, { align: 'right' });
            doc.text(`Time: ${format(new Date(), 'hh:mm a')}`, 196, 28, { align: 'right' });

            // --- Info Box Section ---
            // Background for Info Box
            doc.setFillColor(241, 245, 249); // Slate 100
            doc.rect(14, 45, 182, 15, 'F');
            doc.setDrawColor(203, 213, 225); // Slate 300
            doc.setLineWidth(0.5);
            doc.line(14, 45, 196, 45); // Top divider
            doc.line(14, 60, 196, 60); // Bottom divider

            // Filter Information
            doc.setFontSize(9);
            doc.setTextColor(30, 41, 59); // Slate 800
            doc.setFont('helvetica', 'bold');
            doc.text("REPORT SCOPE", 18, 54);

            let filterText = "";
            if (filters.startDate && filters.endDate) {
                filterText = `${format(new Date(filters.startDate), 'dd MMM yyyy')} to ${format(new Date(filters.endDate), 'dd MMM yyyy')}`;
            } else {
                filterText = "All Time History";
            }

            doc.setFont('helvetica', 'normal');
            doc.text(`|  ${filterText}`, 50, 54);

            // Secondary filters
            let secondaryFilters = "";
            if (filters.billType !== 'all') secondaryFilters += `Type: ${filters.billType.toUpperCase()}  `;
            if (filters.paymentMethod !== 'all') secondaryFilters += `Payment: ${filters.paymentMethod.toUpperCase()}  `;
            if (secondaryFilters) {
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139); // Slate 500
                doc.text(secondaryFilters, 196, 54, { align: 'right' });
            }

            // --- Table Section ---
            const tableColumn = ["SL", "DATE", "BILL NUMBER", "ENTITY / NAME", "TYPE", "AMOUNT", "PAID", "DUE"];

            const tableRows = bills.map((bill: any, index: number) => [
                (index + 1).toString(),
                format(new Date(bill.createdAt), 'dd/MM/yy'),
                bill.billNumber,
                bill.entityName,
                bill.billType === 'sale' ? 'SALE' : 'PURCHASE',
                bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                bill.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                bill.dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })
            ]);

            // Totals Row
            const totalAmount = bills.reduce((sum: number, bill: any) => sum + bill.totalAmount, 0);
            const totalPaid = bills.reduce((sum: number, bill: any) => sum + bill.paidAmount, 0);
            const totalDue = bills.reduce((sum: number, bill: any) => sum + bill.dueAmount, 0);

            tableRows.push([
                "",
                "",
                "GRAND TOTAL",
                "",
                "",
                totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 70,
                theme: 'grid',
                headStyles: {
                    fillColor: [30, 58, 138], // Deep Blue header
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
                    lineColor: [226, 232, 240], // Light gray borders
                    cellPadding: 3
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 12 },    // SL (Increased to prevent S/L split)
                    1: { halign: 'center', cellWidth: 18 },    // DATE
                    2: { fontStyle: 'bold', textColor: [30, 58, 138], cellWidth: 42 }, // BILL NO (Increased to fit ID in one row)
                    3: { cellWidth: 'auto' },                  // ENTITY
                    4: { halign: 'center', cellWidth: 22 },    // TYPE (Slightly reduced but still fits PURCHASE)
                    5: { halign: 'right', fontStyle: 'bold', cellWidth: 21 }, // AMOUNT
                    6: { halign: 'right', cellWidth: 21 },     // PAID
                    7: { halign: 'right', textColor: [185, 28, 28], cellWidth: 21 } // DUE
                },
                didParseCell: function (data) {
                    // SL index is 0, Date 1, BillNo 2, Entity 3, Type 4, Amount 5, Paid 6, Due 7

                    // Highlight Grand Total Row
                    if (data.row.index === tableRows.length - 1) {
                        data.cell.styles.fillColor = [30, 58, 138];
                        data.cell.styles.textColor = [255, 255, 255];
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fontSize = 9;
                    }

                    // Style the Type column (Index 4)
                    if (data.column.index === 4 && data.row.index !== tableRows.length - 1) {
                        if (data.cell.raw === 'SALE') {
                            data.cell.styles.textColor = [21, 128, 61]; // Green 700
                        } else if (data.cell.raw === 'PURCHASE') {
                            data.cell.styles.textColor = [234, 88, 12]; // Orange 600
                        }
                    }
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                }
            });

            const pdfBlob = doc.output('bloburl').toString();
            setPdfDataUrl(pdfBlob);
        } catch (err) {
            console.error('Error generating PDF:', err);
            setError('Failed to generate PDF. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (pdfDataUrl) {
            const link = document.createElement('a');
            link.href = pdfDataUrl;
            link.download = `billing-history-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-none sm:border">
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
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-30">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                <p className="text-sm font-medium text-gray-600 italic">Formatting PDF Report...</p>
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
                            {/* Mobile-friendly instructions for PDF viewing */}
                            <div className="sm:hidden absolute top-2 right-2 z-10 opacity-60 pointer-events-none bg-black/10 px-2 py-1 rounded text-[10px] text-gray-600 flex items-center gap-1">
                                <span className="animate-pulse">●</span> PDF View
                            </div>
                            <iframe
                                src={`${pdfDataUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                                className="w-full h-full"
                                title="PDF Preview"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 italic">
                            No preview available
                        </div>
                    )}
                </div>

                {/* Mobile-only footer action */}
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
