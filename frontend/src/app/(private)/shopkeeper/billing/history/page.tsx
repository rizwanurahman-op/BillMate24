'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
    Search,
    FileText,
    Package,
    Users,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Banknote,
    Smartphone,
    Calendar,
    MoreHorizontal,
    Receipt,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    TrendingUp,
    Plus,
    Filter,
    CalendarDays,
    X,
    Trash2,
    Edit,
    History,
    AlertTriangle,
    Printer,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/app/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import api from '@/config/axios';
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { EditBillModal } from './components/edit-bill-modal';
import { DeleteBillDialog } from './components/delete-bill-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PdfPreviewModal } from './components/pdf-preview-modal';

interface Bill {
    _id: string;
    billNumber: string;
    billType: 'purchase' | 'sale';
    entityType: string;
    entityName: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentMethod: string;
    createdAt: string;
    isDeleted?: boolean;
    isEdited?: boolean;
    notes?: string;
}

type TimeFilter = 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'custom';

interface DateRange {
    startDate: string | null;
    endDate: string | null;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

// Helper to get date range based on filter
function getDateRange(filter: TimeFilter): DateRange {
    const now = new Date();

    switch (filter) {
        case 'today':
            return {
                startDate: format(startOfDay(now), 'yyyy-MM-dd'),
                endDate: format(endOfDay(now), 'yyyy-MM-dd'),
            };
        case 'yesterday':
            const yesterday = subDays(now, 1);
            return {
                startDate: format(startOfDay(yesterday), 'yyyy-MM-dd'),
                endDate: format(endOfDay(yesterday), 'yyyy-MM-dd'),
            };
        case 'this_week':
            return {
                startDate: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
                endDate: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
            };
        case 'this_month':
            return {
                startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
                endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
            };
        case 'last_month':
            const lastMonth = subMonths(now, 1);
            return {
                startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
                endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
            };
        default:
            return { startDate: null, endDate: null };
    }
}


export default function BillHistoryPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const timeFilterOptions = [
        { value: 'all', label: t('history.time_filters.all'), icon: Clock },
        { value: 'today', label: t('history.time_filters.today'), icon: Calendar },
        { value: 'yesterday', label: t('history.time_filters.yesterday'), icon: Calendar },
        { value: 'this_week', label: t('history.time_filters.this_week'), icon: CalendarDays },
        { value: 'this_month', label: t('history.time_filters.this_month'), icon: CalendarDays },
        { value: 'last_month', label: t('history.time_filters.last_month'), icon: CalendarDays },
        { value: 'custom', label: t('history.time_filters.custom'), icon: Filter },
    ];
    const [page, setPage] = useState(1);
    const [billType, setBillType] = useState<string>('all');
    const [paymentMethod, setPaymentMethod] = useState<string>('all');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');
    const [search, setSearch] = useState('');
    const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
    const [includeDeleted, setIncludeDeleted] = useState(false);
    const [showOnlyEdited, setShowOnlyEdited] = useState(false);

    // Management States
    const [editingBill, setEditingBill] = useState<Bill | null>(null);
    const [deletingBill, setDeletingBill] = useState<Bill | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

    const [limit, setLimit] = useState(10);

    // Calculate date range based on selected filter
    const dateRange = useMemo(() => {
        if (timeFilter === 'custom') {
            return {
                startDate: customStartDate || null,
                endDate: customEndDate || null,
            };
        }
        return getDateRange(timeFilter);
    }, [timeFilter, customStartDate, customEndDate]);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['bills', page, billType, paymentMethod, dateRange.startDate, dateRange.endDate, includeDeleted, showOnlyEdited],
        queryFn: async () => {
            let url = `/bills?page=${page}&limit=${limit}`;
            if (billType !== 'all') {
                url += `&billType=${billType}`;
            }
            if (paymentMethod !== 'all') {
                url += `&paymentMethod=${paymentMethod}`;
            }
            if (dateRange.startDate) {
                url += `&startDate=${dateRange.startDate}`;
            }
            if (dateRange.endDate) {
                url += `&endDate=${dateRange.endDate}`;
            }
            if (includeDeleted) {
                url += `&includeDeleted=true`;
            }
            if (showOnlyEdited) {
                url += `&isEdited=true`;
            }
            const response = await api.get(url);
            return response.data;
        },
    });

    // Fetch stats separately
    const { data: statsData } = useQuery({
        queryKey: ['bill-stats'],
        queryFn: async () => {
            const response = await api.get('/bills/stats');
            return response.data.data;
        },
    });

    const bills = data?.data as Bill[] | undefined;
    const pagination = data?.pagination;

    const filteredBills = bills?.filter((bill) =>
        bill.billNumber.toLowerCase().includes(search.toLowerCase()) ||
        bill.entityName.toLowerCase().includes(search.toLowerCase())
    );

    const getPaymentMethodIcon = (method: string) => {
        if (!method) return <Clock className="h-3.5 w-3.5 text-gray-400" />;
        switch (method) {
            case 'cash': return <Banknote className="h-4 w-4" />;
            case 'card': return <CreditCard className="h-4 w-4" />;
            case 'online': return <Smartphone className="h-4 w-4" />;
            default: return <Clock className="h-3.5 w-3.5 text-gray-400" />;
        }
    };

    const getPaymentMethodLabel = (method: string) => {
        if (!method) return '---';
        switch (method) {
            case 'cash': return t('billing.cash');
            case 'card': return t('billing.card');
            case 'online': return t('billing.upi');
            default: return method;
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
            setPage(newPage);
        }
    };

    const handleTimeFilterChange = (value: string) => {
        setTimeFilter(value as TimeFilter);
        setPage(1);
        if (value === 'custom') {
            setIsCustomDateOpen(true);
        } else {
            setCustomStartDate('');
            setCustomEndDate('');
        }
    };

    const applyCustomDateRange = () => {
        setIsCustomDateOpen(false);
        setPage(1);
    };

    const clearFilters = () => {
        setTimeFilter('all');
        setBillType('all');
        setPaymentMethod('all');
        setCustomStartDate('');
        setCustomEndDate('');
        setSearch('');
        setIncludeDeleted(false);
        setShowOnlyEdited(false);
        setPage(1);
    };

    const handleEdit = (bill: Bill) => {
        setEditingBill(bill);
        setIsEditModalOpen(true);
    };

    const handleDelete = (bill: Bill) => {
        setDeletingBill(bill);
        setIsDeleteOpen(true);
    };

    const handleSuccess = () => {
        refetch();
        queryClient.invalidateQueries({ queryKey: ['bill-stats'] });
    };

    // Check if any filter is active
    const hasActiveFilters = timeFilter !== 'all' || billType !== 'all' || paymentMethod !== 'all' || includeDeleted || showOnlyEdited;

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const totalPages = pagination?.totalPages || 1;
        const pages: (number | string)[] = [];

        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (page <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (page >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
            }
        }
        return pages;
    };

    // Get display text for time filter
    const getTimeFilterDisplay = () => {
        if (timeFilter === 'custom' && customStartDate && customEndDate) {
            return `${format(new Date(customStartDate), 'dd MMM')} - ${format(new Date(customEndDate), 'dd MMM')}`;
        }
        return timeFilterOptions.find(o => o.value === timeFilter)?.label || t('history.time_filters.all');
    };

    const now = new Date();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50">
            <Header title={t('history.title')} />

            {/* Mobile-optimized content */}
            <div className="p-3 md:p-6">
                {/* Page Header - Compact on mobile */}
                <div className="mb-4 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
                            {t('history.title')}
                        </h2>
                        <p className="text-gray-600 text-[10px] md:text-base mt-0.5 md:mt-1 flex items-center gap-1.5 md:gap-2">
                            <Calendar className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                            {format(now, 'EEE, MMM d, yyyy')}
                        </p>
                    </div>

                    {/* Action Bar - Optimized for all screens */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsPdfModalOpen(true)}
                            className="flex-1 sm:flex-none h-9 sm:h-10 bg-white hover:bg-gray-50 text-blue-600 border-blue-200 hover:border-blue-300 text-xs sm:text-sm"
                        >
                            <Printer className="h-3.5 w-3.5 mr-1.5 sm:mr-2" />
                            {t('Export PDF')}
                        </Button>

                        <Link href="/shopkeeper/reports/daily" className="hidden sm:block">
                            <Button variant="outline" size="sm" className="h-9 sm:h-10 text-xs sm:text-sm">
                                <FileText className="h-3.5 w-3.5 mr-1.5 sm:mr-2" />
                                {t('history.reports')}
                            </Button>
                        </Link>

                        <Link href="/shopkeeper/billing" className="flex-1 sm:flex-none">
                            <Button size="sm" className="w-full h-9 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md text-xs sm:text-sm">
                                <Plus className="h-3.5 w-3.5 mr-1.5 sm:mr-2" />
                                {t('New')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 md:h-36 animate-pulse bg-gray-200 rounded-xl md:rounded-2xl" />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Stats Cards - 2 columns on mobile, 4 on desktop */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-8">
                            {/* Total Bills */}
                            <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                <CardContent className="p-3 md:p-6">
                                    <div className="flex items-center justify-between mb-2 md:mb-4">
                                        <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                            <FileText className="h-4 w-4 md:h-6 md:w-6" />
                                        </div>
                                        <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                                            {t('history.all_time')}
                                        </Badge>
                                    </div>
                                    <h3 className="text-xl md:text-3xl font-bold">{statsData?.totalBills || 0}</h3>
                                    <p className="text-white/80 text-xs md:text-base mt-0.5 md:mt-1">{t('history.total_bills')}</p>
                                    <p className="text-[10px] md:text-xs text-white/60 mt-1 md:mt-2 flex items-center gap-1">
                                        <TrendingUp className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                        {t('history.complete_history')}
                                    </p>
                                </CardContent>
                                <div className="absolute -bottom-4 -right-4 w-16 md:w-24 h-16 md:h-24 bg-white/10 rounded-full blur-2xl" />
                            </Card>

                            {/* Sales */}
                            <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                                <CardContent className="p-3 md:p-6">
                                    <div className="flex items-center justify-between mb-2 md:mb-4">
                                        <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                            <ArrowUpRight className="h-4 w-4 md:h-6 md:w-6" />
                                        </div>
                                        <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                                            {t('history.sales')}
                                        </Badge>
                                    </div>
                                    <h3 className="text-xl md:text-3xl font-bold">{statsData?.totalSales || 0}</h3>
                                    <p className="text-white/80 text-xs md:text-base mt-0.5 md:mt-1">{t('history.sale_bills')}</p>
                                    <p className="text-[10px] md:text-xs text-white/60 mt-1 md:mt-2 flex items-center gap-1">
                                        <Users className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                        {t('history.to_customers')}
                                    </p>
                                </CardContent>
                                <div className="absolute -bottom-4 -right-4 w-16 md:w-24 h-16 md:h-24 bg-white/10 rounded-full blur-2xl" />
                            </Card>

                            {/* Purchases */}
                            <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
                                <CardContent className="p-3 md:p-6">
                                    <div className="flex items-center justify-between mb-2 md:mb-4">
                                        <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                            <ArrowDownRight className="h-4 w-4 md:h-6 md:w-6" />
                                        </div>
                                        <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                                            {t('history.purchases')}
                                        </Badge>
                                    </div>
                                    <h3 className="text-xl md:text-3xl font-bold">{statsData?.totalPurchases || 0}</h3>
                                    <p className="text-white/80 text-xs md:text-base mt-0.5 md:mt-1">{t('history.purchase_bills')}</p>
                                    <p className="text-[10px] md:text-xs text-white/60 mt-1 md:mt-2 flex items-center gap-1">
                                        <Package className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                        {t('history.from_wholesalers')}
                                    </p>
                                </CardContent>
                                <div className="absolute -bottom-4 -right-4 w-16 md:w-24 h-16 md:h-24 bg-white/10 rounded-full blur-2xl" />
                            </Card>

                            {/* Today's Bills */}
                            <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                <CardContent className="p-3 md:p-6">
                                    <div className="flex items-center justify-between mb-2 md:mb-4">
                                        <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                            <Clock className="h-4 w-4 md:h-6 md:w-6" />
                                        </div>
                                        <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                                            {t('history.today')}
                                        </Badge>
                                    </div>
                                    <h3 className="text-xl md:text-3xl font-bold">{statsData?.todayBills || 0}</h3>
                                    <p className="text-white/80 text-xs md:text-base mt-0.5 md:mt-1">{t('history.todays_bills')}</p>
                                    <p className="text-[10px] md:text-xs text-white/60 mt-1 md:mt-2 flex items-center gap-1">
                                        <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                        {format(now, 'dd MMM yyyy')}
                                    </p>
                                </CardContent>
                                <div className="absolute -bottom-4 -right-4 w-16 md:w-24 h-16 md:h-24 bg-white/10 rounded-full blur-2xl" />
                            </Card>
                        </div>

                        {/* Main Content Card */}
                        <Card className="border-0 shadow-lg overflow-hidden rounded-xl md:rounded-2xl">
                            {/* Filter Bar - Mobile optimized */}
                            <CardHeader className="border-b bg-gray-50/80 p-3 md:py-4 md:px-6">
                                <div className="flex flex-col gap-3 md:gap-4">
                                    {/* Header and Search Row */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <CardTitle className="text-lg md:text-xl flex items-center gap-2.5">
                                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                                <Receipt className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <span className="font-bold tracking-tight">{t('history.all_transactions')}</span>
                                                {hasActiveFilters && (
                                                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 text-[10px] md:text-xs">
                                                        {t('history.filtered')}
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardTitle>

                                        {/* Search Bar */}
                                        <div className="relative w-full sm:max-w-xs">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder={t('history.search_placeholder')}
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="pl-10 h-10 md:h-11 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    {/* Filters Grid/Row */}
                                    <div className="grid grid-cols-2 lg:flex lg:flex-wrap items-center gap-2 md:gap-3">
                                        {/* Time Filter */}
                                        <div className="col-span-1">
                                            <Popover open={isCustomDateOpen && timeFilter === 'custom'} onOpenChange={setIsCustomDateOpen}>
                                                <PopoverTrigger asChild>
                                                    <div className="flex">
                                                        <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
                                                            <SelectTrigger className="w-full lg:w-44 h-10 bg-white border-gray-200">
                                                                <CalendarDays className="h-4 w-4 mr-2 text-blue-500" />
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {timeFilterOptions.map((option) => (
                                                                    <SelectItem key={option.value} value={option.value}>
                                                                        <div className="flex items-center gap-2">
                                                                            <option.icon className="h-4 w-4 text-gray-500" />
                                                                            {option.label}
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[360px] p-0 shadow-2xl border-0" align="start">
                                                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-t-lg">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 text-white">
                                                                <CalendarDays className="h-5 w-5" />
                                                                <h4 className="font-semibold">{t('history.custom_range.title')}</h4>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setTimeFilter('all');
                                                                    setIsCustomDateOpen(false);
                                                                }}
                                                                className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/20"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        {/* Selected Range Preview */}
                                                        {customStartDate && customEndDate && (
                                                            <div className="mt-3 px-3 py-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                                                <p className="text-white/80 text-xs">{t('history.custom_range.selected')}</p>
                                                                <p className="text-white font-medium">
                                                                    {format(new Date(customStartDate), 'dd MMM yyyy')} → {format(new Date(customEndDate), 'dd MMM yyyy')}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="p-4 space-y-4">
                                                        {/* Quick Presets */}
                                                        <div>
                                                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('history.custom_range.presets')}</Label>
                                                            <div className="grid grid-cols-3 gap-2 mt-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const end = new Date();
                                                                        const start = subDays(end, 7);
                                                                        setCustomStartDate(format(start, 'yyyy-MM-dd'));
                                                                        setCustomEndDate(format(end, 'yyyy-MM-dd'));
                                                                    }}
                                                                    className="text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                                                                >
                                                                    {t('history.custom_range.last_7_days')}
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const end = new Date();
                                                                        const start = subDays(end, 30);
                                                                        setCustomStartDate(format(start, 'yyyy-MM-dd'));
                                                                        setCustomEndDate(format(end, 'yyyy-MM-dd'));
                                                                    }}
                                                                    className="text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                                                                >
                                                                    {t('history.custom_range.last_30_days')}
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const end = new Date();
                                                                        const start = subDays(end, 90);
                                                                        setCustomStartDate(format(start, 'yyyy-MM-dd'));
                                                                        setCustomEndDate(format(end, 'yyyy-MM-dd'));
                                                                    }}
                                                                    className="text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                                                                >
                                                                    {t('history.custom_range.last_90_days')}
                                                                </Button>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const start = startOfMonth(subMonths(now, 2));
                                                                        const end = endOfMonth(subMonths(now, 1));
                                                                        setCustomStartDate(format(start, 'yyyy-MM-dd'));
                                                                        setCustomEndDate(format(end, 'yyyy-MM-dd'));
                                                                    }}
                                                                    className="text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                                                                >
                                                                    {t('history.custom_range.last_2_months')}
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const start = startOfMonth(subMonths(now, 5));
                                                                        const end = endOfMonth(now);
                                                                        setCustomStartDate(format(start, 'yyyy-MM-dd'));
                                                                        setCustomEndDate(format(end, 'yyyy-MM-dd'));
                                                                    }}
                                                                    className="text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                                                                >
                                                                    {t('history.custom_range.last_6_months')}
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="relative">
                                                            <div className="absolute inset-0 flex items-center">
                                                                <span className="w-full border-t" />
                                                            </div>
                                                            <div className="relative flex justify-center text-xs">
                                                                <span className="bg-white px-3 text-gray-500">{t('history.custom_range.or_select')}</span>
                                                            </div>
                                                        </div>

                                                        {/* Date Inputs */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs font-medium text-gray-600">{t('history.custom_range.from')}</Label>
                                                                <div className="relative">
                                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                                    <Input
                                                                        type="date"
                                                                        value={customStartDate}
                                                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                                                        className="pl-10 text-sm h-10"
                                                                        max={customEndDate || format(now, 'yyyy-MM-dd')}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs font-medium text-gray-600">{t('history.custom_range.to')}</Label>
                                                                <div className="relative">
                                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                                    <Input
                                                                        type="date"
                                                                        value={customEndDate}
                                                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                                                        className="pl-10 text-sm h-10"
                                                                        min={customStartDate}
                                                                        max={format(now, 'yyyy-MM-dd')}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex gap-2 pt-2">
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setCustomStartDate('');
                                                                    setCustomEndDate('');
                                                                }}
                                                                className="flex-1"
                                                                disabled={!customStartDate && !customEndDate}
                                                            >
                                                                {t('history.custom_range.clear')}
                                                            </Button>
                                                            <Button
                                                                onClick={applyCustomDateRange}
                                                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                                                disabled={!customStartDate || !customEndDate}
                                                            >
                                                                {t('history.custom_range.apply')}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        {/* Show selected custom date range - Full width on mobile if present */}
                                        {timeFilter === 'custom' && customStartDate && customEndDate && (
                                            <div className="col-span-2 lg:col-span-1 flex items-center">
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 px-3 py-1 text-xs whitespace-nowrap border-blue-100">
                                                    <Calendar className="h-3 w-3 mr-1.5" />
                                                    {format(new Date(customStartDate), 'dd MMM')} - {format(new Date(customEndDate), 'dd MMM')}
                                                </Badge>
                                            </div>
                                        )}

                                        <div className="h-6 w-px bg-gray-300 hidden md:block flex-shrink-0" />

                                        {/* Bill Type Filter */}
                                        <div className="col-span-1">
                                            <Select value={billType} onValueChange={(v) => { setBillType(v); setPage(1); }}>
                                                <SelectTrigger className="w-full lg:w-36 h-10 bg-white border-gray-200">
                                                    <SelectValue placeholder={t('history.all_types')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{t('history.all_types')}</SelectItem>
                                                    <SelectItem value="sale">
                                                        <div className="flex items-center gap-2">
                                                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                                                            {t('billing.sale')}
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="purchase">
                                                        <div className="flex items-center gap-2">
                                                            <ArrowDownRight className="h-4 w-4 text-orange-600" />
                                                            {t('billing.purchase')}
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Status Filter */}
                                        <div className="col-span-1">
                                            <Select
                                                value={includeDeleted ? 'deleted' : showOnlyEdited ? 'edited' : 'active'}
                                                onValueChange={(v) => {
                                                    setIncludeDeleted(v === 'deleted');
                                                    setShowOnlyEdited(v === 'edited');
                                                    setPage(1);
                                                }}
                                            >
                                                <SelectTrigger className="w-full lg:w-40 h-10 bg-white border-gray-200">
                                                    <SelectValue placeholder={t('history.active')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-green-500" />
                                                            {t('history.active')}
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="edited">
                                                        <div className="flex items-center gap-2">
                                                            <History className="h-4 w-4 text-blue-500" />
                                                            {t('history.edited')}
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="deleted">
                                                        <div className="flex items-center gap-2">
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                            {t('history.deleted')}
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Payment Method Filter */}
                                        <div className="col-span-1">
                                            <Select value={paymentMethod} onValueChange={(v) => { setPaymentMethod(v); setPage(1); }}>
                                                <SelectTrigger className="w-full lg:w-40 h-10 bg-white border-gray-200">
                                                    <SelectValue placeholder={t('history.all_methods')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{t('history.all_methods')}</SelectItem>
                                                    <SelectItem value="cash">
                                                        <div className="flex items-center gap-2">
                                                            <Banknote className="h-4 w-4 text-green-600" />
                                                            {t('billing.cash')}
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="card">
                                                        <div className="flex items-center gap-2">
                                                            <CreditCard className="h-4 w-4 text-blue-600" />
                                                            {t('billing.card')}
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="online">
                                                        <div className="flex items-center gap-2">
                                                            <Smartphone className="h-4 w-4 text-purple-600" />
                                                            {t('billing.upi')}
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Clear Filters Button */}
                                        {hasActiveFilters && (
                                            <div className="col-span-2 lg:col-span-1 pt-1 lg:pt-0">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={clearFilters}
                                                    className="w-full lg:w-auto text-gray-500 hover:text-red-600 hover:bg-red-50 h-10 px-4 transition-colors font-medium border border-dashed border-gray-200 lg:border-none"
                                                >
                                                    <X className="h-4 w-4 mr-2" />
                                                    {t('history.clear_filters')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    {filteredBills && filteredBills.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                                    <TableHead className="font-semibold">{t('history.bill_no')}</TableHead>
                                                    <TableHead className="font-semibold">{t('history.type')}</TableHead>
                                                    <TableHead className="font-semibold">{t('history.entity')}</TableHead>
                                                    <TableHead className="font-semibold text-right">{t('history.amount')}</TableHead>
                                                    <TableHead className="font-semibold text-right">{t('history.paid')}</TableHead>
                                                    <TableHead className="font-semibold">{t('history.status')}</TableHead>
                                                    <TableHead className="font-semibold">{t('history.method')}</TableHead>
                                                    <TableHead className="font-semibold">{t('history.date')}</TableHead>
                                                    <TableHead className="font-semibold text-right">{t('history.actions')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredBills.map((bill) => (
                                                    <TableRow
                                                        key={bill._id}
                                                        className={`hover:bg-gray-50 transition-colors ${bill.isDeleted ? 'opacity-50 grayscale-[0.5] bg-gray-50/50' : ''}`}
                                                    >
                                                        <TableCell className="font-mono text-sm font-semibold">
                                                            <div className="flex flex-col">
                                                                <span>{bill.billNumber}</span>
                                                                {bill.isEdited && (
                                                                    <span className="text-[10px] text-blue-500 font-bold flex items-center gap-0.5">
                                                                        <History className="h-2.5 w-2.5" /> EDITED
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${bill.billType === 'sale'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-orange-100 text-orange-700'
                                                                }`}>
                                                                {bill.billType === 'sale' ? (
                                                                    <ArrowUpRight className="h-3 w-3" />
                                                                ) : (
                                                                    <ArrowDownRight className="h-3 w-3" />
                                                                )}
                                                                {bill.billType === 'sale' ? t('billing.sale') : t('billing.purchase')}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="max-w-[180px]">
                                                            <p className="font-medium truncate">{bill.entityName}</p>
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-gray-900">
                                                            {formatCurrency(bill.totalAmount)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold text-green-600">
                                                            {formatCurrency(bill.paidAmount)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {bill.dueAmount > 0 ? (
                                                                <Badge variant="destructive" className="bg-red-100 text-red-700 border-0 font-mono">
                                                                    {t('history.due')}: {formatCurrency(bill.dueAmount)}
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="bg-green-100 text-green-700 border-0">
                                                                    ✓ {t('billing.paid')}
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${!bill.paymentMethod ? 'bg-gray-100 text-gray-600' :
                                                                bill.paymentMethod === 'cash' ? 'bg-green-50 text-green-700' :
                                                                    bill.paymentMethod === 'card' ? 'bg-blue-50 text-blue-700' :
                                                                        'bg-purple-50 text-purple-700'
                                                                }`}>
                                                                {getPaymentMethodIcon(bill.paymentMethod)}
                                                                <span className="font-medium">{getPaymentMethodLabel(bill.paymentMethod)}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-gray-500 text-sm">
                                                            {format(new Date(bill.createdAt), 'dd MMM yyyy')}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {!bill.isDeleted ? (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-36">
                                                                        <DropdownMenuItem onClick={() => handleEdit(bill)}>
                                                                            <Edit className="mr-2 h-4 w-4" />
                                                                            {t('history.edit_bill')}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleDelete(bill)}
                                                                            className="text-red-600 focus:text-red-600"
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            {t('common.delete')}
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            ) : (
                                                                <Badge variant="outline" className="text-gray-400 border-gray-200">
                                                                    {t('history.deleted')}
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="p-12 text-center">
                                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                                <Receipt className="h-10 w-10 text-gray-300" />
                                            </div>
                                            <p className="text-gray-500 font-semibold text-lg">{t('history.no_bills_found')}</p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {hasActiveFilters ? t('history.adjust_filters') : t('history.create_new_desc')}
                                            </p>
                                            {hasActiveFilters ? (
                                                <Button onClick={clearFilters} variant="outline" className="mt-4">
                                                    {t('history.clear_filters')}
                                                </Button>
                                            ) : (
                                                <Link href="/shopkeeper/billing">
                                                    <Button className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600">
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        {t('history.new_bill')}
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Mobile Cards - Professional design with clear data separation */}
                                <div className="md:hidden">
                                    {filteredBills && filteredBills.length > 0 ? (
                                        <>
                                            {filteredBills.map((bill, index) => (
                                                <div
                                                    key={bill._id}
                                                    className={`p-3 bg-white active:scale-[0.99] transition-all ${index !== filteredBills.length - 1 ? 'border-b-2 border-gray-200' : ''} ${bill.isDeleted ? 'opacity-50 grayscale-[0.5] bg-gray-50' : ''}`}
                                                >
                                                    {/* Header Row - Icon, Name, Type Badge */}
                                                    <div className="flex items-center gap-3 mb-2">
                                                        {/* Icon */}
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bill.billType === 'sale'
                                                            ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                                                            : 'bg-gradient-to-br from-orange-400 to-red-500'
                                                            }`}>
                                                            {bill.billType === 'sale' ? (
                                                                <ArrowUpRight className="h-5 w-5 text-white" />
                                                            ) : (
                                                                <ArrowDownRight className="h-5 w-5 text-white" />
                                                            )}
                                                        </div>

                                                        {/* Name and Bill Number */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-gray-900 text-sm truncate">{bill.entityName}</p>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-mono text-[11px] text-gray-400">{bill.billNumber}</p>
                                                                {bill.isEdited && (
                                                                    <span className="text-[9px] text-blue-500 font-bold bg-blue-50 px-1 rounded flex items-center gap-0.5">
                                                                        <History className="h-2 w-2" /> {t('history.edited').toUpperCase()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Type Badge */}
                                                        <Badge className={`text-[10px] px-2 py-0.5 flex-shrink-0 ${bill.billType === 'sale'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-orange-100 text-orange-700'
                                                            } border-0`}>
                                                            {bill.billType === 'sale' ? t('billing.sale') : t('billing.purchase')}
                                                        </Badge>

                                                        {/* Actions for mobile */}
                                                        {!bill.isDeleted && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                                                                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-36">
                                                                    <DropdownMenuItem onClick={() => handleEdit(bill)}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        {t('history.edit_bill')}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDelete(bill)}
                                                                        className="text-red-600 focus:text-red-600"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </div>

                                                    {/* Amount Row - Total, Paid, Due/Status */}
                                                    <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
                                                        <div className="flex items-center divide-x divide-gray-200">
                                                            {/* Total Amount */}
                                                            <div className="flex-1 text-center px-2">
                                                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mb-1">{t('history.amount')}</p>
                                                                <p className="font-bold text-gray-900 text-sm">{formatCurrency(bill.totalAmount)}</p>
                                                            </div>

                                                            {/* Paid Amount */}
                                                            <div className="flex-1 text-center px-2">
                                                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mb-1">{t('history.paid')}</p>
                                                                <p className="font-bold text-green-600 text-sm">{formatCurrency(bill.paidAmount)}</p>
                                                            </div>

                                                            {/* Due/Status */}
                                                            <div className="flex-1 text-center px-2">
                                                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mb-1">{t('history.due')}</p>
                                                                {bill.dueAmount > 0 ? (
                                                                    <p className="font-bold text-red-600 text-sm">{formatCurrency(bill.dueAmount)}</p>
                                                                ) : (
                                                                    <p className="font-bold text-green-600 text-sm">✓ {t('history.nil')}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Footer Row - Payment Method and Date */}
                                                    <div className="flex items-center justify-between">
                                                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${!bill.paymentMethod ? 'bg-gray-100 text-gray-600' :
                                                            bill.paymentMethod === 'cash' ? 'bg-green-50 text-green-700' :
                                                                bill.paymentMethod === 'card' ? 'bg-blue-50 text-blue-700' :
                                                                    'bg-purple-50 text-purple-700'
                                                            }`}>
                                                            {!bill.paymentMethod && <Clock className="h-3.5 w-3.5" />}
                                                            {bill.paymentMethod === 'cash' && <Banknote className="h-3.5 w-3.5" />}
                                                            {bill.paymentMethod === 'card' && <CreditCard className="h-3.5 w-3.5" />}
                                                            {bill.paymentMethod === 'online' && <Smartphone className="h-3.5 w-3.5" />}
                                                            <span>{getPaymentMethodLabel(bill.paymentMethod)}</span>
                                                        </div>

                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {format(new Date(bill.createdAt), 'dd MMM, hh:mm a')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="p-8 text-center">
                                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                                <Receipt className="h-8 w-8 text-gray-300" />
                                            </div>
                                            <p className="text-gray-500 font-medium">{t('history.no_bills_found')}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {hasActiveFilters ? t('history.adjust_filters') : t('history.create_new_desc')}
                                            </p>
                                            {!hasActiveFilters && (
                                                <Link href="/shopkeeper/billing">
                                                    <Button size="sm" className="mt-3 bg-gradient-to-r from-blue-600 to-purple-600">
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        {t('history.new_bill')}
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>

                            {/* Pagination - Compact on mobile */}
                            {pagination && pagination.totalPages > 1 && (
                                <div className="p-3 md:p-4 border-t bg-gray-50/50">
                                    <div className="flex items-center justify-between gap-2 md:gap-4">
                                        <div className="flex items-center gap-4 hidden sm:flex">
                                            <p className="text-[10px] md:text-sm text-gray-500">
                                                <span className="font-semibold">{((page - 1) * limit) + 1}</span>-<span className="font-semibold">{Math.min(page * limit, pagination.total)}</span> of <span className="font-semibold">{pagination.total}</span>
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400">Rows:</span>
                                                <Select value={limit.toString()} onValueChange={(v) => { setLimit(parseInt(v)); setPage(1); }}>
                                                    <SelectTrigger className="h-7 w-16 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="10">10</SelectItem>
                                                        <SelectItem value="25">25</SelectItem>
                                                        <SelectItem value="50">50</SelectItem>
                                                        <SelectItem value="100">100</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 md:gap-2 mx-auto sm:mx-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(page - 1)}
                                                disabled={page === 1}
                                                className="h-8 w-8 md:h-9 md:w-9 p-0"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>

                                            {/* Page Numbers - Desktop */}
                                            <div className="hidden md:flex items-center gap-1">
                                                {getPageNumbers().map((pageNum, idx) => (
                                                    pageNum === '...' ? (
                                                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </span>
                                                    ) : (
                                                        <Button
                                                            key={pageNum}
                                                            variant={page === pageNum ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => handlePageChange(pageNum as number)}
                                                            className={`h-9 w-9 p-0 ${page === pageNum ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0' : ''}`}
                                                        >
                                                            {pageNum}
                                                        </Button>
                                                    )
                                                ))}
                                            </div>

                                            {/* Mobile Page Indicator - Pill style */}
                                            <div className="md:hidden flex items-center bg-white border rounded-lg px-3 py-1.5">
                                                <span className="text-xs font-bold text-blue-600">{page}</span>
                                                <span className="text-xs text-gray-400 mx-1">/</span>
                                                <span className="text-xs text-gray-500">{pagination.totalPages}</span>
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(page + 1)}
                                                disabled={page >= pagination.totalPages}
                                                className="h-8 w-8 md:h-9 md:w-9 p-0"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </>
                )}
            </div>

            {/* Modals & Dialogs */}
            <EditBillModal
                bill={editingBill}
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                onSuccess={handleSuccess}
            />

            <DeleteBillDialog
                bill={deletingBill}
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onSuccess={handleSuccess}
            />

            <PdfPreviewModal
                open={isPdfModalOpen}
                onOpenChange={setIsPdfModalOpen}
                filters={{
                    billType,
                    paymentMethod,
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    search,
                    includeDeleted,
                    showOnlyEdited,
                }}
            />
        </div>
    );
}
