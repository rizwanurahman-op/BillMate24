'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MoreHorizontal, UserCheck, UserX, Settings2, Database, Eye } from 'lucide-react';
import { Header } from '@/components/app/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import api from '@/config/axios';
import { User, UserWithStorage, PaginatedResponse } from '@/types';
import { toast } from 'sonner';
import { EditShopkeeperDialog } from './components/edit-shopkeeper-dialog';
import { ViewShopkeeperDialog } from './components/view-shopkeeper-dialog';

export default function ShopkeepersPage() {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedShopkeeper, setSelectedShopkeeper] = useState<UserWithStorage | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['shopkeepers', page],
        queryFn: async () => {
            const response = await api.get<PaginatedResponse<UserWithStorage>>(`/users/with-storage?page=${page}&limit=10`);
            return response.data;
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.patch(`/users/${id}/toggle-status`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shopkeepers'] });
            toast.success('Status updated successfully');
        },
        onError: () => {
            toast.error('Failed to update status');
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/users', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shopkeepers'] });
            setIsCreateOpen(false);
            toast.success('Shopkeeper created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create shopkeeper');
        },
    });

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        createMutation.mutate({
            email: formData.get('email'),
            password: formData.get('password'),
            name: formData.get('name'),
            phone: formData.get('phone'),
            businessName: formData.get('businessName'),
            address: formData.get('address'),
            place: formData.get('place'),
        });
    };

    const filteredUsers = data?.data?.filter((user) =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Header title="Shopkeepers" />

            <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Manage Shopkeepers</h2>
                        <p className="text-gray-600">Create and manage shopkeeper accounts</p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Shopkeeper
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Create Shopkeeper</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" name="name" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" name="password" type="password" required minLength={6} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" name="phone" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="businessName">Business Name</Label>
                                    <Input id="businessName" name="businessName" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input id="address" name="address" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="place">Place</Label>
                                    <Input id="place" name="place" />
                                </div>
                                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? 'Creating...' : 'Create Shopkeeper'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="border-b bg-gray-50/50">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search shopkeepers..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Business</TableHead>
                                        <TableHead>Storage</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Features</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers?.map((user) => (
                                        <TableRow key={user._id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.businessName || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Database className="h-4 w-4 text-purple-600" />
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {user.storageStats.storage.formatted}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1.5 min-w-[140px]">
                                                    <div className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                                                        <span className="w-1 h-1 rounded-full bg-blue-400" />
                                                        {user.storageStats.bills.total} bills
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                                                        <span className="w-1 h-1 rounded-full bg-green-400" />
                                                        {user.storageStats.customers.total} cust.
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                                                        <span className="w-1 h-1 rounded-full bg-rose-400" />
                                                        {user.storageStats.invoices.total} invoices
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                                                        <span className="w-1 h-1 rounded-full bg-amber-400" />
                                                        {user.storageStats.payments.total} pay.
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {Object.entries(user.features).filter(([_, v]) => v).map(([key]) => (
                                                        <Badge key={key} variant="outline" className="text-xs capitalize">
                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedShopkeeper(user);
                                                                setIsViewOpen(true);
                                                            }}
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedShopkeeper(user);
                                                                setIsEditOpen(true);
                                                            }}
                                                        >
                                                            <Settings2 className="mr-2 h-4 w-4" />
                                                            Edit & Features
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => toggleStatusMutation.mutate(user._id)}
                                                            className={user.isActive ? 'text-red-600' : 'text-green-600'}
                                                        >
                                                            {user.isActive ? (
                                                                <>
                                                                    <UserX className="mr-2 h-4 w-4" />
                                                                    Deactivate
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UserCheck className="mr-2 h-4 w-4" />
                                                                    Activate
                                                                </>
                                                            )}
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

                {data?.pagination && data.pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <span className="flex items-center px-4">
                            Page {page} of {data.pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= data.pagination.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>

            <ViewShopkeeperDialog
                shopkeeper={selectedShopkeeper}
                open={isViewOpen}
                onOpenChange={setIsViewOpen}
            />

            <EditShopkeeperDialog
                shopkeeper={selectedShopkeeper}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
            />
        </div>
    );
}
