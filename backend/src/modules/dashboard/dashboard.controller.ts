import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/helpers';

export class DashboardController {
    async getShopkeeperDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dashboard = await dashboardService.getShopkeeperDashboard(req.user!._id);
            sendSuccess(res, dashboard, 'Dashboard retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getDailyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dateStr = req.query.date as string;
            const date = dateStr ? new Date(dateStr) : new Date();
            const report = await dashboardService.getDailyReport(req.user!._id, date);
            sendSuccess(res, report, 'Daily report retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getMonthlyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const year = parseInt(req.query.year as string) || new Date().getFullYear();
            const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
            const report = await dashboardService.getMonthlyReport(req.user!._id, year, month);
            sendSuccess(res, report, 'Monthly report retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getOutstandingDues(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const report = await dashboardService.getOutstandingDuesReport(req.user!._id);
            sendSuccess(res, report, 'Outstanding dues report retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

export const dashboardController = new DashboardController();
