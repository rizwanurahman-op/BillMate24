import { z } from 'zod';

export const customerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
    whatsappNumber: z.string().optional(),
    address: z.string().optional(),
    place: z.string().optional(),
    type: z.enum(['due', 'normal']),
    initialSales: z.number().optional(),
    openingSales: z.number().optional(),
    openingPayments: z.number().optional(),
}).superRefine((data, ctx) => {
    if (data.type === 'due') {
        if (!data.phone || data.phone.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Phone number is required for due customers',
                path: ['phone'],
            });
        }
        if (!data.address || data.address.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Address is required for due customers',
                path: ['address'],
            });
        }
    }
});

export type CustomerSchema = z.infer<typeof customerSchema>;
