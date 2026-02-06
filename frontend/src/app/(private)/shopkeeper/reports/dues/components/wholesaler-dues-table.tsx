'use client';

import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { format, differenceInDays } from 'date-fns';

interface Wholesaler {
    _id: string;
    name: string;
    phone?: string;
    outstandingDue: number;
    lastTransactionDate?: string;
}

interface WholesalerDuesTableProps {
    wholesalers: Wholesaler[];
    isLoading?: boolean;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function WholesalerDuesTable({ wholesalers, isLoading }: WholesalerDuesTableProps) {
    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto" />
            </div>
        );
    }

    if (!wholesalers || wholesalers.length === 0) {
        return (
            <div className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No outstanding dues</h3>
                <p className="text-gray-500">All wholesaler payments are up to date.</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Wholesaler</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Last Transaction</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {wholesalers.map((wholesaler) => {
                    const daysSinceTransaction = wholesaler.lastTransactionDate
                        ? differenceInDays(new Date(), new Date(wholesaler.lastTransactionDate))
                        : 0;
                    const isOverdue = daysSinceTransaction > 7;

                    return (
                        <TableRow key={wholesaler._id}>
                            <TableCell className="font-medium">{wholesaler.name}</TableCell>
                            <TableCell>{wholesaler.phone || '-'}</TableCell>
                            <TableCell>
                                <Badge className="bg-orange-100 text-orange-700">
                                    {formatCurrency(wholesaler.outstandingDue)}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {wholesaler.lastTransactionDate
                                    ? format(new Date(wholesaler.lastTransactionDate), 'dd MMM yyyy')
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
