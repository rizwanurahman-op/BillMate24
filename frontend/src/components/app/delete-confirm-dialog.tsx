'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    isLoading?: boolean;
    itemName?: string;
}

export function DeleteConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    isLoading = false,
    itemName,
}: DeleteConfirmDialogProps) {
    const { t } = useTranslation();
    const isMobile = useMediaQuery('(max-width: 640px)');

    const displayTitle = title || t('common.delete_dialog.title');
    const displayDescription = description || t('common.delete_dialog.description');

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent
                className={cn(
                    'border-0 shadow-2xl p-0 overflow-hidden',
                    'data-[state=open]:animate-in data-[state=closed]:animate-out',
                    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                    isMobile
                        ? [
                            '!top-auto !bottom-0 !left-0 !right-0',
                            '!translate-x-0 !translate-y-0',
                            'rounded-t-[32px] rounded-b-none',
                            'max-w-full w-full m-0 mb-0',
                            'data-[state=closed]:slide-out-to-bottom',
                            'data-[state=open]:slide-in-from-bottom',
                        ]
                        : [
                            'rounded-[32px]',
                            'max-w-[420px]',
                            'data-[state=closed]:zoom-out-95',
                            'data-[state=open]:zoom-in-95',
                        ]
                )}
            >
                {/* Brand / Visual Header */}
                <div className="relative bg-gradient-to-br from-rose-50 via-white to-rose-50/30 pt-10 pb-8 flex flex-col items-center justify-center overflow-hidden sm:pt-12">
                    {/* Abstract Shapes */}
                    <div className="absolute -top-12 -left-12 w-32 h-32 sm:w-48 sm:h-48 bg-rose-100/40 rounded-full blur-[60px] sm:blur-[80px]" />
                    <div className="absolute -bottom-12 -right-12 w-32 h-32 sm:w-48 sm:h-48 bg-orange-100/40 rounded-full blur-[60px] sm:blur-[80px]" />

                    {/* The Icon Container */}
                    <div className="relative z-10">
                        <div className="absolute inset-0 bg-rose-500/20 rounded-[20px] sm:rounded-[28px] blur-xl sm:blur-2xl animate-pulse" />
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[20px] sm:rounded-[28px] bg-white shadow-[0_15px_40px_rgba(225,29,72,0.15)] sm:shadow-[0_20px_50px_rgba(225,29,72,0.15)] flex items-center justify-center text-rose-600 border border-rose-100/50 transform -rotate-6 hover:rotate-0 transition-all duration-700 ease-out group">
                            <Trash2 className="h-10 w-10 sm:h-12 sm:w-12 transition-transform duration-500 group-hover:scale-110" />

                            {/* Floating particles */}
                            <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-rose-500 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold opacity-0 animate-bounce group-hover:opacity-100 transition-opacity">
                                !
                            </div>
                        </div>
                    </div>

                    {/* Exit Button */}
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/50 border border-white hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-900 transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                </div>

                <div className={cn(
                    'text-center',
                    isMobile ? 'px-5 pb-8 pt-3' : 'px-8 pb-10 pt-4'
                )}>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[22px] sm:text-[26px] font-[900] text-gray-900 tracking-tight leading-tight">
                            {displayTitle}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 text-[14px] sm:text-[16px] leading-[1.6] mt-3 sm:mt-4 px-1 sm:px-2">
                            {itemName ? (
                                <span className="block">
                                    {t('common.delete_dialog.remove_prefix')} <span className="text-rose-600 font-bold decoration-rose-200 decoration-2 underline-offset-4 underline">"{itemName}"</span>. {displayDescription}
                                </span>
                            ) : (
                                displayDescription
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {/* Buttons Layout */}
                    <AlertDialogFooter className="flex flex-col gap-2.5 sm:gap-3 mt-6 sm:mt-10 sm:flex-row sm:justify-center">
                        <AlertDialogCancel asChild>
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 h-14 sm:h-16 text-base sm:text-lg font-bold text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl sm:rounded-2xl transition-all active:scale-95 order-2 sm:order-1"
                            >
                                {t('common.delete_dialog.cancel')}
                            </Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button
                                variant="destructive"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onConfirm();
                                }}
                                disabled={isLoading}
                                className={cn(
                                    'flex-[1.5] h-14 sm:h-16',
                                    'bg-gradient-to-br from-rose-500 to-rose-700',
                                    'hover:from-rose-600 hover:to-rose-800',
                                    'text-white font-bold text-base sm:text-lg',
                                    'rounded-xl sm:rounded-2xl',
                                    'shadow-[0_10px_25px_rgba(225,29,72,0.3)] sm:shadow-[0_15px_30px_rgba(225,29,72,0.3)]',
                                    'ring-2 sm:ring-4 ring-rose-50 ring-offset-0',
                                    'transition-all hover:translate-y-[-2px] sm:hover:translate-y-[-4px]',
                                    'hover:shadow-[0_15px_35px_rgba(225,29,72,0.4)] sm:hover:shadow-[0_20px_40px_rgba(225,29,72,0.4)]',
                                    'active:scale-95 order-1 sm:order-2',
                                    'flex items-center justify-center gap-2 sm:gap-3 px-4'
                                )}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-white/50" />
                                        <span>{t('common.delete_dialog.loading')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-5 w-5 sm:h-6 sm:w-6" />
                                        <span>{t('common.delete_dialog.confirm')}</span>
                                    </>
                                )}
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>

                    <div className="inline-flex items-center gap-1.5 sm:gap-2 mt-6 sm:mt-8 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-50 rounded-full border border-emerald-100 animate-pulse">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <span className="text-[9px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                            {t('common.delete_dialog.safe_action')}
                        </span>
                    </div>
                </div>
            </AlertDialogContent >
        </AlertDialog >
    );
}
