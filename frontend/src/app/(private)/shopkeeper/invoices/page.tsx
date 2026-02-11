'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus, Search, MoreHorizontal, Trash2, Edit, Eye, FileText, Calendar,
    Filter, X, ChevronLeft, ChevronRight, Share2, Download, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Header, DeleteConfirmDialog } from '@/components/app';
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
import { invoiceApi } from '@/lib/invoice-api';
import { Invoice } from '@/types/invoice';
import { toast } from 'sonner';
import { InvoicePdfModal } from './components';

const ITEMS_PER_PAGE = 10;

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

function getStatusColor(status: string) {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-700 border-0';
        case 'sent':
            return 'bg-blue-100 text-blue-700 border-0';
        case 'paid':
            return 'bg-green-100 text-green-700 border-0';
        case 'cancelled':
            return 'bg-red-100 text-red-700 border-0';
        default:
            return 'bg-gray-100 text-gray-700 border-0';
    }
}

export default function InvoicesPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const router = useRouter();

    // Search and filter state
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'cancelled'>('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Delete confirmation state
    // PDF Preview state
    const [pdfModalOpen, setPdfModalOpen] = useState(false);
    const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] = useState<Invoice | null>(null);

    // Fetch color schemes for PDF
    const { data: colorSchemes = [] } = useQuery({
        queryKey: ['invoice-colors'],
        queryFn: () => invoiceApi.getColorSchemes(),
    });

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    // Build query params for API
    const buildFilters = () => {
        return {
            search: search || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            sortBy: 'createdAt' as const,
            sortOrder: 'desc' as const,
        };
    };

    // Fetch invoices
    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['invoices', currentPage, search, statusFilter],
        queryFn: () => invoiceApi.getAll(buildFilters()),
    });

    const invoices = data?.invoices || [];
    const pagination = data?.pagination || { page: 1, limit: ITEMS_PER_PAGE, total: 0, totalPages: 0 };
    const stats = data?.stats || { totalAmount: 0, draftCount: 0, sentCount: 0, paidCount: 0, cancelledCount: 0 };

    const hasActiveFilters = search || statusFilter !== 'all';

    const clearFilters = () => {
        setSearch('');
        setSearchInput('');
        setStatusFilter('all');
        setCurrentPage(1);
    };

    // Handle search with debounce
    const handleSearchChange = (value: string) => {
        setSearchInput(value);
        setTimeout(() => {
            setSearch(value);
            setCurrentPage(1);
        }, 500);
    };

    // Handle filter changes - reset to page 1
    const handleFilterChange = (setter: (value: any) => void, value: any) => {
        setter(value);
        setCurrentPage(1);
    };

    const deleteMutation = useMutation({
        mutationFn: (id: string) => invoiceApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setDeleteDialogOpen(false);
            setSelectedInvoice(null);
            toast.success(t('invoices.messages.success_delete'));
        },
        onError: () => {
            toast.error(t('invoices.messages.error_delete'));
        },
    });

    const shareMutation = useMutation({
        mutationFn: (id: string) => invoiceApi.generateShareLink(id),
        onSuccess: (data) => {
            window.open(data.url, '_blank');
            toast.success(t('invoices.messages.copied'));
        },
        onError: () => {
            toast.error('Failed to generate share link');
        },
    });

    const handleDeleteClick = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (selectedInvoice) {
            deleteMutation.mutate(selectedInvoice._id);
        }
    };

    const handleShare = (invoice: Invoice) => {
        setSelectedInvoiceForPdf(invoice);
        setPdfModalOpen(true);
    };

    const handlePreviewPdf = (invoice: Invoice) => {
        setSelectedInvoiceForPdf(invoice);
        setPdfModalOpen(true);
    };

    // Pagination controls
    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, pagination.totalPages)));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
            <Header title={t('invoices.title')} />

            <div className="p-3 md:p-6">
                {/* Page Header */}
                <div className="mb-4 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                                {t('invoices.subtitle')}
                            </h2>
                            <FileText className="h-5 w-5 md:h-8 md:w-8 text-indigo-600" />
                        </div>
                        <p className="text-gray-600 mt-0.5 md:mt-1 flex items-center gap-1.5 md:gap-2 text-xs md:text-base">
                            <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span className="hidden md:inline">{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
                            <span className="md:hidden">{format(new Date(), 'EEE, MMM d')}</span>
                        </p>
                    </div>
                    <Link href="/shopkeeper/invoices/create">
                        <Button className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:shadow-lg transition-all text-xs md:text-sm px-2 md:px-4 h-9 md:h-10">
                            <Plus className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span className="truncate">{t('invoices.create_new')}</span>
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-4 md:mb-6">
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                        <CardContent className="p-3 md:p-5 relative">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                                    <FileText className="h-4 w-4 md:h-5 md:w-5 text-white" />
                                </div>
                                <div className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">
                                    Total
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-1 font-medium">{t('invoices.stats.total_invoices')}</p>
                            <p className="text-xl md:text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {pagination.total}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                        <CardContent className="p-3 md:p-5 relative">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
                                    <svg className="h-4 w-4 md:h-5 md:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                                    Revenue
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-1 font-medium">{t('invoices.stats.total_amount')}</p>
                            <p className="text-lg md:text-2xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent truncate">
                                {formatCurrency(stats.totalAmount)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                        <CardContent className="p-3 md:p-5 relative">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 shadow-md">
                                    <svg className="h-4 w-4 md:h-5 md:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <div className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-semibold">
                                    Draft
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-1 font-medium">{t('invoices.stats.draft_count')}</p>
                            <p className="text-xl md:text-3xl font-black text-gray-700">
                                {stats.draftCount}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                        <CardContent className="p-3 md:p-5 relative">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md">
                                    <svg className="h-4 w-4 md:h-5 md:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </div>
                                <div className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">
                                    Sent
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-1 font-medium">{t('invoices.stats.sent_count')}</p>
                            <p className="text-xl md:text-3xl font-black text-blue-700">
                                {stats.sentCount}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                        <CardContent className="p-3 md:p-5 relative">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
                                    <svg className="h-4 w-4 md:h-5 md:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">
                                    Paid
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-1 font-medium">{t('invoices.stats.paid_count')}</p>
                            <p className="text-xl md:text-3xl font-black text-green-700">
                                {stats.paidCount}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Card */}
                <Card className="border-0 shadow-lg overflow-hidden rounded-xl md:rounded-2xl">
                    {/* Filter Bar */}
                    <CardHeader className="border-b bg-gray-50/80 p-3 md:py-4 md:px-6">
                        <div className="space-y-3 md:space-y-4">
                            {/* First Row - Title and Search */}
                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-between items-start sm:items-center">
                                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                                    <div className="p-1.5 md:p-2 rounded-lg bg-blue-100">
                                        <FileText className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                                    </div>
                                    <span>{t('invoices.invoice_list')}</span>
                                    <Badge variant="secondary" className="ml-1 md:ml-2 bg-blue-50 text-blue-700 text-[10px] md:text-xs px-1.5 md:px-2">
                                        {pagination.total}
                                    </Badge>
                                    {isFetching && !isLoading && (
                                        <div className="animate-spin rounded-full h-3.5 w-3.5 md:h-4 md:w-4 border-2 border-blue-500 border-t-transparent ml-1 md:ml-2" />
                                    )}
                                </CardTitle>
                                <div className="relative w-full sm:w-auto">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder={t('invoices.filters.search_placeholder')}
                                        value={searchInput}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        className="pl-10 w-full sm:w-60 md:w-72 bg-white h-9 md:h-10 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Second Row - Filters */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600 flex-shrink-0">
                                    <Filter className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                    <span className="font-medium hidden sm:inline">{t('Filters:')}</span>
                                </div>

                                {/* Status Filter */}
                                <Select
                                    value={statusFilter}
                                    onValueChange={(value: any) => handleFilterChange(setStatusFilter, value)}
                                >
                                    <SelectTrigger className="w-[120px] md:w-[150px] h-8 md:h-9 bg-white text-xs md:text-sm flex-shrink-0">
                                        <SelectValue placeholder={t('invoices.filters.all_status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('invoices.filters.all_status')}</SelectItem>
                                        <SelectItem value="draft">{t('invoices.status_draft')}</SelectItem>
                                        <SelectItem value="sent">{t('invoices.status_sent')}</SelectItem>
                                        <SelectItem value="paid">{t('invoices.status_paid')}</SelectItem>
                                        <SelectItem value="cancelled">{t('invoices.status_cancelled')}</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Clear Filters */}
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="h-8 md:h-9 text-red-600 hover:text-red-700 hover:bg-red-50 px-2 md:px-3 text-xs md:text-sm flex-shrink-0"
                                    >
                                        <X className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                                        <span>{t('invoices.filters.clear_filters')}</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-8 md:p-12 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-t-2 border-b-2 border-blue-500 mx-auto" />
                                <p className="text-gray-500 mt-3 md:mt-4 text-sm md:text-base">{t('common.loading')}</p>
                            </div>
                        ) : invoices.length > 0 ? (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                                <TableHead className="font-semibold">{t('invoices.table.invoice_no')}</TableHead>
                                                <TableHead className="font-semibold">{t('invoices.table.customer')}</TableHead>
                                                <TableHead className="font-semibold">{t('invoices.table.date')}</TableHead>
                                                <TableHead className="font-semibold text-right">{t('invoices.table.amount')}</TableHead>
                                                <TableHead className="font-semibold">{t('invoices.table.status')}</TableHead>
                                                <TableHead className="font-semibold text-center w-[100px]">{t('invoices.table.actions')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {invoices.map((invoice) => (
                                                <TableRow key={invoice._id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200 border-b border-gray-100">
                                                    <TableCell>
                                                        <div className="flex items-center gap-3 group">
                                                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 transition-all shadow-sm">
                                                                <FileText className="h-4 w-4 text-white" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900">
                                                                    {invoice.invoiceNumber}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{invoice.customerName}</p>
                                                            {invoice.customerEmail && (
                                                                <p className="text-xs text-gray-500 mt-0.5">{invoice.customerEmail}</p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-gray-400" />
                                                            <div>
                                                                <p className="text-gray-700 font-medium">{format(new Date(invoice.invoiceDate), 'MMM d, yyyy')}</p>
                                                                {invoice.dueDate && (
                                                                    <p className="text-xs text-gray-400">Due: {format(new Date(invoice.dueDate), 'MMM d')}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
                                                            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="font-black text-emerald-700">
                                                                {formatCurrency(invoice.total)}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={`${getStatusColor(invoice.status)} flex items-center gap-1.5 w-fit`}>
                                                            {invoice.status === 'paid' && (
                                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            )}
                                                            {invoice.status === 'sent' && (
                                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                                </svg>
                                                            )}
                                                            {invoice.status === 'draft' && (
                                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            )}
                                                            {invoice.status === 'cancelled' && (
                                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            )}
                                                            {t(`invoices.status_${invoice.status}`)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-center">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="outline" size="sm" className="h-9 w-9 p-0 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-48">
                                                                    <DropdownMenuItem
                                                                        onClick={() => router.push(`/shopkeeper/invoices/${invoice._id}/edit`)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4 text-purple-600" />
                                                                        {t('invoices.table.edit')}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handlePreviewPdf(invoice)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <FileText className="mr-2 h-4 w-4 text-orange-600" />
                                                                        {t('invoices.table.preview_pdf')}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleShare(invoice)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Share2 className="mr-2 h-4 w-4 text-green-600" />
                                                                        {t('invoices.table.share')}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                                                        onClick={() => handleDeleteClick(invoice)}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        {t('invoices.table.delete')}
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="md:hidden space-y-3 p-3">
                                    {invoices.map((invoice) => (
                                        <div
                                            key={invoice._id}
                                            className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-100"
                                        >
                                            {/* Header with Gradient */}
                                            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-4 border-b border-gray-100">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                                                        <FileText className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-gray-900 text-base truncate">{invoice.invoiceNumber}</p>
                                                        <p className="text-sm text-gray-600 truncate">{invoice.customerName}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={`text-[10px] px-2 py-1 ${getStatusColor(invoice.status)} flex items-center gap-1`}>
                                                            {invoice.status === 'paid' && (
                                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            )}
                                                            {invoice.status === 'sent' && (
                                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                                </svg>
                                                            )}
                                                            {invoice.status === 'draft' && (
                                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            )}
                                                            <span>{t(`invoices.status_${invoice.status}`)}</span>
                                                        </Badge>
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-black/5">
                                                                        <MoreHorizontal className="h-5 w-5 text-gray-500" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-48">
                                                                    <DropdownMenuItem onClick={() => router.push(`/shopkeeper/invoices/${invoice._id}/edit`)} className="cursor-pointer">
                                                                        <Edit className="mr-2 h-4 w-4 text-purple-600" />
                                                                        {t('invoices.table.edit')}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handlePreviewPdf(invoice)} className="cursor-pointer">
                                                                        <FileText className="mr-2 h-4 w-4 text-orange-600" />
                                                                        {t('invoices.table.preview_pdf')}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleShare(invoice)} className="cursor-pointer">
                                                                        <Share2 className="mr-2 h-4 w-4 text-green-600" />
                                                                        {t('invoices.table.share')}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                                                        onClick={() => handleDeleteClick(invoice)}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        {t('invoices.table.delete')}
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-100">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <p className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wide">{t('invoices.table.amount')}</p>
                                                        </div>
                                                        <p className="font-black text-emerald-700 text-lg">{formatCurrency(invoice.total)}</p>
                                                    </div>
                                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Calendar className="h-4 w-4 text-blue-600" />
                                                            <p className="text-[10px] text-blue-700 font-semibold uppercase tracking-wide">{t('invoices.table.date')}</p>
                                                        </div>
                                                        <p className="font-bold text-blue-700 text-sm">{format(new Date(invoice.invoiceDate), 'MMM d, yyyy')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 px-3 md:px-6 py-3 md:py-4 border-t bg-gray-50/50">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => goToPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="h-9 px-3"
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                            {t('invoices.pagination.prev')}
                                        </Button>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                                            <span>{currentPage}</span>
                                            <span className="text-blue-400">/</span>
                                            <span>{pagination.totalPages}</span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => goToPage(currentPage + 1)}
                                            disabled={currentPage === pagination.totalPages}
                                            className="h-9 px-3"
                                        >
                                            {t('invoices.pagination.next')}
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-8 md:p-12 text-center">
                                <div className="mx-auto w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                    <FileText className="h-8 w-8 md:h-10 md:w-10 text-gray-400" />
                                </div>
                                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                                    {t('invoices.empty.no_invoices')}
                                </h3>
                                <p className="text-gray-500 mb-4 text-sm md:text-base">
                                    {t('invoices.empty.no_invoices_desc')}
                                </p>
                                <Link href="/shopkeeper/invoices/create">
                                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('invoices.empty.create_first')}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title={t('invoices.delete_dialog.title')}
                description={t('invoices.delete_dialog.description', { invoiceNumber: selectedInvoice?.invoiceNumber })}
                isLoading={deleteMutation.isPending}
            />
            {/* Invoice PDF Modal */}
            {selectedInvoiceForPdf && (
                <InvoicePdfModal
                    open={pdfModalOpen}
                    onOpenChange={setPdfModalOpen}
                    invoice={selectedInvoiceForPdf}
                    templateId={selectedInvoiceForPdf.templateId || 'modern'}
                    colorScheme={selectedInvoiceForPdf.colorScheme || 'blue'}
                    colorSchemes={colorSchemes}
                />
            )}
        </div>
    );
}
