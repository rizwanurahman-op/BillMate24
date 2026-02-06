'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Receipt, ArrowDownRight, ChevronRight, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface Purchase {
    _id: string;
    billNumber: string;
    entityId: string;
    entityName: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount?: number;
    createdAt: string;
}

interface RecentPurchasesProps {
    purchases: Purchase[];
    isLoading?: boolean;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

import { useTranslation } from 'react-i18next';

export function RecentPurchases({ purchases, isLoading }: RecentPurchasesProps) {
    const { t } = useTranslation();
    if (isLoading) {
        return (
            <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-orange-500" />
                        {t('wholesaler_dashboard.recent_purchases')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const recentPurchases = purchases.slice(0, 10);

    return (
        <Card className="border-0 shadow-lg overflow-hidden rounded-xl md:rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between p-3 md:p-6 pb-2 md:pb-3 bg-gray-50/50">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <div className="p-1.5 md:p-2 rounded-lg bg-orange-100">
                        <Receipt className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                    </div>
                    <span className="hidden sm:inline">{t('wholesaler_dashboard.recent_purchases')}</span>
                    <span className="sm:hidden">{t('wholesaler_dashboard.recent_purchases')}</span>
                </CardTitle>
                <div className="flex items-center gap-1.5 md:gap-2">
                    <Badge variant="secondary" className="bg-orange-50 text-orange-700 text-[10px] md:text-xs px-1.5 md:px-2">
                        {purchases.length}
                    </Badge>
                    <Link href="/shopkeeper/billing/history?billType=purchase">
                        <Button variant="outline" size="sm" className="text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3">
                            <span className="hidden sm:inline">{t('wholesaler_dashboard.view_all')}</span>
                            <span className="sm:hidden">{t('wholesaler_dashboard.all')}</span>
                            <ChevronRight className="h-3 w-3 ml-0.5 md:ml-1" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {recentPurchases.length > 0 ? (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                        <TableHead className="font-semibold">{t('billing.bill_number')}</TableHead>
                                        <TableHead className="font-semibold">{t('common.wholesaler')}</TableHead>
                                        <TableHead className="font-semibold text-right">{t('billing.total_bill')}</TableHead>
                                        <TableHead className="font-semibold text-right">{t('billing.paid')}</TableHead>
                                        <TableHead className="font-semibold">{t('billing.status')}</TableHead>
                                        <TableHead className="font-semibold">{t('history.date')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentPurchases.map((purchase) => {
                                        const dueAmount = purchase.dueAmount ?? (purchase.totalAmount - purchase.paidAmount);
                                        return (
                                            <TableRow key={purchase._id} className="hover:bg-gray-50 transition-colors group">
                                                <TableCell className="font-mono text-sm font-semibold">
                                                    {purchase.billNumber}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 rounded-lg bg-orange-50">
                                                            <ArrowDownRight className="h-3.5 w-3.5 text-orange-600" />
                                                        </div>
                                                        <span className="font-medium max-w-[200px] truncate">{purchase.entityName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-gray-900">
                                                    {formatCurrency(purchase.totalAmount)}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-green-600">
                                                    {formatCurrency(purchase.paidAmount)}
                                                </TableCell>
                                                <TableCell>
                                                    {dueAmount > 0 ? (
                                                        <Badge variant="destructive" className="bg-red-100 text-red-700 border-0 font-mono">
                                                            {t('billing.status_due')}: {formatCurrency(dueAmount)}
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-green-100 text-green-700 border-0">
                                                            ✓ {t('billing.paid')}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-gray-500 text-sm">
                                                    {format(new Date(purchase.createdAt), 'dd MMM yyyy')}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Cards - Professional design with paid amount */}
                        <div className="md:hidden">
                            {recentPurchases.map((purchase, index) => {
                                const dueAmount = purchase.dueAmount ?? (purchase.totalAmount - purchase.paidAmount);
                                return (
                                    <div
                                        key={purchase._id}
                                        className={`p-3 bg-white active:scale-[0.99] transition-all ${index !== recentPurchases.length - 1 ? 'border-b-2 border-gray-200' : ''}`}
                                    >
                                        {/* Header Row - Icon, Name, Bill Number */}
                                        <div className="flex items-center gap-3 mb-2">
                                            {/* Icon */}
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-orange-400 to-red-500">
                                                <ArrowDownRight className="h-5 w-5 text-white" />
                                            </div>

                                            {/* Name and Bill Number */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 text-sm truncate">{purchase.entityName}</p>
                                                <p className="font-mono text-[11px] text-gray-400">{purchase.billNumber}</p>
                                            </div>

                                            {/* Purchase Badge */}
                                            <Badge className="text-[10px] px-2 py-0.5 flex-shrink-0 bg-orange-100 text-orange-700 border-0">
                                                {t('billing.purchase')}
                                            </Badge>
                                        </div>

                                        {/* Amount Row - Total, Paid, Due/Status */}
                                        <div className="bg-gray-50 rounded-lg p-2 mb-2">
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                {/* Total Amount */}
                                                <div>
                                                    <p className="text-[10px] text-gray-500 font-medium">{t('billing.total')}</p>
                                                    <p className="font-bold text-gray-900 text-sm">{formatCurrency(purchase.totalAmount)}</p>
                                                </div>

                                                {/* Paid Amount */}
                                                <div>
                                                    <p className="text-[10px] text-gray-500 font-medium">{t('billing.paid')}</p>
                                                    <p className="font-bold text-green-600 text-sm">{formatCurrency(purchase.paidAmount)}</p>
                                                </div>

                                                {/* Due/Status */}
                                                <div>
                                                    <p className="text-[10px] text-gray-500 font-medium">{t('billing.status_due')}</p>
                                                    {dueAmount > 0 ? (
                                                        <p className="font-bold text-red-600 text-sm">{formatCurrency(dueAmount)}</p>
                                                    ) : (
                                                        <p className="font-bold text-green-600 text-sm">✓ {t('history.nil')}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Row - Date */}
                                        <div className="flex items-center justify-end">
                                            <span className="text-xs text-gray-400">
                                                {format(new Date(purchase.createdAt), 'dd MMM, hh:mm a')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="p-8 md:p-12 text-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 md:mb-4">
                            <FileText className="h-6 w-6 md:h-8 md:w-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium text-sm md:text-base">{t('wholesaler_dashboard.no_purchases_found')}</p>
                        <p className="text-xs md:text-sm text-gray-400 mt-1">{t('wholesaler_dashboard.purchases_appear_here')}</p>
                        <Link href="/shopkeeper/billing">
                            <Button size="sm" className="mt-3 md:mt-4 bg-gradient-to-r from-purple-600 to-indigo-600">
                                {t('wholesaler_dashboard.create_purchase')}
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
