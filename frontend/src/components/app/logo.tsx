'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    iconOnly?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'light' | 'dark';
}

export function Logo({ className, iconOnly = false, size = 'md', variant }: LogoProps) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24'
    };

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <div className={cn(
                "relative flex-shrink-0 overflow-hidden rounded-xl bg-white shadow-sm flex items-center justify-center border border-gray-100",
                sizeClasses[size]
            )}>
                <img
                    src="/logo.jpg"
                    alt="BillMate24 Logo"
                    className="w-full h-full object-cover"
                />
            </div>
            {!iconOnly && (
                <div className="flex flex-col">
                    <span className={cn(
                        "text-xl font-bold tracking-tight leading-none",
                        variant === 'dark' ? "text-white" : "text-gray-900"
                    )}>
                        BillMate24
                    </span>
                    <span className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider mt-1",
                        variant === 'dark' ? "text-gray-400" : "text-gray-500"
                    )}>
                        Smart Billing Solution
                    </span>
                </div>
            )}
        </div>
    );
}
