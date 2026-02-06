'use client';

import { Users } from 'lucide-react';

export function InfoBanner() {
    return (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                    <h3 className="font-medium text-blue-900">Walk-in Customer Transactions</h3>
                    <p className="text-sm text-blue-700 mt-1">
                        Normal customers are walk-in customers who pay the full amount at the time of purchase.
                        These transactions are recorded automatically when you create a sale with &quot;Normal Customer&quot; type in the billing page.
                    </p>
                </div>
            </div>
        </div>
    );
}
