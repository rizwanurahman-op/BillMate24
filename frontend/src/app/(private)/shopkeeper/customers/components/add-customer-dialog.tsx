'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, IndianRupee, User, Phone, MapPin, MessageCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetDescription,
} from '@/components/ui/sheet';
import api from '@/config/axios';
import { toast } from 'sonner';
import { customerSchema } from '@/schemas/customer.schema';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useTranslation } from 'react-i18next';

interface AddCustomerDialogProps {
    customerType: 'due' | 'normal';
}

interface CustomerFormProps {
    customerType: 'due' | 'normal';
    onSuccess: () => void;
    onCancel: () => void;
}

function CustomerForm({
    customerType,
    onSuccess,
    onCancel,
}: CustomerFormProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [balanceType, setBalanceType] = useState<'due' | 'advance'>('due');

    // Mode: 'detailed' shows sales/payments, 'simple' shows net balance
    const [useSimpleMode, setUseSimpleMode] = useState(true);

    // Detailed mode fields
    const [openingSales, setOpeningSales] = useState("");
    const [openingPayments, setOpeningPayments] = useState("");

    // Simple mode fields (only one should be filled)
    const [amountTheyOwe, setAmountTheyOwe] = useState(""); // Customer owes shopkeeper (due)
    const [amountIOwe, setAmountIOwe] = useState(""); // Shopkeeper owes customer (advance)

    // Calculate net balance for preview
    const salesNum = parseFloat(openingSales) || 0;
    const paymentsNum = parseFloat(openingPayments) || 0;
    const detailedBalance = salesNum - paymentsNum;

    const theyOweNum = parseFloat(amountTheyOwe) || 0;
    const iOweNum = parseFloat(amountIOwe) || 0;
    const simpleBalance = theyOweNum - iOweNum; // Positive means customer owes, negative means advance

    const openingBalance = useSimpleMode ? simpleBalance : detailedBalance;

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/customers', {
                ...data,
                type: customerType,
            });
            return response.data;
        },
        onSuccess: () => {
            if (customerType === 'due') {
                queryClient.invalidateQueries({ queryKey: ['due-customers'] });
                queryClient.invalidateQueries({
                    queryKey: ['due-customers-stats'],
                });
            } else {
                queryClient.invalidateQueries({ queryKey: ['normal-customers'] });
                queryClient.invalidateQueries({
                    queryKey: ['normal-customers-stats'],
                });
            }
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            onSuccess();
            toast.success(t('customer_dialog.success_add'));
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.message || t('billing.bill_error'),
            );
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const rawData: any = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            whatsappNumber: formData.get('whatsappNumber'),
            address: formData.get('address'),
            place: formData.get('place'),
            type: customerType,
        };

        // Add opening balance based on mode (only for due customers)
        if (customerType === 'due') {
            if (useSimpleMode) {
                // Simple mode: convert to openingSales/openingPayments
                if (theyOweNum > 0) {
                    rawData.openingSales = theyOweNum;
                    rawData.openingPayments = 0;
                } else if (iOweNum > 0) {
                    rawData.openingSales = 0;
                    rawData.openingPayments = iOweNum;
                } else {
                    // No opening balance entered
                    rawData.openingSales = 0;
                    rawData.openingPayments = 0;
                }
            } else {
                // Detailed mode: send openingSales and openingPayments directly (always send, even if 0)
                rawData.openingSales = salesNum || 0;
                rawData.openingPayments = paymentsNum || 0;
            }
        }

        const validation = customerSchema.safeParse(rawData);

        if (!validation.success) {
            toast.error(validation.error.issues[0].message);
            return;
        }

        createMutation.mutate(validation.data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 mt-4 pb-4 md:pb-0">
            <div className="space-y-2">
                <Label htmlFor="name" className="text-sm md:text-base">
                    {t('customer_dialog.name')} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="name"
                        name="name"
                        placeholder={t('wholesalers_list.dialogs.name_placeholder')}
                        required
                        autoComplete="name"
                        className="pl-10 h-10 md:h-11 text-base md:text-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm md:text-base">
                        {t('wholesalers_list.dialogs.phone')} {customerType === 'due' && <span className="text-red-500">*</span>}
                    </Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="+91"
                            required={customerType === 'due'}
                            className="pl-10 h-10 md:h-11 text-base md:text-sm"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="whatsappNumber" className="text-sm md:text-base">{t('wholesalers_list.dialogs.whatsapp')}</Label>
                    <div className="relative">
                        <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="whatsappNumber"
                            name="whatsappNumber"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="+91"
                            className="pl-10 h-10 md:h-11 text-base md:text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="address" className="text-sm md:text-base">
                    {t('wholesalers_list.dialogs.address')} {customerType === 'due' && <span className="text-red-500">*</span>}
                </Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="address"
                        name="address"
                        placeholder={t('wholesalers_list.dialogs.address_placeholder')}
                        autoComplete="street-address"
                        required={customerType === 'due'}
                        className="pl-10 h-10 md:h-11 text-base md:text-sm"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="place" className="text-sm md:text-base">
                    {t('wholesalers_list.dialogs.place')}
                </Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="place"
                        name="place"
                        placeholder={t('wholesalers_list.dialogs.place_placeholder')}
                        autoComplete="address-level2"
                        className="pl-10 h-10 md:h-11 text-base md:text-sm"
                    />
                </div>
            </div>

            {/* Opening Balance - Only for Due Customers */}
            {customerType === 'due' && (
                <div className="border-t pt-4">
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-blue-900 mb-1">
                                {t("customer_dialog.opening_balance_title")}
                            </p>
                            <p className="text-xs text-blue-700">
                                {t("customer_dialog.opening_balance_subtitle")}
                            </p>
                        </div>

                        {!useSimpleMode ? (
                            <div className="space-y-4">
                                {/* Detailed Mode: Opening Sales and Payments */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Opening Sales */}
                                    <div className="space-y-2">
                                        <Label htmlFor="openingSales" className="text-xs md:text-sm text-gray-700">
                                            {t("customer_dialog.opening_sales")}
                                        </Label>
                                        <div className="relative">
                                            <ArrowDownLeft className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                                            <Input
                                                id="openingSales"
                                                type="number"
                                                inputMode="decimal"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={openingSales}
                                                onChange={(e) => setOpeningSales(e.target.value)}
                                                className="pl-10 h-10 md:h-11 text-base md:text-sm font-medium bg-red-50/30 border-red-200 focus-visible:ring-red-500"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {t("customer_dialog.opening_sales_help")}
                                        </p>
                                    </div>

                                    {/* Opening Payments */}
                                    <div className="space-y-2">
                                        <Label htmlFor="openingPayments" className="text-xs md:text-sm text-gray-700">
                                            {t("customer_dialog.opening_payments")}
                                        </Label>
                                        <div className="relative">
                                            <ArrowUpRight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                                            <Input
                                                id="openingPayments"
                                                type="number"
                                                inputMode="decimal"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={openingPayments}
                                                onChange={(e) => setOpeningPayments(e.target.value)}
                                                className="pl-10 h-10 md:h-11 text-base md:text-sm font-medium bg-green-50/30 border-green-200 focus-visible:ring-green-500"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {t("customer_dialog.opening_payments_help")}
                                        </p>
                                    </div>
                                </div>

                                {/* Toggle to Simple Mode */}
                                <div className="flex items-center justify-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setUseSimpleMode(true)}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 underline"
                                    >
                                        {t("wholesalers_list.dialogs.switch_to_simple")}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Simple Mode: Net Balance Entry */}
                                <div className="space-y-4">
                                    {/* Amount They Owe */}
                                    <div className="space-y-2">
                                        <Label htmlFor="amountTheyOwe" className="text-xs md:text-sm text-gray-700">
                                            {t("customer_dialog.amount_they_owe")}
                                        </Label>
                                        <div className="relative">
                                            <ArrowDownLeft className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                                            <Input
                                                id="amountTheyOwe"
                                                type="number"
                                                inputMode="decimal"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={amountTheyOwe}
                                                onChange={(e) => {
                                                    setAmountTheyOwe(e.target.value);
                                                    if (e.target.value && parseFloat(e.target.value) > 0) {
                                                        setAmountIOwe("");
                                                    }
                                                }}
                                                className="pl-10 h-10 md:h-11 text-base md:text-sm font-medium bg-red-50/30 border-red-200 focus-visible:ring-red-500"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {t("customer_dialog.amount_they_owe_help")}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-center">
                                        <span className="text-sm font-medium text-gray-500">
                                            {t("wholesalers_list.dialogs.or")}
                                        </span>
                                    </div>

                                    {/* Amount I Owe */}
                                    <div className="space-y-2">
                                        <Label htmlFor="amountIOwe" className="text-xs md:text-sm text-gray-700">
                                            {t("customer_dialog.amount_i_owe")}
                                        </Label>
                                        <div className="relative">
                                            <ArrowUpRight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                                            <Input
                                                id="amountIOwe"
                                                type="number"
                                                inputMode="decimal"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={amountIOwe}
                                                onChange={(e) => {
                                                    setAmountIOwe(e.target.value);
                                                    if (e.target.value && parseFloat(e.target.value) > 0) {
                                                        setAmountTheyOwe("");
                                                    }
                                                }}
                                                className="pl-10 h-10 md:h-11 text-base md:text-sm font-medium bg-green-50/30 border-green-200 focus-visible:ring-green-500"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {t("customer_dialog.amount_i_owe_help")}
                                        </p>
                                    </div>
                                </div>

                                {/* Toggle back to Detailed Mode */}
                                <div className="flex items-center justify-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setUseSimpleMode(false)}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 underline"
                                    >
                                        {t("wholesalers_list.dialogs.switch_to_detailed")}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Opening Balance Preview */}
                        {openingBalance !== 0 && (
                            <div className={`p-3 rounded-lg border-2 ${openingBalance > 0
                                ? 'bg-red-50 border-red-200'
                                : 'bg-green-50 border-green-200'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">
                                        {t("wholesalers_list.dialogs.opening_balance_preview")}:
                                    </span>
                                    <div className="text-right">
                                        <p className={`font-bold text-lg ${openingBalance > 0
                                            ? 'text-red-600'
                                            : 'text-green-600'
                                            }`}>
                                            ₹{Math.abs(openingBalance).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {openingBalance > 0
                                                ? t("customer_dialog.they_owe_you_label")
                                                : t("customer_dialog.you_owe_them_label")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1 h-10 md:h-11 text-base md:text-sm"
                >
                    {t('wholesalers_list.dialogs.cancel')}
                </Button>
                <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 h-10 md:h-11 text-base md:text-sm font-medium"
                    disabled={createMutation.isPending}
                >
                    {createMutation.isPending ? t('wholesalers_list.dialogs.creating') : (customerType === 'due' ? t('sidebar.add_due_customers') : t('sidebar.add_normal_customers'))}
                </Button>
            </div>
        </form>
    );
}

export function AddCustomerDialog({ customerType }: AddCustomerDialogProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const isDesktop = useMediaQuery('(min-width: 768px)');

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-md hover:shadow-lg transition-all">
                        <Plus className="mr-2 h-4 w-4" />
                        {customerType === 'due' ? t('sidebar.add_due_customers') : t('sidebar.add_normal_customers')}
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {t('customer_dialog.add_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('customer_dialog.add_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <CustomerForm
                        customerType={customerType}
                        onSuccess={() => setIsOpen(false)}
                        onCancel={() => setIsOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-md hover:shadow-lg transition-all">
                    <Plus className="mr-2 h-4 w-4" />
                    {customerType === 'due' ? t('sidebar.add_due_customers') : t('sidebar.add_normal_customers')}
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[20px] max-h-[90vh] overflow-y-auto px-4 md:px-6">
                <SheetHeader className="text-left md:text-center mt-2">
                    <SheetTitle>
                        {t('customer_dialog.add_title')}
                    </SheetTitle>
                    <SheetDescription>
                        {t('customer_dialog.add_desc')}
                    </SheetDescription>
                </SheetHeader>
                <CustomerForm
                    customerType={customerType}
                    onSuccess={() => setIsOpen(false)}
                    onCancel={() => setIsOpen(false)}
                />
            </SheetContent>
        </Sheet>
    );
}
