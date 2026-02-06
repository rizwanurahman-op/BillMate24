import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface InvoiceData {
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate?: Date;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    shopName?: string;
    shopAddress?: string;
    shopPlace?: string;
    shopPhone?: string;
    items: Array<{
        description: string;
        quantity: number;
        rate: number;
        amount: number;
    }>;
    subtotal: number;
    taxRate?: number;
    taxAmount?: number;
    discount?: number;
    total: number;
    notes?: string;
    signature?: string;
    signatureName?: string;
}

interface ColorScheme {
    primary: string;
    secondary: string;
    accent: string;
}

export class InvoicePdfGenerator {
    private doc: PDFKit.PDFDocument;
    private colors: ColorScheme;
    private invoice: InvoiceData;
    private pageWidth = 595.28; // A4 width in points
    private pageHeight = 841.89; // A4 height in points
    private margin = 50;

    constructor(invoice: InvoiceData, colors: ColorScheme) {
        this.invoice = invoice;
        this.colors = colors;
        this.doc = new PDFDocument({ size: 'A4', margin: this.margin });
    }

    /**
     * Convert hex to RGB array
     */
    private hexToRgb(hex: string): [number, number, number] {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
    }

    /**
     * Format currency
     */
    /**
     * Format currency
     * Note: Standard fonts don't support ₹ symbol, using Rs. prefix
     */
    private formatCurrency(amount: number): string {
        try {
            const value = typeof amount === 'number' ? amount : 0;
            return 'Rs. ' + new Intl.NumberFormat('en-IN', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(value);
        } catch (e) {
            return 'Rs. 0';
        }
    }

    /**
     * Format date
     */
    private formatDate(date: any): string {
        try {
            if (!date) return '-';
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) return '-';
            return new Intl.DateTimeFormat('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }).format(dateObj);
        } catch (e) {
            return '-';
        }
    }

    /**
     * Generate Modern Template PDF
     */
    generateModernTemplate(): PDFKit.PDFDocument {
        let y = this.margin;
        const pageWidth = this.pageWidth;
        const pageHeight = this.pageHeight;
        const cyan = '#0ea5e9'; // Match image cyan
        const darkBlue = '#1e293b'; // Match image dark blue
        const lightGray = '#f1f5f9';

        // 1. Header Area
        // Logo / Company Name
        this.doc
            .fontSize(24)
            .fillColor(darkBlue)
            .font('Helvetica-Bold')
            .text(this.invoice.shopName || 'COMPANY NAME', this.margin, y);

        // Website (Right aligned)
        this.doc
            .fontSize(10)
            .fillColor('#64748b')
            .font('Helvetica')
            .text('www.websitename.com', pageWidth - this.margin - 150, y + 10, { width: 150, align: 'right' });

        y += 50;

        // INVOICE Title and Details (Left)
        this.doc
            .fontSize(32)
            .fillColor(darkBlue)
            .font('Helvetica-Bold')
            .text('INVOICE', this.margin, y);

        y += 38;
        this.doc
            .fontSize(10)
            .fillColor('#64748b')
            .font('Helvetica')
            .text(`Invoice # ${this.invoice.invoiceNumber}`, this.margin, y);

        y += 15;
        this.doc.text(`Date: ${this.formatDate(this.invoice.invoiceDate)}`, this.margin, y);

        // Client Details (Table style on the right)
        let clientY = y - 53;
        const labelX = pageWidth - 260;
        const valueX = pageWidth - 180;
        const rowH = 15;

        const drawClientRow = (label: string, value: string) => {
            if (!value) return;
            this.doc.fontSize(9).fillColor(cyan).font('Helvetica-Bold').text(label, labelX, clientY, { width: 75, align: 'right' });
            this.doc.fontSize(9).fillColor('#334155').font('Helvetica').text(value, valueX, clientY, { width: 130 });
            clientY += rowH;
        };

        drawClientRow('Invoice To', this.invoice.customerName);
        drawClientRow('Address', this.invoice.customerAddress || '-');
        drawClientRow('Email', this.invoice.customerEmail || '-');
        drawClientRow('Phone', this.invoice.customerPhone || '-');
        drawClientRow('Id', '0123456789'); // Placeholder or specific ID

        y = Math.max(y + 30, clientY + 20);

        // 2. Slanted Table Header
        const headerH = 35;
        const slantWidth = 40;
        const midPoint = (pageWidth - 2 * this.margin) * 0.4 + this.margin;

        // Dark Blue Part
        this.doc
            .fillColor(darkBlue)
            .moveTo(this.margin, y)
            .lineTo(midPoint + slantWidth, y)
            .lineTo(midPoint, y + headerH)
            .lineTo(this.margin, y + headerH)
            .closePath()
            .fill();

        // Cyan Part
        this.doc
            .fillColor(cyan)
            .moveTo(midPoint + slantWidth + 2, y)
            .lineTo(pageWidth - this.margin, y)
            .lineTo(pageWidth - this.margin, y + headerH)
            .lineTo(midPoint + 2, y + headerH)
            .closePath()
            .fill();

        // Header Text
        const slX = this.margin + 10;
        const descX = this.margin + 50;
        const rateX = pageWidth - 260;
        const qtyX = pageWidth - 160;
        const totalX = pageWidth - this.margin - 80;

        this.doc
            .fontSize(9)
            .fillColor('#FFFFFF')
            .font('Helvetica-Bold')
            .text('SL.', slX, y + 12)
            .text('ITEM DESCRIPTION', descX, y + 12)
            .text('PRICE', rateX, y + 12, { width: 70, align: 'right' })
            .text('QUANTITY', qtyX, y + 12, { width: 70, align: 'center' })
            .text('TOTAL', totalX, y + 12, { width: 70, align: 'right' });

        y += headerH;

        // 3. Items Table
        this.invoice.items.forEach((item, index) => {
            const rowHeight = 45;
            if (y + rowHeight > pageHeight - 150) {
                this.doc.addPage();
                y = this.margin;
            }

            // Alternating Background
            if (index % 2 !== 0) {
                this.doc.fillColor(lightGray).rect(this.margin, y, pageWidth - 2 * this.margin, rowHeight).fill();
            }

            this.doc.fillColor('#334155').fontSize(9).font('Helvetica');

            // SL number
            this.doc.text((index + 1).toString(), slX, y + 15, { width: 30, align: 'center' });

            // Description
            this.doc.font('Helvetica-Bold').text(item.description, descX, y + 10, { width: 230 });
            this.doc.fontSize(8).font('Helvetica').fillColor('#64748b').text('Customized design and development for your business.', descX, y + 22, { width: 230 });

            // Stats
            this.doc.fontSize(9).fillColor('#334155').font('Helvetica');
            this.doc.text(this.formatCurrency(item.rate), rateX, y + 15, { width: 70, align: 'right' });
            this.doc.text(item.quantity.toString(), qtyX, y + 15, { width: 70, align: 'center' });

            this.doc.font('Helvetica-Bold').text(this.formatCurrency(item.amount), totalX, y + 15, { width: 70, align: 'right' });

            y += rowHeight;
        });

        // 4. Terms, Notes & Totals Layout
        y += 30;
        const footerCol1 = this.margin;
        const footerCol2 = pageWidth - 240;

        // Left Column: Terms & Notes
        this.doc
            .fontSize(10)
            .fillColor(cyan)
            .font('Helvetica-Bold')
            .text('* Terms & Conditions/Notes:', footerCol1, y);

        y += 15;
        this.doc
            .fontSize(8)
            .fillColor('#64748b')
            .font('Helvetica')
            .text(this.invoice.notes || '', footerCol1, y, { width: 280 });

        y += 35;
        this.doc
            .fontSize(9)
            .fillColor('#64748b')
            .font('Helvetica-Bold')
            .text('THANK YOU FOR YOUR BUSINESS', footerCol1, y);

        // Right Column: Totals
        let totalY = y - 50;
        const totalLabelW = 80;
        const totalValueW = 100;

        const drawTotalRow = (label: string, value: string, isBig: boolean = false) => {
            this.doc.fontSize(isBig ? 12 : 9).fillColor(isBig ? darkBlue : '#64748b').font(isBig ? 'Helvetica-Bold' : 'Helvetica').text(label, footerCol2, totalY, { width: totalLabelW, align: 'right' });
            this.doc.fontSize(isBig ? 12 : 9).fillColor(isBig ? cyan : '#334155').font('Helvetica-Bold').text(value, footerCol2 + totalLabelW + 10, totalY, { width: totalValueW, align: 'right' });
            totalY += isBig ? 25 : 18;
        };

        drawTotalRow('Subtotal', this.formatCurrency(this.invoice.subtotal));
        if (this.invoice.taxRate) drawTotalRow('TAXes', `${this.invoice.taxRate}%`);
        if (this.invoice.discount) drawTotalRow('Discount', `${this.invoice.discount}`);

        this.doc.lineWidth(1).strokeColor(cyan).moveTo(footerCol2 + 50, totalY + 5).lineTo(pageWidth - this.margin, totalY + 5).stroke();
        totalY += 15;

        drawTotalRow('Total', this.formatCurrency(this.invoice.total), true);

        // 5. Signature & Payment Method
        y += 40;
        // Payment Method (Simplified for generic use)
        this.doc.fontSize(10).fillColor(cyan).font('Helvetica-Bold').text('Payment Information', this.margin, y);
        this.doc.fontSize(8).fillColor('#64748b').font('Helvetica').text('Please complete the payment by the due date.', this.margin, y + 15);

        // Signature Section
        const sigX = pageWidth - this.margin - 150;
        if (this.invoice.signature && this.invoice.signature.includes(',')) {
            try {
                // If signature is base64
                const base64Data = this.invoice.signature.split(',')[1];
                if (base64Data) {
                    const sigBuffer = Buffer.from(base64Data, 'base64');
                    this.doc.image(sigBuffer, sigX, y - 10, { width: 100 });
                } else {
                    throw new Error('No base64 data');
                }
            } catch (e) {
                this.doc.fontSize(16).fillColor(darkBlue).font('Courier-BoldOblique').text(this.invoice.signatureName || this.invoice.shopName || 'Signature', sigX, y - 5, { width: 150, align: 'center' });
            }
        } else {
            // Stylized placeholder for signature
            this.doc.fontSize(16).fillColor(darkBlue).font('Courier-BoldOblique').text(this.invoice.signatureName || this.invoice.shopName || 'Signature', sigX, y - 5, { width: 150, align: 'center' });
        }

        this.doc.lineWidth(0.5).strokeColor(darkBlue).moveTo(sigX, y + 18).lineTo(sigX + 150, y + 18).stroke();
        this.doc.fontSize(8).fillColor('#64748b').font('Helvetica').text(this.invoice.signatureName || 'Authorized Signatory', sigX, y + 23, { width: 150, align: 'center' });

        // 6. Footer Layout (Contact Info)
        const footerY = pageHeight - 80;

        // Bottom Slanted Bar
        this.doc
            .fillColor(darkBlue)
            .moveTo(0, pageHeight - 40)
            .lineTo(150, pageHeight - 40)
            .lineTo(170, pageHeight)
            .lineTo(0, pageHeight)
            .closePath()
            .fill();

        this.doc
            .fillColor(cyan)
            .moveTo(160, pageHeight - 40)
            .lineTo(pageWidth, pageHeight - 40)
            .lineTo(pageWidth, pageHeight - 15)
            .lineTo(180, pageHeight - 15)
            .closePath()
            .fill();

        const contactColW = (pageWidth - 2 * this.margin) / 3;

        // Col 1: Phone
        this.doc.fillColor(cyan).fontSize(12).text('📞', this.margin, footerY); // Icon Emoji
        this.doc.fillColor('#334155').fontSize(8).font('Helvetica').text(this.invoice.shopPhone || '(33) 785 9865 4780', this.margin + 20, footerY);

        // Col 2: Email / Website
        this.doc.fillColor(darkBlue).fontSize(12).text('✉️', this.margin + contactColW, footerY);
        this.doc.fillColor('#334155').fontSize(8).text(this.invoice.customerEmail || 'hello@jsn-smith.com', this.margin + contactColW + 20, footerY);

        // Col 3: Location
        this.doc.fillColor(cyan).fontSize(12).text('📍', this.margin + 2 * contactColW, footerY);
        this.doc.fillColor('#334155').fontSize(8).text(this.invoice.shopAddress || 'Ur 17, 11th Floor, M Road', this.margin + 2 * contactColW + 20, footerY);

        return this.doc;
    }

    /**
     * Generate Classic Template PDF
     */
    generateClassicTemplate(): PDFKit.PDFDocument {
        let y = this.margin;

        // Centered header
        this.doc
            .fontSize(40)
            .fillColor(this.colors.primary)
            .font('Times-Bold')
            .text('INVOICE', 0, y, { width: this.pageWidth, align: 'center' });

        y += 50;

        this.doc
            .fontSize(10)
            .fillColor('#666666')
            .font('Times-Roman')
            .text(this.invoice.invoiceNumber, 0, y, { width: this.pageWidth, align: 'center' });

        y += 30;

        // Double line separator
        this.doc
            .strokeColor(this.colors.primary)
            .lineWidth(2)
            .moveTo(this.margin, y)
            .lineTo(this.pageWidth - this.margin, y)
            .stroke();

        y += 5;

        this.doc
            .strokeColor(this.colors.primary)
            .lineWidth(2)
            .moveTo(this.margin, y)
            .lineTo(this.pageWidth - this.margin, y)
            .stroke();

        y += 40;

        // Two column layout for info
        // Left column - Customer
        const leftColumn = this.margin;
        const rightColumn = this.pageWidth / 2 + 20;

        this.doc
            .fontSize(10)
            .fillColor(this.colors.secondary)
            .font('Times-Bold')
            .text('BILL TO:', leftColumn, y);

        this.doc
            .fontSize(12)
            .fillColor('#000000')
            .font('Times-Bold')
            .text(this.invoice.customerName, leftColumn, y + 20);

        if (this.invoice.customerEmail) {
            this.doc
                .fontSize(10)
                .font('Times-Roman')
                .text(this.invoice.customerEmail, leftColumn, y + 38);
        }
        if (this.invoice.customerPhone) {
            this.doc.text(this.invoice.customerPhone, leftColumn, y + 53);
        }
        if (this.invoice.customerAddress) {
            this.doc.text(this.invoice.customerAddress, leftColumn, y + 68, { width: 200 });
        }

        // Right column - Dates
        this.doc
            .fontSize(10)
            .fillColor('#666666')
            .font('Times-Roman')
            .text('Invoice Date:', rightColumn, y, { align: 'right', width: 200 });

        this.doc
            .fontSize(11)
            .fillColor('#000000')
            .font('Times-Bold')
            .text(this.formatDate(this.invoice.invoiceDate), rightColumn, y + 15, { align: 'right', width: 200 });

        if (this.invoice.dueDate) {
            this.doc
                .fontSize(10)
                .fillColor('#666666')
                .font('Times-Roman')
                .text('Due Date:', rightColumn, y + 35, { align: 'right', width: 200 });

            this.doc
                .fontSize(11)
                .fillColor('#000000')
                .font('Times-Bold')
                .text(this.formatDate(this.invoice.dueDate), rightColumn, y + 50, { align: 'right', width: 200 });
        }

        y += 120;

        // Items Table
        const itemX = this.margin;
        const qtyX = this.pageWidth - 250;
        const rateX = this.pageWidth - 180;
        const amountX = this.pageWidth - 110;

        // Table header
        this.doc
            .strokeColor(this.colors.primary)
            .lineWidth(2)
            .moveTo(this.margin, y)
            .lineTo(this.pageWidth - this.margin, y)
            .stroke();

        y += 10;

        this.doc
            .fontSize(10)
            .fillColor(this.colors.secondary)
            .font('Times-Bold')
            .text('DESCRIPTION', itemX, y)
            .text('QTY', qtyX, y, { width: 60, align: 'center' })
            .text('RATE', rateX, y, { width: 60, align: 'right' })
            .text('AMOUNT', this.pageWidth - 130, y, { width: 80, align: 'right' });

        y += 18;

        this.doc
            .strokeColor(this.colors.primary)
            .lineWidth(2)
            .moveTo(this.margin, y)
            .lineTo(this.pageWidth - this.margin, y)
            .stroke();

        y += 15;

        // Items
        this.invoice.items.forEach((item) => {
            if (y > this.pageHeight - 200) {
                this.doc.addPage();
                y = this.margin;
            }

            this.doc
                .fontSize(10)
                .fillColor('#000000')
                .font('Times-Roman')
                .text(item.description, itemX, y);

            this.doc.text(item.quantity.toString(), qtyX, y, { width: 60, align: 'center' });

            this.doc.text(this.formatCurrency(item.rate), rateX, y, { width: 60, align: 'right' });

            this.doc.font('Times-Bold').text(this.formatCurrency(item.amount), this.pageWidth - 130, y, { width: 80, align: 'right' });

            y += 25;

            this.doc
                .strokeColor('#CCCCCC')
                .lineWidth(1)
                .moveTo(this.margin, y)
                .lineTo(this.pageWidth - this.margin, y)
                .stroke();

            y += 5;
        });

        y += 20;

        // Total box with border
        const totalsX = this.pageWidth - 230;
        const totalBoxY = y;
        const totalBoxWidth = 180;
        const totalBoxHeight = 60;

        // Draw border
        this.doc
            .rect(totalsX, totalBoxY, totalBoxWidth, totalBoxHeight)
            .lineWidth(2)
            .strokeColor(this.colors.primary)
            .stroke();

        this.doc
            .fontSize(14)
            .fillColor(this.colors.secondary)
            .font('Times-Bold')
            .text('TOTAL', totalsX + 15, totalBoxY + 20);

        this.doc
            .fontSize(20)
            .fillColor(this.colors.primary)
            .font('Times-Bold')
            .text(this.formatCurrency(this.invoice.total), totalsX, totalBoxY + 20, {
                width: totalBoxWidth - 10, // Adjusted to fit with padding
                align: 'right',
            });

        return this.doc;
    }


    /**
     * Generate Minimal Template PDF
     */
    generateMinimalTemplate(): PDFKit.PDFDocument {
        let y = this.margin;

        // Header - Minimal
        this.doc
            .fontSize(24)
            .fillColor('#333333')
            .font('Helvetica-Bold')
            .text('INVOICE', this.margin, y);

        this.doc
            .fontSize(10)
            .fillColor('#888888')
            .font('Helvetica')
            .text(`#${this.invoice.invoiceNumber}`, this.margin, y + 30);

        // Company Name on Right
        if (this.invoice.shopName) {
            this.doc
                .fontSize(12)
                .fillColor('#000000')
                .font('Helvetica-Bold')
                .text(this.invoice.shopName, this.pageWidth - 250, y, { width: 200, align: 'right' });

            if (this.invoice.shopAddress || this.invoice.shopPhone) {
                this.doc
                    .fontSize(9)
                    .fillColor('#666666')
                    .font('Helvetica')
                    .text(
                        [this.invoice.shopAddress, this.invoice.shopPhone].filter(Boolean).join('\n'),
                        this.pageWidth - 250,
                        y + 18,
                        { width: 200, align: 'right' }
                    );
            }
        }

        y += 80;

        // Thin Divider
        this.doc
            .strokeColor('#EEEEEE')
            .lineWidth(1)
            .moveTo(this.margin, y)
            .lineTo(this.pageWidth - this.margin, y)
            .stroke();

        y += 30;

        // Customer & Dates Grid
        const col1 = this.margin;
        const col2 = this.pageWidth / 2;

        this.doc
            .fontSize(10)
            .fillColor('#888888')
            .font('Helvetica')
            .text('BILLED TO', col1, y);

        this.doc
            .fontSize(12)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text(this.invoice.customerName, col1, y + 15);

        if (this.invoice.customerAddress) {
            this.doc
                .fontSize(9)
                .fillColor('#555555')
                .font('Helvetica')
                .text(this.invoice.customerAddress, col1, y + 30, { width: 200 });
        }

        // Dates Column
        this.doc
            .fontSize(10)
            .fillColor('#888888')
            .font('Helvetica')
            .text('DATE', col2, y);

        this.doc
            .fontSize(10)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text(this.formatDate(this.invoice.invoiceDate), col2, y + 15);

        if (this.invoice.dueDate) {
            this.doc
                .fontSize(10)
                .fillColor('#888888')
                .font('Helvetica')
                .text('DUE DATE', col2 + 100, y);

            this.doc
                .fontSize(10)
                .fillColor('#000000')
                .font('Helvetica-Bold')
                .text(this.formatDate(this.invoice.dueDate), col2 + 100, y + 15);
        }

        y += 80;

        // Table Header - Minimal
        const qtyX = this.pageWidth - 290;
        const rateX = this.pageWidth - 220;
        const amountX = this.pageWidth - 130; // Aligned to margin

        this.doc
            .fontSize(10)
            .fillColor('#888888')
            .font('Helvetica-Bold')
            .text('ITEM', this.margin, y)
            .text('QTY', qtyX, y, { width: 50, align: 'center' })
            .text('PRICE', rateX, y, { width: 70, align: 'right' })
            .text('TOTAL', amountX, y, { width: 80, align: 'right' });

        y += 15;
        this.doc
            .strokeColor('#EEEEEE')
            .lineWidth(1)
            .moveTo(this.margin, y)
            .lineTo(this.pageWidth - this.margin, y)
            .stroke();

        y += 15;

        // Items
        this.invoice.items.forEach((item) => {
            if (y > this.pageHeight - 100) {
                this.doc.addPage();
                y = this.margin;
            }

            this.doc
                .fontSize(10)
                .fillColor('#333333')
                .font('Helvetica')
                .text(item.description, this.margin, y, { width: 230 });

            this.doc.text(item.quantity.toString(), qtyX, y, { width: 50, align: 'center' });
            this.doc.text(this.formatCurrency(item.rate), rateX, y, { width: 70, align: 'right' });
            this.doc.text(this.formatCurrency(item.amount), amountX, y, { width: 80, align: 'right' });

            y += 25;
        });

        y += 20;

        // Divider
        this.doc
            .strokeColor('#EEEEEE')
            .lineWidth(1)
            .moveTo(this.pageWidth / 2, y)
            .lineTo(this.pageWidth - this.margin, y)
            .stroke();

        y += 20;

        // Totals
        const totalsX = this.pageWidth - 250;
        this.doc.fontSize(10).fillColor('#666666');

        this.doc.text('Subtotal', totalsX, y);
        this.doc.fillColor('#000000').text(this.formatCurrency(this.invoice.subtotal), totalsX + 100, y, { align: 'right', width: 100 });

        y += 30;
        this.doc.fontSize(12).font('Helvetica-Bold').text('Total', totalsX, y);
        this.doc.fontSize(14).text(this.formatCurrency(this.invoice.total), totalsX + 100, y - 2, { align: 'right', width: 100 });

        return this.doc;
    }


    /**
     * Generate Professional Template PDF
     */
    generateProfessionalTemplate(): PDFKit.PDFDocument {
        let y = this.margin;

        // Top Header Bar
        this.doc
            .rect(0, 0, this.pageWidth, 80)
            .fill('#2c3e50'); // Dark Blue-Gray

        this.doc
            .fontSize(28)
            .fillColor('#FFFFFF')
            .font('Helvetica-Bold')
            .text('INVOICE', this.margin, 25);

        this.doc
            .fontSize(10)
            .fillColor('#CCCCCC')
            .font('Helvetica')
            .text(this.invoice.invoiceNumber, this.pageWidth - 200, 25, { width: 150, align: 'right' });

        this.doc
            .fontSize(10)
            .fillColor('#AAAAAA')
            .text(this.formatDate(this.invoice.invoiceDate), this.pageWidth - 200, 40, { width: 150, align: 'right' });

        y = 100;

        // Company & Client Section (Side by Side Boxes)
        const boxWidth = (this.pageWidth - 3 * this.margin) / 2;

        // FROM Box
        this.doc
            .rect(this.margin, y, boxWidth, 100)
            .fillColor('#F9F9F9')
            .fill();

        this.doc
            .rect(this.margin, y, boxWidth, 100)
            .strokeColor('#EEEEEE')
            .stroke();

        this.doc
            .fillColor('#2c3e50')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('FROM:', this.margin + 15, y + 15);

        if (this.invoice.shopName) {
            this.doc
                .fontSize(12)
                .fillColor('#000000')
                .text(this.invoice.shopName, this.margin + 15, y + 35);

            if (this.invoice.shopAddress || this.invoice.shopPhone) {
                this.doc
                    .fontSize(9)
                    .fillColor('#555555')
                    .font('Helvetica')
                    .text(
                        [this.invoice.shopAddress, this.invoice.shopPhone].filter(Boolean).join('\n'),
                        this.margin + 15,
                        y + 53
                    );
            }
        }

        // TO Box
        const rightBoxX = this.margin + boxWidth + this.margin;
        this.doc
            .rect(rightBoxX, y, boxWidth, 100)
            .fillColor('#F9F9F9')
            .fill();

        this.doc
            .rect(rightBoxX, y, boxWidth, 100)
            .strokeColor('#EEEEEE')
            .stroke();

        this.doc
            .fillColor('#2c3e50')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('BILL TO:', rightBoxX + 15, y + 15);

        this.doc
            .fontSize(12)
            .fillColor('#000000')
            .text(this.invoice.customerName, rightBoxX + 15, y + 35);

        if (this.invoice.customerAddress) {
            this.doc
                .fontSize(9)
                .fillColor('#555555')
                .font('Helvetica')
                .text(this.invoice.customerAddress, rightBoxX + 15, y + 53, { width: boxWidth - 30 });
        }

        y += 130;

        // Table Header - Professional (Gray)
        this.doc
            .rect(this.margin, y, this.pageWidth - 2 * this.margin, 30)
            .fillColor('#E0E0E0')
            .fill();

        this.doc.fillColor('#000000');

        const qtyX = this.pageWidth - 290;
        const rateX = this.pageWidth - 220;
        const amountX = this.pageWidth - 130;

        this.doc
            .fontSize(9)
            .font('Helvetica-Bold')
            .text('DESCRIPTION', this.margin + 10, y + 10)
            .text('QTY', qtyX, y + 10, { width: 50, align: 'center' })
            .text('RATE', rateX, y + 10, { width: 60, align: 'right' })
            .text('AMOUNT', amountX, y + 10, { width: 80, align: 'right' });

        y += 30;

        // Items
        this.invoice.items.forEach((item, index) => {
            if (y > this.pageHeight - 120) {
                this.doc.addPage();
                y = this.margin;
            }

            // Striped effect
            if (index % 2 === 0) {
                this.doc
                    .rect(this.margin, y, this.pageWidth - 2 * this.margin, 30)
                    .fillColor('#FAFAFA')
                    .fill();
            }

            this.doc
                .fontSize(9)
                .fillColor('#333333')
                .font('Helvetica')
                .text(item.description, this.margin + 10, y + 10, { width: 230 });

            this.doc.text(item.quantity.toString(), qtyX, y + 10, { width: 50, align: 'center' });
            this.doc.text(this.formatCurrency(item.rate), rateX, y + 10, { width: 60, align: 'right' });
            this.doc.text(this.formatCurrency(item.amount), amountX, y + 10, { width: 80, align: 'right' });

            y += 30;
        });

        y += 20;

        // Totals Box
        const totalsWidth = 200;
        const totalsX = this.pageWidth - this.margin - totalsWidth;

        // Background for total
        this.doc
            .rect(totalsX - 10, y, totalsWidth + 10, 100)
            .fillColor('#F5F5F5')
            .fill();

        y += 10;

        this.doc.fillColor('#333333');
        this.doc.fontSize(9).font('Helvetica').text('Subtotal:', totalsX, y);
        this.doc.font('Helvetica-Bold').text(this.formatCurrency(this.invoice.subtotal), totalsX + 10, y, { width: 190, align: 'right' });

        y += 20;

        this.doc
            .rect(totalsX, y, totalsWidth - 10, 1) // Separator
            .fillColor('#DDDDDD')
            .fill();

        y += 10;

        // Total
        this.doc.fontSize(12).fillColor('#2c3e50').font('Helvetica-Bold').text('TOTAL', totalsX, y);
        this.doc.fontSize(14).text(this.formatCurrency(this.invoice.total), totalsX + 10, y - 2, { width: 190, align: 'right' });

        return this.doc;
    }


    /**
     * Generate Colorful Template PDF
     */
    generateColorfulTemplate(): PDFKit.PDFDocument {
        let y = 0;
        const [r, g, b] = this.hexToRgb(this.colors.primary);
        const [secR, secG, secB] = this.hexToRgb(this.colors.secondary);

        // Sidebar / Top Bar
        this.doc
            .rect(0, 0, this.pageWidth, 120) // Full width top bar
            .fill([r, g, b]);

        // Invoice Title
        this.doc
            .fontSize(36)
            .fillColor('#FFFFFF')
            .font('Helvetica-Bold')
            .text('INVOICE', this.margin, 40);

        this.doc
            .fontSize(12)
            .fillColor('#EEEEEE')
            .font('Helvetica')
            .text(`#${this.invoice.invoiceNumber}`, this.margin, 80);

        // Total circle overlay or accent
        this.doc
            .circle(this.pageWidth - 80, 60, 40)
            .fill([secR, secG, secB]);

        this.doc
            .fontSize(10)
            .fillColor('#FFFFFF')
            .text('TOTAL', this.pageWidth - 110, 45, { width: 60, align: 'center' });

        this.doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(this.formatCurrency(this.invoice.total).replace('Rs. ', ''), this.pageWidth - 120, 65, { width: 80, align: 'center' });

        y = 150;

        // Details Section
        const col1 = this.margin;
        const col2 = this.pageWidth / 2;

        this.doc
            .fontSize(10)
            .fillColor(this.colors.secondary)
            .font('Helvetica-Bold')
            .text('ISSUED TO', col1, y);

        this.doc
            .fontSize(14)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text(this.invoice.customerName, col1, y + 15);

        if (this.invoice.customerAddress) {
            this.doc
                .fontSize(10)
                .fillColor('#666666')
                .font('Helvetica')
                .text(this.invoice.customerAddress, col1, y + 35, { width: 200 });
        }

        this.doc
            .fontSize(10)
            .fillColor(this.colors.secondary)
            .font('Helvetica-Bold')
            .text('DATES', col2, y);

        this.doc.fillColor('#333333').font('Helvetica');
        this.doc.text(`Issued: ${this.formatDate(this.invoice.invoiceDate)}`, col2, y + 15);
        if (this.invoice.dueDate) {
            this.doc.text(`Due: ${this.formatDate(this.invoice.dueDate)}`, col2, y + 30);
        }

        y += 100;

        // Table
        // Header
        this.doc
            .rect(this.margin, y, this.pageWidth - 2 * this.margin, 30)
            .fill([secR, secG, secB]);

        const qtyX = this.pageWidth - 290;
        const rateX = this.pageWidth - 220;
        const amountX = this.pageWidth - 130;

        this.doc
            .fontSize(10)
            .fillColor('#FFFFFF')
            .font('Helvetica-Bold')
            .text('ITEM', this.margin + 10, y + 10)
            .text('QTY', qtyX, y + 10, { width: 50, align: 'center' })
            .text('PRICE', rateX, y + 10, { width: 70, align: 'right' })
            .text('TOTAL', amountX, y + 10, { width: 80, align: 'right' });

        y += 30;

        this.doc.fillColor('#000000');

        // Items
        this.invoice.items.forEach((item, index) => {
            if (y > this.pageHeight - 100) {
                this.doc.addPage();
                y = this.margin;
            }

            // Alternating rows
            if (index % 2 === 1) {
                this.doc
                    .rect(this.margin, y, this.pageWidth - 2 * this.margin, 25)
                    .fillColor('#F3F4F6')
                    .fill();
            }

            this.doc.fillColor('#000000'); // Reset fill color

            this.doc
                .fontSize(10)
                .font('Helvetica')
                .text(item.description, this.margin + 10, y + 7, { width: 230 });

            this.doc.text(item.quantity.toString(), qtyX, y + 7, { width: 50, align: 'center' });
            this.doc.text(this.formatCurrency(item.rate), rateX, y + 7, { width: 70, align: 'right' });
            this.doc.text(this.formatCurrency(item.amount), amountX, y + 7, { width: 80, align: 'right' });

            y += 25;
        });

        y += 30;

        // Footer Totals
        const totalsX = this.pageWidth - 250;

        this.doc.fontSize(10).fillColor('#666666').text('Subtotal:', totalsX, y);
        this.doc.fillColor('#000000').text(this.formatCurrency(this.invoice.subtotal), totalsX + 100, y, { width: 100, align: 'right' });

        y += 20;

        // Colorful Total Box
        this.doc
            .rect(totalsX - 10, y, 200, 40)
            .fill([r, g, b]);

        this.doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text('TOTAL', totalsX, y + 13);
        this.doc.fontSize(14).text(this.formatCurrency(this.invoice.total), totalsX + 100, y + 11, { width: 100, align: 'right' });

        return this.doc;
    }


    /**
     * Generate Standard Template PDF (GST Style)
     */
    generateStandardTemplate(): PDFKit.PDFDocument {
        let y = this.margin;

        // Full Page Border
        this.doc
            .rect(this.margin, this.margin, this.pageWidth - 2 * this.margin, this.pageHeight - 2 * this.margin)
            .strokeColor('#000000')
            .lineWidth(1)
            .stroke();

        // Header
        this.doc
            .fontSize(16)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('TAX INVOICE', 0, y + 15, { align: 'center' });

        y += 40;

        // Divider
        this.doc
            .moveTo(this.margin, y)
            .lineTo(this.pageWidth - this.margin, y)
            .stroke();

        // Info Section (Split)
        const midX = this.pageWidth / 2;

        this.doc
            .moveTo(midX, y)
            .lineTo(midX, y + 100)
            .stroke();

        // Left Info
        this.doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(this.invoice.shopName || 'Company Name', this.margin + 10, y + 10);

        this.doc
            .fontSize(9)
            .font('Helvetica')
            .text([this.invoice.shopAddress, this.invoice.shopPhone].filter(Boolean).join('\n'), this.margin + 10, y + 25);

        // Right Info
        this.doc
            .font('Helvetica-Bold')
            .text('Invoice No:', midX + 10, y + 10)
            .font('Helvetica')
            .text(this.invoice.invoiceNumber, midX + 80, y + 10);

        this.doc
            .font('Helvetica-Bold')
            .text('Date:', midX + 10, y + 25)
            .font('Helvetica')
            .text(this.formatDate(this.invoice.invoiceDate), midX + 80, y + 25);

        y += 100;

        this.doc
            .moveTo(this.margin, y)
            .lineTo(this.pageWidth - this.margin, y)
            .stroke();

        // Bill To Section
        this.doc
            .fillColor('#CCCCCC')
            .rect(this.margin, y, this.pageWidth - 2 * this.margin, 20)
            .fill();

        this.doc.fillColor('#000000').font('Helvetica-Bold').text('BILL TO', this.margin + 10, y + 5);

        y += 20;

        this.doc
            .moveTo(this.margin, y)
            .lineTo(this.pageWidth - this.margin, y)
            .stroke();

        this.doc
            .font('Helvetica-Bold')
            .text(this.invoice.customerName, this.margin + 10, y + 10);

        if (this.invoice.customerAddress) {
            this.doc.font('Helvetica').text(this.invoice.customerAddress, this.margin + 10, y + 25);
        }

        y += 60;

        // Table Header
        this.doc
            .moveTo(this.margin, y)
            .lineTo(this.pageWidth - this.margin, y)
            .stroke();

        this.doc
            .fillColor('#F0F0F0')
            .rect(this.margin, y, this.pageWidth - 2 * this.margin, 25)
            .fill();

        this.doc.fillColor('#000000');

        const qtyX = this.pageWidth - 290;
        const rateX = this.pageWidth - 220;
        const amountX = this.pageWidth - 130;

        // Vertical Lines for Table Header
        this.doc.moveTo(qtyX - 10, y).lineTo(qtyX - 10, y + 25).stroke();
        this.doc.moveTo(rateX - 10, y).lineTo(rateX - 10, y + 25).stroke();
        this.doc.moveTo(amountX - 10, y).lineTo(amountX - 10, y + 25).stroke();

        this.doc
            .fontSize(9)
            .font('Helvetica-Bold')
            .text('DESCRIPTION', this.margin + 10, y + 8)
            .text('QTY', qtyX, y + 8, { width: 50, align: 'center' })
            .text('RATE', rateX, y + 8, { width: 60, align: 'right' })
            .text('AMOUNT', amountX, y + 8, { width: 80, align: 'right' });

        y += 25;

        this.doc
            .moveTo(this.margin, y)
            .lineTo(this.pageWidth - this.margin, y)
            .stroke();

        // Items
        this.invoice.items.forEach((item) => {
            if (y > this.pageHeight - 150) {
                this.doc.addPage();
                y = this.margin;
            }

            const startY = y;

            this.doc
                .fontSize(9)
                .font('Helvetica')
                .text(item.description, this.margin + 10, y + 8, { width: 200 });

            this.doc.text(item.quantity.toString(), qtyX, y + 8, { width: 50, align: 'center' });
            this.doc.text(this.formatCurrency(item.rate), rateX, y + 8, { width: 60, align: 'right' });
            this.doc.text(this.formatCurrency(item.amount), amountX, y + 8, { width: 80, align: 'right' });

            y += 25;

            this.doc
                .moveTo(this.margin, y)
                .lineTo(this.pageWidth - this.margin, y)
                .stroke();

            // Vertical Lines for Row
            this.doc.moveTo(qtyX - 10, startY).lineTo(qtyX - 10, y).stroke();
            this.doc.moveTo(rateX - 10, startY).lineTo(rateX - 10, y).stroke();
            this.doc.moveTo(amountX - 10, startY).lineTo(amountX - 10, y).stroke();
        });

        // Footer Totals (Bordered)
        const totalsX = this.pageWidth - 250;

        // Subtotal
        this.doc.font('Helvetica').text('Subtotal', totalsX + 10, y + 8);
        this.doc.font('Helvetica-Bold').text(this.formatCurrency(this.invoice.subtotal), amountX, y + 8, { width: 70, align: 'right' });

        // Vertical line for totals
        this.doc.moveTo(amountX - 10, y).lineTo(amountX - 10, y + 25).stroke();

        y += 25;
        this.doc.moveTo(totalsX, y).lineTo(this.pageWidth - this.margin, y).stroke();

        // Total
        this.doc.font('Helvetica-Bold').text('TOTAL', totalsX + 10, y + 8);
        this.doc.fontSize(11).text(this.formatCurrency(this.invoice.total), amountX, y + 8, { width: 70, align: 'right' });

        // Vertical line for totals
        this.doc.moveTo(amountX - 10, y).lineTo(amountX - 10, y + 25).stroke();

        y += 25;
        this.doc.moveTo(this.margin, y).lineTo(this.pageWidth - this.margin, y).stroke();

        // Signatures
        y += 40;
        this.doc.fontSize(9).font('Helvetica').text('Authorized Signatory', this.pageWidth - 150, y, { align: 'right', width: 100 });

        return this.doc;
    }

    /**
     * Generate PDF and pipe to response
     */
    async generateAndSend(res: Response, templateId: string = 'modern'): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // Set response headers
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename="${this.invoice.invoiceNumber}.pdf"`);

                // Generate based on template
                switch (templateId) {
                    case 'classic': this.generateClassicTemplate(); break;
                    case 'minimal': this.generateMinimalTemplate(); break;
                    case 'professional': this.generateProfessionalTemplate(); break;
                    case 'colorful': this.generateColorfulTemplate(); break;
                    case 'standard': this.generateStandardTemplate(); break;
                    default: this.generateModernTemplate();
                }

                // Pipe to response
                this.doc.pipe(res);

                // Finalize PDF
                this.doc.end();

                this.doc.on('end', () => resolve());
                this.doc.on('error', (err) => reject(err));
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Generate PDF as buffer (for storage or email)
     */
    async generateBuffer(templateId: string = 'modern'): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];

            try {
                // Generate based on template
                switch (templateId) {
                    case 'classic': this.generateClassicTemplate(); break;
                    case 'minimal': this.generateMinimalTemplate(); break;
                    case 'professional': this.generateProfessionalTemplate(); break;
                    case 'colorful': this.generateColorfulTemplate(); break;
                    case 'standard': this.generateStandardTemplate(); break;
                    default: this.generateModernTemplate();
                }

                this.doc.on('data', (chunk: Buffer) => chunks.push(chunk));
                this.doc.on('end', () => resolve(Buffer.concat(chunks)));
                this.doc.on('error', (err) => reject(err));

                this.doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}
