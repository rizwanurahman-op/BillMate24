'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, TrendingUp, Settings, Users } from 'lucide-react';

export function QuickActions() {
    const actions = [
        {
            href: '/admin/shopkeepers',
            icon: Store,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
            title: 'Manage Shopkeepers',
            description: 'Create, edit, and manage accounts',
        },
        {
            href: '/admin/subscriptions',
            icon: TrendingUp,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            title: 'Subscriptions',
            description: 'Manage subscription plans',
        },
        {
            href: '/admin/settings',
            icon: Settings,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            title: 'Settings',
            description: 'System configuration',
        },
    ];

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {actions.map((action) => (
                    <Link
                        key={action.href}
                        href={action.href}
                        className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${action.iconBg}`}>
                                <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{action.title}</p>
                                <p className="text-sm text-gray-500">{action.description}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    );
}
