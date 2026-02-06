import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth';
import { sendError } from '../utils/helpers';
import { User } from '../modules/users/user.model';
import { IUser, TokenPayload } from '../types';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
            tokenPayload?: TokenPayload;
        }
    }
}

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const queryToken = req.query.token as string;

        // Check for token in header or query parameter (for iframe PDF loading)
        let token: string | null = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (queryToken) {
            token = queryToken;
        }

        if (!token) {
            sendError(res, 'Access token is required', 401);
            return;
        }

        const payload = verifyAccessToken(token);

        if (!payload) {
            sendError(res, 'Invalid or expired access token', 401);
            return;
        }

        const user = await User.findById(payload.userId).select('-password');

        if (!user) {
            sendError(res, 'User not found', 401);
            return;
        }

        if (!user.isActive) {
            sendError(res, 'Account is deactivated', 403);
            return;
        }

        req.user = user.toObject() as IUser;
        req.tokenPayload = payload;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        sendError(res, 'Authentication failed', 401);
    }
};
