import { z } from 'zod';

const billItemSchema = z.object({
    name: z.string().min(1, 'Item name is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    price: z.number().min(0, 'Price must be positive'),
    total: z.number().min(0, 'Total must be positive'),
});

export const createBillSchema = z.object({
    billType: z.enum(['purchase', 'sale']),
    entityType: z.enum(['wholesaler', 'due_customer', 'normal_customer']),
    entityId: z.string().optional(),
    entityName: z.string().min(1, 'Entity name is required'),
    totalAmount: z.number().min(0.01, 'Total amount must be greater than 0'),
    paidAmount: z.number().min(0, 'Paid amount must be positive').default(0),
    paymentMethod: z.enum(['cash', 'card', 'online']).optional(),
    items: z.array(billItemSchema).optional(),
    notes: z.string().optional(),
}).refine((data) => {
    if (data.paidAmount > 0 && !data.paymentMethod) {
        return false;
    }
    return true;
}, {
    message: 'Payment method is required when paid amount is greater than 0',
    path: ['paymentMethod'],
});

export const updateBillSchema = z.object({
    totalAmount: z.number().min(0.01, 'Total amount must be greater than 0').optional(),
    paidAmount: z.number().min(0, 'Paid amount must be positive').optional(),
    paymentMethod: z.enum(['cash', 'card', 'online']).optional(),
    notes: z.string().optional(),
}).refine((data) => {
    if (data.paidAmount !== undefined && data.paidAmount > 0 && !data.paymentMethod) {
        return false;
    }
    return true;
}, {
    message: 'Payment method is required when paid amount is greater than 0',
    path: ['paymentMethod'],
});

export const billFilterSchema = z.object({
    billType: z.enum(['purchase', 'sale']).optional(),
    entityType: z.enum(['wholesaler', 'due_customer', 'normal_customer']).optional(),
    entityId: z.string().optional(),
    paymentMethod: z.enum(['cash', 'card', 'online']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    search: z.string().optional(),
    includeDeleted: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
    isEdited: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
export type BillFilterInput = z.infer<typeof billFilterSchema>;

