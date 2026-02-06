'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    IndianRupee, CreditCard, Banknote, Smartphone,
    User, Package, CheckCircle, Plus
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import api from '@/config/axios';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/use-media-query';

interface Customer {
    _id: string;
    name: string;
    outstandingDue: number;
}

const paymentMethodConfig: Record<string, { color: string; bgColor: string; iconSmall: React.ReactNode; labelKey: string }> = {
    cash: {
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        iconSmall: <Banknote className="h-3.5 w-3.5" />,
        labelKey: 'wholesaler_payments.filters.cash'
    },
    card: {
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        iconSmall: <CreditCard className="h-3.5 w-3.5" />,
        labelKey: 'wholesaler_payments.filters.card'
    },
    online: {
        color: 'text-purple-700',
        bgColor: 'bg-purple-100',
        iconSmall: <Smartphone className="h-3.5 w-3.5" />,
        labelKey: 'wholesaler_payments.filters.upi'
    },
};

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function RecordCustomerPaymentDialog() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('cash');

    // Fetch customers with outstanding dues
    const { data: customersResponse } = useQuery({
        queryKey: ['customers-with-dues'],
        queryFn: async () => {
            // For due customers, we want those with outstanding dues
            const response = await api.get('/customers?type=due&limit=1000');
            return response.data;
        },
    });

    const customers = (customersResponse?.data || []) as Customer[];

    const customerOptions: ComboboxOption[] = useMemo(() => {
        return customers.map((c) => ({
            value: c._id,
            label: c.name,
            subLabel: c.outstandingDue > 0 ? `${t('wholesaler_payments.stats.due')}: ${formatCurrency(c.outstandingDue)}` : undefined,
        }));
    }, [customers, t]);

    const paymentMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/payments', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['due-customer-payments'] });
            queryClient.invalidateQueries({ queryKey: ['due-customers'] });
            queryClient.invalidateQueries({ queryKey: ['due-customers-stats'] });
            queryClient.invalidateQueries({ queryKey: ['customers-with-dues'] });
            setIsOpen(false);
            setSelectedCustomer('');
            setPaymentMethod('cash');
            toast.success(t('wholesaler_payments.messages.success'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('wholesaler_payments.messages.error'));
        },
    });

    const handlePayment = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const customer = customers?.find(c => c._id === selectedCustomer);

        if (!customer) {
            toast.error(t('wholesaler_payments.messages.select_wholesaler').replace('wholesaler', 'customer'));
            return;
        }

        const amount = parseFloat(formData.get('amount') as string);
        if (!amount || amount <= 0) {
            toast.error(t('wholesaler_payments.messages.invalid_amount'));
            return;
        }

        paymentMutation.mutate({
            entityType: 'customer',
            entityId: selectedCustomer,
            entityName: customer.name,
            amount,
            paymentMethod: paymentMethod,
            notes: formData.get('notes') || '',
        });
    };

    const formContent = (
        <form onSubmit={handlePayment} className="space-y-4 mt-4">
            <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    {t('common.customer')} <span className="text-red-500">*</span>
                </Label>
                <Combobox
                    options={customerOptions}
                    value={selectedCustomer}
                    onValueChange={(val) => setSelectedCustomer(val)}
                    placeholder={t('wholesaler_payments.messages.select_wholesaler').replace('wholesaler', 'customer')}
                    emptyMessage={t('wholesaler_payments.messages.no_wholesaler_found').replace('wholesaler', 'customer')}
                    className="w-full"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="amount" className="flex items-center gap-2 text-sm">
                    <IndianRupee className="h-4 w-4 text-gray-400" />
                    {t('wholesaler_payments.form.amount')} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                    <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        className="pl-8 h-10 md:h-11 text-lg font-semibold"
                        placeholder="0.00"
                        required
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    {t('wholesaler_payments.form.method')} <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                    {Object.entries(paymentMethodConfig).map(([key, config]) => (
                        <Button
                            key={key}
                            type="button"
                            variant={paymentMethod === key ? 'default' : 'outline'}
                            className={`h-9 md:h-10 text-xs md:text-sm ${paymentMethod === key
                                ? `${config.bgColor} ${config.color} border-2 border-current hover:opacity-90`
                                : ''
                                }`}
                            onClick={() => setPaymentMethod(key)}
                        >
                            {config.iconSmall}
                            <span className="ml-1.5">{t(config.labelKey)}</span>
                        </Button>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm">{t('wholesaler_payments.form.notes')}</Label>
                <Input id="notes" name="notes" placeholder={t('wholesaler_payments.form.notes_placeholder')} className="h-10 md:h-11" />
            </div>
            <div className="flex gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 h-10"
                >
                    {t('common.cancel')}
                </Button>
                <Button
                    type="submit"
                    className="flex-1 h-10 bg-gradient-to-r from-green-600 to-emerald-600"
                    disabled={paymentMutation.isPending}
                >
                    {paymentMutation.isPending ? (
                        <span className="flex items-center gap-2">
                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            <span className="hidden sm:inline">{t('wholesaler_payments.form.recording')}</span>
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>{t('wholesaler_payments.record_payment')}</span>
                        </span>
                    )}
                </Button>
            </div>
        </form>
    );

    const trigger = (
        <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25 h-10 px-4">
            <Plus className="mr-2 h-4 w-4" />
            <span>{t('wholesaler_payments.record_payment')}</span>
        </Button>
    );

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 md:p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                                <IndianRupee className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg md:text-xl">{t('wholesaler_payments.record_payment')}</DialogTitle>
                                <p className="text-xs md:text-sm text-gray-500 mt-0.5">{t('wholesaler_payments.record_desc')}</p>
                            </div>
                        </div>
                    </DialogHeader>
                    {formContent}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                {trigger}
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[20px] max-h-[90vh] overflow-y-auto p-6">
                <SheetHeader className="text-left">
                    <SheetTitle>{t('wholesaler_payments.record_payment')}</SheetTitle>
                </SheetHeader>
                {formContent}
            </SheetContent>
        </Sheet>
    );
}
