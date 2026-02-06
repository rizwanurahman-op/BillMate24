import { Customer } from './customer.model';
import { CreateCustomerInput, UpdateCustomerInput } from './customer.validation';

type CustomerType = 'due' | 'normal';

export class CustomerService {
    async create(shopkeeperId: string, input: CreateCustomerInput): Promise<any> {
        const { initialSales, openingSales, openingPayments, ...customerData } = input;

        // Determine opening balances
        let finalOpeningSales = 0;
        let finalOpeningPayments = 0;

        // Priority 1: Use openingSales and openingPayments if provided (new dual-mode system)
        if (openingSales !== undefined || openingPayments !== undefined) {
            finalOpeningSales = openingSales || 0;
            finalOpeningPayments = openingPayments || 0;
        }
        // Priority 2: Use initialSales if provided (backward compatibility)
        else if (initialSales !== undefined) {
            // If initialSales > 0: Customer owes money (Past Sales)
            // If initialSales < 0: Customer paid in advance (Advance Payment)
            if (initialSales > 0) {
                finalOpeningSales = initialSales;
                finalOpeningPayments = 0;
            } else if (initialSales < 0) {
                finalOpeningSales = 0;
                finalOpeningPayments = Math.abs(initialSales);
            }
        }

        const customer = new Customer({
            ...customerData,
            shopkeeperId,
            openingSales: finalOpeningSales,
            openingPayments: finalOpeningPayments,
            totalSales: finalOpeningSales,
            totalPaid: finalOpeningPayments,
            outstandingDue: finalOpeningSales - finalOpeningPayments,
        });

        try {
            await customer.save();
            return customer.toObject();
        } catch (error: any) {
            // Handle duplicate key errors
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern || {})[1]; // Second key is phone/whatsappNumber
                if (field === 'phone') {
                    throw new Error('Phone number already exists for another customer');
                } else if (field === 'whatsappNumber') {
                    throw new Error('WhatsApp number already exists for another customer');
                }
            }
            throw error;
        }
    }

    async getAll(
        shopkeeperId: string,
        customerType: CustomerType | undefined,
        page: number,
        limit: number,
        search?: string,
        includeDeleted?: boolean,
        status?: string,
        duesFilter?: string,
        sortBy?: string
    ): Promise<{ customers: any[]; total: number; totalPages: number }> {
        const skip = (page - 1) * limit;
        const query: any = { shopkeeperId };

        if (!includeDeleted) {
            query.isDeleted = { $ne: true };
        } else {
            // If includeDeleted is true, we might want to only show deleted ones or all.
            // Let's stick to the same logic as wholesalers: if status is 'deleted', we handle it below.
        }

        // Filter by customer type
        if (customerType) {
            query.type = customerType;
        }

        // Search filter - include name, phone, and address
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
            ];
        }

        // Status filter
        if (status === 'active') {
            query.isActive = { $ne: false };
            query.isDeleted = { $ne: true };
        } else if (status === 'inactive') {
            query.isActive = false;
            query.isDeleted = { $ne: true };
        } else if (status === 'deleted') {
            query.isDeleted = true;
        }

        // Dues filter
        if (duesFilter === 'with_dues') {
            query.outstandingDue = { $gt: 0 };
        } else if (duesFilter === 'clear') {
            query.outstandingDue = { $lte: 0 };
        }

        // Sorting
        let sort: any = { createdAt: -1 }; // default
        switch (sortBy) {
            case 'name':
                sort = { name: 1 };
                break;
            case 'totalSales':
                sort = { totalSales: -1 };
                break;
            case 'outstandingDue':
                sort = { outstandingDue: -1 };
                break;
            case 'createdAt':
            default:
                sort = { createdAt: -1 };
                break;
        }

        const [customers, total] = await Promise.all([
            Customer.find(query).sort(sort).skip(skip).limit(limit),
            Customer.countDocuments(query),
        ]);

        return {
            customers: customers.map(c => c.toObject()),
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getById(shopkeeperId: string, id: string): Promise<any> {
        const customer = await Customer.findOne({ _id: id, shopkeeperId });
        if (!customer) {
            throw new Error('Customer not found');
        }
        return customer.toObject();
    }

    async update(shopkeeperId: string, id: string, input: UpdateCustomerInput): Promise<any> {
        try {
            const customer = await Customer.findOne({ _id: id, shopkeeperId });
            if (!customer) {
                throw new Error('Customer not found');
            }

            // Check if opening balances are being updated
            let needsRecalculation = false;
            let updatedOpeningSales = customer.openingSales;
            let updatedOpeningPayments = customer.openingPayments;

            if (input.openingSales !== undefined && input.openingSales !== customer.openingSales) {
                updatedOpeningSales = input.openingSales;
                needsRecalculation = true;
            }

            if (input.openingPayments !== undefined && input.openingPayments !== customer.openingPayments) {
                updatedOpeningPayments = input.openingPayments;
                needsRecalculation = true;
            }

            if (needsRecalculation) {
                // Adjust totals by the difference in opening balances
                const salesDiff = updatedOpeningSales - customer.openingSales;
                const paymentDiff = updatedOpeningPayments - customer.openingPayments;

                customer.openingSales = updatedOpeningSales;
                customer.openingPayments = updatedOpeningPayments;
                customer.totalSales += salesDiff;
                customer.totalPaid += paymentDiff;
                customer.outstandingDue = customer.totalSales - customer.totalPaid;
            }

            // Apply other updates
            Object.assign(customer, input);

            await customer.save();
            return customer.toObject();
        } catch (error: any) {
            // Handle duplicate key errors
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern || {})[1]; // Second key is phone/whatsappNumber
                if (field === 'phone') {
                    throw new Error('Phone number already exists for another customer');
                } else if (field === 'whatsappNumber') {
                    throw new Error('WhatsApp number already exists for another customer');
                }
            }
            throw error;
        }
    }

    async delete(shopkeeperId: string, id: string): Promise<void> {
        const result = await Customer.findOneAndUpdate(
            { _id: id, shopkeeperId },
            {
                $set: {
                    isDeleted: true,
                    isActive: false,
                    deletedAt: new Date()
                }
            }
        );
        if (!result) {
            throw new Error('Customer not found');
        }
    }

    async restore(shopkeeperId: string, id: string): Promise<any> {
        const customer = await Customer.findOneAndUpdate(
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
        if (!customer) {
            throw new Error('Customer not found or not deleted');
        }
        return customer.toObject();
    }

    async getDashboardStats(shopkeeperId: string, type: CustomerType): Promise<{
        totalCustomers: number;
        totalSales: number;
        totalPaid: number;
        totalOutstanding: number;
    }> {
        const result = await Customer.aggregate([
            { $match: { shopkeeperId: shopkeeperId, type, isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: null,
                    totalCustomers: { $sum: 1 },
                    totalSales: { $sum: '$totalSales' },
                    totalPaid: { $sum: '$totalPaid' },
                    totalOutstanding: { $sum: '$outstandingDue' },
                },
            },
        ]);

        return result[0] || {
            totalCustomers: 0,
            totalSales: 0,
            totalPaid: 0,
            totalOutstanding: 0,
        };
    }

    async updateBalance(
        shopkeeperId: string,
        id: string,
        saleAmount: number,
        paidAmount: number
    ): Promise<void> {
        await Customer.findOneAndUpdate(
            { _id: id, shopkeeperId },
            {
                $inc: {
                    totalSales: saleAmount,
                    totalPaid: paidAmount,
                    outstandingDue: saleAmount - paidAmount,
                },
                $set: {
                    lastPaymentDate: paidAmount > 0 ? new Date() : undefined,
                },
            }
        );
    }

    async recordPayment(shopkeeperId: string, id: string, amount: number): Promise<void> {
        const customer = await Customer.findOne({ _id: id, shopkeeperId });
        if (!customer) {
            throw new Error('Customer not found');
        }

        await Customer.findOneAndUpdate(
            { _id: id, shopkeeperId },
            {
                $inc: {
                    totalPaid: amount,
                    outstandingDue: -amount,
                },
                $set: {
                    lastPaymentDate: new Date(),
                },
            }
        );
    }

    async getStats(
        shopkeeperId: string,
        customerType?: CustomerType
    ): Promise<{
        total: number;
        active: number;
        inactive: number;
        deleted: number;
        withDues: number;
        totalOutstanding: number;
        totalSales: number;
        totalPaid: number;
    }> {
        const baseQuery: any = { shopkeeperId, isDeleted: { $ne: true } };
        if (customerType) {
            baseQuery.type = customerType;
        }

        const [totalResult, activeResult, inactiveResult, deletedResult, duesResult, financialResult] = await Promise.all([
            // Total count (not deleted)
            Customer.countDocuments(baseQuery),
            // Active count
            Customer.countDocuments({ ...baseQuery, isActive: { $ne: false } }),
            // Inactive count
            Customer.countDocuments({ ...baseQuery, isActive: false }),
            // Deleted count
            Customer.countDocuments({ shopkeeperId, isDeleted: true, ...(customerType ? { type: customerType } : {}) }),
            // With dues count
            Customer.countDocuments({ ...baseQuery, outstandingDue: { $gt: 0 } }),
            // Financial aggregation
            Customer.aggregate([
                { $match: baseQuery },
                {
                    $group: {
                        _id: null,
                        totalOutstanding: { $sum: '$outstandingDue' },
                        totalSales: { $sum: '$totalSales' },
                        totalPaid: { $sum: '$totalPaid' },
                    },
                },
            ]),
        ]);

        const financial = financialResult[0] || { totalOutstanding: 0, totalSales: 0, totalPaid: 0 };

        return {
            total: totalResult,
            active: activeResult,
            inactive: inactiveResult,
            deleted: deletedResult,
            withDues: duesResult,
            totalOutstanding: financial.totalOutstanding,
            totalSales: financial.totalSales,
            totalPaid: financial.totalPaid,
        };
    }
}

export const customerService = new CustomerService();
