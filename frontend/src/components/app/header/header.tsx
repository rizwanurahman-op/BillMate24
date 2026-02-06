'use client';

import { Bell, Search, Menu, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useUIStore } from '@/store/ui.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Logo } from '../logo';
import { LanguageSwitcher } from './language-switcher';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
    title?: string;
    onMenuClick?: () => void;
    className?: string;
}

export function Header({ title, onMenuClick, className }: HeaderProps) {
    const { user, logout } = useAuth();
    const { toggleMobileMenu } = useUIStore();
    const { t } = useTranslation();
    const router = useRouter();

    const handleLogout = () => {
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        logout();
        window.location.href = '/login';
    };

    return (
        <header
            className={cn(
                "sticky top-0 z-30 h-16 px-4 md:px-6 flex items-center bg-white border-b border-gray-200 shadow-sm",
                className
            )}
        >
            <div className="flex items-center justify-between w-full">
                {/* Left Section */}
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-4">
                    <button
                        onClick={onMenuClick || toggleMobileMenu}
                        className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors flex-shrink-0"
                        aria-label="Toggle menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="lg:hidden flex-shrink-0">
                        <Logo iconOnly size="sm" />
                    </div>

                    {title && (
                        <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">
                            {title}
                        </h1>
                    )}
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
                    {/* Language Switcher */}
                    <LanguageSwitcher />

                    {/* Desktop Search */}
                    <div className="hidden lg:flex items-center relative ml-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="search"
                            placeholder={t('common.search')}
                            className="pl-10 w-64 h-10 bg-gray-50 border-gray-200 rounded-lg focus:bg-white transition-all shadow-sm"
                        />
                    </div>

                    {/* Notifications */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-gray-500 hover:text-gray-700 rounded-lg relative"
                        title={t('common.notifications')}
                    >
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                    </Button>

                    <div className="hidden xs:block w-px h-6 bg-gray-200 mx-1" />

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative h-10 w-10 rounded-lg p-0 hover:bg-gray-100"
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <p className="text-sm font-semibold">{user?.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => router.push('/shopkeeper/settings')}
                                className="cursor-pointer"
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                {t('common.settings')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="cursor-pointer text-red-600"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                {t('common.logout')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
