'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, IndianRupee, Calendar, Building2, ChevronDown, X, Filter,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Package, TrendingUp, CreditCard, Banknote, Smartphone, Wallet,
    LayoutDashboard, Users, Plus, CheckCircle
} from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { WholesalerAllPaymentsPdfModal } from './components/wholesaler-all-payments-pdf-modal';
import { Printer } from 'lucide-react';

import { Header } from '@/components/app/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import api from '@/config/axios';
import { toast } from 'sonner';

interface Wholesaler {
    _id: string;
    name: string;
    outstandingDue: number;
}

interface Payment {
    _id: string;
    entityName: string;
    amount: number;
    paymentMethod: string;
    createdAt: string;
    notes?: string;
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

type TimeFilterOption = 'all' | 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';

interface FiltersState {
    search: string;
    timeFilter: TimeFilterOption;
    paymentMethod: string;
    startDate?: string;
    endDate?: string;
}

const filterLabels: Record<TimeFilterOption, string> = {
    all: 'history.time_filters.all',
    today: 'history.time_filters.today',
    this_week: 'history.time_filters.this_week',
    this_month: 'history.time_filters.this_month',
    this_year: 'history.time_filters.this_year',
    custom: 'history.time_filters.custom',
};

const paymentMethodConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode; iconSmall: React.ReactNode; labelKey: string }> = {
    cash: {
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        icon: <Banknote className="h-4 w-4" />,
        iconSmall: <Banknote className="h-3.5 w-3.5" />,
        labelKey: 'wholesaler_payments.filters.cash'
    },
    card: {
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        icon: <CreditCard className="h-4 w-4" />,
        iconSmall: <CreditCard className="h-3.5 w-3.5" />,
        labelKey: 'wholesaler_payments.filters.card'
    },
    online: {
        color: 'text-purple-700',
        bgColor: 'bg-purple-100',
        icon: <Smartphone className="h-4 w-4" />,
        iconSmall: <Smartphone className="h-3.5 w-3.5" />,
        labelKey: 'wholesaler_payments.filters.upi'
    },
};

// Format compact currency for mobile


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

const ITEMS_PER_PAGE = 10;

export default function WholesalerPaymentsPage() {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [selectedWholesaler, setSelectedWholesaler] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('cash');
    const [page, setPage] = useState(1);
    const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const [filters, setFilters] = useState<FiltersState>({
        search: '',
        timeFilter: 'all',
        paymentMethod: 'all',
    });

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // Build query params
    const buildQueryParams = () => {
        const params = new URLSearchParams();
        params.set('entityType', 'wholesaler');
        params.set('page', page.toString());
        params.set('limit', ITEMS_PER_PAGE.toString());
        if (filters.search) params.set('search', filters.search);
        if (filters.paymentMethod && filters.paymentMethod !== 'all') {
            params.set('paymentMethod', filters.paymentMethod);
        }
        if (filters.startDate) params.set('startDate', filters.startDate);
        if (filters.endDate) params.set('endDate', filters.endDate);
        return params.toString();
    };

    // Fetch wholesalers with outstanding dues
    const { data: wholesalersResponse } = useQuery({
        queryKey: ['wholesalers-with-dues'],
        queryFn: async () => {
            const response = await api.get('/wholesalers?limit=100');
            return response.data;
        },
    });

    const wholesalers = (wholesalersResponse?.data || []) as Wholesaler[];

    // Fetch payments with filters
    const { data: paymentsData, isLoading, isFetching } = useQuery({
        queryKey: ['wholesaler-payments', page, filters],
        queryFn: async () => {
            const response = await api.get<PaginatedResponse<Payment>>(`/payments?${buildQueryParams()}`);
            return response.data;
        },
    });

    // Record payment mutation
    const paymentMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/payments', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wholesaler-payments'] });
            queryClient.invalidateQueries({ queryKey: ['wholesalers-with-dues'] });
            queryClient.invalidateQueries({ queryKey: ['wholesalers'] });
            queryClient.invalidateQueries({ queryKey: ['wholesalers-dashboard'] });
            setIsPaymentOpen(false);
            setSelectedWholesaler('');
            setPaymentMethod('cash');
            toast.success(t('wholesaler_payments.messages.success'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('wholesaler_payments.messages.error'));
        },
    });

    const handleWholesalerSelect = (value: string, option?: ComboboxOption) => {
        setSelectedWholesaler(value);
    };

    const handlePayment = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const wholesaler = wholesalers?.find(w => w._id === selectedWholesaler);

        if (!wholesaler) {
            toast.error(t('wholesaler_payments.messages.select_wholesaler'));
            return;
        }

        const amount = parseFloat(formData.get('amount') as string);
        if (!amount || amount <= 0) {
            toast.error(t('wholesaler_payments.messages.invalid_amount'));
            return;
        }

        paymentMutation.mutate({
            entityType: 'wholesaler',
            entityId: selectedWholesaler,
            entityName: wholesaler.name,
            amount,
            paymentMethod: paymentMethod,
            notes: formData.get('notes') || '',
        });
    };

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
            setPage(1);
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
            setPage(1);
            setIsCustomDateOpen(false);
        }
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            timeFilter: 'all',
            paymentMethod: 'all',
        });
        setPage(1);
    };

    const getTimeFilterLabel = () => {
        if (filters.timeFilter === 'custom' && filters.startDate && filters.endDate) {
            if (i18n.language === 'ml') {
                const formatter = new Intl.DateTimeFormat('ml-IN', { day: 'numeric', month: 'short' });
                return `${formatter.format(new Date(filters.startDate))} - ${formatter.format(new Date(filters.endDate))}`;
            }
            return `${format(new Date(filters.startDate), 'dd MMM')} - ${format(new Date(filters.endDate), 'dd MMM')}`;
        }
        return t(filterLabels[filters.timeFilter]);
    };

    const hasActiveFilters = filters.search || filters.timeFilter !== 'all' || filters.paymentMethod !== 'all';

    const wholesalersWithDues = wholesalers?.filter(w => w.outstandingDue > 0) || [];
    const allWholesalers = wholesalers || [];
    const totalOutstanding = wholesalersWithDues.reduce((sum, w) => sum + w.outstandingDue, 0);

    const wholesalerOptions: ComboboxOption[] = useMemo(() => {
        return allWholesalers.map((w) => ({
            value: w._id,
            label: w.name,
            subLabel: w.outstandingDue > 0 ? `${t('wholesaler_payments.stats.due')}: ${formatCurrency(w.outstandingDue)}` : undefined,
        }));
    }, [allWholesalers, t]);

    const payments = paymentsData?.data || [];
    const pagination = paymentsData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

    // Calculate total amount for current filter
    const totalPaidInPeriod = payments.reduce((sum, p) => sum + p.amount, 0);

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const totalPages = pagination.totalPages;
        if (totalPages <= 7) {
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/20">
            <Header title={t('wholesaler_payments.subtitle')} />

            <div className="p-3 md:p-6">
                {/* Page Header */}
                <div className="mb-4 md:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                {t('wholesaler_payments.title')}
                            </h2>
                            <CreditCard className="h-5 w-5 md:h-8 md:w-8 text-emerald-600" />
                        </div>
                        <p className="text-gray-600 mt-0.5 md:mt-1 flex items-center gap-1.5 md:gap-2 text-xs md:text-base">
                            <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            {i18n.language === 'ml' ? (
                                <span>{new Intl.DateTimeFormat('ml-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())}</span>
                            ) : (
                                <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
                            )}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <Link href="/shopkeeper/wholesalers/dashboard" className="hidden lg:block">
                            <Button variant="outline" className="shadow-sm">
                                <LayoutDashboard className="h-4 w-4 mr-2" />
                                {t('common.dashboard')}
                            </Button>
                        </Link>
                        <Link href="/shopkeeper/wholesalers" className="hidden lg:block">
                            <Button variant="outline" className="shadow-sm">
                                <Users className="h-4 w-4 mr-2" />
                                {t('common.wholesalers')}
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={() => setIsExportModalOpen(true)}
                            className="shadow-sm border-sky-200 hover:border-sky-300 hover:bg-sky-50 text-sky-700 flex-1 md:flex-none h-9 md:h-10 justify-center"
                        >
                            <Printer className="h-4 w-4 mr-1.5 md:mr-2" />
                            {t('Export PDF')}
                        </Button>
                        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25 h-9 md:h-10 px-3 md:px-4 text-sm flex-1 md:flex-none justify-center">
                                    <Plus className="mr-1.5 md:mr-2 h-4 w-4" />
                                    <span>{t('wholesaler_payments.record_payment')}</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 md:p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                                            <IndianRupee className="h-5 w-5 md:h-6 md:w-6" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-lg md:text-xl">{t('wholesaler_payments.record_payment')}</DialogTitle>
                                            <p className="text-xs md:text-sm text-gray-500 mt-0.5">{t('wholesaler_payments.record_desc')}</p>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <form onSubmit={handlePayment} className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm">
                                            <Package className="h-4 w-4 text-gray-400" />
                                            {t('wholesaler_payments.form.wholesaler')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Combobox
                                            options={wholesalerOptions}
                                            value={selectedWholesaler}
                                            onValueChange={handleWholesalerSelect}
                                            placeholder={t('wholesaler_payments.messages.select_wholesaler')}
                                            emptyMessage={t('wholesaler_payments.messages.no_wholesaler_found')}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="amount" className="flex items-center gap-2 text-sm">
                                            <IndianRupee className="h-4 w-4 text-gray-400" />
                                            {t('wholesaler_payments.form.amount')} <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                                            <Input
                                                id="amount"
                                                name="amount"
                                                type="number"
                                                step="0.01"
                                                className="pl-8 h-10 md:h-11 text-lg font-semibold"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm">
                                            <CreditCard className="h-4 w-4 text-gray-400" />
                                            {t('wholesaler_payments.form.method')} <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="grid grid-cols-3 gap-2 md:gap-3">
                                            {Object.entries(paymentMethodConfig).map(([key, config]) => (
                                                <Button
                                                    key={key}
                                                    type="button"
                                                    variant={paymentMethod === key ? 'default' : 'outline'}
                                                    className={`h-9 md:h-10 text-xs md:text-sm ${paymentMethod === key
                                                        ? `${config.bgColor} ${config.color} border-2 border-current hover:opacity-90`
                                                        : ''
                                                        }`}
                                                    onClick={() => setPaymentMethod(key)}
                                                >
                                                    {config.iconSmall}
                                                    <span className="ml-1.5">{t(config.labelKey)}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notes" className="text-sm">{t('wholesaler_payments.form.notes')}</Label>
                                        <Input id="notes" name="notes" placeholder={t('wholesaler_payments.form.notes_placeholder')} className="h-10 md:h-11" />
                                    </div>
                                    <div className="flex gap-2 md:gap-3 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsPaymentOpen(false)}
                                            className="flex-1 h-10"
                                        >
                                            {t('common.cancel')}
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="flex-1 h-10 bg-gradient-to-r from-green-600 to-emerald-600"
                                            disabled={paymentMutation.isPending}
                                        >
                                            {paymentMutation.isPending ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                                    <span className="hidden sm:inline">{t('wholesaler_payments.form.recording')}</span>
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4" />
                                                    <span>{t('wholesaler_payments.record_payment')}</span>
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Stats Cards - 2x2 grid on mobile */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 mb-4 md:mb-6">
                    <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-xl md:rounded-2xl">
                        <CardContent className="p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-3">
                                <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                    <IndianRupee className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5">{t('wholesaler_payments.stats.due')}</Badge>
                            </div>
                            <h3 className="text-lg md:text-2xl lg:text-3xl font-bold">
                                {formatCurrency(totalOutstanding)}
                            </h3>
                            <p className="text-white/80 text-[10px] md:text-sm mt-0.5 md:mt-1">{t('wholesaler_payments.stats.outstanding')}</p>
                            <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 text-[10px] md:text-sm text-white/70">
                                {wholesalersWithDues.length === 1
                                    ? t('wholesaler_payments.stats.from_count', { count: wholesalersWithDues.length })
                                    : t('wholesaler_payments.stats.from_count_plural', { count: wholesalersWithDues.length })
                                }
                            </div>
                        </CardContent>
                        <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-xl md:rounded-2xl">
                        <CardContent className="p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-3">
                                <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                    <Building2 className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5">{t('wholesaler_payments.stats.pending')}</Badge>
                            </div>
                            <h3 className="text-lg md:text-2xl lg:text-3xl font-bold">{wholesalersWithDues.length}</h3>
                            <p className="text-white/80 text-[10px] md:text-sm mt-0.5 md:mt-1">{t('wholesaler_payments.stats.with_dues')}</p>
                            <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 text-[10px] md:text-sm text-white/70">
                                {t('wholesaler_payments.stats.of_total', { total: allWholesalers.length })}
                            </div>
                        </CardContent>
                        <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl md:rounded-2xl">
                        <CardContent className="p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-3">
                                <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5">{t('wholesaler_payments.stats.page_paid')}</Badge>
                            </div>
                            <h3 className="text-lg md:text-2xl lg:text-3xl font-bold">
                                {formatCurrency(totalPaidInPeriod)}
                            </h3>
                            <p className="text-white/80 text-[10px] md:text-sm mt-0.5 md:mt-1">{t('wholesaler_payments.stats.paid')}</p>
                            <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 text-[10px] md:text-sm text-white/70">
                                {payments.length} {t('wholesaler_payments.stats.total_payments')}
                            </div>
                        </CardContent>
                        <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-lg md:shadow-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl md:rounded-2xl">
                        <CardContent className="p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-3">
                                <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                    <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5">{t('wholesaler_payments.stats.total')}</Badge>
                            </div>
                            <h3 className="text-lg md:text-2xl lg:text-3xl font-bold">{pagination.total}</h3>
                            <p className="text-white/80 text-[10px] md:text-sm mt-0.5 md:mt-1">{t('wholesaler_payments.stats.total_payments')}</p>
                            <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 text-[10px] md:text-sm text-white/70">
                                {getTimeFilterLabel()}
                            </div>
                        </CardContent>
                        <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
                    </Card>
                </div>

                {/* Payments Table with Filters */}
                <Card className="border-0 shadow-lg overflow-hidden rounded-xl md:rounded-2xl">
                    <CardHeader className="border-b bg-gray-50/80 p-3 md:py-4 md:px-6">
                        <div className="space-y-3 md:space-y-4">
                            {/* Header Row */}
                            <div className="flex flex-row gap-2 md:gap-4 justify-between items-center">
                                <CardTitle className="text-sm md:text-lg flex items-center gap-2">
                                    <div className="p-1.5 md:p-2 rounded-lg bg-green-100">
                                        <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                                    </div>
                                    <span className="hidden sm:inline">{t('wholesaler_payments.table.title')}</span>
                                    <span className="sm:hidden">{t('wholesaler_payments.subtitle')}</span>
                                    <Badge variant="secondary" className="ml-1 md:ml-2 bg-green-50 text-green-700 text-[10px] md:text-xs">
                                        {pagination.total}
                                    </Badge>
                                    {isFetching && !isLoading && (
                                        <div className="animate-spin rounded-full h-3.5 w-3.5 md:h-4 md:w-4 border-2 border-green-500 border-t-transparent ml-1 md:ml-2" />
                                    )}
                                </CardTitle>
                                <div className="relative flex-1 max-w-[180px] md:max-w-[256px]">
                                    <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                                    <Input
                                        placeholder={t('wholesaler_payments.filters.search')}
                                        value={filters.search}
                                        onChange={(e) => {
                                            setFilters(prev => ({ ...prev, search: e.target.value }));
                                            setPage(1);
                                        }}
                                        className="pl-8 md:pl-10 h-8 md:h-9 text-sm bg-white"
                                    />
                                </div>
                            </div>

                            {/* Filters Row - Horizontal scroll on mobile */}
                            <div className="flex gap-2 items-center overflow-x-auto pb-1 -mx-1 px-1">
                                <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 flex-shrink-0">
                                    <Filter className="h-4 w-4" />
                                    <span className="font-medium">{t('wholesalers_list.filters.filters_label')}</span>
                                </div>

                                {/* Date Filter */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-8 bg-white text-xs md:text-sm px-2 md:px-3 flex-shrink-0">
                                            <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2 text-purple-500" />
                                            <span>{getTimeFilterLabel()}</span>
                                            <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2 text-gray-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48">
                                        {(['all', 'today', 'this_week', 'this_month', 'this_year'] as TimeFilterOption[]).map((option) => (
                                            <DropdownMenuItem
                                                key={option}
                                                onClick={() => handleTimeFilterChange(option)}
                                                className={filters.timeFilter === option ? 'bg-purple-50 text-purple-700' : ''}
                                            >
                                                {t(filterLabels[option])}
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
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger className="w-[100px] md:w-[140px] h-8 bg-white text-xs md:text-sm flex-shrink-0">
                                        <SelectValue placeholder={t('wholesaler_payments.form.method')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('wholesaler_payments.filters.all_methods')}</SelectItem>
                                        <SelectItem value="cash">
                                            <span className="flex items-center gap-2">
                                                <Banknote className="h-3 w-3 text-green-600" />
                                                {t('wholesaler_payments.filters.cash')}
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="card">
                                            <span className="flex items-center gap-2">
                                                <CreditCard className="h-3 w-3 text-blue-600" />
                                                {t('wholesaler_payments.filters.card')}
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="online">
                                            <span className="flex items-center gap-2">
                                                <Smartphone className="h-3 w-3 text-purple-600" />
                                                {t('wholesaler_payments.filters.upi')}
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
                                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 px-2 flex-shrink-0"
                                    >
                                        <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                        <span className="ml-1">{t('wholesalers_list.filters.clear_dues')}</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-8 md:p-12 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-t-2 border-b-2 border-green-500 mx-auto" />
                                <p className="text-gray-500 mt-3 md:mt-4 text-sm md:text-base">{t('wholesalers_list.empty.loading')}</p>
                            </div>
                        ) : payments && payments.length > 0 ? (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                                <TableHead className="font-semibold">{t('wholesaler_payments.table.wholesaler')}</TableHead>
                                                <TableHead className="font-semibold">{t('wholesaler_payments.table.amount')}</TableHead>
                                                <TableHead className="font-semibold">{t('wholesaler_payments.table.method')}</TableHead>
                                                <TableHead className="font-semibold">{t('wholesaler_payments.table.date_time')}</TableHead>
                                                <TableHead className="font-semibold">{t('wholesaler_payments.table.notes')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payments.map((payment) => {
                                                const config = paymentMethodConfig[payment.paymentMethod] || {
                                                    color: 'text-gray-700',
                                                    bgColor: 'bg-gray-100',
                                                    icon: <Wallet className="h-4 w-4" />,
                                                    labelKey: 'wholesaler_payments.filters.method_placeholder'
                                                };

                                                return (
                                                    <TableRow key={payment._id} className="hover:bg-green-50/30 transition-colors">
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-lg bg-purple-100">
                                                                    <Package className="h-4 w-4 text-purple-600" />
                                                                </div>
                                                                <span className="font-semibold text-gray-900">{payment.entityName}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-xl font-bold text-green-600">
                                                                {formatCurrency(payment.amount)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={`border-0 flex items-center gap-1.5 w-fit ${config.bgColor} ${config.color}`}>
                                                                {config.icon}
                                                                {t(config.labelKey)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-gray-600">
                                                            <div>
                                                                <p className="font-medium text-gray-900">
                                                                    {format(new Date(payment.createdAt), 'dd MMM yyyy')}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {format(new Date(payment.createdAt), 'hh:mm a')}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-gray-500 max-w-[200px]">
                                                            {payment.notes ? (
                                                                <span className="line-clamp-2">{payment.notes}</span>
                                                            ) : (
                                                                <span className="text-gray-300">-</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Cards - Professional design with clear data separation */}
                                <div className="md:hidden">
                                    {payments.map((payment, index) => {
                                        const config = paymentMethodConfig[payment.paymentMethod] || {
                                            color: 'text-gray-700',
                                            bgColor: 'bg-gray-100',
                                            iconSmall: <Wallet className="h-3.5 w-3.5" />,
                                            labelKey: 'wholesaler_payments.filters.method_placeholder'
                                        };

                                        return (
                                            <div
                                                key={payment._id}
                                                className={`p-3 bg-white active:scale-[0.99] transition-all ${index !== payments.length - 1 ? 'border-b-2 border-gray-200' : ''}`}
                                            >
                                                {/* Header Row - Icon, Name, Payment Method */}
                                                <div className="flex items-center gap-3 mb-2">
                                                    {/* Icon */}
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-green-400 to-emerald-500">
                                                        <Wallet className="h-5 w-5 text-white" />
                                                    </div>

                                                    {/* Name */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-900 text-sm line-clamp-2">{payment.entityName}</p>
                                                        <p className="text-[11px] text-gray-400">
                                                            {format(new Date(payment.createdAt), 'dd MMM yyyy, hh:mm a')}
                                                        </p>
                                                    </div>

                                                    {/* Payment Method Badge */}
                                                    <Badge className={`border-0 flex items-center gap-1 text-[10px] px-2 py-0.5 flex-shrink-0 ${config.bgColor} ${config.color}`}>
                                                        {config.iconSmall}
                                                        {t(config.labelKey)}
                                                    </Badge>
                                                </div>

                                                {/* Amount Row */}
                                                <div className="bg-gray-50 rounded-lg p-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] text-gray-500 font-medium">{t('wholesaler_payments.table.amount_paid')}</span>
                                                        <span className="text-base font-bold text-green-600">
                                                            {formatCurrency(payment.amount)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Notes */}
                                                {payment.notes && (
                                                    <p className="text-xs text-gray-500 mt-2 line-clamp-1 italic">📝 {payment.notes}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <>
                                        {/* Mobile Pagination */}
                                        <div className="flex items-center justify-center gap-2 px-3 py-3 border-t bg-gray-50/50 md:hidden">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(page - 1)}
                                                disabled={page === 1}
                                                className="h-9 px-3"
                                            >
                                                <ChevronLeft className="h-4 w-4 mr-1" />
                                                {t('wholesaler_payments.pagination.prev')}
                                            </Button>
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                                                <span>{page}</span>
                                                <span className="text-green-400">/</span>
                                                <span>{pagination.totalPages}</span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(page + 1)}
                                                disabled={page === pagination.totalPages}
                                                className="h-9 px-3"
                                            >
                                                {t('wholesaler_payments.pagination.next')}
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </div>

                                        {/* Desktop Pagination */}
                                        <div className="hidden md:flex items-center justify-between gap-4 px-6 py-4 border-t bg-gray-50/50">
                                            <p className="text-sm text-gray-600">
                                                {t('wholesaler_payments.pagination.showing_info', {
                                                    start: (page - 1) * ITEMS_PER_PAGE + 1,
                                                    end: Math.min(page * ITEMS_PER_PAGE, pagination.total),
                                                    total: pagination.total
                                                })}
                                            </p>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setPage(1)}
                                                    disabled={page === 1}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronsLeft className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setPage(page - 1)}
                                                    disabled={page === 1}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>

                                                {getPageNumbers().map((pageNum, index) => (
                                                    typeof pageNum === 'number' ? (
                                                        <Button
                                                            key={index}
                                                            variant={page === pageNum ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => setPage(pageNum)}
                                                            className={`h-8 w-8 p-0 ${page === pageNum ? 'bg-green-600 hover:bg-green-700' : ''}`}
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
                                                    onClick={() => setPage(page + 1)}
                                                    disabled={page === pagination.totalPages}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setPage(pagination.totalPages)}
                                                    disabled={page === pagination.totalPages}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronsRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="p-8 md:p-12 text-center">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 md:mb-4">
                                    <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                                </div>
                                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">{t('wholesaler_payments.empty.no_found')}</h3>
                                <p className="text-gray-500 mb-3 md:mb-4 text-sm md:text-base">
                                    {hasActiveFilters ? t('wholesaler_payments.empty.adjust_filters') : t('wholesaler_payments.empty.record_first')}
                                </p>
                                {hasActiveFilters ? (
                                    <Button onClick={clearFilters} variant="outline" className="h-9 text-sm">
                                        <X className="mr-1.5 h-4 w-4" />
                                        {t('wholesalers_list.filters.clear_all')}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => setIsPaymentOpen(true)}
                                        className="bg-gradient-to-r from-green-600 to-emerald-600 h-9 text-sm"
                                    >
                                        <Plus className="mr-1.5 h-4 w-4" />
                                        {t('wholesaler_payments.record_payment')}
                                    </Button>
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
                                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl">{t('wholesaler_payments.custom_date.title')}</DialogTitle>
                                    <p className="text-sm text-gray-500 mt-0.5">{t('wholesaler_payments.custom_date.desc')}</p>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">{t('wholesaler_payments.custom_date.start')}</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">{t('wholesaler_payments.custom_date.end')}</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        min={customStartDate}
                                        className="h-11"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setIsCustomDateOpen(false)} className="flex-1">
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    onClick={handleCustomDateApply}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
                                    disabled={!customStartDate || !customEndDate}
                                >
                                    {t('wholesaler_payments.custom_date.apply')}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <WholesalerAllPaymentsPdfModal
                open={isExportModalOpen}
                onOpenChange={setIsExportModalOpen}
                filters={{
                    search: filters.search,
                    paymentMethod: filters.paymentMethod,
                    startDate: filters.startDate,
                    endDate: filters.endDate
                }}
            />
        </div>
    );
}
