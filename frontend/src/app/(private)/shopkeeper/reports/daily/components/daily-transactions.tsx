'use client';

import { Badge } from '@/components/ui/badge';
import { Receipt } from 'lucide-react';
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
    billType: 'purchase' | 'sale';
    entityName: string;
    entityType: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentMethod: string;
    createdAt: string;
}

interface DailyTransactionsProps {
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

export function DailyTransactions({ bills, isLoading }: DailyTransactionsProps) {
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
                <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions on this day</h3>
                <p className="text-gray-500">Create bills to see transactions here.</p>
            </div>
        );
    }

    // Sort bills by time (newest first)
    const sortedBills = [...bills].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Bill No.</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedBills.map((bill) => {
                    const due = bill.dueAmount || (bill.totalAmount - bill.paidAmount);
                    const isPaid = due <= 0;
                    const isPartial = !isPaid && bill.paidAmount > 0;

                    return (
                        <TableRow key={bill._id}>
                            <TableCell className="text-gray-500">
                                {format(new Date(bill.createdAt), 'hh:mm a')}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                                {bill.billNumber}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    className={bill.billType === 'sale'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-orange-100 text-orange-700'
                                    }
                                >
                                    {bill.billType === 'sale' ? 'Sale' : 'Purchase'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div>
                                    <p className="font-medium">{bill.entityName}</p>
                                    <p className="text-xs text-gray-500 capitalize">
                                        {bill.entityType?.replace('_', ' ')}
                                    </p>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {formatCurrency(bill.totalAmount)}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                                {formatCurrency(bill.paidAmount)}
                            </TableCell>
                            <TableCell className={`text-right ${due > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                {formatCurrency(due)}
                            </TableCell>
                            <TableCell>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${!bill.paymentMethod ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-700'}`}>
                                    {bill.paymentMethod ? bill.paymentMethod.toUpperCase() : '---'}
                                </span>
                            </TableCell>
                            <TableCell>
                                {isPaid ? (
                                    <Badge className="bg-green-100 text-green-700">Paid</Badge>
                                ) : isPartial ? (
                                    <Badge className="bg-yellow-100 text-yellow-700">Partial</Badge>
                                ) : (
                                    <Badge variant="destructive">Pending</Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
