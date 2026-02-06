'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, IndianRupee, CreditCard, AlertCircle, TrendingUp, TrendingDown, Receipt } from 'lucide-react';

interface CustomerDashboardStatsProps {
    totalCustomers: number;
    totalSales: number;
    totalCollected: number;
    totalOutstanding: number;
    transactionCount: number;
    thisMonthSales: number;
    lastMonthSales: number;
    timeFilter?: string;
    statsData?: {
        total: number;
        totalOutstanding: number;
        totalSales: number;
        totalPaid: number;
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

export function CustomerDashboardStats({
    totalCustomers,
    totalSales,
    totalCollected,
    totalOutstanding,
    transactionCount,
    thisMonthSales,
    lastMonthSales,
    timeFilter = 'today',
    statsData
}: CustomerDashboardStatsProps) {
    const { t } = useTranslation();
    const growth = lastMonthSales > 0
        ? ((thisMonthSales - lastMonthSales) / lastMonthSales * 100).toFixed(1)
        : thisMonthSales > 0 ? 100 : 0;

    const isPositiveGrowth = Number(growth) >= 0;
    const isAllTime = timeFilter === 'all_time';

    // For "All Time", use statsData which includes opening balance
    const displayOutstanding = isAllTime && statsData ? statsData.totalOutstanding : totalOutstanding;

    // Use actual totalSales from statsData for All Time (includes opening sales)
    const displaySales = isAllTime && statsData?.totalSales
        ? statsData.totalSales
        : totalSales;

    // Use actual totalPaid from statsData for All Time (includes opening payments)
    const displayPaid = isAllTime && statsData?.totalPaid
        ? statsData.totalPaid
        : totalCollected;

    const displayCustomers = isAllTime && statsData ? statsData.total : totalCustomers;

    const collectionRate = displaySales > 0 ? ((displayPaid / displaySales) * 100).toFixed(1) : 0;

    // Common styling for cards
    const cardContentClass = "p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col justify-between h-full relative z-10";
    const iconContainerClass = "p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm shadow-sm";
    const iconClass = "h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6";
    const labelClass = "text-[10px] sm:text-xs font-medium opacity-90 mb-1";
    const valueClass = "text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight";
    const subtextClass = "text-[10px] sm:text-xs opacity-80 mt-1 sm:mt-2 font-medium truncate";
    const bgBlurClass = "absolute -top-6 -right-6 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-3xl pointer-events-none";

    // Card Definition Helper
    const StatCard = ({
        title,
        value,
        subtext,
        icon: Icon,
        gradient,
        textColor = "text-white",
        subtextColor,
        extra
    }: any) => (
        <Card className={`relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300 ${gradient} ${textColor} rounded-xl sm:rounded-2xl`}>
            <div className={bgBlurClass} />
            <CardContent className={cardContentClass}>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                        <p className={labelClass}>{title}</p>
                        <p className={valueClass}>{value}</p>
                    </div>
                    <div className={`${iconContainerClass} shrink-0`}>
                        <Icon className={iconClass} />
                    </div>
                </div>
                <div>
                    {extra}
                    <p className={`${subtextClass} ${subtextColor}`}>{subtext}</p>
                </div>
            </CardContent>
        </Card>
    );

    return (
        // Adjusted grid to use max 3 columns even on large screens to give more breathing room for large numbers
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6 mb-6">

            {/* Customers */}
            <StatCard
                title={t('customer_dashboard.total_customers')}
                value={displayCustomers}
                subtext={isAllTime ? t('customer_dashboard.total_customers') : t('wholesaler_dashboard.previous')}
                icon={Users}
                gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
                subtextColor="text-indigo-100"
            />

            {/* Sales */}
            <StatCard
                title={t('customer_dashboard.total_sales')}
                value={formatCurrency(displaySales)}
                subtext={isAllTime ? t('wholesaler_dashboard.incl_opening') : t('customer_dashboard.total_sales')}
                icon={IndianRupee}
                gradient="bg-gradient-to-br from-emerald-500 to-green-600"
                subtextColor="text-emerald-100"
            />

            {/* Collected */}
            <StatCard
                title={t('customer_dashboard.total_collected')}
                value={formatCurrency(displayPaid)}
                subtext={isAllTime ? t('wholesaler_dashboard.incl_opening') : `${collectionRate}% ${t('wholesaler_dashboard.payment_rate')}`}
                icon={CreditCard}
                gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
                subtextColor="text-cyan-100"
                extra={!isAllTime && (
                    <div className="h-1 sm:h-1.5 w-full bg-black/20 rounded-full overflow-hidden mt-1 mb-1 text-right">
                        <div
                            className="h-full bg-white/90 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Number(collectionRate))}%` }}
                        />
                    </div>
                )}
            />

            {/* Outstanding */}
            <StatCard
                title={isAllTime
                    ? (displayOutstanding >= 0 ? t('customer_dashboard.total_outstanding') : t('customer_dashboard.you_owe_them_advance'))
                    : (displayOutstanding >= 0 ? t('customer_dashboard.they_owe_you') : t('customer_dashboard.you_owe_them'))
                }
                value={formatCurrency(Math.abs(displayOutstanding))}
                subtext={isAllTime
                    ? t('wholesaler_dashboard.incl_opening')
                    : (displayOutstanding >= 0 ? t('billing.status_due') : t('customer_dashboard.advance_paid'))
                }
                icon={AlertCircle}
                gradient={displayOutstanding >= 0 ? 'bg-gradient-to-br from-rose-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}
                subtextColor={displayOutstanding >= 0 ? 'text-rose-100' : 'text-green-100'}
            />

            {/* Bills */}
            <StatCard
                title={t('billing.bills')}
                value={transactionCount}
                subtext={t('customer_dashboard.recent_sales')}
                icon={Receipt}
                gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                subtextColor="text-amber-100"
            />

            {/* Growth */}
            <StatCard
                title={t('wholesaler_dashboard.network')}
                value={`${isPositiveGrowth ? '+' : ''}${growth}%`}
                subtext={t('wholesaler_dashboard.growth_vs_previous')}
                icon={isPositiveGrowth ? TrendingUp : TrendingDown}
                gradient={isPositiveGrowth ? 'bg-gradient-to-br from-teal-500 to-cyan-600' : 'bg-gradient-to-br from-slate-500 to-gray-600'}
                subtextColor={isPositiveGrowth ? 'text-teal-100' : 'text-slate-200'}
            />
        </div>
    );
}
