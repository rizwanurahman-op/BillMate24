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
import { AlertTriangle, Package, Trash2 } from 'lucide-react';

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    wholesalerName: string;
    isDeleting?: boolean;
}

export function DeleteConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    wholesalerName,
    isDeleting
}: DeleteConfirmDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-red-100">
                            <Trash2 className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <AlertDialogTitle className="text-xl">Delete Wholesaler</AlertDialogTitle>
                            <p className="text-sm text-gray-500 mt-1">This action can be undone later</p>
                        </div>
                    </div>
                </AlertDialogHeader>

                <div className="my-4 p-4 bg-gray-50 rounded-xl border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100">
                            <Package className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">{wholesalerName}</p>
                            <p className="text-sm text-gray-500">Will be marked as deleted</p>
                        </div>
                    </div>
                </div>

                <AlertDialogDescription asChild>
                    <div className="space-y-3">
                        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800">
                                <p className="font-medium">What happens when you delete:</p>
                                <ul className="list-disc list-inside mt-2 space-y-1 text-amber-700">
                                    <li>Wholesaler will be hidden from active lists</li>
                                    <li>All transaction history will be preserved</li>
                                    <li>Outstanding dues will remain on record</li>
                                </ul>
                            </div>
                        </div>
                        <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            You can restore this wholesaler anytime from settings
                        </p>
                    </div>
                </AlertDialogDescription>

                <AlertDialogFooter className="mt-4 gap-3 sm:gap-3">
                    <AlertDialogCancel
                        disabled={isDeleting}
                        className="flex-1 sm:flex-none"
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                Deleting...
                            </span>
                        ) : (
                            'Delete Wholesaler'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
