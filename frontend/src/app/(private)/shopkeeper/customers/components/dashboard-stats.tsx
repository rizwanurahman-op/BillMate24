'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, IndianRupee, CreditCard, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CustomerDashboardStatsProps {
    totalCustomers: number;
    totalSales: number;
    totalPaid: number;
    totalOutstanding: number;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}



export function CustomerDashboardStats({
    totalCustomers,
    totalSales,
    totalPaid,
    totalOutstanding,
}: CustomerDashboardStatsProps) {
    const { t } = useTranslation();

    // Calculate percentage
    // Note: If using "All Time" stats, Sales = Paid + Outstanding
    // In case there are discrepancies in legacy data, we just calculate % of paid vs sales
    const paymentPercentage = totalSales > 0 ? (totalPaid / totalSales * 100).toFixed(0) : 0;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
            {/* Total Due Customers */}
            <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl md:rounded-2xl">
                <CardContent className="p-3 md:p-6">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                            <Users className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                            {t('dashboard.total')}
                        </Badge>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold">{totalCustomers}</h3>
                    <p className="text-white/80 text-[10px] md:text-sm mt-0.5 md:mt-1">
                        {t('sidebar.due_customers')}
                    </p>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
            </Card>

            {/* Total Sales (All Time) */}
            <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-xl md:rounded-2xl">
                <CardContent className="p-3 md:p-6">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                            <IndianRupee className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                            {t('dashboard.lifetime')}
                        </Badge>
                    </div>
                    <h3 className="text-lg md:text-2xl font-bold">
                        {formatCurrency(totalSales)}
                    </h3>
                    <p className="text-white/80 text-[10px] md:text-sm mt-0.5 md:mt-1">
                        {t('dashboard.total_sales')}
                    </p>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
            </Card>

            {/* Amount Paid (All Time) */}
            <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-xl md:rounded-2xl">
                <CardContent className="p-3 md:p-6">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                            <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                            {paymentPercentage}%
                        </Badge>
                    </div>
                    <h3 className="text-lg md:text-2xl font-bold">
                        {formatCurrency(totalPaid)}
                    </h3>
                    <p className="text-white/80 text-[10px] md:text-sm mt-0.5 md:mt-1">
                        {t('dashboard.collected')}
                    </p>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
            </Card>

            {/* Outstanding Due (Total) */}
            <Card className={`relative overflow-hidden border-0 shadow-lg md:shadow-xl text-white rounded-xl md:rounded-2xl ${totalOutstanding > 0
                ? 'bg-gradient-to-br from-rose-500 to-red-600'
                : 'bg-gradient-to-br from-green-500 to-emerald-600'
                }`}>
                <CardContent className="p-3 md:p-6">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                            <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <Badge className={`border-0 text-[10px] md:text-xs px-1.5 md:px-2 ${totalOutstanding > 0 ? 'bg-white/20 text-white' : 'bg-white text-green-600'
                            }`}>
                            {totalOutstanding > 0 ? t('billing.due') : '✓'}
                        </Badge>
                    </div>
                    <h3 className="text-lg md:text-2xl font-bold">
                        {formatCurrency(totalOutstanding)}
                    </h3>
                    <p className="text-white/80 text-[10px] md:text-sm mt-0.5 md:mt-1">
                        {t('dashboard.total_due')}
                    </p>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
            </Card>
        </div>
    );
}
