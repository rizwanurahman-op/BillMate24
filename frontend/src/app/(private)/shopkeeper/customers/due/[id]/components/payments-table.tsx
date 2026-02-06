'use client';

import { Badge } from '@/components/ui/badge';
import { CreditCard, Banknote, CreditCard as CardIcon, Smartphone } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface Payment {
    _id: string;
    amount: number;
    paymentMethod: string;
    notes?: string;
    createdAt: string;
}

interface Customer {
    openingPayments?: number;
    totalPaid: number;
}

interface PaymentsTableProps {
    payments: Payment[];
    isLoading?: boolean;
    customer?: Customer;
}

function formatCurrency(amount: number | undefined): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount ?? 0);
}



const paymentMethodConfig: Record<string, { key: string; icon: React.ReactNode; bgColor: string; color: string }> = {
    cash: { key: 'cash', icon: <Banknote className="h-3 w-3" />, bgColor: 'bg-green-100', color: 'text-green-700' },
    card: { key: 'card', icon: <CardIcon className="h-3 w-3" />, bgColor: 'bg-blue-100', color: 'text-blue-700' },
    upi: { key: 'online', icon: <Smartphone className="h-3 w-3" />, bgColor: 'bg-purple-100', color: 'text-purple-700' },
    online: { key: 'online', icon: <Smartphone className="h-3 w-3" />, bgColor: 'bg-purple-100', color: 'text-purple-700' },
};

export function PaymentsTable({ payments, isLoading, customer }: PaymentsTableProps) {
    const { t } = useTranslation();

    // Use opening payments directly from database
    const openingAdvance = customer?.openingPayments || 0;

    if (isLoading) {
        return (
            <div className="p-8 md:p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-t-2 border-b-2 border-green-500 mx-auto" />
                <p className="text-gray-500 mt-3 md:mt-4 text-sm">{t('wholesalers_list.empty.loading')}</p>
            </div>
        );
    }

    if ((!payments || payments.length === 0) && openingAdvance <= 0) {
        return (
            <div className="p-8 md:p-12 text-center">
                <CreditCard className="h-8 w-8 md:h-12 md:w-12 text-gray-300 mx-auto mb-3 md:mb-4" />
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1 md:mb-2">{t('wholesaler_payments.empty.no_found')}</h3>
                <p className="text-gray-500 text-sm">{t('wholesaler_payments.record_desc')}</p>
            </div>
        );
    }

    return (
        <>
            {/* Desktop Table */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead>{t('history.date')}</TableHead>
                            <TableHead className="text-right">{t('dashboard.total')}</TableHead>
                            <TableHead>{t('wholesaler_payments.table.method')}</TableHead>
                            <TableHead>{t('wholesaler_payments.table.notes')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Opening Advance Row */}
                        {openingAdvance > 0 && (
                            <TableRow className="bg-green-50/50 border-b-2 border-green-200">
                                <TableCell className="text-gray-600 font-medium">
                                    {t('dashboard.includes_opening').replace('(', '').replace(')', '')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="text-lg font-bold text-green-600">{formatCurrency(openingAdvance)}</span>
                                </TableCell>
                                <TableCell>
                                    <Badge className="bg-green-100 text-green-700 border-0 flex items-center gap-1.5 w-fit">
                                        <Banknote className="h-3 w-3" />
                                        {t('wholesalers_list.dialogs.opening_balance')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-gray-500">
                                    <Badge className="bg-emerald-100 text-emerald-700 border-0">
                                        {t('wholesaler_payments.detail.advance')}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        )}

                        {payments.map((payment) => {
                            const methodConfig = paymentMethodConfig[payment.paymentMethod] || paymentMethodConfig.cash;
                            const methodLabel = methodConfig.key === 'online' ? t('dashboard.online') + ' / UPI' : t(`dashboard.${methodConfig.key}`);
                            return (
                                <TableRow key={payment._id} className="hover:bg-green-50/30">
                                    <TableCell>
                                        {format(new Date(payment.createdAt), 'dd MMM yyyy, hh:mm a')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-lg font-bold text-green-600">{formatCurrency(payment.amount)}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`${methodConfig.bgColor} ${methodConfig.color} border-0 flex items-center gap-1.5 w-fit`}>
                                            {methodConfig.icon}
                                            {methodLabel}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-500 max-w-[200px] truncate">
                                        {payment.notes || '-'}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
                {/* Opening Advance Card */}
                {openingAdvance > 0 && (
                    <div className="p-3 bg-green-50 rounded-xl shadow-sm border-l-4 border-l-green-500 border-2 border-green-200 mb-2">
                        {/* Header Row */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white flex-shrink-0">
                                    <Banknote className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm">{t('wholesalers_list.dialogs.opening_balance')}</p>
                                    <p className="text-[10px] text-gray-500">{t('dashboard.includes_opening').replace('(', '').replace(')', '')}</p>
                                </div>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] px-1.5 flex items-center gap-1 flex-shrink-0">
                                {t('wholesaler_payments.detail.advance')}
                            </Badge>
                        </div>

                        {/* Amount */}
                        <div className="bg-white rounded-lg p-2 border border-green-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-green-600 font-medium">{t('wholesaler_payments.form.amount')}</span>
                                <span className="font-bold text-green-600 text-base">{formatCurrency(openingAdvance)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {payments.map((payment, index) => {
                    const methodConfig = paymentMethodConfig[payment.paymentMethod] || paymentMethodConfig.cash;
                    const methodLabel = methodConfig.key === 'online' ? t('dashboard.online') + ' / UPI' : t(`dashboard.${methodConfig.key}`);

                    return (
                        <div key={payment._id} className={`p-3 bg-white ${index !== payments.length - 1 ? 'border-b-2 border-gray-200' : ''}`}>
                            {/* Header Row - Date, Method */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white flex-shrink-0">
                                        <CreditCard className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm">{t('wholesaler_payments.record_payment')}</p>
                                        <p className="text-[10px] text-gray-500">{format(new Date(payment.createdAt), 'dd MMM, hh:mm a')}</p>
                                    </div>
                                </div>
                                <Badge className={`${methodConfig.bgColor} ${methodConfig.color} border-0 text-[10px] px-1.5 flex items-center gap-1 flex-shrink-0`}>
                                    {methodConfig.icon}
                                    {methodLabel}
                                </Badge>
                            </div>

                            {/* Amount - Prominent Display */}
                            <div className="bg-green-50 rounded-lg p-2 border border-green-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-green-600 font-medium">{t('wholesaler_payments.form.amount')}</span>
                                    <span className="font-bold text-green-600 text-base">{formatCurrency(payment.amount)}</span>
                                </div>
                                {payment.notes && (
                                    <p className="text-[10px] text-gray-500 mt-1 truncate">{t('wholesaler_payments.table.notes')}: {payment.notes}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
