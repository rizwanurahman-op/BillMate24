import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { sendSuccess } from '../../utils/helpers';

export class StorageController {
    /**
     * Get total storage used by all shopkeepers
     */
    async getTotalStorage(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const stats = await userService.getTotalStorageStats();
            sendSuccess(res, stats, 'Total storage stats retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get detailed storage breakdown for a specific shopkeeper
     */
    async getShopkeeperStorageDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const stats = await userService.getDetailedStorageStats(req.params.id);
            sendSuccess(res, stats, 'Detailed storage stats retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get storage comparison across all shopkeepers
     */
    async getStorageComparison(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const comparison = await userService.getStorageComparison();
            sendSuccess(res, comparison, 'Storage comparison retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

export const storageController = new StorageController();
