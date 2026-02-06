'use client';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                {description && <p className="text-gray-600">{description}</p>}
            </div>
            {children}
        </div>
    );
}
