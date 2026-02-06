'use client';

import { Users } from 'lucide-react';
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

interface Bill {
    _id: string;
    billNumber: string;
    entityName: string;
    totalAmount: number;
    paymentMethod: string;
    createdAt: string;
}

interface TransactionsTableProps {
    bills: Bill[];
    isLoading?: boolean;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function TransactionsTable({ bills, isLoading }: TransactionsTableProps) {
    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto" />
            </div>
        );
    }

    if (!bills || bills.length === 0) {
        return (
            <div className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                <p className="text-gray-500">
                    Create a sale with &quot;Normal Customer&quot; type in the billing page to see transactions here.
                </p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Bill No.</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {bills.map((bill) => (
                    <TableRow key={bill._id}>
                        <TableCell className="font-mono text-sm">
                            {bill.billNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                            {bill.entityName}
                        </TableCell>
                        <TableCell>
                            <Badge className="bg-green-100 text-green-700">
                                {formatCurrency(bill.totalAmount)}
                            </Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                            {bill.paymentMethod}
                        </TableCell>
                        <TableCell>
                            {format(new Date(bill.createdAt), 'dd MMM yyyy, hh:mm a')}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
