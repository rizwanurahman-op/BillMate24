'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, ArrowRight, Phone } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import Link from 'next/link';

interface DueCustomer {
    _id: string;
    name: string;
    phone?: string;
    outstandingDue: number;
    lastTransactionDate?: string;
}

interface PendingDuesProps {
    customers: DueCustomer[];
    isLoading?: boolean;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}



function getDaysAgo(date: string, t: any): string {
    const days = differenceInDays(new Date(), new Date(date));
    if (days === 0) return t('history.time_filters.today');
    if (days === 1) return t('history.time_filters.yesterday');
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}m ago`;
}

function getUrgencyColor(amount: number): string {
    if (amount >= 10000) return 'from-red-500 to-rose-600';
    if (amount >= 5000) return 'from-orange-500 to-amber-600';
    return 'from-yellow-500 to-amber-500';
}

import { useTranslation } from 'react-i18next';

export function PendingDues({ customers, isLoading }: PendingDuesProps) {
    const { t } = useTranslation();
    if (isLoading) {
        return (
            <Card className="border-0 shadow-lg md:shadow-xl rounded-xl md:rounded-2xl">
                <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50 border-b p-3 md:p-6">
                    <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                        <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-rose-500" />
                        {t('customer_dashboard.pending_dues')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:pt-6 md:px-6">
                    <div className="animate-pulse space-y-2 md:space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-14 md:h-20 bg-gray-100 rounded-xl" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const sortedCustomers = [...customers]
        .filter(c => c.outstandingDue > 0)
        .sort((a, b) => b.outstandingDue - a.outstandingDue)
        .slice(0, 5);

    const totalDue = sortedCustomers.reduce((sum, c) => sum + c.outstandingDue, 0);

    return (
        <Card className="border-0 shadow-lg md:shadow-xl overflow-hidden rounded-xl md:rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50 border-b p-3 md:p-6">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                        <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white">
                            <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div>
                            <span className="block">{t('customer_dashboard.pending_dues')}</span>
                            <span className="text-[10px] md:text-sm font-normal text-rose-600">
                                <span className="text-rose-600">{sortedCustomers.length} {t('common.customers')} • {formatCurrency(totalDue)} {t('billing.status_due')}</span>
                            </span>
                        </div>
                    </CardTitle>
                    <Link
                        href="/shopkeeper/customers/due"
                        className="text-xs md:text-sm text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium"
                    >
                        <span className="hidden sm:inline">{t('dashboard.view_all')}</span> <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-6">
                {sortedCustomers.length > 0 ? (
                    <>
                        {/* Desktop View */}
                        <div className="hidden md:block space-y-3">
                            {sortedCustomers.map((customer, index) => (
                                <Link
                                    key={customer._id || `due-${index}`}
                                    href={`/shopkeeper/customers/due/${customer._id}`}
                                    className="block"
                                >
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-rose-200 hover:shadow-md transition-all duration-200 group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${getUrgencyColor(customer.outstandingDue)}`}>
                                                <span className="text-sm font-bold">₹</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 group-hover:text-rose-600 transition-colors text-base">
                                                    {customer.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-500">
                                                    {customer.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            <span>{customer.phone}</span>
                                                            <span>•</span>
                                                        </span>
                                                    )}
                                                    {customer.lastTransactionDate && (
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{getDaysAgo(customer.lastTransactionDate, t)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="destructive" className="text-sm font-bold shadow-sm px-2">
                                                {formatCurrency(customer.outstandingDue)}
                                            </Badge>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Mobile View - Professional card design */}
                        <div className="md:hidden">
                            {sortedCustomers.map((customer, index) => (
                                <Link
                                    key={customer._id || `due-${index}`}
                                    href={`/shopkeeper/customers/due/${customer._id}`}
                                    className="block"
                                >
                                    <div className={`p-3 bg-white active:scale-[0.99] transition-all ${index !== sortedCustomers.length - 1 ? 'border-b-2 border-gray-200' : ''}`}>
                                        {/* Header Row - Name, Time ago */}
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg flex-shrink-0 bg-gradient-to-br ${getUrgencyColor(customer.outstandingDue)}`}>
                                                    <span className="text-xs font-bold">₹</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 text-sm truncate">{customer.name}</p>
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                        {customer.phone && (
                                                            <>
                                                                <Phone className="h-2.5 w-2.5" />
                                                                <span>{customer.phone}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {customer.lastTransactionDate && (
                                                <span className="text-[10px] text-gray-400 flex-shrink-0">
                                                    {getDaysAgo(customer.lastTransactionDate, t)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Due Amount - Prominent Display */}
                                        <div className="bg-red-50 rounded-lg p-2 border border-red-100">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-red-600 font-medium">{t('billing.status_due')}</span>
                                                <span className="font-bold text-red-600 text-base">{formatCurrency(customer.outstandingDue)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="p-8 md:p-12 text-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3 md:mb-4">
                            <span className="text-xl md:text-2xl">🎉</span>
                        </div>
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">{t('dashboard.no_pending_dues')}</h3>
                        <p className="text-gray-500 text-sm md:text-base">{t('wholesaler_detail.payments_table.empty_desc')}</p>
                    </div>
                )}
            </CardContent>
        </Card >
    );
}
