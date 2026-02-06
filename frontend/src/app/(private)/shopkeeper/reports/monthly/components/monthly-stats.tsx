'use client';

import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee, TrendingUp, TrendingDown, Receipt, Users, Package } from 'lucide-react';

interface MonthlyStatsProps {
    totalSales: number;
    totalExpenses: number;
    netProfit: number;
    totalTransactions: number;
    newCustomers: number;
    avgDailyRevenue: number;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function MonthlyStats({
    totalSales,
    totalExpenses,
    netProfit,
    totalTransactions,
    newCustomers,
    avgDailyRevenue
}: MonthlyStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-xs">Total Sales</p>
                            <p className="text-xl font-bold">{formatCurrency(totalSales)}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-xs">Total Expenses</p>
                            <p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p>
                        </div>
                        <TrendingDown className="h-8 w-8 text-orange-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-xs">Net Profit</p>
                            <p className="text-xl font-bold">{formatCurrency(netProfit)}</p>
                        </div>
                        <IndianRupee className="h-8 w-8 text-purple-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-xs">Transactions</p>
                            <p className="text-2xl font-bold">{totalTransactions}</p>
                        </div>
                        <Receipt className="h-8 w-8 text-blue-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-500 to-pink-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-pink-100 text-xs">New Customers</p>
                            <p className="text-2xl font-bold">{newCustomers}</p>
                        </div>
                        <Users className="h-8 w-8 text-pink-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-cyan-100 text-xs">Avg. Daily</p>
                            <p className="text-xl font-bold">{formatCurrency(avgDailyRevenue)}</p>
                        </div>
                        <Package className="h-8 w-8 text-cyan-200" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
