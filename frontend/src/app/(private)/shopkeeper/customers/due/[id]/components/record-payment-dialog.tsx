'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IndianRupee, Loader2, ArrowRight, Banknote, CreditCard, Smartphone, TrendingDown, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import api from '@/config/axios';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Customer {
    _id: string;
    name: string;
    outstandingDue: number;
}

interface RecordPaymentDialogProps {
    customer: Customer;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function RecordPaymentDialog({ customer }: RecordPaymentDialogProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online'>('cash');
    const [amount, setAmount] = useState<string>('');
    const [notes, setNotes] = useState('');

    const parsedAmount = parseFloat(amount) || 0;

    // Calculate what happens after payment
    const newOutstandingDue = customer.outstandingDue - parsedAmount;
    const isAdvancePayment = newOutstandingDue < 0;

    const paymentMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/payments', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer'] });
            queryClient.invalidateQueries({ queryKey: ['customer-bills'] });
            queryClient.invalidateQueries({ queryKey: ['customer-payments'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['due-customers-list'] });
            setIsOpen(false);
            setAmount('');
            setNotes('');
            toast.success(t('wholesaler_payments.messages.success'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('wholesaler_payments.messages.error'));
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!parsedAmount || parsedAmount <= 0) {
            toast.error(t('wholesaler_payments.messages.invalid_amount'));
            return;
        }

        paymentMutation.mutate({
            entityType: 'customer',
            entityId: customer._id,
            entityName: customer.name,
            amount: parsedAmount,
            paymentMethod,
            notes: notes || '',
        });
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setAmount('');
            setNotes('');
            setPaymentMethod('cash');
        }
    };

    const paymentMethods = [
        { value: 'cash' as const, label: t('dashboard.cash'), icon: Banknote, color: 'green' },
        { value: 'card' as const, label: t('dashboard.card'), icon: CreditCard, color: 'blue' },
        { value: 'online' as const, label: 'UPI', icon: Smartphone, color: 'purple' },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 h-8 md:h-9 text-xs md:text-sm px-2 md:px-4">
                    <IndianRupee className="mr-1 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">{t('wholesaler_payments.record_payment')}</span>
                    <span className="sm:hidden">{t('wholesaler_payments.record_payment_short')}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-0 gap-0 max-h-[85vh] flex flex-col" showCloseButton={false}>
                {/* Header - Sticky */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 md:p-5 flex-shrink-0 relative">
                    {/* Close button */}
                    <button
                        onClick={() => handleOpenChange(false)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                    >
                        ✕
                    </button>

                    <DialogHeader>
                        <DialogTitle className="text-white text-base md:text-lg font-bold pr-8">
                            {t('wholesaler_payments.record_payment')}
                        </DialogTitle>
                        <p className="text-green-100 text-xs md:text-sm mt-0.5">{t('wholesaler_payments.detail.pay_to', { name: customer.name })}</p>
                    </DialogHeader>

                    {/* Outstanding Due Badge */}
                    <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-lg p-2.5 md:p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <Wallet className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
                                </div>
                                <span className="text-white/80 text-xs md:text-sm font-medium">{t('wholesaler_payments.stats.outstanding')}</span>
                            </div>
                            <span className={`text-lg md:text-xl font-bold ${customer.outstandingDue > 0 ? 'text-white' : 'text-green-200'}`}>
                                {formatCurrency(customer.outstandingDue)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-4 md:p-5 space-y-3 md:space-y-4">
                        {/* Amount Input */}
                        <div className="space-y-1.5">
                            <Label htmlFor="amount" className="text-xs md:text-sm font-semibold text-slate-700">
                                {t('wholesaler_payments.form.amount')} *
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-green-600 font-bold text-lg md:text-xl">₹</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-8 md:pl-10 h-11 md:h-12 text-lg md:text-xl font-bold border-2 border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                                    placeholder="0"
                                    required
                                />
                            </div>
                        </div>

                        {/* Payment Effect Display */}
                        {parsedAmount > 0 && (
                            <div className="space-y-2">
                                {/* Normal Payment */}
                                {!isAdvancePayment && parsedAmount <= customer.outstandingDue && (
                                    <div className="p-2.5 md:p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <TrendingDown className="h-3.5 w-3.5 text-green-600" />
                                                <span className="text-xs md:text-sm font-medium text-green-700">{t('wholesaler_payments.detail.after_payment')}</span>
                                            </div>
                                            <span className="text-base md:text-lg font-bold text-green-700">
                                                {formatCurrency(newOutstandingDue)}
                                            </span>
                                        </div>
                                        {newOutstandingDue === 0 && (
                                            <p className="text-[10px] md:text-xs text-green-600 mt-1 flex items-center gap-1">
                                                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-500 text-white text-[8px]">✓</span>
                                                {t('wholesaler_payments.detail.all_dues_cleared')}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Advance Payment */}
                                {isAdvancePayment && (
                                    <div className="space-y-2">
                                        {customer.outstandingDue > 0 && (
                                            <div className="p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white text-[10px] font-bold">✓</span>
                                                        <span className="text-xs md:text-sm font-medium text-green-700">{t('wholesaler_payments.detail.dues_cleared')}</span>
                                                    </div>
                                                    <span className="text-sm md:text-base font-bold text-green-700">
                                                        {formatCurrency(customer.outstandingDue)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-2.5 md:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
                                                    <span className="text-xs md:text-sm font-medium text-blue-700">{t('wholesaler_payments.detail.advance')}</span>
                                                </div>
                                                <span className="text-base md:text-lg font-bold text-blue-700">
                                                    {formatCurrency(Math.abs(newOutstandingDue))}
                                                </span>
                                            </div>
                                            <p className="text-[10px] md:text-xs text-blue-600 mt-1">
                                                {t('wholesaler_payments.detail.advance_desc').replace('മൊത്തക്കച്ചവടക്കാരനിൽ', t('common.customer'))}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Payment Method Selection */}
                        <div className="space-y-1.5">
                            <Label className="text-xs md:text-sm font-semibold text-slate-700">{t('wholesaler_payments.form.method')} *</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {paymentMethods.map((method) => {
                                    const Icon = method.icon;
                                    const isSelected = paymentMethod === method.value;
                                    return (
                                        <button
                                            key={method.value}
                                            type="button"
                                            onClick={() => setPaymentMethod(method.value)}
                                            className={`py-2 md:py-2.5 px-2 rounded-lg text-[10px] md:text-xs font-semibold transition-all flex flex-col items-center gap-1 ${isSelected
                                                ? method.color === 'green'
                                                    ? 'bg-green-500 text-white shadow-md'
                                                    : method.color === 'blue'
                                                        ? 'bg-blue-500 text-white shadow-md'
                                                        : 'bg-purple-500 text-white shadow-md'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                                                }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {method.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <Label htmlFor="notes" className="text-xs md:text-sm font-medium text-slate-600">
                                {t('wholesaler_payments.form.notes')}
                            </Label>
                            <Input
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={t('wholesaler_payments.form.notes_placeholder')}
                                className="h-9 md:h-10 text-sm border-2 border-slate-200 focus:border-slate-400"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                className="flex-1 h-10 md:h-11 text-sm font-semibold border-2"
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 h-10 md:h-11 text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25"
                                disabled={paymentMutation.isPending || !parsedAmount}
                            >
                                {paymentMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                        {t('wholesaler_payments.detail.processing')}
                                    </>
                                ) : (
                                    <>
                                        <IndianRupee className="mr-1.5 h-4 w-4" />
                                        {t('wholesaler_payments.record_payment_short')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
