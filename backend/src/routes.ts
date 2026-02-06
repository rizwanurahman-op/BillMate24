import { Router } from 'express';
import { authRoutes } from './modules/auth';
import { userRoutes } from './modules/users';
import { wholesalerRoutes } from './modules/wholesalers';
import { customerRoutes } from './modules/customers';
import { billRoutes } from './modules/bills';
import { paymentRoutes } from './modules/payments';
import { dashboardRoutes } from './modules/dashboard';
import { invoiceRoutes } from './modules/invoices';

const router = Router();

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/wholesalers', wholesalerRoutes);
router.use('/customers', customerRoutes);
router.use('/bills', billRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/invoices', invoiceRoutes);

export default router;
