'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ml } from '@/lib/date-fns-ml';
import Link from 'next/link';

interface Sale {
    _id: string;
    billNumber: string;
    entityId: string;
    entityName: string;
    entityType: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    createdAt: string;
}

interface RecentSalesProps {
    sales: Sale[];
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

export function RecentSales({ sales, isLoading }: RecentSalesProps) {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'ml' ? ml : undefined;
    if (isLoading) {
        return (
            <Card className="border-0 shadow-lg md:shadow-xl rounded-xl md:rounded-2xl">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b p-3 md:p-6">
                    <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                        <Receipt className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
                        {t('customer_dashboard.recent_sales')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:pt-6 md:px-6">
                    <div className="animate-pulse space-y-2 md:space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-14 md:h-20 bg-gray-100 rounded-xl" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const recentSales = [...sales]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    return (
        <Card className="border-0 shadow-lg md:shadow-xl overflow-hidden rounded-xl md:rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b p-3 md:p-6">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                        <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                            <Receipt className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <span>{t('customer_dashboard.recent_sales')}</span>
                    </CardTitle>
                    <Link
                        href="/shopkeeper/billing/history"
                        className="text-xs md:text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium"
                    >
                        <span className="hidden sm:inline">{t('dashboard.view_all')}</span> <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-6">
                {recentSales.length > 0 ? (
                    <>
                        {/* Desktop View */}
                        <div className="hidden md:block space-y-3">
                            {recentSales.map((sale) => {
                                const dueAmount = sale.dueAmount ?? (sale.totalAmount - sale.paidAmount);
                                const isPaid = dueAmount <= 0;

                                return (
                                    <div
                                        key={sale._id}
                                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-gray-900 text-base">
                                                    {sale.entityName === 'Walk-in Customer' ? t('common.walk_in_customer') : sale.entityName}
                                                </p>
                                                <Badge variant="outline" className={`text-xs px-2 ${sale.entityType === 'due_customer'
                                                    ? 'border-orange-200 text-orange-600 bg-orange-50'
                                                    : 'border-blue-200 text-blue-600 bg-blue-50'
                                                    }`}>
                                                    {sale.entityType === 'due_customer' ? t('billing.status_due') : t('billing.cash')}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                    {sale.billNumber}
                                                </span>
                                                <span>•</span>
                                                <span>{format(new Date(sale.createdAt), 'dd MMM yyyy, hh:mm a', { locale: dateLocale })}</span>
                                            </div>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="font-bold text-gray-900 text-lg">{formatCurrency(sale.totalAmount)}</p>
                                            {isPaid ? (
                                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs shadow-sm px-2">
                                                    {t('billing.paid')} ✓
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive" className="text-xs shadow-sm px-2">
                                                    {t('billing.due')}: {formatCurrency(dueAmount)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mobile View - Professional card design */}
                        <div className="md:hidden">
                            {recentSales.map((sale, index) => {
                                const dueAmount = sale.dueAmount ?? (sale.totalAmount - sale.paidAmount);

                                return (
                                    <div
                                        key={sale._id}
                                        className={`p-3 bg-white active:scale-[0.99] transition-all ${index !== recentSales.length - 1 ? 'border-b-2 border-gray-200' : ''}`}
                                    >
                                        {/* Header Row - Name, Badge, Bill Number */}
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <p className="font-semibold text-gray-900 text-sm truncate">
                                                    {sale.entityName === 'Walk-in Customer' ? t('common.walk_in_customer') : sale.entityName}
                                                </p>
                                                <Badge variant="outline" className={`text-[10px] px-1.5 flex-shrink-0 ${sale.entityType === 'due_customer'
                                                    ? 'border-orange-200 text-orange-600 bg-orange-50'
                                                    : 'border-blue-200 text-blue-600 bg-blue-50'
                                                    }`}>
                                                    {sale.entityType === 'due_customer' ? t('billing.status_due') : t('billing.cash')}
                                                </Badge>
                                            </div>
                                            <span className="font-mono text-[10px] text-gray-400 flex-shrink-0">
                                                #{sale.billNumber}
                                            </span>
                                        </div>

                                        {/* Amount Row - Total, Paid, Due */}
                                        <div className="bg-gray-50 rounded-lg p-2 mb-2">
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                {/* Total */}
                                                <div>
                                                    <p className="text-[10px] text-gray-500 font-medium">{t('dashboard.total')}</p>
                                                    <p className="font-bold text-gray-900 text-sm">{formatCurrency(sale.totalAmount)}</p>
                                                </div>

                                                {/* Paid */}
                                                <div>
                                                    <p className="text-[10px] text-gray-500 font-medium">{t('billing.paid')}</p>
                                                    <p className="font-bold text-green-600 text-sm">{formatCurrency(sale.paidAmount)}</p>
                                                </div>

                                                {/* Due */}
                                                <div>
                                                    <p className="text-[10px] text-gray-500 font-medium">{t('billing.due')}</p>
                                                    {dueAmount > 0 ? (
                                                        <p className="font-bold text-red-600 text-sm">{formatCurrency(dueAmount)}</p>
                                                    ) : (
                                                        <p className="font-bold text-green-600 text-sm">{t('wholesalers_list.table.nil_badge')}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer - Date */}
                                        <p className="text-[10px] text-gray-400 text-center">
                                            {format(new Date(sale.createdAt), 'dd MMM yyyy, hh:mm a', { locale: dateLocale })}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="p-8 md:p-12 text-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3 md:mb-4">
                            <Receipt className="h-6 w-6 md:h-8 md:w-8 text-emerald-400" />
                        </div>
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">{t('dashboard.no_bills_yet')}</h3>
                        <p className="text-gray-500 text-sm md:text-base">{t('customer_dashboard.add_customers_desc')}</p>
                    </div>
                )}
            </CardContent>
        </Card >
    );
}
