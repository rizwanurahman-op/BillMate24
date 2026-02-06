import { Transaction } from './transaction.model';
import { Bill } from '../bills/bill.model';
import { Wholesaler } from '../wholesalers/wholesaler.model';
import { Customer } from '../customers/customer.model';
import mongoose from 'mongoose';

export class DashboardService {
    async getShopkeeperDashboard(shopkeeperId: string): Promise<{
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
        // Opening balance breakdown for clearer reporting
        openingSales: number;
        openingPayments: number;
        openingPurchases: number;
        openingPurchasePayments: number;
    }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        const shopkeeperObjectId = new mongoose.Types.ObjectId(shopkeeperId);

        // ============ SALES DATA FROM BILLS ============

        // Today's sales (from sale bills)
        const todaySalesResult = await Bill.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                    billType: 'sale',
                    createdAt: { $gte: today },
                },
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        ]);

        // Yesterday's sales
        const yesterdaySalesResult = await Bill.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                    billType: 'sale',
                    createdAt: { $gte: yesterday, $lt: today },
                },
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);

        // This week's sales
        const weekSalesResult = await Bill.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                    billType: 'sale',
                    createdAt: { $gte: weekStart },
                },
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);

        // This month's sales
        const monthSalesResult = await Bill.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                    billType: 'sale',
                    createdAt: { $gte: monthStart },
                },
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        ]);

        // ============ COLLECTED DATA FROM TRANSACTIONS ============

        // Today's collected (from income transactions)
        const todayCollectedResult = await Transaction.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                    type: 'income',
                    createdAt: { $gte: today },
                },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        // Yesterday's collected
        const yesterdayCollectedResult = await Transaction.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                    type: 'income',
                    createdAt: { $gte: yesterday, $lt: today },
                },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        // This week's collected
        const weekCollectedResult = await Transaction.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                    type: 'income',
                    createdAt: { $gte: weekStart },
                },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        // This month's collected
        const monthCollectedResult = await Transaction.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                    type: 'income',
                    createdAt: { $gte: monthStart },
                },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        // ============ PURCHASE DATA ============

        // Today's purchases
        const todayPurchasesResult = await Bill.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                    billType: 'purchase',
                    createdAt: { $gte: today },
                },
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);

        // Month's purchases
        const monthPurchasesResult = await Bill.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                    billType: 'purchase',
                    createdAt: { $gte: monthStart },
                },
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);

        // Net balance from customers (positive = they owe us, negative = we owe them advance)
        // Also get totalSales and totalPaid for accurate lifetime calculations
        const customerDueResult = await Customer.aggregate([
            { $match: { shopkeeperId: shopkeeperObjectId, type: 'due' } },
            {
                $group: {
                    _id: null,
                    totalOutstanding: { $sum: '$outstandingDue' },
                    totalSales: { $sum: '$totalSales' },
                    totalPaid: { $sum: '$totalPaid' },
                    count: { $sum: 1 }
                }
            },
        ]);

        // Wholesaler aggregations - get actual totals
        const wholesalerStatsResult = await Wholesaler.aggregate([
            { $match: { shopkeeperId: shopkeeperObjectId, isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: null,
                    totalPurchased: { $sum: '$totalPurchased' },
                    totalPaid: { $sum: '$totalPaid' },
                    totalOutstanding: { $sum: '$outstandingDue' },
                    count: { $sum: 1 }
                }
            },
        ]);

        // Customer and Wholesaler counts (Non-zero balances)
        const [totalCustomers, totalWholesalers, customersWithDues, wholesalersWithDues] = await Promise.all([
            Customer.countDocuments({ shopkeeperId: shopkeeperObjectId }),
            Wholesaler.countDocuments({ shopkeeperId: shopkeeperObjectId, isDeleted: { $ne: true } }),
            Customer.countDocuments({ shopkeeperId: shopkeeperObjectId, type: 'due', outstandingDue: { $ne: 0 } }),
            Wholesaler.countDocuments({ shopkeeperId: shopkeeperObjectId, outstandingDue: { $ne: 0 }, isDeleted: { $ne: true } }),
        ]);

        // Payment method split (this month - from transactions)
        const paymentSplitResult = await Transaction.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                    type: 'income',
                    createdAt: { $gte: monthStart },
                },
            },
            {
                $group: {
                    _id: '$paymentMethod',
                    total: { $sum: '$amount' },
                },
            },
        ]);

        const paymentMethodSplit = { cash: 0, card: 0, online: 0 };
        paymentSplitResult.forEach((item) => {
            if (item._id in paymentMethodSplit) {
                paymentMethodSplit[item._id as keyof typeof paymentMethodSplit] = item.total;
            }
        });

        // Recent transactions
        const recentTransactions = await Transaction.find({ shopkeeperId })
            .sort({ createdAt: -1 })
            .limit(10);

        // Recent bills
        const recentBills = await Bill.find({ shopkeeperId: shopkeeperObjectId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('billNumber billType entityName totalAmount paidAmount dueAmount createdAt');

        // Weekly trend (last 7 days) - from bills
        const weeklyBillsTrend = await Bill.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                    createdAt: { $gte: weekStart },
                },
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        type: '$billType',
                    },
                    total: { $sum: '$totalAmount' },
                },
            },
            {
                $group: {
                    _id: '$_id.date',
                    sales: {
                        $sum: { $cond: [{ $eq: ['$_id.type', 'sale'] }, '$total', 0] },
                    },
                    purchases: {
                        $sum: { $cond: [{ $eq: ['$_id.type', 'purchase'] }, '$total', 0] },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Weekly collected trend (from transactions)
        const weeklyCollectedTrend = await Transaction.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                    type: 'income',
                    createdAt: { $gte: weekStart },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    collected: { $sum: '$amount' },
                },
            },
        ]);

        // Merge weekly trends
        const weeklyTrendMap: { [date: string]: { sales: number; purchases: number; collected: number } } = {};
        weeklyBillsTrend.forEach((d) => {
            weeklyTrendMap[d._id] = { sales: d.sales, purchases: d.purchases, collected: 0 };
        });
        weeklyCollectedTrend.forEach((d) => {
            if (weeklyTrendMap[d._id]) {
                weeklyTrendMap[d._id].collected = d.collected;
            } else {
                weeklyTrendMap[d._id] = { sales: 0, purchases: 0, collected: d.collected };
            }
        });

        const weeklyTrend = Object.entries(weeklyTrendMap)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Top customers with outstanding balances (including advances)
        const topCustomersDue = await Customer.find({
            shopkeeperId: shopkeeperObjectId,
            type: 'due',
            outstandingDue: { $ne: 0 },
        })
            .sort({ outstandingDue: -1 })
            .limit(5)
            .select('name phone outstandingDue');

        // Top wholesalers with outstanding balances (including advances)
        const topWholesalersDue = await Wholesaler.find({
            shopkeeperId: shopkeeperObjectId,
            outstandingDue: { $ne: 0 },
            isDeleted: { $ne: true },
        })
            .sort({ outstandingDue: -1 })
            .limit(5)
            .select('name phone outstandingDue');

        // Alerts
        const alerts: { type: string; message: string; count: number }[] = [];

        if (customersWithDues > 0) {
            alerts.push({
                type: 'warning',
                message: `${customersWithDues} customers have outstanding balances`,
                count: customersWithDues,
            });
        }

        if (wholesalersWithDues > 0) {
            alerts.push({
                type: 'info',
                message: `${wholesalersWithDues} wholesalers have outstanding balances`,
                count: wholesalersWithDues,
            });
        }

        // Check for overdue (more than 7 days)
        const overdueCustomers = await Customer.countDocuments({
            shopkeeperId: shopkeeperObjectId,
            type: 'due',
            outstandingDue: { $ne: 0 },
            lastTransactionDate: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        });

        if (overdueCustomers > 0) {
            alerts.push({
                type: 'error',
                message: `${overdueCustomers} customers are overdue (7+ days)`,
                count: overdueCustomers,
            });
        }

        // Total Collected (Lifetime) - from Transaction model (for period-based reports)
        const totalCollectedResult = await Transaction.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                    type: 'income',
                },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalCollected = totalCollectedResult[0]?.total || 0;

        // Get wholesaler totals
        const wholesalerTotalPurchased = wholesalerStatsResult[0]?.totalPurchased || 0;
        const wholesalerTotalPaid = wholesalerStatsResult[0]?.totalPaid || 0;
        const wholesalerTotalOutstanding = wholesalerStatsResult[0]?.totalOutstanding || 0;

        // Get customer totals - These match the Revenue Report calculation
        const customerTotalSales = customerDueResult[0]?.totalSales || 0;
        const customerTotalPaid = customerDueResult[0]?.totalPaid || 0;

        // Total Lifetime Sales = Sum of all customer.totalSales (includes opening balance)
        // This matches the Revenue Report: customers.reduce((sum, c) => sum + (c.totalSales || 0), 0)
        const totalLifetimeSales = customerTotalSales;

        // Total Lifetime Purchases = Total purchased from wholesalers (includes opening balance)
        // This matches the Revenue Report: wholesalers.reduce((sum, w) => sum + (w.totalPurchased || 0), 0)
        const totalLifetimePurchases = wholesalerTotalPurchased;

        // Total Lifetime Collected = Sum of all customer.totalPaid (includes opening payments)
        const totalLifetimeCollected = customerTotalPaid;

        // Total Lifetime Paid = Sum of all wholesaler.totalPaid (includes opening payments)
        const totalLifetimePaid = wholesalerTotalPaid;

        // Calculate opening balance breakdown for clearer reporting
        // Get sum of all opening balances from customers
        const customerOpeningBalances = await Customer.aggregate([
            { $match: { shopkeeperId: shopkeeperObjectId, type: 'due' } },
            {
                $group: {
                    _id: null,
                    totalOpeningSales: { $sum: '$openingSales' },
                    totalOpeningPayments: { $sum: '$openingPayments' },
                }
            },
        ]);

        // Get sum of all opening balances from wholesalers
        const wholesalerOpeningBalances = await Wholesaler.aggregate([
            { $match: { shopkeeperId: shopkeeperObjectId, isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: null,
                    totalOpeningPurchases: { $sum: '$openingPurchases' },
                    totalOpeningPayments: { $sum: '$openingPayments' },
                }
            },
        ]);

        const openingSales = customerOpeningBalances[0]?.totalOpeningSales || 0;
        const openingPayments = customerOpeningBalances[0]?.totalOpeningPayments || 0;
        const openingPurchases = wholesalerOpeningBalances[0]?.totalOpeningPurchases || 0;
        const openingPurchasePayments = wholesalerOpeningBalances[0]?.totalOpeningPayments || 0;


        return {
            // Sales data
            todaySales: todaySalesResult[0]?.total || 0,
            yesterdaySales: yesterdaySalesResult[0]?.total || 0,
            weekSales: weekSalesResult[0]?.total || 0,
            monthSales: monthSalesResult[0]?.total || 0,
            totalLifetimeSales,
            totalLifetimePurchases,
            // Collected data
            todayCollected: todayCollectedResult[0]?.total || 0,
            yesterdayCollected: yesterdayCollectedResult[0]?.total || 0,
            weekCollected: weekCollectedResult[0]?.total || 0,
            monthCollected: monthCollectedResult[0]?.total || 0,
            totalCollected, // New field
            // Lifetime totals matching Revenue Report
            totalLifetimeCollected,
            totalLifetimePaid,
            // Purchase data
            todayPurchases: todayPurchasesResult[0]?.total || 0,
            monthPurchases: monthPurchasesResult[0]?.total || 0,
            // Counts
            todayBillCount: todaySalesResult[0]?.count || 0,
            monthBillCount: monthSalesResult[0]?.count || 0,
            // Dues - use the outstanding totals
            totalDueFromCustomers: customerDueResult[0]?.totalOutstanding || 0,
            totalDueToWholesalers: wholesalerTotalOutstanding,
            paymentMethodSplit,
            recentTransactions,
            totalCustomers,
            totalWholesalers,
            customersWithDues,
            wholesalersWithDues,
            recentBills,
            weeklyTrend,
            topCustomersDue,
            topWholesalersDue,
            alerts,
            // Opening balance breakdown
            openingSales,
            openingPayments,
            openingPurchases,
            openingPurchasePayments,
        };
    }

    async getDailyReport(shopkeeperId: string, date: Date): Promise<{
        totalIncome: number;
        totalExpense: number;
        netRevenue: number;
        transactionCount: number;
        transactions: any[];
    }> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const shopkeeperObjectId = new mongoose.Types.ObjectId(shopkeeperId);

        const result = await Transaction.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                    createdAt: { $gte: startOfDay, $lte: endOfDay },
                },
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const transactions = await Transaction.find({
            shopkeeperId,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
        }).sort({ createdAt: -1 });

        let totalIncome = 0;
        let totalExpense = 0;

        result.forEach((item) => {
            if (item._id === 'income') totalIncome = item.total;
            if (item._id === 'expense') totalExpense = item.total;
        });

        return {
            totalIncome,
            totalExpense,
            netRevenue: totalIncome - totalExpense,
            transactionCount: transactions.length,
            transactions,
        };
    }

    async getMonthlyReport(shopkeeperId: string, year: number, month: number): Promise<{
        totalIncome: number;
        totalExpense: number;
        netRevenue: number;
        dailyBreakdown: { date: string; income: number; expense: number }[];
    }> {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

        const shopkeeperObjectId = new mongoose.Types.ObjectId(shopkeeperId);

        const dailyBreakdown = await Transaction.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                },
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        type: '$type',
                    },
                    total: { $sum: '$amount' },
                },
            },
            {
                $group: {
                    _id: '$_id.date',
                    income: {
                        $sum: { $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0] },
                    },
                    expense: {
                        $sum: { $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0] },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const totalsResult = await Transaction.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                },
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                },
            },
        ]);

        let totalIncome = 0;
        let totalExpense = 0;
        totalsResult.forEach((item) => {
            if (item._id === 'income') totalIncome = item.total;
            if (item._id === 'expense') totalExpense = item.total;
        });

        return {
            totalIncome,
            totalExpense,
            netRevenue: totalIncome - totalExpense,
            dailyBreakdown: dailyBreakdown.map((d) => ({
                date: d._id,
                income: d.income,
                expense: d.expense,
            })),
        };
    }

    async getOutstandingDuesReport(shopkeeperId: string): Promise<{
        customerDues: any[];
        wholesalerDues: any[];
        totalCustomerDue: number;
        totalWholesalerDue: number;
    }> {
        const [customerDues, wholesalerDues] = await Promise.all([
            Customer.find({ shopkeeperId, outstandingDue: { $gt: 0 } })
                .select('name phone outstandingDue lastPaymentDate')
                .sort({ outstandingDue: -1 }),
            Wholesaler.find({ shopkeeperId, outstandingDue: { $gt: 0 } })
                .select('name phone outstandingDue')
                .sort({ outstandingDue: -1 }),
        ]);

        const totalCustomerDue = customerDues.reduce((sum, c) => sum + c.outstandingDue, 0);
        const totalWholesalerDue = wholesalerDues.reduce((sum, w) => sum + w.outstandingDue, 0);

        return {
            customerDues,
            wholesalerDues,
            totalCustomerDue,
            totalWholesalerDue,
        };
    }
}

export const dashboardService = new DashboardService();
