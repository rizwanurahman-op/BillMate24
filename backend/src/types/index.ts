// User roles
export type Role = 'admin' | 'shopkeeper';

// Feature flags
export interface Features {
    wholesalers: boolean;
    dueCustomers: boolean;
    normalCustomers: boolean;
    billing: boolean;
    reports: boolean;
}

// User interface
export interface IUser {
    _id: string;
    email: string;
    password: string;
    name: string;
    role: Role;
    phone?: string;
    businessName?: string;
    address?: string;
    place?: string;
    features: Features;
    isActive: boolean;
    refreshToken?: string;
    resetPasswordOTP?: string;
    resetPasswordOTPExpires?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Wholesaler interface
export interface IWholesaler {
    _id: string;
    shopkeeperId: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    place?: string;
    gstNumber?: string;
    totalPurchased: number;
    totalPaid: number;
    outstandingDue: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Customer interface
export type CustomerType = 'due' | 'normal';

export interface ICustomer {
    _id: string;
    shopkeeperId: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    place?: string;
    type: CustomerType;
    totalSales: number;
    totalPaid: number;
    outstandingDue: number;
    lastPaymentDate?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Bill types
export type BillType = 'purchase' | 'sale';
export type EntityType = 'wholesaler' | 'due_customer' | 'normal_customer';
export type PaymentMethod = 'cash' | 'card' | 'online';

export interface IBillItem {
    name: string;
    quantity: number;
    price: number;
    total: number;
}

export interface IBill {
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
    items?: IBillItem[];
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Payment interface
export interface IPayment {
    _id: string;
    shopkeeperId: string;
    billId?: string;
    entityType: 'wholesaler' | 'customer';
    entityId: string;
    entityName: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    createdAt: Date;
}

// Transaction interface
export type TransactionType = 'income' | 'expense';

export interface ITransaction {
    _id: string;
    shopkeeperId: string;
    type: TransactionType;
    category: string;
    amount: number;
    paymentMethod: PaymentMethod;
    reference?: string;
    description?: string;
    createdAt: Date;
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
export interface TokenPayload {
    userId: string;
    role: Role;
    features?: Features;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface LoginResponse {
    user: Omit<IUser, 'password' | 'refreshToken'>;
    tokens: AuthTokens;
}
