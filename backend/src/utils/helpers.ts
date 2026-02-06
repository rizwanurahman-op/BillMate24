import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

export const sendSuccess = <T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200
): Response => {
    const response: ApiResponse<T> = {
        success: true,
        message,
        data,
    };
    return res.status(statusCode).json(response);
};

export const sendError = (
    res: Response,
    message: string,
    statusCode = 500,
    error?: string
): Response => {
    const response: ApiResponse = {
        success: false,
        message,
        error,
    };
    return res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
    res: Response,
    data: T[],
    pagination: PaginatedResponse<T>['pagination'],
    additionalData?: Record<string, any>,
    message = 'Success'
): Response => {
    const response: PaginatedResponse<T> = {
        success: true,
        message,
        data,
        pagination,
        ...additionalData,
    };
    return res.status(200).json(response);
};

export const generateBillNumber = (prefix: string = 'BILL'): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${year}${month}-${random}`;
};

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount);
};

export const getPaginationParams = (page?: string, limit?: string) => {
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '10', 10)));
    const skip = (pageNum - 1) * limitNum;
    return { page: pageNum, limit: limitNum, skip };
};
