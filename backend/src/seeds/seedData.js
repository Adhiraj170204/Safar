import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.js";
import Camp from "../models/camp.js";
import Review from "../models/review.js";

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Safar');
    console.log('✅ MongoDB Connected');

    // Skip if data already exists (idempotent — protects production data)
    const existing = await Camp.countDocuments();
    if (existing > 0 && process.env.SEED_FORCE !== 'true' && !process.argv.includes('--force')) {
      console.log('ℹ️  Data already exists, skipping seed. (Use SEED_FORCE=true or --force to re-seed)');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Camp.deleteMany({});
    await Review.deleteMany({});
    await User.deleteMany({});
    console.log('✅ Data cleared');

    // Create Admin User
    const admin = new User({
      name: "Admin User",
      username: "admin",
      email: process.env.EMAIL_USER || "admin@safar.com",
      password: "Admin@123",
      role: "admin",
      verified: true,
      profileImage: {
        url: "https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg",
        public_id: "admin_avatar"
      }
    });
    await admin.save();
    console.log('✅ Admin user created');

    // Create Test Users
    const testUser1 = new User({
      name: "John Traveler",
      username: "johntraveler",
      email: "john@example.com",
      password: "Password123!",
      role: "user",
      verified: true,
      profileImage: {
        url: "https://res.cloudinary.com/demo/image/upload/v1/user1.jpg",
        public_id: "user1_avatar"
      }
    });
    await testUser1.save();

    const testUser2 = new User({
      name: "Sarah Explorer",
      username: "sarahexplorer",
      email: "sarah@example.com",
      password: "Password123!",
      role: "user",
      verified: true,
      profileImage: {
        url: "https://res.cloudinary.com/demo/image/upload/v1/user2.jpg",
        public_id: "user2_avatar"
      }
    });
    await testUser2.save();

    const testUser3 = new User({
      name: "Mike Adventurer",
      username: "mikeadventurer",
      email: "mike@example.com",
      password: "Password123!",
      role: "user",
      verified: true,
      profileImage: {
        url: "https://res.cloudinary.com/demo/image/upload/v1/user3.jpg",
        public_id: "user3_avatar"
      }
    });
    await testUser3.save();

    console.log('✅ Test users created');

    // Sample camp data with all schema fields
    const campsData = [
      {
        title: "Mountain Peak Paradise",
        description: "Experience breathtaking views from this mountain peak camping site. Perfect for sunrise watching and stargazing. The camp offers stunning panoramic views of the surrounding valleys and peaks.",
        cost: 1500,
        location: "Manali, Himachal Pradesh",
        tags: ["mountain", "hiking", "stargazing", "sunrise-view", "adventure", "tent", "eco-friendly"],
        geometry: {
          type: "Point",
          coordinates: [77.1892, 32.2432] // Manali coordinates
        },
        images: [
          { url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4", filename: "mountain1.jpg" },
          { url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d", filename: "mountain2.jpg" }
        ],
        user: testUser1._id
      },
      {
        title: "Lakeside Serenity Camp",
        description: "A peaceful lakeside camping experience with crystal clear waters. Enjoy kayaking, fishing, and peaceful evenings by the bonfire. Perfect for families and couples seeking tranquility.",
        cost: 2000,
        location: "Nainital, Uttarakhand",
        tags: ["lake", "fishing", "kayaking", "bonfire", "family", "romantic", "lake-view", "pet-friendly"],
        geometry: {
          type: "Point",
          coordinates: [79.4542, 29.3803] // Nainital coordinates
        },
        images: [
          { url: "https://images.unsplash.com/photo-1510312305653-8ed496efae75", filename: "lake1.jpg" },
          { url: "https://images.unsplash.com/photo-1476041800959-2f6bb412c8ce", filename: "lake2.jpg" }
        ],
        user: testUser2._id
      },
      {
        title: "Beach Sunset Retreat",
        description: "Wake up to the sound of waves and enjoy spectacular sunsets. This beachside camp offers water sports, beach volleyball, and fresh seafood. A tropical paradise for beach lovers.",
        cost: 2500,
        location: "Goa Beach",
        tags: ["beach", "sunset-view", "swimming-pool", "snorkeling", "luxury", "couple", "beach-access", "restaurant"],
        geometry: {
          type: "Point",
          coordinates: [73.7679, 15.2993] // Goa coordinates
        },
        images: [
          { url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19", filename: "beach1.jpg" },
          { url: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a", filename: "beach2.jpg" }
        ],
        user: testUser1._id
      },
      {
        title: "Forest Wilderness Camp",
        description: "Immerse yourself in nature at this dense forest camping site. Perfect for bird watching, nature walks, and wildlife photography. Experience the raw beauty of untouched wilderness.",
        cost: 1200,
        location: "Jim Corbett, Uttarakhand",
        tags: ["forest", "jungle", "bird-watching", "hiking", "wild-camping", "eco-friendly", "adventure", "safe"],
        geometry: {
          type: "Point",
          coordinates: [78.7640, 29.5308] // Jim Corbett coordinates
        },
        images: [
          { url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d", filename: "forest1.jpg" },
          { url: "https://images.unsplash.com/photo-1445308394109-4ec2920981b1", filename: "forest2.jpg" }
        ],
        user: testUser3._id
      },
      {
        title: "Desert Dunes Adventure",
        description: "Experience the magic of the desert with camel rides, cultural performances, and starlit nights. This unique desert camp offers an authentic Rajasthani experience with modern amenities.",
        cost: 3000,
        location: "Jaisalmer, Rajasthan",
        tags: ["desert", "glamping", "luxury", "stargazing", "sunset-view", "restaurant", "romantic", "adventure"],
        geometry: {
          type: "Point",
          coordinates: [70.9083, 26.9157] // Jaisalmer coordinates
        },
        images: [
          { url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35", filename: "desert1.jpg" },
          { url: "https://images.unsplash.com/photo-1547036967-23d11aacaee0", filename: "desert2.jpg" }
        ],
        user: testUser2._id
      },
      {
        title: "Riverside Camping Haven",
        description: "Camp by the flowing river with opportunities for rafting, fishing, and riverside picnics. The soothing sound of water creates a perfect ambiance for relaxation and adventure.",
        cost: 1800,
        location: "Rishikesh, Uttarakhand",
        tags: ["river", "rafting", "fishing", "adventure", "chill", "budget", "group", "electricity", "wifi"],
        geometry: {
          type: "Point",
          coordinates: [78.2676, 30.0869] // Rishikesh coordinates
        },
        images: [
          { url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4", filename: "river1.jpg" },
          { url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d", filename: "river2.jpg" }
        ],
        user: testUser1._id
      },
      {
        title: "Snow Valley Winter Camp",
        description: "A winter wonderland camping experience with skiing, snowboarding, and cozy cabin stays. Perfect for winter sports enthusiasts and snow lovers.",
        cost: 3500,
        location: "Gulmarg, Kashmir",
        tags: ["snow", "skiing", "winter", "cabin", "luxury", "mountain-view", "adventure", "romantic"],
        geometry: {
          type: "Point",
          coordinates: [74.3800, 34.0484] // Gulmarg coordinates
        },
        images: [
          { url: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22", filename: "snow1.jpg" },
          { url: "https://images.unsplash.com/photo-1491002052546-bf38f186af56", filename: "snow2.jpg" }
        ],
        user: testUser3._id
      },
      {
        title: "Treehouse Eco Lodge",
        description: "Stay in unique treehouses surrounded by lush greenery. An eco-friendly camping experience with modern amenities and stunning forest views. Perfect for nature lovers.",
        cost: 2800,
        location: "Wayanad, Kerala",
        tags: ["treehouse", "eco-stay", "forest", "eco-friendly", "bird-watching", "romantic", "private", "breakfast"],
        geometry: {
          type: "Point",
          coordinates: [76.0856, 11.6854] // Wayanad coordinates
        },
        images: [
          { url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e", filename: "treehouse1.jpg" },
          { url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b", filename: "treehouse2.jpg" }
        ],
        user: testUser2._id
      },
      {
        title: "Valley View Camping",
        description: "Nestled in a picturesque valley with 360-degree mountain views. Ideal for trekking, hiking, and peaceful meditation. A hidden gem for adventure seekers.",
        cost: 1600,
        location: "Spiti Valley, Himachal Pradesh",
        tags: ["valley", "mountain", "trekking", "hiking", "remote", "adventure", "tent", "crowd-free"],
        geometry: {
          type: "Point",
          coordinates: [78.0339, 32.2468] // Spiti Valley coordinates
        },
        images: [
          { url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d", filename: "valley1.jpg" },
          { url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4", filename: "valley2.jpg" }
        ],
        user: testUser1._id
      },
      {
        title: "Island Paradise Camp",
        description: "An exclusive island camping experience with pristine beaches, coral reefs, and tropical vibes. Perfect for snorkeling, diving, and beach activities.",
        cost: 4000,
        location: "Andaman Islands",
        tags: ["island", "beach", "snorkeling", "luxury", "beach-access", "swimming-pool", "romantic", "remote"],
        geometry: {
          type: "Point",
          coordinates: [92.6586, 11.7401] // Andaman coordinates
        },
        images: [
          { url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19", filename: "island1.jpg" },
          { url: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a", filename: "island2.jpg" }
        ],
        user: testUser3._id
      }
    ];

    // Create camps
    const createdCamps = [];
    for (const campData of campsData) {
      const camp = new Camp(campData);
      await camp.save();
      createdCamps.push(camp);
      
      // Add camp to user's createdCamps array
      await User.findByIdAndUpdate(campData.user, {
        $push: { createdCamps: camp._id }
      });
    }
    console.log('✅ Camps created');

    // Create reviews for camps
    const reviewsData = [
      { camp: createdCamps[0]._id, user: testUser2._id, rating: 5, review: "Absolutely stunning views! Best camping experience ever." },
      { camp: createdCamps[0]._id, user: testUser3._id, rating: 4, review: "Great location but a bit cold at night. Bring warm clothes!" },
      { camp: createdCamps[1]._id, user: testUser1._id, rating: 5, review: "Perfect for a family getaway. Kids loved the lake activities." },
      { camp: createdCamps[1]._id, user: testUser3._id, rating: 5, review: "So peaceful and serene. Will definitely come back!" },
      { camp: createdCamps[2]._id, user: testUser2._id, rating: 5, review: "Beach paradise! Sunsets are magical here." },
      { camp: createdCamps[2]._id, user: testUser3._id, rating: 4, review: "Loved it but a bit pricey. Worth it for the experience though." },
      { camp: createdCamps[3]._id, user: testUser1._id, rating: 5, review: "Nature at its best! Saw so many birds and wildlife." },
      { camp: createdCamps[4]._id, user: testUser1._id, rating: 5, review: "Desert nights are incredible. Cultural show was amazing!" },
      { camp: createdCamps[5]._id, user: testUser2._id, rating: 4, review: "Rafting was thrilling! Great adventure camp." },
      { camp: createdCamps[6]._id, user: testUser1._id, rating: 5, review: "Winter wonderland! Skiing was fantastic." },
      { camp: createdCamps[7]._id, user: testUser1._id, rating: 5, review: "Unique treehouse experience. Very eco-friendly!" },
      { camp: createdCamps[8]._id, user: testUser2._id, rating: 4, review: "Remote but worth the journey. Amazing views!" },
      { camp: createdCamps[9]._id, user: testUser2._id, rating: 5, review: "Island paradise! Snorkeling was incredible." },
    ];

    for (const reviewData of reviewsData) {
      const review = new Review(reviewData);
      await review.save();
      
      // Add review to camp's review array
      await Camp.findByIdAndUpdate(reviewData.camp, {
        $push: { review: review._id }
      });
    }
    console.log('✅ Reviews created');

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n👥 USERS CREATED:');
    console.log('1. Admin User');
    console.log('   📧 Email:', admin.email);
    console.log('   👤 Username: admin');
    console.log('   🔑 Password: Admin@123');
    console.log('   🛡️  Role: admin (can edit/delete ALL camps)');
    console.log('\n2. Test User 1');
    console.log('   📧 Email: john@example.com');
    console.log('   👤 Username: johntraveler');
    console.log('   🔑 Password: Password123!');
    console.log('\n3. Test User 2');
    console.log('   📧 Email: sarah@example.com');
    console.log('   👤 Username: sarahexplorer');
    console.log('   🔑 Password: Password123!');
    console.log('\n4. Test User 3');
    console.log('   📧 Email: mike@example.com');
    console.log('   👤 Username: mikeadventurer');
    console.log('   🔑 Password: Password123!');
    console.log('\n🏕️  CAMPS CREATED:', createdCamps.length);
    console.log('⭐ REVIEWS CREATED:', reviewsData.length);
    console.log('\n✅ All camps have:');
    console.log('   - Complete descriptions');
    console.log('   - Tags for filtering');
    console.log('   - Geo coordinates for maps');
    console.log('   - Multiple images');
    console.log('   - Associated users');
    console.log('   - Reviews with ratings');
    console.log('\n🛡️  ADMIN ACCESS:');
    console.log('   - Admin can view all camps');
    console.log('   - Admin can edit ANY camp');
    console.log('   - Admin can delete ANY camp');
    console.log('   - Regular users can only edit/delete their own camps');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ MongoDB Disconnected');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
