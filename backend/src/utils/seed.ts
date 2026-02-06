import mongoose from "mongoose";
import { connectDatabase } from "../config";
import { User } from "../modules/users/user.model";
import { Wholesaler } from "../modules/wholesalers/wholesaler.model";
import { hashPassword } from "./auth";

const seedDatabase = async () => {
  try {
    await connectDatabase();
    console.log("🌱 Starting database seed...");

    // Check if admin exists
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("⚠️ Admin user already exists. Skipping seed.");
    } else {
      // Create admin user
      const adminPassword = await hashPassword("Rizwanu@2009");

      const admin = new User({
        email: "Rizwanurahmanop@gmail.com",
        password: adminPassword,
        name: "System Admin",
        role: "admin",
        isActive: true,
        features: {
          wholesalers: true,
          dueCustomers: true,
          normalCustomers: true,
          billing: true,
          reports: true,
        },
      });

      await admin.save();
      console.log("✅ Admin user created:");
      console.log("   Email: Rizwanurahmanop@gmail.com");
      console.log("   Password: Rizwanu@2009");
    }

    // Create demo shopkeeper
    const existingShopkeeper = await User.findOne({
      email: "shop@billmate24.com",
    });

    if (!existingShopkeeper) {
      const shopkeeperPassword = await hashPassword("Shop@123");

      const shopkeeper = new User({
        email: "shop@billmate24.com",
        password: shopkeeperPassword,
        name: "Demo Shopkeeper",
        role: "shopkeeper",
        businessName: "Demo Store",
        phone: "9876543210",
        address: "Demo Address, City",
        isActive: true,
        features: {
          wholesalers: true,
          dueCustomers: true,
          normalCustomers: true,
          billing: true,
          reports: true,
        },
      });

      await shopkeeper.save();
      console.log("✅ Demo shopkeeper created:");
      console.log("   Email: shop@billmate24.com");
      console.log("   Password: Shop@123");
    }

    // Seed Wholesalers
    const shopkeeperForSeed = await User.findOne({
      email: "shop@billmate24.com",
    });

    if (shopkeeperForSeed) {
      console.log("📦 Seeding Wholesalers...");

      const wholesalers = [
        {
          name: "Metro Cash & Carry",
          phone: "18602662010",
          whatsappNumber: "18602662010",
          address: "Industrial Area, City Outskirts",
          totalPurchased: 500000,
          totalPaid: 450000,
          outstandingDue: 50000,
          isActive: true,
        },
        {
          name: "Reliance Market",
          phone: "18001027382",
          whatsappNumber: "18001027382",
          address: "City Center Mall, Ground Floor",
          totalPurchased: 250000,
          totalPaid: 250000,
          outstandingDue: 0,
          isActive: true,
        },
        {
          name: "Local Grain Distributors",
          phone: "9876543211",
          whatsappNumber: "9876543211",
          address: "Vegetable Market Road",
          totalPurchased: 100000,
          totalPaid: 80000,
          outstandingDue: 20000,
          isActive: true,
        },
        {
          name: "Best Price Wholesale",
          phone: "18002082255",
          whatsappNumber: "18002082255",
          address: "Near Highway Exit",
          totalPurchased: 75000,
          totalPaid: 75000,
          outstandingDue: 0,
          isActive: true,
        },
        {
          name: "City Spices & Condiments",
          phone: "9876543212",
          whatsappNumber: "9876543212",
          address: "Main Bazaar, Old City",
          totalPurchased: 15000,
          totalPaid: 5000,
          outstandingDue: 10000,
          isActive: true,
        },
      ];

      for (const w of wholesalers) {
        const exists = await Wholesaler.findOne({
          shopkeeperId: shopkeeperForSeed._id,
          name: w.name,
        });

        if (!exists) {
          await Wholesaler.create({
            ...w,
            shopkeeperId: shopkeeperForSeed._id,
          });
          console.log(`   ✅ Created wholesaler: ${w.name}`);
        } else {
          console.log(`   ⚠️ Wholesaler ${w.name} already exists. Skipping.`);
        }
      }
    }

    console.log("🎉 Database seed completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
};

seedDatabase();
