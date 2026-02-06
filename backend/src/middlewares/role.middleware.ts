import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/helpers';
import { Role } from '../types';

export const requireRole = (...roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            sendError(res, 'Authentication required', 401);
            return;
        }

        if (!roles.includes(req.user.role)) {
            sendError(res, 'Access denied. Insufficient permissions.', 403);
            return;
        }

        next();
    };
};

export const requireAdmin = requireRole('admin');
export const requireShopkeeper = requireRole('shopkeeper');
export const requireAdminOrShopkeeper = requireRole('admin', 'shopkeeper');
