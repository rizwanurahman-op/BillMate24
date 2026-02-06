'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);

    if (total === 0) return null;

    return (
        <div className="flex flex-col items-center gap-3 px-3 md:px-4 py-3 border-t bg-gray-50/50">
            {/* Mobile: Compact pagination */}
            <div className="flex items-center justify-center gap-2 md:hidden w-full">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="h-9 px-3"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                </Button>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                    <span>{page}</span>
                    <span className="text-purple-400">/</span>
                    <span>{totalPages}</span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className="h-9 px-3"
                >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>

            {/* Desktop: Full pagination */}
            <div className="hidden md:flex md:flex-row items-center justify-between w-full">
                <p className="text-sm text-gray-600">
                    Showing <span className="font-medium">{from}</span> to{' '}
                    <span className="font-medium">{to}</span> of{' '}
                    <span className="font-medium">{total}</span> results
                </p>

                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onPageChange(1)}
                        disabled={page === 1}
                        className="h-8 w-8"
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page === 1}
                        className="h-8 w-8"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1 mx-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (page <= 3) {
                                pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = page - 2 + i;
                            }

                            return (
                                <Button
                                    key={pageNum}
                                    variant={page === pageNum ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => onPageChange(pageNum)}
                                    className={`h-8 w-8 ${page === pageNum ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page === totalPages}
                        className="h-8 w-8"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onPageChange(totalPages)}
                        disabled={page === totalPages}
                        className="h-8 w-8"
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
