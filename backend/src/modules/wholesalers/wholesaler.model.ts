import mongoose, { Schema, Document } from 'mongoose';

interface WholesalerDocument extends Document {
    shopkeeperId: mongoose.Types.ObjectId;
    name: string;
    phone?: string;
    whatsappNumber?: string;
    address?: string;
    place?: string;
    initialPurchased: number; // DEPRECATED
    openingPurchases: number;
    openingPayments: number;
    totalPurchased: number;
    totalPaid: number;
    outstandingDue: number;
    isActive: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
}

const wholesalerSchema = new Schema(
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
            required: [true, 'Phone number is required'],
            trim: true,
        },
        whatsappNumber: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true,
        },
        place: {
            type: String,
            trim: true,
        },
        gstNumber: {
            type: String,
            trim: true,
        },
        // DEPRECATED: Use openingPurchases and openingPayments instead
        initialPurchased: {
            type: Number,
            default: 0,
        },
        // New fields for clear opening balance tracking
        openingPurchases: {
            type: Number,
            default: 0,
            min: 0,
            // Amount of goods purchased before using the app
        },
        openingPayments: {
            type: Number,
            default: 0,
            min: 0,
            // Amount of money paid before using the app
        },
        totalPurchased: {
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
            // No min constraint - can be negative (credit) or positive (debt)
            // Negative: Shopkeeper has paid in advance (wholesaler owes shopkeeper)
            // Positive: Shopkeeper owes wholesaler
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
wholesalerSchema.index({ shopkeeperId: 1, name: 1 });
wholesalerSchema.index({ shopkeeperId: 1, isActive: 1 });
wholesalerSchema.index({ shopkeeperId: 1, outstandingDue: -1 });

// Unique indexes for phone and whatsappNumber per shopkeeper
// sparse: true ensures uniqueness only for non-null values
wholesalerSchema.index(
    { shopkeeperId: 1, phone: 1 },
    { unique: true, sparse: true, name: 'unique_phone_per_shopkeeper' }
);
wholesalerSchema.index(
    { shopkeeperId: 1, whatsappNumber: 1 },
    { unique: true, sparse: true, name: 'unique_whatsapp_per_shopkeeper' }
);

export const Wholesaler = mongoose.model<WholesalerDocument>('Wholesaler', wholesalerSchema);

