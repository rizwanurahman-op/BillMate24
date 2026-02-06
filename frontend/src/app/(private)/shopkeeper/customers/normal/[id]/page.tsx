'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Receipt, CreditCard, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, User, Phone, MapPin, MessageCircle, IndianRupee } from 'lucide-react';
import { Header } from '@/components/app/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import api from '@/config/axios';
import { format } from 'date-fns';

interface Customer {
    _id: string;
    name: string;
    phone?: string;
    whatsappNumber?: string;
    address?: string;
    totalSales: number;
    totalPaid: number;
    outstandingDue: number;
    createdAt: string;
}

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

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

const ITEMS_PER_PAGE = 10;

export default function NormalCustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [billsPage, setBillsPage] = useState(1);
    const [paymentsPage, setPaymentsPage] = useState(1);

    // Fetch customer details
    const { data: customerData, isLoading: customerLoading } = useQuery({
        queryKey: ['customer', id],
        queryFn: async () => {
            const response = await api.get(`/customers/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    // Fetch bills for this customer
    const { data: billsData, isLoading: billsLoading } = useQuery({
        queryKey: ['customer-bills', id, billsPage],
        queryFn: async () => {
            const response = await api.get<PaginatedResponse<Bill>>(
                `/bills?entityId=${id}&billType=sale&page=${billsPage}&limit=${ITEMS_PER_PAGE}`
            );
            return response.data;
        },
        enabled: !!id,
    });

    // Fetch payments for this customer
    const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
        queryKey: ['customer-payments', id],
        queryFn: async () => {
            const response = await api.get(`/payments/customer/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    const customer = customerData?.data as Customer | undefined;
    const bills = (billsData?.data || []) as Bill[];
    const billsPagination = billsData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };
    const payments = (paymentsData?.data || []) as Payment[];

    // Paginate payments (client-side)
    const paginatedPayments = useMemo(() => {
        const start = (paymentsPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return payments.slice(start, end);
    }, [payments, paymentsPage]);

    const paymentsTotalPages = Math.ceil(payments.length / ITEMS_PER_PAGE);

    if (customerLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header title="Customer Details" />
                <div className="p-6 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500" />
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header title="Customer Not Found" />
                <div className="p-6 text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Customer not found</h2>
                    <Button onClick={() => router.push('/shopkeeper/customers/normal')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Customers
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header title="Customer Details" />

            <div className="p-6">
                {/* Back Button */}
                <div className="mb-6">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/shopkeeper/customers/normal')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Customers
                    </Button>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Profile Card */}
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                    <User className="h-8 w-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold">{customer.name}</h3>
                                    <Badge className="bg-white/20 text-white mt-1">Regular Customer</Badge>
                                    <div className="mt-2 space-y-1">
                                        {customer.phone && (
                                            <div className="flex items-center gap-2 text-green-100 text-sm">
                                                <Phone className="h-4 w-4" />
                                                <span>{customer.phone}</span>
                                            </div>
                                        )}
                                        {customer.whatsappNumber && (
                                            <div className="flex items-center gap-2 text-green-100 text-sm">
                                                <MessageCircle className="h-4 w-4" />
                                                <span>{customer.whatsappNumber}</span>
                                            </div>
                                        )}
                                        {customer.address && (
                                            <div className="flex items-center gap-2 text-green-100 text-sm">
                                                <MapPin className="h-4 w-4" />
                                                <span>{customer.address}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Sales */}
                    <Card className="border-0 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <IndianRupee className="h-6 w-6 text-green-600" />
                                </div>
                                <Badge className="bg-green-100 text-green-700">Total Sales</Badge>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{formatCurrency(customer.totalSales)}</p>
                            <p className="text-sm text-gray-500 mt-1">All time sales</p>
                        </CardContent>
                    </Card>

                    {/* Total Paid */}
                    <Card className="border-0 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <CreditCard className="h-6 w-6 text-blue-600" />
                                </div>
                                <Badge className="bg-blue-100 text-blue-700">Total Paid</Badge>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{formatCurrency(customer.totalPaid)}</p>
                            <p className="text-sm text-gray-500 mt-1">All time payments</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs for Sales and Payments */}
                <Tabs defaultValue="sales">
                    <TabsList className="mb-6">
                        <TabsTrigger value="sales" className="flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Sales ({billsPagination.total})
                        </TabsTrigger>
                        <TabsTrigger value="payments" className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Payments ({payments.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="sales">
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Receipt className="h-5 w-5 text-green-500" />
                                    Sales Transactions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {billsLoading ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto" />
                                    </div>
                                ) : bills.length > 0 ? (
                                    <>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Bill Number</TableHead>
                                                    <TableHead>Amount</TableHead>
                                                    <TableHead>Method</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {bills.map((bill) => (
                                                    <TableRow key={bill._id}>
                                                        <TableCell>{format(new Date(bill.createdAt), 'dd MMM yyyy')}</TableCell>
                                                        <TableCell className="font-mono text-sm">{bill.billNumber}</TableCell>
                                                        <TableCell className="font-medium">{formatCurrency(bill.totalAmount)}</TableCell>
                                                        <TableCell className="capitalize">{bill.paymentMethod}</TableCell>
                                                        <TableCell>
                                                            <Badge className="bg-green-100 text-green-700">Paid</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        {billsPagination.totalPages > 1 && (
                                            <div className="flex items-center justify-between px-4 py-3 border-t">
                                                <p className="text-sm text-gray-600">
                                                    Page {billsPage} of {billsPagination.totalPages}
                                                </p>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="outline" size="icon" onClick={() => setBillsPage(1)} disabled={billsPage === 1} className="h-8 w-8">
                                                        <ChevronsLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" size="icon" onClick={() => setBillsPage(billsPage - 1)} disabled={billsPage === 1} className="h-8 w-8">
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" size="icon" onClick={() => setBillsPage(billsPage + 1)} disabled={billsPage === billsPagination.totalPages} className="h-8 w-8">
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" size="icon" onClick={() => setBillsPage(billsPagination.totalPages)} disabled={billsPage === billsPagination.totalPages} className="h-8 w-8">
                                                        <ChevronsRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-8 text-center">
                                        <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No sales yet</h3>
                                        <p className="text-gray-500">Create a sale to this customer to see transactions here.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="payments">
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-blue-500" />
                                    Payment History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {paymentsLoading ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto" />
                                    </div>
                                ) : paginatedPayments.length > 0 ? (
                                    <>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Amount</TableHead>
                                                    <TableHead>Method</TableHead>
                                                    <TableHead>Notes</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {paginatedPayments.map((payment) => (
                                                    <TableRow key={payment._id}>
                                                        <TableCell>{format(new Date(payment.createdAt), 'dd MMM yyyy, hh:mm a')}</TableCell>
                                                        <TableCell>
                                                            <Badge className="bg-green-100 text-green-700">{formatCurrency(payment.amount)}</Badge>
                                                        </TableCell>
                                                        <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                                                        <TableCell className="text-gray-500">{payment.notes || '-'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        {payments.length > ITEMS_PER_PAGE && (
                                            <div className="flex items-center justify-between px-4 py-3 border-t">
                                                <p className="text-sm text-gray-600">
                                                    Page {paymentsPage} of {paymentsTotalPages}
                                                </p>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="outline" size="icon" onClick={() => setPaymentsPage(1)} disabled={paymentsPage === 1} className="h-8 w-8">
                                                        <ChevronsLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" size="icon" onClick={() => setPaymentsPage(paymentsPage - 1)} disabled={paymentsPage === 1} className="h-8 w-8">
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" size="icon" onClick={() => setPaymentsPage(paymentsPage + 1)} disabled={paymentsPage === paymentsTotalPages} className="h-8 w-8">
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" size="icon" onClick={() => setPaymentsPage(paymentsTotalPages)} disabled={paymentsPage === paymentsTotalPages} className="h-8 w-8">
                                                        <ChevronsRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-8 text-center">
                                        <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No payments recorded</h3>
                                        <p className="text-gray-500">Payments for this customer will appear here.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
