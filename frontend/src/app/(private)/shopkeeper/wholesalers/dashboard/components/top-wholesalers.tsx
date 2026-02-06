'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ChevronRight, Trophy, Medal, Award } from 'lucide-react';

interface Wholesaler {
    _id: string;
    name: string;
    outstandingDue: number;
    totalPurchased: number;
    totalPaid?: number;
}

interface TopWholesalersProps {
    wholesalers: Wholesaler[];
    isLoading?: boolean;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}



const rankIcons = [
    { icon: Trophy, color: 'bg-gradient-to-br from-yellow-400 to-amber-500', textColor: 'text-yellow-600' },
    { icon: Medal, color: 'bg-gradient-to-br from-gray-300 to-gray-400', textColor: 'text-gray-500' },
    { icon: Award, color: 'bg-gradient-to-br from-orange-400 to-amber-600', textColor: 'text-orange-500' },
];

import { useTranslation } from 'react-i18next';

export function TopWholesalers({ wholesalers, isLoading }: TopWholesalersProps) {
    const { t } = useTranslation();
    if (isLoading) {
        return (
            <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-purple-500" />
                        {t('wholesaler_dashboard.top_wholesalers')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const sortedWholesalers = [...wholesalers]
        .sort((a, b) => b.totalPurchased - a.totalPurchased)
        .slice(0, 5);

    const maxPurchase = sortedWholesalers[0]?.totalPurchased || 1;

    return (
        <Card className="border-0 shadow-lg rounded-xl md:rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between p-3 md:p-6 pb-2 md:pb-2">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <div className="p-1.5 md:p-2 rounded-lg bg-purple-100">
                        <Trophy className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                    </div>
                    <span className="hidden sm:inline">{t('wholesaler_dashboard.top_wholesalers')}</span>
                    <span className="sm:hidden">{t('wholesaler_dashboard.top_5')}</span>
                </CardTitle>
                <Badge variant="secondary" className="bg-purple-50 text-purple-700 text-[10px] md:text-xs px-1.5 md:px-2">
                    {t('wholesaler_dashboard.by_purchase')}
                </Badge>
            </CardHeader>
            <CardContent className="p-2 md:p-6 pt-2">
                {sortedWholesalers.length > 0 ? (
                    <div className="space-y-2 md:space-y-3">
                        {sortedWholesalers.map((w, index) => {
                            const percentage = (w.totalPurchased / maxPurchase) * 100;
                            const RankIcon = rankIcons[index]?.icon || null;

                            return (
                                <div
                                    key={w._id || `wholesaler-${index}`}
                                    className={`relative p-2.5 md:p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border-l-4 border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all duration-200 group active:scale-[0.99] ${index === 0 ? 'border-l-yellow-500' :
                                        index === 1 ? 'border-l-gray-400' :
                                            index === 2 ? 'border-l-orange-500' :
                                                'border-l-purple-400'
                                        }`}
                                >
                                    {/* Progress bar background */}
                                    <div
                                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-50/50 to-transparent transition-all"
                                        style={{ width: `${percentage}%` }}
                                    />

                                    <div className="relative flex items-center justify-between">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            {/* Rank Badge */}
                                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-lg ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                                                index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                                                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-600' :
                                                        'bg-gradient-to-br from-purple-400 to-purple-500'
                                                }`}>
                                                {RankIcon ? <RankIcon className="h-4 w-4 md:h-5 md:w-5" /> : index + 1}
                                            </div>

                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm md:text-base group-hover:text-purple-700 transition-colors truncate max-w-[100px] md:max-w-none">
                                                    {w.name}
                                                </p>
                                                <p className="text-[10px] md:text-sm text-gray-500">
                                                    <span className="font-medium text-gray-700">{formatCurrency(w.totalPurchased)}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 md:gap-3">
                                            {w.outstandingDue > 0 ? (
                                                <Badge variant="destructive" className="bg-red-100 text-red-700 border-0 font-mono text-[10px] md:text-xs px-1.5 md:px-2">
                                                    {formatCurrency(w.outstandingDue)}
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-green-100 text-green-700 border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                                                    ✓
                                                </Badge>
                                            )}
                                            <Link href={`/shopkeeper/wholesalers/${w._id}`}>
                                                <Button variant="ghost" size="sm" className="md:opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 md:h-8 md:w-8 p-0">
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-8 md:p-12 text-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 md:mb-4">
                            <Package className="h-6 w-6 md:h-8 md:w-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium text-sm md:text-base">{t('wholesaler_dashboard.no_wholesalers_found')}</p>
                        <p className="text-xs md:text-sm text-gray-400 mt-1">{t('wholesaler_dashboard.add_wholesalers_desc')}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
