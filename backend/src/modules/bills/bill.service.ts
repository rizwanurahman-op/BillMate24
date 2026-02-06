import mongoose from 'mongoose';
import { Bill } from './bill.model';
import { Transaction } from '../dashboard/transaction.model';
import { Payment } from '../payments/payment.model';
import { wholesalerService } from '../wholesalers/wholesaler.service';
import { customerService } from '../customers/customer.service';
import { CreateBillInput, BillFilterInput, UpdateBillInput } from './bill.validation';
import { generateBillNumber } from '../../utils/helpers';

export class BillService {
    async create(shopkeeperId: string, input: CreateBillInput): Promise<any> {
        const billNumber = generateBillNumber('BILL');
        // Bill's dueAmount is never negative - excess goes to reduce entity's outstanding
        const dueAmount = Math.max(0, input.totalAmount - input.paidAmount);

        // Professional Fix: If no payment is made, remove the payment method
        const billData: any = { ...input };
        if (input.paidAmount === 0) {
            delete billData.paymentMethod;
        }

        // Calculate excess payment (amount paid beyond the current bill)
        const excessPayment = Math.max(0, input.paidAmount - input.totalAmount);

        const bill = new Bill({
            ...billData,
            shopkeeperId,
            billNumber,
            dueAmount,
        });

        await bill.save();

        // Update entity balances
        // For excess payments: the entity gets credited totalAmount (new purchase/sale), 
        // but their outstanding reduces by the full paidAmount
        if (input.billType === 'purchase' && input.entityId) {
            await wholesalerService.updateBalance(
                shopkeeperId,
                input.entityId,
                input.totalAmount,
                input.paidAmount // Full paid amount - excess will reduce their outstanding
            );
        } else if (input.billType === 'sale' && input.entityType !== 'normal_customer' && input.entityId) {
            await customerService.updateBalance(
                shopkeeperId,
                input.entityId,
                input.totalAmount,
                input.paidAmount // Full paid amount - excess will reduce their outstanding
            );
        }

        // Create transaction record only if paidAmount > 0
        if (input.paidAmount > 0) {
            const transactionType = input.billType === 'sale' ? 'income' : 'expense';
            const transaction = new Transaction({
                shopkeeperId,
                type: transactionType,
                category: input.billType === 'purchase' ? 'Purchase' : 'Sale',
                amount: input.paidAmount,
                paymentMethod: input.paymentMethod,
                reference: billNumber,
                description: `${input.billType === 'purchase' ? 'Purchase from' : 'Sale to'} ${input.entityName}`,
            });
            await transaction.save();
        }

        // Create payment record if paidAmount > 0 (for tracking in payments history)
        if (input.paidAmount > 0 && input.entityId) {
            const payment = new Payment({
                shopkeeperId,
                entityType: input.billType === 'purchase' ? 'wholesaler' : 'customer',
                entityId: input.entityId,
                entityName: input.entityName,
                amount: input.paidAmount,
                paymentMethod: input.paymentMethod,
                billId: bill._id as any,
                notes: `Payment for bill ${billNumber}`,
            });
            await payment.save();
        }

        return bill.toObject();
    }

    async getAll(
        shopkeeperId: string,
        page: number,
        limit: number,
        filters?: BillFilterInput
    ): Promise<{ bills: any[]; total: number; totalPages: number }> {
        const skip = (page - 1) * limit;
        const query: any = { shopkeeperId };

        // Handle soft deleted bills
        if (!filters?.includeDeleted) {
            query.isDeleted = { $ne: true };
        }

        if (filters?.billType) {
            query.billType = filters.billType;
        }
        if (filters?.entityType) {
            query.entityType = filters.entityType;
        }
        if (filters?.entityId) {
            query.entityId = new mongoose.Types.ObjectId(filters.entityId);
        }
        if (filters?.paymentMethod) {
            query.paymentMethod = filters.paymentMethod;
        }
        if (filters?.isEdited) {
            query.isEdited = true;
        }
        if (filters?.startDate || filters?.endDate) {
            query.createdAt = {};
            if (filters.startDate) {
                query.createdAt.$gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                // Set end date to end of day (23:59:59.999)
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                query.createdAt.$lte = endDate;
            }
        }
        // Search filter - search in billNumber and entityName
        if (filters?.search) {
            query.$or = [
                { billNumber: { $regex: filters.search, $options: 'i' } },
                { entityName: { $regex: filters.search, $options: 'i' } },
            ];
        }

        const [bills, total] = await Promise.all([
            Bill.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Bill.countDocuments(query),
        ]);

        return {
            bills: bills.map(b => b.toObject()),
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getById(shopkeeperId: string, id: string): Promise<any> {
        const bill = await Bill.findOne({ _id: id, shopkeeperId });
        if (!bill) {
            throw new Error('Bill not found');
        }
        return bill.toObject();
    }

    async getByBillNumber(shopkeeperId: string, billNumber: string): Promise<any> {
        const bill = await Bill.findOne({ billNumber, shopkeeperId });
        if (!bill) {
            throw new Error('Bill not found');
        }
        return bill.toObject();
    }

    async getRecentBills(shopkeeperId: string, limit: number = 10): Promise<any[]> {
        const bills = await Bill.find({ shopkeeperId, isDeleted: { $ne: true } })
            .sort({ createdAt: -1 })
            .limit(limit);
        return bills.map(b => b.toObject());
    }

    async getBillStats(shopkeeperId: string): Promise<{
        totalBills: number;
        totalPurchases: number;
        totalSales: number;
        todayBills: number;
    }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalBills, totalPurchases, totalSales, todayBills] = await Promise.all([
            Bill.countDocuments({ shopkeeperId, isDeleted: { $ne: true } }),
            Bill.countDocuments({ shopkeeperId, billType: 'purchase', isDeleted: { $ne: true } }),
            Bill.countDocuments({ shopkeeperId, billType: 'sale', isDeleted: { $ne: true } }),
            Bill.countDocuments({ shopkeeperId, isDeleted: { $ne: true }, createdAt: { $gte: today } }),
        ]);

        return { totalBills, totalPurchases, totalSales, todayBills };
    }

    async update(shopkeeperId: string, id: string, input: UpdateBillInput): Promise<any> {
        const bill = await Bill.findOne({ _id: id, shopkeeperId });
        if (!bill) {
            throw new Error('Bill not found');
        }

        if (bill.isDeleted) {
            throw new Error('Cannot edit a deleted bill');
        }

        // Store current state in history
        const previousState = {
            totalAmount: bill.totalAmount,
            paidAmount: bill.paidAmount,
            dueAmount: bill.dueAmount,
            paymentMethod: bill.paymentMethod,
            notes: bill.notes,
        };

        // 1. Reverse old balance
        if (bill.entityId) {
            if (bill.billType === 'purchase') {
                await wholesalerService.updateBalance(
                    shopkeeperId,
                    bill.entityId.toString(),
                    -bill.totalAmount,
                    -bill.paidAmount
                );
            } else if (bill.entityType !== 'normal_customer') {
                await customerService.updateBalance(
                    shopkeeperId,
                    bill.entityId.toString(),
                    -bill.totalAmount,
                    -bill.paidAmount
                );
            }
        }

        // 2. Update bill fields
        if (input.totalAmount !== undefined) bill.totalAmount = input.totalAmount;
        if (input.paidAmount !== undefined) bill.paidAmount = input.paidAmount;
        if (input.paymentMethod !== undefined) {
            if (bill.paidAmount > 0) {
                bill.paymentMethod = input.paymentMethod;
            } else {
                // If paid amount is 0, remove payment method
                (bill as any).paymentMethod = undefined;
            }
        } else if (bill.paidAmount === 0) {
            // Also handle case where paidAmount was updated to 0 but no paymentMethod was sent
            (bill as any).paymentMethod = undefined;
        }

        if (input.notes !== undefined) bill.notes = input.notes;

        bill.isEdited = true;
        if (!bill.editHistory) bill.editHistory = [];
        bill.editHistory.push({
            modifiedAt: new Date(),
            previousState,
        });

        // 3. Apply new balance
        if (bill.entityId) {
            if (bill.billType === 'purchase') {
                await wholesalerService.updateBalance(
                    shopkeeperId,
                    bill.entityId.toString(),
                    bill.totalAmount,
                    bill.paidAmount
                );
            } else if (bill.entityType !== 'normal_customer') {
                await customerService.updateBalance(
                    shopkeeperId,
                    bill.entityId.toString(),
                    bill.totalAmount,
                    bill.paidAmount
                );
            }
        }

        await bill.save();

        // 4. Update associated transaction and payment
        if (bill.paidAmount > 0) {
            // Update or Create Transaction
            await Transaction.findOneAndUpdate(
                { shopkeeperId, reference: bill.billNumber },
                {
                    $set: {
                        amount: bill.paidAmount,
                        paymentMethod: bill.paymentMethod,
                        description: `${bill.billType === 'purchase' ? 'Purchase from' : 'Sale to'} ${bill.entityName} (Updated)`,
                    }
                },
                { upsert: true }
            );

            // Update or Create Payment
            if (bill.entityId) {
                await Payment.findOneAndUpdate(
                    { shopkeeperId, billId: bill._id },
                    {
                        $set: {
                            amount: bill.paidAmount,
                            paymentMethod: bill.paymentMethod,
                            notes: `Updated payment for bill ${bill.billNumber}`,
                        }
                    },
                    { upsert: true }
                );
            }
        } else {
            // If paid amount becomes 0, remove transaction and payment
            await Transaction.deleteOne({ shopkeeperId, reference: bill.billNumber });
            await Payment.deleteOne({ shopkeeperId, billId: bill._id });
        }

        return bill.toObject();
    }

    async delete(shopkeeperId: string, id: string): Promise<void> {
        const bill = await Bill.findOne({ _id: id, shopkeeperId });
        if (!bill) {
            throw new Error('Bill not found');
        }

        if (bill.isDeleted) {
            return; // Already deleted
        }

        // 1. Reverse balance
        if (bill.entityId) {
            if (bill.billType === 'purchase') {
                await wholesalerService.updateBalance(
                    shopkeeperId,
                    bill.entityId.toString(),
                    -bill.totalAmount,
                    -bill.paidAmount
                );
            } else if (bill.entityType !== 'normal_customer') {
                await customerService.updateBalance(
                    shopkeeperId,
                    bill.entityId.toString(),
                    -bill.totalAmount,
                    -bill.paidAmount
                );
            }
        }

        // 2. Mark as deleted
        bill.isDeleted = true;
        bill.deletedAt = new Date();
        await bill.save();

        // 3. Remove/Delete Transaction and Payment records so they don't show up in reports
        await Transaction.deleteOne({ shopkeeperId, reference: bill.billNumber });
        await Payment.deleteOne({ shopkeeperId, billId: bill._id });
    }
}

export const billService = new BillService();

