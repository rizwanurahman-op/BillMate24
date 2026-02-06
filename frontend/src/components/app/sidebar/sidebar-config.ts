import { Role, Features } from '@/types';
import {
    LayoutDashboard,
    Receipt,
    Package,
    Users,
    FileText,
    Settings,
    Store,
    UserCog,
    CreditCard,
    Database,
} from 'lucide-react';

export interface SidebarItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    feature?: keyof Features;
    children?: SidebarItem[];
}

export interface SidebarConfig {
    role: Role;
    items: SidebarItem[];
}

export const adminSidebarConfig: SidebarItem[] = [
    {
        title: 'sidebar.dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'sidebar.shopkeepers',
        href: '/admin/shopkeepers',
        icon: Store,
    },
    {
        title: 'sidebar.storage',
        href: '/admin/storage',
        icon: Database,
    },
    {
        title: 'sidebar.subscriptions',
        href: '/admin/subscriptions',
        icon: CreditCard,
    },
    {
        title: 'sidebar.settings',
        href: '/admin/settings',
        icon: Settings,
    },
];

export const shopkeeperSidebarConfig: SidebarItem[] = [
    {
        title: 'sidebar.dashboard',
        href: '/shopkeeper/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'sidebar.billing',
        href: '/shopkeeper/billing',
        icon: Receipt,
        feature: 'billing',
        children: [
            {
                title: 'sidebar.add_bill',
                href: '/shopkeeper/billing',
                icon: Receipt,
                feature: 'billing',
            },
            {
                title: 'sidebar.bill_history',
                href: '/shopkeeper/billing/history',
                icon: FileText,
                feature: 'billing',
            },
        ],
    },
    {
        title: 'sidebar.wholesalers',
        href: '/shopkeeper/wholesalers',
        icon: Package,
        feature: 'wholesalers',
        children: [
            {
                title: 'sidebar.dashboard',
                href: '/shopkeeper/wholesalers/dashboard',
                icon: LayoutDashboard,
                feature: 'wholesalers',
            },
            {
                title: 'sidebar.list',
                href: '/shopkeeper/wholesalers',
                icon: Package,
                feature: 'wholesalers',
            },
            {
                title: 'sidebar.payments',
                href: '/shopkeeper/wholesalers/payments',
                icon: CreditCard,
                feature: 'wholesalers',
            },
        ],
    },
    {
        title: 'sidebar.customers',
        href: '/shopkeeper/customers',
        icon: Users,
        children: [
            {
                title: 'sidebar.dashboard',
                href: '/shopkeeper/customers/dashboard',
                icon: LayoutDashboard,
            },
            {
                title: 'sidebar.due_customers',
                href: '/shopkeeper/customers/due',
                icon: UserCog,
                feature: 'dueCustomers',
            },
            {
                title: 'sidebar.normal_customers',
                href: '/shopkeeper/customers/normal',
                icon: Users,
                feature: 'normalCustomers',
            },
        ],
    },
    {
        title: 'sidebar.invoices',
        href: '/shopkeeper/invoices',
        icon: FileText,
        children: [
            {
                title: 'sidebar.create_invoice',
                href: '/shopkeeper/invoices/create',
                icon: Receipt,
            },
            {
                title: 'sidebar.invoice_list',
                href: '/shopkeeper/invoices',
                icon: FileText,
            },
        ],
    },
    {
        title: 'sidebar.reports',
        href: '/shopkeeper/reports',
        icon: FileText,
        feature: 'reports',
        children: [
            {
                title: 'sidebar.revenue_report',
                href: '/shopkeeper/reports/daily',
                icon: FileText,
                feature: 'reports',
            },
            {
                title: 'sidebar.outstanding_dues',
                href: '/shopkeeper/reports/dues',
                icon: FileText,
                feature: 'reports',
            },
        ],
    },
    {
        title: 'sidebar.settings',
        href: '/shopkeeper/settings',
        icon: Settings,
    },
];

export const getSidebarConfig = (role: Role): SidebarItem[] => {
    return role === 'admin' ? adminSidebarConfig : shopkeeperSidebarConfig;
};
