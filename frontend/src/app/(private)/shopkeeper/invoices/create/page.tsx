'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Save, Eye, FileText, Palette, Sparkles, Hash, Calendar, Clock, PenTool, StickyNote, Shield, FileSignature } from 'lucide-react';
import { Header } from '@/components/app';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { invoiceApi } from '@/lib/invoice-api';
import { CreateInvoiceInput, Invoice, InvoiceItem } from '@/types/invoice';
import { toast } from 'sonner';
import { InvoicePdfPreview } from '../components/invoice-pdf-preview';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { SignaturePad } from '../components/signature-pad';

// Professional default texts
const DEFAULT_NOTES = `Thank you for your business!
We appreciate your trust and partnership.
For any queries, please contact us at your convenience.`;

const DEFAULT_TERMS = `1. Payment is due within 30 days of invoice date.
2. Late payments may incur additional charges.
3. All payments should be made to the specified account.
4. Goods once sold are not returnable.
5. Subject to our standard terms and conditions.`;

const NOTES_SUGGESTIONS = [
    'Thank you for your business! We appreciate your trust and partnership.',
    'We look forward to serving you again. Thank you for choosing us!',
    'Your satisfaction is our priority. Please contact us for any assistance.',
    'Thank you for your prompt payment and continued support.',
];

const TERMS_SUGGESTIONS = [
    'Payment due within 30 days. Late fees may apply.',
    'All sales are final. No refunds or exchanges.',
    'Payment due upon receipt. Overdue accounts subject to interest charges.',
    'Net 30 days. 2% discount if paid within 10 days.',
];

export default function CreateInvoicePage() {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('invoice');

    const [formData, setFormData] = useState<Partial<CreateInvoiceInput>>({
        invoiceNumber: `INV-${Date.now()}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        shopName: user?.businessName || '',
        shopAddress: [user?.address, user?.place].filter(Boolean).join(', ') || '',
        shopPlace: user?.place || '',
        shopPhone: user?.phone || '',
        items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
        subtotal: 0,
        taxRate: 0,
        taxAmount: 0,
        discount: 0,
        discountType: 'percentage',
        total: 0,
        notes: '',
        notesEnabled: false,
        terms: '',
        termsEnabled: false,
        signature: '',
        signatureName: '',
        signatureEnabled: false,
        status: 'draft',
        templateId: 'modern',
        colorScheme: 'blue',
    });

    const { data: templates = [] } = useQuery({
        queryKey: ['invoice-templates'],
        queryFn: () => invoiceApi.getTemplates(),
    });

    const { data: colorSchemes = [] } = useQuery({
        queryKey: ['invoice-colors'],
        queryFn: () => invoiceApi.getColorSchemes(),
    });

    // Load saved preferences from backend on component mount
    const { data: savedPreferences, isLoading: isLoadingPreferences } = useQuery({
        queryKey: ['invoice-preferences'],
        queryFn: async () => {
            try {
                const { invoicePreferencesApi } = await import('@/lib/invoice-preferences-api');
                const prefs = await invoicePreferencesApi.getPreferences();
                console.log('✅ Loaded preferences from backend:', prefs);
                return prefs;
            } catch (error) {
                console.error('❌ Failed to load invoice preferences:', error);
                return null;
            }
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    // Apply saved preferences to form data when loaded
    useEffect(() => {
        if (savedPreferences) {
            console.log('📝 Applying preferences to form:', savedPreferences);
            setFormData((prev) => ({
                ...prev,
                signatureEnabled: savedPreferences.signatureEnabled !== undefined ? savedPreferences.signatureEnabled : prev.signatureEnabled,
                signature: savedPreferences.signature || prev.signature,
                signatureName: savedPreferences.signatureName || prev.signatureName,
                notesEnabled: savedPreferences.notesEnabled !== undefined ? savedPreferences.notesEnabled : prev.notesEnabled,
                notes: savedPreferences.notes || prev.notes,
                termsEnabled: savedPreferences.termsEnabled !== undefined ? savedPreferences.termsEnabled : prev.termsEnabled,
                terms: savedPreferences.terms || prev.terms,
            }));
        }
    }, [savedPreferences]);



    // Mutation to save preferences to backend
    const savePreferencesMutation = useMutation({
        mutationFn: async (preferences: any) => {
            console.log('💾 Saving preferences to backend:', preferences);
            const { invoicePreferencesApi } = await import('@/lib/invoice-preferences-api');
            const result = await invoicePreferencesApi.updatePreferences(preferences);
            console.log('✅ Preferences saved successfully:', result);
            return result;
        },
        onSuccess: (data) => {
            // Invalidate and refetch preferences
            queryClient.invalidateQueries({ queryKey: ['invoice-preferences'] });
        },
        onError: (error) => {
            console.error('❌ Failed to save invoice preferences:', error);
        },
    });


    // Save preferences to backend whenever signature, notes, or terms settings change
    useEffect(() => {
        // Skip on initial mount
        if (!savedPreferences) {
            console.log('⏭️ Skipping save - preferences not loaded yet');
            return;
        }

        const preferences = {
            signatureEnabled: formData.signatureEnabled,
            signature: formData.signature,
            signatureName: formData.signatureName,
            notesEnabled: formData.notesEnabled,
            notes: formData.notes,
            termsEnabled: formData.termsEnabled,
            terms: formData.terms,
        };

        console.log('⏱️ Debouncing save for preferences:', preferences);

        // Debounce the save operation
        const timeoutId = setTimeout(() => {
            savePreferencesMutation.mutate(preferences);
        }, 1000); // Wait 1 second after last change before saving

        return () => clearTimeout(timeoutId);
    }, [
        formData.signatureEnabled,
        formData.signature,
        formData.signatureName,
        formData.notesEnabled,
        formData.notes,
        formData.termsEnabled,
        formData.terms,
    ]);


    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);

    const createMutation = useMutation({
        mutationFn: (data: CreateInvoiceInput) => invoiceApi.create(data),
        onSuccess: (invoice) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            // Show PDF preview for user to confirm
            setPreviewInvoiceId(invoice._id);
            setPreviewOpen(true);
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message || t('invoices.messages.error_create');
            toast.error(errorMessage);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: Invoice['status'] }) =>
            invoiceApi.update(id, { status }),
        onSuccess: (invoice) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success(t('invoices.messages.success_create'));
            // Don't redirect - stay on create page for continuous invoice creation
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message;
            toast.error(errorMessage);
        },
    });

    // Function to reset form to initial state
    const resetForm = () => {
        setFormData({
            invoiceNumber: `INV-${Date.now()}`,
            invoiceDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            customerAddress: '',
            shopName: user?.businessName || '',
            shopAddress: [user?.address, user?.place].filter(Boolean).join(', ') || '',
            shopPlace: user?.place || '',
            shopPhone: user?.phone || '',
            items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
            subtotal: 0,
            taxRate: 0,
            taxAmount: 0,
            discount: 0,
            discountType: 'percentage',
            total: 0,
            notes: savedPreferences?.notes || '',
            notesEnabled: savedPreferences?.notesEnabled || false,
            terms: savedPreferences?.terms || '',
            termsEnabled: savedPreferences?.termsEnabled || false,
            signature: savedPreferences?.signature || '',
            signatureName: savedPreferences?.signatureName || '',
            signatureEnabled: savedPreferences?.signatureEnabled || false,
            status: 'draft',
            templateId: 'modern',
            colorScheme: 'blue',
        });
        setPreviewInvoiceId(null);
        setActiveTab('invoice');
    };

    const recalculateTotals = (updates: Partial<typeof formData>) => {
        const updatedData = { ...formData, ...updates };
        const subtotal = (updatedData.items || []).reduce((sum, item) => sum + item.amount, 0);
        const taxAmount = (subtotal * (updatedData.taxRate || 0)) / 100;
        const discountAmount = updatedData.discountType === 'percentage'
            ? (subtotal * (updatedData.discount || 0)) / 100
            : (updatedData.discount || 0);
        const total = subtotal + taxAmount - discountAmount;

        return { subtotal, taxAmount, total };
    };

    const handleInputChange = (field: string, value: any) => {
        const updates = { [field]: value };
        const totals = recalculateTotals(updates);
        setFormData((prev) => ({ ...prev, ...updates, ...totals }));
    };

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
        const items = [...(formData.items || [])];
        items[index] = { ...items[index], [field]: value };

        if (field === 'quantity' || field === 'rate') {
            items[index].amount = items[index].quantity * items[index].rate;
        }

        const totals = recalculateTotals({ items });
        setFormData((prev) => ({ ...prev, items, ...totals }));
    };

    const addItem = () => {
        setFormData((prev) => ({
            ...prev,
            items: [...(prev.items || []), { description: '', quantity: 1, rate: 0, amount: 0 }],
        }));
    };

    const removeItem = (index: number) => {
        const items = (formData.items || []).filter((_, i) => i !== index);
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
        const taxAmount = (subtotal * (formData.taxRate || 0)) / 100;
        const discountAmount = formData.discountType === 'percentage'
            ? (subtotal * (formData.discount || 0)) / 100
            : (formData.discount || 0);
        const total = subtotal + taxAmount - discountAmount;

        setFormData((prev) => ({ ...prev, items, subtotal, taxAmount, total }));
    };

    const handleSubmit = (status: 'draft' | 'sent') => {
        if (!formData.customerName) {
            toast.error(t('invoices.validation.customer_name_required'));
            return;
        }

        if (!formData.items || formData.items.length === 0) {
            toast.error(t('invoices.validation.items_required'));
            return;
        }

        // Validate individual items
        for (const item of formData.items) {
            if (!item.description || item.description.trim() === '') {
                toast.error(t('invoices.validation.item_description_required'));
                return;
            }
            if (!item.quantity || item.quantity <= 0) {
                toast.error(t('invoices.validation.item_quantity_required'));
                return;
            }
            if (item.rate < 0) {
                toast.error(t('invoices.validation.item_rate_required'));
                return;
            }
        }

        // Prepare data and remove empty dueDate to prevent validation errors
        const dataToSubmit = { ...formData, status };
        if (!dataToSubmit.dueDate || dataToSubmit.dueDate === '') {
            delete dataToSubmit.dueDate;
        }

        createMutation.mutate(dataToSubmit as CreateInvoiceInput);
    };

    const handlePreview = () => {
        if (!formData.customerName) {
            toast.error(t('invoices.validation.customer_name_required'));
            return;
        }

        if (!formData.items || formData.items.length === 0) {
            toast.error(t('invoices.validation.items_required'));
            return;
        }

        // Validate individual items
        for (const item of formData.items) {
            if (!item.description || item.description.trim() === '') {
                toast.error(t('invoices.validation.item_description_required'));
                return;
            }
            if (!item.quantity || item.quantity <= 0) {
                toast.error(t('invoices.validation.item_quantity_required'));
                return;
            }
            if (item.rate < 0) {
                toast.error(t('invoices.validation.item_rate_required'));
                return;
            }
        }

        // Create as draft for preview
        const dataToSubmit = { ...formData, status: 'draft' };
        if (!dataToSubmit.dueDate || dataToSubmit.dueDate === '') {
            delete dataToSubmit.dueDate;
        }

        createMutation.mutate(dataToSubmit as CreateInvoiceInput);
    };

    const applySuggestion = (type: 'notes' | 'terms', text: string) => {
        if (type === 'notes') {
            handleInputChange('notes', text);
            handleInputChange('notesEnabled', true);
        } else {
            handleInputChange('terms', text);
            handleInputChange('termsEnabled', true);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50 pb-24">
            <Header title={t('invoices.create_new')} />

            <div className="p-4 md:p-6">
                {/* Page Header */}
                <div className="mb-4 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
                                {t('invoices.create_title')}
                            </h2>
                            <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                        </div>
                        <p className="text-gray-600 text-sm md:text-base mt-0.5 md:mt-1 flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{t('invoices.status_draft')}</Badge>
                            {t('invoices.create_subtitle')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">{t('common.back')}</span>
                        </Button>
                        <Button variant="outline" onClick={handlePreview}
                            disabled={createMutation.isPending} className="gap-2">
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">{t('invoices.preview')}</span>
                        </Button>
                        <Button
                            onClick={() => handleSubmit('sent')}
                            disabled={createMutation.isPending}
                            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                            <Save className="h-4 w-4" />
                            {t('common.save')}
                        </Button>
                    </div>
                </div>

                {/* Tabbed Interface */}
                <div className="max-w-7xl mx-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        {/* Tab Navigation */}
                        <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto h-auto p-1.5 bg-white/80 backdrop-blur-md border-2 border-gray-100 rounded-2xl shadow-xl">
                            <TabsTrigger
                                value="invoice"
                                className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white py-3.5 px-4 md:px-6 rounded-xl font-bold transition-all duration-300 hover:bg-gray-50/50"
                            >
                                <FileText className="h-4 w-4" />
                                <span className="hidden sm:inline">Create Invoice</span>
                                <span className="sm:hidden">Invoice</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="signature"
                                className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white py-3.5 px-4 md:px-6 rounded-xl font-bold transition-all duration-300 hover:bg-gray-50/50"
                            >
                                <PenTool className="h-4 w-4" />
                                <span className="hidden sm:inline">Signature</span>
                                <span className="sm:hidden">Sign</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="notes"
                                className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white py-3.5 px-4 md:px-6 rounded-xl font-bold transition-all duration-300 hover:bg-gray-50/50"
                            >
                                <StickyNote className="h-4 w-4" />
                                <span className="hidden sm:inline">Notes & Terms</span>
                                <span className="sm:hidden">Notes</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab 1: Create Invoice */}
                        <TabsContent value="invoice" className="space-y-6">

                            {/* Design Options - Premium Design */}
                            <Card className="max-w-6xl mx-auto border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50">
                                <CardHeader className="border-b bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-indigo-600/10 pb-6">
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg">
                                                <Palette className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                                                    {t('invoices.style_title')}
                                                </CardTitle>
                                                <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                                                    {t('invoices.style_subtitle')}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-md">
                                            {t('invoices.customize')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 md:p-8">
                                    <div className="space-y-8">
                                        {/* Template Selection with Visual Cards */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                                <Label className="text-base font-bold text-gray-800">
                                                    {t('invoices.template')}
                                                </Label>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {templates.map((template) => (
                                                    <button
                                                        key={template.id}
                                                        type="button"
                                                        onClick={() => handleInputChange('templateId', template.id)}
                                                        className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 ${formData.templateId === template.id
                                                            ? 'border-purple-600 bg-gradient-to-br from-purple-50 to-blue-50 shadow-xl scale-105'
                                                            : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-lg hover:scale-102'
                                                            }`}
                                                    >
                                                        {/* Template Icon */}
                                                        <div className={`w-12 h-12 rounded-xl mb-3 flex items-center justify-center transition-all ${formData.templateId === template.id
                                                            ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg'
                                                            : 'bg-gray-100 group-hover:bg-purple-100'
                                                            }`}>
                                                            <FileText className={`h-6 w-6 ${formData.templateId === template.id ? 'text-white' : 'text-gray-600 group-hover:text-purple-600'
                                                                }`} />
                                                        </div>

                                                        {/* Template Name */}
                                                        <h3 className={`font-bold text-left mb-1.5 ${formData.templateId === template.id ? 'text-purple-700' : 'text-gray-800'
                                                            }`}>
                                                            {t(`invoices.templates.${template.id}`)}
                                                        </h3>

                                                        {/* Template Description */}
                                                        <p className="text-xs text-left text-gray-600 line-clamp-2">
                                                            {t(`invoices.templates.${template.id}_desc`)}
                                                        </p>

                                                        {/* Selected Indicator */}
                                                        {formData.templateId === template.id && (
                                                            <div className="absolute top-3 right-3">
                                                                <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                                                    <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path d="M5 13l4 4L19 7"></path>
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Color Scheme Selection */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Sparkles className="h-5 w-5 text-purple-600" />
                                                <Label className="text-base font-bold text-gray-800">
                                                    {t('invoices.color_scheme')}
                                                </Label>
                                            </div>
                                            <div className="flex flex-wrap gap-4">
                                                {colorSchemes.map((color) => (
                                                    <button
                                                        key={color.id}
                                                        type="button"
                                                        onClick={() => handleInputChange('colorScheme', color.id)}
                                                        className="group flex flex-col items-center gap-2"
                                                    >
                                                        <div
                                                            className={`relative w-16 h-16 rounded-2xl border-3 transition-all duration-300 ${formData.colorScheme === color.id
                                                                ? 'border-gray-900 ring-4 ring-offset-2 ring-gray-900/20 scale-110 shadow-2xl'
                                                                : 'border-gray-200 hover:scale-105 hover:shadow-xl hover:ring-2 hover:ring-purple-200 hover:ring-offset-2'
                                                                }`}
                                                            style={{
                                                                background: `linear-gradient(135deg, ${color.primary} 0%, ${color.primary}dd 100%)`
                                                            }}
                                                        >
                                                            {formData.colorScheme === color.id && (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                                                                        <svg className="w-5 h-5 text-gray-900" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path d="M5 13l4 4L19 7"></path>
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className={`text-xs font-medium transition-colors ${formData.colorScheme === color.id ? 'text-gray-900' : 'text-gray-600'
                                                            }`}>
                                                            {t(`invoices.colors.${color.id}`)}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>


                                        {/* Preview Section - Enhanced */}
                                        <div className="pt-6 border-t-2 border-dashed border-gray-200">
                                            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200/50">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg animate-pulse">
                                                            <Eye className="h-6 w-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 text-base">{t('invoices.ready_to_preview')}</h4>
                                                            <p className="text-xs text-gray-600">{t('invoices.see_how_it_looks')}</p>
                                                        </div>
                                                    </div>
                                                    <Sparkles className="h-6 w-6 text-purple-400" />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <Button
                                                        type="button"
                                                        onClick={handlePreview}
                                                        disabled={createMutation.isPending}
                                                        className="min-h-14 h-auto py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 gap-2 text-sm md:text-base whitespace-normal text-center leading-tight"
                                                    >
                                                        <Eye className="h-5 w-5 flex-shrink-0" />
                                                        {t('invoices.preview_invoice')}
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="min-h-14 h-auto py-2 border-2 border-purple-300 hover:border-purple-500 hover:bg-white text-purple-700 font-semibold gap-2 text-sm md:text-base hover:shadow-lg transition-all duration-300 whitespace-normal text-center leading-tight"
                                                    >
                                                        <Sparkles className="h-5 w-5 flex-shrink-0" />
                                                        {t('invoices.quick_tips')}
                                                    </Button>
                                                </div>

                                                <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-purple-200/50">
                                                    <div className="flex items-start gap-2">
                                                        <div className="mt-0.5">
                                                            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                                        </div>
                                                        <p className="text-xs text-gray-700 leading-relaxed">
                                                            <span className="font-semibold text-purple-700">{t('invoices.pro_tip')}:</span> {t('invoices.pro_tip_desc')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="max-w-7xl mx-auto space-y-6">
                                {/* Customer Details + Summary - Side by Side on Large Screens */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Left Column - Forms */}
                                    <div className="lg:col-span-2 space-y-6">
                                        {/* Invoice Details - NEW */}
                                        <Card className="border-0 shadow-xl overflow-hidden bg-white">
                                            <CardHeader className="border-b-2 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 pb-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                                                        <Hash className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">
                                                            {t('invoices.invoice_details')}
                                                        </CardTitle>
                                                        <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                                                            {t('invoices.invoice_details_desc')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-6 md:p-8">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="invoiceNumber" className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                            <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                                                            {t('invoices.invoice_number')}
                                                            <span className="text-red-500 text-base">*</span>
                                                        </Label>
                                                        <div className="relative">
                                                            <Input
                                                                id="invoiceNumber"
                                                                value={formData.invoiceNumber}
                                                                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                                                                className="h-12 pl-4 border-2 border-gray-200 focus:border-blue-500 rounded-xl font-bold"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="invoiceDate" className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                            <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                                                            {t('invoices.invoice_date')}
                                                            <span className="text-red-500 text-base">*</span>
                                                        </Label>
                                                        <div className="relative">
                                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input
                                                                id="invoiceDate"
                                                                type="date"
                                                                value={formData.invoiceDate}
                                                                onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                                                                className="h-12 pl-11 border-2 border-gray-200 focus:border-indigo-500 rounded-xl font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="dueDate" className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                            <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
                                                            {t('invoices.due_date')}
                                                        </Label>
                                                        <div className="relative">
                                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input
                                                                id="dueDate"
                                                                type="date"
                                                                value={formData.dueDate}
                                                                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                                                                className="h-12 pl-11 border-2 border-gray-200 focus:border-purple-500 rounded-xl font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Customer Details - Enhanced Design */}
                                        <Card className="border-0 shadow-xl overflow-hidden bg-white">
                                            <CardHeader className="border-b-2 border-indigo-500 bg-gradient-to-r from-indigo-50 to-blue-50 pb-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl shadow-lg">
                                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">
                                                            {t('invoices.customer_details')}
                                                        </CardTitle>
                                                        <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                                                            {t('invoices.enter_customer_details_desc')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-6 md:p-8 space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="customerName" className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                            <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                                                            {t('invoices.customer_name')}
                                                            <span className="text-red-500 text-base">*</span>
                                                        </Label>
                                                        <div className="relative">
                                                            <Input
                                                                id="customerName"
                                                                value={formData.customerName}
                                                                onChange={(e) => handleInputChange('customerName', e.target.value)}
                                                                placeholder={t('invoices.enter_customer_name_placeholder')}
                                                                className="h-12 pl-4 pr-4 border-2 border-gray-200 focus:border-indigo-500 rounded-xl bg-white transition-all font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="customerPhone" className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                            <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
                                                            {t('invoices.customer_phone')}
                                                            <Badge variant="secondary" className="text-xs ml-auto">{t('invoices.optional')}</Badge>
                                                        </Label>
                                                        <div className="relative">
                                                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                            <Input
                                                                id="customerPhone"
                                                                value={formData.customerPhone}
                                                                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                                                                placeholder="+91 XXXXX XXXXX"
                                                                className="h-12 pl-11 pr-4 border-2 border-gray-200 focus:border-green-500 rounded-xl bg-white transition-all font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="customerEmail" className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                            <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
                                                            {t('invoices.customer_email')}
                                                            <Badge variant="secondary" className="text-xs ml-auto">{t('invoices.optional')}</Badge>
                                                        </Label>
                                                        <div className="relative">
                                                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                            <Input
                                                                id="customerEmail"
                                                                type="email"
                                                                value={formData.customerEmail}
                                                                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                                                                placeholder="customer@example.com"
                                                                className="h-12 pl-11 pr-4 border-2 border-gray-200 focus:border-purple-500 rounded-xl bg-white transition-all font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="customerAddress" className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                            <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
                                                            {t('invoices.customer_address')}
                                                            <Badge variant="secondary" className="text-xs ml-auto">{t('invoices.optional')}</Badge>
                                                        </Label>
                                                        <div className="relative">
                                                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            <Input
                                                                id="customerAddress"
                                                                value={formData.customerAddress}
                                                                onChange={(e) => handleInputChange('customerAddress', e.target.value)}
                                                                placeholder="Enter customer address"
                                                                className="h-12 pl-11 pr-4 border-2 border-gray-200 focus:border-orange-500 rounded-xl bg-white transition-all font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Info Tip */}
                                                <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-100">
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                                            <svg className="h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-gray-900 mb-1">
                                                                💡 {t('invoices.quick_tips')}
                                                            </p>
                                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                                {t('invoices.validation_customer_details_tip')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>


                                    </div>
                                    {/* Summary Card - Sticky on Large Screens */}
                                    <div className="lg:col-span-1">
                                        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white lg:sticky lg:top-20 h-fit">
                                            <CardHeader className="border-b border-white/10 pb-4">
                                                <CardTitle className="text-lg md:text-xl flex items-center justify-between">
                                                    {t('invoices.total')}
                                                    <Sparkles className="h-5 w-5" />
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-5 space-y-4">
                                                {/* Subtotal */}
                                                <div className="flex flex-row justify-between items-center text-sm pb-3 border-b border-white/10">
                                                    <span className="text-white/70 font-medium">
                                                        {t('invoices.subtotal')}
                                                    </span>
                                                    <span className="font-semibold text-base whitespace-nowrap">
                                                        {formatCurrency(formData.subtotal || 0)}
                                                    </span>
                                                </div>

                                                {/* Discount Section */}
                                                <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <Label className="text-xs text-white/90 font-semibold flex items-center gap-2">
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                            </svg>
                                                            {t('invoices.discount')}
                                                        </Label>
                                                        <Badge variant="outline" className="text-xs bg-white/5 border-white/20 text-white/70">
                                                            {t('invoices.optional')}
                                                        </Badge>
                                                    </div>

                                                    {/* Discount Type Toggle - User Friendly */}
                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-white/70">{t('invoices.discount_type')}</Label>
                                                        <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleInputChange('discountType', 'percentage')}
                                                                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all ${formData.discountType === 'percentage'
                                                                    ? 'bg-white text-blue-600 shadow-md'
                                                                    : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                                                                    }`}
                                                            >
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                </svg>
                                                                <span>{t('invoices.percentage')} %</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleInputChange('discountType', 'fixed')}
                                                                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all ${formData.discountType === 'fixed'
                                                                    ? 'bg-white text-blue-600 shadow-md'
                                                                    : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                                                                    }`}
                                                            >
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <span>{t('invoices.fixed')} ₹</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Discount Input */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs text-white/70 flex items-center gap-1">
                                                                {formData.discountType === 'percentage' ? (
                                                                    <>
                                                                        <span>{t('invoices.discount_rate')}</span>
                                                                        <span className="text-white/50">(%)</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span>{t('invoices.discount_amount')}</span>
                                                                        <span className="text-white/50">(₹)</span>
                                                                    </>
                                                                )}
                                                            </Label>
                                                            <div className="relative">
                                                                {formData.discountType === 'fixed' && (
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 text-sm font-semibold">₹</span>
                                                                )}
                                                                {formData.discountType === 'percentage' && (
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 text-sm font-semibold">%</span>
                                                                )}
                                                                <Input
                                                                    type="number"
                                                                    value={formData.discount || 0}
                                                                    onChange={(e) => handleInputChange('discount', Number(e.target.value))}
                                                                    className={`h-10 bg-white/10 border-white/20 text-white font-bold placeholder:text-white/40 focus:bg-white/15 focus:border-white/40 ${formData.discountType === 'fixed' ? 'pl-7 pr-3 text-right' : 'pl-3 pr-8 text-center'
                                                                        }`}
                                                                    placeholder={formData.discountType === 'percentage' ? '0' : '0'}
                                                                    min={0}
                                                                    max={formData.discountType === 'percentage' ? 100 : undefined}
                                                                    step={formData.discountType === 'percentage' ? '0.1' : '1'}
                                                                />
                                                            </div>
                                                            {formData.discountType === 'percentage' && (
                                                                <p className="text-xs text-white/50 mt-1">{t('invoices.max_100')}</p>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs text-white/70">{t('invoices.total_discount')}</Label>
                                                            <div className="h-10 flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-md text-sm font-bold border-2 border-emerald-400/40 text-emerald-100 shadow-inner">
                                                                -{formatCurrency(
                                                                    formData.discountType === 'percentage'
                                                                        ? ((formData.subtotal || 0) * (formData.discount || 0)) / 100
                                                                        : (formData.discount || 0)
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-emerald-200/60 mt-1">
                                                                {formData.discount && formData.discount > 0 ? (
                                                                    formData.discountType === 'percentage'
                                                                        ? `${formData.discount}% ${t('invoices.off')}`
                                                                        : t('invoices.flat_discount')
                                                                ) : (
                                                                    '\u00A0' // Non-breaking space to maintain layout
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Tax Section */}
                                                <div className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                                    <Label className="text-xs text-white/90 font-semibold flex items-center gap-2">
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                                                        </svg>
                                                        {t('invoices.tax_gst_vat')}
                                                    </Label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs text-white/60">{t('invoices.tax_rate')}</Label>
                                                            <Input
                                                                type="number"
                                                                value={formData.taxRate || 0}
                                                                onChange={(e) => handleInputChange('taxRate', Number(e.target.value))}
                                                                className="h-8 bg-white/10 border-white/20 text-white text-center placeholder:text-white/40"
                                                                min={0}
                                                                max={100}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs text-white/60">{t('invoices.tax_amount')}</Label>
                                                            <div className="h-8 flex items-center justify-center bg-amber-500/20 rounded-md text-xs font-semibold border border-amber-400/30 text-amber-100">
                                                                +{formatCurrency(formData.taxAmount || 0)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Grand Total */}
                                                <div className="pt-4 border-t-2 border-white/20">
                                                    <div className="text-center space-y-2">
                                                        <p className="text-xs text-white/70 uppercase tracking-wider font-semibold">{t('invoices.grand_total')}</p>
                                                        <div className="bg-white/10 rounded-xl p-3 border-2 border-white/20">
                                                            <p className="text-3xl md:text-4xl font-black tracking-tight">{formatCurrency(formData.total || 0)}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="space-y-2 pt-2">
                                                    <Button
                                                        onClick={handlePreview}
                                                        disabled={createMutation.isPending}
                                                        variant="outline"
                                                        className="w-full h-auto min-h-10 py-2 bg-white/10 border-white/20 text-white hover:bg-white/20 whitespace-normal text-center leading-tight"
                                                    >
                                                        <Eye className="h-4 w-4 mr-2 flex-shrink-0" />
                                                        {t('invoices.preview_invoice')}
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleSubmit('sent')}
                                                        disabled={createMutation.isPending}
                                                        className="w-full h-auto min-h-11 py-2 bg-white text-blue-600 hover:bg-gray-100 font-semibold whitespace-normal text-center leading-tight"
                                                    >
                                                        <Save className="h-4 w-4 mr-2 flex-shrink-0" />
                                                        {t('invoices.create_now')}
                                                    </Button>
                                                </div>

                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>

                                {/* Invoice Items - Professional Table Design */}
                                <Card className="border-0 shadow-xl overflow-hidden bg-white">
                                    <CardHeader className="border-b-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 pb-5">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-lg">
                                                    <FileText className="h-6 w-6 text-white" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">
                                                        {t('invoices.items')}
                                                    </CardTitle>
                                                    <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                                                        {t('invoices.add_products_desc')}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={addItem}
                                                className="w-full sm:w-auto h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-300 gap-2 font-semibold"
                                            >
                                                <Plus className="h-5 w-5" />
                                                <span>{t('invoices.add_item')}</span>
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {/* Table for larger screens */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                                                        <th className="text-left px-3 py-4 font-bold text-gray-700 text-xs uppercase tracking-wider w-14">#</th>
                                                        <th className="text-left px-4 py-4 font-bold text-gray-700 text-xs uppercase tracking-wider min-w-[300px]">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                                                                {t('invoices.description')}
                                                            </div>
                                                        </th>
                                                        <th className="text-center px-3 py-4 font-bold text-gray-700 text-xs uppercase tracking-wider w-32">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                                                                <span className="hidden lg:inline">{t('invoices.quantity')}</span>
                                                                <span className="lg:hidden">{t('invoices.quantity')}</span>
                                                            </div>
                                                        </th>
                                                        <th className="text-right px-3 py-4 font-bold text-gray-700 text-xs uppercase tracking-wider w-48">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                                                                {t('invoices.rate')}
                                                            </div>
                                                        </th>
                                                        <th className="text-right px-3 py-4 font-bold text-gray-700 text-xs uppercase tracking-wider w-48">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                                                                {t('invoices.amount')}
                                                            </div>
                                                        </th>
                                                        <th className="text-center px-2 py-4 font-bold text-gray-700 text-xs uppercase tracking-wider w-14">
                                                            <span className="sr-only">{t('invoices.table.actions')}</span>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(formData.items || []).map((item, index) => (
                                                        <tr
                                                            key={index}
                                                            className="border-b border-gray-100 hover:bg-green-50/30 transition-colors group"
                                                        >
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white font-bold text-sm shadow-md">
                                                                    {index + 1}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <Input
                                                                    value={item.description}
                                                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                                    placeholder={t('invoices.item_description_placeholder')}
                                                                    className="h-11 border-2 border-gray-200 focus:border-green-500 bg-white rounded-lg text-sm font-medium transition-all"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <Input
                                                                    type="number"
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                                                    className="h-11 text-center text-sm font-bold border-2 border-blue-200 focus:border-blue-500 rounded-lg bg-blue-50/50 transition-all"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="relative w-full min-w-[120px]">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₹</span>
                                                                    <Input
                                                                        type="number"
                                                                        value={item.rate}
                                                                        onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                                                                        className="h-11 w-full pl-7 pr-4 text-right text-sm font-bold border-2 border-purple-200 focus:border-purple-500 rounded-lg bg-purple-50/50 transition-all"
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="h-11 flex items-center justify-end px-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border-2 border-green-200">
                                                                    <span className="text-base font-black bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                                                                        {formatCurrency(item.amount)}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                {formData.items && formData.items.length > 1 && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => removeItem(index)}
                                                                        className="h-9 w-9 p-0 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                {/* Table Footer - Summary Row */}
                                                <tfoot>
                                                    <tr className="bg-gradient-to-r from-gray-50 via-blue-50 to-gray-50 border-t-2 border-blue-200">
                                                        <td colSpan={2} className="px-4 py-4">
                                                            <div className="flex items-center gap-2 text-gray-700 font-bold">
                                                                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                </svg>
                                                                <span className="text-sm uppercase tracking-wide">{t('invoices.table_summary')}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="text-xs text-gray-500 uppercase tracking-wide">{t('invoices.total_qty')}</span>
                                                                <div className="flex items-center justify-center w-full h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white font-black text-lg rounded-lg shadow-md">
                                                                    {(formData.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td colSpan={2} className="px-4 py-4">
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className="text-xs text-gray-500 uppercase tracking-wide">{t('invoices.subtotal')}</span>
                                                                <div className="flex items-center justify-center px-4 h-10 bg-gradient-to-br from-emerald-500 to-green-600 text-white font-black text-lg rounded-lg shadow-md min-w-[140px]">
                                                                    {formatCurrency(formData.subtotal || 0)}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-4"></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        {/* Mobile Card View */}
                                        <div className="md:hidden p-4 space-y-4">
                                            {(formData.items || []).map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="p-4 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-green-50/20 shadow-sm hover:shadow-md transition-all"
                                                >
                                                    {/* Mobile Item Header */}
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white font-bold text-sm flex items-center justify-center shadow-md">
                                                                {index + 1}
                                                            </div>
                                                            <span className="text-sm font-bold text-gray-700">{t('invoices.item_n', { n: index + 1 })}</span>
                                                        </div>
                                                        {formData.items && formData.items.length > 1 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeItem(index)}
                                                                className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 text-red-500"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {/* Description */}
                                                    <div className="space-y-2 mb-3">
                                                        <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                                            <div className="w-1 h-3 bg-green-500 rounded-full"></div>
                                                            {t('invoices.description')}
                                                        </Label>
                                                        <Input
                                                            value={item.description}
                                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                            placeholder={t('invoices.item_description_placeholder')}
                                                            className="h-11 border-2 border-gray-200 focus:border-green-500 rounded-lg"
                                                        />
                                                    </div>

                                                    {/* Qty, Rate, Amount Grid - Improved for Mobile */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                                                <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                                                                {t('invoices.quantity')}
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                                                className="h-11 text-center font-bold border-2 border-blue-200 focus:border-blue-500 rounded-lg bg-blue-50/50"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                                                <div className="w-1 h-3 bg-purple-500 rounded-full"></div>
                                                                {t('invoices.rate')}
                                                            </Label>
                                                            <div className="relative w-full">
                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">₹</span>
                                                                <Input
                                                                    type="number"
                                                                    value={item.rate}
                                                                    onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                                                                    className="h-11 w-full pl-6 pr-3 text-right font-bold border-2 border-purple-200 focus:border-purple-500 rounded-lg bg-purple-50/50"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-span-2 space-y-2">
                                                            <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                                                <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                                                                {t('invoices.total_amount')}
                                                            </Label>
                                                            <div className="h-11 flex items-center justify-between px-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border-2 border-green-200">
                                                                <span className="text-xs text-gray-500 font-medium tracking-wider">INR</span>
                                                                <span className="text-sm font-black bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                                                                    {formatCurrency(item.amount)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Mobile Summary Card */}
                                            {formData.items && formData.items.length > 0 && (
                                                <div className="p-4 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-emerald-50 shadow-md">
                                                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-200">
                                                        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                        <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">{t('invoices.items_summary_title')}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-2">
                                                            <span className="text-xs text-gray-500 uppercase tracking-wide block">{t('invoices.total_qty')}</span>
                                                            <div className="flex items-center justify-center h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white font-black text-xl rounded-lg shadow-md">
                                                                {(formData.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <span className="text-xs text-gray-500 uppercase tracking-wide block">{t('invoices.subtotal')}</span>
                                                            <div className="flex items-center justify-center h-12 px-2 bg-gradient-to-br from-emerald-500 to-green-600 text-white font-black text-lg rounded-lg shadow-md">
                                                                {formatCurrency(formData.subtotal || 0)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Empty State */}
                                        {(!formData.items || formData.items.length === 0) && (
                                            <div className="text-center py-16 px-4">
                                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl mb-4 shadow-inner">
                                                    <FileText className="h-10 w-10 text-green-600" />
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('invoices.empty_items')}</h3>
                                                <p className="text-sm text-gray-600 mb-6">{t('invoices.items_empty_desc')}</p>
                                                <Button
                                                    onClick={addItem}
                                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    {t('invoices.add_first_item_btn')}
                                                </Button>
                                            </div>
                                        )}

                                        {/* Footer with Pro Tip */}
                                        {formData.items && formData.items.length > 0 && (
                                            <div className="border-t-2 border-gray-100 bg-gradient-to-r from-green-50/50 to-emerald-50/50 p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-green-100 rounded-lg">
                                                        <Sparkles className="h-4 w-4 text-green-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-gray-900 mb-1">
                                                            💡 {t('invoices.pro_tip')}
                                                        </p>
                                                        <p className="text-xs text-gray-600 leading-relaxed">
                                                            {t('invoices.item_calculation_tip')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                        </TabsContent>

                        {/* Tab 2: Signature Settings */}
                        <TabsContent value="signature" className="space-y-6">
                            <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-purple-50 via-white to-indigo-50">
                                <CardHeader className="border-b-2 border-purple-500 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-purple-600/10 pb-6">
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg">
                                                <FileSignature className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
                                                    Signature Settings
                                                </CardTitle>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Add your professional signature to invoices
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border-2 border-purple-200 shadow-sm">
                                            <Label htmlFor="signature-toggle" className="text-sm font-bold text-gray-700 cursor-pointer">
                                                Enable Signature
                                            </Label>
                                            <Switch
                                                id="signature-toggle"
                                                checked={formData.signatureEnabled || false}
                                                onCheckedChange={(checked) => handleInputChange('signatureEnabled', checked)}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 md:p-12">
                                    {formData.signatureEnabled ? (
                                        <div className="max-w-4xl mx-auto space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Signature Pad */}
                                                <div className="space-y-4">
                                                    <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                                                        <div className="w-2 h-4 bg-purple-500 rounded-full"></div>
                                                        Draw Your Signature
                                                    </Label>
                                                    <SignaturePad
                                                        initialSignature={formData.signature}
                                                        onSave={(sig) => handleInputChange('signature', sig)}
                                                        onClear={() => handleInputChange('signature', '')}
                                                    />
                                                    <p className="text-xs text-gray-500 flex items-start gap-2">
                                                        <span className="text-purple-600">💡</span>
                                                        <span>Draw your signature using mouse or touch. It will appear on your invoices.</span>
                                                    </p>
                                                </div>

                                                {/* Signature Name */}
                                                <div className="space-y-6">
                                                    <div className="space-y-3">
                                                        <Label htmlFor="signatureName" className="text-base font-bold text-gray-800 flex items-center gap-2">
                                                            <div className="w-2 h-4 bg-indigo-500 rounded-full"></div>
                                                            Signature Name/Title
                                                        </Label>
                                                        <Input
                                                            id="signatureName"
                                                            value={formData.signatureName}
                                                            onChange={(e) => handleInputChange('signatureName', e.target.value)}
                                                            placeholder="e.g., Authorized Signatory"
                                                            className="h-14 text-base border-2 border-gray-200 focus:border-indigo-500 rounded-xl font-medium"
                                                        />
                                                        <p className="text-xs text-gray-500">
                                                            This will appear below your signature
                                                        </p>
                                                    </div>

                                                    {/* Info Box */}
                                                    <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-100">
                                                        <div className="flex items-start gap-3">
                                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                                <Shield className="h-5 w-5 text-purple-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-purple-900 mb-2">
                                                                    Professional Appearance
                                                                </p>
                                                                <p className="text-xs text-purple-700 leading-relaxed">
                                                                    Your signature adds authenticity and professionalism to your invoices.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-16">
                                            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full mb-6 shadow-inner">
                                                <FileSignature className="h-12 w-12 text-purple-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-3">Signature is Disabled</h3>
                                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                                Enable signature to add your professional signature to invoices.
                                            </p>
                                            <Button
                                                onClick={() => handleInputChange('signatureEnabled', true)}
                                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 gap-2"
                                            >
                                                <PenTool className="h-4 w-4" />
                                                Enable Signature
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab 3: Notes & Terms */}
                        <TabsContent value="notes" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Notes Card */}
                                <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-amber-50 via-white to-yellow-50">
                                    <CardHeader className="border-b-2 border-amber-500 bg-gradient-to-r from-amber-600/10 via-yellow-600/10 to-amber-600/10 pb-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-xl shadow-lg">
                                                        <StickyNote className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">
                                                            Invoice Notes
                                                        </CardTitle>
                                                        <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                                                            Add special instructions or messages
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border-2 border-amber-200 shadow-sm">
                                                <Label htmlFor="notes-toggle" className="text-sm font-bold text-gray-700 cursor-pointer flex-1">
                                                    Include Notes in Invoice
                                                </Label>
                                                <Switch
                                                    id="notes-toggle"
                                                    checked={formData.notesEnabled || false}
                                                    onCheckedChange={(checked) => handleInputChange('notesEnabled', checked)}
                                                />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 md:p-8">
                                        {formData.notesEnabled ? (
                                            <div className="space-y-6">
                                                <div className="space-y-3">
                                                    <Label htmlFor="notes" className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                        <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                                                        Your Notes
                                                    </Label>
                                                    <Textarea
                                                        id="notes"
                                                        value={formData.notes}
                                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                                        placeholder="Enter your notes here..."
                                                        rows={6}
                                                        className="text-sm border-2 border-gray-200 focus:border-amber-500 rounded-xl resize-none bg-white font-medium leading-relaxed"
                                                    />
                                                </div>

                                                {/* Quick Suggestions */}
                                                <div className="space-y-3">
                                                    <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                                        Quick Suggestions
                                                    </Label>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {NOTES_SUGGESTIONS.map((suggestion, index) => (
                                                            <button
                                                                key={index}
                                                                type="button"
                                                                onClick={() => applySuggestion('notes', suggestion)}
                                                                className="text-left p-3 text-xs bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 rounded-lg border border-amber-200 hover:border-amber-400 transition-all text-gray-700 hover:text-gray-900 font-medium"
                                                            >
                                                                {suggestion}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-xl mb-4">
                                                    <StickyNote className="h-10 w-10 text-amber-600" />
                                                </div>
                                                <h4 className="font-bold text-gray-900 mb-2">Notes Disabled</h4>
                                                <p className="text-sm text-gray-600 mb-4">Enable to add notes to invoices</p>
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        handleInputChange('notesEnabled', true);
                                                        handleInputChange('notes', DEFAULT_NOTES);
                                                    }}
                                                    className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
                                                >
                                                    Enable with Default
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Terms Card */}
                                <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-teal-50 via-white to-cyan-50">
                                    <CardHeader className="border-b-2 border-teal-500 bg-gradient-to-r from-teal-600/10 via-cyan-600/10 to-teal-600/10 pb-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-xl shadow-lg">
                                                        <Shield className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">
                                                            Terms & Conditions
                                                        </CardTitle>
                                                        <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                                                            Set payment terms and policies
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border-2 border-teal-200 shadow-sm">
                                                <Label htmlFor="terms-toggle" className="text-sm font-bold text-gray-700 cursor-pointer flex-1">
                                                    Include Terms & Conditions
                                                </Label>
                                                <Switch
                                                    id="terms-toggle"
                                                    checked={formData.termsEnabled || false}
                                                    onCheckedChange={(checked) => handleInputChange('termsEnabled', checked)}
                                                />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 md:p-8">
                                        {formData.termsEnabled ? (
                                            <div className="space-y-6">
                                                <div className="space-y-3">
                                                    <Label htmlFor="terms" className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                        <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                                                        Your Terms
                                                    </Label>
                                                    <Textarea
                                                        id="terms"
                                                        value={formData.terms}
                                                        onChange={(e) => handleInputChange('terms', e.target.value)}
                                                        placeholder="Enter terms and conditions..."
                                                        rows={6}
                                                        className="text-sm border-2 border-gray-200 focus:border-teal-500 rounded-xl resize-none bg-white font-medium leading-relaxed"
                                                    />
                                                </div>

                                                {/* Quick Suggestions */}
                                                <div className="space-y-3">
                                                    <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                                        Quick Suggestions
                                                    </Label>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {TERMS_SUGGESTIONS.map((suggestion, index) => (
                                                            <button
                                                                key={index}
                                                                type="button"
                                                                onClick={() => applySuggestion('terms', suggestion)}
                                                                className="text-left p-3 text-xs bg-gradient-to-r from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 rounded-lg border border-teal-200 hover:border-teal-400 transition-all text-gray-700 hover:text-gray-900 font-medium"
                                                            >
                                                                {suggestion}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-100 rounded-xl mb-4">
                                                    <Shield className="h-10 w-10 text-teal-600" />
                                                </div>
                                                <h4 className="font-bold text-gray-900 mb-2">Terms Disabled</h4>
                                                <p className="text-sm text-gray-600 mb-4">Enable to add terms to invoices</p>
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        handleInputChange('termsEnabled', true);
                                                        handleInputChange('terms', DEFAULT_TERMS);
                                                    }}
                                                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                                                >
                                                    Enable with Default
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Mobile Bottom Bar - Premium Floating Design */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-gray-100/50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] lg:hidden z-50 transition-all duration-300 supports-[backdrop-filter]:bg-white/80">
                    <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex flex-col pl-1">
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">{t('invoices.total')}</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                                    {formatCurrency(formData.total || 0)}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handlePreview}
                                disabled={createMutation.isPending}
                                className="h-12 w-12 rounded-full border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-600 shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95"
                            >
                                <Eye className="h-5 w-5" />
                            </Button>
                            <Button
                                onClick={() => handleSubmit('sent')}
                                disabled={createMutation.isPending}
                                className="h-12 px-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/25 font-bold tracking-wide transition-all hover:scale-105 active:scale-95 hover:shadow-xl"
                            >
                                {createMutation.isPending ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Save className="h-5 w-5" />
                                        <span>{t('invoices.create_now')}</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Professional Backend PDF Preview */}
                {previewInvoiceId && (
                    <InvoicePdfPreview
                        open={previewOpen}
                        onOpenChange={(open) => {
                            setPreviewOpen(open);
                            if (!open && formData.status === 'sent') {
                                // Only navigate away if invoice was finalized
                                router.push('/shopkeeper/invoices');
                            }
                            // If draft, just close and stay for editing
                        }}
                        invoiceId={previewInvoiceId}
                        invoiceNumber={formData.invoiceNumber || ''}
                        templateId={formData.templateId || 'modern'}
                        colorScheme={formData.colorScheme || 'blue'}
                        status={formData.status}
                        onFinalize={() => {
                            if (previewInvoiceId) {
                                updateMutation.mutate(
                                    {
                                        id: previewInvoiceId,
                                        status: 'sent'
                                    },
                                    {
                                        onSuccess: () => {
                                            setPreviewOpen(false);
                                            // Reset form for next invoice
                                            resetForm();
                                        }
                                    }
                                );
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
}
