'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Receipt, IndianRupee, TrendingUp } from 'lucide-react';

interface TransactionStatsProps {
    totalTransactions: number;
    totalRevenue: number;
    todaySales: number;
    todayRevenue: number;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function TransactionStats({
    totalTransactions,
    totalRevenue,
    todaySales,
    todayRevenue
}: TransactionStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Total Transactions</p>
                            <p className="text-3xl font-bold">{totalTransactions}</p>
                        </div>
                        <Receipt className="h-10 w-10 text-purple-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Total Revenue</p>
                            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                        </div>
                        <IndianRupee className="h-10 w-10 text-green-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Today&apos;s Sales</p>
                            <p className="text-3xl font-bold">{todaySales}</p>
                        </div>
                        <TrendingUp className="h-10 w-10 text-blue-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm">Today&apos;s Revenue</p>
                            <p className="text-2xl font-bold">{formatCurrency(todayRevenue)}</p>
                        </div>
                        <IndianRupee className="h-10 w-10 text-orange-200" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
