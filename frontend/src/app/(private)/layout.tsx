'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/app/sidebar';
import { BottomNav } from '@/components/app/bottom-nav';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';
import api from '@/config/axios';
import Cookies from 'js-cookie';

export default function PrivateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, user, isHydrated, setAuth, logout } = useAuthStore();
    const { isSidebarCollapsed } = useUIStore();
    const [mounted, setMounted] = useState(false);
    const [isRestoringAuth, setIsRestoringAuth] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Attempt to restore user profile if we have tokens but no user data
    const attemptProfileRestore = useCallback(async () => {
        const accessToken = Cookies.get('accessToken');
        const refreshToken = Cookies.get('refreshToken');

        // If we have tokens but no user, try to restore profile
        if ((accessToken || refreshToken) && !user && !isRestoringAuth) {
            setIsRestoringAuth(true);
            console.log('Attempting to restore user profile from tokens...');

            try {
                const response = await api.get('/auth/profile');
                if (response.data?.data) {
                    const currentAccessToken = Cookies.get('accessToken');
                    const currentRefreshToken = Cookies.get('refreshToken');
                    setAuth(response.data.data, {
                        accessToken: currentAccessToken || '',
                        refreshToken: currentRefreshToken || '',
                    });
                    console.log('User profile restored successfully');
                    setIsRestoringAuth(false);
                    return true;
                }
            } catch (error) {
                console.error('Failed to restore user profile:', error);
                // Profile fetch failed - tokens are likely invalid
                logout();
                setIsRestoringAuth(false);
                return false;
            }
            setIsRestoringAuth(false);
        }
        return false;
    }, [user, isRestoringAuth, setAuth, logout]);

    useEffect(() => {
        // Only check auth after hydration is complete
        if (mounted && isHydrated) {
            if (!isAuthenticated && !isRestoringAuth) {
                // Before redirecting to login, try to restore profile from cookies
                const accessToken = Cookies.get('accessToken');
                const refreshToken = Cookies.get('refreshToken');

                if (accessToken || refreshToken) {
                    attemptProfileRestore();
                } else {
                    router.push('/login');
                }
            }
        }
    }, [isAuthenticated, isHydrated, mounted, router, isRestoringAuth, attemptProfileRestore]);

    // Fallback timeout - if still loading after 10 seconds, redirect to login
    useEffect(() => {
        if (!mounted || !isHydrated) return;

        const timeout = setTimeout(() => {
            if (!user && !isAuthenticated) {
                console.log('Auth restoration timeout - redirecting to login');
                logout();
                router.push('/login');
            }
        }, 10000);

        return () => clearTimeout(timeout);
    }, [mounted, isHydrated, user, isAuthenticated, logout, router]);

    // Show loading while hydrating or restoring auth
    if (!mounted || !isHydrated || isRestoringAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    // Redirect if not authenticated
    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <main
                className={cn(
                    "min-h-screen transition-all duration-300",
                    // Large Desktop (lg+) margin for sidebar
                    isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64",
                    // Mobile & Tablet: bottom padding for bottom nav
                    "pb-20 lg:pb-0"
                )}
            >
                {children}
            </main>
            {/* Mobile Bottom Navigation */}
            <BottomNav />
        </div>
    );
}

