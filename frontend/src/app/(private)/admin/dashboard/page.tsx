'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Store, TrendingUp, UserCheck, Database } from 'lucide-react';
import { Header } from '@/components/app/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/config/axios';

interface ShopkeeperStats {
    total: number;
    active: number;
    inactive: number;
}

function StatsCard({
    title,
    value,
    icon: Icon,
    description,
    gradient,
}: {
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
    gradient: string;
}) {
    return (
        <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className={`absolute inset-0 opacity-10 ${gradient}`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                <div className={`p-2 rounded-lg ${gradient}`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-gray-900">{value}</div>
                {description && (
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                )}
            </CardContent>
        </Card>
    );
}

export default function AdminDashboard() {
    const { data: stats, isLoading: statsLoading } = useQuery<ShopkeeperStats>({
        queryKey: ['shopkeeper-stats'],
        queryFn: async () => {
            const response = await api.get('/users/stats');
            return response.data.data;
        },
    });

    const { data: storageStats, isLoading: storageLoading } = useQuery({
        queryKey: ['total-storage'],
        queryFn: async () => {
            const response = await api.get('/users/storage/total');
            return response.data.data;
        },
    });

    const isLoading = statsLoading || storageLoading;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header title="Admin Dashboard" />

            <div className="p-6">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Welcome back, Admin!</h2>
                    <p className="text-gray-600">Here&apos;s an overview of your system</p>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <Card key={i} className="h-32 animate-pulse bg-gray-200" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatsCard
                            title="Total Shopkeepers"
                            value={stats?.total || 0}
                            icon={Store}
                            gradient="bg-gradient-to-br from-purple-500 to-pink-500"
                            description="Registered in system"
                        />
                        <StatsCard
                            title="Active Shopkeepers"
                            value={stats?.active || 0}
                            icon={UserCheck}
                            gradient="bg-gradient-to-br from-green-500 to-emerald-500"
                            description="Currently active"
                        />
                        <StatsCard
                            title="Inactive Shopkeepers"
                            value={stats?.inactive || 0}
                            icon={Users}
                            gradient="bg-gradient-to-br from-orange-500 to-red-500"
                            description="Deactivated accounts"
                        />
                        <StatsCard
                            title="System Storage"
                            value={storageStats?.storage?.formatted || '0 Bytes'}
                            icon={Database}
                            gradient="bg-gradient-to-br from-indigo-500 to-purple-500"
                            description={`${storageStats?.aggregates?.bills || 0} bills • ${storageStats?.aggregates?.invoices || 0} invoices`}
                        />
                    </div>
                )}

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <a
                                href="/admin/shopkeepers"
                                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-100">
                                        <Store className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Manage Shopkeepers</p>
                                        <p className="text-sm text-gray-500">Create, edit, and manage accounts</p>
                                    </div>
                                </div>
                            </a>
                            <a
                                href="/admin/storage"
                                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-100">
                                        <Database className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Storage Analytics</p>
                                        <p className="text-sm text-gray-500">System-wide storage breakdown</p>
                                    </div>
                                </div>
                            </a>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                New shopkeeper registered
                                            </p>
                                            <p className="text-xs text-gray-500">{i} hours ago</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
