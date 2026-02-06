'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
    IndianRupee,
    TrendingUp,
    TrendingDown,
    Users,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    CreditCard,
    Banknote,
    Smartphone,
    Receipt,
    AlertTriangle,
    AlertCircle,
    Info,
    ChevronRight,
    Calendar,
    Clock,
    FileText,
    Activity,
    Target,
    Wallet,
    PieChart,
    Sparkles,
    Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import api from '@/config/axios';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface DashboardData {
    // Sales data (from bills)
    todaySales: number;
    yesterdaySales: number;
    weekSales: number;
    monthSales: number;
    // Collected data (from transactions/payments)
    todayCollected: number;
    yesterdayCollected: number;
    weekCollected: number;
    monthCollected: number;
    // Purchase data
    todayPurchases: number;
    monthPurchases: number;
    // Counts
    todayBillCount: number;
    monthBillCount: number;
    // Dues
    totalDueFromCustomers: number;
    totalDueToWholesalers: number;
    paymentMethodSplit: { cash: number; card: number; online: number };
    recentTransactions: any[];
    totalCustomers: number;
    totalWholesalers: number;
    customersWithDues: number;
    wholesalersWithDues: number;
    recentBills: any[];
    weeklyTrend: { date: string; sales: number; purchases: number; collected: number }[];
    topCustomersDue: any[];
    topWholesalersDue: any[];
    alerts: { type: string; message: string; count: number }[];
    totalLifetimeSales: number;
    totalLifetimePurchases: number;
    totalCollected: number;
    // Lifetime totals matching Revenue Report
    totalLifetimeCollected: number;
    totalLifetimePaid: number;
    // Opening balance breakdown
    openingSales?: number;
    openingPayments?: number;
    openingPurchases?: number;
    openingPurchasePayments?: number;
}

interface DashboardContainerProps {
    initialStats: DashboardData | null;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function getPercentageChange(current: number, previous: number): { value: number; isPositive: boolean } {
    if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: current >= 0 };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
}

export default function DashboardContainer({ initialStats }: DashboardContainerProps) {
    const { t } = useTranslation();

    const { data: dashboard, isFetching } = useQuery<DashboardData>({
        queryKey: ['shopkeeper-dashboard'],
        queryFn: async () => {
            const response = await api.get('/dashboard');
            return response.data.data;
        },
        initialData: initialStats || undefined,
        staleTime: 30000, // Consider data fresh for 30 seconds
        gcTime: 300000, // Keep in cache for 5 minutes
        refetchInterval: 60000, // Refresh every minute
        refetchOnMount: false, // Use cached data if available and not stale
        refetchOnWindowFocus: true, // Refetch when window regains focus
        retry: 0,
    });

    // Get current date info
    const now = new Date();
    const hours = now.getHours();
    const greetingKey = hours < 12 ? 'greeting_morning' : hours < 17 ? 'greeting_afternoon' : 'greeting_evening';
    const greeting = t(`dashboard.${greetingKey}`);

    // Show elegant loading state only during initial load (no initial data)
    if (isFetching && !dashboard) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-purple-50 flex items-center justify-center p-6">
                <div className={cn(
                    "flex w-full max-w-md flex-col items-center justify-center rounded-2xl py-16 text-center",
                    "bg-white border border-gray-200 shadow-2xl"
                )}>
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-purple-500/20"></div>
                            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                                <Loader2 size={28} className="text-white animate-spin" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">Loading Dashboard</p>
                            <p className="text-sm text-gray-600">Please wait while we fetch your data...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (!dashboard) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-purple-50 flex items-center justify-center p-6">
                <div className={cn(
                    "flex w-full max-w-md flex-col items-center justify-center rounded-2xl py-16 text-center",
                    "bg-white border border-red-200 shadow-2xl"
                )}>
                    <div className="bg-red-100 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                        <Activity className="h-8 w-8 text-red-600" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">Failed to Load Statistics</p>
                    <p className="mt-2 max-w-xs text-sm text-gray-600">Please try refreshing the page or contact support if the problem persists.</p>
                    <Button onClick={() => window.location.reload()} className="mt-4">
                        Refresh Page
                    </Button>
                </div>
            </div>
        );
    }

    const todaySalesChange = getPercentageChange(dashboard.todaySales, dashboard.yesterdaySales);
    const totalPayments = dashboard.paymentMethodSplit.cash + dashboard.paymentMethodSplit.card + dashboard.paymentMethodSplit.online;
    const netDue = dashboard.totalDueFromCustomers - dashboard.totalDueToWholesalers;
    const monthProfit = dashboard.monthSales - dashboard.monthPurchases;
    const allTimeProfit = dashboard.totalLifetimeSales - dashboard.totalLifetimePurchases;

    return (
        <div className="p-4 md:p-6">
            {/* Welcome Section - Compact on mobile */}
            <div className="mb-4 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent">
                            {greeting}!
                        </h2>
                        <Sparkles className="h-5 w-5 md:h-8 md:w-8 text-purple-900" />
                    </div>
                    <p className="text-gray-600 text-sm md:text-base mt-0.5 md:mt-1 flex items-center gap-2">
                        <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                        {format(now, 'EEE, MMM d, yyyy')}
                    </p>
                </div>
                {/* Quick action buttons - Hidden on mobile (using bottom nav instead) */}
                <div className="hidden md:flex gap-3">
                    <Link href="/shopkeeper/billing">
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25">
                            <Receipt className="h-4 w-4 mr-2" />
                            {t('dashboard.new_bill')}
                        </Button>
                    </Link>
                    <Link href="/shopkeeper/reports/daily">
                        <Button variant="outline">
                            <FileText className="h-4 w-4 mr-2" />
                            {t('common.reports')}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Alerts Section - Compact on mobile */}
            {dashboard.alerts && dashboard.alerts.length > 0 && (
                <div className="mb-4 md:mb-6 space-y-2">
                    {dashboard.alerts.map((alert, index) => (
                        <div
                            key={index}
                            className={`flex items-center justify-between p-3 md:p-4 rounded-xl border text-sm ${alert.type === 'error'
                                ? 'bg-red-50 border-red-200 text-red-800'
                                : alert.type === 'warning'
                                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                    : 'bg-blue-50 border-blue-200 text-blue-800'
                                }`}
                        >
                            <div className="flex items-center gap-2 md:gap-3">
                                {alert.type === 'error' ? (
                                    <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                                ) : alert.type === 'warning' ? (
                                    <AlertCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                                ) : (
                                    <Info className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                                )}
                                <span className="font-medium text-xs md:text-sm line-clamp-1">
                                    {alert.message.includes('customers')
                                        ? t('dashboard.customers_due_alert', { count: alert.count })
                                        : alert.message.includes('wholesalers')
                                            ? t('dashboard.wholesalers_due_alert', { count: alert.count })
                                            : alert.message
                                    }
                                </span>
                            </div>
                            <Link href="/shopkeeper/reports/dues">
                                <Button variant="ghost" size="sm" className="text-current hover:bg-current/10 text-xs whitespace-nowrap">
                                    {t('dashboard.view')} <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-0.5 md:ml-1" />
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Main Stats Grid - 2 columns on mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-8">
                {/* Today's Sales */}
                <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                    <CardContent className="p-3 md:p-6">
                        <div className="flex items-center justify-between mb-2 md:mb-4">
                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                <IndianRupee className="h-4 w-4 md:h-6 md:w-6" />
                            </div>
                            {todaySalesChange && (
                                <Badge className={`${todaySalesChange.isPositive ? 'bg-white/20' : 'bg-red-500/50'} text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2`}>
                                    {todaySalesChange.isPositive ? <ArrowUpRight className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5" /> : <ArrowDownRight className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5" />}
                                    {todaySalesChange.value.toFixed(0)}%
                                </Badge>
                            )}
                        </div>
                        <h3 className="text-lg md:text-3xl font-bold">{formatCurrency(dashboard.todaySales || 0)}</h3>
                        <p className="text-white/80 text-xs md:text-base mt-0.5 md:mt-1">{t('dashboard.today_sales')}</p>
                        <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20">
                            <div className="flex items-center justify-between text-[10px] md:text-sm">
                                <span className="text-white/70">{t('dashboard.collected')}</span>
                                <span className="font-semibold">{formatCurrency(dashboard.todayCollected || 0)}</span>
                            </div>
                            <p className="text-[10px] md:text-xs text-white/60 mt-1 flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                {t('dashboard.bills_count', { count: dashboard.todayBillCount || 0 })}
                            </p>
                        </div>
                    </CardContent>
                    <div className="absolute -bottom-4 -right-4 w-16 md:w-24 h-16 md:h-24 bg-white/10 rounded-full blur-2xl" />
                </Card>

                {/* Total Sales (Lifetime) */}
                <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    <CardContent className="p-3 md:p-6">
                        <div className="flex items-center justify-between mb-2 md:mb-4">
                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                <TrendingUp className="h-4 w-4 md:h-6 md:w-6" />
                            </div>
                            <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                                {t('dashboard.lifetime')}
                            </Badge>
                        </div>
                        <h3 className="text-lg md:text-3xl font-bold">{formatCurrency(Math.abs(dashboard.totalLifetimeSales || 0))}</h3>
                        <p className="text-white/80 text-xs md:text-base mt-0.5 md:mt-1">
                            {(dashboard.totalLifetimeSales || 0) >= 0 ? t('dashboard.total_sales') : t('reports.net_credit_balance')}
                        </p>
                        <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20">
                            <div className="flex items-center justify-between text-[10px] md:text-sm">
                                <span className="text-white/70">{t('dashboard.this_month')}</span>
                                <span className="font-semibold">{formatCurrency(dashboard.monthSales || 0)}</span>
                            </div>
                            <p className="text-[10px] md:text-xs text-white/60 mt-1 flex items-center gap-1">
                                <Info className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                {t('reports.including_opening_balance')}
                            </p>
                        </div>
                    </CardContent>
                    <div className="absolute -bottom-4 -right-4 w-16 md:w-24 h-16 md:h-24 bg-white/10 rounded-full blur-2xl" />
                </Card>

                {/* Due from Customers */}
                <Card className={`relative overflow-hidden border-0 shadow-lg md:shadow-xl text-white ${(dashboard.totalDueFromCustomers || 0) >= 0
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                    : 'bg-gradient-to-br from-rose-500 to-red-600'}`}>
                    <CardContent className="p-3 md:p-6">
                        <div className="flex items-center justify-between mb-2 md:mb-4">
                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                {(dashboard.totalDueFromCustomers || 0) >= 0 ? (
                                    <Users className="h-4 w-4 md:h-6 md:w-6" />
                                ) : (
                                    <ArrowDownRight className="h-4 w-4 md:h-6 md:w-6" />
                                )}
                            </div>
                            <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                                {(dashboard.totalDueFromCustomers || 0) >= 0 ? t('dashboard.total_due') : t('wholesaler_payments.detail.advance')}
                            </Badge>
                        </div>
                        <h3 className="text-lg md:text-3xl font-bold">{formatCurrency(Math.abs(dashboard.totalDueFromCustomers || 0))}</h3>
                        <p className="text-white/80 text-xs md:text-base mt-0.5 md:mt-1">
                            {(dashboard.totalDueFromCustomers || 0) >= 0 ? t('dashboard.to_collect') : t('dashboard.to_pay_customer_advance')}
                        </p>
                        <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20">
                            <p className="text-[10px] md:text-xs text-white/70">{t('dashboard.from_customers')}</p>
                            <p className="text-[10px] md:text-xs text-white/60 mt-1 flex items-center gap-1">
                                <Target className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                {t('dashboard.with_dues_count', { count: dashboard.customersWithDues || 0 })}
                            </p>
                        </div>
                    </CardContent>
                    <div className="absolute -bottom-4 -right-4 w-16 md:w-24 h-16 md:h-24 bg-white/10 rounded-full blur-2xl" />
                </Card>

                {/* Due to Wholesalers */}
                <Card className={`relative overflow-hidden border-0 shadow-lg md:shadow-xl text-white ${(dashboard.totalDueToWholesalers || 0) >= 0
                    ? 'bg-gradient-to-br from-orange-500 to-amber-600'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                    <CardContent className="p-3 md:p-6">
                        <div className="flex items-center justify-between mb-2 md:mb-4">
                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                {(dashboard.totalDueToWholesalers || 0) >= 0 ? (
                                    <Package className="h-4 w-4 md:h-6 md:w-6" />
                                ) : (
                                    <ArrowUpRight className="h-4 w-4 md:h-6 md:w-6" />
                                )}
                            </div>
                            <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                                {(dashboard.totalDueToWholesalers || 0) >= 0 ? t('dashboard.total_due') : t('wholesaler_payments.detail.advance')}
                            </Badge>
                        </div>
                        <h3 className="text-lg md:text-3xl font-bold">{formatCurrency(Math.abs(dashboard.totalDueToWholesalers || 0))}</h3>
                        <p className="text-white/80 text-xs md:text-base mt-0.5 md:mt-1">
                            {(dashboard.totalDueToWholesalers || 0) >= 0 ? t('dashboard.to_pay') : t('dashboard.to_receive_wholesaler_advance')}
                        </p>
                        <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20">
                            <p className="text-[10px] md:text-xs text-white/70">{t('dashboard.to_wholesalers')}</p>
                            <p className="text-[10px] md:text-xs text-white/60 mt-1 flex items-center gap-1">
                                <Target className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                {t('dashboard.pending_payments_count', { count: dashboard.wholesalersWithDues || 0 })}
                            </p>
                        </div>
                    </CardContent>
                    <div className="absolute -bottom-4 -right-4 w-16 md:w-24 h-16 md:h-24 bg-white/10 rounded-full blur-2xl" />
                </Card>
            </div>

            {/* Secondary Stats Row - Scrollable on mobile */}
            <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-8 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                <Card className={`border-0 shadow-md hover:shadow-lg transition-shadow flex-shrink-0 w-auto min-w-[11rem] md:w-auto ${allTimeProfit >= 0 ? 'bg-purple-50' : 'bg-rose-50'}`}>
                    <CardContent className="p-3 md:p-4 flex items-center gap-3 md:gap-4">
                        <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${allTimeProfit >= 0 ? 'bg-purple-100' : 'bg-rose-100'}`}>
                            <Activity className={`h-4 w-4 md:h-5 md:w-5 ${allTimeProfit >= 0 ? 'text-purple-600' : 'text-rose-600'}`} />
                        </div>
                        <div>
                            <p className={`text-base md:text-2xl font-bold ${allTimeProfit >= 0 ? 'text-purple-700' : 'text-rose-700'}`}>
                                {formatCurrency(Math.abs(allTimeProfit))}
                            </p>
                            <p className="text-xs md:text-sm text-gray-500">
                                {allTimeProfit >= 0 ? t('reports.total_profit') : t('reports.total_loss')} ({t('reports.all_time')})
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow flex-shrink-0 w-auto min-w-[11rem] md:w-auto">
                    <CardContent className="p-3 md:p-4 flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-green-100">
                            <Wallet className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-base md:text-2xl font-bold text-gray-900">{formatCurrency(dashboard.weekSales || 0)}</p>
                            <p className="text-xs md:text-sm text-gray-500">{t('dashboard.week_sales')}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow flex-shrink-0 w-auto min-w-[11rem] md:w-auto">
                    <CardContent className="p-3 md:p-4 flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-purple-100">
                            <Users className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-base md:text-2xl font-bold text-gray-900">{dashboard.totalCustomers || 0}</p>
                            <p className="text-xs md:text-sm text-gray-500">{t('common.customers')}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow flex-shrink-0 w-auto min-w-[11rem] md:w-auto">
                    <CardContent className="p-3 md:p-4 flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-blue-100">
                            <Package className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-base md:text-2xl font-bold text-gray-900">{dashboard.totalWholesalers || 0}</p>
                            <p className="text-xs md:text-sm text-gray-500">{t('common.wholesalers')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid - Stack on mobile */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-8">
                {/* Payment Methods */}
                <Card className="border-0 shadow-md md:shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 md:px-6 pt-3 md:pt-6">
                        <CardTitle className="text-sm md:text-lg flex items-center gap-2">
                            <PieChart className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
                            {t('dashboard.payment_methods')}
                        </CardTitle>
                        <Badge variant="secondary" className="text-[10px] md:text-xs">{t('dashboard.this_month')}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4 px-3 md:px-6 pb-3 md:pb-6">
                        {/* Cash */}
                        <div className="space-y-1.5 md:space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 md:p-2 rounded-lg bg-green-100">
                                        <Banknote className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                                    </div>
                                    <span className="font-medium text-xs md:text-sm">{t('dashboard.cash')}</span>
                                </div>
                                <span className="font-semibold text-xs md:text-sm">{formatCurrency(dashboard.paymentMethodSplit.cash || 0)}</span>
                            </div>
                            <Progress
                                value={totalPayments > 0 ? (dashboard.paymentMethodSplit.cash || 0) / totalPayments * 100 : 0}
                                className="h-1.5 md:h-2 bg-green-100"
                            />
                        </div>

                        {/* Card */}
                        <div className="space-y-1.5 md:space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 md:p-2 rounded-lg bg-blue-100">
                                        <CreditCard className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                                    </div>
                                    <span className="font-medium text-xs md:text-sm">{t('dashboard.card')}</span>
                                </div>
                                <span className="font-semibold text-xs md:text-sm">{formatCurrency(dashboard.paymentMethodSplit.card || 0)}</span>
                            </div>
                            <Progress
                                value={totalPayments > 0 ? (dashboard.paymentMethodSplit.card || 0) / totalPayments * 100 : 0}
                                className="h-1.5 md:h-2 bg-blue-100"
                            />
                        </div>

                        {/* Online */}
                        <div className="space-y-1.5 md:space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 md:p-2 rounded-lg bg-purple-100">
                                        <Smartphone className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
                                    </div>
                                    <span className="font-medium text-xs md:text-sm">{t('dashboard.online')}</span>
                                </div>
                                <span className="font-semibold text-xs md:text-sm">{formatCurrency(dashboard.paymentMethodSplit.online || 0)}</span>
                            </div>
                            <Progress
                                value={totalPayments > 0 ? (dashboard.paymentMethodSplit.online || 0) / totalPayments * 100 : 0}
                                className="h-1.5 md:h-2 bg-purple-100"
                            />
                        </div>

                        <div className="pt-3 md:pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-700 text-xs md:text-sm">{t('dashboard.total')}</span>
                                <span className="font-bold text-sm md:text-lg">{formatCurrency(totalPayments)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Dues - Combined */}
                <Card className="border-0 shadow-md md:shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 md:px-6 pt-3 md:pt-6">
                        <CardTitle className="text-sm md:text-lg flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
                            {t('dashboard.top_dues')}
                        </CardTitle>
                        <Link href="/shopkeeper/reports/dues">
                            <Button variant="ghost" size="sm" className="text-xs h-7 md:h-8">{t('dashboard.view_all')}</Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4 px-3 md:px-6 pb-3 md:pb-6">
                        {/* Customer Dues */}
                        <div>
                            <p className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase mb-1.5 md:mb-2">{t('dashboard.from_customers')}</p>
                            {dashboard.topCustomersDue && dashboard.topCustomersDue.length > 0 ? (
                                <div className="space-y-1.5 md:space-y-2">
                                    {dashboard.topCustomersDue.slice(0, 3).map((customer: any) => (
                                        <div key={customer._id} className={`flex items-center justify-between p-1.5 md:p-2 rounded-lg ${customer.outstandingDue >= 0 ? 'bg-red-50 hover:bg-red-100' : 'bg-blue-50 hover:bg-blue-100'} transition-colors`}>
                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full ${customer.outstandingDue >= 0 ? 'bg-red-200 text-red-700' : 'bg-blue-200 text-blue-700'} flex items-center justify-center font-semibold text-[10px] md:text-sm`}>
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-[11px] md:text-sm truncate max-w-[80px] md:max-w-none">{customer.name}</span>
                                            </div>
                                            <Badge variant={customer.outstandingDue >= 0 ? 'destructive' : 'default'} className={`font-mono text-[10px] md:text-xs px-1.5 md:px-2 ${customer.outstandingDue < 0 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''}`}>
                                                {formatCurrency(Math.abs(customer.outstandingDue))}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 text-center py-2">{t('dashboard.no_pending_dues')}</p>
                            )}
                        </div>

                        {/* Wholesaler Dues */}
                        <div>
                            <p className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase mb-1.5 md:mb-2">{t('dashboard.to_wholesalers')}</p>
                            {dashboard.topWholesalersDue && dashboard.topWholesalersDue.length > 0 ? (
                                <div className="space-y-1.5 md:space-y-2">
                                    {dashboard.topWholesalersDue.slice(0, 3).map((wholesaler: any) => (
                                        <div key={wholesaler._id} className={`flex items-center justify-between p-1.5 md:p-2 rounded-lg ${wholesaler.outstandingDue >= 0 ? 'bg-orange-50 hover:bg-orange-100' : 'bg-green-50 hover:bg-green-100'} transition-colors`}>
                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full ${wholesaler.outstandingDue >= 0 ? 'bg-orange-200 text-orange-700' : 'bg-green-200 text-green-700'} flex items-center justify-center font-semibold text-[10px] md:text-sm`}>
                                                    {wholesaler.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-[11px] md:text-sm truncate max-w-[80px] md:max-w-none">{wholesaler.name}</span>
                                            </div>
                                            <Badge className={`font-mono text-[10px] md:text-xs px-1.5 md:px-2 ${wholesaler.outstandingDue >= 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                                                {formatCurrency(Math.abs(wholesaler.outstandingDue))}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 text-center py-2">{t('dashboard.no_pending_payments')}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Bills */}
                <Card className="border-0 shadow-md md:shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 md:px-6 pt-3 md:pt-6">
                        <CardTitle className="text-sm md:text-lg flex items-center gap-2">
                            <Receipt className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                            {t('dashboard.recent_bills')}
                        </CardTitle>
                        <Link href="/shopkeeper/billing/history">
                            <Button variant="ghost" size="sm" className="text-xs h-7 md:h-8">{t('dashboard.view_all')}</Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
                        {dashboard.recentBills && dashboard.recentBills.length > 0 ? (
                            <div className="space-y-2 md:space-y-3">
                                {dashboard.recentBills.slice(0, 4).map((bill: any) => (
                                    <div key={bill._id} className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className={`p-1.5 md:p-2 rounded-lg ${bill.billType === 'sale' ? 'bg-green-100' : 'bg-orange-100'}`}>
                                                {bill.billType === 'sale' ? (
                                                    <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                                                ) : (
                                                    <ArrowDownRight className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-[11px] md:text-sm truncate max-w-[100px] md:max-w-none">{bill.entityName}</p>
                                                <p className="text-[10px] md:text-xs text-gray-500">
                                                    {bill.billNumber} • {format(new Date(bill.createdAt), 'dd MMM')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-semibold text-xs md:text-sm ${bill.billType === 'sale' ? 'text-green-600' : 'text-orange-600'}`}>
                                                {formatCurrency(bill.totalAmount)}
                                            </p>
                                            {bill.dueAmount > 0 && (
                                                <p className="text-[10px] md:text-xs text-red-500">{t('history.due')}: {formatCurrency(bill.dueAmount)}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 md:py-8 text-gray-500">
                                <Receipt className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 text-gray-300" />
                                <p className="text-xs md:text-sm">{t('dashboard.no_bills_yet')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions - Hidden on mobile (using bottom nav) */}
            <Card className="hidden md:block border-0 shadow-lg bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white">
                <CardContent className="py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-bold">{t('dashboard.quick_actions')}</h3>
                            <p className="text-white/70 text-sm">{t('dashboard.manage_business')}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link href="/shopkeeper/billing">
                                <Button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20">
                                    <Receipt className="h-4 w-4 mr-2" />
                                    {t('dashboard.create_bill')}
                                </Button>
                            </Link>
                            <Link href="/shopkeeper/wholesalers/payments">
                                <Button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20">
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    {t('dashboard.record_payment')}
                                </Button>
                            </Link>
                            <Link href="/shopkeeper/customers/due">
                                <Button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20">
                                    <Users className="h-4 w-4 mr-2" />
                                    {t('dashboard.view_customers')}
                                </Button>
                            </Link>
                            <Link href="/shopkeeper/wholesalers">
                                <Button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20">
                                    <Package className="h-4 w-4 mr-2" />
                                    {t('dashboard.view_wholesalers')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
