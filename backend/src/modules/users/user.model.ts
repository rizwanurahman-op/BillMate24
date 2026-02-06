import mongoose, { Schema, Document } from 'mongoose';
import { IUser, Features } from '../../types';

const featuresSchema = new Schema<Features>(
    {
        wholesalers: { type: Boolean, default: true },
        dueCustomers: { type: Boolean, default: true },
        normalCustomers: { type: Boolean, default: true },
        billing: { type: Boolean, default: true },
        reports: { type: Boolean, default: true },
    },
    { _id: false }
);

const userSchema = new Schema<IUser & Document>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        role: {
            type: String,
            enum: ['admin', 'shopkeeper'],
            default: 'shopkeeper',
        },
        phone: {
            type: String,
            trim: true,
        },
        businessName: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        place: {
            type: String,
            trim: true,
        },
        features: {
            type: featuresSchema,
            default: () => ({
                wholesalers: true,
                dueCustomers: true,
                normalCustomers: true,
                billing: true,
                reports: true,
            }),
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        refreshToken: {
            type: String,
        },
        resetPasswordOTP: {
            type: String,
        },
        resetPasswordOTPExpires: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Unique index for phone number (globally unique across all users)
// sparse: true ensures uniqueness only for non-null values
userSchema.index({ phone: 1 }, { unique: true, sparse: true, name: 'unique_phone' });

export const User = mongoose.model<IUser & Document>('User', userSchema);
