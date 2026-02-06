'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
    Search, Calendar, ChevronDown, X, Filter, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, LayoutDashboard, Users, Receipt, IndianRupee,
    CreditCard, Banknote, Smartphone, TrendingUp, ShoppingBag
} from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';
import { Header } from '@/components/app/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import api from '@/config/axios';
import { CustomerAllSalesPdfModal } from '../components';
import { Printer } from 'lucide-react';

interface Bill {
    _id: string;
    billNumber: string;
    entityName: string;
    totalAmount: number;
    paymentMethod: string;
    createdAt: string;
}

interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

type TimeFilterOption = 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year' | 'custom';

interface FiltersState {
    search: string;
    timeFilter: TimeFilterOption;
    paymentMethod: string;
    startDate?: string;
    endDate?: string;
}


// Helper for labels
const getFilterLabels = (t: any): Record<TimeFilterOption, string> => ({
    all: t('history.time_filters.all'),
    today: t('history.time_filters.today'),
    yesterday: t('history.time_filters.yesterday'),
    this_week: t('history.time_filters.this_week'),
    this_month: t('history.time_filters.this_month'),
    this_year: t('history.time_filters.this_year'),
    custom: t('history.time_filters.custom'),
});

const getPaymentMethodConfig = (t: any): Record<string, { color: string; bgColor: string; icon: React.ReactNode; label: string }> => ({
    cash: { color: 'text-green-700', bgColor: 'bg-green-100', icon: <Banknote className="h-4 w-4" />, label: t('dashboard.cash') },
    card: { color: 'text-blue-700', bgColor: 'bg-blue-100', icon: <CreditCard className="h-4 w-4" />, label: t('dashboard.card') },
    online: { color: 'text-purple-700', bgColor: 'bg-purple-100', icon: <Smartphone className="h-4 w-4" />, label: t('dashboard.online') },
});

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}



function getDateRangeForFilter(option: TimeFilterOption): { startDate?: string; endDate?: string } {
    const now = new Date();
    switch (option) {
        case 'all':
            return {};
        case 'today':
            return { startDate: format(startOfDay(now), 'yyyy-MM-dd'), endDate: format(endOfDay(now), 'yyyy-MM-dd') };
        case 'yesterday':
            const yesterday = subDays(now, 1);
            return { startDate: format(startOfDay(yesterday), 'yyyy-MM-dd'), endDate: format(endOfDay(yesterday), 'yyyy-MM-dd') };
        case 'this_week':
            return { startDate: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), endDate: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd') };
        case 'this_month':
            return { startDate: format(startOfMonth(now), 'yyyy-MM-dd'), endDate: format(endOfMonth(now), 'yyyy-MM-dd') };
        case 'this_year':
            return { startDate: format(startOfYear(now), 'yyyy-MM-dd'), endDate: format(endOfYear(now), 'yyyy-MM-dd') };
        default:
            return {};
    }
}

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

const ITEMS_PER_PAGE = 10;

export default function NormalCustomersPage() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const [filters, setFilters] = useState<FiltersState>({
        search: '',
        timeFilter: 'all',
        paymentMethod: 'all',
    });

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // Debounce search
    const debouncedSearch = useDebounce(searchInput, 500);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, filters.timeFilter, filters.paymentMethod]);

    // Build query params
    const buildQueryParams = () => {
        const params = new URLSearchParams();
        params.set('entityType', 'normal_customer');
        params.set('page', currentPage.toString());
        params.set('limit', ITEMS_PER_PAGE.toString());
        if (filters.paymentMethod && filters.paymentMethod !== 'all') {
            params.set('paymentMethod', filters.paymentMethod);
        }
        if (filters.startDate) params.set('startDate', filters.startDate);
        if (filters.endDate) params.set('endDate', filters.endDate);
        if (debouncedSearch) params.set('search', debouncedSearch);
        return params.toString();
    };

    // Fetch sales to normal customers
    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['normal-customer-sales', currentPage, debouncedSearch, filters],
        queryFn: async () => {
            const response = await api.get<PaginatedResponse<Bill>>(`/bills?${buildQueryParams()}`);
            return response.data;
        },
    });

    const bills = (data?.data || []) as Bill[];
    const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

    // Calculate stats from current data
    const totalTransactions = pagination.total;
    const totalRevenue = bills.reduce((sum, b) => sum + b.totalAmount, 0);
    const todayBills = bills.filter(b => {
        const billDate = new Date(b.createdAt).toDateString();
        const today = new Date().toDateString();
        return billDate === today;
    });
    const todaySales = todayBills.length;
    const todayRevenue = todayBills.reduce((sum, b) => sum + b.totalAmount, 0);

    const handleTimeFilterChange = (option: TimeFilterOption) => {
        if (option === 'custom') {
            setCustomStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
            setCustomEndDate(format(new Date(), 'yyyy-MM-dd'));
            setIsCustomDateOpen(true);
        } else {
            const dateRange = getDateRangeForFilter(option);
            setFilters(prev => ({
                ...prev,
                timeFilter: option,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
            }));
        }
    };

    const handleCustomDateApply = () => {
        if (customStartDate && customEndDate) {
            setFilters(prev => ({
                ...prev,
                timeFilter: 'custom',
                startDate: customStartDate,
                endDate: customEndDate,
            }));
            setIsCustomDateOpen(false);
        }
    };

    const clearFilters = () => {
        setSearchInput('');
        setFilters({
            search: '',
            timeFilter: 'all',
            paymentMethod: 'all',
        });
        setCurrentPage(1);
    };

    const getTimeFilterLabel = () => {
        if (filters.timeFilter === 'custom' && filters.startDate && filters.endDate) {
            if (i18n.language === 'ml') {
                const formatter = new Intl.DateTimeFormat('ml-IN', { day: 'numeric', month: 'short' });
                return `${formatter.format(new Date(filters.startDate))} - ${formatter.format(new Date(filters.endDate))}`;
            }
            return `${format(new Date(filters.startDate), 'dd MMM')} - ${format(new Date(filters.endDate), 'dd MMM')}`;
        }
        return getFilterLabels(t)[filters.timeFilter];
    };

    const hasActiveFilters = searchInput || filters.timeFilter !== 'all' || filters.paymentMethod !== 'all';

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const totalPages = pagination.totalPages;
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20">
            <Header title={t('sidebar.normal_customers')} />

            <div className="p-3 md:p-6">
                {/* Page Header - Mobile First */}
                <div className="mb-4 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                {t('sidebar.normal_customers')}
                            </h2>
                            <ShoppingBag className="h-5 w-5 md:h-8 md:w-8 text-green-600" />
                        </div>
                        <p className="text-gray-600 mt-0.5 md:mt-1 flex items-center gap-1.5 md:gap-2 text-xs md:text-base">
                            <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            {i18n.language === 'ml' ? (
                                <>
                                    <span className="hidden md:inline">{new Intl.DateTimeFormat('ml-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())}</span>
                                    <span className="md:hidden">{new Intl.DateTimeFormat('ml-IN', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span>
                                </>
                            ) : (
                                <>
                                    <span className="hidden md:inline">{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
                                    <span className="md:hidden">{format(new Date(), 'EEE, MMM d')}</span>
                                </>
                            )}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:flex md:items-center gap-2 md:gap-3 w-full md:w-auto">
                        <Link href="/shopkeeper/customers/dashboard" className="hidden md:block">
                            <Button variant="outline" className="shadow-sm">
                                <LayoutDashboard className="h-4 w-4 mr-2" />
                                {t('common.dashboard')}
                            </Button>
                        </Link>
                        <Link href="/shopkeeper/customers/due" className="hidden md:block">
                            <Button variant="outline" className="shadow-sm">
                                <CreditCard className="h-4 w-4 mr-2" />
                                {t('sidebar.due_customers')}
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={() => setIsExportModalOpen(true)}
                            className="w-full md:w-auto h-9 md:h-10 px-3 md:px-4 text-xs md:text-sm shadow-sm border-green-200 hover:border-green-300 hover:bg-green-50 text-green-700"
                        >
                            <Printer className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                            <span className="truncate">{t('Export PDF')}</span>
                        </Button>
                        <Link href="/shopkeeper/billing" className="w-full md:w-auto">
                            <Button size="sm" className="w-full md:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25 h-9 md:h-10 px-3 md:px-4 text-xs md:text-sm">
                                <Receipt className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                                <span className="truncate">{t('billing.new_bill')}</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Info Banner - Mobile First */}
                <div className="mb-4 md:mb-6 p-3 md:p-4 rounded-xl md:rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                    <div className="flex items-start gap-2 md:gap-3">
                        <div className="p-1.5 md:p-2 rounded-lg bg-green-100">
                            <Users className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-green-800 text-sm md:text-base">{t('customers.normal.walk_in_title')}</h3>
                            <p className="text-xs md:text-sm text-green-700 mt-0.5 md:mt-1 hidden sm:block">
                                {t('customers.normal.walk_in_desc')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards - 2x2 on mobile */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
                    <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl md:rounded-2xl">
                        <CardContent className="p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-3">
                                <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                    <Receipt className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">{t('dashboard.total')}</Badge>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold">{totalTransactions}</h3>
                            <p className="text-white/80 text-[10px] md:text-sm mt-0.5 md:mt-1">{t('wholesaler_detail.transactions.title')}</p>
                        </CardContent>
                        <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl md:rounded-2xl">
                        <CardContent className="p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-3">
                                <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                    <IndianRupee className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">{t('reports.revenue')}</Badge>
                            </div>
                            <h3 className="text-lg md:text-2xl font-bold">
                                {formatCurrency(totalRevenue)}
                            </h3>
                            <p className="text-white/80 text-[10px] md:text-sm mt-0.5 md:mt-1">{t('dashboard.total_revenue')}</p>
                        </CardContent>
                        <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-xl md:rounded-2xl">
                        <CardContent className="p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-3">
                                <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">{t('history.time_filters.today')}</Badge>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold">{todaySales}</h3>
                            <p className="text-white/80 text-[10px] md:text-sm mt-0.5 md:mt-1">{t('dashboard.todays_sales')}</p>
                        </CardContent>
                        <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl md:rounded-2xl">
                        <CardContent className="p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-3">
                                <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                    <Banknote className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">{t('history.time_filters.today')}</Badge>
                            </div>
                            <h3 className="text-lg md:text-2xl font-bold">
                                {formatCurrency(todayRevenue)}
                            </h3>
                            <p className="text-white/80 text-[10px] md:text-sm mt-0.5 md:mt-1">{t('dashboard.todays_revenue')}</p>
                        </CardContent>
                        <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
                    </Card>
                </div>

                {/* Main Content Card */}
                <Card className="border-0 shadow-lg md:shadow-xl overflow-hidden rounded-xl md:rounded-2xl">
                    {/* Filter Bar - Mobile First */}
                    <CardHeader className="border-b bg-gray-50/80 p-3 md:py-4 md:px-6">
                        <div className="space-y-2 md:space-y-4">
                            {/* First Row - Title and Search */}
                            {/* First Row - Title and Search */}
                            <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
                                <CardTitle className="text-sm md:text-lg flex items-center gap-1.5 md:gap-2">
                                    <div className="p-1.5 md:p-2 rounded-lg bg-green-100">
                                        <Receipt className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                                    </div>
                                    <span className="hidden sm:inline">{t('wholesaler_detail.transactions.title')}</span>
                                    <span className="sm:hidden">{t('history.title')}</span>
                                    <Badge variant="secondary" className="ml-1 md:ml-2 bg-green-50 text-green-700 text-[10px] md:text-xs px-1.5 md:px-2">
                                        {pagination.total}
                                    </Badge>
                                    {isFetching && !isLoading && (
                                        <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-2 border-green-500 border-t-transparent" />
                                    )}
                                </CardTitle>
                                <div className="relative w-full md:w-auto md:min-w-[280px]">
                                    <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                                    <Input
                                        placeholder={t('common.search')}
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        className="pl-8 md:pl-10 h-9 md:h-10 text-sm bg-white w-full"
                                    />
                                </div>
                            </div>

                            {/* Second Row - Filters with horizontal scroll */}
                            <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
                                <div className="flex gap-2 md:gap-3 items-center min-w-max">
                                    <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                                        <Filter className="h-4 w-4" />
                                        <span className="font-medium">{t('wholesalers_list.filters.filters_label')}</span>
                                    </div>

                                    {/* Date Filter */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="h-8 md:h-9 flex items-center gap-1 md:gap-2 bg-white text-xs md:text-sm px-2 md:px-3">
                                                <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500" />
                                                <span className="hidden sm:inline">{getTimeFilterLabel()}</span>
                                                <span className="sm:hidden">{filters.timeFilter === 'all' ? t('history.time_filters.all') : '...'}</span>
                                                <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-48">
                                            {(['all', 'today', 'yesterday', 'this_week', 'this_month', 'this_year'] as TimeFilterOption[]).map((option) => (
                                                <DropdownMenuItem
                                                    key={option}
                                                    onClick={() => handleTimeFilterChange(option)}
                                                    className={filters.timeFilter === option ? 'bg-green-50 text-green-700' : ''}
                                                >
                                                    {getFilterLabels(t)[option]}
                                                </DropdownMenuItem>
                                            ))}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleTimeFilterChange('custom')}>
                                                {t('history.time_filters.custom')}...
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* Payment Method Filter */}
                                    <Select
                                        value={filters.paymentMethod}
                                        onValueChange={(value) => {
                                            setFilters(prev => ({ ...prev, paymentMethod: value }));
                                        }}
                                    >
                                        <SelectTrigger className="w-[90px] md:w-[140px] h-8 md:h-9 bg-white text-xs md:text-sm">
                                            <SelectValue placeholder={t('wholesaler_payments.form.method')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('wholesaler_payments.filters.all_methods')}</SelectItem>
                                            <SelectItem value="cash">
                                                <span className="flex items-center gap-2">
                                                    <Banknote className="h-3 w-3 text-green-600" />
                                                    {t('dashboard.cash')}
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="card">
                                                <span className="flex items-center gap-2">
                                                    <CreditCard className="h-3 w-3 text-blue-600" />
                                                    {t('dashboard.card')}
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="online">
                                                <span className="flex items-center gap-2">
                                                    <Smartphone className="h-3 w-3 text-purple-600" />
                                                    {t('dashboard.online')}
                                                </span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* Clear Filters */}
                                    {hasActiveFilters && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearFilters}
                                            className="h-8 md:h-9 text-red-600 hover:text-red-700 hover:bg-red-50 px-2 md:px-3 text-xs md:text-sm"
                                        >
                                            <X className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                                            <span className="hidden md:inline">{t('wholesalers_list.filters.clear_all')}</span>
                                            <span className="md:hidden">{t('history.clear_filters')}</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-8 md:p-12 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-t-2 border-b-2 border-green-500 mx-auto" />
                                <p className="text-gray-500 mt-3 md:mt-4 text-sm">Loading transactions...</p>
                            </div>
                        ) : bills.length > 0 ? (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                                <TableHead className="font-semibold">{t('wholesaler_detail.transactions.bill_no')}</TableHead>
                                                <TableHead className="font-semibold">{t('common.customer')}</TableHead>
                                                <TableHead className="font-semibold text-right">{t('wholesaler_payments.form.amount')}</TableHead>
                                                <TableHead className="font-semibold">{t('wholesaler_payments.form.method')}</TableHead>
                                                <TableHead className="font-semibold">{t('wholesaler_payments.table.date_time')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {bills.map((bill) => {
                                                const methodConfig = getPaymentMethodConfig(t)[bill.paymentMethod] || getPaymentMethodConfig(t).cash;
                                                return (
                                                    <TableRow key={bill._id} className="hover:bg-green-50/30 transition-colors">
                                                        <TableCell>
                                                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                                                {bill.billNumber}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold">
                                                                    {bill.entityName?.charAt(0)?.toUpperCase() || 'C'}
                                                                </div>
                                                                <span className="font-medium">{bill.entityName || t('customers.normal.walk_in')}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <span className="text-lg font-bold text-green-600">
                                                                {formatCurrency(bill.totalAmount)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={`${methodConfig.bgColor} ${methodConfig.color} border-0 flex items-center gap-1.5 w-fit`}>
                                                                {methodConfig.icon}
                                                                {methodConfig.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">{i18n.language === 'ml' ? new Intl.DateTimeFormat('ml-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(bill.createdAt)) : format(new Date(bill.createdAt), 'dd MMM yyyy')}</p>
                                                                <p className="text-xs text-gray-500">{i18n.language === 'ml' ? new Intl.DateTimeFormat('ml-IN', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(bill.createdAt)) : format(new Date(bill.createdAt), 'hh:mm a')}</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="md:hidden">
                                    {bills.map((bill, index) => {
                                        const methodConfig = getPaymentMethodConfig(t)[bill.paymentMethod] || getPaymentMethodConfig(t).cash;
                                        return (
                                            <div key={bill._id} className={`p-3 hover:bg-green-50/30 active:scale-[0.99] transition-all ${index !== bills.length - 1 ? 'border-b-2 border-gray-200' : ''}`}>
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                                                            {bill.entityName?.charAt(0)?.toUpperCase() || 'C'}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 text-sm truncate max-w-[140px]">{bill.entityName || t('customers.normal.walk_in')}</p>
                                                            <p className="text-[10px] text-gray-500 font-mono">{bill.billNumber}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-green-600 text-base">{formatCurrency(bill.totalAmount)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <Badge className={`${methodConfig.bgColor} ${methodConfig.color} border-0 text-[10px] px-1.5`}>
                                                        {methodConfig.label}
                                                    </Badge>
                                                    <p className="text-[10px] text-gray-500">
                                                        {i18n.language === 'ml' ? new Intl.DateTimeFormat('ml-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(bill.createdAt)) : format(new Date(bill.createdAt), 'dd MMM, hh:mm a')}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {pagination.total > 0 && (
                                    <>
                                        {/* Mobile Pagination */}
                                        <div className="flex md:hidden items-center justify-center gap-2 px-3 py-3 border-t bg-gray-50/50">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="h-9 px-3"
                                            >
                                                <ChevronLeft className="h-4 w-4 mr-1" />
                                                Prev
                                            </Button>
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                                                <span>{currentPage}</span>
                                                <span className="text-green-400">/</span>
                                                <span>{pagination.totalPages}</span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={currentPage === pagination.totalPages}
                                                className="h-9 px-3"
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </div>

                                        {/* Desktop Pagination */}
                                        <div className="hidden md:flex items-center justify-between px-6 py-4 border-t bg-gray-50/50">
                                            <p className="text-sm text-gray-600">
                                                Showing <span className="font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                                                <span className="font-semibold">{Math.min(currentPage * ITEMS_PER_PAGE, pagination.total)}</span> of{' '}
                                                <span className="font-semibold">{pagination.total}</span> transactions
                                            </p>
                                            {pagination.totalPages > 1 && (
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(1)}
                                                        disabled={currentPage === 1}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <ChevronsLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(currentPage - 1)}
                                                        disabled={currentPage === 1}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>

                                                    {getPageNumbers().map((pageNum, index) => (
                                                        typeof pageNum === 'number' ? (
                                                            <Button
                                                                key={index}
                                                                variant={currentPage === pageNum ? 'default' : 'outline'}
                                                                size="sm"
                                                                onClick={() => setCurrentPage(pageNum)}
                                                                className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                                            >
                                                                {pageNum}
                                                            </Button>
                                                        ) : (
                                                            <span key={index} className="px-2 text-gray-400">...</span>
                                                        )
                                                    ))}

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(currentPage + 1)}
                                                        disabled={currentPage === pagination.totalPages}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(pagination.totalPages)}
                                                        disabled={currentPage === pagination.totalPages}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <ChevronsRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="p-8 md:p-12 text-center">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 md:mb-4">
                                    <Receipt className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                                </div>
                                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">
                                    {hasActiveFilters ? t('wholesalers_list.empty.no_found') : t('customers.normal.no_transactions')}
                                </h3>
                                <p className="text-gray-500 mb-3 md:mb-4 text-sm">
                                    {hasActiveFilters
                                        ? t('wholesalers_list.empty.adjust_filters')
                                        : t('customers.normal.create_first')
                                    }
                                </p>
                                {hasActiveFilters ? (
                                    <Button onClick={clearFilters} variant="outline" size="sm">
                                        <X className="mr-2 h-4 w-4" />
                                        {t('wholesalers_list.filters.clear_all')}
                                    </Button>
                                ) : (
                                    <Link href="/shopkeeper/billing">
                                        <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600">
                                            <Receipt className="mr-2 h-4 w-4" />
                                            {t('billing.new_bill')}
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Custom Date Range Dialog */}
                <Dialog open={isCustomDateOpen} onOpenChange={setIsCustomDateOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-100">
                                    <Calendar className="h-5 w-5 text-green-600" />
                                </div>
                                <DialogTitle>Select Date Range</DialogTitle>
                            </div>
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
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setIsCustomDateOpen(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCustomDateApply}
                                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                                    disabled={!customStartDate || !customEndDate}
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                <CustomerAllSalesPdfModal
                    open={isExportModalOpen}
                    onOpenChange={setIsExportModalOpen}
                    entityType="normal_customer"
                    filters={{
                        search: debouncedSearch,
                        paymentMethod: filters.paymentMethod,
                        startDate: filters.startDate,
                        endDate: filters.endDate
                    }}
                />
            </div>
        </div>
    );
}
