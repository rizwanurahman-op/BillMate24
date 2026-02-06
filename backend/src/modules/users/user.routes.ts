import { Router } from 'express';
import { userController } from './user.controller';
import { storageController } from './storage.controller';
import { authenticate, requireAdmin } from '../../middlewares';

const router = Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

router.post('/', userController.createShopkeeper.bind(userController));
router.get('/', userController.getAllShopkeepers.bind(userController));
router.get('/stats', userController.getShopkeeperStats.bind(userController));
router.get('/storage/total', storageController.getTotalStorage.bind(storageController));
router.get('/storage/comparison', storageController.getStorageComparison.bind(storageController));
router.get('/with-storage', userController.getAllShopkeepersWithStorage.bind(userController));
router.get('/:id', userController.getShopkeeperById.bind(userController));
router.get('/:id/storage', userController.getShopkeeperStorageStats.bind(userController));
router.get('/:id/storage/detailed', storageController.getShopkeeperStorageDetails.bind(storageController));
router.patch('/:id', userController.updateShopkeeper.bind(userController));
router.patch('/:id/features', userController.updateShopkeeperFeatures.bind(userController));
router.patch('/:id/toggle-status', userController.toggleShopkeeperStatus.bind(userController));
router.delete('/:id', userController.deleteShopkeeper.bind(userController));

export const userRoutes = router;
