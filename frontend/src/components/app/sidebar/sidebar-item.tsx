'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { SidebarItem as SidebarItemType } from './sidebar-config';
import { Features } from '@/types';

interface SidebarItemProps {
    item: SidebarItemType;
    hasFeature: (feature: keyof Features) => boolean;
    isCollapsed?: boolean;
    isOpen?: boolean;
    onToggle?: () => void;
}

export function SidebarItem({ item, hasFeature, isCollapsed, isOpen = false, onToggle }: SidebarItemProps) {
    const pathname = usePathname();
    const { t } = useTranslation();

    // Helper to get translation key from title
    const getTranslationKey = (title: string) => {
        if (title.startsWith('sidebar.')) return title;
        return `sidebar.${title.toLowerCase().replace(/\s+/g, '_')}`;
    };

    // Check if item should be visible based on feature
    if (item.feature && !hasFeature(item.feature)) {
        return null;
    }

    const hasChildren = item.children && item.children.length > 0;
    const Icon = item.icon;

    // Filter children based on features
    const visibleChildren = item.children?.filter(
        (child) => !child.feature || hasFeature(child.feature)
    );

    // Check if current path matches this item or any of its children
    const isPathActive = (href: string) => {
        return pathname === href || pathname.startsWith(href + '/');
    };

    const isActiveExact = isPathActive(item.href);
    const isChildActive = visibleChildren?.some(
        (child) => isPathActive(child.href)
    );
    const isActive = isActiveExact || isChildActive;



    // Handle parent menu click
    const handleParentClick = (e: React.MouseEvent) => {
        if (hasChildren && onToggle) {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
        }
        // If no children, let the Link handle navigation
    };

    // Collapsed state - show tooltip with submenu on hover (simplified: just link)
    if (isCollapsed) {
        // When collapsed, clicking navigates to the main href
        return (
            <Link
                href={hasChildren && visibleChildren && visibleChildren.length > 0
                    ? visibleChildren[0].href
                    : item.href}
                className={cn(
                    'flex items-center justify-center p-3 rounded-lg transition-all duration-200',
                    isActive
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                )}
                title={t(getTranslationKey(item.title))}
            >
                <Icon className="h-5 w-5" />
            </Link>
        );
    }

    // If has children - render as expandable menu
    if (hasChildren && visibleChildren && visibleChildren.length > 0) {
        return (
            <div>
                {/* Parent menu item - only toggles expand/collapse, does NOT navigate */}
                <button
                    onClick={handleParentClick}
                    className={cn(
                        'w-full flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-200',
                        isActive
                            ? 'text-white bg-white/10'
                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                    )}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium truncate">{t(getTranslationKey(item.title))}</span>
                    </div>
                    <div className={cn(
                        'transition-transform duration-200',
                        isOpen && 'rotate-180'
                    )}>
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </button>

                {/* Submenu - slides down with animation */}
                <div
                    className={cn(
                        'overflow-hidden transition-all duration-300 ease-in-out',
                        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    )}
                >
                    <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-4">
                        {visibleChildren.map((child) => {
                            const ChildIcon = child.icon;

                            // Basic active check
                            let isChildCurrentlyActive = isPathActive(child.href);

                            // If active by prefix (not exact match), check if a more specific sibling also matches
                            if (isChildCurrentlyActive && pathname !== child.href) {
                                const hasMoreSpecificMatch = visibleChildren.some(sibling =>
                                    sibling !== child &&
                                    sibling.href.length > child.href.length &&
                                    isPathActive(sibling.href)
                                );
                                if (hasMoreSpecificMatch) {
                                    isChildCurrentlyActive = false;
                                }
                            }

                            return (
                                <Link
                                    key={child.href}
                                    href={child.href}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200',
                                        isChildCurrentlyActive
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    )}
                                >
                                    <ChildIcon className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{t(getTranslationKey(child.title))}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // If no children - render as simple navigation link
    return (
        <Link
            href={item.href}
            className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActiveExact
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
            )}
        >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium truncate">{t(getTranslationKey(item.title))}</span>
        </Link>
    );
}
