import mongoose, { Schema, Document } from 'mongoose';

interface InvoiceItem {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    taxRate?: number;
}

export interface InvoiceDocument extends Document {
    shopkeeperId: mongoose.Types.ObjectId;
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate?: Date;

    // Customer Details
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    customerGSTIN?: string;

    // Shop/Business Details
    shopName?: string;
    shopAddress?: string;
    shopPlace?: string;
    shopPhone?: string;

    // Line Items
    items: InvoiceItem[];

    // Amounts
    subtotal: number;
    taxRate?: number;
    taxAmount?: number;
    discount?: number;
    discountType?: 'percentage' | 'fixed';
    total: number;

    // Customization
    templateId: string;
    colorScheme?: string;
    signature?: string;
    signatureName?: string;

    // Notes
    notes?: string;
    terms?: string;

    // Metadata
    status: 'draft' | 'sent' | 'paid' | 'cancelled';
    isDeleted: boolean;
    deletedAt?: Date;
}

const invoiceItemSchema = new Schema(
    {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, min: 0 },
        rate: { type: Number, required: true, min: 0 },
        amount: { type: Number, required: true, min: 0 },
        taxRate: { type: Number, min: 0, max: 100 },
    },
    { _id: false }
);

const invoiceSchema = new Schema(
    {
        shopkeeperId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Shopkeeper ID is required'],
            index: true,
        },
        invoiceNumber: {
            type: String,
            required: [true, 'Invoice number is required'],
            index: true,
        },
        invoiceDate: {
            type: Date,
            required: [true, 'Invoice date is required'],
            default: Date.now,
        },
        dueDate: {
            type: Date,
        },

        // Customer Details
        customerName: {
            type: String,
            required: [true, 'Customer name is required'],
        },
        customerEmail: {
            type: String,
            trim: true,
            lowercase: true,
        },
        customerPhone: {
            type: String,
            trim: true,
        },
        customerAddress: {
            type: String,
            trim: true,
        },
        customerGSTIN: {
            type: String,
            trim: true,
            uppercase: true,
        },

        // Shop/Business Details
        shopName: {
            type: String,
            trim: true,
        },
        shopAddress: {
            type: String,
            trim: true,
        },
        shopPlace: {
            type: String,
            trim: true,
        },
        shopPhone: {
            type: String,
            trim: true,
        },

        // Line Items
        items: {
            type: [invoiceItemSchema],
            required: [true, 'At least one item is required'],
            validate: {
                validator: function (items: InvoiceItem[]) {
                    return items && items.length > 0;
                },
                message: 'Invoice must have at least one item',
            },
        },

        // Amounts
        subtotal: {
            type: Number,
            required: [true, 'Subtotal is required'],
            min: 0,
        },
        taxRate: {
            type: Number,
            min: 0,
            max: 100,
        },
        taxAmount: {
            type: Number,
            min: 0,
        },
        discount: {
            type: Number,
            min: 0,
        },
        discountType: {
            type: String,
            enum: ['percentage', 'fixed'],
        },
        total: {
            type: Number,
            required: [true, 'Total is required'],
            min: 0,
        },

        // Customization
        templateId: {
            type: String,
            required: true,
            default: 'modern',
        },
        colorScheme: {
            type: String,
            default: 'blue',
        },
        logo: {
            type: String,
        },
        signature: {
            type: String, // Base64 or URL
        },
        signatureName: {
            type: String,
        },

        // Notes
        notes: {
            type: String,
            trim: true,
        },
        terms: {
            type: String,
            trim: true,
        },

        // Metadata
        status: {
            type: String,
            enum: ['draft', 'sent', 'paid', 'cancelled'],
            default: 'draft',
        },
        isDeleted: {
            type: Boolean,
            default: false,
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
invoiceSchema.index({ shopkeeperId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ shopkeeperId: 1, createdAt: -1 });
invoiceSchema.index({ shopkeeperId: 1, status: 1 });
invoiceSchema.index({ shopkeeperId: 1, isDeleted: 1 });
invoiceSchema.index({ shopkeeperId: 1, customerName: 1 });

export const Invoice = mongoose.model<InvoiceDocument>('Invoice', invoiceSchema);
