import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { loginSchema, registerSchema, refreshTokenSchema, changePasswordSchema, forgotPasswordSchema, verifyOTPSchema, resetPasswordSchema } from './auth.validation';
import { updateShopkeeperSchema } from '../users/user.validation';
import { sendSuccess, sendError } from '../../utils/helpers';

export class AuthController {
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = loginSchema.parse(req.body);
            const result = await authService.login(validatedData);
            sendSuccess(res, result, 'Login successful');
        } catch (error: any) {
            if (error.message === 'Invalid email or password' ||
                error.message === 'Account is deactivated. Please contact admin.') {
                sendError(res, error.message, 401);
            } else {
                next(error);
            }
        }
    }

    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = registerSchema.parse(req.body);
            const result = await authService.register(validatedData);
            sendSuccess(res, result, 'Registration successful', 201);
        } catch (error: any) {
            if (error.message === 'Email already registered') {
                sendError(res, error.message, 409);
            } else {
                next(error);
            }
        }
    }

    async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { refreshToken } = refreshTokenSchema.parse(req.body);
            const tokens = await authService.refreshTokens(refreshToken);
            sendSuccess(res, tokens, 'Tokens refreshed successfully');
        } catch (error: any) {
            if (error.message.includes('refresh token')) {
                sendError(res, error.message, 401);
            } else {
                next(error);
            }
        }
    }

    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                sendError(res, 'Authentication required', 401);
                return;
            }
            await authService.logout(req.user._id);
            sendSuccess(res, null, 'Logout successful');
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                sendError(res, 'Authentication required', 401);
                return;
            }
            const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
            await authService.changePassword(req.user._id, currentPassword, newPassword);
            sendSuccess(res, null, 'Password changed successfully');
        } catch (error: any) {
            if (error.message === 'Current password is incorrect') {
                sendError(res, error.message, 400);
            } else {
                next(error);
            }
        }
    }

    async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                sendError(res, 'Authentication required', 401);
                return;
            }
            const profile = await authService.getProfile(req.user._id);
            sendSuccess(res, profile, 'Profile retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                sendError(res, 'Authentication required', 401);
                return;
            }
            const validatedData = updateShopkeeperSchema.parse(req.body);
            const updatedUser = await authService.updateProfile(req.user._id, validatedData);
            sendSuccess(res, updatedUser, 'Profile updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email } = forgotPasswordSchema.parse(req.body);
            await authService.forgotPassword(email);
            sendSuccess(res, null, 'OTP sent to your email');
        } catch (error: any) {
            if (error.message === 'User with this email does not exist') {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }

    async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, otp } = verifyOTPSchema.parse(req.body);
            await authService.verifyOTP(email, otp);
            sendSuccess(res, null, 'OTP verified successfully');
        } catch (error: any) {
            if (error.message === 'Invalid or expired OTP') {
                sendError(res, error.message, 400);
            } else {
                next(error);
            }
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = resetPasswordSchema.parse(req.body);
            await authService.resetPassword(validatedData);
            sendSuccess(res, null, 'Password reset successfully');
        } catch (error: any) {
            if (error.message === 'Invalid or expired OTP') {
                sendError(res, error.message, 400);
            } else {
                next(error);
            }
        }
    }
}

export const authController = new AuthController();
