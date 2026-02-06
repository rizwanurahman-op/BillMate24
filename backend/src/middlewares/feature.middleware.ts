import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/helpers';

type FeatureKey = 'wholesalers' | 'dueCustomers' | 'normalCustomers' | 'billing' | 'reports';

export const requireFeature = (...features: FeatureKey[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            sendError(res, 'Authentication required', 401);
            return;
        }

        // Admin has access to all features
        if (req.user.role === 'admin') {
            next();
            return;
        }

        // Check if shopkeeper has the required features enabled
        const userFeatures = req.user.features;

        const hasAllFeatures = features.every((feature) => userFeatures[feature]);

        if (!hasAllFeatures) {
            sendError(res, 'This feature is not enabled for your account', 403);
            return;
        }

        next();
    };
};

export const requireWholesalers = requireFeature('wholesalers');
export const requireDueCustomers = requireFeature('dueCustomers');
export const requireNormalCustomers = requireFeature('normalCustomers');
export const requireBilling = requireFeature('billing');
export const requireReports = requireFeature('reports');
