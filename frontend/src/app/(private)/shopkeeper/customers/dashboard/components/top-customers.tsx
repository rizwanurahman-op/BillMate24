'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, Medal, Award, Star } from 'lucide-react';
import Link from 'next/link';

interface Customer {
    _id: string;
    name: string;
    phone?: string;
    totalPurchased: number;
    totalPaid: number;
    outstandingDue: number;
    customerType: 'due' | 'normal';
}

interface TopCustomersProps {
    customers: Customer[];
    isLoading?: boolean;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}



const rankIcons = [
    { icon: Crown, color: 'text-yellow-500', bg: 'bg-gradient-to-br from-yellow-400 to-amber-500' },
    { icon: Medal, color: 'text-gray-400', bg: 'bg-gradient-to-br from-gray-300 to-slate-400' },
    { icon: Award, color: 'text-orange-500', bg: 'bg-gradient-to-br from-orange-400 to-amber-600' },
    { icon: Star, color: 'text-purple-500', bg: 'bg-gradient-to-br from-purple-400 to-indigo-500' },
    { icon: Star, color: 'text-blue-500', bg: 'bg-gradient-to-br from-blue-400 to-cyan-500' },
];

import { useTranslation } from 'react-i18next';

export function TopCustomers({ customers, isLoading }: TopCustomersProps) {
    const { t } = useTranslation();
    if (isLoading) {
        return (
            <Card className="border-0 shadow-lg md:shadow-xl rounded-xl md:rounded-2xl">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b p-3 md:p-6">
                    <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                        <Users className="h-4 w-4 md:h-5 md:w-5 text-indigo-500" />
                        {t('customer_dashboard.top_customers')}
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
        .sort((a, b) => b.totalPurchased - a.totalPurchased)
        .slice(0, 5);

    return (
        <Card className="border-0 shadow-lg md:shadow-xl overflow-hidden rounded-xl md:rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b p-3 md:p-6">
                <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                    <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        <Users className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <span className="hidden sm:inline">{t('customer_dashboard.top_customers')} ({t('wholesaler_dashboard.by_purchase')})</span>
                    <span className="sm:hidden">{t('customer_dashboard.top_customers')}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-6">
                {sortedCustomers.length > 0 ? (
                    <>
                        {/* Desktop View */}
                        <div className="hidden md:block space-y-3">
                            {sortedCustomers.map((customer, index) => {
                                const RankIcon = rankIcons[index]?.icon || Star;
                                const rankBg = rankIcons[index]?.bg || 'bg-gray-400';
                                const customerLink = customer.customerType === 'due'
                                    ? `/shopkeeper/customers/due/${customer._id}`
                                    : `/shopkeeper/customers/normal/${customer._id}`;

                                return (
                                    <Link
                                        key={customer._id || `customer-${index}`}
                                        href={customerLink}
                                        className="block"
                                    >
                                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200 group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${rankBg}`}>
                                                    <RankIcon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors text-base">
                                                        {customer.name === 'Walk-in Customer' ? t('common.walk_in_customer') : customer.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-sm text-gray-500">
                                                            {t('dashboard.total')}: {formatCurrency(customer.totalPurchased)}
                                                        </span>
                                                        <Badge variant="outline" className={`text-xs px-2 ${customer.customerType === 'due'
                                                            ? 'border-orange-200 text-orange-600 bg-orange-50'
                                                            : 'border-blue-200 text-blue-600 bg-blue-50'
                                                            }`}>
                                                            {customer.customerType === 'due' ? t('billing.status_due') : t('common.normal')}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {customer.outstandingDue > 0 ? (
                                                    <Badge variant="destructive" className="shadow-sm text-xs px-2">
                                                        {t('billing.due')}: {formatCurrency(customer.outstandingDue)}
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm text-xs px-2">
                                                        {t('wholesalers_list.table.clear_badge')}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Mobile View - Professional card design */}
                        <div className="md:hidden">
                            {sortedCustomers.map((customer, index) => {
                                const RankIcon = rankIcons[index]?.icon || Star;
                                const rankBg = rankIcons[index]?.bg || 'bg-gray-400';
                                const customerLink = customer.customerType === 'due'
                                    ? `/shopkeeper/customers/due/${customer._id}`
                                    : `/shopkeeper/customers/normal/${customer._id}`;

                                return (
                                    <Link
                                        key={customer._id || `customer-${index}`}
                                        href={customerLink}
                                        className="block"
                                    >
                                        <div className={`p-3 bg-white active:scale-[0.99] transition-all ${index !== sortedCustomers.length - 1 ? 'border-b-2 border-gray-200' : ''}`}>
                                            {/* Header Row - Rank, Name, Type */}
                                            <div className="flex items-center gap-2.5 mb-2">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg flex-shrink-0 ${rankBg}`}>
                                                    <RankIcon className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 text-sm truncate">{customer.name === 'Walk-in Customer' ? t('common.walk_in_customer') : customer.name}</p>
                                                </div>
                                                <Badge variant="outline" className={`text-[10px] px-1.5 flex-shrink-0 ${customer.customerType === 'due'
                                                    ? 'border-orange-200 text-orange-600 bg-orange-50'
                                                    : 'border-blue-200 text-blue-600 bg-blue-50'
                                                    }`}>
                                                    {customer.customerType === 'due' ? t('billing.status_due') : t('common.normal')}
                                                </Badge>
                                            </div>

                                            {/* Amount Row - Purchased, Paid, Due */}
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <div className="grid grid-cols-3 gap-2 text-center">
                                                    {/* Purchased */}
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 font-medium">{t('wholesalers_list.filters.purchases')}</p>
                                                        <p className="font-bold text-gray-900 text-sm">{formatCurrency(customer.totalPurchased)}</p>
                                                    </div>

                                                    {/* Paid */}
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 font-medium">{t('billing.paid')}</p>
                                                        <p className="font-bold text-green-600 text-sm">{formatCurrency(customer.totalPaid)}</p>
                                                    </div>

                                                    {/* Due */}
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 font-medium">{t('billing.due')}</p>
                                                        {customer.outstandingDue > 0 ? (
                                                            <p className="font-bold text-red-600 text-sm">{formatCurrency(customer.outstandingDue)}</p>
                                                        ) : (
                                                            <p className="font-bold text-green-600 text-sm">{t('wholesalers_list.table.nil_badge')}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="p-8 md:p-12 text-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-3 md:mb-4">
                            <Users className="h-6 w-6 md:h-8 md:w-8 text-indigo-400" />
                        </div>
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">{t('customer_dashboard.no_customers_found')}</h3>
                        <p className="text-gray-500 text-sm md:text-base">{t('customer_dashboard.add_customers_desc')}</p>
                    </div>
                )}
            </CardContent>
        </Card >
    );
}
