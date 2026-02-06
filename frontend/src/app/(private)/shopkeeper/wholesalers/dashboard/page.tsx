import axios from '@/config/axios';
import { AxiosError } from 'axios';
import { getToken } from '@/lib/getToken';
import { Header } from '@/components/app/header';
import DashboardContainer from './components/dashboard-container';
import { format } from 'date-fns';

interface Wholesaler {
    _id: string;
    name: string;
    totalPurchased: number;
    totalPaid: number;
    outstandingDue: number;
}

interface Bill {
    _id: string;
    billNumber: string;
    entityId: string;
    entityName: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    createdAt: string;
    updatedAt: string;
}

interface Payment {
    _id: string;
    entityId: string;
    entityName: string;
    entityType: 'wholesaler' | 'customer';
    amount: number;
    paymentMethod: string;
    createdAt: string;
    billId?: string;
}

const WholesalerDashboardPage = async () => {
    const initialData = await fetchDashboardData();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/20">
            <Header title="Wholesaler Dashboard" />
            <DashboardContainer initialData={initialData} />
        </div>
    );
};

export default WholesalerDashboardPage;

const fetchDashboardData = async () => {
    const token = await getToken();

    if (!token) {
        console.error('No authentication token available');
        return null;
    }

    try {
        // Fetch initial data for "today" - the default view
        const today = format(new Date(), 'yyyy-MM-dd');

        const [wholesalersResponse, purchasesResponse, paymentsResponse, duesResponse] = await Promise.all([
            axios.get('/wholesalers?limit=100', {
                headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`/bills?billType=purchase&startDate=${today}&endDate=${today}&limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`/payments?entityType=wholesaler&startDate=${today}&endDate=${today}&limit=1000`, {
                headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get('/wholesalers?limit=1000', {
                headers: { Authorization: `Bearer ${token}` },
            }),
        ]);

        const wholesalers = wholesalersResponse?.data?.data || [];
        const purchases = purchasesResponse?.data?.data || [];
        const payments = paymentsResponse?.data?.data || [];
        const allWholesalers = duesResponse?.data?.data || [];

        // Calculate dues data
        const totalWholesalerDue = allWholesalers.reduce(
            (sum: number, w: any) => sum + (w.outstandingDue || 0),
            0
        );

        const totalWholesalerPurchased = allWholesalers.reduce(
            (sum: number, w: any) => sum + (w.totalPurchased || 0),
            0
        );

        const totalWholesalerPaid = allWholesalers.reduce(
            (sum: number, w: any) => sum + (w.totalPaid || 0),
            0
        );

        return {
            wholesalers,
            todayPurchases: purchases,
            todayPayments: payments,
            duesData: {
                totalWholesalerDue,
                totalWholesalerPurchased,
                totalWholesalerPaid,
            },
        };
    } catch (error: unknown) {
        const errorData = (error as AxiosError)?.response?.data as any;
        console.error('Error fetching wholesaler dashboard data:', errorData?.message || error);
        return null;
    }
};
