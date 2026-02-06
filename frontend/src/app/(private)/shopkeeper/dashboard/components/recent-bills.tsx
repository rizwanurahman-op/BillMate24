'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface RecentBill {
    _id: string;
    billNumber: string;
    billType: 'purchase' | 'sale';
    entityName: string;
    totalAmount: number;
    createdAt: string;
}

interface RecentBillsProps {
    bills: RecentBill[];
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function RecentBills({ bills }: RecentBillsProps) {
    return (
        <Card className="border-0 shadow-lg">
            <CardHeader>
                <CardTitle>Recent Bills</CardTitle>
            </CardHeader>
            <CardContent>
                {bills && bills.length > 0 ? (
                    <div className="space-y-4">
                        {bills.map((bill) => (
                            <div key={bill._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium">{bill.entityName}</p>
                                    <p className="text-sm text-gray-500">{bill.billNumber}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">{formatCurrency(bill.totalAmount)}</p>
                                    <Badge
                                        variant={bill.billType === 'sale' ? 'default' : 'secondary'}
                                        className={bill.billType === 'sale'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-orange-100 text-orange-700'
                                        }
                                    >
                                        {bill.billType === 'sale' ? 'Sale' : 'Purchase'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">No recent bills</p>
                )}
            </CardContent>
        </Card>
    );
}
