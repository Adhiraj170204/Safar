import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.js";
import readline from "readline";

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Safar');
    console.log('✅ MongoDB Connected\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('     CREATE ADMIN USER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let name, username, email, password;

    if (process.env.ADMIN_EMAIL) {
      // Non-interactive mode: read credentials from env vars
      name     = process.env.ADMIN_NAME     || 'Admin User';
      username = process.env.ADMIN_USERNAME || 'admin';
      email    = process.env.ADMIN_EMAIL;
      password = process.env.ADMIN_PASSWORD || 'Admin@123';
      console.log('ℹ️  Using env var credentials (non-interactive mode)\n');
    } else {
      // Interactive mode: prompt in terminal
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const question = (q) => new Promise((resolve) => rl.question(q, resolve));
      name     = await question('Enter admin name (default: Admin User): ') || 'Admin User';
      username = await question('Enter username (default: admin): ') || 'admin';
      email    = await question('Enter email: ');
      if (!email) { console.error('Email is required.'); rl.close(); process.exit(1); }
      password = await question('Enter password (default: Admin@123): ') || 'Admin@123';
      rl.close();
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      console.log('\n⚠️  User already exists!');
      console.log('📧 Email:', existingUser.email);
      console.log('👤 Username:', existingUser.username);
      console.log('🔑 Current Role:', existingUser.role);
      
      // Update to admin
      existingUser.role = 'admin';
      existingUser.verified = true;
      await existingUser.save();
      
      console.log('\n✅ Updated user to admin role!');
    } else {
      // Create new admin
      const adminData = {
        name,
        username,
        email,
        password,
        role: "admin",
        verified: true
      };

      const admin = new User(adminData);
      await admin.save();

      console.log('\n✅ Admin user created successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', email);
      console.log('👤 Username:', username);
      console.log('🔑 Password:', password);
      console.log('🛡️  Role: admin');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n⚠️  IMPORTANT: Change your password after first login!');
    }

    await mongoose.disconnect();
    console.log('\n✅ MongoDB Disconnected');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
