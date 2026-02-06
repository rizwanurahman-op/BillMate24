'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DaySummary {
    date: string;
    sales: number;
    expenses: number;
    profit: number;
    transactions: number;
}

interface MonthlySummaryTableProps {
    data: DaySummary[];
    isLoading?: boolean;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function MonthlySummaryTable({ data, isLoading }: MonthlySummaryTableProps) {
    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                No data available for this month.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.map((day) => (
                <Card key={day.date} className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            {day.date}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Sales</span>
                                <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    {formatCurrency(day.sales)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Expenses</span>
                                <span className="text-sm font-medium text-orange-600 flex items-center gap-1">
                                    <TrendingDown className="h-3 w-3" />
                                    {formatCurrency(day.expenses)}
                                </span>
                            </div>
                            <div className="border-t pt-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-gray-700">Profit</span>
                                    <span className={`text-sm font-bold ${day.profit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                                        {formatCurrency(day.profit)}
                                    </span>
                                </div>
                            </div>
                            <div className="text-center text-xs text-gray-400">
                                {day.transactions} transactions
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
