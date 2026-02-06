import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('5000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
    JWT_ACCESS_SECRET: z.string().min(1, 'JWT access secret is required'),
    JWT_REFRESH_SECRET: z.string().min(1, 'JWT refresh secret is required'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('7d'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
    FRONTEND_URL: z.string().default('http://localhost:3000'),
    RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
    RATE_LIMIT_MAX: z.string().default('100'),
    // Email configuration
    EMAIL_HOST: z.string().default('smtp.gmail.com'),
    EMAIL_PORT: z.string().default('587'),
    EMAIL_USER: z.string().optional(),
    EMAIL_PASSWORD: z.string().optional(),
    EMAIL_FROM: z.string().default('Rizwanurahmanop@gmail.com'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
