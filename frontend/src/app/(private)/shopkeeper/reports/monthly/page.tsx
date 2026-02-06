'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect from old monthly page to new revenue report
export default function MonthlyReportPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/shopkeeper/reports/daily');
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto mb-4" />
                <p className="text-gray-600">Redirecting to Revenue Report...</p>
            </div>
        </div>
    );
}
