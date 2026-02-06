import { z } from 'zod';

export const createCustomerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
    whatsappNumber: z.string().optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    address: z.string().optional(),
    place: z.string().optional(),
    type: z.enum(['due', 'normal']),
    initialSales: z.number().optional(),
    openingSales: z.number().min(0, 'Opening sales must be positive').optional(),
    openingPayments: z.number().min(0, 'Opening payments must be positive').optional(),
}).superRefine((data, ctx) => {
    if (data.type === 'due') {
        if (!data.phone) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Phone number is required for due customers',
                path: ['phone'],
            });
        }
        if (!data.address) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Address is required for due customers',
                path: ['address'],
            });
        }
    }
});

export const updateCustomerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().optional(),
    whatsappNumber: z.string().optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    address: z.string().optional(),
    place: z.string().optional(),
    isActive: z.boolean().optional(),
    openingSales: z.number().min(0, 'Opening sales must be positive').optional(),
    openingPayments: z.number().min(0, 'Opening payments must be positive').optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
