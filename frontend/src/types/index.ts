// User roles
export type Role = 'admin' | 'shopkeeper';

// Feature flags
export interface Features {
    wholesalers: boolean;
    dueCustomers: boolean;
    normalCustomers: boolean;
    billing: boolean;
    reports: boolean;
    invoices: boolean;
}

// User interface
export interface User {
    _id: string;
    email: string;
    name: string;
    role: Role;
    phone?: string;
    businessName?: string;
    address?: string;
    place?: string;
    features: Features;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// Storage statistics interface
export interface StorageStats {
    shopkeeperId: string;
    storage: {
        totalBytes: number;
        formatted: string;
    };
    customers: {
        total: number;
        due: number;
        normal: number;
    };
    wholesalers: {
        total: number;
    };
    bills: {
        total: number;
        purchase: number;
        sale: number;
    };
    payments: {
        total: number;
        toCustomers: number;
        toWholesalers: number;
    };
    transactions: {
        total: number;
        income: number;
        expense: number;
    };
    invoices: {
        total: number;
        draft: number;
        sent: number;
        paid: number;
    };
    revenue: {
        total: number;
        expenses: number;
        profit: number;
    };
}

// User with storage stats
export interface UserWithStorage extends User {
    storageStats: StorageStats;
}

// Wholesaler interface
export interface Wholesaler {
    _id: string;
    shopkeeperId: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    place?: string;
    gstNumber?: string;
    whatsappNumber?: string;
    initialPurchased?: number;
    openingPurchases?: number;
    openingPayments?: number;
    totalPurchased: number;
    totalPaid: number;
    outstandingDue: number;
    isActive: boolean;
    isDeleted?: boolean;
    deletedAt?: string;
    createdAt: string;
    updatedAt: string;
}

// Customer interface
export type CustomerType = 'due' | 'normal';

export interface Customer {
    _id: string;
    shopkeeperId: string;
    name: string;
    phone?: string;
    whatsappNumber?: string;
    email?: string;
    address?: string;
    place?: string;
    type: CustomerType;
    openingSales: number;
    openingPayments: number;
    totalSales: number;
    totalPaid: number;
    outstandingDue: number;
    lastPaymentDate?: string;
    isActive: boolean;
    isDeleted?: boolean;
    deletedAt?: string;
    createdAt: string;
    updatedAt: string;
}

// Bill types
export type BillType = 'purchase' | 'sale';
export type EntityType = 'wholesaler' | 'due_customer' | 'normal_customer';
export type PaymentMethod = 'cash' | 'card' | 'online';

export interface BillItem {
    name: string;
    quantity: number;
    price: number;
    total: number;
}

export interface Bill {
    _id: string;
    shopkeeperId: string;
    billNumber: string;
    billType: BillType;
    entityType: EntityType;
    entityId?: string;
    entityName: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentMethod: PaymentMethod;
    items?: BillItem[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// Payment interface
export interface Payment {
    _id: string;
    shopkeeperId: string;
    billId?: string;
    entityType: 'wholesaler' | 'customer';
    entityId: string;
    entityName: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    createdAt: string;
}

// Transaction interface
export type TransactionType = 'income' | 'expense';

export interface Transaction {
    _id: string;
    shopkeeperId: string;
    type: TransactionType;
    category: string;
    amount: number;
    paymentMethod: PaymentMethod;
    reference?: string;
    description?: string;
    createdAt: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Auth types
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface LoginResponse {
    user: User;
    tokens: AuthTokens;
}

// Dashboard types
export interface DashboardData {
    todayRevenue: number;
    monthRevenue: number;
    totalDueFromCustomers: number;
    totalDueToWholesalers: number;
    paymentMethodSplit: { cash: number; card: number; online: number };
    recentTransactions: Transaction[];
}

export interface WholesalerDashboard {
    totalWholesalers: number;
    totalPurchased: number;
    totalPaid: number;
    totalOutstanding: number;
}

export interface CustomerDashboard {
    totalCustomers: number;
    totalSales: number;
    totalPaid: number;
    totalOutstanding: number;
}
