'use client';

import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Receipt, ExternalLink } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Link from 'next/link';

import { Wholesaler } from '@/types';

interface Bill {
    _id: string;
    billNumber: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentMethod: string;
    createdAt: string;
}

interface TransactionsTableProps {
    bills: Bill[];
    wholesaler?: Wholesaler;
    isLoading?: boolean;
}

function formatCurrency(amount: number | undefined): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount ?? 0);
}

const paymentMethodColors: Record<string, string> = {
    cash: 'bg-green-100 text-green-700',
    card: 'bg-blue-100 text-blue-700',
    online: 'bg-purple-100 text-purple-700',
    upi: 'bg-indigo-100 text-indigo-700',
};

export function TransactionsTable({ bills, wholesaler, isLoading }: TransactionsTableProps) {
    const { t } = useTranslation();
    // Use opening purchases and payments directly from database
    const openingBalance = wholesaler?.openingPurchases || 0;
    const openingPayment = wholesaler?.openingPayments || 0;
    const openingDue = Math.max(0, openingBalance - openingPayment);

    if (isLoading) {
        return (
            <div className="p-8 md:p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-t-2 border-b-2 border-purple-500 mx-auto" />
                <p className="text-gray-500 mt-3 md:mt-4 text-sm md:text-base">{t('wholesalers_list.empty.loading')}</p>
            </div>
        );
    }

    // Show empty state only if no bills AND no opening balance
    if ((!bills || bills.length === 0) && openingBalance === 0) {
        return (
            <div className="p-8 md:p-12 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <Receipt className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">{t('wholesaler_detail.transactions.empty')}</h3>
                <p className="text-gray-500 mb-3 md:mb-4 text-sm md:text-base">{t('wholesaler_detail.transactions.empty_desc')}</p>
                <Link href="/shopkeeper/billing">
                    <Button className="bg-purple-600 hover:bg-purple-700 h-9 text-sm">
                        {t('billing.total_bill')}
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <>
            {/* Desktop Table */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                            <TableHead className="font-semibold">{t('history.date')}</TableHead>
                            <TableHead className="font-semibold">{t('wholesaler_detail.transactions.bill_no')}</TableHead>
                            <TableHead className="font-semibold text-right">{t('wholesaler_detail.info.purchased')}</TableHead>
                            <TableHead className="font-semibold text-right">{t('wholesaler_detail.info.paid')}</TableHead>
                            <TableHead className="font-semibold text-right">{t('wholesaler_detail.info.due')}</TableHead>
                            <TableHead className="font-semibold">{t('wholesaler_detail.transactions.method')}</TableHead>
                            <TableHead className="font-semibold">{t('history.status')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Opening Balance Row */}
                        {openingBalance > 0 && (
                            <TableRow className="bg-blue-50/50 border-b-2 border-blue-200">
                                <TableCell className="text-gray-600 font-medium">
                                    {t('wholesaler_detail.transactions.before_app')}
                                </TableCell>
                                <TableCell>
                                    <Badge className="bg-blue-100 text-blue-700 border-0 font-mono text-sm">
                                        {t('wholesaler_detail.transactions.opening_balance')}
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
                                            {t('wholesaler_detail.transactions.pending_status')}
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
                            const due = bill.dueAmount ?? (bill.totalAmount - bill.paidAmount);
                            return (
                                <TableRow key={bill._id} className="hover:bg-purple-50/30 transition-colors">
                                    <TableCell className="text-gray-600">
                                        {format(new Date(bill.createdAt), 'dd MMM yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                            {bill.billNumber}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-gray-900">
                                        {formatCurrency(bill.totalAmount)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-green-600">
                                        {formatCurrency(bill.paidAmount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={due > 0 ? 'font-semibold text-red-600' : 'text-gray-400'}>
                                            {due > 0 ? formatCurrency(due) : '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`capitalize border-0 ${!bill.paymentMethod ? 'bg-gray-100 text-gray-600' : (paymentMethodColors[bill.paymentMethod] || 'bg-blue-100 text-blue-700')}`}>
                                            {bill.paymentMethod || '---'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {(() => {
                                            if (due <= 0) {
                                                return <Badge className="bg-green-100 text-green-700 border-0">✓ {t('wholesaler_detail.transactions.paid_status')}</Badge>;
                                            } else if (bill.paidAmount > 0) {
                                                return <Badge className="bg-yellow-100 text-yellow-700 border-0">{t('wholesaler_detail.transactions.partial_status')}</Badge>;
                                            } else {
                                                return <Badge className="bg-red-100 text-red-700 border-0">{t('wholesaler_detail.transactions.pending_status')}</Badge>;
                                            }
                                        })()}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Cards - App-like with colored borders */}
            <div className="md:hidden p-2 space-y-2 bg-gray-50/50">
                {/* Opening Balance Card */}
                {openingBalance > 0 && (
                    <div className="p-3 bg-blue-50 rounded-xl shadow-sm border-l-4 border-l-blue-500 border-2 border-blue-200">
                        {/* Header Row */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] px-1.5 font-mono">
                                    {t('wholesaler_detail.transactions.opening_balance')}
                                </Badge>
                                <Badge className="bg-gray-100 text-gray-600 border-0 text-[10px] px-1.5">
                                    {t('history.nil')}
                                </Badge>
                            </div>
                            {openingDue > 0 ? (
                                <Badge className="bg-orange-100 text-orange-700 border-0 text-[10px] px-1.5">
                                    {t('wholesaler_detail.transactions.pending_status')}
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
                            {t('wholesaler_detail.transactions.before_app')}
                        </p>
                    </div>
                )}

                {bills.map((bill) => {
                    const due = bill.dueAmount ?? (bill.totalAmount - bill.paidAmount);
                    return (
                        <div
                            key={bill._id}
                            className={`p-3 bg-white rounded-xl shadow-sm border-l-4 active:scale-[0.99] transition-all ${due > 0 ? 'border-l-orange-500' : 'border-l-green-500'
                                }`}
                        >
                            {/* Header Row */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                        {bill.billNumber}
                                    </span>
                                    <Badge className={`capitalize border-0 text-[10px] px-1.5 ${!bill.paymentMethod ? 'bg-gray-100 text-gray-600' : (paymentMethodColors[bill.paymentMethod] || 'bg-blue-100')}`}>
                                        {bill.paymentMethod || '---'}
                                    </Badge>
                                </div>
                                {(() => {
                                    if (due <= 0) {
                                        return <Badge className="bg-green-100 text-green-700 border-0 text-[10px] px-1.5">✓ {t('wholesaler_detail.transactions.paid_status')}</Badge>;
                                    } else if (bill.paidAmount > 0) {
                                        return <Badge className="bg-yellow-100 text-yellow-700 border-0 text-[10px] px-1.5">{t('wholesaler_detail.transactions.partial_status')}</Badge>;
                                    } else {
                                        return <Badge className="bg-red-100 text-red-700 border-0 text-[10px] px-1.5">{t('wholesaler_detail.transactions.pending_status')}</Badge>;
                                    }
                                })()}
                            </div>

                            {/* Stats Row */}
                            <div className="bg-gray-50 rounded-lg p-2.5 my-2 border border-gray-100">
                                <div className="flex items-center divide-x divide-gray-200">
                                    <div className="flex-1 text-center px-2">
                                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mb-1">{t('wholesaler_detail.info.purchased')}</p>
                                        <p className="font-bold text-gray-900 text-sm">{formatCurrency(bill.totalAmount)}</p>
                                    </div>
                                    <div className="flex-1 text-center px-2">
                                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mb-1">{t('wholesaler_detail.info.paid')}</p>
                                        <p className="font-bold text-green-600 text-sm">{formatCurrency(bill.paidAmount)}</p>
                                    </div>
                                    <div className="flex-1 text-center px-2">
                                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mb-1">{t('wholesaler_detail.info.due')}</p>
                                        {due > 0 ? (
                                            <p className="font-bold text-red-600 text-sm">{formatCurrency(due)}</p>
                                        ) : (
                                            <p className="font-bold text-green-600 text-sm">✓ {t('history.nil')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Date */}
                            <p className="text-[10px] text-gray-400 mt-2">
                                {format(new Date(bill.createdAt), 'dd MMM yyyy, hh:mm a')}
                            </p>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
