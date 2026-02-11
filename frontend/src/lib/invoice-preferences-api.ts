import { api } from '@/config/axios';

export interface InvoicePreferences {
    signatureEnabled: boolean;
    signature?: string;
    signatureName?: string;
    notesEnabled: boolean;
    notes?: string;
    termsEnabled: boolean;
    terms?: string;
}

export const invoicePreferencesApi = {
    // Get invoice preferences
    async getPreferences(): Promise<InvoicePreferences> {
        const response = await api.get('/auth/invoice-preferences');
        return response.data.data;
    },

    // Update invoice preferences
    async updatePreferences(preferences: Partial<InvoicePreferences>): Promise<InvoicePreferences> {
        const response = await api.patch('/auth/invoice-preferences', preferences);
        return response.data.data;
    },
};
