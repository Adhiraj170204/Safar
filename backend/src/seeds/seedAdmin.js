import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Safar');
    console.log('✅ MongoDB Connected');

    // Admin user details
    const adminData = {
      name: "Admin User",
      username: "admin",
      email: "adhirajdubey17ad@gmail.com", // Your email from .env
      password: "Admin@123", // Change this to your preferred password
      role: "admin",
      verified: true, // Auto-verify admin
      profileImage: {
        url: "https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg",
        public_id: "admin_avatar"
      }
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Username:', existingAdmin.username);
      console.log('🔑 Role:', existingAdmin.role);
      
      // Update to admin if not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        existingAdmin.verified = true;
        await existingAdmin.save();
        console.log('✅ Updated existing user to admin!');
      }
    } else {
      // Create new admin user
      const admin = new User(adminData);
      await admin.save();
      
      console.log('✅ Admin user created successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', adminData.email);
      console.log('👤 Username:', adminData.username);
      console.log('🔑 Password:', adminData.password);
      console.log('🛡️  Role:', adminData.role);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️  IMPORTANT: Change your password after first login!');
    }

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ MongoDB Disconnected');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
