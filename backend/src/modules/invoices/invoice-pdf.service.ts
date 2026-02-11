import PDFDocument from 'pdfkit';
import { Response } from 'express';

export class InvoicePdfGenerator {
    private doc: PDFKit.PDFDocument;
    private invoice: any;
    private colorScheme: any;

    constructor(invoice: any, colorScheme: any) {
        this.invoice = invoice;
        this.colorScheme = colorScheme;
        this.doc = new PDFDocument({
            size: 'A4',
            margins: { top: 40, bottom: 0, left: 40, right: 40 }
        });

        // Normalize: combine shopAddress + shopPlace if place exists separately
        if (this.invoice.shopPlace && this.invoice.shopAddress && !this.invoice.shopAddress.includes(this.invoice.shopPlace)) {
            this.invoice.shopAddress = `${this.invoice.shopAddress}, ${this.invoice.shopPlace}`;
        } else if (this.invoice.shopPlace && !this.invoice.shopAddress) {
            this.invoice.shopAddress = this.invoice.shopPlace;
        }
    }

    async generateAndSend(res: Response, templateId: string): Promise<void> {
        res.setHeader('Content-Type', 'application/pdf');
        this.doc.pipe(res);
        this.doc.font('Helvetica');

        const template = (templateId || 'modern').toLowerCase();

        switch (template) {
            case 'classic':
                await this.renderClassicTemplate();
                break;
            case 'minimal':
                await this.renderMinimalTemplate();
                break;
            case 'professional':
                await this.renderProfessionalTemplate();
                break;
            case 'colorful':
                await this.renderColorfulTemplate();
                break;
            case 'tax':
            case 'standard':
                await this.renderStandardTemplate();
                break;
            default:
                await this.renderModernTemplate();
                break;
        }

        this.doc.end();
    }

    private formatCurrency(amount: number): string {
        return `Rs. ${amount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    private formatDate(date: string | Date): string {
        return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    private disableAutoPageBreak(): void {
        const doc = this.doc as any;
        doc.page.margins.bottom = -10000;
    }

    private preventPhantomPage(): void {
        const doc = this.doc as any;
        doc.y = 0;
        doc.x = 40;
        doc.page.margins.bottom = 0;
    }

    // ── Shared: Render items table rows ──
    private renderItems(
        yPos: number,
        contentBottomLimit: number,
        drawTableHeader: (y: number) => number,
        drawRow: (item: any, index: number, y: number) => void,
        rowHeight: number,
        resetFont: () => void
    ): number {
        if (!this.invoice.items) return yPos;
        this.invoice.items.forEach((item: any, i: number) => {
            if (yPos + rowHeight > contentBottomLimit) {
                this.doc.addPage();
                yPos = 50;
                yPos = drawTableHeader(yPos);
                resetFont();
            }
            drawRow(item, i, yPos);
            yPos += rowHeight;
        });
        return yPos;
    }

    // ── Shared: Render footer (notes, terms, totals, signature) ──
    private renderFooter(
        yPos: number,
        primaryColor: string,
        textColor: string,
        mutedColor: string,
        white: string,
        leftX: number = 50,
        rightX: number = 370
    ): number {
        this.disableAutoPageBreak();

        const footerNeededHeight = 200;
        if (yPos + footerNeededHeight > 780) {
            this.doc.addPage();
            this.disableAutoPageBreak();
            yPos = 50;
        }

        const footerStart = Math.max(yPos + 30, 580);
        if (footerStart + footerNeededHeight > 800) {
            // If even pushed down start is too close, use yPos directly
        }

        // ── Notes & Terms (Left Side) ──
        let notesY = footerStart;
        const hasNotes = this.invoice.notesEnabled && this.invoice.notes;
        const hasTerms = this.invoice.termsEnabled && this.invoice.terms;

        if (hasNotes || hasTerms) {
            const notesStartY = notesY;
            if (hasNotes) {
                this.doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryColor).text('Notes:', leftX + 8, notesY, { lineBreak: false });
                notesY += 12;
                const notesH = this.doc.heightOfString(this.invoice.notes, { width: 255 });
                this.doc.fontSize(8).font('Helvetica').fillColor(mutedColor).text(this.invoice.notes, leftX + 8, notesY, { width: 255, height: notesH + 2, lineBreak: true });
                notesY += notesH + 8;
            }
            if (hasTerms) {
                this.doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryColor).text('Terms & Conditions:', leftX + 8, notesY, { lineBreak: false });
                notesY += 12;
                const termsH = this.doc.heightOfString(this.invoice.terms, { width: 255 });
                this.doc.fontSize(8).font('Helvetica').fillColor(mutedColor).text(this.invoice.terms, leftX + 8, notesY, { width: 255, height: termsH + 2, lineBreak: true });
                notesY += termsH + 5;
            }
            this.doc.rect(leftX, notesStartY, 3, notesY - notesStartY).fill(primaryColor);
        }

        // ── Totals (Right Side) ──
        let totalY = footerStart;

        this.doc.fillColor(textColor).fontSize(9).font('Helvetica');
        this.doc.text('Subtotal', rightX, totalY, { lineBreak: false });
        this.doc.text(this.formatCurrency(this.invoice.subtotal), 465, totalY, { width: 80, align: 'right', lineBreak: false });
        totalY += 18;

        if (this.invoice.taxAmount > 0) {
            this.doc.text(`Tax (${this.invoice.taxRate}%)`, rightX, totalY, { lineBreak: false });
            this.doc.text(this.formatCurrency(this.invoice.taxAmount), 465, totalY, { width: 80, align: 'right', lineBreak: false });
            totalY += 18;
        }

        if (this.invoice.discount > 0) {
            this.doc.fillColor('#DC2626').text('Discount', rightX, totalY, { lineBreak: false });
            this.doc.text(`-${this.formatCurrency(this.invoice.discount)}`, 465, totalY, { width: 80, align: 'right', lineBreak: false });
            totalY += 18;
            this.doc.fillColor(textColor);
        }

        // Total highlight box
        totalY += 5;
        this.doc.rect(rightX - 5, totalY, 185, 25).fill(primaryColor);
        this.doc.fontSize(11).font('Helvetica-Bold').fillColor(white)
            .text('TOTAL', rightX, totalY + 7, { lineBreak: false });
        this.doc.text(this.formatCurrency(this.invoice.total), 465, totalY + 7, { width: 80, align: 'right', lineBreak: false });

        // ── Signature ──
        if (this.invoice.signatureEnabled) {
            const sigY = totalY + 70;
            if (this.invoice.signature) { try { this.doc.image(this.invoice.signature, 420, sigY - 40, { fit: [100, 40] }); } catch (e) { } }
            this.doc.moveTo(400, sigY).lineTo(545, sigY).lineWidth(0.5).strokeColor('#9CA3AF').stroke();
            this.doc.fontSize(8).fillColor(mutedColor).text(this.invoice.signatureName || 'Authorized Signature', 400, sigY + 5, { width: 145, align: 'center', lineBreak: false });
        }

        return totalY;
    }

    // ── Shared: Invoice meta details box ──
    private renderDetailsBox(boxX: number, boxY: number, textColor: string, mutedColor: string, borderColor: string = '#E5E7EB'): number {
        const hasDueDate = !!this.invoice.dueDate;
        const boxH = hasDueDate ? 75 : 50;
        this.doc.rect(boxX, boxY, 175, boxH).lineWidth(1).strokeColor(borderColor).stroke();
        let rowY = boxY + 8;
        // Invoice Number
        this.doc.fontSize(8).font('Helvetica-Bold').fillColor(textColor)
            .text('Invoice No.', boxX + 10, rowY, { lineBreak: false });
        this.doc.font('Helvetica').fillColor(mutedColor)
            .text(this.invoice.invoiceNumber, boxX + 85, rowY, { width: 80, align: 'right', lineBreak: false });
        rowY += 17;
        this.doc.moveTo(boxX + 10, rowY).lineTo(boxX + 165, rowY).lineWidth(0.5).strokeColor(borderColor).stroke();
        rowY += 7;
        // Date
        this.doc.font('Helvetica-Bold').fillColor(textColor)
            .text('Date', boxX + 10, rowY, { lineBreak: false });
        this.doc.font('Helvetica').fillColor(mutedColor)
            .text(this.formatDate(this.invoice.invoiceDate), boxX + 85, rowY, { width: 80, align: 'right', lineBreak: false });
        // Due Date
        if (hasDueDate) {
            rowY += 17;
            this.doc.moveTo(boxX + 10, rowY).lineTo(boxX + 165, rowY).lineWidth(0.5).strokeColor(borderColor).stroke();
            rowY += 7;
            this.doc.font('Helvetica-Bold').fillColor(textColor)
                .text('Due Date', boxX + 10, rowY, { lineBreak: false });
            this.doc.font('Helvetica').fillColor('#DC2626')
                .text(this.formatDate(this.invoice.dueDate), boxX + 85, rowY, { width: 80, align: 'right', lineBreak: false });
        }
        return boxY + boxH;
    }


    // ═══════════════════════════════════════════════════════════════
    //  1. CLASSIC TEMPLATE — Corporate, Clean, Grid-based
    // ═══════════════════════════════════════════════════════════════
    private async renderClassicTemplate() {
        const primaryColor = this.colorScheme?.primary || '#2563EB';
        const borderColor = '#E5E7EB';
        const black = '#111827';
        const white = '#FFFFFF';
        const grey = '#6B7280';
        const pageHeight = 841.89;
        const contentBottomLimit = 720;

        // ── 1. Top Accent Bar ──
        this.doc.rect(0, 0, 595, 8).fill(primaryColor);

        // ── 2. Header — Business Details ──
        let yPos = 30;
        this.doc.fontSize(22).font('Helvetica-Bold').fillColor(primaryColor)
            .text(this.invoice.shopName || 'Business Name', 50, yPos, { lineBreak: false });

        let shopInfoY = yPos + 28;
        this.doc.fontSize(9).font('Helvetica').fillColor(grey);
        if (this.invoice.shopAddress) {
            this.doc.text(this.invoice.shopAddress, 50, shopInfoY, { lineBreak: false });
            shopInfoY += 12;
        }
        if (this.invoice.shopPhone) {
            this.doc.text(`Phone: ${this.invoice.shopPhone}`, 50, shopInfoY, { lineBreak: false });
            shopInfoY += 12;
        }
        if (this.invoice.shopEmail) {
            this.doc.text(`Email: ${this.invoice.shopEmail}`, 50, shopInfoY, { lineBreak: false });
            shopInfoY += 12;
        }
        if (this.invoice.shopGstin) {
            this.doc.text(`GSTIN: ${this.invoice.shopGstin}`, 50, shopInfoY, { lineBreak: false });
        }

        // INVOICE watermark title (right side)
        this.doc.fontSize(36).font('Helvetica-Bold').fillColor('#E5E7EB')
            .text('INVOICE', 350, yPos - 5, { align: 'right', width: 195, lineBreak: false });

        // Invoice meta
        let metaY = yPos + 35;
        this.doc.fillColor(black).fontSize(9);
        this.doc.font('Helvetica-Bold').text('Invoice #', 370, metaY, { lineBreak: false });
        this.doc.font('Helvetica').fillColor('#374151').text(this.invoice.invoiceNumber, 450, metaY, { width: 95, align: 'right', lineBreak: false });
        metaY += 15;
        this.doc.font('Helvetica-Bold').fillColor(black).text('Date', 370, metaY, { lineBreak: false });
        this.doc.font('Helvetica').fillColor('#374151').text(this.formatDate(this.invoice.invoiceDate), 450, metaY, { width: 95, align: 'right', lineBreak: false });
        metaY += 15;
        if (this.invoice.dueDate) {
            this.doc.font('Helvetica-Bold').fillColor(black).text('Due Date', 370, metaY, { lineBreak: false });
            this.doc.font('Helvetica').fillColor('#DC2626').text(this.formatDate(this.invoice.dueDate), 450, metaY, { width: 95, align: 'right', lineBreak: false });
        }

        // ── Divider ──
        yPos = 110;
        this.doc.moveTo(50, yPos).lineTo(545, yPos).lineWidth(1).strokeColor(borderColor).stroke();

        // ── Bill To ──
        yPos += 15;
        this.doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryColor).text('BILL TO', 50, yPos, { characterSpacing: 1.5, lineBreak: false });
        yPos += 15;
        this.doc.fontSize(13).font('Helvetica-Bold').fillColor(black)
            .text(this.invoice.customerName || 'Customer Name', 50, yPos, { lineBreak: false });
        yPos += 18;
        this.doc.fontSize(9).font('Helvetica').fillColor(grey);
        if (this.invoice.customerAddress) { this.doc.text(this.invoice.customerAddress, 50, yPos, { lineBreak: false }); yPos += 12; }
        if (this.invoice.customerPhone) { this.doc.text(`Phone: ${this.invoice.customerPhone}`, 50, yPos, { lineBreak: false }); }

        // ── Items Table ──
        yPos += 30;
        const drawTableHeader = (y: number) => {
            this.doc.rect(50, y, 495, 25).fill(primaryColor);
            this.doc.fillColor(white).fontSize(8).font('Helvetica-Bold');
            this.doc.text('#', 60, y + 9, { lineBreak: false });
            this.doc.text('ITEM NAME', 85, y + 9, { lineBreak: false });
            this.doc.text('PRICE', 340, y + 9, { width: 65, align: 'right', lineBreak: false });
            this.doc.text('QTY', 415, y + 9, { width: 40, align: 'center', lineBreak: false });
            this.doc.text('TOTAL', 465, y + 9, { width: 70, align: 'right', lineBreak: false });
            return y + 25;
        };

        yPos = drawTableHeader(yPos);
        yPos = this.renderItems(yPos, contentBottomLimit, drawTableHeader, (item, i, y) => {
            if (i % 2 === 1) this.doc.rect(50, y, 495, 28).fill('#F9FAFB');
            this.doc.moveTo(50, y + 28).lineTo(545, y + 28).lineWidth(0.5).strokeColor(borderColor).stroke();
            this.doc.fillColor('#374151').fontSize(9)
                .text((i + 1).toString(), 60, y + 9, { lineBreak: false })
                .text(item.description, 85, y + 9, { width: 245, lineBreak: false })
                .text(this.formatCurrency(item.rate), 340, y + 9, { width: 65, align: 'right', lineBreak: false })
                .text(item.quantity.toString(), 415, y + 9, { width: 40, align: 'center', lineBreak: false })
                .font('Helvetica-Bold').text(this.formatCurrency(item.amount), 465, y + 9, { width: 70, align: 'right', lineBreak: false }).font('Helvetica');
        }, 28, () => { this.doc.fillColor(black).font('Helvetica'); });

        // ── Footer ──
        this.renderFooter(yPos, primaryColor, black, grey, white);

        // ── Bottom Bar ──
        this.doc.rect(0, pageHeight - 25, 595, 25).fill(primaryColor);
        this.doc.fillColor(white).fontSize(7).text('Thank you for your business!', 0, pageHeight - 16, { align: 'center', width: 595, lineBreak: false });

        this.preventPhantomPage();
    }


    // ═══════════════════════════════════════════════════════════════
    //  2. MODERN TEMPLATE — Premium Curves, Bold & Dynamic
    // ═══════════════════════════════════════════════════════════════
    private async renderModernTemplate() {
        const primaryColor = this.colorScheme?.primary || '#00AC9A';
        const darkColor = '#1A1A1A';
        const lightGrey = '#F9FAFB';
        const textColor = '#333333';
        const white = '#FFFFFF';
        const mutedText = '#6B7280';
        const contentBottomLimit = 740;

        // ── Header — Dynamic Curves ──
        this.doc.save();
        this.doc.moveTo(220, 0).lineTo(595, 0).lineTo(595, 135)
            .bezierCurveTo(480, 135, 370, 60, 220, 0).fill(darkColor);
        this.doc.moveTo(0, 0).lineTo(420, 0)
            .bezierCurveTo(380, 80, 200, 160, 0, 135).lineTo(0, 0).fill(primaryColor);
        this.doc.restore();

        // Shop Name
        this.doc.fontSize(20).font('Helvetica-Bold').fillColor(white)
            .text(this.invoice.shopName || 'Business Name', 40, 22, { lineBreak: false });

        // Shop details — bold white on primary curve
        let shopY = 48;
        this.doc.fontSize(9).font('Helvetica-Bold').fillColor(white);
        if (this.invoice.shopAddress) { this.doc.text(this.invoice.shopAddress, 40, shopY, { lineBreak: false }); shopY += 13; }
        if (this.invoice.shopPhone) { this.doc.text(`Ph: ${this.invoice.shopPhone}`, 40, shopY, { lineBreak: false }); shopY += 13; }
        if (this.invoice.shopEmail) { this.doc.text(this.invoice.shopEmail, 40, shopY, { lineBreak: false }); }

        // INVOICE title on dark curve
        this.doc.fontSize(28).font('Helvetica-Bold').fillColor(primaryColor)
            .text('INVOICE', 400, 30, { align: 'right', width: 155, lineBreak: false });

        // ── Bill To & Invoice Details ──
        let yPos = 145;
        this.doc.fontSize(7).font('Helvetica-Bold').fillColor(primaryColor)
            .text('BILL TO', 40, yPos, { characterSpacing: 1.5, lineBreak: false });
        yPos += 14;
        this.doc.fontSize(13).font('Helvetica-Bold').fillColor(textColor)
            .text(this.invoice.customerName || 'Customer Name', 40, yPos, { lineBreak: false });
        yPos += 18;
        this.doc.fontSize(9).font('Helvetica').fillColor(mutedText);
        if (this.invoice.customerAddress) { this.doc.text(this.invoice.customerAddress, 40, yPos, { lineBreak: false }); yPos += 12; }
        if (this.invoice.customerPhone) { this.doc.text(`Phone: ${this.invoice.customerPhone}`, 40, yPos, { lineBreak: false }); yPos += 12; }

        // Details box
        const detailsBoxBottom = this.renderDetailsBox(380, 145, textColor, mutedText);

        // ── Items Table ──
        yPos = Math.max(yPos + 15, detailsBoxBottom + 15);
        const drawTableHeader = (y: number) => {
            this.doc.rect(40, y, 515, 28).fill(primaryColor);
            this.doc.fillColor(white).fontSize(8).font('Helvetica-Bold');
            this.doc.text('SL.', 50, y + 10, { lineBreak: false });
            this.doc.text('ITEM NAME', 80, y + 10, { lineBreak: false });
            this.doc.text('PRICE', 340, y + 10, { width: 65, align: 'right', lineBreak: false });
            this.doc.text('QTY', 415, y + 10, { width: 40, align: 'center', lineBreak: false });
            this.doc.text('TOTAL', 465, y + 10, { width: 70, align: 'right', lineBreak: false });
            return y + 28;
        };

        yPos = drawTableHeader(yPos);
        yPos = this.renderItems(yPos, contentBottomLimit, drawTableHeader, (item, i, y) => {
            if (i % 2 === 0) this.doc.rect(40, y, 515, 30).fill(lightGrey);
            this.doc.moveTo(40, y + 30).lineTo(555, y + 30).lineWidth(0.5).strokeColor('#EEEEEE').stroke();
            this.doc.fillColor('#555555').fontSize(9)
                .text((i + 1).toString(), 50, y + 10, { lineBreak: false })
                .text(item.description, 80, y + 10, { width: 250, lineBreak: false })
                .text(this.formatCurrency(item.rate), 340, y + 10, { width: 65, align: 'right', lineBreak: false })
                .text(item.quantity.toString(), 415, y + 10, { width: 40, align: 'center', lineBreak: false })
                .font('Helvetica-Bold').text(this.formatCurrency(item.amount), 465, y + 10, { width: 70, align: 'right', lineBreak: false }).font('Helvetica');
        }, 30, () => { this.doc.font('Helvetica').fontSize(9); });

        // ── Footer ──
        this.renderFooter(yPos, primaryColor, textColor, mutedText, white, 40, 370);

        // ── Curved Footer Graphics ──
        this.doc.save();
        this.doc.moveTo(0, 790).bezierCurveTo(80, 790, 250, 760, 500, 842).lineTo(0, 842).fill(primaryColor);
        this.doc.moveTo(420, 842).bezierCurveTo(490, 815, 560, 815, 595, 825).lineTo(595, 842).fill(darkColor);
        this.doc.restore();
        this.doc.fillColor(white).fontSize(9).font('Helvetica-Bold')
            .text('Thank you for your business!', 40, 822, { lineBreak: false });

        this.preventPhantomPage();
    }


    // ═══════════════════════════════════════════════════════════════
    //  3. MINIMAL TEMPLATE — Ultra-clean, Maximum White Space
    // ═══════════════════════════════════════════════════════════════
    private async renderMinimalTemplate() {
        const primaryColor = this.colorScheme?.primary || '#111827';
        const black = '#111827';
        const white = '#FFFFFF';
        const grey = '#9CA3AF';
        const lightGrey = '#F3F4F6';
        const contentBottomLimit = 740;

        // ── Header — Simple & Clean ──
        // Thin top line
        this.doc.rect(0, 0, 595, 2).fill(primaryColor);

        let yPos = 30;

        // Shop Name (left, clean black)
        this.doc.fontSize(24).font('Helvetica-Bold').fillColor(black)
            .text(this.invoice.shopName || 'Business Name', 50, yPos, { lineBreak: false });

        // Shop details (subtle grey, single line format)
        let shopInfoY = yPos + 32;
        this.doc.fontSize(8).font('Helvetica').fillColor(grey);
        const shopParts: string[] = [];
        if (this.invoice.shopAddress) shopParts.push(this.invoice.shopAddress);
        if (this.invoice.shopPhone) shopParts.push(`Ph: ${this.invoice.shopPhone}`);
        if (this.invoice.shopEmail) shopParts.push(this.invoice.shopEmail);
        if (shopParts.length > 0) {
            this.doc.text(shopParts.join('  |  '), 50, shopInfoY, { lineBreak: false });
        }

        // INVOICE title (right side, light subtle)
        this.doc.fontSize(10).font('Helvetica-Bold').fillColor(grey)
            .text('INVOICE', 400, yPos + 5, { align: 'right', width: 145, lineBreak: false });

        // Invoice number large
        this.doc.fontSize(14).font('Helvetica-Bold').fillColor(black)
            .text(this.invoice.invoiceNumber, 400, yPos + 20, { align: 'right', width: 145, lineBreak: false });

        // Dates
        this.doc.fontSize(8).font('Helvetica').fillColor(grey);
        this.doc.text(`Date: ${this.formatDate(this.invoice.invoiceDate)}`, 400, yPos + 40, { align: 'right', width: 145, lineBreak: false });
        if (this.invoice.dueDate) {
            this.doc.text(`Due: ${this.formatDate(this.invoice.dueDate)}`, 400, yPos + 52, { align: 'right', width: 145, lineBreak: false });
        }

        // ── Thin divider ──
        yPos = 95;
        this.doc.moveTo(50, yPos).lineTo(545, yPos).lineWidth(0.5).strokeColor('#E5E7EB').stroke();

        // ── Bill To ──
        yPos += 18;
        this.doc.fontSize(7).font('Helvetica').fillColor(grey).text('BILL TO', 50, yPos, { characterSpacing: 2, lineBreak: false });
        yPos += 14;
        this.doc.fontSize(12).font('Helvetica-Bold').fillColor(black)
            .text(this.invoice.customerName || 'Customer Name', 50, yPos, { lineBreak: false });
        yPos += 16;
        this.doc.fontSize(8).font('Helvetica').fillColor(grey);
        if (this.invoice.customerAddress) { this.doc.text(this.invoice.customerAddress, 50, yPos, { lineBreak: false }); yPos += 11; }
        if (this.invoice.customerPhone) { this.doc.text(this.invoice.customerPhone, 50, yPos, { lineBreak: false }); }

        // ── Items Table (minimal — just lines) ──
        yPos += 28;
        const drawTableHeader = (y: number) => {
            this.doc.moveTo(50, y + 18).lineTo(545, y + 18).lineWidth(1).strokeColor(black).stroke();
            this.doc.fillColor(black).fontSize(7).font('Helvetica-Bold');
            this.doc.text('#', 55, y + 5, { lineBreak: false });
            this.doc.text('ITEM NAME', 80, y + 5, { lineBreak: false });
            this.doc.text('RATE', 340, y + 5, { width: 65, align: 'right', lineBreak: false });
            this.doc.text('QTY', 415, y + 5, { width: 40, align: 'center', lineBreak: false });
            this.doc.text('AMOUNT', 465, y + 5, { width: 70, align: 'right', lineBreak: false });
            return y + 22;
        };

        yPos = drawTableHeader(yPos);
        yPos = this.renderItems(yPos, contentBottomLimit, drawTableHeader, (item, i, y) => {
            this.doc.moveTo(50, y + 24).lineTo(545, y + 24).lineWidth(0.3).strokeColor('#E5E7EB').stroke();
            this.doc.fillColor('#374151').fontSize(9).font('Helvetica')
                .text((i + 1).toString(), 55, y + 7, { lineBreak: false })
                .text(item.description, 80, y + 7, { width: 250, lineBreak: false })
                .text(this.formatCurrency(item.rate), 340, y + 7, { width: 65, align: 'right', lineBreak: false })
                .text(item.quantity.toString(), 415, y + 7, { width: 40, align: 'center', lineBreak: false })
                .font('Helvetica-Bold').text(this.formatCurrency(item.amount), 465, y + 7, { width: 70, align: 'right', lineBreak: false }).font('Helvetica');
        }, 24, () => { this.doc.font('Helvetica').fontSize(9); });

        // Bold line after items
        this.doc.moveTo(50, yPos).lineTo(545, yPos).lineWidth(1).strokeColor(black).stroke();

        // ── Footer ──
        this.renderFooter(yPos, primaryColor, black, grey, white);

        // ── Bottom — simple line ──
        this.doc.moveTo(50, 820).lineTo(545, 820).lineWidth(0.5).strokeColor('#E5E7EB').stroke();
        this.doc.fillColor(grey).fontSize(7).font('Helvetica')
            .text('Thank you for your business', 0, 828, { align: 'center', width: 595, lineBreak: false });

        this.preventPhantomPage();
    }


    // ═══════════════════════════════════════════════════════════════
    //  4. PROFESSIONAL TEMPLATE — Sleek Modern Geometric Design
    // ═══════════════════════════════════════════════════════════════
    private async renderProfessionalTemplate() {
        const primaryColor = this.colorScheme?.primary || '#1E40AF';
        const darkColor = '#0F172A'; // Midnight Navy
        const accentColor = this.colorScheme?.secondary || '#3B82F6';
        const textColor = '#1E293B';
        const white = '#FFFFFF';
        const grey = '#64748B';
        const lightBg = '#F8FAFC';
        const borderColor = '#E2E8F0';
        const contentBottomLimit = 700;

        // ── 1. Geometric Header (Diagonal Stealth) ──
        this.doc.save();

        // Main Dark Background
        this.doc.rect(0, 0, 595, 140).fill(darkColor);

        // Diagonal Accent (Primary)
        this.doc.fillColor(primaryColor).moveTo(0, 0).lineTo(350, 0).lineTo(200, 140).lineTo(0, 140).fill();

        // Subtle Secondary Accent
        this.doc.fillColor(accentColor).moveTo(350, 0).lineTo(380, 0).lineTo(230, 140).lineTo(210, 140).fill();

        this.doc.restore();

        // Title Section
        this.doc.fontSize(36).font('Helvetica-Bold').fillColor(white)
            .text('INVOICE', 50, 45, { characterSpacing: 2, lineBreak: false });

        // Brand & Logo Area
        this.doc.fontSize(18).font('Helvetica-Bold').fillColor(white)
            .text(this.invoice.shopName || 'BRAND NAME', 350, 45, { align: 'right', width: 200, lineBreak: false });
        this.doc.fontSize(9).font('Helvetica').fillColor('#CBD5E1')
            .text(this.invoice.shopAddress || '', 350, 70, { align: 'right', width: 200, lineBreak: true });

        // Modern Logo Mark (Geometric squares)
        this.doc.rect(530, 20, 15, 15).fill(white);
        this.doc.rect(540, 30, 15, 15).lineWidth(1).strokeColor(primaryColor).stroke();

        // ── 2. Information Grid ──
        let yPos = 170;

        // Left: Bill To
        this.doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryColor).text('BILL TO', 50, yPos, { characterSpacing: 1.5 });
        this.doc.fontSize(14).font('Helvetica-Bold').fillColor(textColor).text(this.invoice.customerName || 'Customer Name', 50, yPos + 18);

        let infoY = yPos + 40;
        this.doc.fontSize(9).font('Helvetica').fillColor(grey);
        if (this.invoice.customerPhone) { this.doc.text(this.invoice.customerPhone, 50, infoY); infoY += 13; }
        if (this.invoice.customerEmail) { this.doc.text(this.invoice.customerEmail, 50, infoY); infoY += 13; }
        if (this.invoice.customerAddress) { this.doc.text(this.invoice.customerAddress, 50, infoY, { width: 220 }); }

        // Right: Invoice Meta (Clean Card Style)
        let metaX = 380;
        const metaRows = [];
        metaRows.push({ label: 'INVOICE NO', value: this.invoice.invoiceNumber });
        metaRows.push({ label: 'DATE', value: this.formatDate(this.invoice.invoiceDate) });
        if (this.invoice.dueDate) {
            metaRows.push({ label: 'DUE DATE', value: this.formatDate(this.invoice.dueDate) });
        }

        const metaRowHeight = 25;
        const metaBoxHeight = (metaRows.length * metaRowHeight) + 10;
        this.doc.rect(metaX - 15, yPos, 180, metaBoxHeight).lineWidth(0.5).strokeColor(borderColor).stroke();

        const drawMetaRow = (label: string, value: string, rowY: number, isLast: boolean = false) => {
            this.doc.fontSize(8).font('Helvetica-Bold').fillColor(grey).text(label, metaX, rowY);

            // Apply red color to Due Date value to match modern/classic patterns
            const valueColor = label === 'DUE DATE' ? '#DC2626' : textColor;

            this.doc.fontSize(9).font('Helvetica-Bold').fillColor(valueColor)
                .text(value, metaX + 55, rowY, { align: 'right', width: 105, lineBreak: false });
            if (!isLast) {
                this.doc.moveTo(metaX, rowY + 14).lineTo(metaX + 155, rowY + 14).lineWidth(0.3).strokeColor(borderColor).stroke();
            }
        };

        let currentMetaY = yPos + 10;
        metaRows.forEach((row, idx) => {
            drawMetaRow(row.label, row.value, currentMetaY, idx === metaRows.length - 1);
            currentMetaY += metaRowHeight;
        });

        // ── 3. Premium Data Table ──
        yPos = 290;
        const drawTableHeader = (y: number) => {
            this.doc.rect(50, y, 495, 28).fill(darkColor);
            this.doc.fillColor(white).fontSize(8).font('Helvetica-Bold');
            this.doc.text('SL.', 60, y + 10);
            this.doc.text('ITEM NAME', 90, y + 10);
            this.doc.text('PRICE', 330, y + 10, { width: 60, align: 'right' });
            this.doc.text('QTY', 410, y + 10, { width: 40, align: 'center' });
            this.doc.text('AMOUNT', 460, y + 10, { width: 75, align: 'right' });
            return y + 28;
        };

        yPos = drawTableHeader(yPos);
        yPos = this.renderItems(yPos, contentBottomLimit, drawTableHeader, (item, i, y) => {
            // Very subtle line & light highlight
            if (i % 2 === 1) this.doc.rect(50, y, 495, 28).fill(lightBg);
            this.doc.moveTo(50, y + 28).lineTo(545, y + 28).lineWidth(0.3).strokeColor(borderColor).stroke();

            this.doc.fillColor(textColor).fontSize(9).font('Helvetica')
                .text((i + 1).toString(), 60, y + 10)
                .text(item.description, 90, y + 10, { width: 220 })
                .text(this.formatCurrency(item.rate), 330, y + 10, { width: 60, align: 'right' })
                .text(item.quantity.toString(), 410, y + 10, { width: 40, align: 'center' })
                .font('Helvetica-Bold').text(this.formatCurrency(item.amount), 460, y + 10, { width: 75, align: 'right' });
        }, 28, () => this.doc.fillColor(textColor).font('Helvetica'));

        // ── 4. Polished Totals & Summary ──
        this.disableAutoPageBreak();
        let summaryY = Math.max(yPos + 35, 580);
        const totalsX = 360;
        const totalsWidth = 185;

        // Pre-calculate rows and height
        const summaryRows = [];
        summaryRows.push({ label: 'SUBTOTAL', value: this.formatCurrency(this.invoice.subtotal) });
        if (this.invoice.taxAmount > 0) {
            summaryRows.push({ label: `TAX AMOUNT (${this.invoice.taxRate}%)`, value: this.formatCurrency(this.invoice.taxAmount) });
        }
        if (this.invoice.discount > 0) {
            summaryRows.push({ label: 'DISCOUNT', value: `-${this.formatCurrency(this.invoice.discount)}` });
        }

        const summaryCardHeight = (summaryRows.length * 22) + 50; // rows + padding + total box
        this.doc.rect(totalsX, summaryY, totalsWidth, summaryCardHeight).fill(lightBg);

        let rowY = summaryY + 12;
        summaryRows.forEach(row => {
            const isDiscount = row.label === 'DISCOUNT';
            this.doc.fontSize(9).font('Helvetica').fillColor(isDiscount ? '#DC2626' : grey).text(row.label, totalsX + 15, rowY);
            this.doc.fillColor(isDiscount ? '#DC2626' : textColor).font('Helvetica-Bold').text(row.value, totalsX + 85, rowY, { align: 'right', width: 85 });
            rowY += 22;
        });

        // Total Amount Highlight
        rowY += 5;
        const totalBoxY = rowY - 5;
        this.doc.rect(totalsX, totalBoxY, totalsWidth, 30).fill(primaryColor);
        this.doc.fillColor(white).font('Helvetica-Bold').fontSize(11).text('TOTAL AMOUNT', totalsX + 15, rowY + 5);
        this.doc.text(this.formatCurrency(this.invoice.total), totalsX + 85, rowY + 5, { align: 'right', width: 85 });

        const finalSummaryBottom = totalBoxY + 30;

        // ── 5. Notes & Terms (Strategic Positioning) ──
        let bottomInfoY = summaryY + 12;
        const hasNotes = this.invoice.notesEnabled && this.invoice.notes;
        const hasTerms = this.invoice.termsEnabled && this.invoice.terms;

        if (hasNotes || hasTerms) {
            const startY = bottomInfoY;
            if (hasNotes) {
                this.doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryColor).text('NOTES', 58, bottomInfoY, { characterSpacing: 1 });
                bottomInfoY += 12;
                const notesH = this.doc.heightOfString(this.invoice.notes, { width: 250 });
                this.doc.fontSize(7.5).font('Helvetica').fillColor(textColor).text(this.invoice.notes, 58, bottomInfoY, { width: 250 });
                bottomInfoY += notesH + 15;
            }

            if (hasTerms) {
                this.doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryColor).text('TERMS & CONDITIONS', 58, bottomInfoY, { characterSpacing: 1 });
                bottomInfoY += 12;
                const termsH = this.doc.heightOfString(this.invoice.terms, { width: 250 });
                this.doc.fontSize(7.5).font('Helvetica').fillColor(textColor).text(this.invoice.terms, 58, bottomInfoY, { width: 250 });
                bottomInfoY += termsH + 5;
            }

            // Vertical Accent bar
            this.doc.rect(50, startY, 2, bottomInfoY - startY).fill(primaryColor);
        }

        // Signature - Positioned clearly below the total box
        if (this.invoice.signatureEnabled) {
            const sigLineY = Math.max(finalSummaryBottom + 70, 725);
            if (this.invoice.signature) {
                try {
                    this.doc.image(this.invoice.signature, 422, sigLineY - 45, { fit: [100, 40] });
                } catch (e) { }
            }
            this.doc.moveTo(400, sigLineY).lineTo(545, sigLineY).lineWidth(0.5).strokeColor(grey).stroke();
            this.doc.fontSize(9).font('Helvetica-Bold').fillColor(textColor).text(this.invoice.signatureName || 'AUTHORIZED SIGNATORY', 400, sigLineY + 8, { align: 'center', width: 145 });
        }

        // ── 5. Minimal Deep Footer ──
        this.doc.save();
        this.doc.rect(0, 810, 595, 32).fill(darkColor);
        // Triple colored accent strip
        this.doc.rect(0, 810, 200, 3).fill(primaryColor);
        this.doc.rect(200, 810, 200, 3).fill(accentColor);
        this.doc.rect(400, 810, 195, 3).fill('#94A3B8');
        this.doc.restore();

        this.doc.fillColor(white).fontSize(8).font('Helvetica-Bold').text('CONTACT US', 50, 822);
        this.doc.fontSize(8).font('Helvetica').fillColor('#94A3B8')
            .text(`${this.invoice.shopPhone || '+91 0000 000 000'}    |    ${this.invoice.shopEmail || 'contact@business.com'}`, 150, 822, { align: 'right', width: 395 });

        this.preventPhantomPage();
    }

    // ═══════════════════════════════════════════════════════════════
    //  5. COLORFUL TEMPLATE — Vibrant, Modern Gradients
    // ═══════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════
    //  5. COLORFUL TEMPLATE — Dynamic Brand Gradient
    // ═══════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════
    //  5. COLORFUL TEMPLATE — Vibrant Geometric Kaleidoscope
    // ═══════════════════════════════════════════════════════════════
    private async renderColorfulTemplate() {
        const primaryColor = this.colorScheme?.primary || '#EC4899'; // Pink
        const secondaryColor = this.colorScheme?.secondary || '#8B5CF6'; // Violet
        // Derived lighter tint for backgrounds
        const accentColor = '#F3F4F6';

        const deepPrimary = primaryColor;
        const vibrantText = secondaryColor;
        const white = '#FFFFFF';
        const black = '#111827';

        const contentBottomLimit = 730;

        // ── 1. Geometric Header Art ──
        this.doc.save();

        // Background Base
        this.doc.rect(0, 0, 595, 160).fill('#FAFAFA'); // Very light grey base

        // Abstract Shapes
        this.doc.circle(0, 0, 180).fillOpacity(0.8).fill(primaryColor);
        this.doc.circle(100, 50, 100).fillOpacity(0.6).fill(secondaryColor);
        this.doc.rect(400, -20, 250, 180).fillOpacity(0.1).fill(primaryColor);
        this.doc.circle(500, 120, 40).fillOpacity(0.2).fill(secondaryColor);

        this.doc.fillOpacity(1);

        // Shop Name (Oversized & White/Contrasting)
        this.doc.fontSize(28).font('Helvetica-Bold').fillColor(white)
            .text(this.invoice.shopName || 'Business', 40, 40, { width: 300 });

        // Shop Details (Pill Box)
        let shopY = 90;
        this.doc.roundedRect(40, shopY - 10, 300, 60, 10).fill(white);
        this.doc.fontSize(9).font('Helvetica').fillColor(black);

        let detailY = shopY;
        if (this.invoice.shopAddress) { this.doc.text(this.invoice.shopAddress, 50, detailY, { width: 280 }); detailY += 14; }
        const contact = [this.invoice.shopPhone, this.invoice.shopEmail].filter(Boolean).join(' • ');
        if (contact) { this.doc.text(contact, 50, detailY, { width: 280 }); }

        // Invoice Meta Card (Right, floating)
        this.doc.roundedRect(380, 40, 180, 100, 15).fill(white);
        // Accent strip on card
        this.doc.rect(380, 40, 8, 100).fill(secondaryColor);

        this.doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor)
            .text('INVOICE DETAILS', 400, 55);

        this.doc.fontSize(16).fillColor(black)
            .text(this.invoice.invoiceNumber, 400, 70);

        this.doc.fontSize(9).font('Helvetica').fillColor('#6B7280');
        this.doc.text(`Issued: ${this.formatDate(this.invoice.invoiceDate)}`, 400, 95);
        if (this.invoice.dueDate) {
            this.doc.fillColor('#DC2626').font('Helvetica-Bold')
                .text(`Due: ${this.formatDate(this.invoice.dueDate)}`, 400, 110);
        }

        this.doc.restore();

        // ── 3. Bill To (Styled Box) ──
        let yPos = 190;
        this.doc.moveTo(40, yPos).lineTo(555, yPos).lineWidth(2).strokeColor(primaryColor).stroke();

        yPos += 15;
        this.doc.fontSize(9).font('Helvetica-Bold').fillColor(secondaryColor).text('PREPARED FOR', 40, yPos);
        yPos += 15;
        this.doc.fontSize(15).font('Helvetica-Bold').fillColor(black).text(this.invoice.customerName || 'Client Name', 40, yPos);

        // Optional: Phone/Address inline
        yPos += 20;
        this.doc.fontSize(10).font('Helvetica').fillColor(black);
        let clientInfo = '';
        if (this.invoice.customerPhone) clientInfo += `Phone: ${this.invoice.customerPhone}   `;
        if (this.invoice.customerAddress) clientInfo += `Address: ${this.invoice.customerAddress}`;
        if (clientInfo) this.doc.text(clientInfo, 40, yPos);


        // ── 4. Items Table (Zebra Stripes) ──
        yPos = Math.max(yPos + 40, 260);

        const drawTableHeader = (y: number) => {
            this.doc.rect(40, y, 515, 32).fill(black);
            this.doc.fillColor(white).fontSize(9).font('Helvetica-Bold');
            this.doc.text('#', 50, y + 10, { width: 30, align: 'center' });
            this.doc.text('ITEM NAME', 90, y + 10);
            this.doc.text('PRICE', 330, y + 10, { width: 70, align: 'right' });
            this.doc.text('QTY', 420, y + 10, { width: 40, align: 'center' });
            this.doc.text('TOTAL', 470, y + 10, { width: 75, align: 'right' });
            return y + 32;
        };

        yPos = drawTableHeader(yPos);
        yPos = this.renderItems(yPos, contentBottomLimit, drawTableHeader, (item, i, y) => {
            // Zebra striping with primary color tint
            if (i % 2 === 0) {
                this.doc.rect(40, y, 515, 28).fillOpacity(0.05).fill(primaryColor);
                this.doc.fillOpacity(1);
            }
            this.doc.fillColor(black).fontSize(9).font('Helvetica')
                .text((i + 1).toString(), 50, y + 9, { width: 30, align: 'center' })
                .text(item.description, 90, y + 9, { width: 230 })
                .text(this.formatCurrency(item.rate), 330, y + 9, { width: 70, align: 'right' })
                .text(item.quantity.toString(), 420, y + 9, { width: 40, align: 'center' })
                .font('Helvetica-Bold').fillColor(primaryColor) // Amount in Primary
                .text(this.formatCurrency(item.amount), 470, y + 9, { width: 75, align: 'right' });
        }, 28, () => this.doc.font('Helvetica'));

        // ── 5. Footer Summary ──
        this.disableAutoPageBreak();
        let footerY = Math.max(yPos + 40, 600);
        const totalX = 350;

        // Big Total with Background Blob
        this.doc.save();
        this.doc.circle(480, footerY + 50, 90).fillOpacity(0.1).fill(secondaryColor);
        this.doc.restore();

        let rowY = footerY;
        const drawTotalRow = (label: string, value: string, bold: boolean = false, color: string = black) => {
            this.doc.fillColor(color).fontSize(bold ? 11 : 9).font(bold ? 'Helvetica-Bold' : 'Helvetica')
                .text(label, totalX, rowY);
            this.doc.text(value, totalX + 100, rowY, { width: 95, align: 'right' });
            rowY += 22;
        };

        drawTotalRow('Subtotal', this.formatCurrency(this.invoice.subtotal));
        if (this.invoice.taxAmount > 0) drawTotalRow(`Tax (${this.invoice.taxRate}%)`, this.formatCurrency(this.invoice.taxAmount));
        if (this.invoice.discount > 0) drawTotalRow('Discount', `-${this.formatCurrency(this.invoice.discount)}`, true, '#DC2626');

        this.doc.moveTo(totalX, rowY).lineTo(totalX + 200, rowY).lineWidth(1).strokeColor(black).stroke();
        rowY += 10;

        // Final Total
        this.doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor)
            .text('TOTAL', totalX, rowY);
        this.doc.text(this.formatCurrency(this.invoice.total), totalX + 80, rowY, { align: 'right', width: 115 });


        // Notes (Bottom Left)
        if (this.invoice.notes || this.invoice.terms) {
            let noteY = footerY;
            if (this.invoice.notes) {
                this.doc.fontSize(9).font('Helvetica-Bold').fillColor(secondaryColor).text('NOTES', 40, noteY);
                this.doc.fontSize(8).font('Helvetica').fillColor(black).text(this.invoice.notes, 40, noteY + 15, { width: 280 });
                noteY += 50;
            }
            if (this.invoice.terms) {
                this.doc.fontSize(9).font('Helvetica-Bold').fillColor(secondaryColor).text('TERMS', 40, noteY);
                this.doc.fontSize(8).font('Helvetica').fillColor(black).text(this.invoice.terms, 40, noteY + 15, { width: 280 });
            }
        }

        // Signature
        if (this.invoice.signatureEnabled) {
            // Calculate bottom of totals section
            const totalsBottom = rowY + 30;

            // Calculate bottom of notes/terms section
            let notesBottom = footerY;
            if (this.invoice.notes || this.invoice.terms) {
                if (this.invoice.notes) notesBottom += 65;
                if (this.invoice.terms) notesBottom += 65;
            }

            // Position signature below the lowest element
            const sigY = Math.max(totalsBottom, notesBottom) + 40;

            if (this.invoice.signature) {
                try { this.doc.image(this.invoice.signature, 380, sigY - 40, { fit: [100, 40] }); } catch (e) { }
            }
            this.doc.moveTo(380, sigY).lineTo(550, sigY).lineWidth(1).strokeColor(black).stroke();
            this.doc.fontSize(8).fillColor(black).text('AUTHORIZED SIGNATURE', 380, sigY + 5, { align: 'center', width: 170 });
        }

        this.doc.save();
        // Bottom Decoration
        this.doc.rect(0, 820, 595, 22).fill(black);
        this.doc.fillColor(white).fontSize(10).font('Helvetica-Bold')
            .text('THANK YOU', 0, 826, { align: 'center', width: 595 });
        this.doc.restore();

        this.preventPhantomPage();
    }


    // ═══════════════════════════════════════════════════════════════
    //  6. STANDARD / TAX TEMPLATE — Simple, Functional, No-frills
    // ═══════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════
    //  6. STANDARD TEMPLATE — Elite Executive Edition
    // ═══════════════════════════════════════════════════════════════
    private async renderStandardTemplate() {
        const primaryColor = this.colorScheme?.primary || '#1A1D24';
        const goldAccent = '#B4975A'; // Muted Executive Gold
        const charcoal = '#111827';
        const slate = '#4B5563';
        const silver = '#E5E7EB';
        const background = '#F9FAFB';
        const white = '#FFFFFF';
        const grey = '#64748B';
        const contentBottomLimit = 720;

        // ── 1. Vertical Split Header ──
        this.doc.save();

        // Brand Identity Section (Left)
        this.doc.fontSize(22).font('Helvetica-Bold').fillColor(charcoal)
            .text(this.invoice.shopName || 'BRAND IDENTITY', 50, 45, { characterSpacing: 1 });
        this.doc.fontSize(9).font('Helvetica').fillColor(slate)
            .text(this.invoice.shopAddress || 'BUSINESS SOLUTIONS', 50, 75, { characterSpacing: 1.5 });

        // Vertical Gold Separator
        this.doc.moveTo(300, 40).lineTo(300, 100).lineWidth(1.5).strokeColor(goldAccent).stroke();

        this.doc.restore();

        // Document Title (Right)
        this.doc.fontSize(32).font('Helvetica-Bold').fillColor(charcoal)
            .text('INVOICE', 320, 50, { characterSpacing: 4 });

        // ── 2. Strategic Info Grid ──
        let yPos = 160;

        // Top Horizontal Border (Gold)
        this.doc.moveTo(50, yPos - 15).lineTo(545, yPos - 15).lineWidth(0.5).strokeColor(goldAccent).stroke();

        // Recipient Info
        this.doc.fontSize(8).font('Helvetica-Bold').fillColor(goldAccent).text('CLIENT PARTICULARS', 50, yPos, { characterSpacing: 1 });
        this.doc.fontSize(14).font('Helvetica-Bold').fillColor(charcoal).text(this.invoice.customerName || 'Customer Name', 50, yPos + 18);

        let clientY = yPos + 40;
        this.doc.fontSize(9).font('Helvetica').fillColor(slate);
        if (this.invoice.customerAddress) { this.doc.text(this.invoice.customerAddress, 50, clientY, { width: 220 }); clientY += 25; }
        if (this.invoice.customerPhone) { this.doc.text(this.invoice.customerPhone, 50, clientY); }

        // Meta Column (Right-aligned)
        let metaX = 390;
        const metaRows = [];
        metaRows.push({ label: 'INVOICE NO.', value: this.invoice.invoiceNumber });
        metaRows.push({ label: 'DATE OF ISSUE', value: this.formatDate(this.invoice.invoiceDate) });
        if (this.invoice.dueDate) {
            metaRows.push({ label: 'MATURITY DATE', value: this.formatDate(this.invoice.dueDate) });
        }

        const drawEliteMeta = (label: string, value: string, y: number) => {
            const isDueDate = label === 'MATURITY DATE';
            this.doc.fontSize(8).font('Helvetica-Bold').fillColor(slate).text(label, metaX, y);
            this.doc.fontSize(9).font('Helvetica-Bold').fillColor(isDueDate ? '#DC2626' : charcoal)
                .text(value, metaX + 80, y, { align: 'right', width: 75, lineBreak: false });
        };

        let currentMetaY = yPos;
        metaRows.forEach(row => {
            drawEliteMeta(row.label, row.value, currentMetaY);
            currentMetaY += 22;
        });

        // ── 3. Executive Ledger Table ──
        yPos = 280;
        const drawTableHeader = (y: number) => {
            this.doc.rect(50, y, 495, 25).fill(background);
            this.doc.moveTo(50, y).lineTo(545, y).lineWidth(0.5).strokeColor(charcoal).stroke();
            this.doc.moveTo(50, y + 25).lineTo(545, y + 25).lineWidth(1).strokeColor(goldAccent).stroke();

            this.doc.fillColor(slate).fontSize(8).font('Helvetica-Bold');
            this.doc.text('SL', 60, y + 9);
            this.doc.text('ITEM NAME', 90, y + 9, { characterSpacing: 1 });
            this.doc.text('PRICE', 330, y + 9, { width: 65, align: 'right' });
            this.doc.text('QTY', 415, y + 9, { width: 30, align: 'center' });
            this.doc.text('SUBTOTAL', 465, y + 9, { width: 70, align: 'right' });
            return y + 25;
        };

        yPos = drawTableHeader(yPos);
        yPos = this.renderItems(yPos, contentBottomLimit, drawTableHeader, (item, i, y) => {
            this.doc.moveTo(50, y + 28).lineTo(545, y + 28).lineWidth(0.3).strokeColor(silver).stroke();
            this.doc.fillColor(charcoal).fontSize(9).font('Helvetica')
                .text((i + 1).toString(), 60, y + 10)
                .text(item.description, 90, y + 10, { width: 220 })
                .text(this.formatCurrency(item.rate), 330, y + 10, { width: 65, align: 'right' })
                .text(item.quantity.toString(), 415, y + 10, { width: 30, align: 'center' })
                .font('Helvetica-Bold').text(this.formatCurrency(item.amount), 465, y + 10, { width: 70, align: 'right' });
        }, 28, () => this.doc.fillColor(charcoal).font('Helvetica'));

        // ── 4. Financial Summary ──
        this.disableAutoPageBreak();
        let footerY = Math.max(yPos + 40, 580);

        // Summary Rows
        const summaryRows = [];
        summaryRows.push({ label: 'Aggregate Sum', value: this.invoice.subtotal, isNegative: false });
        if (this.invoice.taxAmount > 0) {
            summaryRows.push({ label: `Tax Compliance (${this.invoice.taxRate}%)`, value: this.invoice.taxAmount, isNegative: false });
        }
        if (this.invoice.discount > 0) {
            summaryRows.push({ label: 'Discretionary Discount', value: this.invoice.discount, isNegative: true });
        }

        const totalX = 380;
        let rowY = footerY;
        summaryRows.forEach(row => {
            const displayColor = row.isNegative ? '#DC2626' : slate;
            this.doc.fontSize(9).font('Helvetica').fillColor(displayColor).text(row.label, totalX, rowY);
            this.doc.fillColor(displayColor).font('Helvetica-Bold')
                .text(row.isNegative ? `-${this.formatCurrency(row.value)}` : this.formatCurrency(row.value), totalX + 80, rowY, { align: 'right', width: 75 });
            rowY += 22;
        });

        // Final Total
        rowY += 5;
        this.doc.rect(totalX - 10, rowY - 5, 175, 28).fill(charcoal);
        this.doc.fillColor(white).font('Helvetica-Bold').fontSize(11).text('TOTAL PAYABLE', totalX, rowY + 5);
        this.doc.text(this.formatCurrency(this.invoice.total), totalX + 80, rowY + 5, { align: 'right', width: 75 });
        const finalFooterBottom = rowY + 28;

        // ── 5. Notes & Terms (Elite Style) ──
        let noteY = footerY;
        const hasNotes = this.invoice.notesEnabled && this.invoice.notes;
        const hasTerms = this.invoice.termsEnabled && this.invoice.terms;
        if (hasNotes || hasTerms) {
            const startX = 50;
            const contentWidth = 260;
            const startY = noteY;
            if (hasNotes) {
                this.doc.fontSize(8).font('Helvetica-Bold').fillColor(goldAccent).text('OFFICIAL NOTES', startX + 10, noteY);
                noteY += 12;
                const h = this.doc.heightOfString(this.invoice.notes, { width: contentWidth });
                this.doc.fontSize(7.5).font('Helvetica').fillColor(slate).text(this.invoice.notes, startX + 10, noteY, { width: contentWidth });
                noteY += h + 15;
            }
            if (hasTerms) {
                this.doc.fontSize(8).font('Helvetica-Bold').fillColor(goldAccent).text('TERMS & CONDITIONS', startX + 10, noteY);
                noteY += 12;
                const h = this.doc.heightOfString(this.invoice.terms, { width: contentWidth });
                this.doc.fontSize(7.5).font('Helvetica').fillColor(slate).text(this.invoice.terms, startX + 10, noteY, { width: contentWidth });
                noteY += h + 5;
            }
            this.doc.rect(startX, startY, 2, noteY - startY).fill(goldAccent);
        }

        // Signature - Clearly positioned below total box
        if (this.invoice.signatureEnabled) {
            const sigLineY = Math.max(finalFooterBottom + 75, 740);
            if (this.invoice.signature) {
                try {
                    this.doc.image(this.invoice.signature, 420, sigLineY - 45, { fit: [100, 40] });
                } catch (e) { }
            }
            this.doc.moveTo(380, sigLineY).lineTo(545, sigLineY).lineWidth(0.5).strokeColor(slate).stroke();
            this.doc.fontSize(9).font('Helvetica-Bold').fillColor(charcoal)
                .text(this.invoice.signatureName || 'AUTHORIZED EXECUTIVE', 380, sigLineY + 8, { align: 'right', width: 165 });
        }

        // ── 6. Sophisticated Minimal Footer ──
        this.doc.save();
        this.doc.moveTo(0, 800).lineTo(595, 800).lineWidth(0.5).strokeColor(silver).stroke();
        const footerInfo = [
            this.invoice.shopPhone || '+91 000 000 0000',
            this.invoice.shopEmail || 'executive@firm.com'
        ].join('    •    ');
        this.doc.fontSize(7.5).font('Helvetica-Bold').fillColor(goldAccent).text('GET IN TOUCH', 0, 812, { align: 'center', width: 595, characterSpacing: 1 });
        this.doc.fontSize(7.5).font('Helvetica').fillColor(slate).text(footerInfo, 0, 825, { align: 'center', width: 595 });
        this.doc.restore();

        this.preventPhantomPage();
    }
}
