import rateLimit from 'express-rate-limit';
import { env } from '../config';

export const rateLimiter = rateLimit({
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10), // 15 minutes default
    max: parseInt(env.RATE_LIMIT_MAX, 10), // 100 requests per window default
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter rate limit for auth endpoints
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 login attempts per 15 minutes
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
