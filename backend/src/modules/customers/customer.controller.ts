import { Request, Response, NextFunction } from 'express';
import { customerService } from './customer.service';
import { createCustomerSchema, updateCustomerSchema } from './customer.validation';
import { sendSuccess, sendError, sendPaginated, getPaginationParams } from '../../utils/helpers';
import { CustomerType } from '../../types';

export class CustomerController {
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = createCustomerSchema.parse(req.body);
            const customer = await customerService.create(req.user!._id, validatedData);
            sendSuccess(res, customer, 'Customer created successfully', 201);
        } catch (error: any) {
            if (error.message === 'Phone number already exists for another customer') {
                sendError(res, error.message, 409);
            } else if (error.message === 'WhatsApp number already exists for another customer') {
                sendError(res, error.message, 409);
            } else {
                next(error);
            }
        }
    }

    async export(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const search = req.query.search as string | undefined;
            const type = req.query.type as CustomerType | undefined;
            const status = req.query.status as string | undefined;
            const duesFilter = req.query.duesFilter as string | undefined;
            const sortBy = req.query.sortBy as string | undefined;
            const includeDeleted = req.query.includeDeleted === 'true' || status === 'deleted';

            const result = await customerService.getAll(
                req.user!._id,
                type,
                1,
                10000, // High limit for export
                search,
                includeDeleted,
                status,
                duesFilter,
                sortBy
            );
            sendSuccess(res, result.customers, 'Customers exported successfully');
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
            const search = req.query.search as string | undefined;
            const type = req.query.type as CustomerType | undefined;
            const status = req.query.status as string | undefined;
            const duesFilter = req.query.duesFilter as string | undefined;
            const sortBy = req.query.sortBy as string | undefined;

            const includeDeleted = req.query.includeDeleted === 'true' || status === 'deleted';

            const result = await customerService.getAll(
                req.user!._id,
                type,
                page,
                limit,
                search,
                includeDeleted,
                status,
                duesFilter,
                sortBy
            );
            sendPaginated(res, result.customers, {
                page,
                limit,
                total: result.total,
                totalPages: result.totalPages,
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const customer = await customerService.getById(req.user!._id, req.params.id);
            sendSuccess(res, customer, 'Customer retrieved successfully');
        } catch (error: any) {
            if (error.message === 'Customer not found') {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = updateCustomerSchema.parse(req.body);
            const customer = await customerService.update(req.user!._id, req.params.id, validatedData);
            sendSuccess(res, customer, 'Customer updated successfully');
        } catch (error: any) {
            if (error.message === 'Customer not found') {
                sendError(res, error.message, 404);
            } else if (error.message === 'Phone number already exists for another customer') {
                sendError(res, error.message, 409);
            } else if (error.message === 'WhatsApp number already exists for another customer') {
                sendError(res, error.message, 409);
            } else {
                next(error);
            }
        }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await customerService.delete(req.user!._id, req.params.id);
            sendSuccess(res, null, 'Customer deleted successfully');
        } catch (error: any) {
            if (error.message === 'Customer not found') {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }

    async getDueDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const stats = await customerService.getDashboardStats(req.user!._id, 'due');
            sendSuccess(res, stats, 'Due customers dashboard stats retrieved');
        } catch (error) {
            next(error);
        }
    }

    async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const type = req.query.type as CustomerType | undefined;
            const stats = await customerService.getStats(req.user!._id, type);
            sendSuccess(res, stats, 'Customer stats retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const customer = await customerService.restore(req.user!._id, req.params.id);
            sendSuccess(res, customer, 'Customer restored successfully');
        } catch (error: any) {
            if (error.message.includes('not found')) {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }
}

export const customerController = new CustomerController();
