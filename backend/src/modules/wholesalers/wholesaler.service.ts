import { Wholesaler } from './wholesaler.model';
import { CreateWholesalerInput, UpdateWholesalerInput } from './wholesaler.validation';

export class WholesalerService {
    async create(shopkeeperId: string, input: CreateWholesalerInput): Promise<any> {
        const { initialPurchased, openingPurchases, openingPayments, ...wholesalerData } = input;

        // Support both old and new formats
        let finalOpeningPurchases = 0;
        let finalOpeningPayments = 0;

        if (openingPurchases !== undefined || openingPayments !== undefined) {
            // New format: Use the explicit opening purchases and payments
            finalOpeningPurchases = openingPurchases || 0;
            finalOpeningPayments = openingPayments || 0;
        } else if (initialPurchased !== undefined && initialPurchased !== 0) {
            // Old format: Convert initialPurchased to the new format
            if (initialPurchased > 0) {
                // Positive: They delivered goods worth this amount (we owe them)
                finalOpeningPurchases = initialPurchased;
                finalOpeningPayments = 0;
            } else {
                // Negative: We paid advance (they owe us goods)
                finalOpeningPurchases = 0;
                finalOpeningPayments = Math.abs(initialPurchased);
            }
        }

        // Calculate opening balance: purchases - payments
        // Positive = we owe them, Negative = they owe us
        const openingBalance = finalOpeningPurchases - finalOpeningPayments;

        const wholesaler = new Wholesaler({
            ...wholesalerData,
            shopkeeperId,
            initialPurchased: initialPurchased || 0, // Keep for backward compatibility
            openingPurchases: finalOpeningPurchases,
            openingPayments: finalOpeningPayments,
            totalPurchased: finalOpeningPurchases,
            totalPaid: finalOpeningPayments,
            outstandingDue: openingBalance,
        });

        try {
            await wholesaler.save();
            return wholesaler.toObject();
        } catch (error: any) {
            // Handle duplicate key errors
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern || {})[1]; // Second key is phone/whatsappNumber
                if (field === 'phone') {
                    throw new Error('Phone number already exists for another wholesaler');
                } else if (field === 'whatsappNumber') {
                    throw new Error('WhatsApp number already exists for another wholesaler');
                }
            }
            throw error;
        }
    }

    async getAll(
        shopkeeperId: string,
        page: number,
        limit: number,
        search?: string,
        includeDeleted?: boolean,
        status?: 'all' | 'active' | 'inactive',
        duesFilter?: 'all' | 'with_dues' | 'clear',
        sortBy?: 'name' | 'purchases' | 'outstanding' | 'createdAt'
    ): Promise<{ wholesalers: any[]; total: number; totalPages: number }> {
        const skip = (page - 1) * limit;
        const query: any = { shopkeeperId };

        // Exclude deleted by default
        if (!includeDeleted) {
            query.isDeleted = { $ne: true };
        }

        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
            ];
        }

        // Status filter
        if (status && status !== 'all') {
            query.isActive = status === 'active';
        }

        // Dues filter
        if (duesFilter && duesFilter !== 'all') {
            if (duesFilter === 'with_dues') {
                query.outstandingDue = { $gt: 0 };
            } else if (duesFilter === 'clear') {
                query.outstandingDue = { $lte: 0 };
            }
        }

        // Determine sort option
        let sortOption: any = { createdAt: -1 }; // default
        if (sortBy === 'name') {
            sortOption = { name: 1 };
        } else if (sortBy === 'purchases') {
            sortOption = { totalPurchased: -1 };
        } else if (sortBy === 'outstanding') {
            sortOption = { outstandingDue: -1 };
        }

        const [wholesalers, total] = await Promise.all([
            Wholesaler.find(query).sort(sortOption).skip(skip).limit(limit),
            Wholesaler.countDocuments(query),
        ]);

        return {
            wholesalers: wholesalers.map(w => w.toObject()),
            total,
            totalPages: Math.ceil(total / limit),
        };
    }


    async getById(shopkeeperId: string, id: string): Promise<any> {
        const wholesaler = await Wholesaler.findOne({ _id: id, shopkeeperId });
        if (!wholesaler) {
            throw new Error('Wholesaler not found');
        }
        return wholesaler.toObject();
    }

    async update(shopkeeperId: string, id: string, input: UpdateWholesalerInput): Promise<any> {
        try {
            const wholesaler = await Wholesaler.findOne({ _id: id, shopkeeperId });
            if (!wholesaler) {
                throw new Error('Wholesaler not found');
            }

            const { openingPurchases, openingPayments, initialPurchased, ...otherData } = input;

            // Check if opening balances are being updated
            let needsRecalculation = false;
            let updatedOpeningPurchases = wholesaler.openingPurchases;
            let updatedOpeningPayments = wholesaler.openingPayments;

            // Handle DEPRECATED initialPurchased if provided but openingPurchases/Payments are not
            if (initialPurchased !== undefined && openingPurchases === undefined && openingPayments === undefined) {
                if (initialPurchased > 0) {
                    updatedOpeningPurchases = initialPurchased;
                    updatedOpeningPayments = 0;
                } else if (initialPurchased < 0) {
                    updatedOpeningPurchases = 0;
                    updatedOpeningPayments = Math.abs(initialPurchased);
                } else {
                    updatedOpeningPurchases = 0;
                    updatedOpeningPayments = 0;
                }
                needsRecalculation = true;
            } else {
                if (openingPurchases !== undefined && openingPurchases !== wholesaler.openingPurchases) {
                    updatedOpeningPurchases = openingPurchases;
                    needsRecalculation = true;
                }

                if (openingPayments !== undefined && openingPayments !== wholesaler.openingPayments) {
                    updatedOpeningPayments = openingPayments;
                    needsRecalculation = true;
                }
            }

            if (needsRecalculation) {
                // Adjust totals by the difference in opening balances
                const purchaseDiff = updatedOpeningPurchases - wholesaler.openingPurchases;
                const paymentDiff = updatedOpeningPayments - wholesaler.openingPayments;

                wholesaler.openingPurchases = updatedOpeningPurchases;
                wholesaler.openingPayments = updatedOpeningPayments;
                wholesaler.totalPurchased += purchaseDiff;
                wholesaler.totalPaid += paymentDiff;
                wholesaler.outstandingDue = wholesaler.totalPurchased - wholesaler.totalPaid;
            }

            // Apply other updates
            Object.assign(wholesaler, otherData);

            await wholesaler.save();
            return wholesaler.toObject();
        } catch (error: any) {
            // Handle duplicate key errors
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern || {})[1];
                if (field === 'phone') {
                    throw new Error('Phone number already exists for another wholesaler');
                } else if (field === 'whatsappNumber') {
                    throw new Error('WhatsApp number already exists for another wholesaler');
                }
            }
            throw error;
        }
    }

    async delete(shopkeeperId: string, id: string): Promise<void> {
        const wholesaler = await Wholesaler.findOneAndUpdate(
            { _id: id, shopkeeperId },
            {
                $set: {
                    isDeleted: true,
                    isActive: false,
                    deletedAt: new Date()
                }
            },
            { new: true }
        );
        if (!wholesaler) {
            throw new Error('Wholesaler not found');
        }
    }

    async restore(shopkeeperId: string, id: string): Promise<any> {
        const wholesaler = await Wholesaler.findOneAndUpdate(
            { _id: id, shopkeeperId, isDeleted: true },
            {
                $set: {
                    isDeleted: false,
                    isActive: true
                },
                $unset: { deletedAt: 1 }
            },
            { new: true }
        );
        if (!wholesaler) {
            throw new Error('Wholesaler not found or not deleted');
        }
        return wholesaler.toObject();
    }

    async getStats(shopkeeperId: string): Promise<{
        total: number;
        active: number;
        inactive: number;
        deleted: number;
        withDues: number;
        totalOutstanding: number;
    }> {
        const [total, active, inactive, deleted, withDues, outstandingResult] = await Promise.all([
            Wholesaler.countDocuments({ shopkeeperId, isDeleted: { $ne: true } }),
            Wholesaler.countDocuments({ shopkeeperId, isActive: true, isDeleted: { $ne: true } }),
            Wholesaler.countDocuments({ shopkeeperId, isActive: false, isDeleted: { $ne: true } }),
            Wholesaler.countDocuments({ shopkeeperId, isDeleted: true }),
            Wholesaler.countDocuments({ shopkeeperId, outstandingDue: { $gt: 0 }, isDeleted: { $ne: true } }),
            Wholesaler.aggregate([
                { $match: { shopkeeperId, isDeleted: { $ne: true } } },
                { $group: { _id: null, total: { $sum: '$outstandingDue' } } }
            ])
        ]);

        return {
            total,
            active,
            inactive,
            deleted,
            withDues,
            totalOutstanding: outstandingResult[0]?.total || 0,
        };
    }

    async getDashboardStats(shopkeeperId: string): Promise<{
        totalWholesalers: number;
        totalPurchased: number;
        totalPaid: number;
        totalOutstanding: number;
    }> {
        const result = await Wholesaler.aggregate([
            { $match: { shopkeeperId: shopkeeperId } },
            {
                $group: {
                    _id: null,
                    totalWholesalers: { $sum: 1 },
                    totalPurchased: { $sum: '$totalPurchased' },
                    totalPaid: { $sum: '$totalPaid' },
                    totalOutstanding: { $sum: '$outstandingDue' },
                },
            },
        ]);

        return result[0] || {
            totalWholesalers: 0,
            totalPurchased: 0,
            totalPaid: 0,
            totalOutstanding: 0,
        };
    }

    async updateBalance(
        shopkeeperId: string,
        id: string,
        purchaseAmount: number,
        paidAmount: number
    ): Promise<void> {
        await Wholesaler.findOneAndUpdate(
            { _id: id, shopkeeperId },
            {
                $inc: {
                    totalPurchased: purchaseAmount,
                    totalPaid: paidAmount,
                    outstandingDue: purchaseAmount - paidAmount,
                },
            }
        );
    }

    async recordPayment(shopkeeperId: string, id: string, amount: number): Promise<void> {
        const wholesaler = await Wholesaler.findOne({ _id: id, shopkeeperId });
        if (!wholesaler) {
            throw new Error('Wholesaler not found');
        }

        await Wholesaler.findOneAndUpdate(
            { _id: id, shopkeeperId },
            {
                $inc: {
                    totalPaid: amount,
                    outstandingDue: -amount,
                },
            }
        );
    }
}

export const wholesalerService = new WholesalerService();

