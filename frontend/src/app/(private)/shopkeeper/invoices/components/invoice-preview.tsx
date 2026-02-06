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
    // Validate hex color
    if (!hex || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
        return `rgba(59, 130, 246, ${alpha})`; // Fallback to blue
    }

    try {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            return `rgba(59, 130, 246, ${alpha})`; // Fallback to blue
        }

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (e) {
        return `rgba(59, 130, 246, ${alpha})`; // Fallback to blue
    }
}

export function InvoicePreview({ invoice, templateId, colorScheme, colorSchemes }: InvoicePreviewProps) {
    const { t } = useTranslation();

    // Default color scheme as fallback
    const defaultColorScheme = {
        id: 'blue',
        name: 'Blue',
        primary: '#3B82F6',
        secondary: '#1E40AF',
        accent: '#DBEAFE'
    };

    const selectedColor = colorSchemes?.find(c => c.id === colorScheme) || colorSchemes?.[0] || defaultColorScheme;

    // Modern Template
    const renderModernTemplate = () => (
        <div className="bg-white p-8 rounded-lg shadow-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b-4" style={{ borderColor: selectedColor.primary }}>
                <div>
                    <h1 className="text-4xl font-bold mb-2" style={{ color: selectedColor.primary }}>
                        {t('invoices.title').toUpperCase().split(' ')[0]}
                    </h1>
                    <p className="text-gray-600 text-lg">{invoice.invoiceNumber || 'INV-2026-02-0001'}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-600">{t('invoices.invoice_date')}</p>
                    <p className="font-semibold">
                        {invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'MMM d, yyyy') : format(new Date(), 'MMM d, yyyy')}
                    </p>
                    {invoice.dueDate && (
                        <>
                            <p className="text-sm text-gray-600 mt-2">{t('invoices.due_date')}</p>
                            <p className="font-semibold">{format(new Date(invoice.dueDate), 'MMM d, yyyy')}</p>
                        </>
                    )}
                </div>
            </div>

            {/* Customer Details */}
            <div className="mb-8">
                <div className="inline-block px-4 py-2 rounded-lg mb-3" style={{ backgroundColor: hexToRgba(selectedColor.accent, 0.2) }}>
                    <h3 className="font-bold text-sm" style={{ color: selectedColor.secondary }}>
                        {t('invoices.customer_details').toUpperCase()}
                    </h3>
                </div>
                <div className="pl-2">
                    <p className="font-bold text-lg text-gray-900">{invoice.customerName || 'Customer Name'}</p>
                    {invoice.customerEmail && <p className="text-gray-600">{invoice.customerEmail}</p>}
                    {invoice.customerPhone && <p className="text-gray-600">{invoice.customerPhone}</p>}
                    {invoice.customerAddress && <p className="text-gray-600">{invoice.customerAddress}</p>}
                </div>
            </div>

            {/* Line Items */}
            <div className="mb-8">
                <div className="rounded-lg overflow-hidden border" style={{ borderColor: selectedColor.accent }}>
                    <div className="grid grid-cols-12 gap-4 p-4 font-bold text-white" style={{ backgroundColor: selectedColor.primary }}>
                        <div className="col-span-6">{t('invoices.description')}</div>
                        <div className="col-span-2 text-center">{t('invoices.quantity')}</div>
                        <div className="col-span-2 text-right">{t('invoices.rate')}</div>
                        <div className="col-span-2 text-right">{t('invoices.amount')}</div>
                    </div>
                    {(invoice.items && invoice.items.length > 0 ? invoice.items : [{ description: 'Sample Item', quantity: 1, rate: 1000, amount: 1000 }]).map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 p-4 border-t" style={{ borderColor: selectedColor.accent }}>
                            <div className="col-span-6 font-medium">{item.description}</div>
                            <div className="col-span-2 text-center text-gray-600">{item.quantity}</div>
                            <div className="col-span-2 text-right text-gray-600">{formatCurrency(item.rate)}</div>
                            <div className="col-span-2 text-right font-semibold">{formatCurrency(item.amount)}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
                <div className="w-80">
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{t('invoices.subtotal')}</span>
                            <span className="font-medium">{formatCurrency(invoice.subtotal || 1000)}</span>
                        </div>
                        {invoice.taxAmount && invoice.taxAmount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">{t('invoices.tax')} ({invoice.taxRate}%)</span>
                                <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
                            </div>
                        )}
                        {invoice.discount && invoice.discount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">{t('invoices.discount')}</span>
                                <span className="font-medium text-red-600">-{formatCurrency(invoice.discount)}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-lg" style={{ backgroundColor: hexToRgba(selectedColor.accent, 0.2) }}>
                        <span className="font-bold text-lg" style={{ color: selectedColor.secondary }}>
                            {t('invoices.total').toUpperCase()}
                        </span>
                        <span className="font-bold text-2xl" style={{ color: selectedColor.primary }}>
                            {formatCurrency(invoice.total || 1000)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
                <div className="mb-4">
                    <h4 className="font-bold mb-2" style={{ color: selectedColor.secondary }}>{t('invoices.notes')}</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
            )}
        </div>
    );

    // Classic Template
    const renderClassicTemplate = () => (
        <div className="bg-white p-8 rounded-lg shadow-lg border-2" style={{ borderColor: selectedColor.primary, fontFamily: 'Georgia, serif' }}>
            {/* Header */}
            <div className="text-center mb-8 pb-6 border-b-2" style={{ borderColor: selectedColor.primary }}>
                <h1 className="text-5xl font-serif mb-2" style={{ color: selectedColor.primary }}>INVOICE</h1>
                <p className="text-gray-600">{invoice.invoiceNumber || 'INV-2026-02-0001'}</p>
            </div>

            {/* Info Section */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <div className="mb-4 p-3 rounded" style={{ backgroundColor: hexToRgba(selectedColor.accent, 0.2) }}>
                        <h3 className="font-bold mb-2" style={{ color: selectedColor.secondary }}>
                            {t('invoices.customer_details')}:
                        </h3>
                        <p className="font-semibold">{invoice.customerName || 'Customer Name'}</p>
                        {invoice.customerEmail && <p className="text-sm">{invoice.customerEmail}</p>}
                        {invoice.customerPhone && <p className="text-sm">{invoice.customerPhone}</p>}
                    </div>
                </div>
                <div className="text-right">
                    <div className="mb-2">
                        <p className="text-sm text-gray-600">{t('invoices.invoice_date')}</p>
                        <p className="font-semibold">
                            {invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'MMMM d, yyyy') : format(new Date(), 'MMMM d, yyyy')}
                        </p>
                    </div>
                    {invoice.dueDate && (
                        <div>
                            <p className="text-sm text-gray-600">{t('invoices.due_date')}</p>
                            <p className="font-semibold">{format(new Date(invoice.dueDate), 'MMMM d, yyyy')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8">
                <thead>
                    <tr className="border-b-2" style={{ borderColor: selectedColor.primary }}>
                        <th className="text-left py-3 font-bold" style={{ color: selectedColor.secondary }}>{t('invoices.description')}</th>
                        <th className="text-center py-3 font-bold" style={{ color: selectedColor.secondary }}>{t('invoices.quantity')}</th>
                        <th className="text-right py-3 font-bold" style={{ color: selectedColor.secondary }}>{t('invoices.rate')}</th>
                        <th className="text-right py-3 font-bold" style={{ color: selectedColor.secondary }}>{t('invoices.amount')}</th>
                    </tr>
                </thead>
                <tbody>
                    {(invoice.items && invoice.items.length > 0 ? invoice.items : [{ description: 'Sample Item', quantity: 1, rate: 1000, amount: 1000 }]).map((item, index) => (
                        <tr key={index} className="border-b">
                            <td className="py-3">{item.description}</td>
                            <td className="text-center py-3">{item.quantity}</td>
                            <td className="text-right py-3">{formatCurrency(item.rate)}</td>
                            <td className="text-right py-3 font-semibold">{formatCurrency(item.amount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Total */}
            <div className="flex justify-end">
                <div className="w-80 border-2 rounded-lg p-4" style={{ borderColor: selectedColor.primary, backgroundColor: hexToRgba(selectedColor.accent, 0.2) }}>
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-xl" style={{ color: selectedColor.secondary }}>{t('invoices.total')}</span>
                        <span className="font-bold text-3xl" style={{ color: selectedColor.primary }}>{formatCurrency(invoice.total || 1000)}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    // Minimal Template
    const renderMinimalTemplate = () => (
        <div className="bg-white p-12 rounded-lg shadow-lg" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            {/* Header */}
            <div className="mb-12">
                <h1 className="text-6xl font-light mb-4" style={{ color: selectedColor.primary }}>Invoice</h1>
                <div className="h-1 w-24 mb-4" style={{ backgroundColor: selectedColor.primary }}></div>
                <p className="text-gray-500">{invoice.invoiceNumber || 'INV-2026-02-0001'}</p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-12 mb-12">
                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">{t('invoices.customer_details')}</p>
                    <p className="font-medium text-lg">{invoice.customerName || 'Customer Name'}</p>
                    {invoice.customerEmail && <p className="text-sm text-gray-600">{invoice.customerEmail}</p>}
                </div>
                <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">{t('invoices.invoice_date')}</p>
                    <p className="font-medium">
                        {invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'MMM d, yyyy') : format(new Date(), 'MMM d, yyyy')}
                    </p>
                </div>
            </div>

            {/* Items */}
            <div className="mb-12">
                {(invoice.items && invoice.items.length > 0 ? invoice.items : [{ description: 'Sample Item', quantity: 1, rate: 1000, amount: 1000 }]).map((item, index) => (
                    <div key={index} className="flex justify-between py-4 border-b border-gray-200">
                        <div className="flex-1">
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-gray-500">{item.quantity} × {formatCurrency(item.rate)}</p>
                        </div>
                        <p className="font-semibold">{formatCurrency(item.amount)}</p>
                    </div>
                ))}
            </div>

            {/* Total */}
            <div className="flex justify-end">
                <div className="text-right">
                    <p className="text-sm text-gray-500 mb-2">{t('invoices.total')}</p>
                    <p className="text-4xl font-light" style={{ color: selectedColor.primary }}>{formatCurrency(invoice.total || 1000)}</p>
                </div>
            </div>
        </div>
    );

    // Professional Template
    const renderProfessionalTemplate = () => (
        <div className="bg-white p-8 rounded-lg shadow-lg" style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b-2" style={{ borderColor: selectedColor.primary }}>
                <div>
                    <h1 className="text-4xl font-bold mb-2" style={{ color: selectedColor.primary }}>INVOICE</h1>
                    <p className="text-gray-600">{invoice.invoiceNumber || 'INV-2026-02-0001'}</p>
                </div>
                <div className="text-right p-4 rounded-lg border-2" style={{ borderColor: selectedColor.accent, backgroundColor: hexToRgba(selectedColor.accent, 0.1) }}>
                    <p className="text-xs font-bold uppercase text-gray-500 mb-2">{t('invoices.invoice_date')}</p>
                    <p className="font-bold" style={{ color: selectedColor.primary }}>
                        {invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'dd MMM yyyy') : format(new Date(), 'dd MMM yyyy')}
                    </p>
                </div>
            </div>

            {/* Customer Info */}
            <div className="p-5 rounded-lg border-2 mb-8" style={{ borderColor: selectedColor.accent, backgroundColor: hexToRgba(selectedColor.accent, 0.05) }}>
                <p className="font-bold uppercase text-xs mb-3" style={{ color: selectedColor.primary }}>
                    {t('invoices.customer_details')}
                </p>
                <p className="font-bold text-xl mb-2">{invoice.customerName || 'Customer Name'}</p>
                {invoice.customerEmail && <p className="text-sm text-gray-600">{invoice.customerEmail}</p>}
                {invoice.customerPhone && <p className="text-sm text-gray-600">{invoice.customerPhone}</p>}
            </div>

            {/* Items */}
            <div className="mb-8 border-2 rounded-lg overflow-hidden" style={{ borderColor: selectedColor.accent }}>
                <div className="grid grid-cols-12 gap-4 p-4 font-bold text-white" style={{ backgroundColor: selectedColor.primary }}>
                    <div className="col-span-5">{t('invoices.description')}</div>
                    <div className="col-span-2 text-center">{t('invoices.quantity')}</div>
                    <div className="col-span-2 text-right">{t('invoices.rate')}</div>
                    <div className="col-span-3 text-right">{t('invoices.amount')}</div>
                </div>
                {(invoice.items && invoice.items.length > 0 ? invoice.items : [{ description: 'Sample Item', quantity: 1, rate: 1000, amount: 1000 }]).map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 p-4 border-t" style={{ borderColor: hexToRgba(selectedColor.accent, 0.3) }}>
                        <div className="col-span-5 font-semibold">{item.description}</div>
                        <div className="col-span-2 text-center text-gray-600">{item.quantity}</div>
                        <div className="col-span-2 text-right text-gray-600">{formatCurrency(item.rate)}</div>
                        <div className="col-span-3 text-right font-bold">{formatCurrency(item.amount)}</div>
                    </div>
                ))}
            </div>

            {/* Total */}
            <div className="flex justify-end">
                <div className="w-96 p-6 rounded-lg text-white" style={{ backgroundColor: selectedColor.primary }}>
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-lg uppercase">{t('invoices.total')}</span>
                        <span className="font-bold text-4xl">{formatCurrency(invoice.total || 1000)}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    // Colorful Template
    const renderColorfulTemplate = () => (
        <div className="bg-white p-8 rounded-2xl shadow-2xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {/* Header */}
            <div className="mb-10 p-6 rounded-2xl" style={{ background: `linear-gradient(135deg, ${hexToRgba(selectedColor.primary, 0.1)} 0%, ${hexToRgba(selectedColor.secondary, 0.1)} 100%)` }}>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="inline-block px-4 py-2 rounded-full mb-3" style={{ background: `linear-gradient(135deg, ${selectedColor.primary} 0%, ${selectedColor.secondary} 100%)` }}>
                            <span className="text-white font-bold text-lg">INVOICE</span>
                        </div>
                        <h1 className="text-5xl font-black mb-2 text-gray-900">
                            {invoice.invoiceNumber || 'INV-2026-02-0001'}
                        </h1>
                    </div>
                    <div className="text-right p-5 rounded-xl border-2 bg-white" style={{ borderColor: selectedColor.accent }}>
                        <p className="text-xs font-bold uppercase text-gray-500 mb-2">{t('invoices.invoice_date')}</p>
                        <p className="font-black text-xl" style={{ color: selectedColor.primary }}>
                            {invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'MMM dd, yyyy') : format(new Date(), 'MMM dd, yyyy')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Customer */}
            <div className="mb-10 p-6 rounded-2xl" style={{ background: `linear-gradient(135deg, ${hexToRgba(selectedColor.primary, 0.1)} 0%, ${hexToRgba(selectedColor.secondary, 0.1)} 100%)` }}>
                <p className="font-black uppercase text-sm mb-4" style={{ color: selectedColor.primary }}>
                    {t('invoices.customer_details')}
                </p>
                <p className="font-black text-2xl mb-2">{invoice.customerName || 'Customer Name'}</p>
                {invoice.customerEmail && <p className="text-sm text-gray-700">{invoice.customerEmail}</p>}
                {invoice.customerPhone && <p className="text-sm text-gray-700">{invoice.customerPhone}</p>}
            </div>

            {/* Items */}
            <div className="mb-10 rounded-2xl overflow-hidden border-2" style={{ borderColor: selectedColor.accent }}>
                <div className="grid grid-cols-12 gap-4 p-5 font-black text-white" style={{ background: `linear-gradient(135deg, ${selectedColor.primary} 0%, ${selectedColor.secondary} 100%)` }}>
                    <div className="col-span-6">{t('invoices.description')}</div>
                    <div className="col-span-2 text-center">{t('invoices.quantity')}</div>
                    <div className="col-span-2 text-right">{t('invoices.rate')}</div>
                    <div className="col-span-2 text-right">{t('invoices.amount')}</div>
                </div>
                {(invoice.items && invoice.items.length > 0 ? invoice.items : [{ description: 'Sample Item', quantity: 1, rate: 1000, amount: 1000 }]).map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 p-5 border-b-2 bg-white" style={{ borderColor: hexToRgba(selectedColor.accent, 0.3) }}>
                        <div className="col-span-6 font-bold">{item.description}</div>
                        <div className="col-span-2 text-center font-semibold">{item.quantity}</div>
                        <div className="col-span-2 text-right text-gray-700">{formatCurrency(item.rate)}</div>
                        <div className="col-span-2 text-right font-black">{formatCurrency(item.amount)}</div>
                    </div>
                ))}
            </div>

            {/* Total */}
            <div className="flex justify-end">
                <div className="w-full max-w-md p-8 rounded-2xl text-white" style={{ background: `linear-gradient(135deg, ${selectedColor.primary} 0%, ${selectedColor.secondary} 100%)` }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm uppercase font-bold opacity-90 mb-1">{t('invoices.total')}</p>
                        </div>
                        <p className="text-5xl font-black">{formatCurrency(invoice.total || 1000)}</p>
                    </div>
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
