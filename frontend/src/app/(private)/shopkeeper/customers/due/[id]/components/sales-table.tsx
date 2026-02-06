'use client';

import { Badge } from '@/components/ui/badge';
import { Receipt, Banknote, CreditCard as CreditCardIcon, Smartphone } from 'lucide-react';
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

interface Customer {
    openingSales?: number;
    openingPayments?: number;
    totalSales: number;
    outstandingDue: number;
}

interface Bill {
    _id: string;
    billNumber: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentMethod: string;
    createdAt: string;
}

interface SalesTableProps {
    bills: Bill[];
    customer?: Customer;
    isLoading?: boolean;
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
    card: { key: 'card', icon: <CreditCardIcon className="h-3 w-3" />, bgColor: 'bg-blue-100', color: 'text-blue-700' },
    upi: { key: 'online', icon: <Smartphone className="h-3 w-3" />, bgColor: 'bg-purple-100', color: 'text-purple-700' },
    online: { key: 'online', icon: <Smartphone className="h-3 w-3" />, bgColor: 'bg-purple-100', color: 'text-purple-700' },
    none: { key: 'nil', icon: null, bgColor: 'bg-gray-100', color: 'text-gray-600' },
};

export function SalesTable({ bills, customer, isLoading }: SalesTableProps) {
    const { t } = useTranslation();
    // Use opening sales and payments directly from database
    const openingBalance = customer?.openingSales || 0;
    const openingPayment = customer?.openingPayments || 0;
    const openingDue = Math.max(0, openingBalance - openingPayment);

    if (isLoading) {
        return (
            <div className="p-8 md:p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-t-2 border-b-2 border-emerald-500 mx-auto" />
                <p className="text-gray-500 mt-3 md:mt-4 text-sm">{t('wholesalers_list.empty.loading')}</p>
            </div>
        );
    }

    if ((!bills || bills.length === 0) && openingBalance <= 0) {
        return (
            <div className="p-8 md:p-12 text-center">
                <Receipt className="h-8 w-8 md:h-12 md:w-12 text-gray-300 mx-auto mb-3 md:mb-4" />
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1 md:mb-2">{t('history.no_bills_found')}</h3>
                <p className="text-gray-500 text-sm">{t('history.create_new_desc').replace('മൊത്തക്കച്ചവടക്കാരനെ', t('common.customer'))}</p>
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
                            <TableHead>{t('billing.bill_number')}</TableHead>
                            <TableHead className="text-right">{t('dashboard.total')}</TableHead>
                            <TableHead className="text-right">{t('billing.paid')}</TableHead>
                            <TableHead className="text-right">{t('billing.due')}</TableHead>
                            <TableHead>{t('wholesaler_payments.table.method')}</TableHead>
                            <TableHead>{t('wholesalers_list.table.status')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Opening Balance Row */}
                        {openingBalance > 0 && (
                            <TableRow className="bg-blue-50/50 border-b-2 border-blue-200">
                                <TableCell className="text-gray-600 font-medium">
                                    {t('dashboard.includes_opening').replace('(', '').replace(')', '')}
                                </TableCell>
                                <TableCell>
                                    <Badge className="bg-blue-100 text-blue-700 border-0 font-mono text-sm">
                                        {t('wholesalers_list.dialogs.opening_balance')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold text-gray-900">
                                    {formatCurrency(openingBalance)}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-green-600">
                                    {formatCurrency(openingPayment)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="font-semibold text-orange-600">
                                        {formatCurrency(openingDue)}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">
                                        {t('history.nil')}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {openingDue > 0 ? (
                                        <Badge className="bg-orange-100 text-orange-700 border-0">
                                            {t('billing.status_due')}
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-green-100 text-green-700 border-0">
                                            {t('billing.paid')}
                                        </Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        )}

                        {bills.map((bill) => {
                            const methodConfig = bill.paymentMethod ? (paymentMethodConfig[bill.paymentMethod] || paymentMethodConfig.cash) : paymentMethodConfig.none;
                            const methodLabel = methodConfig.key === 'online' ? t('dashboard.online') + ' / UPI' : t(`dashboard.${methodConfig.key}`);
                            const due = bill.dueAmount || (bill.totalAmount - bill.paidAmount);
                            return (
                                <TableRow key={bill._id} className="hover:bg-emerald-50/30">
                                    <TableCell>
                                        {format(new Date(bill.createdAt), 'dd MMM yyyy')}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {bill.billNumber}
                                    </TableCell>
                                    <TableCell className="font-medium text-right">
                                        {formatCurrency(bill.totalAmount)}
                                    </TableCell>
                                    <TableCell className="text-green-600 text-right">
                                        {formatCurrency(bill.paidAmount)}
                                    </TableCell>
                                    <TableCell className="text-red-600 text-right">
                                        {formatCurrency(due)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`${methodConfig.bgColor} ${methodConfig.color} border-0`}>
                                            {methodLabel}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {due <= 0 ? (
                                            <Badge className="bg-green-100 text-green-700 border-0">{t('billing.paid')}</Badge>
                                        ) : bill.paidAmount > 0 ? (
                                            <Badge className="bg-yellow-100 text-yellow-700 border-0">{t('billing.partial')}</Badge>
                                        ) : (
                                            <Badge variant="destructive">{t('billing.status_due')}</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
                {/* Opening Balance Card */}
                {openingBalance > 0 && (
                    <div className="p-3 bg-blue-50 rounded-xl shadow-sm border-l-4 border-l-blue-500 border-2 border-blue-200 mb-2">
                        {/* Header Row */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] px-1.5 font-mono">
                                    {t('wholesalers_list.dialogs.opening_balance')}
                                </Badge>
                                <Badge className="bg-gray-100 text-gray-600 border-0 text-[10px] px-1.5">
                                    {t('history.nil')}
                                </Badge>
                            </div>
                            {openingDue > 0 ? (
                                <Badge className="bg-orange-100 text-orange-700 border-0 text-[10px] px-1.5">
                                    {t('billing.status_due')}
                                </Badge>
                            ) : (
                                <Badge className="bg-green-100 text-green-700 border-0 text-[10px] px-1.5">
                                    {t('billing.paid')}
                                </Badge>
                            )}
                        </div>

                        {/* Amount Row */}
                        <div className="bg-white rounded-lg p-2">
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <p className="text-[10px] text-gray-500 font-medium">{t('dashboard.total')}</p>
                                    <p className="font-bold text-gray-900 text-sm">{formatCurrency(openingBalance)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-medium">{t('billing.paid')}</p>
                                    <p className="font-bold text-green-600 text-sm">{formatCurrency(openingPayment)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-medium">{t('billing.due')}</p>
                                    <p className="font-bold text-orange-600 text-sm">{formatCurrency(openingDue)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Date */}
                        <p className="text-[10px] text-gray-500 mt-2 font-medium">
                            {t('dashboard.includes_opening').replace('(', '').replace(')', '')}
                        </p>
                    </div>
                )}

                {bills.map((bill, index) => {
                    const methodConfig = bill.paymentMethod ? (paymentMethodConfig[bill.paymentMethod] || paymentMethodConfig.cash) : paymentMethodConfig.none;
                    const methodLabel = methodConfig.key === 'online' ? t('dashboard.online') + ' / UPI' : t(`dashboard.${methodConfig.key}`);
                    const due = bill.dueAmount || (bill.totalAmount - bill.paidAmount);

                    return (
                        <div key={bill._id} className={`p-3 bg-white ${index !== bills.length - 1 ? 'border-b-2 border-gray-200' : ''}`}>
                            {/* Header Row - Bill Number, Method, Date */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white flex-shrink-0">
                                        <Receipt className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-mono text-xs text-gray-900 font-semibold">#{bill.billNumber}</p>
                                        <p className="text-[10px] text-gray-500">{format(new Date(bill.createdAt), 'dd MMM, hh:mm a')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <Badge className={`${methodConfig.bgColor} ${methodConfig.color} border-0 text-[10px] px-1.5`}>
                                        {methodLabel}
                                    </Badge>
                                    {due <= 0 ? (
                                        <Badge className="bg-green-100 text-green-700 border-0 text-[10px] px-1.5">{t('billing.paid')}</Badge>
                                    ) : bill.paidAmount > 0 ? (
                                        <Badge className="bg-yellow-100 text-yellow-700 border-0 text-[10px] px-1.5">{t('billing.partial')}</Badge>
                                    ) : (
                                        <Badge variant="destructive" className="text-[10px] px-1.5">{t('billing.status_due')}</Badge>
                                    )}
                                </div>
                            </div>

                            {/* Amount Row - Total, Paid, Due */}
                            <div className="bg-gray-50 rounded-lg p-2">
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    {/* Total */}
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-medium">{t('dashboard.total')}</p>
                                        <p className="font-bold text-gray-900 text-sm">{formatCurrency(bill.totalAmount)}</p>
                                    </div>

                                    {/* Paid */}
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-medium">{t('billing.paid')}</p>
                                        <p className="font-bold text-green-600 text-sm">{formatCurrency(bill.paidAmount)}</p>
                                    </div>

                                    {/* Due */}
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-medium">{t('billing.due')}</p>
                                        {due > 0 ? (
                                            <p className="font-bold text-red-600 text-sm">{formatCurrency(due)}</p>
                                        ) : (
                                            <p className="font-bold text-green-600 text-sm">{t('wholesalers_list.table.nil_badge')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
