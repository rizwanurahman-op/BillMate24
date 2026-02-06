import { Router } from 'express';
import { wholesalerController } from './wholesaler.controller';
import { authenticate, requireShopkeeper, requireWholesalers } from '../../middlewares';

const router = Router();

router.use(authenticate, requireShopkeeper, requireWholesalers);

router.post('/', wholesalerController.create.bind(wholesalerController));
router.get('/', wholesalerController.getAll.bind(wholesalerController));
router.get('/export', wholesalerController.export.bind(wholesalerController));
router.get('/stats', wholesalerController.getStats.bind(wholesalerController));
router.get('/dashboard', wholesalerController.getDashboardStats.bind(wholesalerController));
router.get('/:id', wholesalerController.getById.bind(wholesalerController));
router.patch('/:id', wholesalerController.update.bind(wholesalerController));
router.patch('/:id/restore', wholesalerController.restore.bind(wholesalerController));
router.delete('/:id', wholesalerController.delete.bind(wholesalerController));

export const wholesalerRoutes = router;
