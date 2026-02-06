import { Router } from 'express';
import { customerController } from './customer.controller';
import { authenticate, requireShopkeeper, requireDueCustomers } from '../../middlewares';

const router = Router();

router.use(authenticate, requireShopkeeper);

router.post('/', requireDueCustomers, customerController.create.bind(customerController));
router.get('/', customerController.getAll.bind(customerController));
router.get('/export', customerController.export.bind(customerController));
router.get('/stats', customerController.getStats.bind(customerController));
router.get('/due-dashboard', requireDueCustomers, customerController.getDueDashboard.bind(customerController));
router.get('/:id', customerController.getById.bind(customerController));
router.patch('/:id', customerController.update.bind(customerController));
router.patch('/:id/restore', customerController.restore.bind(customerController));
router.delete('/:id', customerController.delete.bind(customerController));

export const customerRoutes = router;
