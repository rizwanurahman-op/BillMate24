import mongoose, { Schema, Document } from 'mongoose';

interface TransactionDocument extends Document {
    shopkeeperId: mongoose.Types.ObjectId;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    paymentMethod: 'cash' | 'card' | 'online';
    reference?: string;
    description?: string;
}

const transactionSchema = new Schema(
    {
        shopkeeperId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Shopkeeper ID is required'],
            index: true,
        },
        type: {
            type: String,
            enum: ['income', 'expense'],
            required: [true, 'Transaction type is required'],
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
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
        reference: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Indexes for faster queries
transactionSchema.index({ shopkeeperId: 1, createdAt: -1 });
transactionSchema.index({ shopkeeperId: 1, type: 1 });
transactionSchema.index({ shopkeeperId: 1, category: 1 });
transactionSchema.index({ shopkeeperId: 1, paymentMethod: 1 });

export const Transaction = mongoose.model<TransactionDocument>('Transaction', transactionSchema);

