import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate, requireShopkeeper, requireReports } from '../../middlewares';

const router = Router();

router.use(authenticate, requireShopkeeper);

router.get('/', dashboardController.getShopkeeperDashboard.bind(dashboardController));
router.get('/daily', requireReports, dashboardController.getDailyReport.bind(dashboardController));
router.get('/monthly', requireReports, dashboardController.getMonthlyReport.bind(dashboardController));
router.get('/outstanding-dues', requireReports, dashboardController.getOutstandingDues.bind(dashboardController));

export const dashboardRoutes = router;
