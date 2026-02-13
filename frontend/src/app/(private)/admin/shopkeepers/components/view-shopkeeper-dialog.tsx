'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserWithStorage } from '@/types';
import { Database, Users, FileText, TrendingUp, Package, Check, X, Phone, Mail, Building2, User, MapPin, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ViewShopkeeperDialogProps {
    shopkeeper: UserWithStorage | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ViewShopkeeperDialog({ shopkeeper, open, onOpenChange }: ViewShopkeeperDialogProps) {
    if (!shopkeeper) return null;

    const { storageStats, features } = shopkeeper;

    const stats = [
        {
            icon: Database,
            label: 'Total Storage',
            value: storageStats.storage.formatted,
            description: `${storageStats.storage.totalBytes.toLocaleString()} bytes`,
            color: 'bg-gradient-to-br from-purple-500 to-pink-500',
            bg: 'bg-purple-50',
            border: 'border-purple-100',
            text: 'text-purple-700',
        },
        {
            icon: Users,
            label: 'Customers',
            value: storageStats.customers.total.toString(),
            description: `${storageStats.customers.due} due • ${storageStats.customers.normal} normal`,
            color: 'bg-gradient-to-br from-blue-500 to-cyan-500',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            text: 'text-blue-700',
        },
        {
            icon: Package,
            label: 'Wholesalers',
            value: storageStats.wholesalers.total.toString(),
            description: 'Active wholesalers',
            color: 'bg-gradient-to-br from-amber-500 to-orange-500',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            text: 'text-amber-700',
        },
        {
            icon: FileText,
            label: 'Bills',
            value: storageStats.bills.total.toString(),
            description: `${storageStats.bills.purchase} purchase • ${storageStats.bills.sale} sale`,
            color: 'bg-gradient-to-br from-green-500 to-emerald-500',
            bg: 'bg-green-50',
            border: 'border-green-100',
            text: 'text-green-700',
        },
        {
            icon: FileText,
            label: 'Invoices',
            value: storageStats.invoices.total.toString(),
            description: `${storageStats.invoices.paid} paid • ${storageStats.invoices.draft} draft`,
            color: 'bg-gradient-to-br from-rose-500 to-red-500',
            bg: 'bg-rose-50',
            border: 'border-rose-100',
            text: 'text-rose-700',
        },
        {
            icon: TrendingUp,
            label: 'Transactions',
            value: storageStats.transactions.total.toString(),
            description: `${storageStats.transactions.income} income • ${storageStats.transactions.expense} expense`,
            color: 'bg-gradient-to-br from-indigo-500 to-purple-500',
            bg: 'bg-indigo-50',
            border: 'border-indigo-100',
            text: 'text-indigo-700',
        },
        {
            icon: Database,
            label: 'Payments',
            value: storageStats.payments.total.toString(),
            description: `${storageStats.payments.toCustomers} cust • ${storageStats.payments.toWholesalers} whol`,
            color: 'bg-gradient-to-br from-cyan-500 to-blue-500',
            bg: 'bg-cyan-50',
            border: 'border-cyan-100',
            text: 'text-cyan-700',
        },
    ];

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2 border-b bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white flex items-center justify-center text-lg md:text-xl font-bold shadow-md ring-2 ring-white">
                                {getInitials(shopkeeper.name)}
                            </div>
                            <div>
                                <DialogTitle className="text-xl md:text-2xl font-bold text-gray-900">{shopkeeper.name}</DialogTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <Building2 className="h-3.5 w-3.5 text-gray-500" />
                                    <p className="text-sm text-gray-600">{shopkeeper.businessName || 'Business Name Not Set'}</p>
                                </div>
                            </div>
                        </div>
                        <Badge variant={shopkeeper.isActive ? 'default' : 'secondary'} className="self-start sm:self-center px-3 py-1">
                            {shopkeeper.isActive ? 'Active Account' : 'Inactive Account'}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="p-2 bg-white rounded-lg border shadow-sm shrink-0">
                                <Mail className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</p>
                                <p className="text-sm font-semibold text-gray-900 truncate" title={shopkeeper.email}>{shopkeeper.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="p-2 bg-white rounded-lg border shadow-sm shrink-0">
                                <Phone className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</p>
                                <p className="text-sm font-semibold text-gray-900 truncate">{shopkeeper.phone || 'Not provided'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="p-2 bg-white rounded-lg border shadow-sm shrink-0">
                                <MapPin className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Address</p>
                                <p className="text-sm font-semibold text-gray-900 truncate" title={shopkeeper.address}>{shopkeeper.address || 'Not provided'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="p-2 bg-white rounded-lg border shadow-sm shrink-0">
                                <Navigation className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Place</p>
                                <p className="text-sm font-semibold text-gray-900 truncate">{shopkeeper.place || 'Not provided'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            Active Features
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(features).map(([key, enabled]) => (
                                <Badge
                                    key={key}
                                    variant="outline"
                                    className={`px-3 py-1.5 capitalize transition-colors ${enabled
                                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                        : 'bg-gray-50 text-gray-400 border-gray-100 decoration-dashed'
                                        }`}
                                >
                                    {enabled && <Check className="h-3.5 w-3.5 mr-1.5" />}
                                    {!enabled && <X className="h-3.5 w-3.5 mr-1.5" />}
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <Separator className="bg-gray-100" />

                    {/* Stats */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-purple-500" />
                            Performance Overview
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {stats.map((stat, index) => {
                                const Icon = stat.icon;
                                return (
                                    <Card key={index} className={`border ${stat.border} ${stat.bg} shadow-sm hover:shadow-md transition-all duration-200`}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${stat.color} shadow-sm shrink-0`}>
                                                    <Icon className="h-4 w-4 text-white" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-xs font-medium ${stat.text} opacity-80 break-words`}>{stat.label}</p>
                                                    <p className="text-lg font-bold text-gray-900 mt-0.5 break-all">{stat.value}</p>
                                                    <p className="text-[10px] text-gray-500 break-words leading-tight">{stat.description}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
