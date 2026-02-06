import { z } from 'zod';

const featuresSchema = z.object({
    wholesalers: z.boolean().default(true),
    dueCustomers: z.boolean().default(true),
    normalCustomers: z.boolean().default(true),
    billing: z.boolean().default(true),
    reports: z.boolean().default(true),
});

export const createShopkeeperSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
    businessName: z.string().optional(),
    address: z.string().optional(),
    place: z.string().optional(),
    features: featuresSchema.optional(),
});

export const updateShopkeeperSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().optional(),
    businessName: z.string().optional(),
    address: z.string().optional(),
    place: z.string().optional(),
    isActive: z.boolean().optional(),
});

export const updateFeaturesSchema = z.object({
    features: featuresSchema,
});

export type CreateShopkeeperInput = z.infer<typeof createShopkeeperSchema>;
export type UpdateShopkeeperInput = z.infer<typeof updateShopkeeperSchema>;
export type UpdateFeaturesInput = z.infer<typeof updateFeaturesSchema>;
