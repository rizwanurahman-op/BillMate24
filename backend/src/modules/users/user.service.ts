import { User } from './user.model';
import { hashPassword } from '../../utils/auth';
import { CreateShopkeeperInput, UpdateShopkeeperInput, UpdateFeaturesInput } from './user.validation';
import { IUser, Features, InvoicePreferences } from '../../types';
import { Bill } from '../bills/bill.model';
import { Customer } from '../customers/customer.model';
import { Wholesaler } from '../wholesalers/wholesaler.model';
import { Payment } from '../payments/payment.model';
import { Transaction } from '../dashboard/transaction.model';
import { Invoice } from '../invoices/invoice.model';
import mongoose from 'mongoose';

export class UserService {
    async createShopkeeper(input: CreateShopkeeperInput): Promise<Omit<IUser, 'password' | 'refreshToken'>> {
        // Check if email already exists
        const existingEmail = await User.findOne({ email: input.email.toLowerCase() });
        if (existingEmail) {
            throw new Error('Email already registered');
        }

        // Check if phone number already exists (if provided)
        if (input.phone) {
            const existingPhone = await User.findOne({ phone: input.phone.trim() });
            if (existingPhone) {
                throw new Error('Phone number already registered');
            }
        }

        const hashedPassword = await hashPassword(input.password);

        const user = new User({
            ...input,
            email: input.email.toLowerCase(),
            password: hashedPassword,
            role: 'shopkeeper',
        });

        await user.save();

        const userResponse = user.toObject();
        delete (userResponse as any).password;
        delete (userResponse as any).refreshToken;

        return userResponse as Omit<IUser, 'password' | 'refreshToken'>;
    }

    async getAllShopkeepers(page: number, limit: number): Promise<{
        users: Omit<IUser, 'password' | 'refreshToken'>[];
        total: number;
        totalPages: number;
    }> {
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find({ role: 'shopkeeper' })
                .select('-password -refreshToken')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments({ role: 'shopkeeper' }),
        ]);

        return {
            users: users.map(u => u.toObject() as Omit<IUser, 'password' | 'refreshToken'>),
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getShopkeeperById(id: string): Promise<Omit<IUser, 'password' | 'refreshToken'>> {
        const user = await User.findOne({ _id: id, role: 'shopkeeper' })
            .select('-password -refreshToken');

        if (!user) {
            throw new Error('Shopkeeper not found');
        }

        return user.toObject() as Omit<IUser, 'password' | 'refreshToken'>;
    }

    async updateShopkeeper(
        id: string,
        input: UpdateShopkeeperInput
    ): Promise<Omit<IUser, 'password' | 'refreshToken'>> {
        // Check if phone number is being updated and if it already exists
        if (input.phone) {
            const existingPhone = await User.findOne({
                phone: input.phone.trim(),
                _id: { $ne: id } // Exclude current user from check
            });
            if (existingPhone) {
                throw new Error('Phone number already registered');
            }
        }

        const user = await User.findOneAndUpdate(
            { _id: id, role: 'shopkeeper' },
            { $set: input },
            { new: true }
        ).select('-password -refreshToken');

        if (!user) {
            throw new Error('Shopkeeper not found');
        }

        return user.toObject() as Omit<IUser, 'password' | 'refreshToken'>;
    }

    async updateShopkeeperFeatures(
        id: string,
        features: Features
    ): Promise<Omit<IUser, 'password' | 'refreshToken'>> {
        const user = await User.findOneAndUpdate(
            { _id: id, role: 'shopkeeper' },
            { $set: { features } },
            { new: true }
        ).select('-password -refreshToken');

        if (!user) {
            throw new Error('Shopkeeper not found');
        }

        return user.toObject() as Omit<IUser, 'password' | 'refreshToken'>;
    }

    async toggleShopkeeperStatus(id: string): Promise<Omit<IUser, 'password' | 'refreshToken'>> {
        const user = await User.findOne({ _id: id, role: 'shopkeeper' });

        if (!user) {
            throw new Error('Shopkeeper not found');
        }

        user.isActive = !user.isActive;
        if (!user.isActive) {
            user.refreshToken = undefined; // Invalidate sessions on deactivation
        }
        await user.save();

        const userResponse = user.toObject();
        delete (userResponse as any).password;
        delete (userResponse as any).refreshToken;

        return userResponse as Omit<IUser, 'password' | 'refreshToken'>;
    }

    async deleteShopkeeper(id: string): Promise<void> {
        const result = await User.deleteOne({ _id: id, role: 'shopkeeper' });

        if (result.deletedCount === 0) {
            throw new Error('Shopkeeper not found');
        }
    }

    async getShopkeeperStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
    }> {
        const [total, active] = await Promise.all([
            User.countDocuments({ role: 'shopkeeper' }),
            User.countDocuments({ role: 'shopkeeper', isActive: true }),
        ]);

        return {
            total,
            active,
            inactive: total - active,
        };
    }

    async getShopkeeperStorageStats(shopkeeperId: string) {
        const shopkeeperObjectId = new mongoose.Types.ObjectId(shopkeeperId);

        const [
            customerStats,
            wholesalerStats,
            billStats,
            paymentStats,
            transactionStats,
            invoiceStats,
            userStats,
            revenueStats,
            invoiceRevenueStats
        ] = await Promise.all([
            // Customers
            Customer.aggregate([
                { $match: { shopkeeperId: shopkeeperObjectId } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        due: { $sum: { $cond: [{ $eq: ['$type', 'due'] }, 1, 0] } },
                        normal: { $sum: { $cond: [{ $eq: ['$type', 'normal'] }, 1, 0] } },
                        size: { $sum: { $bsonSize: '$$ROOT' } }
                    }
                }
            ]),
            // Wholesalers
            Wholesaler.aggregate([
                { $match: { shopkeeperId: shopkeeperObjectId, isDeleted: false } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        size: { $sum: { $bsonSize: '$$ROOT' } }
                    }
                }
            ]),
            // Bills
            Bill.aggregate([
                { $match: { shopkeeperId: shopkeeperObjectId } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        purchase: { $sum: { $cond: [{ $eq: ['$billType', 'purchase'] }, 1, 0] } },
                        sale: { $sum: { $cond: [{ $eq: ['$billType', 'sale'] }, 1, 0] } },
                        size: { $sum: { $bsonSize: '$$ROOT' } }
                    }
                }
            ]),
            // Payments
            Payment.aggregate([
                { $match: { shopkeeperId: shopkeeperObjectId } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        toCustomers: { $sum: { $cond: [{ $eq: ['$entityType', 'customer'] }, 1, 0] } },
                        toWholesalers: { $sum: { $cond: [{ $eq: ['$entityType', 'wholesaler'] }, 1, 0] } },
                        size: { $sum: { $bsonSize: '$$ROOT' } }
                    }
                }
            ]),
            // Transactions
            Transaction.aggregate([
                { $match: { shopkeeperId: shopkeeperObjectId } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, 1, 0] } },
                        expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, 1, 0] } },
                        size: { $sum: { $bsonSize: '$$ROOT' } }
                    }
                }
            ]),
            // Invoices
            Invoice.aggregate([
                { $match: { shopkeeperId: shopkeeperObjectId, isDeleted: false } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
                        sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
                        paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
                        size: { $sum: { $bsonSize: '$$ROOT' } }
                    }
                }
            ]),
            // User (Shopkeeper account)
            User.aggregate([
                { $match: { _id: shopkeeperObjectId } },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        size: { $sum: { $bsonSize: '$$ROOT' } }
                    }
                }
            ]),
            // Revenue Stats
            Bill.aggregate([
                { $match: { shopkeeperId: shopkeeperObjectId } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: { $cond: [{ $eq: ['$billType', 'sale'] }, '$totalAmount', 0] } },
                        totalExpenses: { $sum: { $cond: [{ $eq: ['$billType', 'purchase'] }, '$totalAmount', 0] } }
                    }
                }
            ]),
            // Invoice Revenue
            Invoice.aggregate([
                { $match: { shopkeeperId: shopkeeperObjectId, status: { $ne: 'cancelled' } } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ])
        ]);

        const c = customerStats[0] || { total: 0, due: 0, normal: 0, size: 0 };
        const w = wholesalerStats[0] || { total: 0, size: 0 };
        const b = billStats[0] || { total: 0, purchase: 0, sale: 0, size: 0 };
        const p = paymentStats[0] || { total: 0, toCustomers: 0, toWholesalers: 0, size: 0 };
        const t = transactionStats[0] || { total: 0, income: 0, expense: 0, size: 0 };
        const i = invoiceStats[0] || { total: 0, draft: 0, sent: 0, paid: 0, size: 0 };
        const u = userStats[0] || { count: 0, size: 0 };
        const r = revenueStats[0] || { totalRevenue: 0, totalExpenses: 0 };
        const ir = invoiceRevenueStats[0]?.total || 0;
        const totalBytes = c.size + w.size + b.size + p.size + t.size + i.size + u.size;

        // Convert to human-readable format
        const formatBytes = (bytes: number): string => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const idx = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, idx)).toFixed(2)) + ' ' + sizes[idx];
        };

        return {
            shopkeeperId,
            storage: {
                totalBytes,
                formatted: formatBytes(totalBytes),
            },
            users: {
                shopkeeperAccount: u.count,
                estimatedBytes: u.size,
            },
            customers: {
                total: c.total,
                due: c.due,
                normal: c.normal,
                size: c.size
            },
            wholesalers: {
                total: w.total,
                size: w.size
            },
            bills: {
                total: b.total,
                purchase: b.purchase,
                sale: b.sale,
                size: b.size
            },
            payments: {
                total: p.total,
                toCustomers: p.toCustomers,
                toWholesalers: p.toWholesalers,
                size: p.size
            },
            transactions: {
                total: t.total,
                income: t.income,
                expense: t.expense,
                size: t.size
            },
            invoices: {
                total: i.total,
                draft: i.draft,
                sent: i.sent,
                paid: i.paid,
                size: i.size
            },
            revenue: {
                total: r.totalRevenue + ir,
                expenses: r.totalExpenses,
                profit: (r.totalRevenue + ir) - r.totalExpenses,
            },
        };
    }

    async getAllShopkeepersWithStorage(page: number, limit: number) {
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find({ role: 'shopkeeper' })
                .select('-password -refreshToken')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments({ role: 'shopkeeper' }),
        ]);

        // Get storage stats for all shopkeepers in parallel
        const usersWithStorage = await Promise.all(
            users.map(async (user) => {
                const storageStats = await this.getShopkeeperStorageStats(user._id.toString());
                return {
                    ...user.toObject(),
                    storageStats,
                };
            })
        );

        return {
            users: usersWithStorage,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get total storage statistics for all shopkeepers combined
     */
    async getTotalStorageStats() {
        const shopkeepers = await User.find({ role: 'shopkeeper' }).select('_id');

        let totalStorage = 0;
        let totalUsers = shopkeepers.length;
        let totalUsersSize = 0;
        let totalCustomers = 0;
        let totalCustomersSize = 0;
        let totalWholesalers = 0;
        let totalWholesalersSize = 0;
        let totalBills = 0;
        let totalBillsSize = 0;
        let totalPayments = 0;
        let totalPaymentsSize = 0;
        let totalTransactions = 0;
        let totalTransactionsSize = 0;
        let totalInvoices = 0;
        let totalInvoicesSize = 0;
        let totalRevenue = 0;
        let totalExpenses = 0;

        // Calculate totals across all shopkeepers
        for (const shopkeeper of shopkeepers) {
            const stats = await this.getShopkeeperStorageStats(shopkeeper._id.toString());
            totalStorage += stats.storage.totalBytes;
            totalUsersSize += stats.users.estimatedBytes;
            totalCustomers += stats.customers.total;
            totalCustomersSize += stats.customers.size;
            totalWholesalers += stats.wholesalers.total;
            totalWholesalersSize += stats.wholesalers.size;
            totalBills += stats.bills.total;
            totalBillsSize += stats.bills.size;
            totalPayments += stats.payments.total;
            totalPaymentsSize += stats.payments.size;
            totalTransactions += stats.transactions.total;
            totalTransactionsSize += stats.transactions.size;
            totalInvoices += stats.invoices.total;
            totalInvoicesSize += stats.invoices.size;
            totalRevenue += stats.revenue.total;
            totalExpenses += stats.revenue.expenses;
        }

        const formatBytes = (bytes: number): string => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        return {
            totalShopkeepers: shopkeepers.length,
            storage: {
                totalBytes: totalStorage,
                formatted: formatBytes(totalStorage),
                breakdown: {
                    users: {
                        count: totalUsers,
                        bytes: totalUsersSize,
                        formatted: formatBytes(totalUsersSize),
                        percentage: totalStorage > 0 ? (totalUsersSize / totalStorage * 100).toFixed(2) : '0'
                    },
                    customers: {
                        count: totalCustomers,
                        bytes: totalCustomersSize,
                        formatted: formatBytes(totalCustomersSize),
                        percentage: totalStorage > 0 ? (totalCustomersSize / totalStorage * 100).toFixed(2) : '0'
                    },
                    wholesalers: {
                        count: totalWholesalers,
                        bytes: totalWholesalersSize,
                        formatted: formatBytes(totalWholesalersSize),
                        percentage: totalStorage > 0 ? (totalWholesalersSize / totalStorage * 100).toFixed(2) : '0'
                    },
                    bills: {
                        count: totalBills,
                        bytes: totalBillsSize,
                        formatted: formatBytes(totalBillsSize),
                        percentage: totalStorage > 0 ? (totalBillsSize / totalStorage * 100).toFixed(2) : '0'
                    },
                    payments: {
                        count: totalPayments,
                        bytes: totalPaymentsSize,
                        formatted: formatBytes(totalPaymentsSize),
                        percentage: totalStorage > 0 ? (totalPaymentsSize / totalStorage * 100).toFixed(2) : '0'
                    },
                    transactions: {
                        count: totalTransactions,
                        bytes: totalTransactionsSize,
                        formatted: formatBytes(totalTransactionsSize),
                        percentage: totalStorage > 0 ? (totalTransactionsSize / totalStorage * 100).toFixed(2) : '0'
                    },
                    invoices: {
                        count: totalInvoices,
                        bytes: totalInvoicesSize,
                        formatted: formatBytes(totalInvoicesSize),
                        percentage: totalStorage > 0 ? (totalInvoicesSize / totalStorage * 100).toFixed(2) : '0'
                    }
                }
            },
            aggregates: {
                users: totalUsers,
                customers: totalCustomers,
                wholesalers: totalWholesalers,
                bills: totalBills,
                payments: totalPayments,
                transactions: totalTransactions,
                invoices: totalInvoices,
                revenue: totalRevenue,
                expenses: totalExpenses,
                profit: totalRevenue - totalExpenses
            }
        };
    }

    /**
     * Get detailed storage breakdown for a specific shopkeeper
     */
    async getDetailedStorageStats(shopkeeperId: string) {
        const stats = await this.getShopkeeperStorageStats(shopkeeperId);

        const formatBytes = (bytes: number): string => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const totalBytes = stats.storage.totalBytes;

        return {
            ...stats,
            breakdown: {
                users: {
                    shopkeeperAccount: stats.users.shopkeeperAccount,
                    estimatedBytes: stats.users.estimatedBytes,
                    formatted: formatBytes(stats.users.estimatedBytes),
                    percentage: totalBytes > 0 ? ((stats.users.estimatedBytes) / totalBytes * 100).toFixed(2) : '0',
                    avgSizePerItem: stats.users.estimatedBytes / (stats.users.shopkeeperAccount || 1)
                },
                customers: {
                    total: stats.customers.total,
                    due: stats.customers.due,
                    normal: stats.customers.normal,
                    estimatedBytes: stats.customers.size,
                    formatted: formatBytes(stats.customers.size),
                    percentage: totalBytes > 0 ? ((stats.customers.size) / totalBytes * 100).toFixed(2) : '0',
                    avgSizePerItem: stats.customers.size / (stats.customers.total || 1)
                },
                wholesalers: {
                    total: stats.wholesalers.total,
                    estimatedBytes: stats.wholesalers.size,
                    formatted: formatBytes(stats.wholesalers.size),
                    percentage: totalBytes > 0 ? ((stats.wholesalers.size) / totalBytes * 100).toFixed(2) : '0',
                    avgSizePerItem: stats.wholesalers.size / (stats.wholesalers.total || 1)
                },
                bills: {
                    total: stats.bills.total,
                    purchase: stats.bills.purchase,
                    sale: stats.bills.sale,
                    estimatedBytes: stats.bills.size,
                    formatted: formatBytes(stats.bills.size),
                    percentage: totalBytes > 0 ? ((stats.bills.size) / totalBytes * 100).toFixed(2) : '0',
                    avgSizePerItem: stats.bills.size / (stats.bills.total || 1)
                },
                payments: {
                    total: stats.payments.total,
                    toCustomers: stats.payments.toCustomers,
                    toWholesalers: stats.payments.toWholesalers,
                    estimatedBytes: stats.payments.size,
                    formatted: formatBytes(stats.payments.size),
                    percentage: totalBytes > 0 ? ((stats.payments.size) / totalBytes * 100).toFixed(2) : '0',
                    avgSizePerItem: stats.payments.size / (stats.payments.total || 1)
                },
                transactions: {
                    total: stats.transactions.total,
                    income: stats.transactions.income,
                    expense: stats.transactions.expense,
                    estimatedBytes: stats.transactions.size,
                    formatted: formatBytes(stats.transactions.size),
                    percentage: totalBytes > 0 ? ((stats.transactions.size) / totalBytes * 100).toFixed(2) : '0',
                    avgSizePerItem: stats.transactions.size / (stats.transactions.total || 1)
                },
                invoices: {
                    total: stats.invoices.total,
                    draft: stats.invoices.draft,
                    sent: stats.invoices.sent,
                    paid: stats.invoices.paid,
                    estimatedBytes: stats.invoices.size,
                    formatted: formatBytes(stats.invoices.size),
                    percentage: totalBytes > 0 ? ((stats.invoices.size) / totalBytes * 100).toFixed(2) : '0',
                    avgSizePerItem: stats.invoices.size / (stats.invoices.total || 1)
                }
            },
            limits: {
                used: totalBytes,
                usedFormatted: stats.storage.formatted,
                limit: 100 * 1024 * 1024, // 100 MB default limit
                limitFormatted: '100 MB',
                percentage: ((totalBytes / (100 * 1024 * 1024)) * 100).toFixed(2),
                remaining: (100 * 1024 * 1024) - totalBytes,
                remainingFormatted: formatBytes((100 * 1024 * 1024) - totalBytes)
            }
        };
    }

    /**
     * Get storage comparison across all shopkeepers
     */
    async getStorageComparison() {
        const shopkeepers = await User.find({ role: 'shopkeeper' })
            .select('_id name email businessName')
            .sort({ createdAt: -1 });

        const comparisons = await Promise.all(
            shopkeepers.map(async (shopkeeper) => {
                const stats = await this.getShopkeeperStorageStats(shopkeeper._id.toString());
                return {
                    shopkeeperId: shopkeeper._id,
                    name: shopkeeper.name,
                    email: shopkeeper.email,
                    businessName: shopkeeper.businessName,
                    storage: stats.storage,
                    counts: {
                        customers: stats.customers.total,
                        wholesalers: stats.wholesalers.total,
                        bills: stats.bills.total,
                        payments: stats.payments.total,
                        transactions: stats.transactions.total,
                        invoices: stats.invoices.total
                    }
                };
            })
        );

        // Sort by storage usage (highest first)
        comparisons.sort((a, b) => b.storage.totalBytes - a.storage.totalBytes);

        return {
            shopkeepers: comparisons,
            summary: {
                totalShopkeepers: comparisons.length,
                highestUsage: comparisons[0]?.storage.formatted || '0 Bytes',
                lowestUsage: comparisons[comparisons.length - 1]?.storage.formatted || '0 Bytes',
                averageUsage: comparisons.length > 0
                    ? this.formatBytes(comparisons.reduce((sum, s) => sum + s.storage.totalBytes, 0) / comparisons.length)
                    : '0 Bytes'
            }
        };
    }


    async getInvoicePreferences(userId: string): Promise<InvoicePreferences> {
        const user = await User.findById(userId).select('invoicePreferences');

        if (!user) {
            throw new Error('User not found');
        }

        const preferences = user.invoicePreferences || {
            signatureEnabled: false,
            signature: '',
            signatureName: '',
            notesEnabled: false,
            notes: '',
            termsEnabled: false,
            terms: '',
        };

        return preferences;
    }

    async updateInvoicePreferences(userId: string, preferences: Partial<InvoicePreferences>): Promise<InvoicePreferences> {
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { invoicePreferences: preferences } },
            { new: true }
        ).select('invoicePreferences');

        if (!user) {
            throw new Error('User not found');
        }

        return user.invoicePreferences || {
            signatureEnabled: false,
            signature: '',
            signatureName: '',
            notesEnabled: false,
            notes: '',
            termsEnabled: false,
            terms: '',
        };
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

export const userService = new UserService();
