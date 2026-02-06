'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Trash2, CreditCard, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import api from '@/config/axios';
import { toast } from 'sonner';

interface Customer {
    _id: string;
    name: string;
    phone?: string;
    whatsappNumber?: string;
    type: 'due' | 'normal';
    totalSales: number;
    totalPaid: number;
    outstandingDue: number;
}

interface CustomersTableProps {
    customers: Customer[];
    customerType: 'due' | 'normal';
    onRecordPayment?: (customer: Customer) => void;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function CustomersTable({ customers, customerType, onRecordPayment }: CustomersTableProps) {
    const router = useRouter();
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/customers/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('Customer deleted');
        },
    });

    const handleViewDetails = (customerId: string) => {
        router.push(`/shopkeeper/customers/${customerType}/${customerId}`);
    };

    if (!customers || customers.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                No {customerType} customers found. Add your first customer to get started.
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Total Sales</TableHead>
                    <TableHead>Total Paid</TableHead>
                    {customerType === 'due' && <TableHead>Outstanding</TableHead>}
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {customers.map((c) => (
                    <TableRow key={c._id}>
                        <TableCell>
                            <button
                                onClick={() => handleViewDetails(c._id)}
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                            >
                                {c.name}
                            </button>
                        </TableCell>
                        <TableCell>{c.phone || '-'}</TableCell>
                        <TableCell>{c.whatsappNumber || '-'}</TableCell>
                        <TableCell>{formatCurrency(c.totalSales)}</TableCell>
                        <TableCell>{formatCurrency(c.totalPaid)}</TableCell>
                        {customerType === 'due' && (
                            <TableCell>
                                <Badge variant={c.outstandingDue > 0 ? 'destructive' : 'secondary'}>
                                    {formatCurrency(c.outstandingDue)}
                                </Badge>
                            </TableCell>
                        )}
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewDetails(c._id)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                    </DropdownMenuItem>
                                    {customerType === 'due' && onRecordPayment && c.outstandingDue > 0 && (
                                        <DropdownMenuItem onClick={() => onRecordPayment(c)}>
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            Record Payment
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => deleteMutation.mutate(c._id)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
