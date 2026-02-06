import { Payment } from './payment.model';
import { Transaction } from '../dashboard/transaction.model';
import { Bill } from '../bills/bill.model';
import { wholesalerService } from '../wholesalers/wholesaler.service';
import { customerService } from '../customers/customer.service';
import { CreatePaymentInput } from './payment.validation';

export class PaymentService {
    async create(shopkeeperId: string, input: CreatePaymentInput): Promise<any> {
        const payment = new Payment({
            ...input,
            shopkeeperId,
        });

        await payment.save();

        // Update the bill's paidAmount if billId is provided
        if (input.billId) {
            await Bill.findOneAndUpdate(
                { _id: input.billId, shopkeeperId },
                {
                    $inc: {
                        paidAmount: input.amount,
                        dueAmount: -input.amount,
                    },
                }
            );
        }

        // Update entity balances
        if (input.entityType === 'wholesaler') {
            await wholesalerService.recordPayment(shopkeeperId, input.entityId, input.amount);

            // Record expense transaction (paying to wholesaler)
            const transaction = new Transaction({
                shopkeeperId,
                type: 'expense',
                category: 'Wholesaler Payment',
                amount: input.amount,
                paymentMethod: input.paymentMethod,
                description: `Payment to ${input.entityName}`,
            });
            await transaction.save();
        } else {
            await customerService.recordPayment(shopkeeperId, input.entityId, input.amount);

            // Record income transaction (receiving from customer)
            const transaction = new Transaction({
                shopkeeperId,
                type: 'income',
                category: 'Customer Payment',
                amount: input.amount,
                paymentMethod: input.paymentMethod,
                description: `Payment from ${input.entityName}`,
            });
            await transaction.save();
        }

        return payment.toObject();
    }

    async getAll(
        shopkeeperId: string,
        page: number,
        limit: number,
        filters?: {
            entityType?: 'wholesaler' | 'customer';
            entityId?: string;
            paymentMethod?: 'cash' | 'card' | 'online';
            startDate?: string;
            endDate?: string;
            search?: string;
        }
    ): Promise<{ payments: any[]; total: number; totalPages: number }> {
        const skip = (page - 1) * limit;
        const query: any = { shopkeeperId };

        if (filters?.entityType) query.entityType = filters.entityType;
        if (filters?.entityId) query.entityId = filters.entityId;
        if (filters?.paymentMethod) query.paymentMethod = filters.paymentMethod;

        // Date range filter
        if (filters?.startDate || filters?.endDate) {
            query.createdAt = {};
            if (filters.startDate) {
                query.createdAt.$gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                query.createdAt.$lte = endDate;
            }
        }

        // Search by entity name
        if (filters?.search) {
            query.entityName = { $regex: filters.search, $options: 'i' };
        }

        const [payments, total] = await Promise.all([
            Payment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Payment.countDocuments(query),
        ]);

        return {
            payments: payments.map(p => p.toObject()),
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getByEntity(
        shopkeeperId: string,
        entityType: 'wholesaler' | 'customer',
        entityId: string,
        filters?: { startDate?: string; endDate?: string }
    ): Promise<any[]> {
        const query: any = { shopkeeperId, entityType, entityId };

        if (filters?.startDate || filters?.endDate) {
            query.createdAt = {};
            if (filters.startDate) {
                query.createdAt.$gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                query.createdAt.$lte = endDate;
            }
        }

        const payments = await Payment.find(query)
            .sort({ createdAt: -1 });
        return payments.map(p => p.toObject());
    }

    async getRecentPayments(shopkeeperId: string, limit: number = 10): Promise<any[]> {
        const payments = await Payment.find({ shopkeeperId })
            .sort({ createdAt: -1 })
            .limit(limit);
        return payments.map(p => p.toObject());
    }
}

export const paymentService = new PaymentService();

