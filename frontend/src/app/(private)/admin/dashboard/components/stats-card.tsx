'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
    gradient: string;
}

export function StatsCard({ title, value, icon: Icon, description, gradient }: StatsCardProps) {
    return (
        <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className={`absolute inset-0 opacity-10 ${gradient}`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                <div className={`p-2 rounded-lg ${gradient}`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-gray-900">{value}</div>
                {description && (
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                )}
            </CardContent>
        </Card>
    );
}
