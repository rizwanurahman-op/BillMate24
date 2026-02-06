import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config';
import { TokenPayload, AuthTokens } from '../types';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
    password: string,
    hashedPassword: string
): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
};

export const generateAccessToken = (payload: TokenPayload): string => {
    const secret: Secret = env.JWT_ACCESS_SECRET;
    const options: SignOptions = {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN as string as any,
    };
    return jwt.sign({ ...payload }, secret, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
    const secret: Secret = env.JWT_REFRESH_SECRET;
    const options: SignOptions = {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as string as any,
    };
    return jwt.sign({ ...payload }, secret, options);
};

export const generateTokens = (payload: TokenPayload): AuthTokens => {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
};

export const verifyAccessToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    } catch {
        return null;
    }
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch {
        return null;
    }
};
