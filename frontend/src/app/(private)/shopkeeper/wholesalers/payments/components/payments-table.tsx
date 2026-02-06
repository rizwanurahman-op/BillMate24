'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

interface Payment {
    _id: string;
    entityName: string;
    amount: number;
    paymentMethod: string;
    createdAt: string;
    notes?: string;
}

interface PaymentsTableProps {
    payments: Payment[];
    isLoading?: boolean;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function PaymentsTable({ payments, isLoading }: PaymentsTableProps) {
    return (
        <Card className="border-0 shadow-lg">
            <CardHeader>
                <CardTitle>Recent Payments to Wholesalers</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto" />
                    </div>
                ) : payments && payments.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Wholesaler</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.map((payment) => (
                                <TableRow key={payment._id}>
                                    <TableCell className="font-medium">{payment.entityName}</TableCell>
                                    <TableCell>
                                        <Badge className="bg-green-100 text-green-700">
                                            {formatCurrency(payment.amount)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                                    <TableCell>
                                        {format(new Date(payment.createdAt), 'dd MMM yyyy, hh:mm a')}
                                    </TableCell>
                                    <TableCell>{payment.notes || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        No payments recorded yet
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
