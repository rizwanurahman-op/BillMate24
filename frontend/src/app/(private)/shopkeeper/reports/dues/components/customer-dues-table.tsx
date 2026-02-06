'use client';

import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { format, differenceInDays } from 'date-fns';

interface Customer {
    _id: string;
    name: string;
    phone?: string;
    outstandingDue: number;
    lastTransactionDate?: string;
}

interface CustomerDuesTableProps {
    customers: Customer[];
    isLoading?: boolean;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function CustomerDuesTable({ customers, isLoading }: CustomerDuesTableProps) {
    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto" />
            </div>
        );
    }

    if (!customers || customers.length === 0) {
        return (
            <div className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No outstanding dues</h3>
                <p className="text-gray-500">All customer payments are up to date.</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Last Transaction</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {customers.map((customer) => {
                    const daysSinceTransaction = customer.lastTransactionDate
                        ? differenceInDays(new Date(), new Date(customer.lastTransactionDate))
                        : 0;
                    const isOverdue = daysSinceTransaction > 7;

                    return (
                        <TableRow key={customer._id}>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>{customer.phone || '-'}</TableCell>
                            <TableCell>
                                <Badge variant="destructive">
                                    {formatCurrency(customer.outstandingDue)}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {customer.lastTransactionDate
                                    ? format(new Date(customer.lastTransactionDate), 'dd MMM yyyy')
                                    : '-'
                                }
                            </TableCell>
                            <TableCell>
                                {isOverdue ? (
                                    <Badge className="bg-red-100 text-red-700">
                                        Overdue ({daysSinceTransaction} days)
                                    </Badge>
                                ) : (
                                    <Badge className="bg-green-100 text-green-700">
                                        On Track
                                    </Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
