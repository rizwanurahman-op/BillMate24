'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Receipt,
    Users,
    Package,
    BarChart3,
    Store,
    Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';

interface NavItem {
    href: string;
    label: string;
    icon: any;
    activePrefix?: string;
}

const shopkeeperItems: NavItem[] = [
    { href: '/shopkeeper/dashboard', label: 'bottom_nav.home', icon: LayoutDashboard },
    { href: '/shopkeeper/billing', label: 'bottom_nav.bill', icon: Receipt },
    { href: '/shopkeeper/customers/due', label: 'bottom_nav.customers', icon: Users, activePrefix: '/shopkeeper/customers' },
    { href: '/shopkeeper/wholesalers/payments', label: 'bottom_nav.wholesalers', icon: Package, activePrefix: '/shopkeeper/wholesalers' },
    { href: '/shopkeeper/reports/daily', label: 'bottom_nav.reports', icon: BarChart3, activePrefix: '/shopkeeper/reports' },
];

const adminItems: NavItem[] = [
    { href: '/admin/dashboard', label: 'bottom_nav.home', icon: LayoutDashboard },
    { href: '/admin/shopkeepers', label: 'bottom_nav.shops', icon: Store },
    { href: '/admin/settings', label: 'bottom_nav.settings', icon: Settings },
];

export function BottomNav() {
    const { t } = useTranslation();
    const pathname = usePathname();
    const { user, isAdmin } = useAuth();

    if (!user) return null;

    const navItems = isAdmin ? adminItems : shopkeeperItems;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/60 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)] safe-area-bottom">
            <div className="flex items-center justify-around h-[64px] px-1">
                {navItems.map((item) => {
                    const activePrefix = item.activePrefix || item.href;
                    const isActive = pathname === item.href || pathname.startsWith(activePrefix + '/');
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                // Base styles - 44px minimum touch target
                                'flex flex-col items-center justify-center flex-1 min-w-[44px] h-full py-1.5 rounded-xl transition-all duration-200',
                                // Active/Inactive states
                                isActive
                                    ? 'text-purple-600'
                                    : 'text-gray-400 hover:text-gray-600 active:text-gray-700'
                            )}
                        >
                            {/* Icon Container */}
                            <div className={cn(
                                'relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-300',
                                isActive && 'bg-purple-100'
                            )}>
                                <Icon className={cn(
                                    'h-5 w-5 transition-all duration-200',
                                    isActive && 'scale-105'
                                )} />
                                {/* Active indicator dot */}
                                {isActive && (
                                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-500" />
                                )}
                            </div>

                            {/* Label */}
                            <span className={cn(
                                'text-[10px] mt-0.5 font-medium transition-all duration-200 truncate max-w-full px-0.5',
                                isActive && 'font-semibold text-purple-600'
                            )}>
                                {t(item.label)}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
