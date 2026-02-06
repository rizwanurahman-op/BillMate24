import axios from '@/config/axios';
import { AxiosError } from 'axios';
import { getToken } from '@/lib/getToken';
import DashboardContainer from './components/dashboard-container';
import { Header } from '@/components/app/header';

interface DashboardData {
    // Sales data (from bills)
    todaySales: number;
    yesterdaySales: number;
    weekSales: number;
    monthSales: number;
    // Collected data (from transactions/payments)
    todayCollected: number;
    yesterdayCollected: number;
    weekCollected: number;
    monthCollected: number;
    // Purchase data
    todayPurchases: number;
    monthPurchases: number;
    // Counts
    todayBillCount: number;
    monthBillCount: number;
    // Dues
    totalDueFromCustomers: number;
    totalDueToWholesalers: number;
    paymentMethodSplit: { cash: number; card: number; online: number };
    recentTransactions: any[];
    totalCustomers: number;
    totalWholesalers: number;
    customersWithDues: number;
    wholesalersWithDues: number;
    recentBills: any[];
    weeklyTrend: { date: string; sales: number; purchases: number; collected: number }[];
    topCustomersDue: any[];
    topWholesalersDue: any[];
    alerts: { type: string; message: string; count: number }[];
    totalLifetimeSales: number;
    totalLifetimePurchases: number;
    totalCollected: number;
    // Lifetime totals matching Revenue Report
    totalLifetimeCollected: number;
    totalLifetimePaid: number;
    // Opening balance breakdown
    openingSales?: number;
    openingPayments?: number;
    openingPurchases?: number;
    openingPurchasePayments?: number;
}

interface DashboardResponse {
    success: boolean;
    data: DashboardData;
}

const ShopkeeperDashboard = async () => {
    const stats = await getStats();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-purple-50">
            <Header title="Dashboard" />
            <DashboardContainer initialStats={stats} />
        </div>
    );
};

export default ShopkeeperDashboard;

const getStats = async () => {
    const token = await getToken();

    if (!token) {
        console.error('No authentication token available');
        return null;
    }

    try {
        const response = await axios.get<DashboardResponse>('/dashboard', {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response?.data?.data;
    } catch (error: unknown) {
        const errorData = (error as AxiosError)?.response?.data as any;
        console.error('Error fetching dashboard stats:', errorData?.message || error);
        return null;
    }
};
