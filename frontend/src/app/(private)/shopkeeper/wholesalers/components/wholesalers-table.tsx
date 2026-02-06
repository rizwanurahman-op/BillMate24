'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Trash2, Edit, CreditCard } from 'lucide-react';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import api from '@/config/axios';
import { toast } from 'sonner';

interface Wholesaler {
    _id: string;
    name: string;
    phone?: string;
    whatsappNumber?: string;
    totalPurchased: number;
    totalPaid: number;
    outstandingDue: number;
}

interface WholesalersTableProps {
    wholesalers: Wholesaler[];
    onRecordPayment?: (wholesaler: Wholesaler) => void;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function WholesalersTable({ wholesalers, onRecordPayment }: WholesalersTableProps) {
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/wholesalers/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wholesalers'] });
            toast.success('Wholesaler deleted');
        },
        onError: () => {
            toast.error('Failed to delete wholesaler');
        },
    });

    if (!wholesalers || wholesalers.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                No wholesalers found. Add your first wholesaler to get started.
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
                    <TableHead>Total Purchased</TableHead>
                    <TableHead>Total Paid</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {wholesalers.map((w) => (
                    <TableRow key={w._id}>
                        <TableCell className="font-medium">{w.name}</TableCell>
                        <TableCell>{w.phone || '-'}</TableCell>
                        <TableCell>{w.whatsappNumber || '-'}</TableCell>
                        <TableCell>{formatCurrency(w.totalPurchased)}</TableCell>
                        <TableCell>{formatCurrency(w.totalPaid)}</TableCell>
                        <TableCell>
                            <Badge variant={w.outstandingDue > 0 ? 'destructive' : 'secondary'}>
                                {formatCurrency(w.outstandingDue)}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {onRecordPayment && w.outstandingDue > 0 && (
                                        <DropdownMenuItem onClick={() => onRecordPayment(w)}>
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            Record Payment
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => deleteMutation.mutate(w._id)}
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
