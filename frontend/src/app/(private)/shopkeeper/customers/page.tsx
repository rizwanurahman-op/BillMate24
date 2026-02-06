'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MoreHorizontal, Trash2, CreditCard, Edit } from 'lucide-react';
import { Header } from '@/components/app/header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import api from '@/config/axios';
import { Customer, PaginatedResponse } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { AddCustomerDialog, EditCustomerDialog } from './components';
import { DeleteConfirmDialog } from '@/components/app';

function formatCurrency(amount: number | undefined): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount ?? 0);
}

export default function CustomersPage() {
    const queryClient = useQueryClient();
    const { hasFeature } = useAuth();

    const [search, setSearch] = useState('');
    const [customerType, setCustomerType] = useState<'due' | 'normal'>('due');
    const [page, setPage] = useState(1);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['customers', customerType, page],
        queryFn: async () => {
            const response = await api.get<PaginatedResponse<Customer>>(
                `/customers?type=${customerType}&page=${page}&limit=10`
            );
            return response.data;
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.patch(`/customers/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setEditDialogOpen(false);
            setEditingCustomer(null);
            toast.success('Customer updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update customer');
        },
    });

    const handleEditClick = (customer: Customer) => {
        setEditingCustomer(customer);
        setEditDialogOpen(true);
    };

    const handleEditSave = (data: any) => {
        if (editingCustomer) {
            updateMutation.mutate({ id: editingCustomer._id, data });
        }
    };

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/customers/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setDeleteDialogOpen(false);
            setSelectedCustomer(null);
            toast.success('Customer deleted');
        },
    });

    const handleDeleteClick = (customer: Customer) => {
        setSelectedCustomer(customer);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (selectedCustomer) {
            deleteMutation.mutate(selectedCustomer._id);
        }
    };



    const filteredCustomers = data?.data?.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Header title="Customers" />

            <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
                        <p className="text-gray-600">Manage due and normal customers</p>
                    </div>

                    {hasFeature('dueCustomers') && customerType === 'due' && (
                        <AddCustomerDialog customerType="due" />
                    )}
                </div>

                <Tabs value={customerType} onValueChange={(v) => setCustomerType(v as 'due' | 'normal')}>
                    <TabsList className="mb-4">
                        {hasFeature('dueCustomers') && (
                            <TabsTrigger value="due">Due Customers</TabsTrigger>
                        )}
                        {hasFeature('normalCustomers') && (
                            <TabsTrigger value="normal">Normal Customers</TabsTrigger>
                        )}
                    </TabsList>

                    <Card className="border-0 shadow-lg">
                        <CardHeader className="border-b bg-gray-50/50">
                            <div className="relative max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search customers..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Total Sales</TableHead>
                                            <TableHead>Total Paid</TableHead>
                                            {customerType === 'due' && <TableHead>Outstanding</TableHead>}
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCustomers?.map((c) => (
                                            <TableRow key={c._id}>
                                                <TableCell className="font-medium">{c.name}</TableCell>
                                                <TableCell>{c.phone || '-'}</TableCell>
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
                                                            {customerType === 'due' && (
                                                                <>
                                                                    <DropdownMenuItem>
                                                                        <CreditCard className="mr-2 h-4 w-4" />
                                                                        Record Payment
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleEditClick(c)}>
                                                                        <Edit className="mr-2 h-4 w-4 text-purple-600" />
                                                                        Edit Customer
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                                onClick={() => handleDeleteClick(c)}
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
                            )}
                        </CardContent>
                    </Card>
                </Tabs>
            </div>

            <EditCustomerDialog
                isOpen={editDialogOpen}
                onClose={() => {
                    setEditDialogOpen(false);
                    setEditingCustomer(null);
                }}
                onSave={handleEditSave}
                customer={editingCustomer}
                isSaving={updateMutation.isPending}
            />

            <DeleteConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setSelectedCustomer(null);
                }}
                onConfirm={handleDeleteConfirm}
                itemName={selectedCustomer?.name}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
