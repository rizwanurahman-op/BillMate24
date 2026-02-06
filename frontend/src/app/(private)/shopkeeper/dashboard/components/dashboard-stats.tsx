'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LayoutDashboard, IndianRupee, TrendingUp, TrendingDown, Users, Package } from 'lucide-react';

interface DashboardStatsProps {
    todaySales: number;
    todayExpenses: number;
    totalRevenue: number;
    totalCustomers: number;
    totalWholesalers: number;
    pendingDues: number;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function DashboardStats({
    todaySales,
    todayExpenses,
    totalRevenue,
    totalCustomers,
    totalWholesalers,
    pendingDues
}: DashboardStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Today's Sales</p>
                            <p className="text-3xl font-bold">{formatCurrency(todaySales)}</p>
                        </div>
                        <TrendingUp className="h-10 w-10 text-green-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm">Today's Expenses</p>
                            <p className="text-3xl font-bold">{formatCurrency(todayExpenses)}</p>
                        </div>
                        <TrendingDown className="h-10 w-10 text-orange-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Total Revenue</p>
                            <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
                        </div>
                        <IndianRupee className="h-10 w-10 text-purple-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Total Customers</p>
                            <p className="text-3xl font-bold">{totalCustomers}</p>
                        </div>
                        <Users className="h-10 w-10 text-blue-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-500 to-pink-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-pink-100 text-sm">Wholesalers</p>
                            <p className="text-3xl font-bold">{totalWholesalers}</p>
                        </div>
                        <Package className="h-10 w-10 text-pink-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm">Pending Dues</p>
                            <p className="text-3xl font-bold">{formatCurrency(pendingDues)}</p>
                        </div>
                        <LayoutDashboard className="h-10 w-10 text-red-200" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
