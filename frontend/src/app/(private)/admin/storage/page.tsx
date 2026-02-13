'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/app/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Database,
    Users,
    FileText,
    Package,
    TrendingUp,
    TrendingDown,
    Search,
    BarChart3,
    PieChart,
    HardDrive,
    Server,
    Activity,
    Eye,
    RefreshCw,
    CreditCard,
    ArrowRightLeft
} from 'lucide-react';
import api from '@/config/axios';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TotalStorageStats {
    totalShopkeepers: number;
    storage: {
        totalBytes: number;
        formatted: string;
        breakdown: {
            users: {
                count: number;
                bytes: number;
                formatted: string;
                percentage: string;
            };
            customers: {
                count: number;
                bytes: number;
                formatted: string;
                percentage: string;
            };
            wholesalers: {
                count: number;
                bytes: number;
                formatted: string;
                percentage: string;
            };
            bills: {
                count: number;
                bytes: number;
                formatted: string;
                percentage: string;
            };
            payments: {
                count: number;
                bytes: number;
                formatted: string;
                percentage: string;
            };
            transactions: {
                count: number;
                bytes: number;
                formatted: string;
                percentage: string;
            };
            invoices: {
                count: number;
                bytes: number;
                formatted: string;
                percentage: string;
            };
        };
    };
    aggregates: {
        users: number;
        customers: number;
        wholesalers: number;
        bills: number;
        payments: number;
        transactions: number;
        invoices: number;
        revenue: number;
        expenses: number;
        profit: number;
    };
}

interface ShopkeeperComparison {
    shopkeeperId: string;
    name: string;
    email: string;
    businessName: string;
    storage: {
        totalBytes: number;
        formatted: string;
    };
    counts: {
        customers: number;
        wholesalers: number;
        bills: number;
        payments: number;
        transactions: number;
        invoices: number;
    };
}

interface DetailedStorageStats {
    storage: {
        totalBytes: number;
        formatted: string;
    };
    breakdown: {
        users: {
            shopkeeperAccount: number;
            estimatedBytes: number;
            formatted: string;
            percentage: string;
            avgSizePerItem: number;
        };
        customers: {
            total: number;
            due: number;
            normal: number;
            estimatedBytes: number;
            formatted: string;
            percentage: string;
            avgSizePerItem: number;
        };
        wholesalers: {
            total: number;
            estimatedBytes: number;
            formatted: string;
            percentage: string;
            avgSizePerItem: number;
        };
        bills: {
            total: number;
            purchase: number;
            sale: number;
            estimatedBytes: number;
            formatted: string;
            percentage: string;
            avgSizePerItem: number;
        };
        payments: {
            total: number;
            toCustomers: number;
            toWholesalers: number;
            estimatedBytes: number;
            formatted: string;
            percentage: string;
            avgSizePerItem: number;
        };
        transactions: {
            total: number;
            income: number;
            expense: number;
            estimatedBytes: number;
            formatted: string;
            percentage: string;
            avgSizePerItem: number;
        };
        invoices: {
            total: number;
            draft: number;
            sent: number;
            paid: number;
            estimatedBytes: number;
            formatted: string;
            percentage: string;
            avgSizePerItem: number;
        };
    };
    limits: {
        used: number;
        usedFormatted: string;
        limit: number;
        limitFormatted: string;
        percentage: string;
        remaining: number;
        remainingFormatted: string;
    };
    revenue: {
        total: number;
        expenses: number;
        profit: number;
    };
}

export default function StoragePage() {
    const [search, setSearch] = useState('');
    const [selectedShopkeeper, setSelectedShopkeeper] = useState<ShopkeeperComparison | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    // Fetch total storage stats
    const { data: totalStats, isLoading: totalLoading, refetch: refetchTotal } = useQuery({
        queryKey: ['storage', 'total'],
        queryFn: async () => {
            const response = await api.get<{ success: boolean; data: TotalStorageStats }>('/users/storage/total');
            return response.data.data;
        },
    });

    // Fetch storage comparison
    const { data: comparison, isLoading: comparisonLoading, refetch: refetchComparison } = useQuery({
        queryKey: ['storage', 'comparison'],
        queryFn: async () => {
            const response = await api.get<{ success: boolean; data: { shopkeepers: ShopkeeperComparison[]; summary: any } }>('/users/storage/comparison');
            return response.data.data;
        },
    });

    // Fetch detailed stats for selected shopkeeper
    const { data: detailedStats, isLoading: detailsLoading } = useQuery({
        queryKey: ['storage', 'detailed', selectedShopkeeper?.shopkeeperId],
        queryFn: async () => {
            if (!selectedShopkeeper) return null;
            const response = await api.get<{ success: boolean; data: DetailedStorageStats }>(`/users/${selectedShopkeeper.shopkeeperId}/storage/detailed`);
            return response.data.data;
        },
        enabled: !!selectedShopkeeper && detailsOpen,
    });

    const filteredShopkeepers = comparison?.shopkeepers.filter((shop) =>
        shop.name.toLowerCase().includes(search.toLowerCase()) ||
        shop.email.toLowerCase().includes(search.toLowerCase()) ||
        shop.businessName?.toLowerCase().includes(search.toLowerCase())
    );

    const handleRefresh = () => {
        refetchTotal();
        refetchComparison();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getCategoryData = () => [
        {
            name: 'Users',
            icon: Server,
            color: 'purple',
            data: totalStats?.storage.breakdown.users
        },
        {
            name: 'Customers',
            icon: Users,
            color: 'blue',
            data: totalStats?.storage.breakdown.customers
        },
        {
            name: 'Wholesalers',
            icon: Package,
            color: 'amber',
            data: totalStats?.storage.breakdown.wholesalers
        },
        {
            name: 'Bills',
            icon: FileText,
            color: 'green',
            data: totalStats?.storage.breakdown.bills
        },
        {
            name: 'Payments',
            icon: CreditCard,
            color: 'pink',
            data: totalStats?.storage.breakdown.payments
        },
        {
            name: 'Transactions',
            icon: ArrowRightLeft,
            color: 'indigo',
            data: totalStats?.storage.breakdown.transactions
        },
        {
            name: 'Invoices',
            icon: FileText,
            color: 'rose',
            data: totalStats?.storage.breakdown.invoices
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
            <Header title="Storage Management" />

            <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-900 via-purple-700 to-purple-900 bg-clip-text text-transparent">
                            Storage Analytics
                        </h2>
                        <p className="text-sm md:text-base text-gray-600 mt-1">
                            Monitor and manage storage usage across all shopkeepers
                        </p>
                    </div>
                    <Button
                        onClick={handleRefresh}
                        variant="outline"
                        className="border-purple-200 hover:bg-purple-50 flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                </div>

                {/* Overview Cards */}
                {totalLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Card key={i} className="border-0 shadow-lg">
                                <CardContent className="p-4 md:p-6">
                                    <Skeleton className="h-20" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {/* Total Storage */}
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-purple-50 to-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-transparent rounded-bl-full"></div>
                            <CardContent className="p-4 md:p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs md:text-sm font-medium text-purple-700 uppercase tracking-wider mb-1">Total Storage</p>
                                        <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{totalStats?.storage.formatted}</p>
                                        <p className="text-xs text-gray-600">{totalStats?.storage.totalBytes.toLocaleString()} bytes</p>
                                    </div>
                                    <div className="p-2.5 md:p-3 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-md">
                                        <HardDrive className="h-5 w-5 md:h-6 md:w-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Total Shopkeepers */}
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-blue-50 to-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-transparent rounded-bl-full"></div>
                            <CardContent className="p-4 md:p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs md:text-sm font-medium text-blue-700 uppercase tracking-wider mb-1">Shopkeepers</p>
                                        <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{totalStats?.totalShopkeepers}</p>
                                        <p className="text-xs text-gray-600">Active accounts</p>
                                    </div>
                                    <div className="p-2.5 md:p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-md">
                                        <Server className="h-5 w-5 md:h-6 md:w-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Total Records */}
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-green-50 to-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400/20 to-transparent rounded-bl-full"></div>
                            <CardContent className="p-4 md:p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs md:text-sm font-medium text-green-700 uppercase tracking-wider mb-1">Total Records</p>
                                        <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                                            {(
                                                (totalStats?.aggregates.users || 0) +
                                                (totalStats?.aggregates.customers || 0) +
                                                (totalStats?.aggregates.wholesalers || 0) +
                                                (totalStats?.aggregates.bills || 0) +
                                                (totalStats?.aggregates.payments || 0) +
                                                (totalStats?.aggregates.transactions || 0) +
                                                (totalStats?.aggregates.invoices || 0)
                                            ).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            All data across system
                                        </p>
                                    </div>
                                    <div className="p-2.5 md:p-3 bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-md">
                                        <Activity className="h-5 w-5 md:h-6 md:w-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Revenue */}
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-amber-50 to-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-transparent rounded-bl-full"></div>
                            <CardContent className="p-4 md:p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs md:text-sm font-medium text-amber-700 uppercase tracking-wider mb-1">Total Profit</p>
                                        <p className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                                            {formatCurrency(totalStats?.aggregates.profit || 0)}
                                        </p>
                                        <div className="flex items-center gap-1 text-xs">
                                            {(totalStats?.aggregates.profit || 0) >= 0 ? (
                                                <>
                                                    <TrendingUp className="h-3 w-3 text-green-600" />
                                                    <span className="text-green-600">Profitable</span>
                                                </>
                                            ) : (
                                                <>
                                                    <TrendingDown className="h-3 w-3 text-red-600" />
                                                    <span className="text-red-600">Loss</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-2.5 md:p-3 bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl shadow-md">
                                        <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Storage Breakdown */}
                <Tabs defaultValue="breakdown" className="space-y-4">
                    <TabsList className="grid w-full md:w-auto grid-cols-2 bg-white border shadow-sm">
                        <TabsTrigger value="breakdown" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-900">
                            <PieChart className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Storage </span>Breakdown
                        </TabsTrigger>
                        <TabsTrigger value="users" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-900">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">User </span>Comparison
                        </TabsTrigger>
                    </TabsList>

                    {/* Storage Breakdown Tab */}
                    <TabsContent value="breakdown" className="space-y-4">
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="border-b bg-gray-50/50">
                                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                    <PieChart className="h-5 w-5 text-purple-600" />
                                    Storage Distribution
                                </CardTitle>
                                <CardDescription>
                                    Breakdown of storage usage by data type
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 md:p-6">
                                {totalLoading ? (
                                    <div className="space-y-4">
                                        {[...Array(6)].map((_, i) => (
                                            <Skeleton key={i} className="h-24" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {getCategoryData().map(({ name, icon: Icon, color, data }) => (
                                            <div key={name} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 bg-${color}-100 rounded-lg`}>
                                                            <Icon className={`h-4 w-4 text-${color}-600`} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{name}</p>
                                                            <p className="text-xs text-gray-500">{data?.count.toLocaleString()} records</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-gray-900">{data?.formatted}</p>
                                                        <p className="text-xs text-gray-500">{data?.percentage}%</p>
                                                    </div>
                                                </div>
                                                <Progress value={Number(data?.percentage)} className="h-2" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* User Comparison Tab */}
                    <TabsContent value="users" className="space-y-4">
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="border-b bg-gray-50/50">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                            <BarChart3 className="h-5 w-5 text-purple-600" />
                                            Shopkeeper Comparison
                                        </CardTitle>
                                        <CardDescription>
                                            Storage usageper shopkeeper
                                        </CardDescription>
                                    </div>
                                    <div className="relative w-full sm:w-auto sm:min-w-[260px]">
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
                                {comparisonLoading ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50/50">
                                                    <TableHead className="font-semibold">Shopkeeper</TableHead>
                                                    <TableHead className="font-semibold">Storage</TableHead>
                                                    <TableHead className="font-semibold hidden lg:table-cell">Users</TableHead>
                                                    <TableHead className="font-semibold hidden md:table-cell">Customers</TableHead>
                                                    <TableHead className="font-semibold hidden lg:table-cell">Wholesalers</TableHead>
                                                    <TableHead className="font-semibold hidden sm:table-cell">Bills</TableHead>
                                                    <TableHead className="font-semibold hidden xl:table-cell">Payments</TableHead>
                                                    <TableHead className="font-semibold hidden xl:table-cell">Transactions</TableHead>
                                                    <TableHead className="font-semibold hidden xl:table-cell">Invoices</TableHead>
                                                    <TableHead className="font-semibold w-[80px]">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredShopkeepers?.map((shop, index) => (
                                                    <TableRow key={shop.shopkeeperId} className="hover:bg-gray-50/50">
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium text-gray-900">{shop.name}</p>
                                                                <p className="text-xs text-gray-500 hidden sm:block">{shop.businessName || shop.email}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Database className="h-4 w-4 text-purple-600" />
                                                                <span className="font-semibold text-gray-900">{shop.storage.formatted}</span>
                                                                {index === 0 && (
                                                                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 hidden lg:inline-flex">
                                                                        Highest
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="hidden lg:table-cell">
                                                            <Badge variant="outline" className="font-medium">1</Badge>
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">
                                                            <Badge variant="outline" className="font-medium">
                                                                {shop.counts.customers}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="hidden lg:table-cell">
                                                            <Badge variant="outline" className="font-medium">
                                                                {shop.counts.wholesalers}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="hidden sm:table-cell">
                                                            <Badge variant="outline" className="font-medium">
                                                                {shop.counts.bills}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="hidden xl:table-cell">
                                                            <Badge variant="outline" className="font-medium">
                                                                {shop.counts.payments}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="hidden xl:table-cell">
                                                            <Badge variant="outline" className="font-medium">
                                                                {shop.counts.transactions}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="hidden xl:table-cell">
                                                            <Badge variant="outline" className="font-medium">
                                                                {shop.counts.invoices}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedShopkeeper(shop);
                                                                    setDetailsOpen(true);
                                                                }}
                                                                className="hover:bg-purple-50 hover:text-purple-700"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Detailed Storage Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl md:text-2xl">
                            {selectedShopkeeper?.name} - Storage Details
                        </DialogTitle>
                    </DialogHeader>

                    {detailsLoading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                        </div>
                    ) : detailedStats && (
                        <div className="space-y-6">
                            {/* Storage Usage Progress */}
                            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-white">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-sm font-medium text-purple-700 uppercase tracking-wider">Storage Usage</p>
                                            <p className="text-3xl font-bold text-gray-900 mt-1">{detailedStats.limits.usedFormatted}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">of {detailedStats.limits.limitFormatted}</p>
                                            <p className="text-lg font-semibold text-purple-600">{detailedStats.limits.percentage}%</p>
                                        </div>
                                    </div>
                                    <Progress value={Number(detailedStats.limits.percentage)} className="h-3" />
                                    <p className="text-xs text-gray-500 mt-2">
                                        {detailedStats.limits.remainingFormatted} remaining
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Detailed Breakdown - Updated to 6 cards in 2 rows */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Users */}
                                <Card className="border-0 shadow-md bg-purple-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="p-2 bg-purple-600 rounded-lg">
                                                <Server className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-purple-900">Users</p>
                                                <p className="text-2xl font-bold text-gray-900 mt-1">{detailedStats.breakdown.users.shopkeeperAccount}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Storage:</span>
                                                <span className="font-semibold text-gray-900">{detailedStats.breakdown.users.formatted}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Percentage:</span>
                                                <span className="font-semibold text-purple-600">{detailedStats.breakdown.users.percentage}%</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Customers */}
                                <Card className="border-0 shadow-md bg-blue-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="p-2 bg-blue-600 rounded-lg">
                                                <Users className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-blue-900">Customers</p>
                                                <p className="text-2xl font-bold text-gray-900 mt-1">{detailedStats.breakdown.customers.total}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Storage:</span>
                                                <span className="font-semibold text-gray-900">{detailedStats.breakdown.customers.formatted}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Percentage:</span>
                                                <span className="font-semibold text-purple-600">{detailedStats.breakdown.customers.percentage}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Due:</span>
                                                <span className="font-semibold text-gray-900">{detailedStats.breakdown.customers.due}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Wholesalers */}
                                <Card className="border-0 shadow-md bg-amber-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="p-2 bg-amber-600 rounded-lg">
                                                <Package className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-amber-900">Wholesalers</p>
                                                <p className="text-2xl font-bold text-gray-900 mt-1">{detailedStats.breakdown.wholesalers.total}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Storage:</span>
                                                <span className="font-semibold text-gray-900">{detailedStats.breakdown.wholesalers.formatted}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Percentage:</span>
                                                <span className="font-semibold text-purple-600">{detailedStats.breakdown.wholesalers.percentage}%</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Bills */}
                                <Card className="border-0 shadow-md bg-green-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="p-2 bg-green-600 rounded-lg">
                                                <FileText className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-green-900">Bills</p>
                                                <p className="text-2xl font-bold text-gray-900 mt-1">{detailedStats.breakdown.bills.total}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Storage:</span>
                                                <span className="font-semibold text-gray-900">{detailedStats.breakdown.bills.formatted}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Percentage:</span>
                                                <span className="font-semibold text-purple-600">{detailedStats.breakdown.bills.percentage}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Purchase:</span>
                                                <span className="font-semibold text-gray-900">{detailedStats.breakdown.bills.purchase}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Payments */}
                                <Card className="border-0 shadow-md bg-pink-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="p-2 bg-pink-600 rounded-lg">
                                                <CreditCard className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-pink-900">Payments</p>
                                                <p className="text-2xl font-bold text-gray-900 mt-1">{detailedStats.breakdown.payments.total}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Storage:</span>
                                                <span className="font-semibold text-gray-900">{detailedStats.breakdown.payments.formatted}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Percentage:</span>
                                                <span className="font-semibold text-purple-600">{detailedStats.breakdown.payments.percentage}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">To Customers:</span>
                                                <span className="font-semibold text-gray-900">{detailedStats.breakdown.payments.toCustomers}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Transactions */}
                                <Card className="border-0 shadow-md bg-indigo-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="p-2 bg-indigo-600 rounded-lg">
                                                <ArrowRightLeft className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-indigo-900">Transactions</p>
                                                <p className="text-2xl font-bold text-gray-900 mt-1">{detailedStats.breakdown.transactions.total}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Storage:</span>
                                                <span className="font-semibold text-gray-900">{detailedStats.breakdown.transactions.formatted}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Percentage:</span>
                                                <span className="font-semibold text-purple-600">{detailedStats.breakdown.transactions.percentage}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Income:</span>
                                                <span className="font-semibold text-gray-900">{detailedStats.breakdown.transactions.income}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Invoices */}
                                <Card className="border-0 shadow-md bg-rose-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="p-2 bg-rose-600 rounded-lg">
                                                <FileText className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-rose-900">Invoices</p>
                                                <p className="text-2xl font-bold text-gray-900 mt-1">{detailedStats.breakdown.invoices.total}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Storage:</span>
                                                <span className="font-semibold text-gray-900">{detailedStats.breakdown.invoices.formatted}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Percentage:</span>
                                                <span className="font-semibold text-purple-600">{detailedStats.breakdown.invoices.percentage}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Paid/Draft:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {detailedStats.breakdown.invoices.paid}/{detailedStats.breakdown.invoices.draft}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Revenue Summary */}
                            <Card className="border-0 shadow-md">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Financial Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-600">Total Revenue</p>
                                        <p className="text-lg font-bold text-green-600">{formatCurrency(detailedStats.revenue.total)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Total Expenses</p>
                                        <p className="text-lg font-bold text-red-600">{formatCurrency(detailedStats.revenue.expenses)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Net Profit</p>
                                        <p className="text-lg font-bold text-purple-600">{formatCurrency(detailedStats.revenue.profit)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
