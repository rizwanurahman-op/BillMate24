'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    gradient: 'purple' | 'green' | 'blue' | 'orange' | 'red' | 'pink';
    subtitle?: string;
}

const gradients = {
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    pink: 'from-pink-500 to-pink-600',
};

const lightColors = {
    purple: 'text-purple-100',
    green: 'text-green-100',
    blue: 'text-blue-100',
    orange: 'text-orange-100',
    red: 'text-red-100',
    pink: 'text-pink-100',
};

const iconColors = {
    purple: 'text-purple-200',
    green: 'text-green-200',
    blue: 'text-blue-200',
    orange: 'text-orange-200',
    red: 'text-red-200',
    pink: 'text-pink-200',
};

export function StatsCard({ title, value, icon: Icon, gradient, subtitle }: StatsCardProps) {
    return (
        <Card className={cn("border-0 shadow-lg bg-gradient-to-br text-white", gradients[gradient])}>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className={cn("text-sm mb-1 opacity-90", lightColors[gradient])}>{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        {subtitle && <p className={cn("text-xs mt-1 font-medium", lightColors[gradient])}>{subtitle}</p>}
                    </div>
                    <Icon className={cn("h-10 w-10 opacity-40", iconColors[gradient])} />
                </div>
            </CardContent>
        </Card>
    );
}
