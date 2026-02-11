'use client';

import { Invoice } from '@/types/invoice';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface InvoicePreviewProps {
    invoice: Partial<Invoice>;
    templateId: string;
    colorScheme: string;
    colorSchemes: Array<{ id: string; name: string; primary: string; secondary: string; accent: string }>;
}

function formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

// Helper function to convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
    if (!hex || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
        return `rgba(59, 130, 246, ${alpha})`;
    }

    try {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            return `rgba(59, 130, 246, ${alpha})`;
        }

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (e) {
        return `rgba(59, 130, 246, ${alpha})`;
    }
}

export function InvoicePreview({ invoice, templateId, colorScheme, colorSchemes }: InvoicePreviewProps) {
    const { t } = useTranslation();

    const defaultColorScheme = {
        id: 'blue',
        name: 'Blue',
        primary: '#3B82F6',
        secondary: '#1E40AF',
        accent: '#DBEAFE'
    };

    const selectedColor = colorSchemes?.find(c => c.id === colorScheme) || colorSchemes?.[0] || defaultColorScheme;

    // Modern Template - Clean, Professional, Well-Aligned
    const renderModernTemplate = () => (
        <div className="bg-white" style={{ fontFamily: 'Inter, system-ui, sans-serif', minHeight: '1056px' }}>
            {/* Header Section */}
            <div className="px-12 pt-12 pb-8" style={{ background: `linear-gradient(135deg, ${selectedColor.primary} 0%, ${selectedColor.secondary} 100%)` }}>
                <div className="flex justify-between items-start text-white">
                    <div>
                        <h1 className="text-5xl font-bold mb-3">INVOICE</h1>
                        <p className="text-xl opacity-90">{invoice.invoiceNumber || 'INV-2026-001'}</p>
                    </div>
                    <div className="text-right bg-white/10 backdrop-blur-sm px-6 py-4 rounded-lg">
                        <p className="text-sm opacity-80 mb-1">{t('invoices.invoice_date')}</p>
                        <p className="text-lg font-semibold">
                            {invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'dd MMM yyyy') : format(new Date(), 'dd MMM yyyy')}
                        </p>
                        {invoice.dueDate && (
                            <>
                                <p className="text-sm opacity-80 mt-3 mb-1">{t('invoices.due_date')}</p>
                                <p className="text-lg font-semibold">{format(new Date(invoice.dueDate), 'dd MMM yyyy')}</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-12 py-8">
                {/* Business & Customer Details */}
                <div className="grid grid-cols-2 gap-8 mb-10">
                    {/* From */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: selectedColor.secondary }}>From</p>
                        <div className="bg-gray-50 p-5 rounded-lg border-l-4" style={{ borderColor: selectedColor.primary }}>
                            <p className="font-bold text-xl mb-2">{invoice.shopName || 'Your Business Name'}</p>
                            {invoice.shopAddress && <p className="text-sm text-gray-600">{invoice.shopAddress}</p>}
                            {invoice.shopPlace && <p className="text-sm text-gray-600">{invoice.shopPlace}</p>}
                            {invoice.shopPhone && <p className="text-sm text-gray-600 mt-2">📞 {invoice.shopPhone}</p>}
                        </div>
                    </div>

                    {/* To */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: selectedColor.secondary }}>Bill To</p>
                        <div className="bg-gray-50 p-5 rounded-lg border-l-4" style={{ borderColor: selectedColor.accent }}>
                            <p className="font-bold text-xl mb-2">{invoice.customerName || 'Customer Name'}</p>
                            {invoice.customerEmail && <p className="text-sm text-gray-600">✉️ {invoice.customerEmail}</p>}
                            {invoice.customerPhone && <p className="text-sm text-gray-600">📞 {invoice.customerPhone}</p>}
                            {invoice.customerAddress && <p className="text-sm text-gray-600 mt-2">{invoice.customerAddress}</p>}
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="mb-8">
                    <div className="rounded-xl overflow-hidden border-2" style={{ borderColor: selectedColor.accent }}>
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 font-bold text-white" style={{ backgroundColor: selectedColor.primary }}>
                            <div className="col-span-6">DESCRIPTION</div>
                            <div className="col-span-2 text-center">QTY</div>
                            <div className="col-span-2 text-right">RATE</div>
                            <div className="col-span-2 text-right">AMOUNT</div>
                        </div>
                        {(invoice.items && invoice.items.length > 0 ? invoice.items : [{ description: 'Sample Item', quantity: 1, rate: 1000, amount: 1000 }]).map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 px-6 py-4 border-t" style={{ borderColor: hexToRgba(selectedColor.accent, 0.5) }}>
                                <div className="col-span-6 font-medium text-gray-900">{item.description}</div>
                                <div className="col-span-2 text-center text-gray-600">{item.quantity}</div>
                                <div className="col-span-2 text-right text-gray-600">{formatCurrency(item.rate)}</div>
                                <div className="col-span-2 text-right font-semibold text-gray-900">{formatCurrency(item.amount)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end mb-8">
                    <div className="w-96">
                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between text-gray-700">
                                <span>Subtotal</span>
                                <span className="font-semibold">{formatCurrency(invoice.subtotal || 1000)}</span>
                            </div>
                            {invoice.taxAmount && invoice.taxAmount > 0 && (
                                <div className="flex justify-between text-gray-700">
                                    <span>Tax ({invoice.taxRate}%)</span>
                                    <span className="font-semibold">{formatCurrency(invoice.taxAmount)}</span>
                                </div>
                            )}
                            {invoice.discount && invoice.discount > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>Discount</span>
                                    <span className="font-semibold">-{formatCurrency(invoice.discount)}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-center px-6 py-5 rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${selectedColor.primary} 0%, ${selectedColor.secondary} 100%)` }}>
                            <span className="font-bold text-lg uppercase">Total</span>
                            <span className="font-bold text-3xl">{formatCurrency(invoice.total || 1000)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes, Terms & Signature */}
                <div className="grid grid-cols-2 gap-8 mt-12">
                    {/* Notes & Terms */}
                    <div className="space-y-6">
                        {invoice.notesEnabled && invoice.notes && (
                            <div>
                                <h4 className="font-bold text-sm uppercase tracking-wider mb-3" style={{ color: selectedColor.secondary }}>Notes</h4>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
                            </div>
                        )}
                        {invoice.termsEnabled && invoice.terms && (
                            <div>
                                <h4 className="font-bold text-sm uppercase tracking-wider mb-3" style={{ color: selectedColor.secondary }}>Terms & Conditions</h4>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{invoice.terms}</p>
                            </div>
                        )}
                    </div>

                    {/* Signature */}
                    {invoice.signatureEnabled && (
                        <div className="flex flex-col items-end">
                            {invoice.signature && (
                                <div className="mb-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                    <img src={invoice.signature} alt="Signature" className="h-20 w-auto" />
                                </div>
                            )}
                            <div className="text-right">
                                <div className="h-px w-48 mb-2" style={{ backgroundColor: selectedColor.primary }}></div>
                                <p className="font-semibold text-gray-900">{invoice.signatureName || 'Authorized Signatory'}</p>
                                <p className="text-sm text-gray-500">Signature</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t-2 border-gray-200 text-center">
                    <p className="text-sm text-gray-500">Thank you for your business!</p>
                </div>
            </div>
        </div>
    );

    // Classic Template - Traditional, Elegant
    const renderClassicTemplate = () => (
        <div className="bg-white p-12" style={{ fontFamily: 'Georgia, serif', minHeight: '1056px' }}>
            {/* Ornamental Header */}
            <div className="text-center mb-10 pb-8 border-b-4 border-double" style={{ borderColor: selectedColor.primary }}>
                <div className="inline-block px-8 py-3 mb-4 rounded-full border-2" style={{ borderColor: selectedColor.primary }}>
                    <h1 className="text-5xl font-serif" style={{ color: selectedColor.primary }}>INVOICE</h1>
                </div>
                <p className="text-xl text-gray-600 font-semibold">{invoice.invoiceNumber || 'INV-2026-001'}</p>
            </div>

            {/* Business & Customer Info */}
            <div className="grid grid-cols-2 gap-12 mb-10">
                <div className="p-6 rounded-lg border-2" style={{ borderColor: selectedColor.accent, backgroundColor: hexToRgba(selectedColor.accent, 0.1) }}>
                    <h3 className="font-bold text-sm uppercase mb-4" style={{ color: selectedColor.secondary }}>From</h3>
                    <p className="font-bold text-2xl mb-3">{invoice.shopName || 'Your Business'}</p>
                    {invoice.shopAddress && <p className="text-gray-700">{invoice.shopAddress}</p>}
                    {invoice.shopPlace && <p className="text-gray-700">{invoice.shopPlace}</p>}
                    {invoice.shopPhone && <p className="text-gray-700 mt-2">{invoice.shopPhone}</p>}
                </div>

                <div className="p-6 rounded-lg border-2" style={{ borderColor: selectedColor.accent, backgroundColor: hexToRgba(selectedColor.accent, 0.1) }}>
                    <h3 className="font-bold text-sm uppercase mb-4" style={{ color: selectedColor.secondary }}>Bill To</h3>
                    <p className="font-bold text-2xl mb-3">{invoice.customerName || 'Customer Name'}</p>
                    {invoice.customerEmail && <p className="text-gray-700">{invoice.customerEmail}</p>}
                    {invoice.customerPhone && <p className="text-gray-700">{invoice.customerPhone}</p>}
                    {invoice.customerAddress && <p className="text-gray-700 mt-2">{invoice.customerAddress}</p>}
                </div>
            </div>

            {/* Dates */}
            <div className="flex justify-end mb-8">
                <div className="text-right space-y-2">
                    <div>
                        <span className="text-gray-600 mr-4">Invoice Date:</span>
                        <span className="font-semibold">{invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'MMMM d, yyyy') : format(new Date(), 'MMMM d, yyyy')}</span>
                    </div>
                    {invoice.dueDate && (
                        <div>
                            <span className="text-gray-600 mr-4">Due Date:</span>
                            <span className="font-semibold">{format(new Date(invoice.dueDate), 'MMMM d, yyyy')}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-10 border-2" style={{ borderColor: selectedColor.primary }}>
                <thead>
                    <tr style={{ backgroundColor: selectedColor.primary }}>
                        <th className="text-left py-4 px-6 font-bold text-white">Description</th>
                        <th className="text-center py-4 px-6 font-bold text-white">Qty</th>
                        <th className="text-right py-4 px-6 font-bold text-white">Rate</th>
                        <th className="text-right py-4 px-6 font-bold text-white">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {(invoice.items && invoice.items.length > 0 ? invoice.items : [{ description: 'Sample Item', quantity: 1, rate: 1000, amount: 1000 }]).map((item, index) => (
                        <tr key={index} className="border-b" style={{ borderColor: hexToRgba(selectedColor.accent, 0.5) }}>
                            <td className="py-4 px-6 font-medium">{item.description}</td>
                            <td className="text-center py-4 px-6">{item.quantity}</td>
                            <td className="text-right py-4 px-6">{formatCurrency(item.rate)}</td>
                            <td className="text-right py-4 px-6 font-semibold">{formatCurrency(item.amount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Total */}
            <div className="flex justify-end mb-10">
                <div className="w-96 border-4 border-double rounded-lg p-6" style={{ borderColor: selectedColor.primary, backgroundColor: hexToRgba(selectedColor.accent, 0.2) }}>
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-semibold">{formatCurrency(invoice.subtotal || 1000)}</span>
                        </div>
                        {invoice.taxAmount && invoice.taxAmount > 0 && (
                            <div className="flex justify-between">
                                <span>Tax ({invoice.taxRate}%):</span>
                                <span className="font-semibold">{formatCurrency(invoice.taxAmount)}</span>
                            </div>
                        )}
                        {invoice.discount && invoice.discount > 0 && (
                            <div className="flex justify-between text-red-600">
                                <span>Discount:</span>
                                <span className="font-semibold">-{formatCurrency(invoice.discount)}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t-2" style={{ borderColor: selectedColor.primary }}>
                        <span className="font-bold text-2xl" style={{ color: selectedColor.secondary }}>TOTAL</span>
                        <span className="font-bold text-3xl" style={{ color: selectedColor.primary }}>{formatCurrency(invoice.total || 1000)}</span>
                    </div>
                </div>
            </div>

            {/* Notes, Terms & Signature */}
            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                    {invoice.notesEnabled && invoice.notes && (
                        <div className="p-5 rounded-lg border" style={{ borderColor: selectedColor.accent, backgroundColor: hexToRgba(selectedColor.accent, 0.05) }}>
                            <h4 className="font-bold mb-3" style={{ color: selectedColor.secondary }}>Notes</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
                        </div>
                    )}
                    {invoice.termsEnabled && invoice.terms && (
                        <div className="p-5 rounded-lg border" style={{ borderColor: selectedColor.accent, backgroundColor: hexToRgba(selectedColor.accent, 0.05) }}>
                            <h4 className="font-bold mb-3" style={{ color: selectedColor.secondary }}>Terms & Conditions</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.terms}</p>
                        </div>
                    )}
                </div>

                {invoice.signatureEnabled && (
                    <div className="flex flex-col items-end justify-end">
                        {invoice.signature && (
                            <div className="mb-4 p-4 border-2 rounded-lg" style={{ borderColor: selectedColor.accent }}>
                                <img src={invoice.signature} alt="Signature" className="h-20 w-auto" />
                            </div>
                        )}
                        <div className="text-center">
                            <div className="h-0.5 w-48 mb-2" style={{ backgroundColor: selectedColor.primary }}></div>
                            <p className="font-bold">{invoice.signatureName || 'Authorized Signatory'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // Minimal Template - Clean & Simple
    const renderMinimalTemplate = () => (
        <div className="bg-white p-16" style={{ fontFamily: 'Helvetica, Arial, sans-serif', minHeight: '1056px' }}>
            {/* Header */}
            <div className="mb-16">
                <h1 className="text-7xl font-thin mb-4" style={{ color: selectedColor.primary }}>Invoice</h1>
                <div className="h-1 w-32 mb-6" style={{ backgroundColor: selectedColor.primary }}></div>
                <p className="text-2xl text-gray-400 font-light">{invoice.invoiceNumber || 'INV-2026-001'}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-3 gap-12 mb-16">
                <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">From</p>
                    <p className="font-medium text-xl mb-2">{invoice.shopName || 'Your Business'}</p>
                    {invoice.shopAddress && <p className="text-sm text-gray-600">{invoice.shopAddress}</p>}
                    {invoice.shopPhone && <p className="text-sm text-gray-600">{invoice.shopPhone}</p>}
                </div>
                <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">To</p>
                    <p className="font-medium text-xl mb-2">{invoice.customerName || 'Customer Name'}</p>
                    {invoice.customerEmail && <p className="text-sm text-gray-600">{invoice.customerEmail}</p>}
                    {invoice.customerPhone && <p className="text-sm text-gray-600">{invoice.customerPhone}</p>}
                </div>
                <div className="text-right">
                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Date</p>
                    <p className="font-medium text-lg">{invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'MMM d, yyyy') : format(new Date(), 'MMM d, yyyy')}</p>
                    {invoice.dueDate && (
                        <>
                            <p className="text-xs uppercase tracking-widest text-gray-400 mt-4 mb-2">Due</p>
                            <p className="font-medium text-lg">{format(new Date(invoice.dueDate), 'MMM d, yyyy')}</p>
                        </>
                    )}
                </div>
            </div>

            {/* Items */}
            <div className="mb-16">
                {(invoice.items && invoice.items.length > 0 ? invoice.items : [{ description: 'Sample Item', quantity: 1, rate: 1000, amount: 1000 }]).map((item, index) => (
                    <div key={index} className="flex justify-between py-5 border-b border-gray-200">
                        <div className="flex-1">
                            <p className="font-medium text-lg">{item.description}</p>
                            <p className="text-sm text-gray-500 mt-1">{item.quantity} × {formatCurrency(item.rate)}</p>
                        </div>
                        <p className="font-semibold text-lg">{formatCurrency(item.amount)}</p>
                    </div>
                ))}
            </div>

            {/* Total */}
            <div className="flex justify-end mb-16">
                <div className="text-right">
                    {invoice.taxAmount && invoice.taxAmount > 0 && (
                        <div className="mb-2">
                            <span className="text-sm text-gray-500 mr-8">Tax ({invoice.taxRate}%)</span>
                            <span className="text-lg">{formatCurrency(invoice.taxAmount)}</span>
                        </div>
                    )}
                    {invoice.discount && invoice.discount > 0 && (
                        <div className="mb-4">
                            <span className="text-sm text-gray-500 mr-8">Discount</span>
                            <span className="text-lg text-red-600">-{formatCurrency(invoice.discount)}</span>
                        </div>
                    )}
                    <div className="h-px w-full mb-4 bg-gray-300"></div>
                    <p className="text-sm uppercase tracking-widest text-gray-400 mb-2">Total</p>
                    <p className="text-5xl font-thin" style={{ color: selectedColor.primary }}>{formatCurrency(invoice.total || 1000)}</p>
                </div>
            </div>

            {/* Footer Content */}
            <div className="grid grid-cols-2 gap-12">
                <div className="space-y-8">
                    {invoice.notesEnabled && invoice.notes && (
                        <div>
                            <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Notes</p>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
                        </div>
                    )}
                    {invoice.termsEnabled && invoice.terms && (
                        <div>
                            <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Terms</p>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{invoice.terms}</p>
                        </div>
                    )}
                </div>

                {invoice.signatureEnabled && (
                    <div className="flex flex-col items-end justify-end">
                        {invoice.signature && (
                            <div className="mb-4">
                                <img src={invoice.signature} alt="Signature" className="h-16 w-auto" />
                            </div>
                        )}
                        <div className="text-right">
                            <div className="h-px w-40 mb-2 bg-gray-300"></div>
                            <p className="font-medium">{invoice.signatureName || 'Authorized Signatory'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // Professional Template - Corporate Style
    const renderProfessionalTemplate = () => (
        <div className="bg-white" style={{ fontFamily: 'Arial, sans-serif', minHeight: '1056px' }}>
            {/* Header Bar */}
            <div className="px-12 py-8" style={{ backgroundColor: selectedColor.primary }}>
                <div className="flex justify-between items-center text-white">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">INVOICE</h1>
                        <p className="text-lg opacity-90">{invoice.invoiceNumber || 'INV-2026-001'}</p>
                    </div>
                    <div className="text-right bg-white/20 backdrop-blur-sm px-6 py-4 rounded-lg">
                        <p className="text-xs uppercase mb-1 opacity-80">Issue Date</p>
                        <p className="text-lg font-bold">{invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}</p>
                    </div>
                </div>
            </div>

            <div className="px-12 py-10">
                {/* Company & Customer */}
                <div className="grid grid-cols-2 gap-10 mb-10">
                    <div className="p-6 rounded-xl border-2" style={{ borderColor: selectedColor.accent, backgroundColor: hexToRgba(selectedColor.accent, 0.05) }}>
                        <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: selectedColor.primary }}>Service Provider</p>
                        <p className="font-bold text-2xl mb-3">{invoice.shopName || 'Your Business Name'}</p>
                        {invoice.shopAddress && <p className="text-sm text-gray-700 mb-1">{invoice.shopAddress}</p>}
                        {invoice.shopPlace && <p className="text-sm text-gray-700 mb-1">{invoice.shopPlace}</p>}
                        {invoice.shopPhone && <p className="text-sm text-gray-700 mt-2 font-semibold">Phone: {invoice.shopPhone}</p>}
                    </div>

                    <div className="p-6 rounded-xl border-2" style={{ borderColor: selectedColor.accent, backgroundColor: hexToRgba(selectedColor.accent, 0.05) }}>
                        <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: selectedColor.primary }}>Bill To</p>
                        <p className="font-bold text-2xl mb-3">{invoice.customerName || 'Customer Name'}</p>
                        {invoice.customerEmail && <p className="text-sm text-gray-700 mb-1">Email: {invoice.customerEmail}</p>}
                        {invoice.customerPhone && <p className="text-sm text-gray-700 mb-1">Phone: {invoice.customerPhone}</p>}
                        {invoice.customerAddress && <p className="text-sm text-gray-700 mt-2">{invoice.customerAddress}</p>}
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-8 rounded-xl overflow-hidden border-2" style={{ borderColor: selectedColor.accent }}>
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 font-bold text-white uppercase text-sm" style={{ backgroundColor: selectedColor.primary }}>
                        <div className="col-span-5">Item Description</div>
                        <div className="col-span-2 text-center">Quantity</div>
                        <div className="col-span-2 text-right">Unit Price</div>
                        <div className="col-span-3 text-right">Total</div>
                    </div>
                    {(invoice.items && invoice.items.length > 0 ? invoice.items : [{ description: 'Sample Item', quantity: 1, rate: 1000, amount: 1000 }]).map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 px-6 py-5 border-t-2" style={{ borderColor: hexToRgba(selectedColor.accent, 0.3) }}>
                            <div className="col-span-5 font-semibold text-gray-900">{item.description}</div>
                            <div className="col-span-2 text-center text-gray-700">{item.quantity}</div>
                            <div className="col-span-2 text-right text-gray-700">{formatCurrency(item.rate)}</div>
                            <div className="col-span-3 text-right font-bold text-gray-900">{formatCurrency(item.amount)}</div>
                        </div>
                    ))}
                </div>

                {/* Calculation & Total */}
                <div className="flex justify-end mb-10">
                    <div className="w-96">
                        <div className="space-y-3 mb-4 px-6">
                            <div className="flex justify-between text-gray-700">
                                <span className="font-medium">Subtotal</span>
                                <span className="font-semibold">{formatCurrency(invoice.subtotal || 1000)}</span>
                            </div>
                            {invoice.taxAmount && invoice.taxAmount > 0 && (
                                <div className="flex justify-between text-gray-700">
                                    <span className="font-medium">Tax ({invoice.taxRate}%)</span>
                                    <span className="font-semibold">{formatCurrency(invoice.taxAmount)}</span>
                                </div>
                            )}
                            {invoice.discount && invoice.discount > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span className="font-medium">Discount</span>
                                    <span className="font-semibold">-{formatCurrency(invoice.discount)}</span>
                                </div>
                            )}
                        </div>
                        <div className="px-8 py-6 rounded-xl text-white" style={{ backgroundColor: selectedColor.primary }}>
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-lg uppercase">Grand Total</span>
                                <span className="font-bold text-4xl">{formatCurrency(invoice.total || 1000)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-6">
                        {invoice.notesEnabled && invoice.notes && (
                            <div className="p-5 rounded-lg bg-gray-50">
                                <h4 className="font-bold text-sm uppercase tracking-wider mb-3" style={{ color: selectedColor.secondary }}>Additional Notes</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
                            </div>
                        )}
                        {invoice.termsEnabled && invoice.terms && (
                            <div className="p-5 rounded-lg bg-gray-50">
                                <h4 className="font-bold text-sm uppercase tracking-wider mb-3" style={{ color: selectedColor.secondary }}>Terms & Conditions</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{invoice.terms}</p>
                            </div>
                        )}
                    </div>

                    {invoice.signatureEnabled && (
                        <div className="flex flex-col items-end justify-end">
                            {invoice.signature && (
                                <div className="mb-4 p-5 bg-gray-50 rounded-lg border-2" style={{ borderColor: selectedColor.accent }}>
                                    <img src={invoice.signature} alt="Signature" className="h-20 w-auto" />
                                </div>
                            )}
                            <div className="text-right">
                                <div className="h-0.5 w-52 mb-3" style={{ backgroundColor: selectedColor.primary }}></div>
                                <p className="font-bold text-lg">{invoice.signatureName || 'Authorized Signatory'}</p>
                                <p className="text-sm text-gray-500 uppercase tracking-wider">Signature & Stamp</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t-2 text-center" style={{ borderColor: selectedColor.accent }}>
                    <p className="text-sm text-gray-500">This is a computer-generated invoice and does not require a physical signature.</p>
                </div>
            </div>
        </div>
    );

    // Colorful Template - Vibrant & Modern
    const renderColorfulTemplate = () => (
        <div className="bg-white" style={{ fontFamily: 'Poppins, sans-serif', minHeight: '1056px' }}>
            {/* Gradient Header */}
            <div className="px-12 py-12 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${selectedColor.primary} 0%, ${selectedColor.secondary} 100%)` }}>
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20" style={{ background: 'white', transform: 'translate(30%, -30%)' }}></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-20" style={{ background: 'white', transform: 'translate(-30%, 30%)' }}></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start text-white">
                        <div>
                            <div className="inline-block px-6 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-4">
                                <span className="font-black text-lg uppercase tracking-wider">Invoice</span>
                            </div>
                            <h1 className="text-6xl font-black mb-2">{invoice.invoiceNumber || 'INV-2026-001'}</h1>
                        </div>
                        <div className="text-right bg-white text-gray-900 px-8 py-5 rounded-2xl shadow-xl">
                            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: selectedColor.primary }}>Date</p>
                            <p className="text-2xl font-black">{invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'dd MMM yyyy') : format(new Date(), 'dd MMM yyyy')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-12 py-10">
                {/* Business & Customer Cards */}
                <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="p-8 rounded-2xl shadow-lg" style={{ background: `linear-gradient(135deg, ${hexToRgba(selectedColor.primary, 0.1)} 0%, ${hexToRgba(selectedColor.secondary, 0.1)} 100%)` }}>
                        <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: selectedColor.primary }}>From</p>
                        <p className="font-black text-3xl mb-3">{invoice.shopName || 'Your Business'}</p>
                        {invoice.shopAddress && <p className="text-sm text-gray-700 mb-1">{invoice.shopAddress}</p>}
                        {invoice.shopPlace && <p className="text-sm text-gray-700 mb-1">{invoice.shopPlace}</p>}
                        {invoice.shopPhone && <p className="text-sm font-bold text-gray-900 mt-3">📞 {invoice.shopPhone}</p>}
                    </div>

                    <div className="p-8 rounded-2xl shadow-lg" style={{ background: `linear-gradient(135deg, ${hexToRgba(selectedColor.primary, 0.1)} 0%, ${hexToRgba(selectedColor.secondary, 0.1)} 100%)` }}>
                        <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: selectedColor.primary }}>Bill To</p>
                        <p className="font-black text-3xl mb-3">{invoice.customerName || 'Customer Name'}</p>
                        {invoice.customerEmail && <p className="text-sm text-gray-700 mb-1">✉️ {invoice.customerEmail}</p>}
                        {invoice.customerPhone && <p className="text-sm text-gray-700 mb-1">📞 {invoice.customerPhone}</p>}
                        {invoice.customerAddress && <p className="text-sm text-gray-700 mt-3">{invoice.customerAddress}</p>}
                    </div>
                </div>

                {/* Items */}
                <div className="mb-10 rounded-2xl overflow-hidden shadow-xl border-4" style={{ borderColor: selectedColor.accent }}>
                    <div className="grid grid-cols-12 gap-4 px-8 py-5 font-black text-white uppercase text-sm" style={{ background: `linear-gradient(135deg, ${selectedColor.primary} 0%, ${selectedColor.secondary} 100%)` }}>
                        <div className="col-span-6">Description</div>
                        <div className="col-span-2 text-center">Qty</div>
                        <div className="col-span-2 text-right">Rate</div>
                        <div className="col-span-2 text-right">Amount</div>
                    </div>
                    {(invoice.items && invoice.items.length > 0 ? invoice.items : [{ description: 'Sample Item', quantity: 1, rate: 1000, amount: 1000 }]).map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 px-8 py-5 border-b-2 bg-white" style={{ borderColor: hexToRgba(selectedColor.accent, 0.3) }}>
                            <div className="col-span-6 font-bold text-gray-900">{item.description}</div>
                            <div className="col-span-2 text-center font-semibold text-gray-700">{item.quantity}</div>
                            <div className="col-span-2 text-right text-gray-700">{formatCurrency(item.rate)}</div>
                            <div className="col-span-2 text-right font-black text-gray-900">{formatCurrency(item.amount)}</div>
                        </div>
                    ))}
                </div>

                {/* Total Section */}
                <div className="flex justify-end mb-10">
                    <div className="w-full max-w-md">
                        <div className="space-y-3 mb-4 px-6">
                            <div className="flex justify-between text-gray-700">
                                <span className="font-semibold">Subtotal</span>
                                <span className="font-bold">{formatCurrency(invoice.subtotal || 1000)}</span>
                            </div>
                            {invoice.taxAmount && invoice.taxAmount > 0 && (
                                <div className="flex justify-between text-gray-700">
                                    <span className="font-semibold">Tax ({invoice.taxRate}%)</span>
                                    <span className="font-bold">{formatCurrency(invoice.taxAmount)}</span>
                                </div>
                            )}
                            {invoice.discount && invoice.discount > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span className="font-semibold">Discount</span>
                                    <span className="font-bold">-{formatCurrency(invoice.discount)}</span>
                                </div>
                            )}
                        </div>
                        <div className="px-10 py-8 rounded-2xl text-white shadow-2xl" style={{ background: `linear-gradient(135deg, ${selectedColor.primary} 0%, ${selectedColor.secondary} 100%)` }}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm uppercase font-bold opacity-90 mb-1">Grand Total</p>
                                </div>
                                <p className="text-6xl font-black">{formatCurrency(invoice.total || 1000)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-6">
                        {invoice.notesEnabled && invoice.notes && (
                            <div className="p-6 rounded-2xl" style={{ background: `linear-gradient(135deg, ${hexToRgba(selectedColor.primary, 0.05)} 0%, ${hexToRgba(selectedColor.secondary, 0.05)} 100%)` }}>
                                <h4 className="font-black text-sm uppercase tracking-wider mb-3" style={{ color: selectedColor.secondary }}>Notes</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
                            </div>
                        )}
                        {invoice.termsEnabled && invoice.terms && (
                            <div className="p-6 rounded-2xl" style={{ background: `linear-gradient(135deg, ${hexToRgba(selectedColor.primary, 0.05)} 0%, ${hexToRgba(selectedColor.secondary, 0.05)} 100%)` }}>
                                <h4 className="font-black text-sm uppercase tracking-wider mb-3" style={{ color: selectedColor.secondary }}>Terms & Conditions</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{invoice.terms}</p>
                            </div>
                        )}
                    </div>

                    {invoice.signatureEnabled && (
                        <div className="flex flex-col items-end justify-end">
                            {invoice.signature && (
                                <div className="mb-4 p-6 rounded-2xl shadow-lg" style={{ background: `linear-gradient(135deg, ${hexToRgba(selectedColor.primary, 0.05)} 0%, ${hexToRgba(selectedColor.secondary, 0.05)} 100%)` }}>
                                    <img src={invoice.signature} alt="Signature" className="h-24 w-auto" />
                                </div>
                            )}
                            <div className="text-right">
                                <div className="h-1 w-56 mb-3 rounded-full" style={{ background: `linear-gradient(90deg, ${selectedColor.primary} 0%, ${selectedColor.secondary} 100%)` }}></div>
                                <p className="font-black text-xl">{invoice.signatureName || 'Authorized Signatory'}</p>
                                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Signature</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Thank You */}
                <div className="mt-12 text-center p-6 rounded-2xl" style={{ background: `linear-gradient(135deg, ${hexToRgba(selectedColor.primary, 0.1)} 0%, ${hexToRgba(selectedColor.secondary, 0.1)} 100%)` }}>
                    <p className="text-lg font-bold" style={{ color: selectedColor.primary }}>Thank you for your business! 🎉</p>
                </div>
            </div>
        </div>
    );

    const templates: Record<string, () => React.JSX.Element> = {
        modern: renderModernTemplate,
        classic: renderClassicTemplate,
        minimal: renderMinimalTemplate,
        professional: renderProfessionalTemplate,
        colorful: renderColorfulTemplate,
    };

    const renderTemplate = templates[templateId] || renderModernTemplate;

    return (
        <div className="w-full">
            {renderTemplate()}
        </div>
    );
}
