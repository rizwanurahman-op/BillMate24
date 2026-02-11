'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package, CreditCard, Calendar, LayoutDashboard, Loader2, Activity } from 'lucide-react';
import api from '@/config/axios';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
    WholesalerDashboardStats,
    TopWholesalers,
    RecentPurchases,
    PaymentMethodsBreakdown,
    TimeFilter,
    getDateRange,
    TimeFilterOption,
    DateRange
} from '.';

interface Wholesaler {
    _id: string;
    name: string;
    totalPurchased: number;
    totalPaid: number;
    outstandingDue: number;
}

interface Bill {
    _id: string;
    billNumber: string;
    entityId: string;
    entityName: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    createdAt: string;
    updatedAt: string;
}

interface Payment {
    _id: string;
    entityId: string;
    entityName: string;
    entityType: 'wholesaler' | 'customer';
    amount: number;
    paymentMethod: string;
    createdAt: string;
    billId?: string;
}

interface WholesalerPeriodData {
    _id: string;
    name: string;
    totalPurchased: number;
    totalPaid: number;
    outstandingDue: number;
}

interface InitialData {
    wholesalers: Wholesaler[];
    todayPurchases: Bill[];
    todayPayments: Payment[];
    duesData: {
        totalWholesalerDue: number;
        totalWholesalerPurchased: number;
        totalWholesalerPaid: number;
    };
}

interface WholesalerDashboardContainerProps {
    initialData: InitialData | null;
}

export default function WholesalerDashboardContainer({ initialData }: WholesalerDashboardContainerProps) {
    const { t } = useTranslation();
    const [timeFilter, setTimeFilter] = useState<TimeFilterOption>('today');
    const [dateRange, setDateRange] = useState<DateRange>(getDateRange('today'));

    const handleTimeFilterChange = (option: TimeFilterOption, range: DateRange) => {
        setTimeFilter(option);
        setDateRange(range);
    };

    // Format dates for API
    const startDate = format(dateRange.startDate, 'yyyy-MM-dd');
    const endDate = format(dateRange.endDate, 'yyyy-MM-dd');

    // Fetch all wholesalers (for count only)
    const {
        data: wholesalersData,
        isFetching: wholesalersFetching,
        isError: wholesalersError
    } = useQuery({
        queryKey: ['wholesalers-all'],
        queryFn: async () => {
            const response = await api.get('/wholesalers?limit=100');
            return response.data;
        },
        initialData: initialData ? { data: initialData.wholesalers } : undefined,
        staleTime: 30000,
        retry: 1,
    });

    // Fetch purchases for selected period
    const {
        data: purchasesData,
        isLoading: purchasesLoading,
        isError: purchasesError
    } = useQuery({
        queryKey: ['purchases-filtered', startDate, endDate],
        queryFn: async () => {
            const response = await api.get(`/bills?billType=purchase&startDate=${startDate}&endDate=${endDate}&limit=100`);
            return response.data;
        },
        initialData: timeFilter === 'today' && initialData ? { data: initialData.todayPurchases } : undefined,
        staleTime: 30000,
        retry: 1,
    });

    // Fetch wholesaler payments for selected period
    const { data: paymentsData } = useQuery({
        queryKey: ['wholesaler-payments', startDate, endDate],
        queryFn: async () => {
            const response = await api.get(`/payments?entityType=wholesaler&startDate=${startDate}&endDate=${endDate}&limit=1000`);
            return response.data;
        },
        initialData: timeFilter === 'today' && initialData ? { data: initialData.todayPayments } : undefined,
        staleTime: 30000,
        retry: 0,
    });

    // Fetch previous period data for comparison
    const timeDiff = dateRange.endDate.getTime() - dateRange.startDate.getTime();
    const subtractAmount = timeDiff < 86400000 ? 86400000 : (timeDiff + 86400000);

    const previousStartDate = format(
        new Date(dateRange.startDate.getTime() - subtractAmount),
        'yyyy-MM-dd'
    );
    const previousEndDate = format(
        new Date(dateRange.endDate.getTime() - subtractAmount),
        'yyyy-MM-dd'
    );

    const { data: previousPurchasesData } = useQuery({
        queryKey: ['previous-purchases', previousStartDate, previousEndDate],
        queryFn: async () => {
            const response = await api.get(`/bills?billType=purchase&startDate=${previousStartDate}&endDate=${previousEndDate}&limit=1000`);
            return response.data;
        },
        enabled: timeFilter !== 'all_time',
        staleTime: 30000,
        retry: 0,
    });

    // Fetch total dues data (includes opening balance)
    const { data: duesData } = useQuery({
        queryKey: ['wholesaler-dues'],
        queryFn: async () => {
            const response = await api.get('/wholesalers?limit=1000');
            const data = response.data.data || [];

            const totalWholesalerDue = data.reduce(
                (sum: number, w: any) => sum + (w.outstandingDue || 0),
                0
            );

            const totalWholesalerPurchased = data.reduce(
                (sum: number, w: any) => sum + (w.totalPurchased || 0),
                0
            );

            const totalWholesalerPaid = data.reduce(
                (sum: number, w: any) => sum + (w.totalPaid || 0),
                0
            );

            return {
                totalWholesalerDue,
                totalWholesalerPurchased,
                totalWholesalerPaid
            };
        },
        initialData: initialData?.duesData,
        refetchOnMount: 'always',
        staleTime: 0,
        retry: 0,
    });

    // Show elegant loading state only during initial load (no initial data)
    if ((wholesalersFetching || purchasesLoading) && !wholesalersData && !purchasesData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/20 flex items-center justify-center p-6">
                <div className={cn(
                    "flex w-full max-w-md flex-col items-center justify-center rounded-2xl py-16 text-center",
                    "bg-white border border-gray-200 shadow-2xl"
                )}>
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20"></div>
                            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg">
                                <Loader2 size={28} className="text-white animate-spin" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                {t('wholesaler_dashboard.loading')}
                            </p>
                            <p className="text-sm text-gray-600">Please wait while we fetch your data...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state - only if we have an actual error and no data to show
    const isCriticalError = (wholesalersError && !wholesalersData) || (purchasesError && !purchasesData);

    if (isCriticalError && !wholesalersFetching && !purchasesLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/20 flex items-center justify-center p-6">
                <div className={cn(
                    "flex w-full max-w-md flex-col items-center justify-center rounded-2xl py-16 text-center",
                    "bg-white border border-red-200 shadow-2xl"
                )}>
                    <div className="bg-red-100 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                        <Activity className="h-8 w-8 text-red-600" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">Failed to Load Dashboard</p>
                    <p className="mt-2 max-w-xs text-sm text-gray-600">Please try refreshing the page or contact support if the problem persists.</p>
                    <Button onClick={() => window.location.reload()} className="mt-4">
                        Refresh Page
                    </Button>
                </div>
            </div>
        );
    }

    const allWholesalers = (wholesalersData?.data || []) as Wholesaler[];
    const purchases = (purchasesData?.data || []) as Bill[];
    const payments = (paymentsData?.data || []) as Payment[];
    const previousPurchases = (previousPurchasesData?.data || []) as Bill[];

    // Calculate period-based wholesaler data
    const periodWholesalers = useMemo(() => {
        if (timeFilter === 'all_time') {
            return allWholesalers
                .map(w => ({
                    _id: w._id,
                    name: w.name,
                    totalPurchased: w.totalPurchased,
                    totalPaid: w.totalPaid,
                    outstandingDue: w.outstandingDue
                }))
                .sort((a, b) => b.totalPurchased - a.totalPurchased);
        }

        const wholesalerMap: Record<string, WholesalerPeriodData> = {};

        purchases.forEach(bill => {
            if (!wholesalerMap[bill.entityId]) {
                wholesalerMap[bill.entityId] = {
                    _id: bill.entityId,
                    name: bill.entityName,
                    totalPurchased: 0,
                    totalPaid: 0,
                    outstandingDue: 0,
                };
            }
            wholesalerMap[bill.entityId].totalPurchased += bill.totalAmount;
            wholesalerMap[bill.entityId].totalPaid += bill.paidAmount;
        });

        const paymentsByWholesaler: Record<string, number> = {};
        payments.forEach(payment => {
            if (!paymentsByWholesaler[payment.entityId]) {
                paymentsByWholesaler[payment.entityId] = 0;
            }
            paymentsByWholesaler[payment.entityId] += payment.amount;
        });

        Object.keys(wholesalerMap).forEach(wholesalerId => {
            wholesalerMap[wholesalerId].totalPaid = paymentsByWholesaler[wholesalerId] || wholesalerMap[wholesalerId].totalPaid;
            wholesalerMap[wholesalerId].outstandingDue =
                wholesalerMap[wholesalerId].totalPurchased - wholesalerMap[wholesalerId].totalPaid;
        });

        return Object.values(wholesalerMap).sort((a, b) => b.totalPurchased - a.totalPurchased);
    }, [purchases, payments, timeFilter, allWholesalers]);

    const periodPurchases = purchases.reduce((sum, b) => sum + b.totalAmount, 0);
    const periodPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const periodOutstanding = Math.max(0, periodPurchases - periodPaid);
    const previousPeriodPurchases = previousPurchases.reduce((sum, b) => sum + b.totalAmount, 0);

    const paymentBreakdown = useMemo(() => {
        const breakdown = { cash: 0, card: 0, online: 0 };
        payments.forEach(payment => {
            const method = payment.paymentMethod as keyof typeof breakdown;
            if (breakdown[method] !== undefined) {
                breakdown[method] += payment.amount;
            }
        });
        return breakdown;
    }, [payments]);

    return (
        <div className="p-3 md:p-6">
            {/* Welcome Section */}
            <div className="mb-4 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                <div className="w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
                            {t('wholesaler_dashboard.title')}
                        </h2>
                        <LayoutDashboard className="h-5 w-5 md:h-8 md:w-8 text-indigo-600" />
                    </div>
                    <div className="flex items-center justify-between mt-0.5 md:mt-1">
                        <p className="text-gray-600 text-xs md:text-base flex items-center gap-1.5 md:gap-2">
                            <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                            {format(new Date(), 'EEE, MMM d, yyyy')}
                        </p>
                        <div className="md:hidden min-w-[140px] max-w-[50%] flex justify-end">
                            <TimeFilter value={timeFilter} onChange={handleTimeFilterChange} className="w-full" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:flex md:items-center gap-2 md:gap-3 w-full md:w-auto">
                    <div className="hidden md:block">
                        <TimeFilter value={timeFilter} onChange={handleTimeFilterChange} />
                    </div>
                    <Link href="/shopkeeper/wholesalers" className="w-full md:w-auto">
                        <Button variant="outline" size="sm" className="shadow-sm w-full md:w-auto px-3 sm:px-4 h-9">
                            <Package className="h-4 w-4 mr-2" />
                            <span>{t('wholesaler_dashboard.all_wholesalers')}</span>
                        </Button>
                    </Link>
                    <Link href="/shopkeeper/wholesalers/payments" className="w-full md:w-auto">
                        <Button size="sm" className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/25 px-3 sm:px-4 h-9">
                            <CreditCard className="h-4 w-4 mr-2" />
                            <span>{t('wholesaler_dashboard.make_payment')}</span>
                        </Button>
                    </Link>
                </div>
            </div>

            <WholesalerDashboardStats
                totalWholesalers={periodWholesalers.length}
                totalPurchases={periodPurchases}
                totalPaid={periodPaid}
                totalOutstanding={periodOutstanding}
                thisMonthPurchases={periodPurchases}
                lastMonthPurchases={previousPeriodPurchases}
                billCount={purchases.length}
                timeFilter={timeFilter}
                duesData={duesData}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
                <TopWholesalers
                    wholesalers={periodWholesalers}
                    isLoading={purchasesLoading}
                />
                <PaymentMethodsBreakdown
                    breakdown={paymentBreakdown}
                    totalPaid={periodPaid}
                    isLoading={purchasesLoading}
                />
            </div>

            <div className="mt-3 md:mt-6">
                <RecentPurchases
                    purchases={purchases}
                    isLoading={purchasesLoading}
                />
            </div>
        </div>
    );
}
