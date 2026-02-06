'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IndianRupee, Loader2, ArrowRight, Banknote, CreditCard, Smartphone, TrendingDown, Wallet, Search } from 'lucide-react';
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
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import api from '@/config/axios';
import { toast } from 'sonner';

interface Wholesaler {
    _id: string;
    name: string;
    outstandingDue: number;
}

interface RecordPaymentDialogProps {
    wholesalers: Wholesaler[];
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function RecordPaymentDialog({ wholesalers }: RecordPaymentDialogProps) {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedWholesalerId, setSelectedWholesalerId] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online'>('cash');
    const [amount, setAmount] = useState<string>('');
    const [notes, setNotes] = useState('');

    const selectedWholesaler = useMemo(() => {
        return wholesalers.find(w => w._id === selectedWholesalerId);
    }, [wholesalers, selectedWholesalerId]);

    const parsedAmount = parseFloat(amount) || 0;
    const outstandingDue = selectedWholesaler?.outstandingDue || 0;

    // Calculate what happens after payment
    const newOutstandingDue = outstandingDue - parsedAmount;
    const isAdvancePayment = newOutstandingDue < 0;

    // Transform wholesalers to combobox options - show all wholesalers
    const wholesalerOptions: ComboboxOption[] = useMemo(() => {
        return wholesalers.map((w) => ({
            value: w._id,
            label: w.name,
            subLabel: w.outstandingDue > 0
                ? `Due: ${formatCurrency(w.outstandingDue)}`
                : w.outstandingDue < 0
                    ? `Advance: ${formatCurrency(Math.abs(w.outstandingDue))}`
                    : 'No dues',
        }));
    }, [wholesalers]);

    const paymentMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/payments', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wholesaler-payments'] });
            queryClient.invalidateQueries({ queryKey: ['wholesalers-with-dues'] });
            queryClient.invalidateQueries({ queryKey: ['wholesalers'] });
            queryClient.invalidateQueries({ queryKey: ['wholesalers-list'] });
            queryClient.invalidateQueries({ queryKey: ['wholesaler-stats'] });
            handleOpenChange(false);
            toast.success('Payment recorded successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to record payment');
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedWholesaler) {
            toast.error('Please select a wholesaler');
            return;
        }

        if (!parsedAmount || parsedAmount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        paymentMutation.mutate({
            entityType: 'wholesaler',
            entityId: selectedWholesalerId,
            entityName: selectedWholesaler.name,
            amount: parsedAmount,
            paymentMethod,
            notes: notes || '',
        });
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setSelectedWholesalerId('');
            setAmount('');
            setNotes('');
            setPaymentMethod('cash');
        }
    };

    const handleWholesalerSelect = (value: string) => {
        setSelectedWholesalerId(value);
    };

    const paymentMethods = [
        { value: 'cash' as const, label: 'Cash', icon: Banknote, color: 'green' },
        { value: 'card' as const, label: 'Card', icon: CreditCard, color: 'blue' },
        { value: 'online' as const, label: 'UPI', icon: Smartphone, color: 'purple' },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 h-8 md:h-9 text-xs md:text-sm px-2 md:px-4">
                    <IndianRupee className="mr-1 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Record Payment</span>
                    <span className="sm:hidden">Pay</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-0 gap-0 max-h-[85vh] flex flex-col" showCloseButton={false}>
                {/* Header - Sticky */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 md:p-5 flex-shrink-0 relative">
                    {/* Close button */}
                    <button
                        onClick={() => handleOpenChange(false)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                    >
                        ✕
                    </button>

                    <DialogHeader>
                        <DialogTitle className="text-white text-base md:text-lg font-bold pr-8">
                            Record Payment to Wholesaler
                        </DialogTitle>
                        <p className="text-orange-100 text-xs md:text-sm mt-0.5">Pay outstanding dues or create advance</p>
                    </DialogHeader>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-4 md:p-5 space-y-3 md:space-y-4">
                        {/* Wholesaler Selection */}
                        <div className="space-y-1.5">
                            <Label className="text-xs md:text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                <Search className="h-3 w-3 text-orange-500" />
                                Select Wholesaler *
                            </Label>
                            <Combobox
                                options={wholesalerOptions}
                                value={selectedWholesalerId}
                                onValueChange={handleWholesalerSelect}
                                placeholder="Search wholesaler..."
                                emptyMessage="No wholesalers found"
                            />
                        </div>

                        {/* Outstanding Due Badge - Show when wholesaler is selected */}
                        {selectedWholesaler && (
                            <div className={`p-2.5 md:p-3 rounded-lg ${outstandingDue > 0
                                    ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'
                                    : outstandingDue < 0
                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'
                                        : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Wallet className={`h-3.5 w-3.5 ${outstandingDue > 0 ? 'text-red-600' : outstandingDue < 0 ? 'text-blue-600' : 'text-green-600'
                                            }`} />
                                        <span className={`text-xs md:text-sm font-medium ${outstandingDue > 0 ? 'text-red-700' : outstandingDue < 0 ? 'text-blue-700' : 'text-green-700'
                                            }`}>
                                            {outstandingDue > 0 ? 'Outstanding' : outstandingDue < 0 ? 'Advance' : 'No Dues'}
                                        </span>
                                    </div>
                                    <span className={`text-base md:text-lg font-bold ${outstandingDue > 0 ? 'text-red-700' : outstandingDue < 0 ? 'text-blue-700' : 'text-green-700'
                                        }`}>
                                        {formatCurrency(Math.abs(outstandingDue))}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Amount Input */}
                        <div className="space-y-1.5">
                            <Label htmlFor="amount" className="text-xs md:text-sm font-semibold text-slate-700">
                                Payment Amount *
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-orange-600 font-bold text-lg md:text-xl">₹</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-8 md:pl-10 h-11 md:h-12 text-lg md:text-xl font-bold border-2 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                                    placeholder="0"
                                    required
                                />
                            </div>
                        </div>

                        {/* Payment Effect Display */}
                        {parsedAmount > 0 && selectedWholesaler && (
                            <div className="space-y-2">
                                {/* Normal Payment */}
                                {!isAdvancePayment && parsedAmount <= outstandingDue && (
                                    <div className="p-2.5 md:p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <TrendingDown className="h-3.5 w-3.5 text-green-600" />
                                                <span className="text-xs md:text-sm font-medium text-green-700">After Payment</span>
                                            </div>
                                            <span className="text-base md:text-lg font-bold text-green-700">
                                                {formatCurrency(newOutstandingDue)}
                                            </span>
                                        </div>
                                        {newOutstandingDue === 0 && (
                                            <p className="text-[10px] md:text-xs text-green-600 mt-1 flex items-center gap-1">
                                                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-500 text-white text-[8px]">✓</span>
                                                All dues cleared!
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Advance Payment */}
                                {isAdvancePayment && (
                                    <div className="space-y-2">
                                        {outstandingDue > 0 && (
                                            <div className="p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white text-[10px] font-bold">✓</span>
                                                        <span className="text-xs md:text-sm font-medium text-green-700">Dues Cleared</span>
                                                    </div>
                                                    <span className="text-sm md:text-base font-bold text-green-700">
                                                        {formatCurrency(outstandingDue)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-2.5 md:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
                                                    <span className="text-xs md:text-sm font-medium text-blue-700">Advance</span>
                                                </div>
                                                <span className="text-base md:text-lg font-bold text-blue-700">
                                                    {formatCurrency(Math.abs(newOutstandingDue))}
                                                </span>
                                            </div>
                                            <p className="text-[10px] md:text-xs text-blue-600 mt-1">
                                                You will have advance credit with this wholesaler
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Payment Method Selection */}
                        <div className="space-y-1.5">
                            <Label className="text-xs md:text-sm font-semibold text-slate-700">Payment Method *</Label>
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
                                Notes (Optional)
                            </Label>
                            <Input
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any notes..."
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
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 h-10 md:h-11 text-sm font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25"
                                disabled={paymentMutation.isPending || !parsedAmount || !selectedWholesalerId}
                            >
                                {paymentMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <IndianRupee className="mr-1.5 h-4 w-4" />
                                        Pay
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
