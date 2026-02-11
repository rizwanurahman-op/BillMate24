import { z } from 'zod';

const invoiceItemSchema = z.object({
    description: z.string().min(1, 'Item description is required'),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    rate: z.number().min(0, 'Rate must be positive'),
    amount: z.number().min(0, 'Amount must be positive'),
    taxRate: z.number().min(0).max(100).optional(),
});

export const createInvoiceSchema = z.object({
    invoiceNumber: z.string().optional(),
    invoiceDate: z.string().optional(),
    dueDate: z.string().optional(),

    // Customer Details
    customerName: z.string().min(1, 'Customer name is required'),
    customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
    customerPhone: z.string().optional(),
    customerAddress: z.string().optional(),
    customerGSTIN: z.string().optional(),

    // Shop/Business Details
    shopName: z.string().optional(),
    shopAddress: z.string().optional(),
    shopPlace: z.string().optional(),
    shopPhone: z.string().optional(),

    // Line Items
    items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),

    // Amounts
    subtotal: z.number().min(0, 'Subtotal must be positive'),
    taxRate: z.number().min(0).max(100).optional(),
    taxAmount: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    total: z.number().min(0, 'Total must be positive'),

    // Customization
    templateId: z.string().optional(),
    colorScheme: z.string().optional(),
    logo: z.string().optional(),
    signature: z.string().optional(),
    signatureName: z.string().optional(),
    signatureEnabled: z.boolean().optional(),

    // Notes
    notes: z.string().optional(),
    notesEnabled: z.boolean().optional(),
    terms: z.string().optional(),
    termsEnabled: z.boolean().optional(),

    // Status
    status: z.enum(['draft', 'sent', 'paid', 'cancelled']).optional(),
});

export const updateInvoiceSchema = z.object({
    invoiceNumber: z.string().optional(),
    invoiceDate: z.string().optional(),
    dueDate: z.string().optional(),

    // Customer Details
    customerName: z.string().min(1, 'Customer name is required').optional(),
    customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
    customerPhone: z.string().optional(),
    customerAddress: z.string().optional(),
    customerGSTIN: z.string().optional(),

    // Shop/Business Details
    shopName: z.string().optional(),
    shopAddress: z.string().optional(),
    shopPlace: z.string().optional(),
    shopPhone: z.string().optional(),

    // Line Items
    items: z.array(invoiceItemSchema).min(1, 'At least one item is required').optional(),

    // Amounts
    subtotal: z.number().min(0, 'Subtotal must be positive').optional(),
    taxRate: z.number().min(0).max(100).optional(),
    taxAmount: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    total: z.number().min(0, 'Total must be positive').optional(),

    // Customization
    templateId: z.string().optional(),
    colorScheme: z.string().optional(),
    logo: z.string().optional(),
    signature: z.string().optional(),
    signatureName: z.string().optional(),
    signatureEnabled: z.boolean().optional(),

    // Notes
    notes: z.string().optional(),
    notesEnabled: z.boolean().optional(),
    terms: z.string().optional(),
    termsEnabled: z.boolean().optional(),

    // Status
    status: z.enum(['draft', 'sent', 'paid', 'cancelled']).optional(),
});

export const invoiceFilterSchema = z.object({
    search: z.string().optional(),
    status: z.enum(['draft', 'sent', 'paid', 'cancelled']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.string().optional().transform(v => v ? parseInt(v) : 1),
    limit: z.string().optional().transform(v => v ? parseInt(v) : 10),
    sortBy: z.enum(['createdAt', 'invoiceDate', 'total', 'invoiceNumber']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type InvoiceFilterInput = z.infer<typeof invoiceFilterSchema>;
