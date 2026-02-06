import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authenticate, requireShopkeeper } from '../../middlewares';

const router = Router();

router.use(authenticate, requireShopkeeper);

router.post('/', paymentController.create.bind(paymentController));
router.get('/', paymentController.getAll.bind(paymentController));
router.get('/recent', paymentController.getRecent.bind(paymentController));
router.get('/export', paymentController.export.bind(paymentController));
router.get('/:entityType/:entityId', paymentController.getByEntity.bind(paymentController));

export const paymentRoutes = router;
