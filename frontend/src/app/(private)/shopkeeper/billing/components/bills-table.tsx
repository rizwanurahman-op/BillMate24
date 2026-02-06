'use client';

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
    billType: 'purchase' | 'sale';
    entityType: string;
    entityName: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentMethod: string;
    createdAt: string;
}

interface BillsTableProps {
    bills: Bill[];
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function BillsTable({ bills }: BillsTableProps) {
    if (!bills || bills.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                No bills found
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Bill No.</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {bills.map((bill) => (
                    <TableRow key={bill._id}>
                        <TableCell className="font-mono text-sm">
                            {bill.billNumber}
                        </TableCell>
                        <TableCell>
                            <Badge
                                variant={bill.billType === 'sale' ? 'default' : 'secondary'}
                                className={bill.billType === 'sale'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-orange-100 text-orange-700'
                                }
                            >
                                {bill.billType === 'sale' ? 'Sale' : 'Purchase'}
                            </Badge>
                        </TableCell>
                        <TableCell>{bill.entityName}</TableCell>
                        <TableCell className="font-medium">
                            {formatCurrency(bill.totalAmount)}
                        </TableCell>
                        <TableCell className="text-green-600">
                            {formatCurrency(bill.paidAmount)}
                        </TableCell>
                        <TableCell>
                            {bill.dueAmount > 0 ? (
                                <Badge variant="destructive">
                                    {formatCurrency(bill.dueAmount)}
                                </Badge>
                            ) : (
                                <Badge className="bg-green-100 text-green-700">Paid</Badge>
                            )}
                        </TableCell>
                        <TableCell>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${!bill.paymentMethod ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-700'}`}>
                                {bill.paymentMethod ? bill.paymentMethod.toUpperCase() : '---'}
                            </span>
                        </TableCell>
                        <TableCell>
                            {format(new Date(bill.createdAt), 'dd MMM yyyy')}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
