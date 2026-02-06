'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, Package, Users, CreditCard, ArrowRight } from 'lucide-react';

interface QuickActionsProps {
    hasWholesalers?: boolean;
    hasDueCustomers?: boolean;
    hasNormalCustomers?: boolean;
}

export function QuickActions({ hasWholesalers, hasDueCustomers, hasNormalCustomers }: QuickActionsProps) {
    return (
        <Card className="border-0 shadow-lg">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <Link href="/shopkeeper/billing">
                        <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-300">
                            <Receipt className="h-6 w-6 text-purple-500" />
                            <span>New Bill</span>
                        </Button>
                    </Link>

                    {hasWholesalers && (
                        <Link href="/shopkeeper/wholesalers">
                            <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover:bg-orange-50 hover:border-orange-300">
                                <Package className="h-6 w-6 text-orange-500" />
                                <span>Wholesalers</span>
                            </Button>
                        </Link>
                    )}

                    {(hasDueCustomers || hasNormalCustomers) && (
                        <Link href="/shopkeeper/customers">
                            <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-300">
                                <Users className="h-6 w-6 text-blue-500" />
                                <span>Customers</span>
                            </Button>
                        </Link>
                    )}

                    {hasWholesalers && (
                        <Link href="/shopkeeper/wholesalers/payments">
                            <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover:bg-green-50 hover:border-green-300">
                                <CreditCard className="h-6 w-6 text-green-500" />
                                <span>Payments</span>
                            </Button>
                        </Link>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
