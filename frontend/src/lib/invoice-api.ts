import api from '@/config/axios';
import {
    Invoice,
    CreateInvoiceInput,
    UpdateInvoiceInput,
    InvoiceFilters,
    InvoiceListResponse,
    InvoiceTemplate,
    ColorScheme,
    ShareLinkResponse,
} from '@/types/invoice';

export const invoiceApi = {
    /**
     * Get all invoices with filtering and pagination
     */
    async getAll(filters?: InvoiceFilters): Promise<InvoiceListResponse> {
        const response = await api.get('/invoices', { params: filters });
        // Backend returns: { success, message, data: [...], pagination: {...}, stats: {...} }
        return {
            invoices: response.data.data,
            pagination: response.data.pagination,
            stats: response.data.stats,
        };
    },

    /**
     * Get a single invoice by ID
     */
    async getById(id: string): Promise<Invoice> {
        const response = await api.get(`/invoices/${id}`);
        return response.data.data;
    },

    /**
     * Create a new invoice
     */
    async create(data: CreateInvoiceInput): Promise<Invoice> {
        const response = await api.post('/invoices', data);
        return response.data.data;
    },

    /**
     * Update an existing invoice
     */
    async update(id: string, data: UpdateInvoiceInput): Promise<Invoice> {
        const response = await api.put(`/invoices/${id}`, data);
        return response.data.data;
    },

    /**
     * Delete an invoice
     */
    async delete(id: string): Promise<void> {
        await api.delete(`/invoices/${id}`);
    },

    /**
     * Get available templates
     */
    async getTemplates(): Promise<InvoiceTemplate[]> {
        const response = await api.get('/invoices/templates');
        return response.data.data;
    },

    /**
     * Get available color schemes
     */
    async getColorSchemes(): Promise<ColorScheme[]> {
        const response = await api.get('/invoices/color-schemes');
        return response.data.data;
    },

    /**
     * Generate WhatsApp share link
     */
    async generateShareLink(id: string): Promise<ShareLinkResponse> {
        const response = await api.post(`/invoices/${id}/share`);
        return response.data.data;
    },

    /**
     * Preview PDF from raw data (returns blob)
     */
    async preview(data: any): Promise<Blob> {
        const response = await api.post('/invoices/preview', data, {
            responseType: 'blob',
        });
        return response.data;
    },
};
