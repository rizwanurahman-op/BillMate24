'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Users, CreditCard, LayoutDashboard, Loader2, Activity } from 'lucide-react';
import api from '@/config/axios';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
    CustomerDashboardStats,
    TopCustomers,
    RecentSales,
    PendingDues,
    PaymentMethodsBreakdown,
    TimeFilter,
    getDateRange,
    TimeFilterOption,
    DateRange
} from '.';

interface Customer {
    _id: string;
    name: string;
    phone?: string;
    customerType: 'due' | 'normal';
    totalPurchased: number;
    totalPaid: number;
    outstandingDue: number;
    lastTransactionDate?: string;
}

interface Bill {
    _id: string;
    billNumber: string;
    entityId: string;
    entityName: string;
    entityType: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentMethod: 'cash' | 'card' | 'online';
    createdAt: string;
}

interface Payment {
    _id: string;
    entityId: string;
    entityName: string;
    entityType: 'wholesaler' | 'customer';
    amount: number;
    paymentMethod: string;
    createdAt: string;
}

interface CustomerPeriodData {
    _id: string;
    name: string;
    phone?: string;
    customerType: 'due' | 'normal';
    totalPurchased: number;
    totalPaid: number;
    outstandingDue: number;
    lastTransactionDate?: string;
}

interface InitialData {
    dueCustomers: Customer[];
    todaySales: Bill[];
    todayPayments: Payment[];
    statsData: any;
}

interface CustomerDashboardContainerProps {
    initialData: InitialData | null;
}

export default function CustomerDashboardContainer({ initialData }: CustomerDashboardContainerProps) {
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

    // Fetch due customers
    const {
        data: dueCustomersData,
        isFetching: customersFetching,
        isError: customersError
    } = useQuery({
        queryKey: ['due-customers-all'],
        queryFn: async () => {
            const response = await api.get('/customers?type=due&limit=100');
            return response.data;
        },
        initialData: initialData ? { data: initialData.dueCustomers } : undefined,
        staleTime: 30000,
        retry: 1,
    });

    // Fetch aggregate stats
    const { data: summaryStats } = useQuery({
        queryKey: ['customer-dashboard-summary-stats'],
        queryFn: async () => {
            const response = await api.get('/customers/stats?type=due');
            return response.data.data;
        },
        initialData: initialData?.statsData,
        staleTime: 0,
        refetchOnMount: 'always',
        retry: 0,
    });

    // Fetch sales for selected period
    const {
        data: salesData,
        isLoading: salesLoading,
        isError: salesError
    } = useQuery({
        queryKey: ['sales-filtered', startDate, endDate],
        queryFn: async () => {
            const response = await api.get(`/bills?billType=sale&startDate=${startDate}&endDate=${endDate}&limit=100`);
            return response.data;
        },
        initialData: timeFilter === 'today' && initialData ? { data: initialData.todaySales } : undefined,
        staleTime: 30000,
        retry: 1,
    });

    // Fetch customer payments for selected period
    const { data: paymentsData } = useQuery({
        queryKey: ['customer-payments', startDate, endDate],
        queryFn: async () => {
            const response = await api.get(`/payments?entityType=customer&startDate=${startDate}&endDate=${endDate}&limit=1000`);
            return response.data;
        },
        initialData: timeFilter === 'today' && initialData ? { data: initialData.todayPayments } : undefined,
        staleTime: 30000,
        retry: 0,
    });

    // Fetch previous period data
    const previousStartDate = format(
        new Date(dateRange.startDate.getTime() - (dateRange.endDate.getTime() - dateRange.startDate.getTime() + 86400000)),
        'yyyy-MM-dd'
    );
    const previousEndDate = format(
        new Date(dateRange.startDate.getTime() - 86400000),
        'yyyy-MM-dd'
    );

    const { data: previousSalesData } = useQuery({
        queryKey: ['previous-sales', previousStartDate, previousEndDate],
        queryFn: async () => {
            const response = await api.get(`/bills?billType=sale&startDate=${previousStartDate}&endDate=${previousEndDate}&limit=1000`);
            return response.data;
        },
        enabled: timeFilter !== 'all_time',
        staleTime: 30000,
        retry: 0,
    });

    // Show loading state
    if ((customersFetching || salesLoading) && !dueCustomersData && !salesData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/20 flex items-center justify-center p-6">
                <div className={cn(
                    "flex w-full max-w-md flex-col items-center justify-center rounded-2xl py-16 text-center",
                    "bg-white border border-gray-200 shadow-2xl"
                )}>
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20"></div>
                            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg">
                                <Loader2 size={28} className="text-white animate-spin" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                {t('customer_dashboard.loading')}
                            </p>
                            <p className="text-sm text-gray-600">Please wait while we fetch your data...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state - only if we have an actual error and no data to show
    const isCriticalError = (customersError && !dueCustomersData) || (salesError && !salesData);

    if (isCriticalError && !customersFetching && !salesLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/20 flex items-center justify-center p-6">
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

    const allDueCustomers = (dueCustomersData?.data || []).map((c: Customer) => ({
        ...c,
        customerType: 'due' as const
    }));
    const allCustomers = [...allDueCustomers];

    const sales = (salesData?.data || []) as Bill[];
    const payments = (paymentsData?.data || []) as Payment[];
    const previousSales = (previousSalesData?.data || []) as Bill[];

    // Calculate period-based customer data
    const periodCustomers = useMemo(() => {
        const customerMap: Record<string, CustomerPeriodData> = {};

        sales.forEach(bill => {
            if (!customerMap[bill.entityId]) {
                const existingCustomer = allCustomers.find(c => c._id === bill.entityId);
                customerMap[bill.entityId] = {
                    _id: bill.entityId,
                    name: bill.entityName,
                    phone: existingCustomer?.phone,
                    customerType: bill.entityType === 'due_customer' ? 'due' : 'normal',
                    totalPurchased: 0,
                    totalPaid: 0,
                    outstandingDue: 0,
                    lastTransactionDate: bill.createdAt,
                };
            }
            customerMap[bill.entityId].totalPurchased += bill.totalAmount;
            customerMap[bill.entityId].totalPaid += bill.paidAmount;

            if (new Date(bill.createdAt) > new Date(customerMap[bill.entityId].lastTransactionDate || '1970-01-01')) {
                customerMap[bill.entityId].lastTransactionDate = bill.createdAt;
            }
        });

        const paymentsByCustomer: Record<string, number> = {};
        payments.forEach(payment => {
            paymentsByCustomer[payment.entityId] = (paymentsByCustomer[payment.entityId] || 0) + payment.amount;
        });

        Object.keys(customerMap).forEach(customerId => {
            const billBasedPaid = customerMap[customerId].totalPaid;
            const paymentRecordsPaid = paymentsByCustomer[customerId] || 0;
            customerMap[customerId].totalPaid = Math.max(billBasedPaid, paymentRecordsPaid);
            customerMap[customerId].outstandingDue = Math.max(0,
                customerMap[customerId].totalPurchased - customerMap[customerId].totalPaid);
        });

        return Object.values(customerMap).sort((a, b) => b.totalPurchased - a.totalPurchased);
    }, [sales, payments, allCustomers]);

    const periodSales = sales.reduce((sum, b) => sum + b.totalAmount, 0);
    const billsCollected = sales.reduce((sum, b) => sum + b.paidAmount, 0);
    const paymentsCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const periodCollected = Math.max(billsCollected, paymentsCollected);
    const periodOutstanding = Math.max(0, periodSales - periodCollected);
    const previousPeriodSales = previousSales.reduce((sum, b) => sum + b.totalAmount, 0);

    const paymentBreakdown = useMemo(() => {
        const breakdown = { cash: 0, card: 0, online: 0 };
        sales.forEach(bill => {
            if (bill.paidAmount > 0 && bill.paymentMethod) {
                const method = bill.paymentMethod as keyof typeof breakdown;
                if (breakdown[method] !== undefined) {
                    breakdown[method] += bill.paidAmount;
                }
            }
        });
        return breakdown;
    }, [sales]);

    const customersWithDues = periodCustomers.filter(c => c.outstandingDue > 0);

    return (
        <div className="p-3 md:p-6">
            {/* Header with Filter */}
            <div className="mb-4 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                <div className="w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
                            {t('customer_dashboard.title')}
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
                    <Link href="/shopkeeper/customers/due" className="w-full md:w-auto">
                        <Button variant="outline" size="sm" className="shadow-sm w-full md:w-auto px-3 sm:px-4 h-9">
                            <CreditCard className="h-4 w-4 mr-2" />
                            <span>{t('customer_dashboard.due_customers')}</span>
                        </Button>
                    </Link>
                    <Link href="/shopkeeper/customers/normal" className="w-full md:w-auto">
                        <Button size="sm" className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 px-3 sm:px-4 h-9">
                            <Users className="h-4 w-4 mr-2" />
                            <span>{t('customer_dashboard.normal_customers')}</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <CustomerDashboardStats
                totalCustomers={periodCustomers.length}
                totalSales={periodSales}
                totalCollected={periodCollected}
                totalOutstanding={periodOutstanding}
                transactionCount={sales.length}
                thisMonthSales={periodSales}
                lastMonthSales={previousPeriodSales}
                timeFilter={timeFilter}
                statsData={summaryStats}
            />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
                <TopCustomers
                    customers={periodCustomers}
                    isLoading={salesLoading}
                />
                <PendingDues
                    customers={customersWithDues}
                    isLoading={salesLoading}
                />
            </div>

            {/* Payment Methods & Recent Sales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 mt-3 md:mt-6">
                <PaymentMethodsBreakdown
                    breakdown={paymentBreakdown}
                    totalCollected={periodCollected}
                    isLoading={salesLoading}
                />
                <RecentSales
                    sales={sales}
                    isLoading={salesLoading}
                />
            </div>
        </div>
    );
}
