import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { createShopkeeperSchema, updateShopkeeperSchema, updateFeaturesSchema } from './user.validation';
import { sendSuccess, sendError, sendPaginated, getPaginationParams } from '../../utils/helpers';

export class UserController {
    async createShopkeeper(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = createShopkeeperSchema.parse(req.body);
            const user = await userService.createShopkeeper(validatedData);
            sendSuccess(res, user, 'Shopkeeper created successfully', 201);
        } catch (error: any) {
            if (error.message === 'Email already registered') {
                sendError(res, error.message, 409);
            } else if (error.message === 'Phone number already registered') {
                sendError(res, error.message, 409);
            } else {
                next(error);
            }
        }
    }

    async getAllShopkeepers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { page, limit } = getPaginationParams(
                req.query.page as string,
                req.query.limit as string
            );
            const result = await userService.getAllShopkeepers(page, limit);
            sendPaginated(res, result.users, {
                page,
                limit,
                total: result.total,
                totalPages: result.totalPages,
            });
        } catch (error) {
            next(error);
        }
    }

    async getShopkeeperById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await userService.getShopkeeperById(req.params.id);
            sendSuccess(res, user, 'Shopkeeper retrieved successfully');
        } catch (error: any) {
            if (error.message === 'Shopkeeper not found') {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }

    async updateShopkeeper(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = updateShopkeeperSchema.parse(req.body);
            const user = await userService.updateShopkeeper(req.params.id, validatedData);
            sendSuccess(res, user, 'Shopkeeper updated successfully');
        } catch (error: any) {
            if (error.message === 'Shopkeeper not found') {
                sendError(res, error.message, 404);
            } else if (error.message === 'Phone number already registered') {
                sendError(res, error.message, 409);
            } else {
                next(error);
            }
        }
    }

    async updateShopkeeperFeatures(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { features } = updateFeaturesSchema.parse(req.body);
            const user = await userService.updateShopkeeperFeatures(req.params.id, features);
            sendSuccess(res, user, 'Features updated successfully');
        } catch (error: any) {
            if (error.message === 'Shopkeeper not found') {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }

    async toggleShopkeeperStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await userService.toggleShopkeeperStatus(req.params.id);
            sendSuccess(res, user, `Shopkeeper ${user.isActive ? 'activated' : 'deactivated'} successfully`);
        } catch (error: any) {
            if (error.message === 'Shopkeeper not found') {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }

    async deleteShopkeeper(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await userService.deleteShopkeeper(req.params.id);
            sendSuccess(res, null, 'Shopkeeper deleted successfully');
        } catch (error: any) {
            if (error.message === 'Shopkeeper not found') {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }

    async getShopkeeperStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const stats = await userService.getShopkeeperStats();
            sendSuccess(res, stats, 'Stats retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getShopkeeperStorageStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const stats = await userService.getShopkeeperStorageStats(req.params.id);
            sendSuccess(res, stats, 'Storage stats retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getAllShopkeepersWithStorage(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { page, limit } = getPaginationParams(
                req.query.page as string,
                req.query.limit as string
            );
            const result = await userService.getAllShopkeepersWithStorage(page, limit);
            sendPaginated(res, result.users, {
                page,
                limit,
                total: result.total,
                totalPages: result.totalPages,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const userController = new UserController();
