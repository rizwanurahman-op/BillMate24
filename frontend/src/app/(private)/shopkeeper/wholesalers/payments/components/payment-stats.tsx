'use client';

import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee, Building2, Calendar } from 'lucide-react';

interface PaymentStatsProps {
    totalOutstanding: number;
    pendingPayments: number;
    recentPayments: number;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function PaymentStats({ totalOutstanding, pendingPayments, recentPayments }: PaymentStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm">Total Outstanding</p>
                            <p className="text-3xl font-bold">{formatCurrency(totalOutstanding)}</p>
                        </div>
                        <IndianRupee className="h-10 w-10 text-red-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm">Pending Payments</p>
                            <p className="text-3xl font-bold">{pendingPayments}</p>
                        </div>
                        <Building2 className="h-10 w-10 text-orange-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Recent Payments</p>
                            <p className="text-3xl font-bold">{recentPayments}</p>
                        </div>
                        <Calendar className="h-10 w-10 text-purple-200" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
