'use client';

import { Search, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface BillFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    billType: string;
    onBillTypeChange: (value: string) => void;
}

export function BillFilters({ search, onSearchChange, billType, onBillTypeChange }: BillFiltersProps) {
    return (
        <CardHeader className="border-b bg-gray-50/50">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <CardTitle>All Bills</CardTitle>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search bills..."
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 w-64"
                        />
                    </div>
                    <Select value={billType} onValueChange={onBillTypeChange}>
                        <SelectTrigger className="w-40">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="sale">Sales</SelectItem>
                            <SelectItem value="purchase">Purchases</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardHeader>
    );
}
