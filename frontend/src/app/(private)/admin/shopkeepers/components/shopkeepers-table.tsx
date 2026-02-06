'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, UserCheck, UserX, Settings2 } from 'lucide-react';
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
import { User } from '@/types';
import { toast } from 'sonner';

interface ShopkeepersTableProps {
    shopkeepers: User[];
    isLoading?: boolean;
}

export function ShopkeepersTable({ shopkeepers, isLoading }: ShopkeepersTableProps) {
    const queryClient = useQueryClient();

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

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto" />
            </div>
        );
    }

    if (!shopkeepers || shopkeepers.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                No shopkeepers found
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {shopkeepers.map((user) => (
                    <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.businessName || '-'}</TableCell>
                        <TableCell>
                            <Badge
                                variant={user.isActive ? 'default' : 'secondary'}
                                className={user.isActive
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                }
                            >
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
                                        onClick={() => toggleStatusMutation.mutate(user._id)}
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
                                    <DropdownMenuItem>
                                        <Settings2 className="mr-2 h-4 w-4" />
                                        Edit Features
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
