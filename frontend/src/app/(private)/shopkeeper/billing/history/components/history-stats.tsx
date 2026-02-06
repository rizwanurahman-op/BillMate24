'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FileText, Users, Package, IndianRupee } from 'lucide-react';

interface HistoryStatsProps {
    totalBills: number;
    salesCount: number;
    purchasesCount: number;
    totalValue: number;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function HistoryStats({ totalBills, salesCount, purchasesCount, totalValue }: HistoryStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Total Bills</p>
                            <p className="text-3xl font-bold">{totalBills}</p>
                        </div>
                        <FileText className="h-10 w-10 text-blue-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Sales</p>
                            <p className="text-3xl font-bold">{salesCount}</p>
                        </div>
                        <Users className="h-10 w-10 text-green-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm">Purchases</p>
                            <p className="text-3xl font-bold">{purchasesCount}</p>
                        </div>
                        <Package className="h-10 w-10 text-orange-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Total Value</p>
                            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                        </div>
                        <IndianRupee className="h-10 w-10 text-purple-200" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
