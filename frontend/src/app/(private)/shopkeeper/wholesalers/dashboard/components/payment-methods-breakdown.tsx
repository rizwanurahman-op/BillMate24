'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote, CreditCard, Smartphone, TrendingUp, Wallet } from 'lucide-react';

interface PaymentBreakdown {
    cash: number;
    card: number;
    online: number;
}

interface PaymentMethodsBreakdownProps {
    breakdown: PaymentBreakdown;
    totalPaid: number;
    isLoading?: boolean;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

import { useTranslation } from 'react-i18next';

export function PaymentMethodsBreakdown({ breakdown, totalPaid, isLoading }: PaymentMethodsBreakdownProps) {
    const { t } = useTranslation();
    if (isLoading) {
        return (
            <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-purple-500" />
                        {t('wholesaler_dashboard.payment_methods')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getPercentage = (amount: number) => {
        if (totalPaid === 0) return 0;
        return ((amount / totalPaid) * 100).toFixed(1);
    };

    const paymentMethods = [
        {
            name: t('billing.cash'),
            amount: breakdown.cash,
            icon: Banknote,
            gradient: 'from-green-500 to-emerald-600',
            lightGradient: 'from-green-50 to-emerald-50',
            iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
            textColor: 'text-green-600',
            progressColor: 'bg-gradient-to-r from-green-400 to-emerald-500',
        },
        {
            name: t('billing.card'),
            amount: breakdown.card,
            icon: CreditCard,
            gradient: 'from-blue-500 to-indigo-600',
            lightGradient: 'from-blue-50 to-indigo-50',
            iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
            textColor: 'text-blue-600',
            progressColor: 'bg-gradient-to-r from-blue-400 to-indigo-500',
        },
        {
            name: t('billing.upi'),
            amount: breakdown.online,
            icon: Smartphone,
            gradient: 'from-purple-500 to-violet-600',
            lightGradient: 'from-purple-50 to-violet-50',
            iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
            textColor: 'text-purple-600',
            progressColor: 'bg-gradient-to-r from-purple-400 to-violet-500',
        },
    ];

    // Find the dominant payment method
    const dominantMethod = paymentMethods.reduce((prev, current) =>
        current.amount > prev.amount ? current : prev
    );

    return (
        <Card className="border-0 shadow-xl overflow-hidden rounded-xl md:rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b p-3 md:p-6">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                            <Wallet className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div>
                            <span className="block">{t('wholesaler_dashboard.payments')}</span>
                            <span className="text-xs md:text-sm font-normal text-purple-600">
                                {formatCurrency(totalPaid)}
                            </span>
                        </div>
                    </CardTitle>
                    {totalPaid > 0 && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-purple-100">
                            <TrendingUp className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium text-purple-600 text-right">
                                {dominantMethod.name} {t('wholesaler_dashboard.leads')}
                            </span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-3 md:pt-6">
                {totalPaid > 0 ? (
                    <div className="space-y-2 md:space-y-4">
                        {paymentMethods.map((method) => {
                            const percentage = getPercentage(method.amount);
                            const Icon = method.icon;

                            return (
                                <div
                                    key={method.name}
                                    className={`relative p-2.5 md:p-4 rounded-xl bg-gradient-to-r ${method.lightGradient} border border-gray-100 hover:shadow-md transition-all duration-200`}
                                >
                                    <div className="flex items-center justify-between mb-2 md:mb-3">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg ${method.iconBg}`}>
                                                <Icon className="h-4 w-4 md:h-5 md:w-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm md:text-base">{method.name}</p>
                                                <p className={`text-[10px] md:text-sm ${method.textColor}`}>
                                                    {percentage}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base md:text-xl font-bold text-gray-900">
                                                {formatCurrency(method.amount)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="h-1.5 md:h-2 bg-white/60 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className={`h-full ${method.progressColor} rounded-full transition-all duration-500 ease-out`}
                                            style={{ width: `${Math.min(100, Number(percentage))}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        {/* Summary - Visible on all devices */}
                        <div className="mt-3 md:mt-6 p-2.5 md:p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100">
                            <div className="flex items-center justify-between gap-4 text-right">
                                <span className="font-medium text-gray-600 text-xs md:text-base">{t('wholesaler_dashboard.total_paid_to_wholesalers')}</span>
                                <span className="text-base md:text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent shrink-0">
                                    {formatCurrency(totalPaid)}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 md:p-12 text-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3 md:mb-4">
                            <Wallet className="h-6 w-6 md:h-8 md:w-8 text-purple-400" />
                        </div>
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">{t('wholesaler_dashboard.no_payments_yet')}</h3>
                        <p className="text-xs md:text-sm text-gray-500">{t('wholesaler_dashboard.payment_breakdown_appear_here')}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
