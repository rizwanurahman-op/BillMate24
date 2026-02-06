import { User } from '../users/user.model';
import { hashPassword, comparePassword, generateTokens, verifyRefreshToken } from '../../utils/auth';
import { LoginInput, RegisterInput, ForgotPasswordInput, VerifyOTPInput, ResetPasswordInput } from './auth.validation';
import { emailService } from '../../utils/email.service';
import { LoginResponse, AuthTokens, IUser } from '../../types';

export class AuthService {
    async login(input: LoginInput): Promise<LoginResponse> {
        const user = await User.findOne({ email: input.email.toLowerCase() });

        if (!user) {
            throw new Error('Invalid email or password');
        }

        if (!user.isActive) {
            throw new Error('Account is deactivated. Please contact admin.');
        }

        const isPasswordValid = await comparePassword(input.password, user.password);

        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        const tokenPayload = {
            userId: user._id.toString(),
            role: user.role,
            features: user.features,
        };

        const tokens = generateTokens(tokenPayload);

        // Save refresh token
        user.refreshToken = tokens.refreshToken;
        await user.save();

        const userResponse = user.toObject();
        delete (userResponse as any).password;
        delete (userResponse as any).refreshToken;

        return {
            user: userResponse as Omit<IUser, 'password' | 'refreshToken'>,
            tokens,
        };
    }

    async register(input: RegisterInput, role: 'admin' | 'shopkeeper' = 'shopkeeper'): Promise<LoginResponse> {
        const existingUser = await User.findOne({ email: input.email.toLowerCase() });

        if (existingUser) {
            throw new Error('Email already registered');
        }

        const hashedPassword = await hashPassword(input.password);

        const user = new User({
            ...input,
            email: input.email.toLowerCase(),
            password: hashedPassword,
            role,
        });

        await user.save();

        const tokenPayload = {
            userId: user._id.toString(),
            role: user.role,
            features: user.features,
        };

        const tokens = generateTokens(tokenPayload);

        user.refreshToken = tokens.refreshToken;
        await user.save();

        const userResponse = user.toObject();
        delete (userResponse as any).password;
        delete (userResponse as any).refreshToken;

        return {
            user: userResponse as Omit<IUser, 'password' | 'refreshToken'>,
            tokens,
        };
    }

    async refreshTokens(refreshToken: string): Promise<AuthTokens> {
        const payload = verifyRefreshToken(refreshToken);

        if (!payload) {
            throw new Error('Invalid or expired refresh token');
        }

        const user = await User.findById(payload.userId);

        if (!user || user.refreshToken !== refreshToken) {
            throw new Error('Invalid refresh token');
        }

        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        const newTokenPayload = {
            userId: user._id.toString(),
            role: user.role,
            features: user.features,
        };

        const tokens = generateTokens(newTokenPayload);

        user.refreshToken = tokens.refreshToken;
        await user.save();

        return tokens;
    }

    async logout(userId: string): Promise<void> {
        await User.findByIdAndUpdate(userId, { refreshToken: null });
    }

    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<void> {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        const isPasswordValid = await comparePassword(currentPassword, user.password);

        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        user.password = await hashPassword(newPassword);
        user.refreshToken = undefined;
        await user.save();
    }

    async getProfile(userId: string): Promise<Omit<IUser, 'password' | 'refreshToken'>> {
        const user = await User.findById(userId).select('-password -refreshToken');

        if (!user) {
            throw new Error('User not found');
        }

        return user.toObject() as Omit<IUser, 'password' | 'refreshToken'>;
    }

    async updateProfile(userId: string, data: { name?: string; phone?: string; businessName?: string; address?: string; place?: string }): Promise<Omit<IUser, 'password' | 'refreshToken'>> {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        if (data.name) user.name = data.name;
        if (data.hasOwnProperty('phone')) user.phone = data.phone;
        if (data.hasOwnProperty('businessName')) user.businessName = data.businessName;
        if (data.hasOwnProperty('address')) user.address = data.address;
        if (data.hasOwnProperty('place')) user.place = data.place;

        await user.save();

        const userResponse = user.toObject();
        delete (userResponse as any).password;
        delete (userResponse as any).refreshToken;

        return userResponse as Omit<IUser, 'password' | 'refreshToken'>;
    }

    async forgotPassword(email: string): Promise<void> {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            throw new Error('User with this email does not exist');
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Set expiry (10 minutes)
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 10);

        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpires = expiry;
        await user.save();

        // Send Email
        await emailService.sendOTP(user.email, otp, user.name);
    }

    async verifyOTP(email: string, otp: string): Promise<boolean> {
        const user = await User.findOne({
            email: email.toLowerCase(),
            resetPasswordOTP: otp,
            resetPasswordOTPExpires: { $gt: new Date() }
        });

        if (!user) {
            throw new Error('Invalid or expired OTP');
        }

        return true;
    }

    async resetPassword(input: ResetPasswordInput): Promise<void> {
        const user = await User.findOne({
            email: input.email.toLowerCase(),
            resetPasswordOTP: input.otp,
            resetPasswordOTPExpires: { $gt: new Date() }
        });

        if (!user) {
            throw new Error('Invalid or expired OTP');
        }

        const hashedPassword = await hashPassword(input.password);
        user.password = hashedPassword;
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpires = undefined;
        user.refreshToken = undefined; // Force logout from all devices
        await user.save();
    }
}

export const authService = new AuthService();
