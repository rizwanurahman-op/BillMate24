import mongoose from 'mongoose';
import { connectDatabase } from '../config';
import { User } from '../modules/users/user.model';
import { hashPassword } from './auth';

const updateAdmin = async () => {
    try {
        await connectDatabase();
        console.log('🔄 Updating admin credentials...');

        // Find the existing admin
        const existingAdmin = await User.findOne({ role: 'admin' });

        if (!existingAdmin) {
            console.log('❌ No admin user found. Please run the seed script first.');
            process.exit(1);
        }

        // Update admin credentials
        const adminPassword = await hashPassword('Rizwanu@2009');

        existingAdmin.email = 'Rizwanurahmanop@gmail.com';
        existingAdmin.password = adminPassword;
        existingAdmin.name = 'System Admin';
        existingAdmin.isActive = true;
        existingAdmin.features = {
            wholesalers: true,
            dueCustomers: true,
            normalCustomers: true,
            billing: true,
            reports: true,
            invoices: true,
        };

        await existingAdmin.save();

        console.log('✅ Admin credentials updated successfully!');
        console.log('   Email: Rizwanurahmanop@gmail.com');
        console.log('   Password: Rizwanu@2009');
        console.log('🎉 Update completed!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Update failed:', error);
        process.exit(1);
    }
};

updateAdmin();
