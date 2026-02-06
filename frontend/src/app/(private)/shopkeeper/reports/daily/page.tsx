'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, TrendingUp, TrendingDown, IndianRupee, Receipt, Wallet, CreditCard, AlertCircle, ArrowUpRight, ArrowDownRight, ArrowDownLeft, BarChart3, X, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Info } from 'lucide-react';
import { Header } from '@/components/app/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import api from '@/config/axios';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, subDays } from 'date-fns';

interface Bill {
    _id: string;
    billNumber: string;
    billType: 'purchase' | 'sale';
    entityName: string;
    entityType: string;
    entityId: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentMethod: string;
    createdAt: string;
}

interface Payment {
    _id: string;
    entityId: string;
    entityType: 'wholesaler' | 'customer';
    amount: number;
    paymentMethod: string;
    createdAt: string;
}

interface PaginatedResponse<T> {
    data: T[];
    pagination: { total: number };
}

type TimeFilterOption = 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year' | 'custom';

const getFilterLabels = (t: any): Record<TimeFilterOption, string> => ({
    all: t('history.time_filters.all'),
    today: t('history.time_filters.today'),
    yesterday: t('history.time_filters.yesterday'),
    this_week: t('history.time_filters.this_week'),
    this_month: t('history.time_filters.this_month'),
    this_year: t('history.time_filters.this_year'),
    custom: t('reports.custom_range'),
});

const ITEMS_PER_PAGE = 10;

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}



function getDateRange(option: TimeFilterOption): { startDate: string; endDate: string } {
    const now = new Date();
    switch (option) {
        case 'all':
            return { startDate: '', endDate: '' };
        case 'today':
            return { startDate: format(startOfDay(now), 'yyyy-MM-dd'), endDate: format(endOfDay(now), 'yyyy-MM-dd') };
        case 'yesterday':
            const yesterday = subDays(now, 1);
            return { startDate: format(startOfDay(yesterday), 'yyyy-MM-dd'), endDate: format(endOfDay(yesterday), 'yyyy-MM-dd') };
        case 'this_week':
            return { startDate: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), endDate: format(now, 'yyyy-MM-dd') };
        case 'this_month':
            return { startDate: format(startOfMonth(now), 'yyyy-MM-dd'), endDate: format(now, 'yyyy-MM-dd') };
        case 'this_year':
            return { startDate: format(startOfYear(now), 'yyyy-MM-dd'), endDate: format(now, 'yyyy-MM-dd') };
        default:
            return { startDate: format(now, 'yyyy-MM-dd'), endDate: format(now, 'yyyy-MM-dd') };
    }
}

export default function RevenueReportPage() {
    const { t, i18n } = useTranslation();
    // Date range filter state
    const [timeFilter, setTimeFilter] = useState<TimeFilterOption>('today');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
    const [dateRange, setDateRange] = useState(getDateRange('today'));

    // Transactions filter state
    const [txnSearch, setTxnSearch] = useState('');
    const [txnTypeFilter, setTxnTypeFilter] = useState<'all' | 'sale' | 'purchase'>('all');
    const [txnMethodFilter, setTxnMethodFilter] = useState<'all' | 'cash' | 'card' | 'online'>('all');
    const [txnStatusFilter, setTxnStatusFilter] = useState<'all' | 'paid' | 'partial' | 'pending'>('all');
    const [txnPage, setTxnPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['revenue-report', dateRange.startDate, dateRange.endDate],
        queryFn: async () => {
            const params = new URLSearchParams({ limit: '1000' });
            if (dateRange.startDate) params.append('startDate', dateRange.startDate);
            if (dateRange.endDate) params.append('endDate', dateRange.endDate);

            const response = await api.get<PaginatedResponse<Bill>>(`/bills?${params.toString()}`);
            return response.data;
        },
        refetchOnMount: 'always',
        staleTime: 0,
    });

    // Fetch payments for accurate cash flow calculation
    const { data: paymentsData } = useQuery({
        queryKey: ['revenue-payments', dateRange.startDate, dateRange.endDate],
        queryFn: async () => {
            const params = new URLSearchParams({ limit: '1000' });
            if (dateRange.startDate) params.append('startDate', dateRange.startDate);
            if (dateRange.endDate) params.append('endDate', dateRange.endDate);

            const response = await api.get<{ data: Payment[] }>(`/payments?${params.toString()}`);
            return response.data;
        },
        refetchOnMount: 'always',
        staleTime: 0,
    });

    // Fetch total outstanding dues (all time) for receivables and payables
    const { data: duesData } = useQuery({
        queryKey: ['total-dues'],
        queryFn: async () => {
            const [customersRes, wholesalersRes] = await Promise.all([
                api.get<PaginatedResponse<any>>('/customers?limit=1000'),
                api.get<PaginatedResponse<any>>('/wholesalers?limit=1000'),
            ]);

            // Calculate totals from all customers and wholesalers
            const customers = customersRes.data.data || [];
            const wholesalers = wholesalersRes.data.data || [];

            const totalCustomerDue = customers.reduce((sum: number, c: any) => sum + (c.outstandingDue || 0), 0);
            const totalWholesalerDue = wholesalers.reduce((sum: number, w: any) => sum + (w.outstandingDue || 0), 0);

            // Total sales and purchases (including opening balances)
            const totalLifetimeSales = customers.reduce((sum: number, c: any) => sum + (c.totalSales || 0), 0);
            const totalLifetimePurchases = wholesalers.reduce((sum: number, w: any) => sum + (w.totalPurchased || 0), 0);

            // Total collected and paid (including opening payments)
            const totalLifetimeCollected = customers.reduce((sum: number, c: any) => sum + (c.totalPaid || 0), 0);
            const totalLifetimePaid = wholesalers.reduce((sum: number, w: any) => sum + (w.totalPaid || 0), 0);

            // Opening balance breakdown for clearer reporting
            const openingSales = customers.reduce((sum: number, c: any) => sum + (c.openingSales || 0), 0);
            const openingPayments = customers.reduce((sum: number, c: any) => sum + (c.openingPayments || 0), 0);
            const openingPurchases = wholesalers.reduce((sum: number, w: any) => sum + (w.openingPurchases || 0), 0);
            const openingPurchasePayments = wholesalers.reduce((sum: number, w: any) => sum + (w.openingPayments || 0), 0);

            return {
                totalCustomerDue,
                totalWholesalerDue,
                totalLifetimeSales,
                totalLifetimePurchases,
                totalLifetimeCollected,
                totalLifetimePaid,
                openingSales,
                openingPayments,
                openingPurchases,
                openingPurchasePayments,
            };
        },
        refetchOnMount: 'always',
        staleTime: 0,
    });

    const bills = (data?.data || []) as Bill[];
    const payments = (paymentsData?.data || []) as Payment[];

    // Calculate comprehensive stats using payments for cash flow
    const stats = useMemo(() => {
        const saleBills = bills.filter(b => b.billType === 'sale');
        const purchaseBills = bills.filter(b => b.billType === 'purchase');

        // Accrual stats from bills
        const totalSalesAmount = saleBills.reduce((sum, b) => sum + b.totalAmount, 0);
        const totalPurchasesAmount = purchaseBills.reduce((sum, b) => sum + b.totalAmount, 0);

        // Cash flow from bill.paidAmount (captures instant payments)
        const salesCollectedFromBills = saleBills.reduce((sum, b) => sum + b.paidAmount, 0);
        const purchasesPaidFromBills = purchaseBills.reduce((sum, b) => sum + b.paidAmount, 0);

        // Cash flow from payment records (captures separate payments)
        const customerPayments = payments.filter(p => p.entityType === 'customer');
        const wholesalerPayments = payments.filter(p => p.entityType === 'wholesaler');
        const salesCollectedFromPayments = customerPayments.reduce((sum, p) => sum + p.amount, 0);
        const purchasesPaidFromPayments = wholesalerPayments.reduce((sum, p) => sum + p.amount, 0);

        // Use MAX to avoid undercounting (handles both old and new data)
        const totalSalesCollected = Math.max(salesCollectedFromBills, salesCollectedFromPayments);
        const totalPurchasesPaid = Math.max(purchasesPaidFromBills, purchasesPaidFromPayments);

        const totalSalesDue = totalSalesAmount - totalSalesCollected;
        const totalPurchasesDue = totalPurchasesAmount - totalPurchasesPaid;

        const netCashFlow = totalSalesCollected - totalPurchasesPaid;
        const grossProfit = totalSalesAmount - totalPurchasesAmount;

        // Breakdown from Bills
        const breakdownFromBills = {
            cash: { sales: 0, purchases: 0 },
            card: { sales: 0, purchases: 0 },
            online: { sales: 0, purchases: 0 },
        };

        saleBills.forEach(b => {
            if (b.paidAmount > 0 && b.paymentMethod) {
                const method = b.paymentMethod.toLowerCase() as keyof typeof breakdownFromBills;
                if (breakdownFromBills[method]) breakdownFromBills[method].sales += b.paidAmount;
            }
        });
        purchaseBills.forEach(b => {
            if (b.paidAmount > 0 && b.paymentMethod) {
                const method = b.paymentMethod.toLowerCase() as keyof typeof breakdownFromBills;
                if (breakdownFromBills[method]) breakdownFromBills[method].purchases += b.paidAmount;
            }
        });

        // Breakdown from Payments (for separated records)
        const breakdownFromPayments = {
            cash: { sales: 0, purchases: 0 },
            card: { sales: 0, purchases: 0 },
            online: { sales: 0, purchases: 0 },
        };

        customerPayments.forEach(p => {
            const method = p.paymentMethod?.toLowerCase() as keyof typeof breakdownFromPayments;
            if (breakdownFromPayments[method]) breakdownFromPayments[method].sales += p.amount;
        });
        wholesalerPayments.forEach(p => {
            const method = p.paymentMethod?.toLowerCase() as keyof typeof breakdownFromPayments;
            if (breakdownFromPayments[method]) breakdownFromPayments[method].purchases += p.amount;
        });

        // Select the best source matching the totals logic (MAX strategy)
        // If payments collection has more data (or equal), use it as it's likely more complete/updated
        const usePaymentsForSales = salesCollectedFromPayments >= salesCollectedFromBills;
        const usePaymentsForPurchases = purchasesPaidFromPayments >= purchasesPaidFromBills;

        const paymentBreakdown = {
            cash: {
                sales: usePaymentsForSales ? breakdownFromPayments.cash.sales : breakdownFromBills.cash.sales,
                purchases: usePaymentsForPurchases ? breakdownFromPayments.cash.purchases : breakdownFromBills.cash.purchases
            },
            card: {
                sales: usePaymentsForSales ? breakdownFromPayments.card.sales : breakdownFromBills.card.sales,
                purchases: usePaymentsForPurchases ? breakdownFromPayments.card.purchases : breakdownFromBills.card.purchases
            },
            online: {
                sales: usePaymentsForSales ? breakdownFromPayments.online.sales : breakdownFromBills.online.sales,
                purchases: usePaymentsForPurchases ? breakdownFromPayments.online.purchases : breakdownFromBills.online.purchases
            },
        };

        // Entity breakdown for sales
        const salesByEntity: Record<string, number> = {};
        saleBills.forEach(b => {
            const key = b.entityType?.replace('_', ' ') || 'Other';
            salesByEntity[key] = (salesByEntity[key] || 0) + b.totalAmount;
        });

        return {
            totalSalesAmount,
            totalSalesCollected,
            totalSalesDue,
            totalPurchasesAmount,
            totalPurchasesPaid,
            totalPurchasesDue,
            netCashFlow,
            grossProfit,
            transactionCount: bills.length,
            salesCount: saleBills.length,
            purchasesCount: purchaseBills.length,
            paymentBreakdown,
            salesByEntity,
        };
    }, [bills, payments]);

    // Day-wise breakdown using both bills and payments for accurate cash flow
    const dayWiseData = useMemo(() => {
        // Collect all unique dates from bills and payments
        const allDates = new Set<string>();
        bills.forEach(b => allDates.add(format(new Date(b.createdAt), 'yyyy-MM-dd')));
        payments.forEach(p => allDates.add(format(new Date(p.createdAt), 'yyyy-MM-dd')));

        if (allDates.size === 0) return [];

        const billsByDate: Record<string, Bill[]> = {};
        bills.forEach(bill => {
            const date = format(new Date(bill.createdAt), 'yyyy-MM-dd');
            if (!billsByDate[date]) billsByDate[date] = [];
            billsByDate[date].push(bill);
        });

        const paymentsByDate: Record<string, Payment[]> = {};
        payments.forEach(p => {
            const date = format(new Date(p.createdAt), 'yyyy-MM-dd');
            if (!paymentsByDate[date]) paymentsByDate[date] = [];
            paymentsByDate[date].push(p);
        });

        return Array.from(allDates)
            .map((date) => {
                const dayBills = billsByDate[date] || [];
                const dayPayments = paymentsByDate[date] || [];

                const saleBills = dayBills.filter(b => b.billType === 'sale');
                const purchaseBills = dayBills.filter(b => b.billType === 'purchase');

                // Accrual from bills
                const sales = saleBills.reduce((sum, b) => sum + b.totalAmount, 0);
                const purchases = purchaseBills.reduce((sum, b) => sum + b.totalAmount, 0);

                // Cash flow from bill.paidAmount (instant payments)
                const salesCollectedFromBills = saleBills.reduce((sum, b) => sum + b.paidAmount, 0);
                const purchasesPaidFromBills = purchaseBills.reduce((sum, b) => sum + b.paidAmount, 0);

                // Cash flow from payment records
                const salesCollectedFromPayments = dayPayments.filter(p => p.entityType === 'customer').reduce((sum, p) => sum + p.amount, 0);
                const purchasesPaidFromPayments = dayPayments.filter(p => p.entityType === 'wholesaler').reduce((sum, p) => sum + p.amount, 0);

                // Use MAX to avoid undercounting
                const salesCollected = Math.max(salesCollectedFromBills, salesCollectedFromPayments);
                const purchasesPaid = Math.max(purchasesPaidFromBills, purchasesPaidFromPayments);

                return {
                    date,
                    displayDate: format(new Date(date), 'dd MMM yyyy'),
                    dayName: format(new Date(date), 'EEE'),
                    sales,
                    salesCollected,
                    purchases,
                    purchasesPaid,
                    profit: sales - purchases,
                    cashFlow: salesCollected - purchasesPaid,
                    transactions: dayBills.length,
                };
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [bills, payments]);

    // Filtered and paginated transactions
    const filteredTransactions = useMemo(() => {
        let filtered = [...bills];

        // Search filter
        if (txnSearch) {
            filtered = filtered.filter(b =>
                b.billNumber.toLowerCase().includes(txnSearch.toLowerCase()) ||
                b.entityName.toLowerCase().includes(txnSearch.toLowerCase())
            );
        }

        // Type filter
        if (txnTypeFilter !== 'all') {
            filtered = filtered.filter(b => b.billType === txnTypeFilter);
        }

        // Payment method filter
        if (txnMethodFilter !== 'all') {
            filtered = filtered.filter(b => b.paymentMethod === txnMethodFilter);
        }

        // Status filter
        if (txnStatusFilter !== 'all') {
            filtered = filtered.filter(b => {
                const due = b.dueAmount || (b.totalAmount - b.paidAmount);
                if (txnStatusFilter === 'paid') return due <= 0;
                if (txnStatusFilter === 'partial') return due > 0 && b.paidAmount > 0;
                if (txnStatusFilter === 'pending') return b.paidAmount === 0;
                return true;
            });
        }

        // Sort by date descending
        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [bills, txnSearch, txnTypeFilter, txnMethodFilter, txnStatusFilter]);

    const txnTotalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
    const paginatedTransactions = filteredTransactions.slice(
        (txnPage - 1) * ITEMS_PER_PAGE,
        txnPage * ITEMS_PER_PAGE
    );

    const clearTxnFilters = () => {
        setTxnSearch('');
        setTxnTypeFilter('all');
        setTxnMethodFilter('all');
        setTxnStatusFilter('all');
        setTxnPage(1);
    };

    const hasTxnFilters = txnSearch || txnTypeFilter !== 'all' || txnMethodFilter !== 'all' || txnStatusFilter !== 'all';

    const handleTimeFilterChange = (option: TimeFilterOption) => {
        if (option === 'custom') {
            setCustomStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
            setCustomEndDate(format(new Date(), 'yyyy-MM-dd'));
            setIsCustomDialogOpen(true);
        } else {
            setTimeFilter(option);
            setDateRange(getDateRange(option));
        }
    };

    const handleCustomApply = () => {
        if (customStartDate && customEndDate) {
            setTimeFilter('custom');
            setDateRange({ startDate: customStartDate, endDate: customEndDate });
            setIsCustomDialogOpen(false);
        }
    };

    const getFilterLabel = () => {
        const filterLabels = getFilterLabels(t);
        if (timeFilter === 'custom') {
            if (i18n.language === 'ml') {
                const formatter = new Intl.DateTimeFormat('ml-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                return `${formatter.format(new Date(dateRange.startDate))} - ${formatter.format(new Date(dateRange.endDate))}`;
            }
            return `${format(new Date(dateRange.startDate), 'dd MMM')} - ${format(new Date(dateRange.endDate), 'dd MMM yyyy')}`;
        }
        return filterLabels[timeFilter];
    };

    // For "All Time" filter, use the comprehensive lifetime data from database
    // The outstandingDue already includes opening balances, so no need to calculate separately

    // Calculate opening balances (difference between lifetime and period totals)
    const openingCustomerDue = (duesData?.totalLifetimeSales || 0) - stats.totalSalesAmount;
    const openingWholesalerDue = (duesData?.totalLifetimePurchases || 0) - stats.totalPurchasesAmount;
    const allTimeNetCashFlow = (duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0);


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-purple-50">
            <Header title={t('reports.revenue_report')} />

            <div className="p-3 md:p-6">
                {/* Header with Filter - Mobile First */}
                <div className="flex flex-row justify-between items-center gap-3 mb-4 md:mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent">
                                <span className="hidden sm:inline">{t('reports.revenue_report')}</span>
                                <span className="sm:hidden">{t('common.reports')}</span>
                            </h2>
                            <BarChart3 className="h-5 w-5 md:h-8 md:w-8 text-purple-900" />
                        </div>
                        <p className="text-gray-600 mt-0.5 md:mt-1 text-xs md:text-base hidden sm:block">{t('reports.comprehensive_view')}</p>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="flex items-center gap-1 md:gap-2 min-w-0 md:min-w-[200px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 h-9 md:h-10 px-2 md:px-4 text-xs md:text-sm">
                                <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                <span className="font-medium hidden sm:inline">{getFilterLabel()}</span>
                                <span className="font-medium sm:hidden">{timeFilter === 'today' ? t('history.time_filters.today') : timeFilter === 'custom' ? t('reports.custom_range') : '...'}</span>
                                <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4 opacity-70" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            {(['all', 'today', 'yesterday', 'this_week', 'this_month', 'this_year'] as TimeFilterOption[]).map((option) => (
                                <DropdownMenuItem
                                    key={option}
                                    onClick={() => handleTimeFilterChange(option)}
                                    className={timeFilter === option ? 'bg-purple-50 text-purple-700' : ''}
                                >
                                    {getFilterLabels(t)[option]}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleTimeFilterChange('custom')}>
                                {t('reports.custom_range')}...
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Summary Stats - 2x2 on mobile */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6 mb-4 md:mb-6">
                    {/* Total Sales */}
                    <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-xl md:rounded-2xl">
                        <CardContent className="p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-3">
                                <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                                    {stats.salesCount}
                                </Badge>
                            </div>
                            <h3 className="text-lg md:text-3xl font-bold">
                                <span className="md:hidden">{formatCurrency(
                                    timeFilter === 'all'
                                        ? (duesData?.totalLifetimeSales || 0)
                                        : stats.totalSalesAmount
                                )}</span>
                                <span className="hidden md:inline">{formatCurrency(
                                    timeFilter === 'all'
                                        ? (duesData?.totalLifetimeSales || 0)
                                        : stats.totalSalesAmount
                                )}</span>
                            </h3>
                            <p className="text-white/80 text-[10px] md:text-sm mt-0.5 md:mt-1">
                                {t('reports.total_sales')}{timeFilter === 'all' ? ` (${t('reports.all_time')})` : ''}
                            </p>
                            <div className="flex mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 items-center justify-between text-[10px] md:text-sm">
                                <span className="text-white/70 italic">
                                    {timeFilter === 'all'
                                        ? t('reports.incl_opening_balance')
                                        : t('reports.collected')}
                                </span>
                                <span className="font-semibold">
                                    {formatCurrency(timeFilter === 'all' ? (duesData?.totalLifetimeCollected || 0) : stats.totalSalesCollected)}
                                </span>
                            </div>
                        </CardContent>
                        <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
                    </Card>

                    {/* Total Purchases */}
                    <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-xl md:rounded-2xl">
                        <CardContent className="p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-3">
                                <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                    <TrendingDown className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                                    {stats.purchasesCount}
                                </Badge>
                            </div>
                            <h3 className="text-lg md:text-3xl font-bold">
                                <span className="md:hidden">{formatCurrency(
                                    timeFilter === 'all'
                                        ? (duesData?.totalLifetimePurchases || 0)
                                        : stats.totalPurchasesAmount
                                )}</span>
                                <span className="hidden md:inline">{formatCurrency(
                                    timeFilter === 'all'
                                        ? (duesData?.totalLifetimePurchases || 0)
                                        : stats.totalPurchasesAmount
                                )}</span>
                            </h3>
                            <p className="text-white/80 text-[10px] md:text-sm mt-0.5 md:mt-1">
                                {t('reports.total_purchases')}{timeFilter === 'all' ? ` (${t('reports.all_time')})` : ''}
                            </p>
                            <div className="flex mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 items-center justify-between text-[10px] md:text-sm">
                                <span className="text-white/70 italic">
                                    {timeFilter === 'all'
                                        ? t('reports.incl_opening_balance')
                                        : t('reports.paid')}
                                </span>
                                <span className="font-semibold">
                                    {formatCurrency(timeFilter === 'all' ? (duesData?.totalLifetimePaid || 0) : stats.totalPurchasesPaid)}
                                </span>
                            </div>
                        </CardContent>
                        <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
                    </Card>

                    {/* Gross Profit */}
                    <Card className={`relative overflow-hidden border-0 shadow-lg md:shadow-xl text-white rounded-xl md:rounded-2xl ${timeFilter === 'all'
                        ? ((duesData?.totalLifetimeSales || 0) - (duesData?.totalLifetimePurchases || 0)) >= 0
                            ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                            : 'bg-gradient-to-br from-red-500 to-rose-600'
                        : stats.grossProfit >= 0
                            ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                            : 'bg-gradient-to-br from-red-500 to-rose-600'
                        }`}>
                        <CardContent className="p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-3">
                                <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                    <IndianRupee className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <Badge className={`border-0 text-[10px] md:text-xs px-1.5 md:px-2 ${timeFilter === 'all'
                                    ? ((duesData?.totalLifetimeSales || 0) - (duesData?.totalLifetimePurchases || 0)) >= 0
                                        ? 'bg-white/20 text-white'
                                        : 'bg-white text-red-600'
                                    : stats.grossProfit >= 0
                                        ? 'bg-white/20 text-white'
                                        : 'bg-white text-red-600'
                                    }`}>
                                    {timeFilter === 'all'
                                        ? ((duesData?.totalLifetimeSales || 0) - (duesData?.totalLifetimePurchases || 0)) >= 0 ? '✓' : '✗'
                                        : (stats.grossProfit >= 0 ? '✓' : '✗')
                                    }
                                </Badge>
                            </div>
                            <h3 className="text-lg md:text-3xl font-bold">
                                <span className="md:hidden">{formatCurrency(Math.abs(
                                    timeFilter === 'all'
                                        ? ((duesData?.totalLifetimeSales || 0) - (duesData?.totalLifetimePurchases || 0))
                                        : stats.grossProfit
                                ))}</span>
                                <span className="hidden md:inline">{formatCurrency(Math.abs(
                                    timeFilter === 'all'
                                        ? ((duesData?.totalLifetimeSales || 0) - (duesData?.totalLifetimePurchases || 0))
                                        : stats.grossProfit
                                ))}</span>
                            </h3>
                            <p className="text-white/80 text-[10px] md:text-sm mt-0.5 md:mt-1">
                                {timeFilter === 'all'
                                    ? ((duesData?.totalLifetimeSales || 0) - (duesData?.totalLifetimePurchases || 0)) >= 0
                                        ? t('reports.total_profit')
                                        : t('reports.total_loss')
                                    : stats.grossProfit >= 0 ? t('reports.gross_profit') : t('reports.gross_loss')
                                }
                            </p>
                            <div className="flex mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 items-center justify-between text-[10px] md:text-sm">
                                <span className="text-white/70 italic">
                                    {timeFilter === 'all' ? t('reports.incl_opening_balance') : t('reports.margin')}
                                </span>
                                <span className="font-semibold">
                                    {timeFilter === 'all'
                                        ? ((duesData?.totalLifetimeSales || 0) > 0
                                            ? ((((duesData?.totalLifetimeSales || 0) - (duesData?.totalLifetimePurchases || 0)) / (duesData?.totalLifetimeSales || 1)) * 100).toFixed(1) + '%'
                                            : '0%')
                                        : (stats.totalSalesAmount > 0 ? ((stats.grossProfit / stats.totalSalesAmount) * 100).toFixed(1) + '%' : '0%')
                                    }
                                </span>
                            </div>
                        </CardContent>
                        <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
                    </Card>

                    {/* Net Cash Flow */}
                    <Card className={`relative overflow-hidden border-0 shadow-lg md:shadow-xl text-white rounded-xl md:rounded-2xl ${(timeFilter === 'all'
                        ? ((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0))
                        : stats.netCashFlow) >= 0
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-600'
                        : 'bg-gradient-to-br from-red-500 to-pink-600'
                        }`}>
                        <CardContent className="p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-3">
                                <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                    <Wallet className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <Badge className={`border-0 text-[10px] md:text-xs px-1.5 md:px-2 ${(timeFilter === 'all'
                                    ? ((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0))
                                    : stats.netCashFlow) >= 0 ? 'bg-white/20 text-white' : 'bg-white text-red-600'}`}>
                                    {(timeFilter === 'all'
                                        ? ((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0))
                                        : stats.netCashFlow) >= 0 ? '+' : '-'}
                                </Badge>
                            </div>
                            <h3 className="text-lg md:text-3xl font-bold">
                                <span className="md:hidden">{(timeFilter === 'all'
                                    ? ((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0))
                                    : stats.netCashFlow) < 0 ? '-' : ''}{formatCurrency(Math.abs(
                                        timeFilter === 'all'
                                            ? ((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0))
                                            : stats.netCashFlow
                                    ))}</span>
                                <span className="hidden md:inline">{(timeFilter === 'all'
                                    ? ((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0))
                                    : stats.netCashFlow) < 0 ? '-' : ''}{formatCurrency(Math.abs(
                                        timeFilter === 'all'
                                            ? ((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0))
                                            : stats.netCashFlow
                                    ))}</span>
                            </h3>
                            <p className="text-white/80 text-[10px] md:text-sm mt-0.5 md:mt-1">
                                {timeFilter === 'all'
                                    ? t('reports.cash_in_hand_all_time')
                                    : t('reports.net_cash_flow')
                                }
                            </p>
                            <div className="flex mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 items-center justify-between text-[10px] md:text-sm">
                                <span className="text-white/70 italic">
                                    {timeFilter === 'all' ? t('reports.incl_opening_balance') : t('reports.transactions')}
                                </span>
                                <span className="font-semibold">
                                    {timeFilter === 'all'
                                        ? (stats.salesCount + stats.purchasesCount) // Fallback to period count if lifetime count not in duesData
                                        : stats.transactionCount}
                                </span>
                            </div>
                        </CardContent>
                        <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
                    </Card>
                </div>

                {/* Cash Flow & Dues Row - Mobile Friendly */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-4 md:mb-6">
                    <Card className="border-0 shadow-md rounded-xl">
                        <CardContent className="pt-3 pb-3 md:pt-4 md:pb-4 px-3 md:px-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] md:text-xs text-gray-500">{t('reports.cash_received')}</p>
                                    <p className="text-sm md:text-lg font-bold text-green-600">
                                        {formatCurrency(timeFilter === 'all' ? (duesData?.totalLifetimeCollected || 0) : stats.totalSalesCollected)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md rounded-xl">
                        <CardContent className="pt-3 pb-3 md:pt-4 md:pb-4 px-3 md:px-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                    <ArrowDownRight className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] md:text-xs text-gray-500">{t('reports.cash_paid')}</p>
                                    <p className="text-sm md:text-lg font-bold text-orange-600">
                                        {formatCurrency(timeFilter === 'all' ? (duesData?.totalLifetimePaid || 0) : stats.totalPurchasesPaid)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`border-0 shadow-md rounded-xl col-span-2 md:col-span-1 ${(timeFilter === 'all'
                        ? ((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0))
                        : stats.netCashFlow) < 0 ? 'bg-red-50' : ''}`}>
                        <CardContent className="pt-3 pb-3 md:pt-4 md:pb-4 px-3 md:px-6">
                            <div className="flex flex-row items-center gap-3">
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${(timeFilter === 'all'
                                    ? ((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0))
                                    : stats.netCashFlow) >= 0 ? 'bg-purple-100' : 'bg-red-100'}`}>
                                    <Wallet className={`h-4 w-4 md:h-5 md:w-5 ${(timeFilter === 'all'
                                        ? ((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0))
                                        : stats.netCashFlow) >= 0 ? 'text-purple-600' : 'text-red-600'}`} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] md:text-xs text-gray-500">{t('reports.net_cash_flow')}</p>
                                    <p className={`text-sm md:text-lg font-bold ${(timeFilter === 'all'
                                        ? ((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0))
                                        : stats.netCashFlow) >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                                        {formatCurrency(timeFilter === 'all'
                                            ? ((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0))
                                            : stats.netCashFlow)}
                                    </p>
                                    {(timeFilter === 'all'
                                        ? ((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0))
                                        : stats.netCashFlow) < 0 && (
                                            <p className="text-[8px] md:text-[10px] text-red-500 mt-0.5 italic">
                                                {t('reports.paid_more_than_collected')}
                                            </p>
                                        )}
                                    {(timeFilter === 'all'
                                        ? ((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0))
                                        : stats.netCashFlow) >= 0 && (
                                            <p className="text-[8px] md:text-[10px] text-purple-500 mt-0.5 italic">
                                                {t('reports.collected_more_than_paid')}
                                            </p>
                                        )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md rounded-xl">
                        <CardContent className="pt-3 pb-3 md:pt-4 md:pb-4 px-3 md:px-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                    <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] md:text-xs text-gray-500">
                                        {(duesData?.totalCustomerDue || 0) >= 0 ? t('reports.customer_outstanding_due') : t('reports.customer_advance')}
                                    </p>
                                    <p className={`text-sm md:text-lg font-bold ${(duesData?.totalCustomerDue || 0) >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {formatCurrency(Math.abs(duesData?.totalCustomerDue || 0))}
                                    </p>
                                    <p className="text-[8px] md:text-[10px] text-gray-400 mt-0.5">{t('reports.including_opening_balance')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md rounded-xl">
                        <CardContent className="pt-3 pb-3 md:pt-4 md:pb-4 px-3 md:px-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] md:text-xs text-gray-500">
                                        {(duesData?.totalWholesalerDue || 0) >= 0 ? t('reports.wholesaler_outstanding_due') : t('reports.wholesaler_advance')}
                                    </p>
                                    <p className={`text-sm md:text-lg font-bold ${(duesData?.totalWholesalerDue || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatCurrency(Math.abs(duesData?.totalWholesalerDue || 0))}
                                    </p>
                                    <p className="text-[8px] md:text-[10px] text-gray-400 mt-0.5">{t('reports.including_opening_balance')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* User-Friendly Breakdown Section - Visible on all devices */}
                <Card className="border-0 shadow-lg mb-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BarChart3 className="h-5 w-5 text-purple-600" />
                            {t('reports.understanding_numbers')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Sales & Purchases Breakdown */}
                            <div className="p-4 bg-white rounded-xl shadow-sm border">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                    {t('reports.profit_calculation')}
                                </h4>
                                <div className="space-y-3">
                                    {timeFilter === 'all' ? (
                                        /* All Time - Show complete profit including opening balance */
                                        <>
                                            {/* Total Sales */}
                                            <div className="flex justify-between items-center py-2 border-b border-dashed">
                                                <span className="text-gray-600 flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                                    {t('reports.total_sales_all_time')}
                                                </span>
                                                <span className="font-semibold text-green-600">{formatCurrency(duesData?.totalLifetimeSales || 0)}</span>
                                            </div>

                                            {/* Total Purchases */}
                                            <div className="flex justify-between items-center py-2 border-b border-dashed">
                                                <span className="text-gray-600 flex items-center gap-2">
                                                    <TrendingDown className="h-4 w-4 text-orange-500" />
                                                    {t('reports.total_purchases_all_time')}
                                                </span>
                                                <span className="font-semibold text-orange-600">- {formatCurrency(duesData?.totalLifetimePurchases || 0)}</span>
                                            </div>

                                            {/* Total Profit/Loss Result */}
                                            <div className={`flex justify-between items-center py-2 px-3 rounded-lg ${((duesData?.totalLifetimeSales || 0) - (duesData?.totalLifetimePurchases || 0)) >= 0
                                                ? 'bg-purple-50 border border-purple-200'
                                                : 'bg-red-50 border border-red-200'
                                                }`}>
                                                <span className={`font-bold ${((duesData?.totalLifetimeSales || 0) - (duesData?.totalLifetimePurchases || 0)) >= 0
                                                    ? 'text-purple-700'
                                                    : 'text-red-700'
                                                    }`}>
                                                    = {((duesData?.totalLifetimeSales || 0) - (duesData?.totalLifetimePurchases || 0)) >= 0
                                                        ? t('reports.total_profit_all_time')
                                                        : t('reports.total_loss_all_time')}
                                                </span>
                                                <span className={`font-bold text-xl ${((duesData?.totalLifetimeSales || 0) - (duesData?.totalLifetimePurchases || 0)) >= 0
                                                    ? 'text-purple-600'
                                                    : 'text-red-600'
                                                    }`}>
                                                    {formatCurrency(Math.abs((duesData?.totalLifetimeSales || 0) - (duesData?.totalLifetimePurchases || 0)))}
                                                </span>
                                            </div>

                                            {/* Explanation */}
                                            <p className="text-[10px] text-gray-500 mt-2 italic px-1">
                                                * {t('reports.includes_opening_balances')}
                                            </p>
                                        </>
                                    ) : (
                                        /* Period Specific - Show period profit only */
                                        <>
                                            <div className="flex justify-between items-center py-2 border-b border-dashed">
                                                <span className="text-gray-600 flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                                    {t('reports.total_sales_parenthesis')}
                                                </span>
                                                <span className="font-semibold text-green-600">{formatCurrency(stats.totalSalesAmount)}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-dashed">
                                                <span className="text-gray-600 flex items-center gap-2">
                                                    <TrendingDown className="h-4 w-4 text-orange-500" />
                                                    {t('reports.total_purchases_parenthesis')}
                                                </span>
                                                <span className="font-semibold text-orange-600">- {formatCurrency(stats.totalPurchasesAmount)}</span>
                                            </div>
                                            <div className={`flex justify-between items-center py-2 px-3 rounded-lg ${stats.grossProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                                <span className={`font-medium ${stats.grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                    = {t('reports.gross_profit')} {stats.grossProfit < 0 && `(${t('reports.loss')})`}
                                                </span>
                                                <span className={`font-bold text-lg ${stats.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatCurrency(stats.grossProfit)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Cash Flow Breakdown */}
                            <div className="p-4 bg-white rounded-xl shadow-sm border">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    {t('reports.cash_flow_breakdown')}
                                    <span className="text-xs font-normal text-gray-500 ml-2">({t('reports.money_movement')})</span>
                                </h4>
                                <div className="space-y-3">
                                    {/* Money Collected */}
                                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-green-100 rounded-lg">
                                                    <ArrowDownLeft className="h-4 w-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-green-700 text-sm">{t('reports.cash_collected_label')}</p>
                                                    <p className="text-xs text-green-600/70">{t('reports.cash_collected_subtitle')}</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-lg text-green-600">
                                                {formatCurrency(timeFilter === 'all' ? (duesData?.totalLifetimeCollected || 0) : stats.totalSalesCollected)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Money Paid Out */}
                                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-orange-100 rounded-lg">
                                                    <ArrowUpRight className="h-4 w-4 text-orange-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-orange-700 text-sm">{t('reports.cash_paid_out_label')}</p>
                                                    <p className="text-xs text-orange-600/70">{t('reports.cash_paid_out_subtitle')}</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-lg text-orange-600">
                                                - {formatCurrency(timeFilter === 'all' ? (duesData?.totalLifetimePaid || 0) : stats.totalPurchasesPaid)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t-2 border-dashed border-gray-300 my-2"></div>

                                    {/* Cash in Hand Result - Show period-specific ONLY when NOT viewing all time */}
                                    {timeFilter !== 'all' && (
                                        <div className={`rounded-lg p-4 ${stats.netCashFlow >= 0 ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200' : 'bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200'}`}>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-2 rounded-lg ${stats.netCashFlow >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}>
                                                        <Wallet className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className={`font-bold ${stats.netCashFlow >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                                                            {t('reports.cash_in_hand_period')}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {timeFilter === 'custom' ? t('reports.custom_range') : getFilterLabels(t)[timeFilter]}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`font-bold text-2xl ${stats.netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                    {stats.netCashFlow >= 0 ? '' : '-'}{formatCurrency(Math.abs(stats.netCashFlow))}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {timeFilter === 'all' && (
                                        <>
                                            {/* All Time Total */}
                                            <div className={`rounded-lg p-4 mt-3 ${((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0)) >= 0
                                                ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300'
                                                : 'bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300'
                                                }`}>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-2 rounded-lg ${((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0)) >= 0 ? 'bg-purple-500' : 'bg-red-500'}`}>
                                                            <Wallet className="h-5 w-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className={`font-bold ${((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0)) >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                                                                {t('reports.cash_in_hand_all_time')}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{t('reports.including_opening_balances')}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`font-bold text-2xl ${((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0)) >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                                                        {((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0)) >= 0 ? '' : '-'}{formatCurrency(Math.abs((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0)))}
                                                    </span>
                                                </div>
                                                {/* Explanation for negative cash */}
                                                {((duesData?.totalLifetimeCollected || 0) - (duesData?.totalLifetimePaid || 0)) < 0 && (duesData?.openingPurchasePayments || 0) > 0 && (
                                                    <p className="text-xs text-red-600 mt-2 italic">
                                                        💡 {t('reports.includes_opening_payment', { amount: `₹${(duesData?.openingPurchasePayments || 0).toLocaleString('en-IN')}` })}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Help Info Box */}
                                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="flex gap-2">
                                                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-semibold text-blue-700 mb-1">
                                                            {t('reports.cash_flow_help_title')}
                                                        </p>
                                                        <ul className="text-xs text-blue-600 space-y-1 ml-0 list-none">
                                                            <li className="flex items-start gap-1.5">
                                                                <span className="text-blue-500 mt-0.5">•</span>
                                                                <span><strong>{t('reports.physical_cash')}:</strong> {t('reports.cash_flow_help_line1')}</span>
                                                            </li>
                                                            <li className="flex items-start gap-1.5">
                                                                <span className="text-blue-500 mt-0.5">•</span>
                                                                <span><strong>{t('reports.net_worth')}:</strong> {t('reports.cash_flow_help_line2')}</span>
                                                            </li>
                                                        </ul>
                                                        <p className="text-xs text-blue-600 mt-2 italic">
                                                            {t('reports.cash_flow_example')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Sales & Receivables - Smart Merged View */}
                            <div className="p-4 bg-white rounded-xl shadow-sm border">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    {t('reports.sales_receivables')}
                                </h4>
                                <div className="space-y-3">
                                    {timeFilter === 'all' ? (
                                        /* All Time - Show complete unified breakdown */
                                        <div className="space-y-4">
                                            {/* Total Breakdown Block */}
                                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                                                    <span className="text-sm font-bold text-gray-700">{t('reports.total_sales_all_time')}</span>
                                                    <span className="text-lg font-bold text-gray-900">{formatCurrency(duesData?.totalLifetimeSales || 0)}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 italic">{t('reports.includes_opening_balances')}</p>
                                            </div>

                                            {/* Collection Block */}
                                            <div className="space-y-2 px-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600 flex items-center gap-2">
                                                        <ArrowDownRight className="h-4 w-4 text-green-500" />
                                                        {t('reports.less_collected_amount')}
                                                    </span>
                                                    <span className="font-semibold text-sm text-green-600">- {formatCurrency(duesData?.totalLifetimeCollected || 0)}</span>
                                                </div>

                                                <div className={`flex justify-between items-center py-2 px-3 rounded-lg mt-2 ${(duesData?.totalCustomerDue || 0) >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                                    <span className={`text-sm font-medium ${(duesData?.totalCustomerDue || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                        = {(duesData?.totalCustomerDue || 0) >= 0 ? t('reports.total_outstanding_receivable') : t('reports.total_to_pay_to_customer')}
                                                    </span>
                                                    <span className={`font-bold text-lg ${(duesData?.totalCustomerDue || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatCurrency(Math.abs(duesData?.totalCustomerDue || 0))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Period Specific - Show both period breakdown and cumulative total */
                                        <>
                                            {/* Period Specific Section */}
                                            <div className="pb-3 border-b-2 border-gray-200">
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                                    {timeFilter === 'custom' ? t('reports.custom_range') : getFilterLabels(t)[timeFilter]}
                                                </p>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center py-1.5">
                                                        <span className="text-sm text-gray-600">{t('reports.total_sales_made')}</span>
                                                        <span className="font-semibold text-sm">{formatCurrency(stats.totalSalesAmount)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-1.5">
                                                        <span className="text-sm text-gray-600">{t('reports.amount_collected')}</span>
                                                        <span className="font-semibold text-sm text-green-600">- {formatCurrency(stats.totalSalesCollected)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-yellow-50 border border-yellow-200">
                                                        <span className="font-semibold text-sm text-yellow-700">{t('reports.pending_to_collect_this_period')}</span>
                                                        <span className="font-bold text-base text-yellow-600">{formatCurrency(stats.totalSalesDue)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* All Time Total Section */}
                                            <div className="pt-2">
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('reports.all_time')}</p>
                                                <div className={`flex justify-between items-center py-2 px-3 rounded-lg ${(duesData?.totalCustomerDue || 0) >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                                    <span className={`text-sm font-medium ${(duesData?.totalCustomerDue || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                        = {(duesData?.totalCustomerDue || 0) >= 0 ? t('reports.total_outstanding_receivable') : t('reports.total_to_pay_to_customer')}
                                                    </span>
                                                    <span className={`font-bold text-lg ${(duesData?.totalCustomerDue || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatCurrency(Math.abs(duesData?.totalCustomerDue || 0))}
                                                    </span>
                                                </div>
                                                <div className="p-3 mt-2 rounded-lg bg-blue-50 border border-blue-200">
                                                    <p className="text-xs text-blue-700 font-medium">{t('reports.what_is_this')}</p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {t('reports.customers_owe_you_includes')}
                                                    </p>
                                                    <ul className="text-xs text-gray-600 mt-1 ml-4 list-disc">
                                                        <li>{t('reports.sales_made_before_app')}</li>
                                                        <li>{t('reports.unpaid_sales_bills_short')}</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Purchases & Payables - Smart Merged View */}
                            <div className="p-4 bg-white rounded-xl shadow-sm border">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                    {t('reports.purchases_payables')}
                                </h4>
                                <div className="space-y-3">
                                    {timeFilter === 'all' ? (
                                        /* All Time - Show complete unified breakdown */
                                        <div className="space-y-4">
                                            {/* Total Breakdown Block */}
                                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                                                    <span className="text-sm font-bold text-gray-700">{t('reports.total_purchases_all_time')}</span>
                                                    <span className="text-lg font-bold text-gray-900">{formatCurrency(duesData?.totalLifetimePurchases || 0)}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 italic">{t('reports.includes_opening_balances')}</p>
                                            </div>

                                            {/* Payment Block */}
                                            <div className="space-y-2 px-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600 flex items-center gap-2">
                                                        <ArrowUpRight className="h-4 w-4 text-orange-500" />
                                                        {t('reports.less_paid_amount')}
                                                    </span>
                                                    <span className="font-semibold text-sm text-orange-600">- {formatCurrency(duesData?.totalLifetimePaid || 0)}</span>
                                                </div>

                                                <div className={`flex justify-between items-center py-2 px-3 rounded-lg mt-2 ${(duesData?.totalWholesalerDue || 0) >= 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                                                    <span className={`text-sm font-medium ${(duesData?.totalWholesalerDue || 0) >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                                                        = {(duesData?.totalWholesalerDue || 0) >= 0 ? t('reports.total_outstanding_payable') : t('reports.total_to_receive_from_wholesaler')}
                                                    </span>
                                                    <span className={`font-bold text-lg ${(duesData?.totalWholesalerDue || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {formatCurrency(Math.abs(duesData?.totalWholesalerDue || 0))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Period Specific - Show both period breakdown and cumulative total */
                                        <>
                                            {/* Period Specific Section */}
                                            <div className="pb-3 border-b-2 border-gray-200">
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                                    {timeFilter === 'custom' ? t('reports.custom_range') : getFilterLabels(t)[timeFilter]}
                                                </p>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center py-1.5">
                                                        <span className="text-sm text-gray-600">{t('reports.total_purchases_made')}</span>
                                                        <span className="font-semibold text-sm">{formatCurrency(stats.totalPurchasesAmount)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-1.5">
                                                        <span className="text-sm text-gray-600">{t('reports.amount_paid')}</span>
                                                        <span className="font-semibold text-sm text-green-600">- {formatCurrency(stats.totalPurchasesPaid)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-orange-50 border border-orange-200">
                                                        <span className="font-semibold text-sm text-orange-700">{t('reports.pending_to_pay_this_period')}</span>
                                                        <span className="font-bold text-base text-orange-600">{formatCurrency(stats.totalPurchasesDue)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* All Time Total Section */}
                                            <div className="pt-2">
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('reports.all_time')}</p>
                                                <div className={`flex justify-between items-center py-2 px-3 rounded-lg ${(duesData?.totalWholesalerDue || 0) >= 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                                                    <span className={`text-sm font-medium ${(duesData?.totalWholesalerDue || 0) >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                                                        = {(duesData?.totalWholesalerDue || 0) >= 0 ? t('reports.total_outstanding_payable') : t('reports.total_to_receive_from_wholesaler')}
                                                    </span>
                                                    <span className={`font-bold text-lg ${(duesData?.totalWholesalerDue || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {formatCurrency(Math.abs(duesData?.totalWholesalerDue || 0))}
                                                    </span>
                                                </div>
                                                <div className="p-3 mt-2 rounded-lg bg-blue-50 border border-blue-200">
                                                    <p className="text-xs text-blue-700 font-medium">{t('reports.what_is_this')}</p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {t('reports.owe_wholesalers_includes')}
                                                    </p>
                                                    <ul className="text-xs text-gray-600 mt-1 ml-4 list-disc">
                                                        <li>{t('reports.purchases_made_before_app')}</li>
                                                        <li>{t('reports.unpaid_purchase_bills_short')}</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Insights */}
                        <div className="mt-6 p-4 bg-white rounded-xl shadow-sm border">
                            <h4 className="font-semibold text-gray-800 mb-3">💡 {t('reports.quick_insights')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className={`p-3 rounded-lg ${stats.grossProfit > 0 ? 'bg-green-50 border border-green-200' : stats.grossProfit < 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
                                    <p className={`text-sm font-medium ${stats.grossProfit > 0 ? 'text-green-700' : stats.grossProfit < 0 ? 'text-red-700' : 'text-gray-700'}`}>
                                        {stats.grossProfit > 0 ? `✅ ${t('reports.profitable_period')}` : stats.grossProfit < 0 ? `⚠️ ${t('reports.loss_period')}` : `➖ ${t('reports.no_activity')}`}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {stats.grossProfit > 0
                                            ? t('reports.sales_exceed_purchases')
                                            : stats.grossProfit < 0
                                                ? t('reports.purchases_exceed_sales')
                                                : t('reports.no_transactions_period')}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-lg ${(timeFilter === 'all' ? allTimeNetCashFlow : stats.netCashFlow) >= 0 ? 'bg-blue-50 border border-blue-200' : 'bg-orange-50 border border-orange-200'}`}>
                                    <p className={`text-sm font-medium ${(timeFilter === 'all' ? allTimeNetCashFlow : stats.netCashFlow) >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                                        {(timeFilter === 'all' ? allTimeNetCashFlow : stats.netCashFlow) >= 0 ? `💵 ${t('reports.positive_cash_flow')}` : `💸 ${t('reports.negative_cash_flow')}`}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {(timeFilter === 'all' ? allTimeNetCashFlow : stats.netCashFlow) >= 0
                                            ? t('reports.received_more_cash')
                                            : t('reports.paid_more_cash')}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-lg ${(timeFilter === 'all' ? (duesData?.totalCustomerDue || 0) : stats.totalSalesDue) !== 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                                    <p className={`text-sm font-medium ${(timeFilter === 'all' ? (duesData?.totalCustomerDue || 0) : stats.totalSalesDue) !== 0 ? 'text-yellow-700' : 'text-green-700'}`}>
                                        {(timeFilter === 'all' ? (duesData?.totalCustomerDue || 0) : stats.totalSalesDue) > 0
                                            ? `📋 ${formatCurrency(timeFilter === 'all' ? (duesData?.totalCustomerDue || 0) : stats.totalSalesDue)} ${timeFilter === 'all' ? t('reports.outstanding') : t('reports.pending')}`
                                            : (timeFilter === 'all' ? (duesData?.totalCustomerDue || 0) : stats.totalSalesDue) < 0
                                                ? `📋 ${formatCurrency(Math.abs(duesData?.totalCustomerDue || 0))} ${t('wholesaler_payments.detail.advance')}`
                                                : `✨ ${t('reports.all_collected')}`
                                        }
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {(timeFilter === 'all' ? (duesData?.totalCustomerDue || 0) : stats.totalSalesDue) !== 0
                                            ? (timeFilter === 'all' ? t('reports.understanding_numbers') : t('reports.pending_from_bills'))
                                            : t('reports.all_sales_collected')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs for different views - Mobile first */}
                <Tabs defaultValue="breakdown" className="space-y-3 md:space-y-4">
                    <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
                        <TabsList className="p-1 bg-white shadow-md rounded-xl inline-flex min-w-max">
                            <TabsTrigger
                                value="breakdown"
                                className="flex items-center gap-1 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
                            >
                                <BarChart3 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                <span>{t('reports.day_wise_breakdown')}</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="transactions"
                                className="flex items-center gap-1 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
                            >
                                <Receipt className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                <span>{t('reports.transactions')}</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="payment-methods"
                                className="flex items-center gap-1 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
                            >
                                <CreditCard className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                <span className="inline">{t('reports.payment_methods')}</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="breakdown">
                        <Card className="border-0 shadow-lg md:shadow-xl overflow-hidden rounded-xl md:rounded-2xl">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b p-3 md:p-6">
                                <div className="flex items-center gap-2 md:gap-3">
                                    <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                                        <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base md:text-lg">{t('reports.day_wise_performance')}</CardTitle>
                                        <p className="text-xs md:text-sm text-gray-500 mt-0.5 hidden sm:block">
                                            {t('reports.day_wise_breakdown')}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="p-8 md:p-12 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-4 border-purple-500 border-t-transparent mx-auto" />
                                        <p className="text-gray-500 mt-3 md:mt-4 text-sm">Loading data...</p>
                                    </div>
                                ) : dayWiseData.length > 0 ? (
                                    <>
                                        {/* Desktop Table */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                                                        <TableHead>{t('reports.date')}</TableHead>
                                                        <TableHead className="text-right">{t('reports.sales')}</TableHead>
                                                        <TableHead className="text-right">{t('reports.collected')}</TableHead>
                                                        <TableHead className="text-right">{t('reports.purchases')}</TableHead>
                                                        <TableHead className="text-right">{t('reports.paid')}</TableHead>
                                                        <TableHead className="text-right">{t('reports.profit')}</TableHead>
                                                        <TableHead className="text-right">{t('reports.cash_flow')}</TableHead>
                                                        <TableHead className="text-center">{t('reports.transactions')}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {dayWiseData.map((day) => (
                                                        <TableRow key={day.date} className="hover:bg-purple-50/30">
                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-700 font-semibold text-sm">
                                                                        {day.dayName}
                                                                    </div>
                                                                    <span className="font-medium">{day.displayDate}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right font-semibold text-green-600">{formatCurrency(day.sales)}</TableCell>
                                                            <TableCell className="text-right text-gray-600">{formatCurrency(day.salesCollected)}</TableCell>
                                                            <TableCell className="text-right font-semibold text-orange-600">{formatCurrency(day.purchases)}</TableCell>
                                                            <TableCell className="text-right text-gray-600">{formatCurrency(day.purchasesPaid)}</TableCell>
                                                            <TableCell className={`text-right font-bold ${day.profit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                                                                {formatCurrency(day.profit)}
                                                            </TableCell>
                                                            <TableCell className={`text-right font-bold ${day.cashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                                {formatCurrency(day.cashFlow)}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge className="bg-purple-100 text-purple-700">{day.transactions}</Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Mobile Cards */}
                                        <div className="md:hidden">
                                            {dayWiseData.map((day, index) => (
                                                <div key={day.date} className={`p-3 hover:bg-purple-50/30 active:scale-[0.99] transition-all ${index !== dayWiseData.length - 1 ? 'border-b-2 border-gray-200' : ''}`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-700 font-semibold text-xs">
                                                                {day.dayName}
                                                            </div>
                                                            <span className="font-medium text-sm text-gray-900">{day.displayDate}</span>
                                                        </div>
                                                        <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5">{day.transactions} bills</Badge>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {/* Row 1: Sales & Profit */}
                                                        <div className="grid grid-cols-3 gap-2 text-center">
                                                            <div className="bg-green-50 rounded-lg p-1.5 border border-green-100">
                                                                <p className="text-[10px] text-green-600 font-medium">{t('reports.sales')}</p>
                                                                <p className="font-bold text-green-700 text-sm">{formatCurrency(day.sales)}</p>
                                                            </div>
                                                            <div className="bg-green-50/50 rounded-lg p-1.5 border border-green-100/50">
                                                                <p className="text-[10px] text-green-600/80 font-medium">{t('reports.collected')}</p>
                                                                <p className="font-semibold text-green-700/80 text-sm">{formatCurrency(day.salesCollected)}</p>
                                                            </div>
                                                            <div className={`rounded-lg p-1.5 border ${day.profit >= 0 ? 'bg-purple-50 border-purple-100' : 'bg-red-50 border-red-100'}`}>
                                                                <p className={`text-[10px] font-medium ${day.profit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>{t('reports.profit')}</p>
                                                                <p className={`font-bold text-sm ${day.profit >= 0 ? 'text-purple-700' : 'text-red-700'}`}>{formatCurrency(day.profit)}</p>
                                                            </div>
                                                        </div>

                                                        {/* Row 2: Purchases & Cash Flow */}
                                                        <div className="grid grid-cols-3 gap-2 text-center">
                                                            <div className="bg-orange-50 rounded-lg p-1.5 border border-orange-100">
                                                                <p className="text-[10px] text-orange-600 font-medium">{t('reports.purchases')}</p>
                                                                <p className="font-bold text-orange-700 text-sm">{formatCurrency(day.purchases)}</p>
                                                            </div>
                                                            <div className="bg-orange-50/50 rounded-lg p-1.5 border border-orange-100/50">
                                                                <p className="text-[10px] text-orange-600/80 font-medium">{t('reports.paid')}</p>
                                                                <p className="font-semibold text-orange-700/80 text-sm">{formatCurrency(day.purchasesPaid)}</p>
                                                            </div>
                                                            <div className={`rounded-lg p-1.5 border ${day.cashFlow >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
                                                                <p className={`text-[10px] font-medium ${day.cashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{t('reports.net_cash')}</p>
                                                                <p className={`font-bold text-sm ${day.cashFlow >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatCurrency(day.cashFlow)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-8 md:p-12 text-center">
                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3 md:mb-4">
                                            <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
                                        </div>
                                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">No transactions</h3>
                                        <p className="text-gray-500 text-sm">No data in this period</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="transactions">
                        <Card className="border-0 shadow-lg md:shadow-xl overflow-hidden rounded-xl md:rounded-2xl">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b p-3 md:p-6 pb-3 md:pb-4">
                                <div className="flex items-center justify-between gap-2 md:gap-4">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                                            <Receipt className="h-4 w-4 md:h-5 md:w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base md:text-lg">
                                                <span className="md:hidden">{t('reports.transactions')}</span>
                                                <span className="hidden md:inline">{t('reports.all_transactions')}</span>
                                            </CardTitle>
                                            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                                                <span className="md:hidden">{filteredTransactions.length}/{bills.length}</span>
                                                <span className="hidden md:inline">{filteredTransactions.length} of {bills.length} {t('reports.transactions')} indicated</span>
                                            </p>
                                        </div>
                                    </div>
                                    {hasTxnFilters && (
                                        <Button variant="ghost" size="sm" onClick={clearTxnFilters} className="text-gray-500 hover:text-gray-700 h-8 px-2 md:px-3 text-xs md:text-sm">
                                            <X className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                                            <span className="hidden sm:inline">{t('reports.clear_filters')}</span>
                                            <span className="sm:hidden">{t('reports.clear_filters')}</span>
                                        </Button>
                                    )}
                                </div>

                                {/* Mobile Search */}
                                <div className="mt-3 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                                    <Input
                                        placeholder={t('reports.search_placeholder')}
                                        value={txnSearch}
                                        onChange={(e) => {
                                            setTxnSearch(e.target.value);
                                            setTxnPage(1);
                                        }}
                                        className="pl-8 md:pl-9 h-9 text-sm"
                                    />
                                </div>

                                {/* Filters Section - Horizontal scroll on mobile */}
                                <div className="mt-2 md:mt-3 overflow-x-auto scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
                                    <div className="flex gap-2 min-w-max md:flex-wrap">
                                        {/* Type Filter */}
                                        <Select
                                            value={txnTypeFilter}
                                            onValueChange={(value: 'all' | 'sale' | 'purchase') => {
                                                setTxnTypeFilter(value);
                                                setTxnPage(1);
                                            }}
                                        >
                                            <SelectTrigger className="w-[100px] md:w-[120px] h-8 md:h-9 text-xs md:text-sm">
                                                <SelectValue placeholder={t('reports.type')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('reports.all_types')}</SelectItem>
                                                <SelectItem value="sale">{t('reports.sale')}</SelectItem>
                                                <SelectItem value="purchase">{t('reports.purchase')}</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {/* Payment Method Filter */}
                                        <Select
                                            value={txnMethodFilter}
                                            onValueChange={(value: 'all' | 'cash' | 'card' | 'online') => {
                                                setTxnMethodFilter(value);
                                                setTxnPage(1);
                                            }}
                                        >
                                            <SelectTrigger className="w-[100px] md:w-[120px] h-8 md:h-9 text-xs md:text-sm">
                                                <SelectValue placeholder={t('reports.method')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('reports.all_methods')}</SelectItem>
                                                <SelectItem value="cash">{t('reports.cash')}</SelectItem>
                                                <SelectItem value="card">{t('reports.card')}</SelectItem>
                                                <SelectItem value="online">{t('reports.online')}</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {/* Status Filter */}
                                        <Select
                                            value={txnStatusFilter}
                                            onValueChange={(value: 'all' | 'paid' | 'partial' | 'pending') => {
                                                setTxnStatusFilter(value);
                                                setTxnPage(1);
                                            }}
                                        >
                                            <SelectTrigger className="w-[100px] md:w-[120px] h-8 md:h-9 text-xs md:text-sm">
                                                <SelectValue placeholder={t('reports.status')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('reports.all_statuses')}</SelectItem>
                                                <SelectItem value="paid">{t('reports.paid')}</SelectItem>
                                                <SelectItem value="partial">{t('reports.partial')}</SelectItem>
                                                <SelectItem value="pending">{t('reports.pending')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Active Filters - Hidden on mobile for cleaner UI */}
                                {hasTxnFilters && (
                                    <div className="hidden md:flex mt-3 flex-wrap gap-2">
                                        {txnSearch && (
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                Search: "{txnSearch}"
                                                <X className="h-3 w-3 cursor-pointer" onClick={() => { setTxnSearch(''); setTxnPage(1); }} />
                                            </Badge>
                                        )}
                                        {txnTypeFilter !== 'all' && (
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                {t('reports.type')}: {txnTypeFilter === 'sale' ? t('reports.sale') : t('reports.purchase')}
                                                <X className="h-3 w-3 cursor-pointer" onClick={() => { setTxnTypeFilter('all'); setTxnPage(1); }} />
                                            </Badge>
                                        )}
                                        {txnMethodFilter !== 'all' && (
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                {t('reports.method')}: {t(`reports.${txnMethodFilter}`)}
                                                <X className="h-3 w-3 cursor-pointer" onClick={() => { setTxnMethodFilter('all'); setTxnPage(1); }} />
                                            </Badge>
                                        )}
                                        {txnStatusFilter !== 'all' && (
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                {t('reports.status')}: {t(`reports.${txnStatusFilter}`)}
                                                <X className="h-3 w-3 cursor-pointer" onClick={() => { setTxnStatusFilter('all'); setTxnPage(1); }} />
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto" />
                                    </div>
                                ) : paginatedTransactions.length > 0 ? (
                                    <>
                                        {/* Desktop Table */}
                                        <div className="hidden md:block overflow-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>{t('reports.date')}</TableHead>
                                                        <TableHead>{t('reports.bill_number')}</TableHead>
                                                        <TableHead>{t('reports.type')}</TableHead>
                                                        <TableHead>{t('history.entity')}</TableHead>
                                                        <TableHead className="text-right">{t('reports.amount')}</TableHead>
                                                        <TableHead className="text-right">{t('reports.paid')}</TableHead>
                                                        <TableHead>{t('reports.method')}</TableHead>
                                                        <TableHead>{t('reports.status')}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {paginatedTransactions.map((bill) => {
                                                        const due = bill.dueAmount || (bill.totalAmount - bill.paidAmount);
                                                        const entityName = bill.entityName === 'Walk-in Customer' ? t('common.walk_in_customer') : bill.entityName;
                                                        const paymentMethodLabel = bill.paymentMethod?.toLowerCase() === 'cash' ? t('reports.cash')
                                                            : bill.paymentMethod?.toLowerCase() === 'online' ? t('reports.online')
                                                                : bill.paymentMethod?.toLowerCase() === 'card' ? t('reports.card')
                                                                    : bill.paymentMethod;

                                                        return (
                                                            <TableRow key={bill._id}>
                                                                <TableCell className="text-sm">{format(new Date(bill.createdAt), 'dd MMM, hh:mm a')}</TableCell>
                                                                <TableCell className="font-mono text-sm">{bill.billNumber}</TableCell>
                                                                <TableCell>
                                                                    <Badge className={bill.billType === 'sale' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                                                                        {bill.billType === 'sale' ? t('reports.sale') : t('reports.purchase')}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>{entityName}</TableCell>
                                                                <TableCell className="text-right font-medium">{formatCurrency(bill.totalAmount)}</TableCell>
                                                                <TableCell className="text-right text-green-600">{formatCurrency(bill.paidAmount)}</TableCell>
                                                                <TableCell className="capitalize">{paymentMethodLabel}</TableCell>
                                                                <TableCell>
                                                                    {due <= 0 ? (
                                                                        <Badge className="bg-green-100 text-green-700">{t('reports.paid')}</Badge>
                                                                    ) : bill.paidAmount > 0 ? (
                                                                        <Badge className="bg-yellow-100 text-yellow-700">{t('reports.partial')}</Badge>
                                                                    ) : (
                                                                        <Badge variant="destructive">{t('reports.pending')}</Badge>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Mobile Cards */}
                                        <div className="md:hidden">
                                            {paginatedTransactions.map((bill, index) => {
                                                const due = bill.dueAmount || (bill.totalAmount - bill.paidAmount);
                                                const entityName = bill.entityName === 'Walk-in Customer' ? t('common.walk_in_customer') : bill.entityName;
                                                const paymentMethodLabel = bill.paymentMethod?.toLowerCase() === 'cash' ? t('reports.cash')
                                                    : bill.paymentMethod?.toLowerCase() === 'online' ? t('reports.online')
                                                        : bill.paymentMethod?.toLowerCase() === 'card' ? t('reports.card')
                                                            : bill.paymentMethod;

                                                return (
                                                    <div key={bill._id} className={`p-3 hover:bg-blue-50/30 active:scale-[0.99] transition-all ${index !== paginatedTransactions.length - 1 ? 'border-b-2 border-gray-200' : ''}`}>
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm ${bill.billType === 'sale' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-orange-500 to-amber-600'}`}>
                                                                    {entityName?.charAt(0)?.toUpperCase() || 'B'}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-gray-900 text-sm truncate max-w-[120px]">{entityName}</p>
                                                                    <p className="text-[10px] text-gray-500 font-mono">{bill.billNumber}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <Badge className={`text-[9px] px-1 ${bill.billType === 'sale' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                    {bill.billType === 'sale' ? t('reports.sale') : t('reports.purchase')}
                                                                </Badge>
                                                                <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{paymentMethodLabel}</p>
                                                            </div>
                                                        </div>

                                                        {/* Financials Row */}
                                                        <div className="grid grid-cols-3 gap-2 mb-2 bg-gray-50/50 p-1.5 rounded-lg border border-gray-100">
                                                            <div>
                                                                <p className="text-[9px] text-gray-500">{t('common.total')}</p>
                                                                <p className={`font-bold text-xs ${bill.billType === 'sale' ? 'text-green-700' : 'text-orange-700'}`}>{formatCurrency(bill.totalAmount)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] text-gray-500">{t('reports.paid')}</p>
                                                                <p className="font-semibold text-xs text-green-600">{formatCurrency(bill.paidAmount)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] text-gray-500">{t('billing.due')}</p>
                                                                <p className={`font-semibold text-xs ${due > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                                    {due > 0 ? formatCurrency(due) : '-'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between items-center">
                                                            <Badge className={`text-[9px] px-1.5 ${due <= 0 ? 'bg-green-100 text-green-700' :
                                                                bill.paidAmount > 0 ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                {due <= 0 ? t('reports.paid') : bill.paidAmount > 0 ? t('reports.partial') : t('reports.pending')}
                                                            </Badge>
                                                            <p className="text-[10px] text-gray-400">
                                                                {format(new Date(bill.createdAt), 'dd MMM, hh:mm a')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Pagination */}
                                        {txnTotalPages > 1 && (
                                            <>
                                                {/* Mobile Pagination */}
                                                <div className="flex md:hidden items-center justify-center gap-2 px-3 py-3 border-t bg-gray-50">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setTxnPage(p => Math.max(1, p - 1))}
                                                        disabled={txnPage === 1}
                                                        className="h-9 px-3"
                                                    >
                                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                                        {t('reports.prev')}
                                                    </Button>
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                                                        <span>{txnPage}</span>
                                                        <span className="text-purple-400">/</span>
                                                        <span>{txnTotalPages}</span>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setTxnPage(p => Math.min(txnTotalPages, p + 1))}
                                                        disabled={txnPage === txnTotalPages}
                                                        className="h-9 px-3"
                                                    >
                                                        {t('reports.next')}
                                                        <ChevronRight className="h-4 w-4 ml-1" />
                                                    </Button>
                                                </div>

                                                {/* Desktop Pagination */}
                                                <div className="hidden md:flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                                                    <p className="text-sm text-gray-600">
                                                        {t('reports.showing_range', {
                                                            start: ((txnPage - 1) * ITEMS_PER_PAGE) + 1,
                                                            end: Math.min(txnPage * ITEMS_PER_PAGE, filteredTransactions.length),
                                                            total: filteredTransactions.length,
                                                            type: t('reports.transactions').toLowerCase()
                                                        })}
                                                    </p>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => setTxnPage(1)}
                                                            disabled={txnPage === 1}
                                                            className="h-8 w-8"
                                                        >
                                                            <ChevronsLeft className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => setTxnPage(p => Math.max(1, p - 1))}
                                                            disabled={txnPage === 1}
                                                            className="h-8 w-8"
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                        <span className="px-3 text-sm font-medium">
                                                            {t('reports.page_of', { current: txnPage, total: txnTotalPages })}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => setTxnPage(p => Math.min(txnTotalPages, p + 1))}
                                                            disabled={txnPage === txnTotalPages}
                                                            className="h-8 w-8"
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => setTxnPage(txnTotalPages)}
                                                            disabled={txnPage === txnTotalPages}
                                                            className="h-8 w-8"
                                                        >
                                                            <ChevronsRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-8 text-center">
                                        <Receipt className="h-10 w-10 md:h-12 md:w-12 text-gray-300 mx-auto mb-3 md:mb-4" />
                                        <p className="text-gray-500 text-sm">
                                            {hasTxnFilters ? t('reports.no_transactions_match') : t('reports.no_transactions_title')}
                                        </p>
                                        {hasTxnFilters && (
                                            <Button variant="link" onClick={clearTxnFilters} size="sm" className="mt-2">
                                                {t('reports.clear_filters')}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="payment-methods">
                        <Card className="border-0 shadow-lg md:shadow-xl overflow-hidden rounded-xl md:rounded-2xl">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b p-3 md:p-6">
                                <div className="flex items-center gap-2 md:gap-3">
                                    <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                                        <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base md:text-lg">Payment Methods</CardTitle>
                                        <p className="text-xs md:text-sm text-gray-500 mt-0.5 hidden sm:block">
                                            {t('reports.cash_flow_by_type')}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 md:p-6">
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6">
                                    {/* Cash */}
                                    <Card className="border-0 shadow-md md:shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden rounded-xl">
                                        <CardContent className="p-3 md:pt-6 md:px-6 md:pb-4">
                                            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                                                <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-green-100 flex items-center justify-center">
                                                    <Wallet className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
                                                </div>
                                                <h3 className="font-semibold text-sm md:text-base">{t('reports.cash')}</h3>
                                            </div>
                                            <div className="space-y-1.5 md:space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 text-xs md:text-sm">{t('reports.received')}</span>
                                                    <span className="font-medium text-green-600">
                                                        <span className="md:hidden">{formatCurrency(stats.paymentBreakdown.cash.sales)}</span>
                                                        <span className="hidden md:inline">{formatCurrency(stats.paymentBreakdown.cash.sales)}</span>
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 text-xs md:text-sm">{t('reports.paid')}</span>
                                                    <span className="font-medium text-orange-600">
                                                        <span className="md:hidden">{formatCurrency(stats.paymentBreakdown.cash.purchases)}</span>
                                                        <span className="hidden md:inline">{formatCurrency(stats.paymentBreakdown.cash.purchases)}</span>
                                                    </span>
                                                </div>
                                                <div className="border-t pt-1.5 md:pt-2 flex justify-between">
                                                    <span className="font-medium text-xs md:text-sm">{t('reports.net')}</span>
                                                    <span className={`font-bold ${stats.paymentBreakdown.cash.sales - stats.paymentBreakdown.cash.purchases >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        <span className="md:hidden">{formatCurrency(stats.paymentBreakdown.cash.sales - stats.paymentBreakdown.cash.purchases)}</span>
                                                        <span className="hidden md:inline">{formatCurrency(stats.paymentBreakdown.cash.sales - stats.paymentBreakdown.cash.purchases)}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Card */}
                                    <Card className="border-0 shadow-md md:shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 overflow-hidden rounded-xl">
                                        <CardContent className="p-3 md:pt-6 md:px-6 md:pb-4">
                                            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                                                <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <CreditCard className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
                                                </div>
                                                <h3 className="font-semibold text-sm md:text-base">{t('reports.card')}</h3>
                                            </div>
                                            <div className="space-y-1.5 md:space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 text-xs md:text-sm">{t('reports.received')}</span>
                                                    <span className="font-medium text-green-600">
                                                        <span className="md:hidden">{formatCurrency(stats.paymentBreakdown.card.sales)}</span>
                                                        <span className="hidden md:inline">{formatCurrency(stats.paymentBreakdown.card.sales)}</span>
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 text-xs md:text-sm">{t('reports.paid')}</span>
                                                    <span className="font-medium text-orange-600">
                                                        <span className="md:hidden">{formatCurrency(stats.paymentBreakdown.card.purchases)}</span>
                                                        <span className="hidden md:inline">{formatCurrency(stats.paymentBreakdown.card.purchases)}</span>
                                                    </span>
                                                </div>
                                                <div className="border-t pt-1.5 md:pt-2 flex justify-between">
                                                    <span className="font-medium text-xs md:text-sm">{t('reports.net')}</span>
                                                    <span className={`font-bold ${stats.paymentBreakdown.card.sales - stats.paymentBreakdown.card.purchases >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        <span className="md:hidden">{formatCurrency(stats.paymentBreakdown.card.sales - stats.paymentBreakdown.card.purchases)}</span>
                                                        <span className="hidden md:inline">{formatCurrency(stats.paymentBreakdown.card.sales - stats.paymentBreakdown.card.purchases)}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Online */}
                                    <Card className="border-0 shadow-md md:shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 overflow-hidden rounded-xl">
                                        <CardContent className="p-3 md:pt-6 md:px-6 md:pb-4">
                                            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                                                <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <IndianRupee className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
                                                </div>
                                                <h3 className="font-semibold text-sm md:text-base">{t('reports.online')}/UPI</h3>
                                            </div>
                                            <div className="space-y-1.5 md:space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 text-xs md:text-sm">{t('reports.received')}</span>
                                                    <span className="font-medium text-green-600">
                                                        <span className="md:hidden">{formatCurrency(stats.paymentBreakdown.online.sales)}</span>
                                                        <span className="hidden md:inline">{formatCurrency(stats.paymentBreakdown.online.sales)}</span>
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 text-xs md:text-sm">{t('reports.paid')}</span>
                                                    <span className="font-medium text-orange-600">
                                                        <span className="md:hidden">{formatCurrency(stats.paymentBreakdown.online.purchases)}</span>
                                                        <span className="hidden md:inline">{formatCurrency(stats.paymentBreakdown.online.purchases)}</span>
                                                    </span>
                                                </div>
                                                <div className="border-t pt-1.5 md:pt-2 flex justify-between">
                                                    <span className="font-medium text-xs md:text-sm">{t('reports.net')}</span>
                                                    <span className={`font-bold ${stats.paymentBreakdown.online.sales - stats.paymentBreakdown.online.purchases >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        <span className="md:hidden">{formatCurrency(stats.paymentBreakdown.online.sales - stats.paymentBreakdown.online.purchases)}</span>
                                                        <span className="hidden md:inline">{formatCurrency(stats.paymentBreakdown.online.sales - stats.paymentBreakdown.online.purchases)}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs >
            </div >

            {/* Custom Date Range Dialog */}
            < Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen} >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-purple-500" />
                            Select Date Range
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    min={customStartDate}
                                    max={format(new Date(), 'yyyy-MM-dd')}
                                />
                            </div>
                        </div>
                        {customStartDate && customEndDate && (
                            <div className="p-3 bg-purple-50 rounded-lg text-center">
                                <p className="text-sm text-purple-700">
                                    <span className="font-medium">{format(new Date(customStartDate), 'dd MMMM yyyy')}</span>
                                    {' → '}
                                    <span className="font-medium">{format(new Date(customEndDate), 'dd MMMM yyyy')}</span>
                                </p>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsCustomDialogOpen(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={handleCustomApply} className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={!customStartDate || !customEndDate}>
                                Apply
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >
        </div >
    );
}
