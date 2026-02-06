import { Router } from 'express';
import { billController } from './bill.controller';
import { authenticate, requireShopkeeper, requireBilling } from '../../middlewares';

const router = Router();

router.use(authenticate, requireShopkeeper, requireBilling);

router.post('/', billController.create.bind(billController));
router.get('/', billController.getAll.bind(billController));
router.get('/recent', billController.getRecent.bind(billController));
router.get('/stats', billController.getStats.bind(billController));
router.get('/export', billController.export.bind(billController));
router.get('/:id', billController.getById.bind(billController));
router.patch('/:id', billController.update.bind(billController));
router.delete('/:id', billController.delete.bind(billController));

export const billRoutes = router;
