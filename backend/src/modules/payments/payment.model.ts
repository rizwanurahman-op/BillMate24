import mongoose, { Schema, Document } from 'mongoose';

interface PaymentDocument extends Document {
    shopkeeperId: mongoose.Types.ObjectId;
    billId?: mongoose.Types.ObjectId;
    entityType: 'wholesaler' | 'customer';
    entityId: mongoose.Types.ObjectId;
    entityName: string;
    amount: number;
    paymentMethod: 'cash' | 'card' | 'online';
    notes?: string;
}

const paymentSchema = new Schema(
    {
        shopkeeperId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Shopkeeper ID is required'],
            index: true,
        },
        billId: {
            type: Schema.Types.ObjectId,
            ref: 'Bill',
        },
        entityType: {
            type: String,
            enum: ['wholesaler', 'customer'],
            required: [true, 'Entity type is required'],
        },
        entityId: {
            type: Schema.Types.ObjectId,
            required: [true, 'Entity ID is required'],
        },
        entityName: {
            type: String,
            required: [true, 'Entity name is required'],
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0.01, 'Amount must be greater than 0'],
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'card', 'online'],
            required: [true, 'Payment method is required'],
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Indexes for faster queries
paymentSchema.index({ shopkeeperId: 1, createdAt: -1 });
paymentSchema.index({ shopkeeperId: 1, entityType: 1 });
paymentSchema.index({ shopkeeperId: 1, entityId: 1 });
paymentSchema.index({ billId: 1 });

export const Payment = mongoose.model<PaymentDocument>('Payment', paymentSchema);

