import mongoose from 'mongoose';
import { Transaction } from '../modules/dashboard/transaction.model';
import { Bill } from '../modules/bills/bill.model';
import { Customer } from '../modules/customers/customer.model';
import { Wholesaler } from '../modules/wholesalers/wholesaler.model';

/**
 * This script creates database indexes to optimize dashboard queries
 * Run this once after deployment or during initial setup
 */
export async function createDashboardIndexes() {
    console.log('Creating dashboard performance indexes...');

    try {
        // Transaction indexes for fast dashboard queries
        await Transaction.collection.createIndexes([
            // Index for shopkeeper + type + date queries
            {
                key: { shopkeeperId: 1, type: 1, createdAt: -1 },
                name: 'shopkeeper_type_date_idx',
            },
            // Index for shopkeeper + date queries
            {
                key: { shopkeeperId: 1, createdAt: -1 },
                name: 'shopkeeper_date_idx',
            },
            // Index for payment method filtering
            {
                key: { shopkeeperId: 1, paymentMethod: 1, type: 1 },
                name: 'shopkeeper_payment_method_idx',
            },
        ]);
        console.log('✓ Transaction indexes created');

        // Bill indexes for fast dashboard queries
        await Bill.collection.createIndexes([
            // Index for shopkeeper + billType + date queries
            {
                key: { shopkeeperId: 1, billType: 1, createdAt: -1 },
                name: 'shopkeeper_billtype_date_idx',
            },
            // Index for recent bills
            {
                key: { shopkeeperId: 1, createdAt: -1 },
                name: 'shopkeeper_recent_bills_idx',
            },
        ]);
        console.log('✓ Bill indexes created');

        // Customer indexes for fast dashboard queries
        await Customer.collection.createIndexes([
            // Index for shopkeeper + type + outstandingDue queries
            {
                key: { shopkeeperId: 1, type: 1, outstandingDue: -1 },
                name: 'shopkeeper_type_dues_idx',
            },
            // Index for overdue customers
            {
                key: { shopkeeperId: 1, type: 1, lastTransactionDate: 1 },
                name: 'shopkeeper_overdue_idx',
            },
        ]);
        console.log('✓ Customer indexes created');

        // Wholesaler indexes for fast dashboard queries
        await Wholesaler.collection.createIndexes([
            // Index for shopkeeper + dues queries
            {
                key: { shopkeeperId: 1, isDeleted: 1, outstandingDue: -1 },
                name: 'shopkeeper_wholesaler_dues_idx',
            },
        ]);
        console.log('✓ Wholesaler indexes created');

        console.log('✅ All dashboard indexes created successfully!');
        console.log('Dashboard queries should now be significantly faster.');
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        throw error;
    }
}

// Optional: Function to drop old indexes if needed
export async function dropOldIndexes() {
    console.log('Dropping old indexes...');

    try {
        // Be careful with this - only drop indexes you're sure about
        // await Transaction.collection.dropIndexes();
        // await Bill.collection.dropIndexes();
        // await Customer.collection.dropIndexes();
        // await Wholesaler.collection.dropIndexes();

        console.log('✓ Old indexes dropped');
    } catch (error) {
        console.error('Error dropping indexes:', error);
    }
}
