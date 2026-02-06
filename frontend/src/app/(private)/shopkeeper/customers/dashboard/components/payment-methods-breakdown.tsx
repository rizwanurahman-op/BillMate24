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
    totalCollected: number;
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

export function PaymentMethodsBreakdown({ breakdown, totalCollected, isLoading }: PaymentMethodsBreakdownProps) {
    const { t } = useTranslation();
    if (isLoading) {
        return (
            <Card className="border-0 shadow-lg md:shadow-xl rounded-xl md:rounded-2xl">
                <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b p-3 md:p-6">
                    <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                        <Wallet className="h-4 w-4 md:h-5 md:w-5 text-violet-500" />
                        {t('dashboard.payment_methods')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:pt-6 md:px-6">
                    <div className="animate-pulse space-y-2 md:space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 md:h-24 bg-gray-100 rounded-xl" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getPercentage = (amount: number) => {
        if (totalCollected === 0) return 0;
        return ((amount / totalCollected) * 100).toFixed(1);
    };

    const paymentMethods = [
        {
            name: t('dashboard.cash'),
            shortName: t('dashboard.cash'),
            amount: breakdown.cash,
            icon: Banknote,
            gradient: 'from-emerald-500 to-green-600',
            lightGradient: 'from-emerald-50 to-green-50',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
            textColor: 'text-emerald-600',
            progressColor: 'bg-gradient-to-r from-emerald-400 to-green-500',
        },
        {
            name: t('dashboard.card'),
            shortName: t('dashboard.card'),
            amount: breakdown.card,
            icon: CreditCard,
            gradient: 'from-blue-500 to-indigo-600',
            lightGradient: 'from-blue-50 to-indigo-50',
            iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
            textColor: 'text-blue-600',
            progressColor: 'bg-gradient-to-r from-blue-400 to-indigo-500',
        },
        {
            name: t('dashboard.online') + ' / UPI',
            shortName: 'UPI',
            amount: breakdown.online,
            icon: Smartphone,
            gradient: 'from-violet-500 to-purple-600',
            lightGradient: 'from-violet-50 to-purple-50',
            iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
            textColor: 'text-violet-600',
            progressColor: 'bg-gradient-to-r from-violet-400 to-purple-500',
        },
    ];

    // Find the dominant payment method
    const dominantMethod = paymentMethods.reduce((prev, current) =>
        current.amount > prev.amount ? current : prev
    );

    return (
        <Card className="border-0 shadow-lg md:shadow-xl overflow-hidden rounded-xl md:rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b p-3 md:p-6">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                        <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                            <Wallet className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div>
                            <span className="block">{t('dashboard.payment_methods')}</span>
                            <span className="text-[10px] md:text-sm font-normal text-violet-600">
                                <span className="md:hidden">{formatCurrency(totalCollected)}</span>
                                <span className="hidden md:inline">{t('dashboard.total')}: {formatCurrency(totalCollected)}</span>
                            </span>
                        </div>
                    </CardTitle>
                    {totalCollected > 0 && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-violet-100">
                            <TrendingUp className="h-4 w-4 text-violet-500" />
                            <span className="text-sm font-medium text-violet-600">
                                {dominantMethod.shortName} {t('wholesaler_dashboard.leads')}
                            </span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-2 md:p-6 md:pt-6">
                {totalCollected > 0 ? (
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
                                                <p className="font-semibold text-gray-900 text-sm md:text-base">
                                                    <span className="md:hidden">{method.shortName}</span>
                                                    <span className="hidden md:inline">{method.name}</span>
                                                </p>
                                                <p className={`text-[10px] md:text-sm ${method.textColor}`}>
                                                    {percentage}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base md:text-xl font-bold text-gray-900">
                                                <span className="md:hidden">{formatCurrency(method.amount)}</span>
                                                <span className="hidden md:inline">{formatCurrency(method.amount)}</span>
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

                        {/* Summary - visible on all devices */}
                        <div className="mt-3 md:mt-6 p-2.5 md:p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-600 text-xs md:text-base">{t('customer_dashboard.total_collected')}</span>
                                <span className="text-base md:text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                    {formatCurrency(totalCollected)}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 md:p-12 text-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-3 md:mb-4">
                            <Wallet className="h-6 w-6 md:h-8 md:w-8 text-violet-400" />
                        </div>
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">{t('wholesaler_dashboard.no_payments_yet')}</h3>
                        <p className="text-gray-500 text-sm md:text-base">{t('wholesaler_dashboard.payment_breakdown_appear_here')}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
