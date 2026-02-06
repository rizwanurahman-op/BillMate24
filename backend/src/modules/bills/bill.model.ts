import mongoose, { Schema, Document } from 'mongoose';

interface BillItem {
    name: string;
    quantity: number;
    price: number;
    total: number;
}

interface BillDocument extends Document {
    shopkeeperId: mongoose.Types.ObjectId;
    billNumber: string;
    billType: 'purchase' | 'sale';
    entityType: 'wholesaler' | 'due_customer' | 'normal_customer';
    entityId?: mongoose.Types.ObjectId;
    entityName: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentMethod: 'cash' | 'card' | 'online';
    items?: BillItem[];
    notes?: string;
    isDeleted: boolean;
    deletedAt?: Date;
    isEdited: boolean;
    editHistory?: {
        modifiedAt: Date;
        previousState: any;
    }[];
}

const billItemSchema = new Schema(
    {
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 0 },
        price: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const billSchema = new Schema(
    {
        shopkeeperId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Shopkeeper ID is required'],
            index: true,
        },
        billNumber: {
            type: String,
            required: [true, 'Bill number is required'],
            unique: true,
        },
        billType: {
            type: String,
            enum: ['purchase', 'sale'],
            required: [true, 'Bill type is required'],
        },
        entityType: {
            type: String,
            enum: ['wholesaler', 'due_customer', 'normal_customer'],
            required: [true, 'Entity type is required'],
        },
        entityId: {
            type: Schema.Types.ObjectId,
            refPath: 'entityType',
        },
        entityName: {
            type: String,
            required: [true, 'Entity name is required'],
        },
        totalAmount: {
            type: Number,
            required: [true, 'Total amount is required'],
            min: 0,
        },
        paidAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        dueAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'card', 'online'],
            required: function (this: any) { return this.paidAmount > 0; },
        },
        items: [billItemSchema],
        notes: {
            type: String,
            trim: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
        },
        isEdited: {
            type: Boolean,
            default: false,
        },
        editHistory: [
            {
                modifiedAt: { type: Date, default: Date.now },
                previousState: { type: Schema.Types.Mixed },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Pre-save middleware to calculate due amount
// dueAmount is always >= 0, excess payment reduces entity's outstanding
billSchema.pre('save', function (next) {
    this.dueAmount = Math.max(0, this.totalAmount - this.paidAmount);
    next();
});

// Indexes for faster queries
billSchema.index({ shopkeeperId: 1, createdAt: -1 });
billSchema.index({ shopkeeperId: 1, billType: 1 });
billSchema.index({ shopkeeperId: 1, entityType: 1 });
billSchema.index({ shopkeeperId: 1, entityId: 1 });
billSchema.index({ shopkeeperId: 1, isDeleted: 1 });

export const Bill = mongoose.model<BillDocument>('Bill', billSchema);

