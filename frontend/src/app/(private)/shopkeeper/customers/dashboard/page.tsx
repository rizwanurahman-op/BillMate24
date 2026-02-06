import axios from '@/config/axios';
import { AxiosError } from 'axios';
import { getToken } from '@/lib/getToken';
import { Header } from '@/components/app/header';
import DashboardContainer from './components/dashboard-container';
import { format } from 'date-fns';

interface Customer {
    _id: string;
    name: string;
    phone?: string;
    customerType: 'due' | 'normal';
    totalPurchased: number;
    totalPaid: number;
    outstandingDue: number;
    lastTransactionDate?: string;
}

interface Bill {
    _id: string;
    billNumber: string;
    entityId: string;
    entityName: string;
    entityType: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentMethod: 'cash' | 'card' | 'online';
    createdAt: string;
}

interface Payment {
    _id: string;
    entityId: string;
    entityName: string;
    entityType: 'wholesaler' | 'customer';
    amount: number;
    paymentMethod: string;
    createdAt: string;
}

const CustomerDashboardPage = async () => {
    const initialData = await fetchDashboardData();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/20">
            <Header title="Customer Dashboard" />
            <DashboardContainer initialData={initialData} />
        </div>
    );
};

export default CustomerDashboardPage;

const fetchDashboardData = async () => {
    const token = await getToken();

    if (!token) {
        console.error('No authentication token available');
        return null;
    }

    try {
        // Fetch initial data for "today" - the default view
        const today = format(new Date(), 'yyyy-MM-dd');

        const [dueCustomersResponse, salesResponse, paymentsResponse, statsResponse] = await Promise.all([
            axios.get('/customers?type=due&limit=100', {
                headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`/bills?billType=sale&startDate=${today}&endDate=${today}&limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`/payments?entityType=customer&startDate=${today}&endDate=${today}&limit=1000`, {
                headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get('/customers/stats?type=due', {
                headers: { Authorization: `Bearer ${token}` },
            }),
        ]);

        return {
            dueCustomers: dueCustomersResponse?.data?.data || [],
            todaySales: salesResponse?.data?.data || [],
            todayPayments: paymentsResponse?.data?.data || [],
            statsData: statsResponse?.data?.data,
        };
    } catch (error: unknown) {
        const errorData = (error as AxiosError)?.response?.data as any;
        console.error('Error fetching customer dashboard data:', errorData?.message || error);
        return null;
    }
};
