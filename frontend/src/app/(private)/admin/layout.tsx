'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, isAdmin } = useAuth();

    useEffect(() => {
        if (user && !isAdmin) {
            router.push('/shopkeeper/dashboard');
        }
    }, [user, isAdmin, router]);

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return <>{children}</>;
}
