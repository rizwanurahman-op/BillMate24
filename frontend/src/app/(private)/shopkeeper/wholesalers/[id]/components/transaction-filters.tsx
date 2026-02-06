'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Calendar, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';

export type TimeFilterOption = 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year' | 'custom';

export interface FilterState {
    search: string;
    timeFilter: TimeFilterOption;
    startDate?: string;
    endDate?: string;
}

interface TransactionFiltersProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
}

const filterLabels: Record<TimeFilterOption, string> = {
    all: 'history.time_filters.all',
    today: 'history.time_filters.today',
    yesterday: 'history.time_filters.yesterday',
    this_week: 'history.time_filters.this_week',
    this_month: 'history.time_filters.this_month',
    this_year: 'history.time_filters.this_year',
    custom: 'history.time_filters.custom',
};

export function getDateRangeForFilter(option: TimeFilterOption, customStart?: string, customEnd?: string): { startDate?: string; endDate?: string } {
    const now = new Date();

    switch (option) {
        case 'all':
            return {};
        case 'today':
            return {
                startDate: format(startOfDay(now), 'yyyy-MM-dd'),
                endDate: format(endOfDay(now), 'yyyy-MM-dd')
            };
        case 'yesterday':
            const yesterday = subDays(now, 1);
            return {
                startDate: format(startOfDay(yesterday), 'yyyy-MM-dd'),
                endDate: format(endOfDay(yesterday), 'yyyy-MM-dd')
            };
        case 'this_week':
            return {
                startDate: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
                endDate: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            };
        case 'this_month':
            return {
                startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
                endDate: format(endOfMonth(now), 'yyyy-MM-dd')
            };
        case 'this_year':
            return {
                startDate: format(startOfYear(now), 'yyyy-MM-dd'),
                endDate: format(endOfYear(now), 'yyyy-MM-dd')
            };
        case 'custom':
            return { startDate: customStart, endDate: customEnd };
        default:
            return {};
    }
}

export function TransactionFilters({ filters, onFiltersChange }: TransactionFiltersProps) {
    const { t } = useTranslation();
    const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
    const [customStartDate, setCustomStartDate] = useState(filters.startDate || '');
    const [customEndDate, setCustomEndDate] = useState(filters.endDate || '');

    const handleTimeFilterSelect = (option: TimeFilterOption) => {
        if (option === 'custom') {
            setCustomStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
            setCustomEndDate(format(new Date(), 'yyyy-MM-dd'));
            setIsCustomDialogOpen(true);
        } else {
            const dateRange = getDateRangeForFilter(option);
            onFiltersChange({
                ...filters,
                timeFilter: option,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
            });
        }
    };

    const handleCustomApply = () => {
        if (customStartDate && customEndDate) {
            onFiltersChange({
                ...filters,
                timeFilter: 'custom',
                startDate: customStartDate,
                endDate: customEndDate,
            });
            setIsCustomDialogOpen(false);
        }
    };

    const handleSearchChange = (value: string) => {
        onFiltersChange({ ...filters, search: value });
    };

    const clearFilters = () => {
        onFiltersChange({
            search: '',
            timeFilter: 'all',
            startDate: undefined,
            endDate: undefined,
        });
    };

    const hasActiveFilters = filters.search || filters.timeFilter !== 'all';

    const getTimeFilterLabel = () => {
        if (filters.timeFilter === 'custom' && filters.startDate && filters.endDate) {
            return `${format(new Date(filters.startDate), 'dd MMM')} - ${format(new Date(filters.endDate), 'dd MMM')}`;
        }
        return t(filterLabels[filters.timeFilter]);
    };

    return (
        <>
            <div className="flex flex-row gap-2 items-center">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                    <Input
                        placeholder={t('wholesaler_payments.filters.search')}
                        value={filters.search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-8 md:pl-10 h-8 md:h-9 text-sm"
                    />
                </div>

                {/* Time Filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-1 md:gap-2 h-8 md:h-9 text-xs md:text-sm px-2 md:px-3">
                            <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-500" />
                            <span className="hidden sm:inline">{getTimeFilterLabel()}</span>
                            <span className="sm:hidden">{filters.timeFilter === 'all' ? t('wholesalers_list.stats.all_badge') : '...'}</span>
                            <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        {(['all', 'today', 'yesterday', 'this_week', 'this_month', 'this_year'] as TimeFilterOption[]).map((option) => (
                            <DropdownMenuItem
                                key={option}
                                onClick={() => handleTimeFilterSelect(option)}
                                className={filters.timeFilter === option ? 'bg-purple-50 text-purple-700' : ''}
                            >
                                <span className="flex items-center gap-2">
                                    {filters.timeFilter === option && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                                    {t(filterLabels[option])}
                                </span>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => handleTimeFilterSelect('custom')}
                            className={filters.timeFilter === 'custom' ? 'bg-purple-50 text-purple-700' : ''}
                        >
                            <span className="flex items-center gap-2">
                                {filters.timeFilter === 'custom' && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                                {t('history.time_filters.custom')}...
                            </span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 md:h-9 px-2 md:px-3">
                        <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="hidden sm:inline ml-1">{t('wholesalers_list.filters.clear_dues')}</span>
                    </Button>
                )}
            </div>

            {/* Active Filters Badge - Hidden on mobile */}
            {hasActiveFilters && (
                <div className="hidden sm:flex gap-2 mt-3">
                    {filters.search && (
                        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                            {t('wholesaler_payments.filters.search')}: {filters.search}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => handleSearchChange('')}
                            />
                        </Badge>
                    )}
                    {filters.timeFilter !== 'all' && (
                        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                            {getTimeFilterLabel()}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => handleTimeFilterSelect('all')}
                            />
                        </Badge>
                    )}
                </div>
            )}

            {/* Custom Date Range Dialog */}
            <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-purple-500" />
                            {t('wholesaler_payments.custom_date.title')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">{t('wholesaler_payments.custom_date.start')}</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">{t('wholesaler_payments.custom_date.end')}</Label>
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
                                {t('wholesaler_payments.custom_date.apply')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
