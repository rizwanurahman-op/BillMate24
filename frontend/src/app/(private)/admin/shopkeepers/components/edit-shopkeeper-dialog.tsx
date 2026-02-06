'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UserWithStorage, Features } from '@/types';
import api from '@/config/axios';
import { toast } from 'sonner';

interface EditShopkeeperDialogProps {
    shopkeeper: UserWithStorage | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditShopkeeperDialog({ shopkeeper, open, onOpenChange }: EditShopkeeperDialogProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        businessName: '',
        address: '',
        place: '',
    });
    const [features, setFeatures] = useState<Features>({
        wholesalers: false,
        dueCustomers: false,
        normalCustomers: false,
        billing: false,
        reports: false,
    });

    useEffect(() => {
        if (shopkeeper) {
            setFormData({
                name: shopkeeper.name || '',
                email: shopkeeper.email || '',
                phone: shopkeeper.phone || '',
                businessName: shopkeeper.businessName || '',
                address: shopkeeper.address || '',
                place: shopkeeper.place || '',
            });
            setFeatures(shopkeeper.features);
        }
    }, [shopkeeper]);

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const { features, ...basicInfo } = data;

            // 1. Update basic info
            await api.patch(`/users/${shopkeeper?._id}`, basicInfo);

            // 2. Update features
            const response = await api.patch(`/users/${shopkeeper?._id}/features`, { features });

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shopkeepers'] });
            toast.success('Shopkeeper updated successfully');
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update shopkeeper');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!shopkeeper) return;

        updateMutation.mutate({
            ...formData,
            features,
        });
    };

    const handleFeatureChange = (key: keyof Features, checked: boolean) => {
        setFeatures(prev => ({
            ...prev,
            [key]: checked,
        }));
    };

    if (!shopkeeper) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Shopkeeper</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm text-gray-900 border-b pb-2">Basic Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-email">Email</Label>
                                <Input
                                    id="edit-email"
                                    value={formData.email}
                                    disabled
                                    className="bg-gray-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-phone">Phone</Label>
                                <Input
                                    id="edit-phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-businessName">Business Name</Label>
                                <Input
                                    id="edit-businessName"
                                    value={formData.businessName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-address">Address</Label>
                                <Input
                                    id="edit-address"
                                    value={formData.address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-place">Place</Label>
                                <Input
                                    id="edit-place"
                                    value={formData.place}
                                    onChange={(e) => setFormData(prev => ({ ...prev, place: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-medium text-sm text-gray-900 border-b pb-2">Feature Access</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(features).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                    <Label htmlFor={`feature-${key}`} className="capitalize cursor-pointer">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </Label>
                                    <Switch
                                        id={`feature-${key}`}
                                        checked={value}
                                        onCheckedChange={(checked) => handleFeatureChange(key as keyof Features, checked)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
                            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
