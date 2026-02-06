'use client';

import { usePathname } from 'next/navigation';
import { LogOut, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { getSidebarConfig } from './sidebar-config';
import { SidebarItem } from './sidebar-item';
import { Button } from '@/components/ui/button';
import { Logo } from '../logo';
import { useUIStore } from '@/store/ui.store';
import { useTranslation } from 'react-i18next';

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout, hasFeature } = useAuth();
    const {
        isMobileMenuOpen,
        closeMobileMenu,
        isSidebarCollapsed: isCollapsed,
        toggleSidebarCollapsed: toggleCollapsed
    } = useUIStore();
    const { t } = useTranslation();

    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const sidebarItems = user ? getSidebarConfig(user.role) : [];

    useEffect(() => {
        closeMobileMenu();
    }, [pathname, closeMobileMenu]);

    useEffect(() => {
        const activeItem = sidebarItems.find(item =>
            item.children && item.children.length > 0 && (
                pathname === item.href ||
                pathname.startsWith(item.href + '/')
            )
        );

        if (activeItem) {
            setOpenMenuId(activeItem.href);
        }
    }, [pathname, sidebarItems]);

    if (!user) return null;

    const handleLogout = () => {
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        logout();
        window.location.href = '/login';
    };

    const handleMenuToggle = (menuId: string) => {
        setOpenMenuId(prevId => prevId === menuId ? null : menuId);
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[100] lg:hidden backdrop-blur-sm"
                    onClick={closeMobileMenu}
                />
            )}

            <div
                className={cn(
                    'fixed top-0 left-0 h-screen bg-slate-900 border-r border-white/5 transition-all duration-300 z-[200] overflow-hidden',
                    'w-72', // Fixed width for mobile - wider to fit translated content
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
                    'lg:translate-x-0',
                    isCollapsed ? 'lg:w-20' : 'lg:w-64' // Desktop stays w-64
                )}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-6 border-b border-white/10">
                        {(!isCollapsed || isMobileMenuOpen) && (
                            <div className="flex items-center gap-3">
                                <Logo iconOnly={false} size="md" variant="dark" />
                            </div>
                        )}
                        {(isCollapsed && !isMobileMenuOpen) && (
                            <div className="w-full flex justify-center">
                                <Logo iconOnly={true} size="md" variant="dark" />
                            </div>
                        )}

                        <button
                            onClick={toggleCollapsed}
                            className={cn(
                                'hidden lg:block p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors',
                                isCollapsed && 'absolute -right-3 top-8 bg-slate-800 border border-white/10'
                            )}
                        >
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </button>

                        <button
                            onClick={closeMobileMenu}
                            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1 dark-thin-scrollbar" style={{ paddingLeft: '12px', paddingRight: '8px' }}>
                        {sidebarItems.map((item) => (
                            <SidebarItem
                                key={item.href}
                                item={item}
                                hasFeature={hasFeature}
                                isCollapsed={isCollapsed && !isMobileMenuOpen}
                                isOpen={openMenuId === item.href}
                                onToggle={() => handleMenuToggle(item.href)}
                            />
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/10">
                        {(!isCollapsed || isMobileMenuOpen) ? (
                            <Button
                                onClick={handleLogout}
                                variant="ghost"
                                className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/10 px-3"
                            >
                                <LogOut className="mr-3 h-5 w-5" />
                                {t('common.logout')}
                            </Button>
                        ) : (
                            <button
                                onClick={handleLogout}
                                className="w-full flex justify-center p-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                title={t('common.logout')}
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
