'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, AlertCircle, IndianRupee } from 'lucide-react';

interface CustomerStatsProps {
    stats: {
        total: number;
        active: number;
        inactive: number;
        deleted: number;
        withDues: number;
        totalOutstanding: number;
        totalSales: number;
        totalPaid: number;
    };
    isLoading?: boolean;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function CustomerStats({ stats, isLoading }: CustomerStatsProps) {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6 mb-4 md:mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="border-0 shadow-lg md:shadow-xl animate-pulse rounded-xl md:rounded-2xl">
                        <CardContent className="p-3 md:p-6">
                            <div className="h-16 md:h-24 bg-gray-200 rounded-xl" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const activePercentage = stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6 mb-4 md:mb-6">
            {/* Total Customers */}
            <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-xl md:rounded-2xl">
                <CardContent className="p-3 md:p-6">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                            <Users className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                            {t('customers_list.stats.all_badge')}
                        </Badge>
                    </div>
                    <h3 className="text-xl md:text-3xl font-bold">{stats.total}</h3>
                    <p className="text-white/80 text-xs md:text-sm mt-0.5 md:mt-1">{t('customers_list.stats.total')}</p>
                    <div className="flex mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 items-center justify-between text-[10px] md:text-sm">
                        <span className="text-white/70">{t('customers_list.stats.active_rate')}</span>
                        <span className="font-semibold">{activePercentage}%</span>
                    </div>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
            </Card>

            {/* Active Customers */}
            <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl md:rounded-2xl">
                <CardContent className="p-3 md:p-6">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                            <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                            {t('customers_list.stats.active')}
                        </Badge>
                    </div>
                    <h3 className="text-xl md:text-3xl font-bold">{stats.active}</h3>
                    <p className="text-white/80 text-xs md:text-sm mt-0.5 md:mt-1">{t('customers_list.stats.active')}</p>
                    <div className="flex mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 items-center justify-between text-[10px] md:text-sm">
                        <span className="text-white/70">{t('customers_list.stats.inactive')}</span>
                        <span className="font-semibold">{stats.inactive} {t('customers_list.stats.customers')}</span>
                    </div>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
            </Card>

            {/* With Dues */}
            <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-xl md:rounded-2xl">
                <CardContent className="p-3 md:p-6">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                            <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                            {t('customers_list.stats.pending')}
                        </Badge>
                    </div>
                    <h3 className="text-xl md:text-3xl font-bold">{stats.withDues}</h3>
                    <p className="text-white/80 text-xs md:text-sm mt-0.5 md:mt-1">{t('customers_list.stats.with_dues')}</p>
                    <div className="flex mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 items-center justify-between text-[10px] md:text-sm">
                        <span className="text-white/70">{t('customers_list.stats.follow_up')}</span>
                        <span className="font-semibold">{stats.withDues > 0 ? '⚠️' : '✓'}</span>
                    </div>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
            </Card>

            {/* Outstanding - Dynamic based on sign */}
            <Card className={`relative overflow-hidden border-0 shadow-lg md:shadow-xl text-white rounded-xl md:rounded-2xl ${stats.totalOutstanding < 0
                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                : 'bg-gradient-to-br from-red-500 to-rose-600'
                }`}>
                <CardContent className="p-3 md:p-6">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                            <IndianRupee className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                            {stats.totalOutstanding < 0 ? t('customer_dashboard.advance_badge') : t('customers_list.filters.dues')}
                        </Badge>
                    </div>
                    <h3 className="text-xl md:text-3xl font-bold">
                        {formatCurrency(Math.abs(stats.totalOutstanding))}
                    </h3>
                    <p className="text-white/80 text-xs md:text-sm mt-0.5 md:mt-1 font-bold uppercase tracking-wider">
                        {stats.totalOutstanding < 0
                            ? t('customer_dashboard.you_owe_them_advance')
                            : t('customers_list.stats.outstanding')
                        }
                    </p>
                    <div className="flex mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 items-center justify-between text-[10px] md:text-sm">
                        <span className="text-white/70 italic">{t('customer_dashboard.incl_opening')}</span>
                    </div>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
            </Card>
        </div>
    );
}
