'use client';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: 'purple' | 'blue' | 'green';
}

const sizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
};

const colors = {
    purple: 'border-purple-500',
    blue: 'border-blue-500',
    green: 'border-green-500',
};

export function LoadingSpinner({ size = 'md', color = 'purple' }: LoadingSpinnerProps) {
    return (
        <div className="p-8 text-center">
            <div
                className={`animate-spin rounded-full ${sizes[size]} border-t-2 border-b-2 ${colors[color]} mx-auto`}
            />
        </div>
    );
}
