/**
 * Migration Script: Convert initialPurchased to openingPurchases and openingPayments
 * 
 * Purpose: This script migrates existing wholesaler data from the old single-field
 * system (initialPurchased) to the new two-field system (openingPurchases, openingPayments).
 * 
 * Run this in MongoDB shell or use with a migration tool.
 */

// MongoDB Shell Script
db.wholesalers.find({}).forEach(function (wholesaler) {
    let openingPurchases = 0;
    let openingPayments = 0;

    if (wholesaler.initialPurchased > 0) {
        // Positive value means we owe them (goods received)
        openingPurchases = wholesaler.initialPurchased;
        openingPayments = 0;
    } else if (wholesaler.initialPurchased < 0) {
        // Negative value means we paid advance (they owe us)
        openingPurchases = 0;
        openingPayments = Math.abs(wholesaler.initialPurchased);
    }

    // Update the wholesaler record
    db.wholesalers.updateOne(
        { _id: wholesaler._id },
        {
            $set: {
                openingPurchases: openingPurchases,
                openingPayments: openingPayments
            }
        }
    );

    print(`Updated wholesaler: ${wholesaler.name} - Purchases: ${openingPurchases}, Payments: ${openingPayments}`);
});

print("\n===========================================");
print("Migration Complete!");
print("===========================================\n");

// Verification query
print("Verification - Wholesalers with opening balances:");
db.wholesalers.find({
    $or: [
        { openingPurchases: { $gt: 0 } },
        { openingPayments: { $gt: 0 } }
    ]
}).forEach(function (wholesaler) {
    const balance = wholesaler.openingPurchases - wholesaler.openingPayments;
    print(`${wholesaler.name}: Purchases=₹${wholesaler.openingPurchases}, Payments=₹${wholesaler.openingPayments}, Balance=${balance >= 0 ? 'You owe ₹' + balance : 'They owe ₹' + Math.abs(balance)}`);
});
