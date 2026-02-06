import { z } from 'zod';

export const createPaymentSchema = z.object({
    entityType: z.enum(['wholesaler', 'customer']),
    entityId: z.string().min(1, 'Entity ID is required'),
    entityName: z.string().min(1, 'Entity name is required'),
    amount: z.number().min(0.01, 'Amount must be greater than 0'),
    paymentMethod: z.enum(['cash', 'card', 'online']),
    billId: z.string().optional(),
    notes: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
