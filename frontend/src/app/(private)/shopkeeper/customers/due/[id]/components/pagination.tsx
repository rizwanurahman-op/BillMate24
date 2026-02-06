'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
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
        <>
            {/* Mobile Pagination */}
            <div className="flex md:hidden items-center justify-center gap-2 px-3 py-3 border-t bg-gray-50/50">
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
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
                    <span>{page}</span>
                    <span className="text-indigo-400">/</span>
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

            {/* Desktop Pagination */}
            <div className="hidden md:flex items-center justify-between gap-4 px-6 py-4 border-t bg-gray-50/50">
                <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{from}</span> to{' '}
                    <span className="font-semibold">{to}</span> of{' '}
                    <span className="font-semibold">{total}</span> results
                </p>

                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 1}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1 mx-1">
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
                                        className={`h-8 w-8 ${page === pageNum ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(page + 1)}
                            disabled={page === totalPages}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}
