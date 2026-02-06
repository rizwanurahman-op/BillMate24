import { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { createPaymentSchema } from './payment.validation';
import { sendSuccess, sendPaginated, getPaginationParams } from '../../utils/helpers';

export class PaymentController {
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = createPaymentSchema.parse(req.body);
            const payment = await paymentService.create(req.user!._id, validatedData);
            sendSuccess(res, payment, 'Payment recorded successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async export(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filters = {
                entityType: req.query.entityType as 'wholesaler' | 'customer' | undefined,
                entityId: req.query.entityId as string | undefined,
                paymentMethod: req.query.paymentMethod as 'cash' | 'card' | 'online' | undefined,
                startDate: req.query.startDate as string | undefined,
                endDate: req.query.endDate as string | undefined,
                search: req.query.search as string | undefined,
            };

            const result = await paymentService.getAll(req.user!._id, 1, 10000, filters);
            sendSuccess(res, result.payments, 'Payments exported successfully');
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { page, limit } = getPaginationParams(
                req.query.page as string,
                req.query.limit as string
            );

            const filters = {
                entityType: req.query.entityType as 'wholesaler' | 'customer' | undefined,
                entityId: req.query.entityId as string | undefined,
                paymentMethod: req.query.paymentMethod as 'cash' | 'card' | 'online' | undefined,
                startDate: req.query.startDate as string | undefined,
                endDate: req.query.endDate as string | undefined,
                search: req.query.search as string | undefined,
            };

            const result = await paymentService.getAll(req.user!._id, page, limit, filters);
            sendPaginated(res, result.payments, {
                page,
                limit,
                total: result.total,
                totalPages: result.totalPages,
            });
        } catch (error) {
            next(error);
        }
    }

    async getByEntity(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { entityType, entityId } = req.params;
            const filters = {
                startDate: req.query.startDate as string | undefined,
                endDate: req.query.endDate as string | undefined,
            };
            const payments = await paymentService.getByEntity(
                req.user!._id,
                entityType as 'wholesaler' | 'customer',
                entityId,
                filters
            );
            sendSuccess(res, payments, 'Payments retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getRecent(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 10;
            const payments = await paymentService.getRecentPayments(req.user!._id, limit);
            sendSuccess(res, payments, 'Recent payments retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

export const paymentController = new PaymentController();
