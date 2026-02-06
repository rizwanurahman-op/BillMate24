import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/helpers';
import { ZodError } from 'zod';

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error('Error:', error);

    // Zod validation error
    if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        sendError(res, 'Validation error', 400, messages.join(', '));
        return;
    }

    // MongoDB duplicate key error
    if (error.name === 'MongoServerError' && (error as any).code === 11000) {
        const field = Object.keys((error as any).keyValue)[0];
        const formattedField = field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Entry';
        sendError(res, `${formattedField} already exists`, 409);
        return;
    }

    // MongoDB validation error
    if (error.name === 'ValidationError') {
        sendError(res, error.message, 400);
        return;
    }

    // MongoDB cast error (invalid ObjectId)
    if (error.name === 'CastError') {
        sendError(res, 'Invalid ID format', 400);
        return;
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        sendError(res, 'Invalid token', 401);
        return;
    }

    if (error.name === 'TokenExpiredError') {
        sendError(res, 'Token expired', 401);
        return;
    }

    // Default error
    sendError(
        res,
        process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message,
        500
    );
};
