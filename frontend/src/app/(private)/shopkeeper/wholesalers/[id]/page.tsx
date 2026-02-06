'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Receipt, CreditCard, Package, Edit, LayoutDashboard, FileText, Printer } from 'lucide-react';
import { Header } from '@/components/app/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wholesaler } from '@/types';
import api from '@/config/axios';
import {
    WholesalerInfo,
    TransactionsTable,
    PaymentsTable,
    RecordPaymentDialog,
    TransactionFilters,
    Pagination,
    FilterState,
    WholesalerBillsPdfModal,
    WholesalerPaymentsPdfModal
} from './components';



interface Bill {
    _id: string;
    billNumber: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentMethod: string;
    createdAt: string;
}

interface Payment {
    _id: string;
    amount: number;
    paymentMethod: string;
    notes?: string;
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

const ITEMS_PER_PAGE = 10;

export default function WholesalerDetailPage() {
    const { t } = useTranslation();
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    // State
    const [billsPage, setBillsPage] = useState(1);
    const [paymentsPage, setPaymentsPage] = useState(1);
    const [billFilters, setBillFilters] = useState<FilterState>({
        search: '',
        timeFilter: 'all',
    });
    const [paymentFilters, setPaymentFilters] = useState<FilterState>({
        search: '',
        timeFilter: 'all',
    });
    const [isBillsPdfModalOpen, setIsBillsPdfModalOpen] = useState(false);
    const [isPaymentsPdfModalOpen, setIsPaymentsPdfModalOpen] = useState(false);

    // Build query params
    const buildBillsQuery = () => {
        const params = new URLSearchParams();
        params.set('entityId', id);
        params.set('billType', 'purchase');
        params.set('page', billsPage.toString());
        params.set('limit', ITEMS_PER_PAGE.toString());
        if (billFilters.startDate) params.set('startDate', billFilters.startDate);
        if (billFilters.endDate) params.set('endDate', billFilters.endDate);
        return params.toString();
    };

    const buildPaymentsQuery = () => {
        const params = new URLSearchParams();
        if (paymentFilters.startDate) params.set('startDate', paymentFilters.startDate);
        if (paymentFilters.endDate) params.set('endDate', paymentFilters.endDate);
        return params.toString();
    };

    // Fetch wholesaler details
    const { data: wholesalerData, isLoading: wholesalerLoading } = useQuery({
        queryKey: ['wholesaler', id],
        queryFn: async () => {
            const response = await api.get(`/wholesalers/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    // Fetch bills for this wholesaler with pagination
    const { data: billsData, isLoading: billsLoading } = useQuery({
        queryKey: ['wholesaler-bills', id, billsPage, billFilters.startDate, billFilters.endDate],
        queryFn: async () => {
            const response = await api.get<PaginatedResponse<Bill>>(`/bills?${buildBillsQuery()}`);
            return response.data;
        },
        enabled: !!id,
    });

    // Fetch payments for this wholesaler
    const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
        queryKey: ['wholesaler-payments', id, paymentFilters.startDate, paymentFilters.endDate],
        queryFn: async () => {
            const response = await api.get(`/payments/wholesaler/${id}?${buildPaymentsQuery()}`);
            return response.data;
        },
        enabled: !!id,
    });

    const wholesaler = wholesalerData?.data as Wholesaler | undefined;
    const bills = (billsData?.data || []) as Bill[];
    const billsPagination = billsData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };
    const payments = (paymentsData?.data || []) as Payment[];

    // Filter bills by search (client-side for bill number search)
    const filteredBills = useMemo(() => {
        if (!billFilters.search) return bills;
        return bills.filter(bill =>
            bill.billNumber.toLowerCase().includes(billFilters.search.toLowerCase())
        );
    }, [bills, billFilters.search]);

    // Filter payments by search (client-side)
    const filteredPayments = useMemo(() => {
        if (!paymentFilters.search) return payments;
        return payments.filter(payment =>
            payment.notes?.toLowerCase().includes(paymentFilters.search.toLowerCase()) ||
            payment.amount.toString().includes(paymentFilters.search)
        );
    }, [payments, paymentFilters.search]);

    // Paginate payments (client-side)
    const paginatedPayments = useMemo(() => {
        const start = (paymentsPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return filteredPayments.slice(start, end);
    }, [filteredPayments, paymentsPage]);

    const paymentsTotalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);

    // Reset page when filters change
    const handleBillFiltersChange = (newFilters: FilterState) => {
        setBillFilters(newFilters);
        setBillsPage(1);
    };

    const handlePaymentFiltersChange = (newFilters: FilterState) => {
        setPaymentFilters(newFilters);
        setPaymentsPage(1);
    };

    if (wholesalerLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/20">
                <Header title={t('wholesaler_detail.header_loading')} />
                <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-purple-500 mx-auto" />
                        <p className="text-gray-500 mt-3 md:mt-4 text-sm md:text-base">{t('wholesalers_list.empty.loading')}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!wholesaler) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/20">
                <Header title={t('wholesaler_detail.not_found.title')} />
                <div className="p-4 md:p-6">
                    <Card className="max-w-md mx-auto border-0 shadow-lg rounded-xl">
                        <CardContent className="pt-8 md:pt-12 pb-6 md:pb-8 text-center">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 md:mb-4">
                                <Package className="h-6 w-6 md:h-8 md:w-8 text-red-400" />
                            </div>
                            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">{t('wholesaler_detail.not_found.title')}</h2>
                            <p className="text-gray-500 mb-4 md:mb-6 text-sm md:text-base">{t('wholesaler_detail.not_found.desc')}</p>
                            <Button onClick={() => router.push('/shopkeeper/wholesalers')} className="bg-purple-600 hover:bg-purple-700 h-9 text-sm">
                                <ArrowLeft className="mr-1.5 h-4 w-4" />
                                {t('wholesaler_detail.not_found.back')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/20">
            <Header title={wholesaler.name} />

            <div className="p-3 md:p-6">
                {/* Page Header */}
                <div className="flex flex-row justify-between items-center gap-3 mb-4 md:mb-6">
                    <div className="flex items-center gap-2 lg:gap-4">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/shopkeeper/wholesalers')}
                            className="shadow-sm h-9 lg:h-10 px-3 lg:px-4"
                            size="sm"
                        >
                            <ArrowLeft className="lg:mr-2 h-4 w-4" />
                            <span className="hidden lg:inline">{t('wholesaler_detail.not_found.back')}</span>
                        </Button>
                        <div className="hidden lg:block h-8 w-px bg-gray-200" />
                        <nav className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
                            <Link href="/shopkeeper/wholesalers" className="hover:text-purple-600 transition-colors">
                                {t('wholesaler_detail.breadcrumb.wholesalers')}
                            </Link>
                            <span>/</span>
                            <span className="text-gray-900 font-medium truncate max-w-[200px]">{wholesaler.name}</span>
                        </nav>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/shopkeeper/wholesalers/dashboard" className="hidden lg:block">
                            <Button variant="outline" size="sm" className="shadow-sm">
                                <LayoutDashboard className="h-4 w-4 mr-2" />
                                {t('common.dashboard')}
                            </Button>
                        </Link>
                        <Link href="/shopkeeper/billing" className="hidden lg:block">
                            <Button variant="outline" size="sm" className="shadow-sm">
                                <FileText className="h-4 w-4 mr-2" />
                                {t('wholesaler_detail.buttons.new_purchase')}
                            </Button>
                        </Link>
                        <RecordPaymentDialog wholesaler={wholesaler} />
                    </div>
                </div>

                {/* Wholesaler Info */}
                <WholesalerInfo wholesaler={wholesaler} />

                {/* Tabs for Transactions and Payments */}
                <Tabs defaultValue="transactions" className="space-y-3 md:space-y-6">
                    <TabsList className="bg-white shadow-sm border p-1 h-auto rounded-xl w-full grid grid-cols-2">
                        <TabsTrigger
                            value="transactions"
                            className="flex items-center justify-center gap-1.5 md:gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white px-2 md:px-6 py-2 md:py-2.5 text-xs md:text-sm rounded-lg"
                        >
                            <Receipt className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            {t('wholesaler_detail.tabs.purchase_bills')}
                            <Badge variant="secondary" className="ml-0.5 md:ml-1 bg-purple-100 text-purple-700 data-[state=active]:bg-white/20 data-[state=active]:text-white text-[10px] md:text-xs px-1.5">
                                {billsPagination.total}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="payments"
                            className="flex items-center justify-center gap-1.5 md:gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white px-2 md:px-6 py-2 md:py-2.5 text-xs md:text-sm rounded-lg"
                        >
                            <CreditCard className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            {t('wholesaler_detail.tabs.payments')}
                            <Badge variant="secondary" className="ml-0.5 md:ml-1 bg-green-100 text-green-700 data-[state=active]:bg-white/20 data-[state=active]:text-white text-[10px] md:text-xs px-1.5">
                                {filteredPayments.length}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="transactions" className="m-0">
                        <Card className="border-0 shadow-lg overflow-hidden rounded-xl md:rounded-2xl">
                            <CardHeader className="border-b bg-gray-50/80 p-3 md:py-4 md:px-6 flex flex-row items-center justify-between">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 w-full">
                                    <CardTitle className="text-sm md:text-lg flex items-center gap-2">
                                        <div className="p-1.5 md:p-2 rounded-lg bg-blue-100">
                                            <Receipt className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                                        </div>
                                        {t('wholesaler_detail.transactions.title')}
                                    </CardTitle>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <TransactionFilters
                                            filters={billFilters}
                                            onFiltersChange={handleBillFiltersChange}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsBillsPdfModalOpen(true)}
                                            className="h-9 bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                                        >
                                            <Printer className="h-4 w-4 mr-2" />
                                            {t('Export PDF')}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <TransactionsTable bills={filteredBills} wholesaler={wholesaler} isLoading={billsLoading} />
                                {filteredBills.length > 0 && billsPagination.totalPages > 1 && (
                                    <div className="border-t">
                                        <Pagination
                                            page={billsPage}
                                            totalPages={billsPagination.totalPages}
                                            total={billsPagination.total}
                                            limit={ITEMS_PER_PAGE}
                                            onPageChange={setBillsPage}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="payments" className="m-0">
                        <Card className="border-0 shadow-lg overflow-hidden rounded-xl md:rounded-2xl">
                            <CardHeader className="border-b bg-gray-50/80 p-3 md:py-4 md:px-6 flex flex-row items-center justify-between">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 w-full">
                                    <CardTitle className="text-sm md:text-lg flex items-center gap-2">
                                        <div className="p-1.5 md:p-2 rounded-lg bg-green-100">
                                            <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                                        </div>
                                        {t('wholesaler_detail.payments_table.title')}
                                    </CardTitle>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <TransactionFilters
                                            filters={paymentFilters}
                                            onFiltersChange={handlePaymentFiltersChange}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsPaymentsPdfModalOpen(true)}
                                            className="h-9 bg-white text-green-600 border-green-200 hover:bg-green-50"
                                        >
                                            <Printer className="h-4 w-4 mr-2" />
                                            {t('Export PDF')}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <PaymentsTable payments={paginatedPayments} isLoading={paymentsLoading} wholesaler={wholesaler} />
                                {filteredPayments.length > ITEMS_PER_PAGE && (
                                    <div className="border-t">
                                        <Pagination
                                            page={paymentsPage}
                                            totalPages={paymentsTotalPages}
                                            total={filteredPayments.length}
                                            limit={ITEMS_PER_PAGE}
                                            onPageChange={setPaymentsPage}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* PDF Preview Modals */}
            <WholesalerBillsPdfModal
                open={isBillsPdfModalOpen}
                onOpenChange={setIsBillsPdfModalOpen}
                wholesaler={wholesaler}
                filters={billFilters}
            />
            <WholesalerPaymentsPdfModal
                open={isPaymentsPdfModalOpen}
                onOpenChange={setIsPaymentsPdfModalOpen}
                wholesaler={wholesaler}
                filters={paymentFilters}
            />
        </div>
    );
}
