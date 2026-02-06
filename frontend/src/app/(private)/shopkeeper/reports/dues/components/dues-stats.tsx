'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    AlertCircle,
    Users,
    Package,
    IndianRupee,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';

interface DuesStatsProps {
    totalOutstanding: number;
    customerDues: number;
    wholesalerDues: number;
    overdueCount: number;
    customerCount?: number;
    wholesalerCount?: number;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}



import { useTranslation } from 'react-i18next';

export function DuesStats({
    totalOutstanding,
    customerDues,
    wholesalerDues,
    overdueCount,
    customerCount = 0,
    wholesalerCount = 0,
}: DuesStatsProps) {
    const { t } = useTranslation();
    const netPosition = customerDues - wholesalerDues;
    const isNetPositive = netPosition >= 0;

    return (
        <div className="space-y-6 mb-8">
            {/* Main Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {/* Receivables - From Customers */}
                <Card className={`relative overflow-hidden border-0 shadow-xl text-white ${customerDues >= 0
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                    : 'bg-gradient-to-br from-rose-500 to-red-600'}`}>
                    <CardContent className="p-3 md:p-6">
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                            <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                <ArrowDownRight className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2.5">
                                {customerDues >= 0 ? t('reports.to_collect_badge') : t('reports.to_pay_badge')}
                            </Badge>
                        </div>
                        <h3 className="text-xl md:text-3xl font-bold">{formatCurrency(Math.abs(customerDues))}</h3>
                        <p className="text-white/80 text-[10px] md:text-sm mt-1 uppercase font-bold tracking-wider">
                            {customerDues >= 0 ? t('reports.customer_outstanding_due') : t('reports.customer_advance')}
                        </p>
                        <p className="text-white/60 text-[9px] md:text-[10px] italic">
                            {t('reports.incl_opening_balance')}
                        </p>
                        <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 flex items-center justify-between">
                            <span className="text-[10px] md:text-xs text-white/70">
                                <Users className="h-3 w-3 inline mr-1" />
                                {customerCount} {t('reports.count_suffix')}
                            </span>
                        </div>
                    </CardContent>
                    <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
                </Card>

                {/* Payables - To Wholesalers */}
                <Card className={`relative overflow-hidden border-0 shadow-xl text-white ${wholesalerDues >= 0
                    ? 'bg-gradient-to-br from-orange-500 to-amber-600'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                    <CardContent className="p-3 md:p-6">
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                            <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2.5">
                                {wholesalerDues >= 0 ? t('reports.to_pay_badge') : t('reports.to_collect_badge')}
                            </Badge>
                        </div>
                        <h3 className="text-xl md:text-3xl font-bold">{formatCurrency(Math.abs(wholesalerDues))}</h3>
                        <p className="text-white/80 text-[10px] md:text-sm mt-1 uppercase font-bold tracking-wider">
                            {wholesalerDues >= 0 ? t('reports.wholesaler_outstanding_due') : t('reports.wholesaler_advance')}
                        </p>
                        <p className="text-white/60 text-[9px] md:text-[10px] italic">
                            {t('reports.incl_opening_balance')}
                        </p>
                        <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 flex items-center justify-between">
                            <span className="text-[10px] md:text-xs text-white/70">
                                <Package className="h-3 w-3 inline mr-1" />
                                {wholesalerCount} {t('reports.count_suffix')}
                            </span>
                        </div>
                    </CardContent>
                    <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
                </Card>

                {/* Net Position */}
                <Card className={`relative overflow-hidden border-0 shadow-xl text-white ${isNetPositive
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    : 'bg-gradient-to-br from-red-500 to-rose-600'
                    }`}>
                    <CardContent className="p-3 md:p-6">
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                            <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                                {isNetPositive ? (
                                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 md:h-5 md:w-5" />
                                )}
                            </div>
                            <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-1.5 md:px-2.5">
                                {isNetPositive ? t('reports.net_positive') : t('reports.net_negative')}
                            </Badge>
                        </div>
                        <h3 className="text-xl md:text-3xl font-bold">{formatCurrency(Math.abs(netPosition))}</h3>
                        <p className="text-white/80 text-[10px] md:text-sm mt-1">
                            {isNetPositive ? t('reports.receivable_caps') : t('reports.payable_caps')}
                        </p>
                        <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20">
                            <span className="text-[10px] md:text-xs text-white/70 truncate block">
                                {isNetPositive
                                    ? t('reports.more_incoming')
                                    : t('reports.more_outgoing')
                                }
                            </span>
                        </div>
                    </CardContent>
                    <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
                </Card>

                {/* Overdue Alert */}
                <Card className={`relative overflow-hidden border-0 shadow-xl text-white ${overdueCount > 0
                    ? 'bg-gradient-to-br from-red-600 to-pink-600'
                    : 'bg-gradient-to-br from-purple-500 to-violet-600'
                    }`}>
                    <CardContent className="p-3 md:p-6">
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                            <div className={`p-1.5 md:p-2.5 rounded-lg md:rounded-xl ${overdueCount > 0 ? 'bg-white/30 animate-pulse' : 'bg-white/20'} backdrop-blur-sm`}>
                                <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <Badge className={`${overdueCount > 0 ? 'bg-white text-red-600' : 'bg-white/20 text-white'} border-0 text-[10px] md:text-xs px-1.5 md:px-2.5`}>
                                {overdueCount > 0 ? t('reports.overdue_alert_urgent') : t('reports.overdue_alert_good')}
                            </Badge>
                        </div>
                        <h3 className="text-xl md:text-3xl font-bold">{overdueCount}</h3>
                        <p className="text-white/80 text-[10px] md:text-sm mt-1">
                            {overdueCount > 0 ? t('reports.overdue_desc') : t('reports.no_overdue')}
                        </p>
                        <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20">
                            <span className="text-[10px] md:text-xs text-white/70 truncate block">
                                {overdueCount > 0
                                    ? t('reports.action_needed')
                                    : t('reports.on_track_check')
                                }
                            </span>
                        </div>
                    </CardContent>
                    <div className="absolute -bottom-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl" />
                </Card>
            </div>

            {/* Summary Bar */}
            <Card className="border-0 shadow-md bg-gradient-to-r from-slate-800 via-slate-800 to-slate-700">
                <CardContent className="py-3 px-4 md:py-4 md:px-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                        <div className="flex items-center gap-2 text-white w-full md:w-auto justify-between md:justify-start">
                            <div className="flex items-center gap-2">
                                <IndianRupee className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />
                                <span className="text-sm">
                                    {totalOutstanding >= 0 ? t('reports.total_outstanding') : t('reports.payable_caps')}:
                                </span>
                            </div>
                            <span className="text-lg md:text-xl font-bold text-yellow-400">
                                {formatCurrency(Math.abs(totalOutstanding))}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm w-full md:w-auto">
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${customerDues >= 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                <span className="text-gray-300">
                                    {customerDues >= 0 ? t('reports.receivable_caps') : t('reports.payable_caps')}: {formatCurrency(Math.abs(customerDues))}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${wholesalerDues >= 0 ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
                                <span className="text-gray-300">
                                    {wholesalerDues >= 0 ? t('reports.payable_caps') : t('reports.receivable_caps')}: {formatCurrency(Math.abs(wholesalerDues))}
                                </span>
                            </div>
                            {overdueCount > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse"></div>
                                    <span className="text-red-300">{overdueCount} {t('reports.overdue')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
