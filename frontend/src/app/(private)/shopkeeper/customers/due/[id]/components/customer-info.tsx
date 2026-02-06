'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, MapPin, MessageCircle, TrendingUp, Wallet, AlertTriangle, CheckCircle2, Sparkles, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { format } from 'date-fns';

interface Customer {
    _id: string;
    name: string;
    phone?: string;
    whatsappNumber?: string;
    address?: string;
    place?: string;
    totalSales: number;
    totalPaid: number;
    outstandingDue: number;
    createdAt: string;
}

interface CustomerInfoProps {
    customer: Customer;
}

function formatCurrency(amount: number | undefined): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount ?? 0);
}



export function CustomerInfo({ customer }: CustomerInfoProps) {
    const { t } = useTranslation();
    const collectionRate = customer.totalSales > 0
        ? Math.round((customer.totalPaid / customer.totalSales) * 100)
        : 0;


    return (
        <div className="mb-4 md:mb-6">
            {/* Main Profile Card - Elegant Dark Theme */}
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl">
                {/* Premium Dark Background with Warm Accents */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                    {/* Subtle accent orbs */}
                    <div className="absolute top-0 right-0 w-48 h-48 md:w-72 md:h-72 bg-amber-500/10 rounded-full blur-3xl transform translate-x-20 -translate-y-10" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 md:w-56 md:h-56 bg-teal-500/10 rounded-full blur-3xl transform -translate-x-10 translate-y-10" />
                </div>

                {/* Content */}
                <div className="relative p-4 md:p-6">
                    {/* Header Section */}
                    <div className="flex items-start gap-4 mb-5 md:mb-6">
                        {/* Premium Avatar */}
                        <div className="relative">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <span className="text-2xl md:text-3xl font-bold text-white">
                                    {customer.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            {/* Status Indicator */}
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-lg ${customer.outstandingDue > 0 ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}>
                                {customer.outstandingDue > 0 ? (
                                    <AlertTriangle className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
                                ) : (
                                    <CheckCircle2 className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
                                )}
                            </div>
                        </div>

                        {/* Customer Details */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-1.5 truncate">
                                {customer.name}
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5 ">
                                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs md:text-sm px-2.5 py-0.5 font-medium">
                                    <Sparkles className="h-3 w-3 mr-1.5" />
                                    {t('billing.due_customer')}
                                </Badge>
                                <span className="text-slate-500 text-xs flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span className="md:hidden">{t('common.joined_on')} {format(new Date(customer.createdAt), 'MMM yy')}</span>
                                    <span className="hidden md:inline">{t('common.joined_on')} {format(new Date(customer.createdAt), 'MMMM yyyy')}</span>
                                </span>
                            </div>

                            {/* Contact Buttons */}
                            <div className="flex flex-wrap gap-2 mt-3">
                                {customer.phone && (
                                    <a
                                        href={`tel:${customer.phone}`}
                                        className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700 transition-all active:scale-95 text-slate-200"
                                    >
                                        <Phone className="h-4 w-4 text-sky-400" />
                                        <span className="font-medium text-sm">{customer.phone}</span>
                                    </a>
                                )}
                                {customer.whatsappNumber && (
                                    <a
                                        href={`https://wa.me/${customer.whatsappNumber}`}
                                        className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 transition-all active:scale-95 text-emerald-300"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        <span className="font-medium text-sm">{t('wholesalers_list.dialogs.whatsapp')}</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    {customer.address && (
                        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-700/30 rounded-xl border border-slate-600/30 mb-4 text-slate-300">
                            <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <span className="text-sm truncate">
                                {customer.address}{customer.place ? `, ${customer.place}` : ''}
                            </span>
                        </div>
                    )}

                    {/* Financial Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        {/* Total Sales */}
                        <div className="bg-slate-700/40 rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-600/30 text-center col-span-1">
                            <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-sky-400" />
                                <span className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wide">{t('history.sales')}</span>
                            </div>
                            <p className="text-lg md:text-xl font-bold text-white break-words">
                                {formatCurrency(customer.totalSales)}
                            </p>
                        </div>

                        {/* Collected */}
                        <div className="bg-emerald-500/10 rounded-xl md:rounded-2xl p-3 md:p-4 border border-emerald-500/20 text-center col-span-1">
                            <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                <Wallet className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-400" />
                                <span className="text-[10px] md:text-xs text-emerald-400/80 font-medium uppercase tracking-wide">{t('billing.paid')}</span>
                            </div>
                            <p className="text-lg md:text-xl font-bold text-emerald-400 break-words">
                                {formatCurrency(customer.totalPaid)}
                            </p>
                        </div>

                        {/* Outstanding / Advance */}
                        <div className={`rounded-xl md:rounded-2xl p-3 md:p-4 border text-center col-span-1 sm:col-span-2 md:col-span-1 ${customer.outstandingDue > 0
                            ? 'bg-rose-500/10 border-rose-500/20'
                            : 'bg-emerald-500/10 border-emerald-500/20'
                            }`}>
                            <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                {customer.outstandingDue > 0 ? (
                                    <>
                                        <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4 text-rose-400" />
                                        <span className="text-[10px] md:text-xs text-rose-400/80 font-medium uppercase tracking-wide">{t('billing.due')}</span>
                                    </>
                                ) : customer.outstandingDue < 0 ? (
                                    <>
                                        <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-400" />
                                        <span className="text-[10px] md:text-xs text-emerald-400/80 font-medium uppercase tracking-wide">{t('wholesaler_payments.detail.advance')}</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-400" />
                                        <span className="text-[10px] md:text-xs text-emerald-400/80 font-medium uppercase tracking-wide">{t('wholesalers_list.table.clear_badge').replace('✓', '').trim()}</span>
                                    </>
                                )}
                            </div>
                            <p className={`text-lg md:text-xl font-bold break-words ${customer.outstandingDue > 0 ? 'text-rose-400' : 'text-emerald-400'
                                }`}>
                                {customer.outstandingDue > 0
                                    ? formatCurrency(customer.outstandingDue)
                                    : customer.outstandingDue < 0
                                        ? formatCurrency(Math.abs(customer.outstandingDue))
                                        : t('wholesalers_list.table.nil_badge')}
                            </p>
                        </div>
                    </div>

                    {/* Collection Progress */}
                    <div className="bg-slate-700/40 rounded-xl p-3 md:p-4 border border-slate-600/30">
                        <div className="flex items-center justify-between mb-2.5">
                            <span className="text-sm font-medium text-slate-300">{t('wholesalers_list.stats.active_rate')}</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xl md:text-2xl font-bold text-white">{collectionRate}</span>
                                <span className="text-sm text-slate-400">%</span>
                            </div>
                        </div>
                        <div className="h-2.5 md:h-3 bg-slate-600/50 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ease-out ${collectionRate >= 75
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                                    : collectionRate >= 50
                                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                        : 'bg-gradient-to-r from-rose-500 to-orange-400'
                                    }`}
                                style={{ width: `${collectionRate}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-1.5 text-[10px] md:text-xs text-slate-500">
                            <span>₹0</span>
                            <span>{formatCurrency(customer.totalSales)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
