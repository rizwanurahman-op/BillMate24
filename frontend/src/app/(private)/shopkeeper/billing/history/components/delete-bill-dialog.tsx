'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import api from '@/config/axios';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface DeleteBillDialogProps {
    bill: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function DeleteBillDialog({ bill, open, onOpenChange, onSuccess }: DeleteBillDialogProps) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        if (!bill) return;
        setIsLoading(true);
        try {
            await api.delete(`/bills/${bill._id}`);
            toast.success(t('history.delete_success'));
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('history.delete_error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-0 shadow-2xl">
                {/* Header Section */}
                <div className="bg-red-50 p-6 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4 shadow-sm border border-red-200">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <AlertDialogTitle className="text-2xl font-bold text-red-900 text-center">
                        {t('history.delete_title')}
                    </AlertDialogTitle>
                </div>

                <div className="p-6 pt-2">
                    <AlertDialogDescription asChild>
                        <div className="text-center text-slate-600 text-base leading-relaxed">
                            {t('history.delete_desc', {
                                billNumber: bill?.billNumber,
                                entityType: bill?.billType === 'purchase' ? t('common.wholesaler') : t('common.customer')
                            })}
                            <br /><br />
                            <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-amber-700 text-left leading-tight font-medium">
                                    {t('history.delete_warning')}
                                </span>
                            </div>
                        </div>
                    </AlertDialogDescription>

                    <AlertDialogFooter className="flex-col sm:flex-col gap-2 mt-6">
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="w-full h-12 font-bold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/25 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <Trash2 className="h-5 w-5 mr-2" />
                                    {t('history.confirm_delete')}
                                </>
                            )}
                        </Button>
                        <AlertDialogCancel asChild>
                            <Button
                                variant="ghost"
                                className="w-full h-12 font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-0"
                            >
                                {t('history.keep_bill')}
                            </Button>
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
