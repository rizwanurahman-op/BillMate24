import { User } from './user.model';
import { hashPassword } from '../../utils/auth';
import { CreateShopkeeperInput, UpdateShopkeeperInput, UpdateFeaturesInput } from './user.validation';
import { IUser, Features } from '../../types';
import { Bill } from '../bills/bill.model';
import { Customer } from '../customers/customer.model';
import { Wholesaler } from '../wholesalers/wholesaler.model';
import { Payment } from '../payments/payment.model';
import { Transaction } from '../dashboard/transaction.model';
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
            totalCustomers,
            dueCustomers,
            normalCustomers,
            totalWholesalers,
            totalBills,
            purchaseBills,
            saleBills,
            totalPayments,
            customerPayments,
            wholesalerPayments,
            totalTransactions,
            incomeTransactions,
            expenseTransactions,
            totalRevenue,
            totalExpenses,
        ] = await Promise.all([
            Customer.countDocuments({ shopkeeperId: shopkeeperObjectId }),
            Customer.countDocuments({ shopkeeperId: shopkeeperObjectId, type: 'due' }),
            Customer.countDocuments({ shopkeeperId: shopkeeperObjectId, type: 'normal' }),
            Wholesaler.countDocuments({ shopkeeperId: shopkeeperObjectId, isDeleted: false }),
            Bill.countDocuments({ shopkeeperId: shopkeeperObjectId }),
            Bill.countDocuments({ shopkeeperId: shopkeeperObjectId, billType: 'purchase' }),
            Bill.countDocuments({ shopkeeperId: shopkeeperObjectId, billType: 'sale' }),
            Payment.countDocuments({ shopkeeperId: shopkeeperObjectId }),
            Payment.countDocuments({ shopkeeperId: shopkeeperObjectId, entityType: 'customer' }),
            Payment.countDocuments({ shopkeeperId: shopkeeperObjectId, entityType: 'wholesaler' }),
            Transaction.countDocuments({ shopkeeperId: shopkeeperObjectId }),
            Transaction.countDocuments({ shopkeeperId: shopkeeperObjectId, type: 'income' }),
            Transaction.countDocuments({ shopkeeperId: shopkeeperObjectId, type: 'expense' }),
            Bill.aggregate([
                { $match: { shopkeeperId: shopkeeperObjectId, billType: 'sale' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            Bill.aggregate([
                { $match: { shopkeeperId: shopkeeperObjectId, billType: 'purchase' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
        ]);

        // Estimate storage size (approximate calculation)
        // Average document sizes in MongoDB:
        // - User/Shopkeeper: ~300 bytes (basic profile data)
        // - Customer: ~500 bytes
        // - Wholesaler: ~500 bytes
        // - Bill: ~1KB (1024 bytes) due to items array
        // - Payment: ~400 bytes
        // - Transaction: ~350 bytes
        const estimatedStorageBytes =
            300 + // Shopkeeper account itself
            (totalCustomers * 500) +
            (totalWholesalers * 500) +
            (totalBills * 1024) +
            (totalPayments * 400) +
            (totalTransactions * 350);

        // Convert to human-readable format
        const formatBytes = (bytes: number): string => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        return {
            shopkeeperId,
            storage: {
                totalBytes: estimatedStorageBytes,
                formatted: formatBytes(estimatedStorageBytes),
            },
            users: {
                shopkeeperAccount: 1,
                estimatedBytes: 300,
            },
            customers: {
                total: totalCustomers,
                due: dueCustomers,
                normal: normalCustomers,
            },
            wholesalers: {
                total: totalWholesalers,
            },
            bills: {
                total: totalBills,
                purchase: purchaseBills,
                sale: saleBills,
            },
            payments: {
                total: totalPayments,
                toCustomers: customerPayments,
                toWholesalers: wholesalerPayments,
            },
            transactions: {
                total: totalTransactions,
                income: incomeTransactions,
                expense: expenseTransactions,
            },
            revenue: {
                total: totalRevenue[0]?.total || 0,
                expenses: totalExpenses[0]?.total || 0,
                profit: (totalRevenue[0]?.total || 0) - (totalExpenses[0]?.total || 0),
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
        let totalCustomers = 0;
        let totalWholesalers = 0;
        let totalBills = 0;
        let totalPayments = 0;
        let totalTransactions = 0;
        let totalRevenue = 0;
        let totalExpenses = 0;

        // Calculate totals across all shopkeepers
        for (const shopkeeper of shopkeepers) {
            const stats = await this.getShopkeeperStorageStats(shopkeeper._id.toString());
            totalStorage += stats.storage.totalBytes;
            totalCustomers += stats.customers.total;
            totalWholesalers += stats.wholesalers.total;
            totalBills += stats.bills.total;
            totalPayments += stats.payments.total;
            totalTransactions += stats.transactions.total;
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
                        bytes: totalUsers * 300,
                        formatted: formatBytes(totalUsers * 300),
                        percentage: totalStorage > 0 ? ((totalUsers * 300) / totalStorage * 100).toFixed(2) : '0'
                    },
                    customers: {
                        count: totalCustomers,
                        bytes: totalCustomers * 500,
                        formatted: formatBytes(totalCustomers * 500),
                        percentage: totalStorage > 0 ? ((totalCustomers * 500) / totalStorage * 100).toFixed(2) : '0'
                    },
                    wholesalers: {
                        count: totalWholesalers,
                        bytes: totalWholesalers * 500,
                        formatted: formatBytes(totalWholesalers * 500),
                        percentage: totalStorage > 0 ? ((totalWholesalers * 500) / totalStorage * 100).toFixed(2) : '0'
                    },
                    bills: {
                        count: totalBills,
                        bytes: totalBills * 1024,
                        formatted: formatBytes(totalBills * 1024),
                        percentage: totalStorage > 0 ? ((totalBills * 1024) / totalStorage * 100).toFixed(2) : '0'
                    },
                    payments: {
                        count: totalPayments,
                        bytes: totalPayments * 400,
                        formatted: formatBytes(totalPayments * 400),
                        percentage: totalStorage > 0 ? ((totalPayments * 400) / totalStorage * 100).toFixed(2) : '0'
                    },
                    transactions: {
                        count: totalTransactions,
                        bytes: totalTransactions * 350,
                        formatted: formatBytes(totalTransactions * 350),
                        percentage: totalStorage > 0 ? ((totalTransactions * 350) / totalStorage * 100).toFixed(2) : '0'
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
                    avgSizePerItem: 300
                },
                customers: {
                    total: stats.customers.total,
                    due: stats.customers.due,
                    normal: stats.customers.normal,
                    estimatedBytes: stats.customers.total * 500,
                    formatted: formatBytes(stats.customers.total * 500),
                    percentage: totalBytes > 0 ? ((stats.customers.total * 500) / totalBytes * 100).toFixed(2) : '0',
                    avgSizePerItem: 500
                },
                wholesalers: {
                    total: stats.wholesalers.total,
                    estimatedBytes: stats.wholesalers.total * 500,
                    formatted: formatBytes(stats.wholesalers.total * 500),
                    percentage: totalBytes > 0 ? ((stats.wholesalers.total * 500) / totalBytes * 100).toFixed(2) : '0',
                    avgSizePerItem: 500
                },
                bills: {
                    total: stats.bills.total,
                    purchase: stats.bills.purchase,
                    sale: stats.bills.sale,
                    estimatedBytes: stats.bills.total * 1024,
                    formatted: formatBytes(stats.bills.total * 1024),
                    percentage: totalBytes > 0 ? ((stats.bills.total * 1024) / totalBytes * 100).toFixed(2) : '0',
                    avgSizePerItem: 1024
                },
                payments: {
                    total: stats.payments.total,
                    toCustomers: stats.payments.toCustomers,
                    toWholesalers: stats.payments.toWholesalers,
                    estimatedBytes: stats.payments.total * 400,
                    formatted: formatBytes(stats.payments.total * 400),
                    percentage: totalBytes > 0 ? ((stats.payments.total * 400) / totalBytes * 100).toFixed(2) : '0',
                    avgSizePerItem: 400
                },
                transactions: {
                    total: stats.transactions.total,
                    income: stats.transactions.income,
                    expense: stats.transactions.expense,
                    estimatedBytes: stats.transactions.total * 350,
                    formatted: formatBytes(stats.transactions.total * 350),
                    percentage: totalBytes > 0 ? ((stats.transactions.total * 350) / totalBytes * 100).toFixed(2) : '0',
                    avgSizePerItem: 350
                }
            },
            limits: {
                used: totalBytes,
                usedFormatted: stats.storage.formatted,
                // You can set limits per shopkeeper here if needed
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
                        transactions: stats.transactions.total
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

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

export const userService = new UserService();
