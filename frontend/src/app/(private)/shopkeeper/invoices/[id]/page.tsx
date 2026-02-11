'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InvoiceDetailPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/shopkeeper/invoices');
    }, [router]);

    return null;
}

