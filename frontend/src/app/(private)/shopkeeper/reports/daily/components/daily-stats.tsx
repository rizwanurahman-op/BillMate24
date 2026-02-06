'use client';

import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee, TrendingUp, TrendingDown, Receipt, Wallet, CreditCard, AlertCircle } from 'lucide-react';

interface DailyStatsProps {
    totalSales: number;
    totalExpenses: number;
    netRevenue: number;
    transactionCount: number;
    cashCollected?: number;
    cashPaid?: number;
    netCashFlow?: number;
    salesDue?: number;
    purchasesDue?: number;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function DailyStats({
    totalSales,
    totalExpenses,
    netRevenue,
    transactionCount,
    cashCollected = 0,
    cashPaid = 0,
    netCashFlow = 0,
    salesDue = 0,
    purchasesDue = 0
}: DailyStatsProps) {
    return (
        <div className="space-y-6 mb-6">
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm">Total Sales</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
                            </div>
                            <TrendingUp className="h-10 w-10 text-green-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-sm">Total Purchases</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
                            </div>
                            <TrendingDown className="h-10 w-10 text-orange-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-0 shadow-lg text-white ${netRevenue >= 0
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                    : 'bg-gradient-to-br from-red-500 to-red-600'
                    }`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${netRevenue >= 0 ? 'text-purple-100' : 'text-red-100'}`}>Gross Profit</p>
                                <p className="text-2xl font-bold">{formatCurrency(netRevenue)}</p>
                            </div>
                            <IndianRupee className={`h-10 w-10 ${netRevenue >= 0 ? 'text-purple-200' : 'text-red-200'}`} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Transactions</p>
                                <p className="text-3xl font-bold">{transactionCount}</p>
                            </div>
                            <Receipt className="h-10 w-10 text-blue-200" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Cash Flow & Dues */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="border-0 shadow-md">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <Wallet className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Cash Received</p>
                                <p className="text-lg font-bold text-green-600">{formatCurrency(cashCollected)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Cash Paid Out</p>
                                <p className="text-lg font-bold text-orange-600">{formatCurrency(cashPaid)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-0 shadow-md ${netCashFlow >= 0 ? '' : 'bg-red-50'}`}>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${netCashFlow >= 0 ? 'bg-purple-100' : 'bg-red-100'
                                }`}>
                                <IndianRupee className={`h-5 w-5 ${netCashFlow >= 0 ? 'text-purple-600' : 'text-red-600'}`} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Net Cash Flow</p>
                                <p className={`text-lg font-bold ${netCashFlow >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                                    {formatCurrency(netCashFlow)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Sales Due</p>
                                <p className="text-lg font-bold text-yellow-600">{formatCurrency(salesDue)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Purchases Due</p>
                                <p className="text-lg font-bold text-red-600">{formatCurrency(purchasesDue)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
