'use client';

import { useAuthStore } from '@/store/auth.store';
import { User, Features } from '@/types';

export function useAuth() {
    const { user, isAuthenticated, logout, setAuth, updateUser } = useAuthStore();

    const isAdmin = user?.role === 'admin';
    const isShopkeeper = user?.role === 'shopkeeper';

    const hasFeature = (feature: keyof Features): boolean => {
        if (!user) return false;
        if (isAdmin) return true;
        return user.features[feature];
    };

    return {
        user,
        isAuthenticated,
        isAdmin,
        isShopkeeper,
        hasFeature,
        logout,
        setAuth,
        updateUser,
    };
}
