import mongoose from 'mongoose';
import { Transaction } from '../modules/dashboard/transaction.model';
import { Bill } from '../modules/bills/bill.model';
import { Customer } from '../modules/customers/customer.model';
import { Wholesaler } from '../modules/wholesalers/wholesaler.model';

/**
 * Helper function to safely create an index
 * Checks if index exists before creating to avoid conflicts
 */
async function safeCreateIndex(
    collection: any,
    indexSpec: any,
    options: { name: string }
): Promise<boolean> {
    try {
        const existingIndexes = await collection.indexes();

        // Check if an index with these exact keys already exists
        const indexExists = existingIndexes.some((idx: any) => {
            const existingKeys = JSON.stringify(idx.key);
            const newKeys = JSON.stringify(indexSpec);
            return existingKeys === newKeys;
        });

        if (indexExists) {
            return false; // Skip, already exists
        }

        await collection.createIndex(indexSpec, options);
        return true; // Created
    } catch (error: any) {
        // Error code 85 = IndexOptionsConflict (index exists with different name)
        // Error code 86 = IndexKeySpecsConflict (similar index already exists)
        if (error.code === 85 || error.code === 86) {
            return false; // Skip, already exists
        }
        throw error; // Re-throw other errors
    }
}

/**
 * This script creates database indexes to optimize dashboard queries
 * Run this once after deployment or during initial setup
 */
export async function createDashboardIndexes() {
    console.log('Creating dashboard performance indexes...');

    let created = 0;
    let skipped = 0;

    try {
        // Transaction indexes for fast dashboard queries
        const transactionIndexes = [
            {
                key: { shopkeeperId: 1, type: 1, createdAt: -1 },
                name: 'shopkeeper_type_date_idx',
            },
            {
                key: { shopkeeperId: 1, createdAt: -1 },
                name: 'shopkeeper_date_idx',
            },
            {
                key: { shopkeeperId: 1, paymentMethod: 1, type: 1 },
                name: 'shopkeeper_payment_method_idx',
            },
        ];

        for (const idx of transactionIndexes) {
            const result = await safeCreateIndex(Transaction.collection, idx.key, { name: idx.name });
            result ? created++ : skipped++;
        }
        console.log('✓ Transaction indexes checked');

        // Bill indexes for fast dashboard queries
        const billIndexes = [
            {
                key: { shopkeeperId: 1, billType: 1, createdAt: -1 },
                name: 'shopkeeper_billtype_date_idx',
            },
            {
                key: { shopkeeperId: 1, createdAt: -1 },
                name: 'shopkeeper_recent_bills_idx',
            },
        ];

        for (const idx of billIndexes) {
            const result = await safeCreateIndex(Bill.collection, idx.key, { name: idx.name });
            result ? created++ : skipped++;
        }
        console.log('✓ Bill indexes checked');

        // Customer indexes for fast dashboard queries
        const customerIndexes = [
            {
                key: { shopkeeperId: 1, type: 1, outstandingDue: -1 },
                name: 'shopkeeper_type_dues_idx',
            },
            {
                key: { shopkeeperId: 1, type: 1, lastTransactionDate: 1 },
                name: 'shopkeeper_overdue_idx',
            },
        ];

        for (const idx of customerIndexes) {
            const result = await safeCreateIndex(Customer.collection, idx.key, { name: idx.name });
            result ? created++ : skipped++;
        }
        console.log('✓ Customer indexes checked');

        // Wholesaler indexes for fast dashboard queries
        const wholesalerIndexes = [
            {
                key: { shopkeeperId: 1, isDeleted: 1, outstandingDue: -1 },
                name: 'shopkeeper_wholesaler_dues_idx',
            },
        ];

        for (const idx of wholesalerIndexes) {
            const result = await safeCreateIndex(Wholesaler.collection, idx.key, { name: idx.name });
            result ? created++ : skipped++;
        }
        console.log('✓ Wholesaler indexes checked');

        console.log(`✅ Dashboard indexes: ${created} created, ${skipped} skipped (already exist)`);
        console.log('Dashboard queries are optimized for performance.');
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
