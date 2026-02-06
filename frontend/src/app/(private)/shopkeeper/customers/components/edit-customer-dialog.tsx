'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Phone, MessageCircle, MapPin, Save, CheckCircle, XCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useTranslation } from 'react-i18next';

interface CustomerData {
    _id: string;
    name: string;
    phone?: string;
    whatsappNumber?: string;
    email?: string;
    address?: string;
    place?: string;
    isActive?: boolean;
    type: 'due' | 'normal';
    openingSales?: number;
    openingPayments?: number;
}

interface EditCustomerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<CustomerData>) => void;
    customer: CustomerData | null;
    isSaving?: boolean;
}

function EditCustomerForm({
    customer,
    onSave,
    onClose,
    isSaving
}: {
    customer: CustomerData | null;
    onSave: (data: Partial<CustomerData>) => void;
    onClose: () => void;
    isSaving: boolean;
}) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        whatsappNumber: '',
        email: '',
        address: '',
        place: '',
        isActive: true,
    });

    const [useSimpleMode, setUseSimpleMode] = useState(true);
    const [openingSales, setOpeningSales] = useState<string>("");
    const [openingPayments, setOpeningPayments] = useState<string>("");
    const [amountTheyOwe, setAmountTheyOwe] = useState<string>("");
    const [amountIOwe, setAmountIOwe] = useState<string>("");

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                phone: customer.phone || '',
                whatsappNumber: customer.whatsappNumber || '',
                email: customer.email || '',
                address: customer.address || '',
                place: customer.place || '',
                isActive: customer.isActive ?? true,
            });

            // Initialize opening balance states
            const os = customer.openingSales || 0;
            const op = customer.openingPayments || 0;

            setOpeningSales(os.toString());
            setOpeningPayments(op.toString());

            const balance = os - op;
            if (balance > 0) {
                setAmountTheyOwe(balance.toString());
                setAmountIOwe("");
            } else if (balance < 0) {
                setAmountIOwe(Math.abs(balance).toString());
                setAmountTheyOwe("");
            } else {
                setAmountTheyOwe("");
                setAmountIOwe("");
            }
        }
    }, [customer]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let finalOpeningSales = 0;
        let finalOpeningPayments = 0;

        if (useSimpleMode) {
            const theyOwe = parseFloat(amountTheyOwe) || 0;
            const iOwe = parseFloat(amountIOwe) || 0;
            if (theyOwe > 0) {
                finalOpeningSales = theyOwe;
                finalOpeningPayments = 0;
            } else if (iOwe > 0) {
                finalOpeningSales = 0;
                finalOpeningPayments = iOwe;
            }
        } else {
            finalOpeningSales = parseFloat(openingSales) || 0;
            finalOpeningPayments = parseFloat(openingPayments) || 0;
        }

        onSave({
            ...formData,
            openingSales: finalOpeningSales,
            openingPayments: finalOpeningPayments
        });
    };

    const handleChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Calculate opening balance for preview
    const osValue = useSimpleMode
        ? (parseFloat(amountTheyOwe) || 0)
        : (parseFloat(openingSales) || 0);

    const opValue = useSimpleMode
        ? (parseFloat(amountIOwe) || 0)
        : (parseFloat(openingPayments) || 0);

    const netOpeningBalance = osValue - opValue;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 mt-4 pb-4 md:pb-0">
            <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm md:text-base">
                    {t('customer_dialog.name')} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder={t('wholesalers_list.dialogs.name_placeholder')}
                        required
                        className="pl-10 h-10 md:h-11 text-base md:text-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="edit-phone" className="text-sm md:text-base">
                        {t('wholesalers_list.dialogs.phone')} {customer?.type === 'due' && <span className="text-red-500">*</span>}
                    </Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="edit-phone"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            type="tel"
                            placeholder="+91"
                            required={customer?.type === 'due'}
                            className="pl-10 h-10 md:h-11 text-base md:text-sm"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-whatsapp" className="text-sm md:text-base">{t('wholesalers_list.dialogs.whatsapp')}</Label>
                    <div className="relative">
                        <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="edit-whatsapp"
                            value={formData.whatsappNumber}
                            onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                            type="tel"
                            placeholder="+91"
                            className="pl-10 h-10 md:h-11 text-base md:text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="edit-address" className="text-sm md:text-base">
                    {t('wholesalers_list.dialogs.address')} {customer?.type === 'due' && <span className="text-red-500">*</span>}
                </Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="edit-address"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder={t('wholesalers_list.dialogs.address_placeholder')}
                        required={customer?.type === 'due'}
                        className="pl-10 h-10 md:h-11 text-base md:text-sm"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="edit-place" className="text-sm md:text-base">{t('wholesalers_list.dialogs.place')}</Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="edit-place"
                        value={formData.place}
                        onChange={(e) => handleChange('place', e.target.value)}
                        placeholder={t('wholesalers_list.dialogs.place_placeholder')}
                        className="pl-10 h-10 md:h-11 text-base md:text-sm"
                    />
                </div>
            </div>

            {/* Opening Balance Concept - PROFESSIONALLY ADDED HERE */}
            {customer?.type === 'due' && (
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
                        {netOpeningBalance !== 0 && (
                            <div className={`p-3 rounded-lg border-2 ${netOpeningBalance > 0
                                ? 'bg-red-50 border-red-200'
                                : 'bg-green-50 border-green-200'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">
                                        {t("wholesalers_list.dialogs.opening_balance_preview")}:
                                    </span>
                                    <div className="text-right">
                                        <p className={`font-bold text-lg ${netOpeningBalance > 0
                                            ? 'text-red-600'
                                            : 'text-green-600'
                                            }`}>
                                            ₹{Math.abs(netOpeningBalance).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {netOpeningBalance > 0
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

            {/* Active Status */}
            <div className="space-y-2 pt-2">
                <Label className="text-sm md:text-base">{t('wholesalers_list.table.status')}</Label>
                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant={formData.isActive ? 'default' : 'outline'}
                        className={`flex-1 h-10 md:h-11 ${formData.isActive ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                        onClick={() => handleChange('isActive', true)}
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t('wholesalers_list.stats.active')}
                    </Button>
                    <Button
                        type="button"
                        variant={!formData.isActive ? 'default' : 'outline'}
                        className={`flex-1 h-10 md:h-11 ${!formData.isActive ? 'bg-slate-600 hover:bg-slate-700' : ''}`}
                        onClick={() => handleChange('isActive', false)}
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t('wholesalers_list.stats.inactive')}
                    </Button>
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSaving}
                    className="flex-1 h-10 md:h-11 text-base md:text-sm"
                >
                    {t('wholesalers_list.dialogs.cancel')}
                </Button>
                <Button
                    type="submit"
                    disabled={isSaving || !formData.name.trim()}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 h-10 md:h-11 text-base md:text-sm font-medium"
                >
                    {isSaving ? (
                        <span className="flex items-center gap-2">
                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            {t('wholesalers_list.dialogs.saving')}
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            {t('wholesalers_list.dialogs.save_button')}
                        </span>
                    )}
                </Button>
            </div>
        </form>
    );
}

export function EditCustomerDialog({
    isOpen,
    onClose,
    onSave,
    customer,
    isSaving = false
}: EditCustomerDialogProps) {
    const { t } = useTranslation();
    const isDesktop = useMediaQuery('(min-width: 768px)');

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                                <User className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">{t('customer_dialog.edit_title')}</DialogTitle>
                                <DialogDescription className="text-sm text-gray-500 mt-0.5">
                                    {t('customer_dialog.edit_desc')}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <EditCustomerForm
                        customer={customer}
                        onSave={onSave}
                        onClose={onClose}
                        isSaving={isSaving}
                    />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="rounded-t-[20px] max-h-[90vh] overflow-y-auto px-4 md:px-6 pb-6">
                <SheetHeader className="text-left md:text-center mt-2">
                    <SheetTitle>{t('customer_dialog.edit_title')}</SheetTitle>
                    <SheetDescription>
                        {t('customer_dialog.edit_desc')}
                    </SheetDescription>
                </SheetHeader>
                <EditCustomerForm
                    customer={customer}
                    onSave={onSave}
                    onClose={onClose}
                    isSaving={isSaving}
                />
            </SheetContent>
        </Sheet>
    );
}

export type { CustomerData };
