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

        // OPTIMIZATION 1: Combine all Bill aggregations into ONE query
        const billsAggregation = Bill.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                },
            },
            {
                $facet: {
                    // Today's sales
                    todaySales: [
                        {
                            $match: {
                                billType: 'sale',
                                createdAt: { $gte: today },
                            },
                        },
                        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
                    ],
                    // Yesterday's sales
                    yesterdaySales: [
                        {
                            $match: {
                                billType: 'sale',
                                createdAt: { $gte: yesterday, $lt: today },
                            },
                        },
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
                    ],
                    // Week's sales
                    weekSales: [
                        {
                            $match: {
                                billType: 'sale',
                                createdAt: { $gte: weekStart },
                            },
                        },
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
                    ],
                    // Month's sales
                    monthSales: [
                        {
                            $match: {
                                billType: 'sale',
                                createdAt: { $gte: monthStart },
                            },
                        },
                        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
                    ],
                    // Today's purchases
                    todayPurchases: [
                        {
                            $match: {
                                billType: 'purchase',
                                createdAt: { $gte: today },
                            },
                        },
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
                    ],
                    // Month's purchases
                    monthPurchases: [
                        {
                            $match: {
                                billType: 'purchase',
                                createdAt: { $gte: monthStart },
                            },
                        },
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
                    ],
                    // Recent bills
                    recentBills: [
                        { $sort: { createdAt: -1 } },
                        { $limit: 5 },
                        {
                            $project: {
                                billNumber: 1,
                                billType: 1,
                                entityName: 1,
                                totalAmount: 1,
                                paidAmount: 1,
                                dueAmount: 1,
                                createdAt: 1,
                            },
                        },
                    ],
                    // Weekly trend
                    weeklyTrend: [
                        {
                            $match: {
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
                    ],
                },
            },
        ]);

        // OPTIMIZATION 2: Combine all Transaction aggregations into ONE query
        const transactionsAggregation = Transaction.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                },
            },
            {
                $facet: {
                    // Today's collected
                    todayCollected: [
                        {
                            $match: {
                                type: 'income',
                                createdAt: { $gte: today },
                            },
                        },
                        { $group: { _id: null, total: { $sum: '$amount' } } },
                    ],
                    // Yesterday's collected
                    yesterdayCollected: [
                        {
                            $match: {
                                type: 'income',
                                createdAt: { $gte: yesterday, $lt: today },
                            },
                        },
                        { $group: { _id: null, total: { $sum: '$amount' } } },
                    ],
                    // Week's collected
                    weekCollected: [
                        {
                            $match: {
                                type: 'income',
                                createdAt: { $gte: weekStart },
                            },
                        },
                        { $group: { _id: null, total: { $sum: '$amount' } } },
                    ],
                    // Month's collected
                    monthCollected: [
                        {
                            $match: {
                                type: 'income',
                                createdAt: { $gte: monthStart },
                            },
                        },
                        { $group: { _id: null, total: { $sum: '$amount' } } },
                    ],
                    // Total lifetime collected
                    totalCollected: [
                        {
                            $match: {
                                type: 'income',
                            },
                        },
                        { $group: { _id: null, total: { $sum: '$amount' } } },
                    ],
                    // Payment method split (this month)
                    paymentMethodSplit: [
                        {
                            $match: {
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
                    ],
                    // Recent transactions
                    recentTransactions: [
                        { $sort: { createdAt: -1 } },
                        { $limit: 10 },
                    ],
                    // Weekly collected trend
                    weeklyCollected: [
                        {
                            $match: {
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
                    ],
                },
            },
        ]);

        // OPTIMIZATION 3: Combine Customer aggregations
        const customerAggregation = Customer.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                },
            },
            {
                $facet: {
                    // Customer stats
                    stats: [
                        {
                            $match: {
                                type: 'due',
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                totalOutstanding: { $sum: '$outstandingDue' },
                                totalSales: { $sum: '$totalSales' },
                                totalPaid: { $sum: '$totalPaid' },
                                count: { $sum: 1 },
                                totalOpeningSales: { $sum: '$openingSales' },
                                totalOpeningPayments: { $sum: '$openingPayments' },
                                customersWithDues: {
                                    $sum: {
                                        $cond: [{ $ne: ['$outstandingDue', 0] }, 1, 0],
                                    },
                                },
                            },
                        },
                    ],
                    // Total customers
                    totalCount: [
                        {
                            $count: 'count',
                        },
                    ],
                    // Top customers with dues
                    topDues: [
                        {
                            $match: {
                                type: 'due',
                                outstandingDue: { $ne: 0 },
                            },
                        },
                        { $sort: { outstandingDue: -1 } },
                        { $limit: 5 },
                        {
                            $project: {
                                name: 1,
                                phone: 1,
                                outstandingDue: 1,
                            },
                        },
                    ],
                    // Overdue customers
                    overdue: [
                        {
                            $match: {
                                type: 'due',
                                outstandingDue: { $ne: 0 },
                                lastTransactionDate: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                            },
                        },
                        {
                            $count: 'count',
                        },
                    ],
                },
            },
        ]);

        // OPTIMIZATION 4: Combine Wholesaler aggregations
        const wholesalerAggregation = Wholesaler.aggregate([
            {
                $match: {
                    shopkeeperId: shopkeeperObjectId,
                    isDeleted: { $ne: true },
                },
            },
            {
                $facet: {
                    // Wholesaler stats
                    stats: [
                        {
                            $group: {
                                _id: null,
                                totalPurchased: { $sum: '$totalPurchased' },
                                totalPaid: { $sum: '$totalPaid' },
                                totalOutstanding: { $sum: '$outstandingDue' },
                                count: { $sum: 1 },
                                totalOpeningPurchases: { $sum: '$openingPurchases' },
                                totalOpeningPayments: { $sum: '$openingPayments' },
                                wholesalersWithDues: {
                                    $sum: {
                                        $cond: [{ $ne: ['$outstandingDue', 0] }, 1, 0],
                                    },
                                },
                            },
                        },
                    ],
                    // Top wholesalers with dues
                    topDues: [
                        {
                            $match: {
                                outstandingDue: { $ne: 0 },
                            },
                        },
                        { $sort: { outstandingDue: -1 } },
                        { $limit: 5 },
                        {
                            $project: {
                                name: 1,
                                phone: 1,
                                outstandingDue: 1,
                            },
                        },
                    ],
                },
            },
        ]);

        // OPTIMIZATION 5: Execute all queries in PARALLEL
        const [billsData, transactionsData, customersData, wholesalersData] = await Promise.all([
            billsAggregation,
            transactionsAggregation,
            customerAggregation,
            wholesalerAggregation,
        ]);

        // Extract data from results
        const bills = billsData[0];
        const transactions = transactionsData[0];
        const customers = customersData[0];
        const wholesalers = wholesalersData[0];

        // Process payment method split
        const paymentMethodSplit = { cash: 0, card: 0, online: 0 };
        transactions.paymentMethodSplit.forEach((item: any) => {
            if (item._id in paymentMethodSplit) {
                paymentMethodSplit[item._id as keyof typeof paymentMethodSplit] = item.total;
            }
        });

        // Merge weekly trends
        const weeklyTrendMap: { [date: string]: { sales: number; purchases: number; collected: number } } = {};
        bills.weeklyTrend.forEach((d: any) => {
            weeklyTrendMap[d._id] = { sales: d.sales, purchases: d.purchases, collected: 0 };
        });
        transactions.weeklyCollected.forEach((d: any) => {
            if (weeklyTrendMap[d._id]) {
                weeklyTrendMap[d._id].collected = d.collected;
            } else {
                weeklyTrendMap[d._id] = { sales: 0, purchases: 0, collected: d.collected };
            }
        });

        const weeklyTrend = Object.entries(weeklyTrendMap)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Get customer and wholesaler stats
        const customerStats = customers.stats[0] || {};
        const wholesalerStats = wholesalers.stats[0] || {};

        // Build alerts
        const alerts: { type: string; message: string; count: number }[] = [];

        const customersWithDues = customerStats.customersWithDues || 0;
        const wholesalersWithDues = wholesalerStats.wholesalersWithDues || 0;

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

        const overdueCustomers = customers.overdue[0]?.count || 0;
        if (overdueCustomers > 0) {
            alerts.push({
                type: 'error',
                message: `${overdueCustomers} customers are overdue (7+ days)`,
                count: overdueCustomers,
            });
        }

        return {
            // Sales data
            todaySales: bills.todaySales[0]?.total || 0,
            yesterdaySales: bills.yesterdaySales[0]?.total || 0,
            weekSales: bills.weekSales[0]?.total || 0,
            monthSales: bills.monthSales[0]?.total || 0,
            totalLifetimeSales: customerStats.totalSales || 0,
            totalLifetimePurchases: wholesalerStats.totalPurchased || 0,
            // Collected data
            todayCollected: transactions.todayCollected[0]?.total || 0,
            yesterdayCollected: transactions.yesterdayCollected[0]?.total || 0,
            weekCollected: transactions.weekCollected[0]?.total || 0,
            monthCollected: transactions.monthCollected[0]?.total || 0,
            totalCollected: transactions.totalCollected[0]?.total || 0,
            // Lifetime totals matching Revenue Report
            totalLifetimeCollected: customerStats.totalPaid || 0,
            totalLifetimePaid: wholesalerStats.totalPaid || 0,
            // Purchase data
            todayPurchases: bills.todayPurchases[0]?.total || 0,
            monthPurchases: bills.monthPurchases[0]?.total || 0,
            // Counts
            todayBillCount: bills.todaySales[0]?.count || 0,
            monthBillCount: bills.monthSales[0]?.count || 0,
            // Dues
            totalDueFromCustomers: customerStats.totalOutstanding || 0,
            totalDueToWholesalers: wholesalerStats.totalOutstanding || 0,
            paymentMethodSplit,
            recentTransactions: transactions.recentTransactions,
            totalCustomers: customers.totalCount[0]?.count || 0,
            totalWholesalers: wholesalerStats.count || 0,
            customersWithDues,
            wholesalersWithDues,
            recentBills: bills.recentBills,
            weeklyTrend,
            topCustomersDue: customers.topDues,
            topWholesalersDue: wholesalers.topDues,
            alerts,
            // Opening balance breakdown
            openingSales: customerStats.totalOpeningSales || 0,
            openingPayments: customerStats.totalOpeningPayments || 0,
            openingPurchases: wholesalerStats.totalOpeningPurchases || 0,
            openingPurchasePayments: wholesalerStats.totalOpeningPayments || 0,
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
