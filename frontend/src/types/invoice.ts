export interface InvoiceItem {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    taxRate?: number;
}

export interface Invoice {
    _id: string;
    shopkeeperId: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string;

    // Customer Details
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    customerGSTIN?: string;

    // Shop/Business Details
    shopName?: string;
    shopAddress?: string;
    shopPlace?: string;
    shopPhone?: string;

    // Line Items
    items: InvoiceItem[];

    // Amounts
    subtotal: number;
    taxRate?: number;
    taxAmount?: number;
    discount?: number;
    discountType?: 'percentage' | 'fixed';
    total: number;

    // Customization
    templateId: string;
    colorScheme?: string;
    logo?: string;
    signature?: string;
    signatureName?: string;
    signatureEnabled?: boolean;

    // Notes
    notes?: string;
    notesEnabled?: boolean;
    terms?: string;
    termsEnabled?: boolean;

    // Metadata
    status: 'draft' | 'sent' | 'paid' | 'cancelled';
    isDeleted: boolean;
    deletedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateInvoiceInput {
    invoiceNumber?: string;
    invoiceDate?: string;
    dueDate?: string;

    // Customer Details
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    customerGSTIN?: string;

    // Shop/Business Details
    shopName?: string;
    shopAddress?: string;
    shopPlace?: string;
    shopPhone?: string;

    // Line Items
    items: InvoiceItem[];

    // Amounts
    subtotal: number;
    taxRate?: number;
    taxAmount?: number;
    discount?: number;
    discountType?: 'percentage' | 'fixed';
    total: number;

    // Customization
    templateId?: string;
    colorScheme?: string;
    logo?: string;
    signature?: string;
    signatureName?: string;
    signatureEnabled?: boolean;

    // Notes
    notes?: string;
    notesEnabled?: boolean;
    terms?: string;
    termsEnabled?: boolean;

    // Status
    status?: 'draft' | 'sent' | 'paid' | 'cancelled';
}

export interface UpdateInvoiceInput extends Partial<CreateInvoiceInput> { }

export interface InvoiceFilters {
    search?: string;
    status?: 'draft' | 'sent' | 'paid' | 'cancelled';
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'invoiceDate' | 'total' | 'invoiceNumber';
    sortOrder?: 'asc' | 'desc';
}

export interface InvoiceStats {
    totalAmount: number;
    draftCount: number;
    sentCount: number;
    paidCount: number;
    cancelledCount: number;
}

export interface InvoiceListResponse {
    invoices: Invoice[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    stats: InvoiceStats;
}

export interface InvoiceTemplate {
    id: string;
    name: string;
    description: string;
    colorSchemes: string[];
}

export interface ColorScheme {
    id: string;
    name: string;
    primary: string;
    secondary: string;
    accent: string;
}

export interface ShareLinkResponse {
    url: string;
    message: string;
}
