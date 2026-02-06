import { Request, Response, NextFunction } from 'express';
import { billService } from './bill.service';
import { createBillSchema, billFilterSchema, updateBillSchema } from './bill.validation';
import { sendSuccess, sendError, sendPaginated, getPaginationParams } from '../../utils/helpers';

export class BillController {
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = createBillSchema.parse(req.body);
            const bill = await billService.create(req.user!._id, validatedData);
            sendSuccess(res, bill, 'Bill created successfully', 201);
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
            const filters = billFilterSchema.parse({
                billType: req.query.billType,
                entityType: req.query.entityType,
                entityId: req.query.entityId,
                paymentMethod: req.query.paymentMethod,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                search: req.query.search,
                includeDeleted: req.query.includeDeleted,
                isEdited: req.query.isEdited,
            });
            const result = await billService.getAll(req.user!._id, page, limit, filters);
            sendPaginated(res, result.bills, {
                page,
                limit,
                total: result.total,
                totalPages: result.totalPages,
            });
        } catch (error) {
            next(error);
        }
    }

    async export(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // For export, we fetch all matching records (limit: 10000)
            const page = 1;
            const limit = 10000;

            const filters = billFilterSchema.parse({
                billType: req.query.billType,
                entityType: req.query.entityType,
                entityId: req.query.entityId,
                paymentMethod: req.query.paymentMethod,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                search: req.query.search,
                includeDeleted: req.query.includeDeleted,
                isEdited: req.query.isEdited,
            });

            // Reusing get all but with high limit
            const result = await billService.getAll(req.user!._id, page, limit, filters);

            sendSuccess(res, result.bills, 'Bills exported successfully');
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const bill = await billService.getById(req.user!._id, req.params.id);
            sendSuccess(res, bill, 'Bill retrieved successfully');
        } catch (error: any) {
            if (error.message === 'Bill not found') {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }

    async getRecent(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 10;
            const bills = await billService.getRecentBills(req.user!._id, limit);
            sendSuccess(res, bills, 'Recent bills retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const stats = await billService.getBillStats(req.user!._id);
            sendSuccess(res, stats, 'Bill stats retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = updateBillSchema.parse(req.body);
            const bill = await billService.update(req.user!._id, req.params.id, validatedData);
            sendSuccess(res, bill, 'Bill updated successfully');
        } catch (error: any) {
            if (error.message === 'Bill not found') {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await billService.delete(req.user!._id, req.params.id);
            sendSuccess(res, null, 'Bill deleted successfully');
        } catch (error: any) {
            if (error.message === 'Bill not found') {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }
}

export const billController = new BillController();
