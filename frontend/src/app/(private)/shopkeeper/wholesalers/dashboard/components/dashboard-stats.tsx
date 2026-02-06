'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, IndianRupee, CreditCard, AlertCircle, TrendingUp, TrendingDown, FileText, Wallet, Users } from 'lucide-react';

// ... existing interfaces and helpers ...

interface WholesalerDashboardStatsProps {
    totalWholesalers: number;
    totalPurchases: number;
    totalPaid: number;
    totalOutstanding: number;
    thisMonthPurchases: number;
    lastMonthPurchases: number;
    billCount?: number;
    timeFilter?: string;
    duesData?: {
        totalWholesalerDue: number;
        totalCustomerDue?: number;
        totalWholesalerPurchased?: number;
        totalWholesalerPaid?: number;
    };
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}



import { useTranslation } from 'react-i18next';

export function WholesalerDashboardStats({
    totalWholesalers,
    totalPurchases,
    totalPaid,
    totalOutstanding,
    thisMonthPurchases,
    lastMonthPurchases,
    billCount = 0,
    timeFilter = 'today',
    duesData
}: WholesalerDashboardStatsProps) {
    const { t } = useTranslation();
    const growth = lastMonthPurchases > 0
        ? ((thisMonthPurchases - lastMonthPurchases) / lastMonthPurchases * 100).toFixed(1)
        : thisMonthPurchases > 0 ? 100 : 0;

    const isPositiveGrowth = Number(growth) >= 0;
    const isAllTime = timeFilter === 'all_time';

    // For "All Time", use duesData which includes opening balance
    const displayOutstanding = isAllTime && duesData ? duesData.totalWholesalerDue : totalOutstanding;

    // Use actual totalPurchased from duesData for All Time (includes opening purchases)
    const displayPurchases = isAllTime && duesData?.totalWholesalerPurchased
        ? duesData.totalWholesalerPurchased
        : totalPurchases;

    // Use actual totalPaid from duesData for All Time (includes opening payments)
    const displayPaid = isAllTime && duesData?.totalWholesalerPaid
        ? duesData.totalWholesalerPaid
        : totalPaid;

    const paymentPercentage = displayPurchases > 0 ? (displayPaid / displayPurchases * 100).toFixed(0) : 0;

    // Determine if this is advance (negative outstanding) or due (positive outstanding)
    const isAdvance = displayOutstanding < 0;
    const outstandingAmount = Math.abs(displayOutstanding);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
            {/* Total Purchases / Total Payables */}
            <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white">
                <CardContent className="p-3 md:p-6">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                            <IndianRupee className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                            {billCount} {t('billing.bills')}
                        </Badge>
                    </div>
                    <h3 className="text-lg md:text-3xl font-bold">{formatCurrency(displayPurchases)}</h3>
                    <p className="text-white/80 text-xs md:text-sm mt-0.5 md:mt-1">
                        {t('wholesaler_dashboard.total_purchases')}
                    </p>
                    <div className="flex mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 items-center justify-between text-[10px] md:text-sm">
                        <span className="text-white/70">
                            {isAllTime ? t('wholesaler_dashboard.all_time') : t('wholesaler_dashboard.previous')}
                        </span>
                        <span className="font-semibold text-right">
                            {isAllTime ? t('wholesaler_dashboard.incl_opening') : formatCurrency(lastMonthPurchases)}
                        </span>
                    </div>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
            </Card>

            {/* Amount Paid */}
            <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <CardContent className="p-3 md:p-6">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                            <Wallet className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                            {paymentPercentage}%
                        </Badge>
                    </div>
                    <h3 className="text-lg md:text-3xl font-bold">{formatCurrency(displayPaid)}</h3>
                    <p className="text-white/80 text-xs md:text-sm mt-0.5 md:mt-1">
                        {t('wholesaler_dashboard.amount_paid')}{isAllTime ? ` ${t('wholesaler_dashboard.incl_bills')}` : ''}
                    </p>
                    <div className="flex mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 items-center justify-between text-[10px] md:text-sm">
                        <span className="text-white/70">{t('wholesaler_dashboard.payment_rate')}</span>
                        <span className="font-semibold">{paymentPercentage}%</span>
                    </div>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
            </Card>

            {/* Balance Due / Advance */}
            <Card className={`relative overflow-hidden border-0 shadow-lg md:shadow-xl text-white ${isAdvance
                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                : 'bg-gradient-to-br from-red-500 to-rose-600'
                }`}>
                <CardContent className="p-3 md:p-6">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                            <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                            {isAdvance ? t('wholesaler_dashboard.advance_badge') : t('billing.status_due')}
                        </Badge>
                    </div>
                    <h3 className="text-lg md:text-3xl font-bold">{formatCurrency(outstandingAmount)}</h3>
                    <p className="text-white/80 text-xs md:text-sm mt-0.5 md:mt-1 font-bold uppercase tracking-wider">
                        {isAdvance
                            ? t('wholesaler_dashboard.they_owe_you_advance')
                            : t('wholesaler_dashboard.outstanding')
                        }
                    </p>
                    <div className="flex mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 items-center justify-between text-[10px] md:text-sm">
                        <span className="text-white/70 italic">{t('wholesaler_dashboard.incl_opening')}</span>
                    </div>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
            </Card>

            {/* Growth / Wholesaler Count (All Time) */}
            <Card className={`relative overflow-hidden border-0 shadow-lg md:shadow-xl text-white ${isAllTime
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                : isPositiveGrowth
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                    : 'bg-gradient-to-br from-gray-500 to-slate-600'
                }`}>
                <CardContent className="p-3 md:p-6">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                            {isAllTime ? (
                                <Users className="h-4 w-4 md:h-5 md:w-5" />
                            ) : (
                                isPositiveGrowth ? <TrendingUp className="h-4 w-4 md:h-5 md:w-5" /> : <TrendingDown className="h-4 w-4 md:h-5 md:w-5" />
                            )}
                        </div>
                        <Badge className={`border-0 text-[10px] md:text-xs px-1.5 md:px-2 ${isAllTime ? 'bg-white/20 text-white' : (isPositiveGrowth ? 'bg-white/20 text-white' : 'bg-white text-gray-600')}`}>
                            {isAllTime ? t('wholesaler_dashboard.network') : (isPositiveGrowth ? '↑' : '↓')}
                        </Badge>
                    </div>
                    <h3 className="text-lg md:text-3xl font-bold">
                        {isAllTime ? totalWholesalers : `${isPositiveGrowth ? '+' : ''}${growth}%`}
                    </h3>
                    <p className="text-white/80 text-xs md:text-sm mt-0.5 md:mt-1">
                        {isAllTime ? t('wholesaler_dashboard.total_wholesalers') : t('wholesaler_dashboard.growth_vs_previous')}
                    </p>
                    <div className="flex mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 items-center justify-between text-[10px] md:text-sm">
                        <span className="text-white/70">
                            {isAllTime ? t('wholesaler_dashboard.active_vendors') : t('common.wholesalers')}
                        </span>
                        <span className="font-semibold text-right">
                            {isAllTime ? t('wholesaler_dashboard.lifetime') : `${totalWholesalers} ${t('wholesaler_dashboard.previous').toLowerCase()}`}
                        </span>
                    </div>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
            </Card>
        </div>
    );
}
