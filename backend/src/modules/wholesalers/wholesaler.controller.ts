import { Request, Response, NextFunction } from 'express';
import { wholesalerService } from './wholesaler.service';
import { createWholesalerSchema, updateWholesalerSchema } from './wholesaler.validation';
import { sendSuccess, sendError, sendPaginated, getPaginationParams } from '../../utils/helpers';

export class WholesalerController {
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = createWholesalerSchema.parse(req.body);
            const wholesaler = await wholesalerService.create(req.user!._id, validatedData);
            sendSuccess(res, wholesaler, 'Wholesaler created successfully', 201);
        } catch (error: any) {
            if (error.message === 'Phone number already exists for another wholesaler') {
                sendError(res, error.message, 409);
            } else if (error.message === 'WhatsApp number already exists for another wholesaler') {
                sendError(res, error.message, 409);
            } else {
                next(error);
            }
        }
    }

    async export(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const search = req.query.search as string | undefined;
            const status = req.query.status as 'all' | 'active' | 'inactive' | undefined;
            const duesFilter = req.query.duesFilter as 'all' | 'with_dues' | 'clear' | undefined;
            const sortBy = req.query.sortBy as 'name' | 'purchases' | 'outstanding' | 'createdAt' | undefined;
            const includeDeleted = req.query.includeDeleted === 'true';

            // Fetch with a large limit for export
            const result = await wholesalerService.getAll(
                req.user!._id,
                1,
                10000,
                search,
                includeDeleted,
                status,
                duesFilter,
                sortBy
            );
            sendSuccess(res, result.wholesalers, 'Wholesalers retrieved for export');
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
            const status = req.query.status as 'all' | 'active' | 'inactive' | undefined;
            const duesFilter = req.query.duesFilter as 'all' | 'with_dues' | 'clear' | undefined;
            const sortBy = req.query.sortBy as 'name' | 'purchases' | 'outstanding' | 'createdAt' | undefined;

            const includeDeleted = req.query.includeDeleted === 'true';

            const result = await wholesalerService.getAll(
                req.user!._id,
                page,
                limit,
                search,
                includeDeleted,
                status,
                duesFilter,
                sortBy
            );
            sendPaginated(res, result.wholesalers, {
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
            const wholesaler = await wholesalerService.getById(req.user!._id, req.params.id);
            sendSuccess(res, wholesaler, 'Wholesaler retrieved successfully');
        } catch (error: any) {
            if (error.message === 'Wholesaler not found') {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = updateWholesalerSchema.parse(req.body);
            const wholesaler = await wholesalerService.update(req.user!._id, req.params.id, validatedData);
            sendSuccess(res, wholesaler, 'Wholesaler updated successfully');
        } catch (error: any) {
            if (error.message === 'Wholesaler not found') {
                sendError(res, error.message, 404);
            } else if (error.message === 'Phone number already exists for another wholesaler') {
                sendError(res, error.message, 409);
            } else if (error.message === 'WhatsApp number already exists for another wholesaler') {
                sendError(res, error.message, 409);
            } else {
                next(error);
            }
        }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await wholesalerService.delete(req.user!._id, req.params.id);
            sendSuccess(res, null, 'Wholesaler deleted successfully');
        } catch (error: any) {
            if (error.message === 'Wholesaler not found') {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }

    async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const stats = await wholesalerService.getDashboardStats(req.user!._id);
            sendSuccess(res, stats, 'Dashboard stats retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const stats = await wholesalerService.getStats(req.user!._id);
            sendSuccess(res, stats, 'Wholesaler stats retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const wholesaler = await wholesalerService.restore(req.user!._id, req.params.id);
            sendSuccess(res, wholesaler, 'Wholesaler restored successfully');
        } catch (error: any) {
            if (error.message.includes('not found')) {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }
}

export const wholesalerController = new WholesalerController();
