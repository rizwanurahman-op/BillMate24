'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, User, Mail, Lock, Phone, Building2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetDescription,
} from '@/components/ui/sheet';
import api from '@/config/axios';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/use-media-query';

interface ShopkeeperFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

function ShopkeeperForm({ onSuccess, onCancel }: ShopkeeperFormProps) {
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/users', data);
            return response.data;
        },
        onSuccess: () => {
            onSuccess();
            toast.success('Shopkeeper created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create shopkeeper');
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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

    return (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 mt-4 pb-4 md:pb-0">
            <div className="space-y-2">
                <Label htmlFor="name" className="text-sm md:text-base">Name *</Label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="name"
                        name="name"
                        placeholder="Full Name"
                        required
                        className="pl-10 h-10 md:h-11 text-base md:text-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm md:text-base">Email *</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="email@example.com"
                            required
                            className="pl-10 h-10 md:h-11 text-base md:text-sm"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm md:text-base">Password *</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Min 6 characters"
                            required
                            minLength={6}
                            className="pl-10 h-10 md:h-11 text-base md:text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm md:text-base">Phone</Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="+91"
                            className="pl-10 h-10 md:h-11 text-base md:text-sm"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm md:text-base">Business Name</Label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="businessName"
                            name="businessName"
                            placeholder="Shop Name"
                            className="pl-10 h-10 md:h-11 text-base md:text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="address" className="text-sm md:text-base">Address</Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="address"
                        name="address"
                        placeholder="Complete Address"
                        className="pl-10 h-10 md:h-11 text-base md:text-sm"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="place" className="text-sm md:text-base">Place / City</Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="place"
                        name="place"
                        placeholder="City or Town"
                        className="pl-10 h-10 md:h-11 text-base md:text-sm"
                    />
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1 h-10 md:h-11 text-base md:text-sm"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 h-10 md:h-11 text-base md:text-sm font-medium"
                    disabled={createMutation.isPending}
                >
                    {createMutation.isPending ? 'Creating...' : 'Create Shopkeeper'}
                </Button>
            </div>
        </form>
    );
}

export function AddShopkeeperDialog() {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const isDesktop = useMediaQuery('(min-width: 768px)');

    const onSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['shopkeepers'] });
        setIsOpen(false);
    };

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-md hover:shadow-lg transition-all">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Shopkeeper
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Shopkeeper</DialogTitle>
                        <DialogDescription>
                            Create a new shopkeeper account with access to the system.
                        </DialogDescription>
                    </DialogHeader>
                    <ShopkeeperForm onSuccess={onSuccess} onCancel={() => setIsOpen(false)} />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-md hover:shadow-lg transition-all">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Shopkeeper
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[20px] max-h-[90vh] overflow-y-auto px-4 md:px-6 pb-6">
                <SheetHeader className="text-left md:text-center mt-2">
                    <SheetTitle>Create Shopkeeper</SheetTitle>
                    <SheetDescription>
                        Create a new account with necessary details.
                    </SheetDescription>
                </SheetHeader>
                <ShopkeeperForm onSuccess={onSuccess} onCancel={() => setIsOpen(false)} />
            </SheetContent>
        </Sheet>
    );
}
