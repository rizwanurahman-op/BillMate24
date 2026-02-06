'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Receipt, Banknote, CreditCard, Smartphone, AlertCircle } from 'lucide-react';
import api from '@/config/axios';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const updateBillSchema = z.object({
    totalAmount: z.number().min(0.01, 'Total amount must be greater than 0'),
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

type UpdateBillInput = z.infer<typeof updateBillSchema>;

interface EditBillModalProps {
    bill: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditBillModal({ bill, open, onOpenChange, onSuccess }: EditBillModalProps) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<UpdateBillInput>({
        resolver: zodResolver(updateBillSchema),
    });

    useEffect(() => {
        if (bill) {
            reset({
                totalAmount: bill.totalAmount,
                paidAmount: bill.paidAmount,
                paymentMethod: bill.paymentMethod,
                notes: bill.notes || '',
            });
        }
    }, [bill, reset]);

    const onSubmit = async (data: UpdateBillInput) => {
        if (!bill) return;
        setIsLoading(true);
        const payload: any = { ...data };
        if (data.paidAmount === 0) {
            delete payload.paymentMethod;
        }

        try {
            await api.patch(`/bills/${bill._id}`, payload);
            toast.success(t('billing.bill_success'));
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('billing.bill_error'));
        } finally {
            setIsLoading(false);
        }
    };

    const totalAmount = watch('totalAmount') || 0;
    const paidAmount = watch('paidAmount') || 0;
    const dueAmount = Math.max(0, totalAmount - paidAmount);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-0">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 md:p-6 rounded-t-lg">
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center gap-2 text-white/80">
                            <Receipt className="h-4 w-4 md:h-5 md:w-5" />
                            <span className="text-xs md:text-sm font-semibold uppercase tracking-wider">
                                {t('history.edit_bill')}
                            </span>
                        </div>
                        <DialogTitle className="text-xl md:text-2xl font-bold text-white">
                            {t('billing.transaction_type')}
                        </DialogTitle>
                        <DialogDescription className="text-white/90 text-xs md:text-sm">
                            {bill?.billType === 'purchase'
                                ? t('billing.update_purchase_desc')
                                : t('billing.update_sale_desc')}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6 space-y-4 md:space-y-5">
                    {/* Amount Section */}
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-3 md:p-4 rounded-xl border border-slate-200 space-y-3 md:space-y-4">
                        {/* Total Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="totalAmount" className="text-slate-700 font-semibold text-sm md:text-base flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                {t('billing.total_bill')}
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm md:text-base">₹</span>
                                <Input
                                    id="totalAmount"
                                    type="number"
                                    step="0.01"
                                    className="pl-7 md:pl-8 h-10 md:h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-bold text-base md:text-lg bg-white"
                                    {...register('totalAmount', { valueAsNumber: true })}
                                />
                            </div>
                            {errors.totalAmount && (
                                <div className="flex items-center gap-1 text-xs text-red-600">
                                    <AlertCircle className="h-3 w-3" />
                                    <p>{errors.totalAmount.message}</p>
                                </div>
                            )}
                        </div>

                        {/* Paid Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="paidAmount" className="text-slate-700 font-semibold text-sm md:text-base flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                {t('billing.paid_now')}
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-green-500 text-sm md:text-base">₹</span>
                                <Input
                                    id="paidAmount"
                                    type="number"
                                    step="0.01"
                                    className="pl-7 md:pl-8 h-10 md:h-12 border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 font-bold text-base md:text-lg text-green-700 bg-white"
                                    {...register('paidAmount', { valueAsNumber: true })}
                                />
                            </div>
                            {errors.paidAmount && (
                                <div className="flex items-center gap-1 text-xs text-red-600">
                                    <AlertCircle className="h-3 w-3" />
                                    <p>{errors.paidAmount.message}</p>
                                </div>
                            )}
                        </div>

                        {/* Balance Due Display */}
                        <div className="flex items-center justify-between p-3 md:p-4 bg-white rounded-lg border-2 border-dashed border-slate-200 shadow-sm">
                            <span className="text-xs md:text-sm font-semibold text-slate-600">{t('billing.balance_due')}:</span>
                            <span className={`font-bold text-base md:text-lg ${dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ₹{dueAmount.toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>

                    {/* Payment Method Section */}
                    {paidAmount > 0 && (
                        <div className="space-y-3">
                            <Label className="text-slate-700 font-semibold text-sm md:text-base flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                                {t('billing.payment_method')}
                            </Label>
                            <div className="grid grid-cols-3 gap-2 md:gap-3">
                                {[
                                    { value: 'cash', label: t('billing.cash'), icon: Banknote, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300', ring: 'ring-green-500/30' },
                                    { value: 'card', label: t('billing.card'), icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300', ring: 'ring-blue-500/30' },
                                    { value: 'online', label: t('billing.upi'), icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-300', ring: 'ring-purple-500/30' },
                                ].map((method) => {
                                    const isSelected = watch('paymentMethod') === method.value;
                                    return (
                                        <button
                                            key={method.value}
                                            type="button"
                                            onClick={() => setValue('paymentMethod', method.value as any)}
                                            className={`py-2.5 md:py-3 px-2 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${isSelected
                                                    ? `${method.border} ${method.bg} shadow-md ring-2 ${method.ring}`
                                                    : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-sm'
                                                }`}
                                        >
                                            <method.icon className={`h-4 w-4 md:h-5 md:w-5 ${isSelected ? method.color : 'text-slate-400'}`} />
                                            <span className={`text-[10px] md:text-xs font-bold ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                                                {method.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.paymentMethod && (
                                <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                                    <AlertCircle className="h-3 w-3" />
                                    <p className="font-medium">{errors.paymentMethod.message}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notes Section */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-slate-700 font-semibold text-sm md:text-base">
                            {t('billing.notes')}
                        </Label>
                        <Input
                            id="notes"
                            placeholder={t('billing.notes_placeholder')}
                            className="h-10 md:h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm md:text-base"
                            {...register('notes')}
                        />
                    </div>

                    {/* Footer Buttons */}
                    <DialogFooter className="pt-2 gap-2 flex-col sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-10 md:h-11 font-semibold border-2 hover:bg-slate-50 text-sm md:text-base"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 sm:flex-[2] h-10 md:h-11 font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 text-sm md:text-base"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin mr-2" />
                                    {t('billing.processing')}
                                </>
                            ) : (
                                t('common.save_changes')
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
