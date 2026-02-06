'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Package,
    Users,
    Receipt,
    ArrowRight,
    IndianRupee,
    Loader2,
    Search,
    Banknote,
    CreditCard,
    Smartphone,
} from 'lucide-react';
import { Header } from '@/components/app/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import api from '@/config/axios';
import { Wholesaler, Customer } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';

const billSchema = z.object({
    billType: z.enum(['purchase', 'sale']),
    entityType: z.enum(['wholesaler', 'due_customer', 'normal_customer']),
    entityId: z.string().optional(),
    entityName: z.string().optional(),
    totalAmount: z.number().min(0.01, 'Amount must be greater than 0'),
    paidAmount: z.number().min(0, 'Paid amount must be positive'),
    paymentMethod: z.enum(['cash', 'card', 'online']).optional(),
    notes: z.string().optional(),
}).refine((data) => {
    if (data.paidAmount > 0 && !data.paymentMethod) {
        return false;
    }
    return true;
}, {
    message: 'Payment method is required',
    path: ['paymentMethod'],
});

type BillFormData = z.infer<typeof billSchema>;

export default function BillingPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { hasFeature } = useAuth();
    const [billType, setBillType] = useState<'purchase' | 'sale'>('sale');
    const [customerType, setCustomerType] = useState<'due_customer' | 'normal_customer'>('due_customer');
    const [resetKey, setResetKey] = useState(0);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<BillFormData>({
        resolver: zodResolver(billSchema),
        defaultValues: {
            billType: 'sale',
            entityType: 'due_customer',
            paidAmount: 0,
            paymentMethod: 'cash',
            totalAmount: 0,
        },
    });

    const totalAmount = watch('totalAmount') || 0;
    const paidAmount = watch('paidAmount') || 0;
    const dueAmount = Math.max(0, totalAmount - paidAmount);

    // Calculate excess payment (when paying more than the current bill)
    const excessPayment = Math.max(0, paidAmount - totalAmount);

    // Calculate effective paid amount for UI logic
    const effectivePaidAmount = (billType === 'sale' && customerType === 'normal_customer')
        ? totalAmount
        : paidAmount;

    // State for selected entity - must be before useMemo that uses it
    const [selectedEntityId, setSelectedEntityId] = useState<string>('');

    // Fetch wholesalers - must be before useMemo that uses it
    const { data: wholesalers } = useQuery({
        queryKey: ['wholesalers-list'],
        queryFn: async () => {
            const response = await api.get('/wholesalers?limit=100');
            return response.data.data as Wholesaler[];
        },
        enabled: billType === 'purchase' && hasFeature('wholesalers'),
    });

    // Fetch due customers - must be before useMemo that uses it
    const { data: dueCustomers } = useQuery({
        queryKey: ['due-customers-list'],
        queryFn: async () => {
            const response = await api.get('/customers?type=due&limit=100');
            return response.data.data as Customer[];
        },
        enabled: billType === 'sale' && customerType === 'due_customer' && hasFeature('dueCustomers'),
    });

    // Get selected entity's outstanding due
    const selectedEntity = useMemo(() => {
        if (billType === 'purchase') {
            return wholesalers?.find(w => w._id === selectedEntityId);
        } else if (customerType === 'due_customer') {
            return dueCustomers?.find(c => c._id === selectedEntityId);
        }
        return null;
    }, [billType, customerType, selectedEntityId, wholesalers, dueCustomers]);

    const entityOutstandingDue = selectedEntity?.outstandingDue || 0;

    // Calculate how much excess can be applied to reduce outstanding
    const applicableExcess = Math.min(excessPayment, entityOutstandingDue);
    // Remaining outstanding after excess is applied
    const newOutstandingDue = Math.max(0, entityOutstandingDue - excessPayment);

    // Transform wholesalers to combobox options
    const wholesalerOptions: ComboboxOption[] = useMemo(() => {
        return (wholesalers || []).map((w) => ({
            value: w._id,
            label: w.name,
            subLabel: w.outstandingDue > 0 ? `${t('dashboard.total_due')}: ₹${w.outstandingDue.toLocaleString('en-IN')}` : undefined,
        }));
    }, [wholesalers]);

    // Transform customers to combobox options
    const customerOptions: ComboboxOption[] = useMemo(() => {
        return (dueCustomers || []).map((c) => ({
            value: c._id,
            label: c.name,
            subLabel: c.outstandingDue > 0 ? `${t('dashboard.total_due')}: ₹${c.outstandingDue.toLocaleString('en-IN')}` : undefined,
        }));
    }, [dueCustomers]);

    const createBillMutation = useMutation({
        mutationFn: async (data: BillFormData) => {
            const response = await api.post('/bills', data);
            return response.data;
        },
        onSuccess: () => {
            // Invalidate all related queries to ensure data refreshes
            queryClient.invalidateQueries({ queryKey: ['shopkeeper-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['bills'] });

            // Customer dashboard queries
            queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['due-customers'] });
            queryClient.invalidateQueries({ queryKey: ['due-customers-list'] });
            queryClient.invalidateQueries({ queryKey: ['due-customers-stats'] });
            queryClient.invalidateQueries({ queryKey: ['normal-customer-sales'] });

            // Customer dashboard specific queries (exact keys used)
            queryClient.invalidateQueries({ queryKey: ['due-customers-all'] });
            queryClient.invalidateQueries({ queryKey: ['normal-customers-all'] });
            queryClient.invalidateQueries({ queryKey: ['sales-filtered'] });
            queryClient.invalidateQueries({ queryKey: ['customer-payments'] });
            queryClient.invalidateQueries({ queryKey: ['previous-sales'] });

            // Wholesaler queries (for purchases)
            queryClient.invalidateQueries({ queryKey: ['wholesalers'] });
            queryClient.invalidateQueries({ queryKey: ['wholesalers-list'] });
            queryClient.invalidateQueries({ queryKey: ['wholesaler-stats'] });
            queryClient.invalidateQueries({ queryKey: ['wholesaler-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['wholesaler-dues'] });
            queryClient.invalidateQueries({ queryKey: ['purchases-filtered'] });

            toast.success(t('billing.bill_success'));

            // Increment reset key to force-refresh interactive components (clears search inputs)
            setResetKey(prev => prev + 1);

            // Reset customer type to default (Due Customer)
            setCustomerType('due_customer');

            // Reset all form fields
            // billType is retained for bulk entry
            reset({
                billType: billType,
                entityType: billType === 'purchase' ? 'wholesaler' : 'due_customer',
                paidAmount: 0,
                paymentMethod: 'cash',
                totalAmount: 0,
                notes: '',
                entityId: '',
                entityName: ''
            });
            setSelectedEntityId('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('billing.bill_error'));
        },
    });

    const onSubmit = (data: BillFormData) => {
        // For normal customer, name is optional - use 'Walk-in Customer' if empty
        const entityName = data.entityName?.trim() || 'Walk-in Customer';

        // For normal customers, paid amount equals total amount (full payment)
        const paidAmount = (billType === 'sale' && customerType === 'normal_customer')
            ? data.totalAmount
            : data.paidAmount;

        const payload: any = {
            ...data,
            entityName,
            paidAmount,
            billType,
            entityType: billType === 'purchase' ? 'wholesaler' : customerType,
        };

        if (paidAmount === 0) {
            delete payload.paymentMethod;
        }

        createBillMutation.mutate(payload);
    };

    const handleEntitySelect = (value: string, option?: ComboboxOption) => {
        setSelectedEntityId(value);
        if (option) {
            setValue('entityId', value);
            setValue('entityName', option.label);
        } else {
            setValue('entityId', '');
            setValue('entityName', '');
        }
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <Header title={t('billing.new_transaction')} />

            <div className="max-w-4xl mx-auto p-3 md:p-6 lg:p-8">
                {/* Page Title - High contrast */}
                <div className="mb-4 md:mb-6">
                    <h1 className="text-lg md:text-2xl font-bold text-slate-900">{t('billing.new_transaction')}</h1>
                    <p className="text-xs md:text-sm text-slate-600 mt-0.5 md:mt-1">{t('billing.create_bill_desc')}</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div key={resetKey} className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-slate-200 overflow-hidden">

                        {/* Transaction Type Toggle - Clear selection colors */}
                        <div className="p-3 md:p-6 border-b-2 border-slate-100 bg-slate-50">
                            <label className="text-xs md:text-sm font-bold text-slate-800 mb-2 md:mb-3 block uppercase tracking-wide">
                                {t('billing.transaction_type')}
                            </label>
                            <div className="flex bg-white p-1 rounded-xl border-2 border-slate-200 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => setBillType('sale')}
                                    className={`flex-1 py-2.5 md:py-3 px-3 md:px-4 rounded-lg text-sm md:text-base font-bold transition-all flex items-center justify-center gap-2 ${billType === 'sale'
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    <Users className="h-4 w-4 md:h-5 md:w-5" />
                                    {t('billing.sale')}
                                </button>
                                {hasFeature('wholesalers') && (
                                    <button
                                        type="button"
                                        onClick={() => setBillType('purchase')}
                                        className={`flex-1 py-2.5 md:py-3 px-3 md:px-4 rounded-lg text-sm md:text-base font-bold transition-all flex items-center justify-center gap-2 ${billType === 'purchase'
                                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                            }`}
                                    >
                                        <Package className="h-4 w-4 md:h-5 md:w-5" />
                                        {t('billing.purchase')}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Customer/Wholesaler Section - Clear selection */}
                        <div className="p-3 md:p-6 border-b-2 border-slate-100">
                            {billType === 'sale' ? (
                                <div className="space-y-4 md:space-y-5">
                                    <label className="text-xs md:text-sm font-bold text-slate-800 block uppercase tracking-wide">
                                        {t('billing.select_customer')}
                                    </label>
                                    <div className="flex gap-2 md:gap-3">
                                        {hasFeature('dueCustomers') && (
                                            <button
                                                type="button"
                                                onClick={() => setCustomerType('due_customer')}
                                                className={`flex-1 min-w-[45%] md:min-w-0 p-3 md:p-4 rounded-xl border-3 text-left transition-all ${customerType === 'due_customer'
                                                    ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/20'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 md:gap-3 text-center sm:text-left h-full">
                                                    <div className={`w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-xl flex items-center justify-center ${customerType === 'due_customer'
                                                        ? 'bg-blue-500 text-white shadow-lg'
                                                        : 'bg-slate-100 text-slate-400'
                                                        }`}>
                                                        <Users className="h-5 w-5 md:h-6 md:w-6" />
                                                    </div>
                                                    <div className="flex flex-col justify-center h-full">
                                                        <p className={`font-bold text-sm md:text-base leading-tight break-words whitespace-normal ${customerType === 'due_customer' ? 'text-blue-700' : 'text-slate-700'}`}>
                                                            {t('billing.due_customer')}
                                                        </p>
                                                        <p className={`text-[10px] md:text-xs mt-1 leading-tight break-words whitespace-normal ${customerType === 'due_customer' ? 'text-blue-600' : 'text-slate-500'}`}>
                                                            {t('billing.credit_sale')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        )}
                                        {hasFeature('normalCustomers') && (
                                            <button
                                                type="button"
                                                onClick={() => setCustomerType('normal_customer')}
                                                className={`flex-1 min-w-[45%] md:min-w-0 p-3 md:p-4 rounded-xl border-3 text-left transition-all ${customerType === 'normal_customer'
                                                    ? 'border-green-500 bg-green-50 shadow-lg shadow-green-500/20 ring-2 ring-green-500/20'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 md:gap-3 text-center sm:text-left h-full">
                                                    <div className={`w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-xl flex items-center justify-center ${customerType === 'normal_customer'
                                                        ? 'bg-green-500 text-white shadow-lg'
                                                        : 'bg-slate-100 text-slate-400'
                                                        }`}>
                                                        <IndianRupee className="h-5 w-5 md:h-6 md:w-6" />
                                                    </div>
                                                    <div className="flex flex-col justify-center h-full">
                                                        <p className={`font-bold text-sm md:text-base leading-tight break-words whitespace-normal ${customerType === 'normal_customer' ? 'text-green-700' : 'text-slate-700'}`}>
                                                            {t('billing.normal_customer')}
                                                        </p>
                                                        <p className={`text-[10px] md:text-xs mt-1 leading-tight break-words whitespace-normal ${customerType === 'normal_customer' ? 'text-green-600' : 'text-slate-500'}`}>
                                                            {t('billing.cash_sale')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        )}
                                    </div>

                                    {/* Customer Search - Enhanced visibility */}
                                    {customerType === 'due_customer' && hasFeature('dueCustomers') && (
                                        <div className="pt-2">
                                            <label className="text-xs md:text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-1.5">
                                                <Search className="h-3.5 w-3.5 text-blue-500" />
                                                {t('billing.search_customer')}
                                            </label>
                                            <Combobox
                                                options={customerOptions}
                                                value={selectedEntityId}
                                                onValueChange={handleEntitySelect}
                                                placeholder={t('common.search_placeholder')}
                                                emptyMessage={t('common.search')}
                                            />
                                        </div>
                                    )}

                                    {/* Walk-in Name */}
                                    {customerType === 'normal_customer' && (
                                        <div className="pt-2">
                                            <label className="text-xs md:text-sm font-semibold text-slate-700 mb-2 block">
                                                {t('billing.customer_name_optional')}
                                            </label>
                                            <Input
                                                placeholder={t('billing.walkin_placeholder')}
                                                {...register('entityName')}
                                                className="h-11 md:h-12 text-sm md:text-base border-2 border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 md:space-y-5">
                                    <label className="text-xs md:text-sm font-bold text-slate-800 block uppercase tracking-wide">
                                        {t('billing.select_wholesaler')}
                                    </label>
                                    <div className="relative">
                                        <label className="text-xs md:text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-1.5">
                                            <Search className="h-3.5 w-3.5 text-orange-500" />
                                            {t('billing.search_wholesaler')}
                                        </label>
                                        <Combobox
                                            options={wholesalerOptions}
                                            value={selectedEntityId}
                                            onValueChange={handleEntitySelect}
                                            placeholder={t('common.search_placeholder')}
                                            emptyMessage={t('common.search')}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Amount Section - HIGH VISIBILITY - Most important */}
                        <div className={`p-3 md:p-6 border-b-2 border-slate-100 ${billType === 'sale' ? 'bg-blue-50/50' : 'bg-orange-50/50'}`}>
                            <label className="text-xs md:text-sm font-bold text-slate-800 mb-4 block uppercase tracking-wide">
                                {t('billing.enter_amount')}
                            </label>

                            {/* For Walk-in customers - only show Total Amount */}
                            {billType === 'sale' && customerType === 'normal_customer' ? (
                                <div className="bg-white p-4 md:p-5 rounded-xl border-2 border-green-200 shadow-sm">
                                    <label className="text-xs md:text-sm font-bold text-green-700 mb-2 block flex items-center gap-2">
                                        <IndianRupee className="h-4 w-4" />
                                        {t('billing.total_amount_full')}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-bold text-2xl md:text-3xl">₹</span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="pl-10 md:pl-12 h-14 md:h-16 text-2xl md:text-3xl font-bold border-2 border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50/50"
                                            placeholder="0"
                                            {...register('totalAmount', { valueAsNumber: true })}
                                        />
                                    </div>
                                    {errors.totalAmount && (
                                        <p className="text-xs md:text-sm text-red-600 font-semibold mt-2 flex items-center gap-1">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                            {errors.totalAmount.message}
                                        </p>
                                    )}
                                    <div className="mt-3 p-2 bg-green-100 rounded-lg">
                                        <p className="text-xs md:text-sm text-green-700 font-medium flex items-center gap-2">
                                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs">✓</span>
                                            {t('billing.fully_paid')} - {t('billing.no_dues')}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* For Due customers & Purchases - show both fields */
                                <>
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        {/* Total Amount - Primary */}
                                        <div className="bg-white p-3 md:p-4 rounded-xl border-2 border-slate-200 shadow-sm">
                                            <label className="text-[10px] md:text-xs font-bold text-slate-700 mb-1.5 md:mb-2 block uppercase">
                                                {t('billing.total_bill')}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg md:text-2xl">₹</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    className="pl-8 md:pl-10 h-12 md:h-14 text-xl md:text-2xl font-bold border-2 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                                                    placeholder="0"
                                                    {...register('totalAmount', { valueAsNumber: true })}
                                                />
                                            </div>
                                            {errors.totalAmount && (
                                                <p className="text-[10px] md:text-xs text-red-600 font-semibold mt-1">{errors.totalAmount.message}</p>
                                            )}
                                        </div>

                                        {/* Paid Amount - Success color */}
                                        <div className="bg-white p-3 md:p-4 rounded-xl border-2 border-green-200 shadow-sm">
                                            <label className="text-[10px] md:text-xs font-bold text-green-700 mb-1.5 md:mb-2 block uppercase">
                                                {t('billing.paid_now')}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-green-600 font-bold text-lg md:text-2xl">₹</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    className="pl-8 md:pl-10 h-12 md:h-14 text-xl md:text-2xl font-bold text-green-700 border-2 border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50/50"
                                                    placeholder="0"
                                                    {...register('paidAmount', { valueAsNumber: true })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Due Amount Display - Warning/Alert style */}
                                    {dueAmount > 0 && (
                                        <div className="mt-4 p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center">
                                                        <IndianRupee className="h-4 w-4 md:h-5 md:w-5 text-white" />
                                                    </div>
                                                    <span className="text-white font-bold text-sm md:text-base">{t('billing.balance_due')}</span>
                                                </div>
                                                <span className="text-2xl md:text-3xl font-bold text-white">₹{dueAmount.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Fully Paid indicator - no excess */}
                                    {dueAmount <= 0 && excessPayment === 0 && totalAmount > 0 && (
                                        <div className="mt-4 p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                                                        ✓
                                                    </div>
                                                    <span className="text-white font-bold text-sm md:text-base">{t('billing.fully_paid')}</span>
                                                </div>
                                                <span className="text-xl md:text-2xl font-bold text-white">{t('billing.no_dues')}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Excess Payment - Reduces existing outstanding */}
                                    {excessPayment > 0 && totalAmount > 0 && (
                                        <div className="mt-4 space-y-3">
                                            {/* Fully Paid indicator */}
                                            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                                                            ✓
                                                        </div>
                                                        <span className="text-white font-bold text-sm">{t('billing.bill_fully_paid')}</span>
                                                    </div>
                                                    <span className="text-lg md:text-xl font-bold text-white">₹{totalAmount.toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>

                                            {/* Excess payment reduces outstanding */}
                                            <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center">
                                                                <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-white" />
                                                            </div>
                                                            <span className="text-white font-bold text-sm md:text-base">{t('billing.extra_payment')}</span>
                                                        </div>
                                                        <span className="text-2xl md:text-3xl font-bold text-white">₹{excessPayment.toLocaleString('en-IN')}</span>
                                                    </div>

                                                    {/* Show outstanding reduction if entity is selected and has dues */}
                                                    {selectedEntity && entityOutstandingDue > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-white/20">
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="text-white/80">{t('billing.current_outstanding')}:</span>
                                                                <span className="text-white font-semibold">₹{entityOutstandingDue.toLocaleString('en-IN')}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-sm mt-1">
                                                                <span className="text-white/80">{t('billing.after_payment')}:</span>
                                                                <span className="text-white font-bold">₹{newOutstandingDue.toLocaleString('en-IN')}</span>
                                                            </div>
                                                            {excessPayment > entityOutstandingDue && (
                                                                <div className="mt-2 p-2 bg-yellow-400/20 rounded-lg">
                                                                    <p className="text-yellow-200 text-xs font-medium">
                                                                        ⚠️ {t('billing.advance_balance_warning', { amount: (excessPayment - entityOutstandingDue).toLocaleString('en-IN') })}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Show message when no entity selected */}
                                                    {!selectedEntity && (
                                                        <p className="text-white/80 text-xs mt-2">
                                                            {t('billing.extra_amount_desc', { type: billType === 'purchase' ? t('common.wholesalers') : t('common.customers') })}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Payment Method - Clear pills - Only show if paid amount > 0 */}
                        {effectivePaidAmount > 0 && (
                            <div className="p-3 md:p-6 border-b-2 border-slate-100">
                                <label className="text-xs md:text-sm font-bold text-slate-800 mb-3 block uppercase tracking-wide">
                                    {t('billing.payment_method')}
                                </label>
                                <div className="flex gap-2 md:gap-3">
                                    {[
                                        { value: 'cash', label: t('billing.cash'), icon: <Banknote className="h-5 w-5 md:h-6 md:w-6" />, color: 'green' },
                                        { value: 'card', label: t('billing.card'), icon: <CreditCard className="h-5 w-5 md:h-6 md:w-6" />, color: 'blue' },
                                        { value: 'online', label: t('billing.upi'), icon: <Smartphone className="h-5 w-5 md:h-6 md:w-6" />, color: 'purple' },
                                    ].map((method) => (
                                        <button
                                            key={method.value}
                                            type="button"
                                            onClick={() => setValue('paymentMethod', method.value as any)}
                                            className={`flex-1 py-3 md:py-4 px-3 md:px-4 rounded-xl text-sm md:text-base font-bold transition-all flex flex-col items-center gap-2 ${watch('paymentMethod') === method.value
                                                ? method.color === 'green'
                                                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 ring-2 ring-green-500/20'
                                                    : method.color === 'blue'
                                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/20'
                                                        : 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-500/20'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-slate-200'
                                                }`}
                                        >
                                            {method.icon}
                                            {method.label}
                                        </button>
                                    ))}
                                </div>
                                {errors.paymentMethod && (
                                    <p className="text-xs text-red-500 mt-2 font-medium">{errors.paymentMethod.message}</p>
                                )}
                            </div>
                        )}

                        {/* Notes - Subtle */}
                        <div className="p-3 md:p-6 border-b-2 border-slate-100 bg-slate-50">
                            <label className="text-xs md:text-sm font-semibold text-slate-600 mb-2 block">
                                {t('billing.notes')}
                            </label>
                            <Input
                                placeholder={t('billing.notes_placeholder')}
                                {...register('notes')}
                                className="h-11 md:h-12 text-sm md:text-base border-2 border-slate-200 focus:border-slate-400 bg-white"
                            />
                        </div>

                        {/* Summary & Submit - High visibility footer */}
                        <div className={`p-4 md:p-6 ${billType === 'sale' ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-orange-500 to-orange-600'}`}>
                            {/* Quick Summary */}
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/20">
                                <div>
                                    <p className="text-xs md:text-sm text-white/80 font-medium">{t('billing.total_bill')}</p>
                                    <p className="text-2xl md:text-3xl font-bold text-white">₹{totalAmount.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs md:text-sm text-white/80 font-medium">{t('billing.status')}</p>
                                    {dueAmount <= 0 ? (
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-400 text-green-900 text-sm md:text-base font-bold shadow-lg">
                                            ✓ {t('billing.paid')}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-orange-300 text-orange-900 text-sm md:text-base font-bold shadow-lg">
                                            {t('billing.due', { amount: dueAmount.toLocaleString('en-IN') })}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button - Maximum visibility */}
                            <Button
                                type="submit"
                                className="w-full h-12 md:h-14 text-base md:text-lg font-bold rounded-xl bg-white hover:bg-slate-100 text-slate-900 shadow-xl transition-all active:scale-[0.99]"
                                disabled={createBillMutation.isPending}
                            >
                                {createBillMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 md:h-6 md:w-6 animate-spin" />
                                        {t('billing.processing')}
                                    </>
                                ) : (
                                    <>
                                        <Receipt className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                                        {billType === 'sale' ? t('billing.create_sale_bill') : t('billing.create_purchase_bill')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

