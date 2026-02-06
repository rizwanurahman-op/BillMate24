'use client';

import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: 'info' | 'check' | 'alert';
    children?: React.ReactNode;
}

const icons = {
    info: Info,
    check: CheckCircle,
    alert: AlertCircle,
};

export function EmptyState({
    title = 'No data found',
    description,
    icon = 'info',
    children
}: EmptyStateProps) {
    const Icon = icons[icon];

    return (
        <div className="p-8 text-center">
            <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            {description && <p className="text-gray-500 mb-4">{description}</p>}
            {children}
        </div>
    );
}
