'use client';

import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Package, Phone, MapPin, MessageCircle, TrendingUp, Wallet, AlertTriangle, CheckCircle2, Sparkles, Calendar } from 'lucide-react';
import { format } from 'date-fns';

import { Wholesaler } from '@/types';

interface WholesalerInfoProps {
    wholesaler: Wholesaler;
}

function formatCurrency(amount: number | undefined): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount ?? 0);
}



export function WholesalerInfo({ wholesaler }: WholesalerInfoProps) {
    const { t } = useTranslation();
    const paymentPercentage = wholesaler.totalPurchased > 0
        ? Math.round((wholesaler.totalPaid / wholesaler.totalPurchased) * 100)
        : 0;

    return (
        <div className="mb-4 md:mb-6">
            {/* Main Profile Card - Premium Dark Theme */}
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl">
                {/* Premium Dark Background with Teal/Cyan Accents */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                    {/* Subtle accent orbs */}
                    <div className="absolute top-0 right-0 w-48 h-48 md:w-72 md:h-72 bg-teal-500/10 rounded-full blur-3xl transform translate-x-20 -translate-y-10" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 md:w-56 md:h-56 bg-cyan-500/10 rounded-full blur-3xl transform -translate-x-10 translate-y-10" />
                </div>

                {/* Content */}
                <div className="relative p-4 md:p-6">
                    {/* Header Section */}
                    <div className="flex items-start gap-4 mb-5 md:mb-6">
                        {/* Premium Avatar */}
                        <div className="relative">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                                <Package className="h-7 w-7 md:h-9 md:w-9 text-white" />
                            </div>
                            {/* Status Indicator */}
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-lg ${wholesaler.outstandingDue > 0 ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}>
                                {wholesaler.outstandingDue > 0 ? (
                                    <AlertTriangle className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
                                ) : (
                                    <CheckCircle2 className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
                                )}
                            </div>
                        </div>

                        {/* Wholesaler Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 flex-wrap">
                                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight truncate">
                                    {wholesaler.name}
                                </h1>
                                <Badge className={`text-xs px-2 py-0.5 ${wholesaler.isActive !== false
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                    }`}>
                                    {wholesaler.isActive !== false
                                        ? t('wholesaler_detail.info.active')
                                        : t('wholesaler_detail.info.inactive')
                                    }
                                </Badge>
                            </div>

                            <div className="flex items-center gap-2 mt-1.5">
                                <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-xs px-2.5 py-0.5 font-medium">
                                    <Sparkles className="h-3 w-3 mr-1.5" />
                                    {t('wholesaler_detail.info.wholesaler')}
                                </Badge>
                                <span className="text-slate-500 text-xs flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span className="md:hidden">{t('wholesaler_detail.info.since', { date: format(new Date(wholesaler.createdAt), 'MMM yy') })}</span>
                                    <span className="hidden md:inline">{t('wholesaler_detail.info.since', { date: format(new Date(wholesaler.createdAt), 'MMMM yyyy') })}</span>
                                </span>
                            </div>

                            {/* Contact Buttons */}
                            <div className="flex flex-wrap gap-2 mt-3">
                                {wholesaler.phone && (
                                    <a
                                        href={`tel:${wholesaler.phone}`}
                                        className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700 transition-all active:scale-95 text-slate-200"
                                    >
                                        <Phone className="h-4 w-4 text-sky-400" />
                                        <span className="font-medium text-sm">{wholesaler.phone}</span>
                                    </a>
                                )}
                                {wholesaler.whatsappNumber && (
                                    <a
                                        href={`https://wa.me/${wholesaler.whatsappNumber.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 transition-all active:scale-95 text-emerald-300"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        <span className="font-medium text-sm">{t('wholesaler_payments.filters.upi')}</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    {wholesaler.address && (
                        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-700/30 rounded-xl border border-slate-600/30 mb-4 text-slate-300">
                            <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <span className="text-sm truncate">
                                {wholesaler.address}{wholesaler.place ? `, ${wholesaler.place}` : ''}
                            </span>
                        </div>
                    )}

                    {/* Financial Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        {/* Total Purchases */}
                        <div className="bg-slate-700/40 rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-600/30 text-center col-span-1">
                            <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-sky-400" />
                                <span className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wide">{t('wholesaler_detail.info.purchased')}</span>
                            </div>
                            <p className="text-lg md:text-xl font-bold text-white break-words">
                                {formatCurrency(wholesaler.totalPurchased)}
                            </p>
                        </div>

                        {/* Paid */}
                        <div className="bg-emerald-500/10 rounded-xl md:rounded-2xl p-3 md:p-4 border border-emerald-500/20 text-center col-span-1">
                            <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                <Wallet className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-400" />
                                <span className="text-[10px] md:text-xs text-emerald-400/80 font-medium uppercase tracking-wide">{t('wholesaler_detail.info.paid')}</span>
                            </div>
                            <p className="text-lg md:text-xl font-bold text-emerald-400 break-words">
                                {formatCurrency(wholesaler.totalPaid)}
                            </p>
                        </div>

                        {/* Outstanding */}
                        <div className={`rounded-xl md:rounded-2xl p-3 md:p-4 border text-center col-span-1 sm:col-span-2 md:col-span-1 ${wholesaler.outstandingDue > 0
                            ? 'bg-rose-500/10 border-rose-500/20'
                            : 'bg-emerald-500/10 border-emerald-500/20'
                            }`}>
                            <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                {wholesaler.outstandingDue > 0 ? (
                                    <>
                                        <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4 text-rose-400" />
                                        <span className="text-[10px] md:text-xs text-rose-400/80 font-medium uppercase tracking-wide">{t('wholesaler_detail.info.due')}</span>
                                    </>
                                ) : wholesaler.outstandingDue < 0 ? (
                                    <>
                                        <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-400" />
                                        <span className="text-[10px] md:text-xs text-emerald-400/80 font-medium uppercase tracking-wide">{t('wholesaler_payments.detail.advance')}</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-400" />
                                        <span className="text-[10px] md:text-xs text-emerald-400/80 font-medium uppercase tracking-wide">{t('wholesaler_detail.info.clear')}</span>
                                    </>
                                )}
                            </div>
                            <p className={`text-lg md:text-xl font-bold break-words ${wholesaler.outstandingDue > 0 ? 'text-rose-400' : 'text-emerald-400'
                                }`}>
                                {wholesaler.outstandingDue > 0
                                    ? formatCurrency(wholesaler.outstandingDue)
                                    : wholesaler.outstandingDue < 0
                                        ? formatCurrency(Math.abs(wholesaler.outstandingDue))
                                        : `✓ ${t('history.nil')}`}
                            </p>
                        </div>
                    </div>

                    {/* Payment Progress */}
                    <div className="bg-slate-700/40 rounded-xl p-3 md:p-4 border border-slate-600/30">
                        <div className="flex items-center justify-between mb-2.5">
                            <span className="text-sm font-medium text-slate-300">{t('wholesaler_detail.info.progress')}</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xl md:text-2xl font-bold text-white">{paymentPercentage}</span>
                                <span className="text-sm text-slate-400">%</span>
                            </div>
                        </div>
                        <div className="h-2.5 md:h-3 bg-slate-600/50 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ease-out ${paymentPercentage >= 75
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                                    : paymentPercentage >= 50
                                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                        : 'bg-gradient-to-r from-rose-500 to-orange-400'
                                    }`}
                                style={{ width: `${paymentPercentage}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-1.5 text-[10px] md:text-xs text-slate-500">
                            <span>₹0</span>
                            <span>{formatCurrency(wholesaler.totalPurchased)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
