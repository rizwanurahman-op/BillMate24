'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, Lock, Store, Settings, Calendar, Shield, Smartphone, Mail, AlertCircle, Eye, EyeOff, Navigation } from 'lucide-react';
import axios from '@/config/axios';
import { Header } from '@/components/app/header';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { updateUser } = useAuthStore();
    const [isProfileUpdating, setIsProfileUpdating] = useState(false);
    const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Fetch fresh user profile on mount to ensure all fields are up-to-date
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get('/auth/profile');
                updateUser(response.data.data);
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            }
        };
        fetchProfile();
    }, [updateUser]);

    // --- Validation Schemas ---
    const profileSchema = useMemo(() => z.object({
        name: z.string().min(2, t('settings_page.name_min')),
        phone: z.string().optional(),
        businessName: z.string().optional(),
        address: z.string().optional(),
        place: z.string().optional(),
    }), [t]);

    const passwordSchema = useMemo(() => z.object({
        currentPassword: z.string().min(6, t('settings_page.password_required')),
        newPassword: z.string().min(6, t('settings_page.new_password_min')),
        confirmNewPassword: z.string().min(6, t('settings_page.confirm_password_required')),
    }).refine((data) => data.newPassword === data.confirmNewPassword, {
        message: t('settings_page.passwords_mismatch'),
        path: ["confirmNewPassword"],
    }), [t]);

    type ProfileFormValues = z.infer<typeof profileSchema>;
    type PasswordFormValues = z.infer<typeof passwordSchema>;

    // Profile Form
    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || '',
            phone: user?.phone || '',
            businessName: user?.businessName || '',
            address: user?.address || '',
            place: user?.place || '',
        },
    });

    // Password Form
    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
        },
    });

    // Reset profile form when user data changes (e.g., after login or update)
    useEffect(() => {
        if (user) {
            profileForm.reset({
                name: user.name || '',
                phone: user.phone || '',
                businessName: user.businessName || '',
                address: user.address || '',
                place: user.place || '',
            });
        }
    }, [user, profileForm]);

    const onProfileSubmit = async (data: ProfileFormValues) => {
        setIsProfileUpdating(true);
        try {
            const response = await axios.patch('/auth/profile', data);
            updateUser(response.data.data);
            toast.success(t('settings_page.update_success'));
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('settings_page.update_failed'));
        } finally {
            setIsProfileUpdating(false);
        }
    };

    const onPasswordSubmit = async (data: PasswordFormValues) => {
        setIsPasswordUpdating(true);
        try {
            await axios.post('/auth/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            toast.success(t('settings_page.password_success'));
            passwordForm.reset();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('settings_page.password_failed'));
        } finally {
            setIsPasswordUpdating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-purple-50">
            <Header title={t('common.settings')} />

            <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent">
                                {t('settings_page.account_settings')}
                            </h2>
                            <Settings className="h-5 w-5 md:h-8 md:w-8 text-purple-900" />
                        </div>
                        <p className="text-gray-600 mt-0.5 md:mt-1 flex items-center gap-1.5 md:gap-2 text-xs md:text-base">
                            <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span className="hidden md:inline">{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
                            <span className="md:hidden">{format(new Date(), 'EEE, MMM d')}</span>
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="profile" className="w-full space-y-6">
                    <div className="sticky top-[73px] z-10 bg-gradient-to-b from-gray-50/95 to-transparent pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                        <TabsList className="grid w-full md:w-[400px] grid-cols-2 bg-white/50 backdrop-blur border shadow-sm">
                            <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:text-purple-900 data-[state=active]:shadow-sm">
                                <User className="h-4 w-4 mr-2" />
                                {t('common.profile')}
                            </TabsTrigger>
                            <TabsTrigger value="security" className="data-[state=active]:bg-white data-[state=active]:text-purple-900 data-[state=active]:shadow-sm">
                                <Shield className="h-4 w-4 mr-2" />
                                {t('settings_page.security')}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <Card className="border-0 shadow-lg overflow-hidden rounded-xl md:rounded-2xl bg-white/80 backdrop-blur-sm">
                            <CardHeader className="border-b bg-gray-50/50">
                                <CardTitle className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-purple-100">
                                        <User className="h-5 w-5 text-purple-700" />
                                    </div>
                                    {t('settings_page.personal_info')}
                                </CardTitle>
                                <CardDescription>
                                    {t('settings_page.personal_info_desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-gray-700">{t('settings_page.full_name')}</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="name"
                                                    placeholder="John Doe"
                                                    {...profileForm.register('name')}
                                                    className="pl-10 h-11 bg-white/50 focus:bg-white transition-colors"
                                                />
                                            </div>
                                            {profileForm.formState.errors.name && (
                                                <p className="text-xs text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {profileForm.formState.errors.name.message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-gray-700">{t('settings_page.phone_number')}</Label>
                                            <div className="relative">
                                                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="phone"
                                                    placeholder="+1234567890"
                                                    {...profileForm.register('phone')}
                                                    className="pl-10 h-11 bg-white/50 focus:bg-white transition-colors"
                                                />
                                            </div>
                                            {profileForm.formState.errors.phone && (
                                                <p className="text-xs text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {profileForm.formState.errors.phone.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-gray-700">{t('settings_page.email_address')}</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="email"
                                                value={user?.email || ''}
                                                disabled
                                                className="pl-10 h-11 bg-gray-100/50"
                                            />
                                        </div>
                                        <p className="text-[11px] text-gray-500 flex items-center gap-1">
                                            <Lock className="h-3 w-3" />
                                            {t('settings_page.email_locked_desc')}
                                        </p>
                                    </div>

                                    <div className="relative my-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-purple-100" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-white px-2 text-gray-500 font-medium tracking-wider">{t('settings_page.business_details')}</span>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="businessName" className="text-gray-700">{t('settings_page.business_name')}</Label>
                                            <div className="relative">
                                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="businessName"
                                                    placeholder="My Awesome Shop"
                                                    {...profileForm.register('businessName')}
                                                    className="pl-10 h-11 bg-white/50 focus:bg-white transition-colors"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="address" className="text-gray-700">{t('settings_page.address')}</Label>
                                            <Input
                                                id="address"
                                                placeholder="123 Main St, City"
                                                {...profileForm.register('address')}
                                                className="h-11 bg-white/50 focus:bg-white transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="place" className="text-gray-700">{t('settings_page.place')}</Label>
                                            <div className="relative">
                                                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="place"
                                                    placeholder={t('settings_page.place_placeholder')}
                                                    {...profileForm.register('place')}
                                                    className="pl-10 h-11 bg-white/50 focus:bg-white transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-gray-100">
                                        <Button
                                            type="submit"
                                            disabled={isProfileUpdating}
                                            className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 shadow-md transition-all active:scale-95"
                                        >
                                            {isProfileUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {t('common.save_changes')}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <Card className="border-0 shadow-lg overflow-hidden rounded-xl md:rounded-2xl bg-white/80 backdrop-blur-sm">
                            <CardHeader className="border-b bg-gray-50/50">
                                <CardTitle className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-orange-100">
                                        <Lock className="h-5 w-5 text-orange-600" />
                                    </div>
                                    {t('settings_page.password_security')}
                                </CardTitle>
                                <CardDescription>
                                    {t('settings_page.password_security_desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6 max-w-2xl">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">{t('settings_page.current_password')}</Label>
                                        <div className="relative">
                                            <Input
                                                id="currentPassword"
                                                type={showCurrentPassword ? "text" : "password"}
                                                {...passwordForm.register('currentPassword')}
                                                className="h-11 pr-10 bg-white/50 focus:bg-white transition-colors"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                                tabIndex={-1}
                                            >
                                                {showCurrentPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                        {passwordForm.formState.errors.currentPassword && (
                                            <p className="text-xs text-red-500 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {passwordForm.formState.errors.currentPassword.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">{t('settings_page.new_password')}</Label>
                                            <div className="relative">
                                                <Input
                                                    id="newPassword"
                                                    type={showNewPassword ? "text" : "password"}
                                                    {...passwordForm.register('newPassword')}
                                                    className="h-11 pr-10 bg-white/50 focus:bg-white transition-colors"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                                    tabIndex={-1}
                                                >
                                                    {showNewPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                            {passwordForm.formState.errors.newPassword && (
                                                <p className="text-xs text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {passwordForm.formState.errors.newPassword.message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmNewPassword">{t('settings_page.confirm_new_password')}</Label>
                                            <div className="relative">
                                                <Input
                                                    id="confirmNewPassword"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    {...passwordForm.register('confirmNewPassword')}
                                                    className="h-11 pr-10 bg-white/50 focus:bg-white transition-colors"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                                    tabIndex={-1}
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                            {passwordForm.formState.errors.confirmNewPassword && (
                                                <p className="text-xs text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {passwordForm.formState.errors.confirmNewPassword.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-sm text-blue-700">
                                        <Shield className="h-5 w-5 flex-shrink-0" />
                                        <p>
                                            {t('settings_page.password_requirements')}
                                        </p>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            type="submit"
                                            disabled={isPasswordUpdating}
                                            className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 shadow-md transition-all active:scale-95"
                                        >
                                            {isPasswordUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {t('settings_page.update_password')}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
