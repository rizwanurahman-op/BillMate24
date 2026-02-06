import mongoose, { Schema, Document } from 'mongoose';

interface CustomerDocument extends Document {
    shopkeeperId: mongoose.Types.ObjectId;
    name: string;
    phone?: string;
    whatsappNumber?: string;
    address?: string;
    place?: string;
    type: 'due' | 'normal';
    openingSales: number;
    openingPayments: number;
    totalSales: number;
    totalPaid: number;
    outstandingDue: number;
    lastPaymentDate?: Date;
    isActive: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
}

const customerSchema = new Schema(
    {
        shopkeeperId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Shopkeeper ID is required'],
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        phone: {
            type: String,
            required: [
                function (this: any) {
                    return this.type === 'due';
                },
                'Phone number is required for due customers',
            ],
            trim: true,
        },
        whatsappNumber: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            required: [
                function (this: any) {
                    return this.type === 'due';
                },
                'Address is required for due customers',
            ],
            trim: true,
        },
        place: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            enum: ['due', 'normal'],
            required: [true, 'Customer type is required'],
        },
        // Opening balance fields for clear tracking
        openingSales: {
            type: Number,
            default: 0,
            min: 0,
            // Amount of sales made to this customer before using the app
        },
        openingPayments: {
            type: Number,
            default: 0,
            min: 0,
            // Amount of payments received from this customer before using the app
        },
        totalSales: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalPaid: {
            type: Number,
            default: 0,
            min: 0,
        },
        outstandingDue: {
            type: Number,
            default: 0,
        },
        lastPaymentDate: {
            type: Date,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
        deletedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
customerSchema.index({ shopkeeperId: 1, type: 1 });
customerSchema.index({ shopkeeperId: 1, name: 1 });
customerSchema.index({ shopkeeperId: 1, isActive: 1 });
customerSchema.index({ shopkeeperId: 1, outstandingDue: -1 });

// Unique indexes for phone and whatsappNumber per shopkeeper
// sparse: true ensures uniqueness only for non-null values
customerSchema.index(
    { shopkeeperId: 1, phone: 1 },
    { unique: true, sparse: true, name: 'unique_phone_per_shopkeeper' }
);
customerSchema.index(
    { shopkeeperId: 1, whatsappNumber: 1 },
    { unique: true, sparse: true, name: 'unique_whatsapp_per_shopkeeper' }
);

export const Customer = mongoose.model<CustomerDocument>('Customer', customerSchema);

