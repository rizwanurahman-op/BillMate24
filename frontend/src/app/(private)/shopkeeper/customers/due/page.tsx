'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, MoreHorizontal, Trash2, Edit, Eye, Users, Calendar,
    LayoutDashboard, Phone, MapPin, CreditCard, Filter, X, ChevronLeft,
    ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle, UserCheck, IndianRupee,
    Receipt, Banknote, Smartphone, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { Header, DeleteConfirmDialog } from '@/components/app';
import { Printer } from 'lucide-react';
import { CustomerPdfModal, CustomerAllPaymentsPdfModal, CustomerAllSalesPdfModal } from '../components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/config/axios';
import { Customer, PaginatedResponse } from '@/types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
    AddCustomerDialog,
    EditCustomerDialog,
    CustomerStats,
    RecordCustomerPaymentDialog
} from '../components';

interface CustomerStatsData {
    total: number;
    active: number;
    inactive: number;
    deleted: number;
    withDues: number;
    totalOutstanding: number;
    totalSales: number;
    totalPaid: number;
}

interface Bill {
    _id: string;
    billNumber: string;
    entityId: string;
    entityName: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentMethod: string;
    createdAt: string;
}

interface Payment {
    _id: string;
    entityId: string;
    entityName: string;
    amount: number;
    paymentMethod: string;
    notes?: string;
    createdAt: string;
}

// Payment method config for display
const paymentMethodConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode; key: string }> = {
    cash: { color: 'text-green-700', bgColor: 'bg-green-100', icon: <Banknote className="h-4 w-4" />, key: 'cash' },
    card: { color: 'text-blue-700', bgColor: 'bg-blue-100', icon: <CreditCard className="h-4 w-4" />, key: 'card' },
    online: { color: 'text-purple-700', bgColor: 'bg-purple-100', icon: <Smartphone className="h-4 w-4" />, key: 'online' },
};

const ITEMS_PER_PAGE = 10;

function formatCurrency(amount: number | undefined): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount ?? 0);
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

export default function DueCustomersPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();

    // Tab state
    const [activeTab, setActiveTab] = useState('customers');

    // Filter states for Customer List only
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [duesFilter, setDuesFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [currentPage, setCurrentPage] = useState(1);

    // Pagination for sales/payments (no time filters)
    const [txnPage, setTxnPage] = useState(1);
    const [paymentPage, setPaymentPage] = useState(1);

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Debounce search
    const debouncedSearch = useDebounce(searchInput, 500);

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isPaymentExportModalOpen, setIsPaymentExportModalOpen] = useState(false);
    const [isSalesExportModalOpen, setIsSalesExportModalOpen] = useState(false);

    // Reset to page 1 when table filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, statusFilter, duesFilter, sortBy]);

    // Build query params for customers
    const buildQueryParams = () => {
        const params = new URLSearchParams();
        params.set('type', 'due');
        params.set('page', currentPage.toString());
        params.set('limit', ITEMS_PER_PAGE.toString());
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (statusFilter === 'deleted') params.set('includeDeleted', 'true');
        if (duesFilter !== 'all') params.set('duesFilter', duesFilter);
        if (sortBy) params.set('sortBy', sortBy);
        return params.toString();
    };

    // Fetch customers
    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['due-customers', currentPage, debouncedSearch, statusFilter, duesFilter, sortBy],
        queryFn: async () => {
            const response = await api.get<PaginatedResponse<Customer>>(
                `/customers?${buildQueryParams()}`
            );
            return response.data;
        },
    });

    // Fetch summary stats
    const { data: summaryStats } = useQuery({
        queryKey: ['due-customers-stats'],
        queryFn: async () => {
            const response = await api.get('/customers/stats?type=due');
            return response.data.data as CustomerStatsData;
        },
        staleTime: 0,
        refetchOnMount: 'always'
    });

    // Stats variables from Summary
    // Ensure accurate totals from the stats API which implicitly handles "All Time"
    const totalCustomers = summaryStats?.total || 0;
    const totalOutstanding = summaryStats?.totalOutstanding || 0;
    // For consistency: Total Sales should logically be Paid + Outstanding
    const totalPaid = summaryStats?.totalPaid || 0;
    const totalSales = totalOutstanding + totalPaid;

    // Fetch all sales (Sales Tab)
    const { data: salesData, isLoading: salesLoading } = useQuery({
        queryKey: ['due-customer-sales', txnPage],
        queryFn: async () => {
            const response = await api.get<PaginatedResponse<Bill>>(
                `/bills?entityType=due_customer&billType=sale&page=${txnPage}&limit=${ITEMS_PER_PAGE}`
            );
            return response.data;
        },
        enabled: activeTab === 'sales',
    });

    // Fetch all payments (Payments Tab)
    const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
        queryKey: ['due-customer-payments', paymentPage],
        queryFn: async () => {
            const response = await api.get<PaginatedResponse<Payment>>(
                `/payments?entityType=customer&page=${paymentPage}&limit=${ITEMS_PER_PAGE}`
            );
            return response.data;
        },
        enabled: activeTab === 'payments',
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/customers/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['due-customers'] });
            queryClient.invalidateQueries({ queryKey: ['due-customers-stats'] });
            setDeleteDialogOpen(false);
            setSelectedCustomer(null);
            toast.success(t('wholesalers_list.dialogs.success_delete'));
        },
        onError: () => {
            toast.error(t('wholesaler_payments.messages.error'));
        },
    });

    const restoreMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/customers/${id}/restore`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['due-customers'] });
            queryClient.invalidateQueries({ queryKey: ['due-customers-stats'] });
            toast.success(t('wholesalers_list.dialogs.success_restore'));
        },
        onError: () => {
            toast.error(t('common.error'));
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.patch(`/customers/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['due-customers'] });
            queryClient.invalidateQueries({ queryKey: ['due-customers-stats'] });
            setEditDialogOpen(false);
            setEditingCustomer(null);
            toast.success(t('wholesalers_list.dialogs.success_update'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('common.error'));
        },
    });

    const handleEditClick = (customer: Customer) => {
        setEditingCustomer(customer);
        setEditDialogOpen(true);
    };

    const handleEditSave = (data: any) => {
        if (editingCustomer) {
            updateMutation.mutate({ id: editingCustomer._id, data });
        }
    };

    const handleDeleteClick = (customer: Customer) => {
        setSelectedCustomer(customer);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (selectedCustomer) {
            deleteMutation.mutate(selectedCustomer._id);
        }
    };

    const customers = data?.data || [];
    const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

    const sales = (salesData?.data || []) as Bill[];
    const salesPagination = salesData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

    const payments = (paymentsData?.data || []) as Payment[];
    const paymentsPagination = paymentsData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

    const hasActiveFilters = searchInput || statusFilter !== 'all' || duesFilter !== 'all' || sortBy !== 'createdAt';

    const clearFilters = () => {
        setSearchInput('');
        setStatusFilter('all');
        setDuesFilter('all');
        setSortBy('createdAt');
        setCurrentPage(1);
    };

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
        <>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/20">
                <Header title={t('sidebar.due_customers')} />

                <div className="p-3 md:p-6">
                    {/* Page Header */}
                    <div className="mb-4 md:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
                                    {t('sidebar.due_customers')}
                                </h2>
                                <CreditCard className="h-5 w-5 md:h-8 md:w-8 text-indigo-600" />
                            </div>
                            <p className="text-gray-600 mt-0.5 md:mt-1 flex items-center gap-1.5 md:gap-2 text-xs md:text-base">
                                <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
                            <Link href="/shopkeeper/customers/dashboard" className="hidden lg:block">
                                <Button variant="outline" className="shadow-sm">
                                    <LayoutDashboard className="h-4 w-4 mr-2" />
                                    {t('sidebar.dashboard')}
                                </Button>
                            </Link>
                            <Link href="/shopkeeper/customers/normal" className="hidden lg:block">
                                <Button variant="outline" className="shadow-sm">
                                    <Users className="h-4 w-4 mr-2" />
                                    {t('customer_dashboard.normal_customers')}
                                </Button>
                            </Link>
                            <RecordCustomerPaymentDialog />
                            <AddCustomerDialog customerType="due" />
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <CustomerStats
                        stats={summaryStats || {
                            total: 0,
                            active: 0,
                            inactive: 0,
                            deleted: 0,
                            withDues: 0,
                            totalOutstanding: 0,
                            totalSales: 0,
                            totalPaid: 0
                        }}
                        isLoading={!summaryStats}
                    />

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 md:space-y-6">
                        <div className="flex flex-row items-center justify-between gap-2 md:gap-4">
                            <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
                                <TabsList className="bg-white shadow-sm border p-0.5 md:p-1 h-auto min-w-max">
                                    <TabsTrigger
                                        value="customers"
                                        className="flex items-center gap-1 md:gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-2.5 md:px-6 py-2 md:py-2.5 text-xs md:text-sm"
                                    >
                                        <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                        <span>{t('common.customers')}</span>
                                        <Badge variant="secondary" className="ml-0.5 md:ml-1 bg-indigo-100 text-indigo-700 data-[state=active]:bg-white/20 data-[state=active]:text-white text-[10px] md:text-xs px-1 md:px-2">
                                            {pagination.total}
                                        </Badge>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="sales"
                                        className="flex items-center gap-1 md:gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white px-2.5 md:px-6 py-2 md:py-2.5 text-xs md:text-sm"
                                    >
                                        <Receipt className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                        {t('history.sales')}
                                        {activeTab === 'sales' && salesPagination.total > 0 && (
                                            <Badge variant="secondary" className="ml-0.5 md:ml-1 bg-white/20 text-white text-[10px] md:text-xs px-1 md:px-2">
                                                {salesPagination.total}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="payments"
                                        className="flex items-center gap-1 md:gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white px-2.5 md:px-6 py-2 md:py-2.5 text-xs md:text-sm"
                                    >
                                        <CreditCard className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                        <span>{t('sidebar.payments')}</span>
                                        {activeTab === 'payments' && paymentsPagination.total > 0 && (
                                            <Badge variant="secondary" className="ml-0.5 md:ml-1 bg-white/20 text-white text-[10px] md:text-xs px-1 md:px-2">
                                                {paymentsPagination.total}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                        </div>

                        {/* Customers Tab Content */}
                        <TabsContent value="customers" className="m-0">
                            <Card className="border-0 shadow-lg md:shadow-xl overflow-hidden rounded-xl md:rounded-2xl">
                                <CardHeader className="border-b bg-gray-50/80 p-3 md:py-4 md:px-6">
                                    <div className="space-y-2 md:space-y-4">
                                        <div className="flex flex-row gap-2 md:gap-4 justify-between items-center">
                                            <div className="flex items-center gap-2 md:gap-4">
                                                <CardTitle className="text-sm md:text-lg flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                                                    <div className="p-1.5 md:p-2 rounded-lg bg-indigo-100">
                                                        <Users className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
                                                    </div>
                                                    <span>{t('sidebar.due_customers')}</span>
                                                    <Badge variant="secondary" className="ml-1 md:ml-2 bg-indigo-50 text-indigo-700 text-[10px] md:text-xs px-1.5 md:px-2">
                                                        {pagination.total}
                                                    </Badge>
                                                    {isFetching && !isLoading && (
                                                        <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-2 border-indigo-500 border-t-transparent" />
                                                    )}
                                                </CardTitle>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setIsExportModalOpen(true)}
                                                    className="h-8 md:h-9 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                                                >
                                                    <Printer className="h-3.5 w-3.5 mr-1.5" />
                                                    {t('Export PDF')}
                                                </Button>
                                            </div>
                                            <div className="relative flex-1 max-w-[180px] md:max-w-[256px]">
                                                <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                                                <Input
                                                    placeholder={t('wholesalers_list.filters.search')}
                                                    value={searchInput}
                                                    onChange={(e) => setSearchInput(e.target.value)}
                                                    className="pl-8 md:pl-10 h-8 md:h-9 text-sm bg-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
                                            <div className="flex gap-2 md:gap-3 items-center min-w-max">
                                                <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                                                    <Filter className="h-4 w-4" />
                                                    <span className="font-medium">{t('wholesalers_list.filters.filters_label')}</span>
                                                </div>
                                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                    <SelectTrigger className="w-[90px] md:w-[130px] h-8 md:h-9 bg-white text-xs md:text-sm">
                                                        <SelectValue placeholder={t('wholesalers_list.filters.status')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">{t('wholesalers_list.filters.all_status')}</SelectItem>
                                                        <SelectItem value="active">{t('wholesalers_list.stats.active')}</SelectItem>
                                                        <SelectItem value="inactive">{t('wholesalers_list.stats.inactive')}</SelectItem>
                                                        <SelectItem value="deleted">{t('wholesalers_list.filters.recycle_bin')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Select value={duesFilter} onValueChange={setDuesFilter}>
                                                    <SelectTrigger className="w-[90px] md:w-[140px] h-8 md:h-9 bg-white text-xs md:text-sm">
                                                        <SelectValue placeholder={t('wholesalers_list.filters.dues')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">{t('wholesalers_list.filters.all_dues')}</SelectItem>
                                                        <SelectItem value="with_dues">{t('wholesalers_list.stats.with_dues')}</SelectItem>
                                                        <SelectItem value="clear">{t('wholesalers_list.filters.clear_dues')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Select value={sortBy} onValueChange={setSortBy}>
                                                    <SelectTrigger className="w-[90px] md:w-[140px] h-8 md:h-9 bg-white text-xs md:text-sm">
                                                        <SelectValue placeholder={t('wholesalers_list.filters.sort')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="createdAt">{t('wholesalers_list.filters.latest')}</SelectItem>
                                                        <SelectItem value="name">{t('wholesalers_list.filters.name')} A-Z</SelectItem>
                                                        <SelectItem value="totalSales">{t('wholesalers_list.filters.purchases')}</SelectItem>
                                                        <SelectItem value="outstandingDue">{t('wholesalers_list.stats.outstanding')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {hasActiveFilters && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={clearFilters}
                                                        className="h-8 md:h-9 text-red-600 hover:text-red-700 hover:bg-red-50 px-2 md:px-3 text-xs md:text-sm"
                                                    >
                                                        <X className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                                                        {t('wholesalers_list.filters.clear_all')}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {isLoading ? (
                                        <div className="p-12 text-center">
                                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto" />
                                            <p className="text-gray-500 mt-4">{t('wholesalers_list.empty.loading')}</p>
                                        </div>
                                    ) : customers.length > 0 ? (
                                        <>
                                            <div className="hidden md:block">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                                            <TableHead className="font-semibold">{t('common.customer')}</TableHead>
                                                            <TableHead className="font-semibold">{t('wholesalers_list.table.contact')}</TableHead>
                                                            <TableHead className="font-semibold text-right">{t('dashboard.total_sales')}</TableHead>
                                                            <TableHead className="font-semibold text-right">{t('billing.paid')}</TableHead>
                                                            <TableHead className="font-semibold text-right">{t('reports.outstanding')}</TableHead>
                                                            <TableHead className="font-semibold">{t('billing.status')}</TableHead>
                                                            <TableHead className="font-semibold text-right">{t('wholesalers_list.table.actions')}</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {customers.map((customer) => (
                                                            <TableRow key={customer._id} className="hover:bg-indigo-50/30 transition-colors">
                                                                <TableCell>
                                                                    <Link href={`/shopkeeper/customers/due/${customer._id}`} className="flex items-center gap-3 group">
                                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold transition-transform group-hover:scale-105">
                                                                            {customer.name.charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors capitalize">{customer.name}</p>
                                                                            {customer.address && (
                                                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                                    <MapPin className="h-3 w-3" />
                                                                                    {customer.address}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </Link>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {customer.phone ? (
                                                                        <a href={`tel:${customer.phone}`} className="flex items-center gap-1 text-gray-600 hover:text-indigo-600">
                                                                            <Phone className="h-3 w-3" />
                                                                            {customer.phone}
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-gray-400">-</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right font-semibold">
                                                                    {formatCurrency(customer.totalSales)}
                                                                </TableCell>
                                                                <TableCell className="text-right font-semibold text-green-600">
                                                                    {formatCurrency(customer.totalPaid)}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex flex-col items-end">
                                                                        <span className={`font-bold ${customer.outstandingDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                            {customer.outstandingDue > 0 ? formatCurrency(customer.outstandingDue) : t('wholesalers_list.table.clear_badge')}
                                                                        </span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge className={customer.isActive !== false
                                                                        ? 'bg-green-100 text-green-700 border-0'
                                                                        : 'bg-gray-100 text-gray-600 border-0'
                                                                    }>
                                                                        {customer.isActive !== false ? t('wholesalers_list.stats.active') : t('wholesalers_list.stats.inactive')}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem onClick={() => router.push(`/shopkeeper/customers/due/${customer._id}`)}>
                                                                                <Eye className="h-4 w-4 mr-2" />
                                                                                {t('wholesalers_list.table.view_details')}
                                                                            </DropdownMenuItem>
                                                                            {!customer.isDeleted ? (
                                                                                <>
                                                                                    <DropdownMenuItem onClick={() => handleEditClick(customer)}>
                                                                                        <Edit className="h-4 w-4 mr-2" />
                                                                                        {t('wholesalers_list.dialogs.edit_title')}
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuSeparator />
                                                                                    <DropdownMenuItem
                                                                                        className="text-red-600"
                                                                                        onClick={() => handleDeleteClick(customer)}
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                                        {t('wholesalers_list.table.delete')}
                                                                                    </DropdownMenuItem>
                                                                                </>
                                                                            ) : (
                                                                                <DropdownMenuItem
                                                                                    className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 cursor-pointer"
                                                                                    onClick={() => restoreMutation.mutate(customer._id)}
                                                                                >
                                                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                                                    {t('wholesalers_list.table.restore')}
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>

                                            {/* Mobile Cards */}
                                            <div className="md:hidden">
                                                {customers.map((customer, index) => (
                                                    <div
                                                        key={customer._id}
                                                        className={`p-3 hover:bg-indigo-50/30 active:scale-[0.99] transition-all ${index !== customers.length - 1 ? 'border-b-2 border-gray-200' : ''}`}
                                                        onClick={() => router.push(`/shopkeeper/customers/due/${customer._id}`)}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                                                    {customer.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-gray-900 text-sm line-clamp-2 max-w-[140px]">{customer.name}</p>
                                                                    {customer.phone && (
                                                                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                                            <Phone className="h-2.5 w-2.5" />
                                                                            {customer.phone}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                <Badge className={`text-[10px] px-1.5 ${customer.isActive !== false
                                                                    }`}>
                                                                    {customer.isActive !== false ? t('wholesalers_list.stats.active') : t('wholesalers_list.stats.inactive')}
                                                                </Badge>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-48">
                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/shopkeeper/customers/due/${customer._id}`); }}>
                                                                            <Eye className="mr-2 h-4 w-4 text-blue-600" />
                                                                            {t('wholesalers_list.table.view_details')}
                                                                        </DropdownMenuItem>
                                                                        {!customer.isDeleted ? (
                                                                            <>
                                                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClick(customer); }}>
                                                                                    <Edit className="mr-2 h-4 w-4 text-purple-600" />
                                                                                    {t('wholesalers_list.dialogs.edit_title')}
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuSeparator />
                                                                                <DropdownMenuItem
                                                                                    className="text-red-600"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleDeleteClick(customer);
                                                                                    }}
                                                                                >
                                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                                    {t('wholesalers_list.table.delete')}
                                                                                </DropdownMenuItem>
                                                                            </>
                                                                        ) : (
                                                                            <DropdownMenuItem
                                                                                className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 cursor-pointer"
                                                                                onClick={(e) => { e.stopPropagation(); restoreMutation.mutate(customer._id); }}
                                                                            >
                                                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                                                {t('wholesalers_list.table.restore')}
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                                            <div>
                                                                <p className="text-gray-500 text-[10px]">{t('history.sales')}</p>
                                                                <p className="font-semibold">{formatCurrency(customer.totalSales)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-500 text-[10px]">{t('billing.paid')}</p>
                                                                <p className="font-semibold text-green-600">{formatCurrency(customer.totalPaid)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-500 text-[10px]">
                                                                    {customer.outstandingDue > 0 ? t('reports.customer_outstanding_due') : t('reports.customer_advance')}
                                                                </p>
                                                                <p className={`font-bold ${customer.outstandingDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                    {customer.outstandingDue > 0 ? formatCurrency(customer.outstandingDue) : t('wholesalers_list.table.nil_badge')}
                                                                </p>
                                                                <p className="text-[9px] text-gray-400 italic opacity-80">
                                                                    {t('reports.incl_opening_balance')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-12 text-center text-gray-500">
                                            {t('wholesalers_list.empty.no_found')}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="sales" className="m-0">
                            <Card className="border-0 shadow-lg md:shadow-xl overflow-hidden rounded-xl md:rounded-2xl">
                                <CardHeader className="border-b bg-gray-50/80 p-3 md:py-4 md:px-6">
                                    <div className="flex items-center justify-between w-full">
                                        <CardTitle className="text-sm md:text-lg flex items-center gap-1.5 md:gap-2">
                                            <div className="p-1.5 md:p-2 rounded-lg bg-emerald-100">
                                                <Receipt className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                                            </div>
                                            <span>{t('history.sale_bills')}</span>
                                        </CardTitle>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsSalesExportModalOpen(true)}
                                            className="h-8 md:h-9 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                        >
                                            <Printer className="h-3.5 w-3.5 mr-1.5" />
                                            {t('Export PDF')}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {salesLoading ? (
                                        <div className="p-8 md:p-12 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-t-2 border-b-2 border-emerald-500 mx-auto" />
                                            <p className="text-gray-500 mt-3 md:mt-4 text-sm">{t('wholesalers_list.empty.loading')}</p>
                                        </div>
                                    ) : sales.length > 0 ? (
                                        <>
                                            {/* Desktop Table */}
                                            <div className="hidden md:block">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-gray-50/50">
                                                            <TableHead>{t('history.bill_no')}</TableHead>
                                                            <TableHead>{t('common.customer')}</TableHead>
                                                            <TableHead className="text-right">{t('history.amount')}</TableHead>
                                                            <TableHead className="text-right">{t('billing.paid')}</TableHead>
                                                            <TableHead className="text-right">{t('billing.due')}</TableHead>
                                                            <TableHead>{t('history.method')}</TableHead>
                                                            <TableHead>{t('history.date')}</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {sales.map((sale) => {
                                                            const methodConfig = paymentMethodConfig[sale.paymentMethod] || paymentMethodConfig.cash;
                                                            const methodLabel = methodConfig.key === 'online' ? t('dashboard.online') + ' / UPI' : t(`dashboard.${methodConfig.key}`);
                                                            return (
                                                                <TableRow key={sale._id} className="hover:bg-emerald-50/30">
                                                                    <TableCell className="font-mono text-sm">{sale.billNumber}</TableCell>
                                                                    <TableCell>
                                                                        <Link href={`/shopkeeper/customers/due/${sale.entityId}`} className="flex items-center gap-2 group">
                                                                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold transition-transform group-hover:scale-110">
                                                                                {sale.entityName?.charAt(0)?.toUpperCase()}
                                                                            </div>
                                                                            <span className="font-medium text-sm group-hover:text-emerald-700 transition-colors">{sale.entityName}</span>
                                                                        </Link>
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-semibold">{formatCurrency(sale.totalAmount)}</TableCell>
                                                                    <TableCell className="text-right text-green-600">{formatCurrency(sale.paidAmount)}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        {sale.dueAmount > 0 ? (
                                                                            <span className="text-red-600 font-semibold">{formatCurrency(sale.dueAmount)}</span>
                                                                        ) : (
                                                                            <Badge className="bg-green-100 text-green-700 border-0">{t('billing.paid')}</Badge>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge className={`${methodConfig.bgColor} ${methodConfig.color} border-0`}>
                                                                            {methodLabel}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-gray-600 text-xs">{format(new Date(sale.createdAt), 'dd MMM yyyy')}</TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </div>

                                            {/* Mobile Cards */}
                                            <div className="md:hidden">
                                                {sales.map((sale) => (
                                                    <div key={sale._id} className="p-3 border-b hover:bg-gray-50">
                                                        <div className="flex justify-between mb-1">
                                                            <span className="font-semibold text-sm line-clamp-2">{sale.entityName}</span>
                                                            <span className="text-xs font-mono text-gray-500">#{sale.billNumber}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
                                                            <span>{format(new Date(sale.createdAt), 'dd MMM')}</span>
                                                            <span className="font-bold">{formatCurrency(sale.totalAmount)}</span>
                                                        </div>
                                                        {sale.dueAmount > 0 && (
                                                            <div className="text-right">
                                                                <span className="text-red-600 text-xs font-bold">{t('billing.due')}: {formatCurrency(sale.dueAmount)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-center gap-4 py-4 border-t">
                                                <Button size="sm" variant="outline" onClick={() => setTxnPage(p => Math.max(1, p - 1))} disabled={txnPage === 1}>{t('wholesalers_list.pagination.prev')}</Button>
                                                <span className="text-sm">{txnPage} / {salesPagination.totalPages}</span>
                                                <Button size="sm" variant="outline" onClick={() => setTxnPage(p => Math.min(salesPagination.totalPages, p + 1))} disabled={txnPage === salesPagination.totalPages}>{t('wholesalers_list.pagination.next')}</Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-12 text-center text-gray-500">{t('history.no_bills_found')}</div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="payments" className="m-0">
                            <Card className="border-0 shadow-lg md:shadow-xl overflow-hidden rounded-xl md:rounded-2xl">
                                <CardHeader className="border-b bg-gray-50/80 p-3 md:py-4 md:px-6">
                                    <div className="flex items-center justify-between w-full">
                                        <CardTitle className="text-sm md:text-lg flex items-center gap-1.5 md:gap-2">
                                            <div className="p-1.5 md:p-2 rounded-lg bg-green-100">
                                                <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                                            </div>
                                            <span>{t('wholesaler_payments.table.title')}</span>
                                        </CardTitle>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsPaymentExportModalOpen(true)}
                                            className="h-8 md:h-9 text-green-700 border-green-200 hover:bg-green-50"
                                        >
                                            <Printer className="h-3.5 w-3.5 mr-1.5" />
                                            {t('Export PDF')}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {paymentsLoading ? (
                                        <div className="p-8 md:p-12 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-t-2 border-b-2 border-green-500 mx-auto" />
                                            <p className="text-gray-500 mt-3 md:mt-4 text-sm">{t('wholesalers_list.empty.loading')}</p>
                                        </div>
                                    ) : payments.length > 0 ? (
                                        <>
                                            <div className="hidden md:block">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-gray-50/50">
                                                            <TableHead>{t('common.customer')}</TableHead>
                                                            <TableHead className="text-right">{t('history.amount')}</TableHead>
                                                            <TableHead>{t('history.method')}</TableHead>
                                                            <TableHead>{t('history.date')}</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {payments.map((payment) => (
                                                            <TableRow key={payment._id}>
                                                                <TableCell>
                                                                    <Link
                                                                        href={`/shopkeeper/customers/due/${payment.entityId}`}
                                                                        className="font-medium hover:text-green-600 transition-colors"
                                                                    >
                                                                        {payment.entityName}
                                                                    </Link>
                                                                </TableCell>
                                                                <TableCell className="text-right font-bold text-green-600">{formatCurrency(payment.amount)}</TableCell>
                                                                <TableCell className="capitalize">
                                                                    {payment.paymentMethod === 'online' ? t('dashboard.online') + ' / UPI' : t(`dashboard.${payment.paymentMethod}`)}
                                                                </TableCell>
                                                                <TableCell className="text-gray-600 text-xs">{format(new Date(payment.createdAt), 'dd MMM yyyy')}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>

                                            <div className="md:hidden">
                                                {payments.map((payment) => (
                                                    <div key={payment._id} className="p-3 border-b hover:bg-gray-50 flex justify-between items-center">
                                                        <div>
                                                            <p className="text-sm font-semibold line-clamp-2">{payment.entityName}</p>
                                                            <p className="text-xs text-gray-500">{format(new Date(payment.createdAt), 'dd MMM')}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                                                            <p className="text-xs text-gray-500 capitalize">
                                                                {payment.paymentMethod === 'online' ? t('dashboard.online') + ' / UPI' : t(`dashboard.${payment.paymentMethod}`)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-center gap-4 py-4 border-t">
                                                <Button size="sm" variant="outline" onClick={() => setPaymentPage(p => Math.max(1, p - 1))} disabled={paymentPage === 1}>{t('wholesalers_list.pagination.prev')}</Button>
                                                <span className="text-sm">{paymentPage} / {paymentsPagination.totalPages}</span>
                                                <Button size="sm" variant="outline" onClick={() => setPaymentPage(p => Math.min(paymentsPagination.totalPages, p + 1))} disabled={paymentPage === paymentsPagination.totalPages}>{t('wholesalers_list.pagination.next')}</Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-12 text-center text-gray-500">{t('wholesaler_payments.empty.no_found')}</div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div >

                <EditCustomerDialog
                    isOpen={editDialogOpen}
                    onClose={() => {
                        setEditDialogOpen(false);
                        setEditingCustomer(null);
                    }}
                    onSave={handleEditSave}
                    customer={editingCustomer}
                    isSaving={updateMutation.isPending}
                />

                <DeleteConfirmDialog
                    isOpen={deleteDialogOpen}
                    onClose={() => {
                        setDeleteDialogOpen(false);
                        setSelectedCustomer(null);
                    }}
                    onConfirm={handleDeleteConfirm}
                    itemName={selectedCustomer?.name}
                    isLoading={deleteMutation.isPending}
                />

                <CustomerPdfModal
                    open={isExportModalOpen}
                    onOpenChange={setIsExportModalOpen}
                    filters={{
                        search: debouncedSearch,
                        status: statusFilter,
                        duesFilter: duesFilter,
                        sortBy: sortBy,
                        type: 'due'
                    }}
                />
                <CustomerAllPaymentsPdfModal
                    open={isPaymentExportModalOpen}
                    onOpenChange={setIsPaymentExportModalOpen}
                />
                <CustomerAllSalesPdfModal
                    open={isSalesExportModalOpen}
                    onOpenChange={setIsSalesExportModalOpen}
                />
            </div>
        </>
    );
}
