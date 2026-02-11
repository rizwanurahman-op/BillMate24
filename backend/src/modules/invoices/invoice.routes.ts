import { Router } from 'express';
import { invoiceController } from './invoice.controller';
import { authenticate, requireShopkeeper } from '../../middlewares';

const router = Router();

router.use(authenticate, requireShopkeeper);

// Template and color scheme routes (must be before :id routes)
router.get('/templates', invoiceController.getTemplates.bind(invoiceController));
router.get('/color-schemes', invoiceController.getColorSchemes.bind(invoiceController));

// CRUD routes
router.post('/', invoiceController.create.bind(invoiceController));
router.get('/', invoiceController.getAll.bind(invoiceController));
router.get('/:id', invoiceController.getById.bind(invoiceController));
router.put('/:id', invoiceController.update.bind(invoiceController));
router.delete('/:id', invoiceController.delete.bind(invoiceController));

// Share route
router.post('/:id/share', invoiceController.share.bind(invoiceController));

// PDF generation routes
router.post('/preview', invoiceController.previewPdf.bind(invoiceController));
router.get('/:id/pdf', invoiceController.generatePdf.bind(invoiceController));
router.get('/:id/download', invoiceController.downloadPdf.bind(invoiceController));

export const invoiceRoutes = router;
