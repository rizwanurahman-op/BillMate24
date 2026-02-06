'use client';

import { useState } from 'react';
import { Calendar, ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';

export type TimeFilterOption = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year' | 'all_time' | 'custom';

export interface DateRange {
    startDate: Date;
    endDate: Date;
}

interface TimeFilterProps {
    value: TimeFilterOption;
    onChange: (option: TimeFilterOption, range: DateRange) => void;
    className?: string;
}

import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

export function getDateRange(option: TimeFilterOption, customStart?: Date, customEnd?: Date): DateRange {
    const now = new Date();

    switch (option) {
        case 'today':
            return { startDate: startOfDay(now), endDate: endOfDay(now) };
        case 'yesterday':
            const yesterday = subDays(now, 1);
            return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday) };
        case 'this_week':
            return { startDate: startOfWeek(now, { weekStartsOn: 1 }), endDate: endOfWeek(now, { weekStartsOn: 1 }) };
        case 'this_month':
            return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
        case 'this_year':
            return { startDate: startOfYear(now), endDate: endOfYear(now) };
        case 'all_time':
            return { startDate: new Date('2020-01-01'), endDate: endOfDay(now) };
        case 'custom':
            return {
                startDate: customStart || startOfMonth(now),
                endDate: customEnd || endOfDay(now)
            };
        default:
            return { startDate: startOfDay(now), endDate: endOfDay(now) };
    }
}

export function TimeFilter({ value, onChange, className }: TimeFilterProps) {
    const { t } = useTranslation();
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);

    const filterLabels: Record<TimeFilterOption, string> = {
        today: t('history.time_filters.today'),
        yesterday: t('history.time_filters.yesterday'),
        this_week: t('history.time_filters.this_week'),
        this_month: t('history.time_filters.this_month'),
        this_year: t('history.time_filters.this_year'),
        all_time: t('wholesaler_dashboard.all_time'),
        custom: t('history.time_filters.custom'),
    };

    const handleOptionSelect = (option: TimeFilterOption) => {
        if (option === 'custom') {
            setCustomStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
            setCustomEndDate(format(new Date(), 'yyyy-MM-dd'));
            setIsCustomDialogOpen(true);
        } else {
            const range = getDateRange(option);
            onChange(option, range);
        }
    };

    const handleCustomApply = () => {
        if (customStartDate && customEndDate) {
            const range = {
                startDate: startOfDay(new Date(customStartDate)),
                endDate: endOfDay(new Date(customEndDate)),
            };
            onChange('custom', range);
            setIsCustomDialogOpen(false);
        }
    };

    const handleReset = () => {
        const range = getDateRange('today');
        onChange('today', range);
        setCustomStartDate('');
        setCustomEndDate('');
    };

    const getDisplayLabel = () => {
        if (value === 'custom' && customStartDate && customEndDate) {
            return `${format(new Date(customStartDate), 'dd MMM')} - ${format(new Date(customEndDate), 'dd MMM')}`;
        }
        return filterLabels[value];
    };

    const isDefault = value === 'today';

    return (
        <>
            <div className={`flex items-center gap-1.5 md:gap-2 ${className || ''}`}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex-1 flex items-center justify-between gap-1.5 md:gap-2 bg-white shadow-sm hover:bg-gray-50 h-9 md:h-10 px-2.5 md:px-4 text-xs md:text-sm min-w-0">
                            <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                                <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-500 flex-shrink-0" />
                                <span className="font-medium truncate">{getDisplayLabel()}</span>
                            </div>
                            <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 flex-shrink-0" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                            onClick={() => handleOptionSelect('today')}
                            className={value === 'today' ? 'bg-purple-50 text-purple-700' : ''}
                        >
                            <span className="flex items-center gap-2">
                                {value === 'today' && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                                {t('history.time_filters.today')}
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleOptionSelect('yesterday')}
                            className={value === 'yesterday' ? 'bg-purple-50 text-purple-700' : ''}
                        >
                            <span className="flex items-center gap-2">
                                {value === 'yesterday' && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                                {t('history.time_filters.yesterday')}
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleOptionSelect('this_week')}
                            className={value === 'this_week' ? 'bg-purple-50 text-purple-700' : ''}
                        >
                            <span className="flex items-center gap-2">
                                {value === 'this_week' && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                                {t('history.time_filters.this_week')}
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleOptionSelect('this_month')}
                            className={value === 'this_month' ? 'bg-purple-50 text-purple-700' : ''}
                        >
                            <span className="flex items-center gap-2">
                                {value === 'this_month' && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                                {t('history.time_filters.this_month')}
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleOptionSelect('this_year')}
                            className={value === 'this_year' ? 'bg-purple-50 text-purple-700' : ''}
                        >
                            <span className="flex items-center gap-2">
                                {value === 'this_year' && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                                {t('history.time_filters.this_year')}
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleOptionSelect('all_time')}
                            className={value === 'all_time' ? 'bg-purple-50 text-purple-700' : ''}
                        >
                            <span className="flex items-center gap-2">
                                {value === 'all_time' && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                                {t('wholesaler_dashboard.all_time')}
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => handleOptionSelect('custom')}
                            className={value === 'custom' ? 'bg-purple-50 text-purple-700' : ''}
                        >
                            <span className="flex items-center gap-2">
                                {value === 'custom' && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                                {t('wholesaler_dashboard.select_custom_range')}...
                            </span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Reset Button - Only show when not on default */}
                {!isDefault && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleReset}
                        className="bg-white shadow-sm hover:bg-gray-50 h-9 w-9 md:h-10 md:w-10 flex-shrink-0"
                        title={t('wholesaler_dashboard.reset_to_today')}
                    >
                        <RotateCcw className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500" />
                    </Button>
                )}
            </div>

            {/* Custom Date Range Dialog */}
            <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-purple-500" />
                            {t('wholesaler_dashboard.select_custom_range')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">{t('history.custom_range.from')}</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">{t('history.custom_range.to')}</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    min={customStartDate}
                                />
                            </div>
                        </div>
                        {customStartDate && customEndDate && (
                            <div className="p-3 bg-purple-50 rounded-lg text-center">
                                <p className="text-sm text-purple-700">
                                    <span className="font-medium">
                                        {format(new Date(customStartDate), 'dd MMMM yyyy')}
                                    </span>
                                    {' → '}
                                    <span className="font-medium">
                                        {format(new Date(customEndDate), 'dd MMMM yyyy')}
                                    </span>
                                </p>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsCustomDialogOpen(false)}
                                className="flex-1"
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                onClick={handleCustomApply}
                                className="flex-1 bg-purple-600 hover:bg-purple-700"
                                disabled={!customStartDate || !customEndDate}
                            >
                                {t('history.custom_range.apply')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
