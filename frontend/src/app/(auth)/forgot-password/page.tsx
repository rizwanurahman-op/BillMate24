'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Loader2,
    Mail,
    Lock,
    ArrowLeft,
    CheckCircle2,
    Eye,
    EyeOff,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/config/axios';
import { toast } from 'sonner';
import Link from 'next/link';
import { Logo } from '@/components/app/logo';

const emailSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

const resetSchema = z.object({
    otp: z.string().length(6, 'OTP must be 6 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type EmailInput = z.infer<typeof emailSchema>;
type ResetInput = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
    const [isLoading, setIsLoading] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const emailForm = useForm<EmailInput>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: '' },
    });

    const resetForm = useForm<ResetInput>({
        resolver: zodResolver(resetSchema),
        defaultValues: { otp: '', password: '', confirmPassword: '' },
    });

    const onEmailSubmit = async (data: EmailInput) => {
        setIsLoading(true);
        try {
            await api.post('/auth/forgot-password', data);
            setUserEmail(data.email);
            setStep('otp');
            toast.success('OTP sent to your email');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const onResetSubmit = async (data: ResetInput) => {
        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', {
                email: userEmail,
                ...data
            });
            setStep('success');
            toast.success('Password reset successful');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Invalid OTP or expired');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="flex justify-center mb-4">
                    <Logo size="lg" />
                </div>

                <Card className="shadow-sm border-gray-200">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">
                            {step === 'email' && 'Forgot Password'}
                            {step === 'otp' && 'Verify OTP'}
                            {step === 'success' && 'Success!'}
                        </CardTitle>
                        <CardDescription>
                            {step === 'email' && "Enter your email to receive a password reset code"}
                            {step === 'otp' && `Enter the 6-digit code sent to ${userEmail}`}
                            {step === 'success' && "Your password has been reset successfully"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {step === 'email' && (
                            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="email"
                                            placeholder="name@example.com"
                                            className="pl-10"
                                            {...emailForm.register('email')}
                                        />
                                    </div>
                                    {emailForm.formState.errors.email && (
                                        <p className="text-xs text-red-500">{emailForm.formState.errors.email.message}</p>
                                    )}
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Send Reset Code
                                </Button>
                                <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                                    <ArrowLeft className="h-4 w-4" /> Back to Login
                                </Link>
                            </form>
                        )}

                        {step === 'otp' && (
                            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="otp">Enter 6-Digit Code</Label>
                                    <Input
                                        id="otp"
                                        placeholder="000000"
                                        className="text-center text-2xl tracking-widest font-bold"
                                        maxLength={6}
                                        {...resetForm.register('otp')}
                                    />
                                    {resetForm.formState.errors.otp && (
                                        <p className="text-xs text-red-500 text-center">{resetForm.formState.errors.otp.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            className="pl-10"
                                            {...resetForm.register('password')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-gray-400"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="pl-10"
                                            {...resetForm.register('confirmPassword')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-3 text-gray-400"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {resetForm.formState.errors.confirmPassword && (
                                        <p className="text-xs text-red-500">{resetForm.formState.errors.confirmPassword.message}</p>
                                    )}
                                </div>

                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Reset Password
                                </Button>
                            </form>
                        )}

                        {step === 'success' && (
                            <div className="text-center space-y-4">
                                <div className="flex justify-center">
                                    <div className="p-3 bg-green-100 rounded-full text-green-600">
                                        <CheckCircle2 className="h-12 w-12" />
                                    </div>
                                </div>
                                <p className="text-gray-600">Your password has been successfully updated. You can now log in with your new password.</p>
                                <Button onClick={() => router.push('/login')} className="w-full bg-blue-600 hover:bg-blue-700">
                                    Go to Login
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
