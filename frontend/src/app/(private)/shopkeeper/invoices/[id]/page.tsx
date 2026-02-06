'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2, Share2, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Header, DeleteConfirmDialog } from '@/components/app';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { invoiceApi } from '@/lib/invoice-api';
import { toast } from 'sonner';
import { useState } from 'react';
import { InvoicePreview, InvoicePdfModal } from '../components';

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

function getStatusColor(status: string) {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-700 border-0';
        case 'sent':
            return 'bg-blue-100 text-blue-700 border-0';
        case 'paid':
            return 'bg-green-100 text-green-700 border-0';
        case 'cancelled':
            return 'bg-red-100 text-red-700 border-0';
        default:
            return 'bg-gray-100 text-gray-700 border-0';
    }
}

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [pdfModalOpen, setPdfModalOpen] = useState(false);

    const invoiceId = params.id as string;

    const { data: invoice, isLoading } = useQuery({
        queryKey: ['invoice', invoiceId],
        queryFn: () => invoiceApi.getById(invoiceId),
        enabled: !!invoiceId,
    });

    // Fetch color schemes for preview
    const { data: colorSchemes = [] } = useQuery({
        queryKey: ['invoice-colors'],
        queryFn: () => invoiceApi.getColorSchemes(),
    });

    const deleteMutation = useMutation({
        mutationFn: () => invoiceApi.delete(invoiceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success(t('invoices.messages.success_delete'));
            router.push('/shopkeeper/invoices');
        },
        onError: () => {
            toast.error(t('invoices.messages.error_delete'));
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
                <Header title={t('invoices.title')} />
                <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto" />
                    <p className="text-gray-500 mt-4">{t('Loading...')}</p>
                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
                <Header title={t('invoices.title')} />
                <div className="p-8 text-center">
                    <p className="text-gray-500">{t('Invoice not found')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
            <Header title={invoice.invoiceNumber} />

            <div className="p-3 md:p-6">
                {/* Header Actions */}
                <div className="mb-4 md:mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t('common.back')}
                    </Button>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/shopkeeper/invoices/${invoiceId}/edit`)}
                            className="flex-1 md:flex-none"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            {t('invoices.table.edit')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setPdfModalOpen(true)}
                            className="flex-1 md:flex-none border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                            <FileText className="h-4 w-4 mr-2 text-blue-500" />
                            {t('invoices.table.preview_pdf')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(true)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Invoice Preview with Saved Design */}
                <div className="max-w-5xl mx-auto">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(invoice.status)}>
                                {t(`invoices.status_${invoice.status}`)}
                            </Badge>
                            <span className="text-sm text-gray-600">
                                Template: <span className="font-medium">{invoice.templateId || 'modern'}</span>
                            </span>
                        </div>
                    </div>

                    <InvoicePreview
                        invoice={invoice}
                        templateId={invoice.templateId || 'modern'}
                        colorScheme={invoice.colorScheme || 'blue'}
                        colorSchemes={colorSchemes}
                    />
                </div>
            </div>

            {/* PDF Modal (Handles Sharing & Downloading) */}
            <InvoicePdfModal
                open={pdfModalOpen}
                onOpenChange={setPdfModalOpen}
                invoice={invoice}
                templateId={invoice.templateId || 'modern'}
                colorScheme={invoice.colorScheme || 'blue'}
                colorSchemes={colorSchemes}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={() => deleteMutation.mutate()}
                title={t('invoices.delete_dialog.title')}
                description={t('invoices.delete_dialog.description', { invoiceNumber: invoice.invoiceNumber })}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}

