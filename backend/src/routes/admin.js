import { Router } from "express";
const router = Router();

import User from "../models/user.js";
import Camp from "../models/camp.js";
import Review from "../models/review.js";
import { protect, isAdmin } from "../utility/auth.js";
import { wrapAsync } from "../utility/middleware.js";
import cloudinary from "../config/cloudinary.js";

// All admin routes require authentication and admin role
router.use(protect, isAdmin);

// -------------------------------------------
// GET ALL USERS
// -------------------------------------------
router.get("/users", wrapAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || "";

  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } }
        ]
      }
    : {};

  const users = await User.find(query)
    .select("-password -refreshTokens")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("createdCamps");

  const count = await User.countDocuments(query);

  res.json({
    total: count,
    page,
    pages: Math.ceil(count / limit),
    users
  });
}));

// -------------------------------------------
// GET SINGLE USER
// -------------------------------------------
router.get("/users/:id", wrapAsync(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password -refreshTokens")
    .populate("createdCamps");

  if (!user) return res.status(404).json({ error: "User not found" });

  res.json(user);
}));

// -------------------------------------------
// UPDATE USER ROLE
// -------------------------------------------
router.put("/users/:id/role", wrapAsync(async (req, res) => {
  const { role } = req.body;

  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.role = role;
  await user.save();

  res.json({ message: "User role updated", user: { id: user._id, role: user.role } });
}));

// -------------------------------------------
// DELETE USER
// -------------------------------------------
router.delete("/users/:id", wrapAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Prevent deleting yourself
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  // Delete all camps created by this user
  const camps = await Camp.find({ user: user._id });
  for (const camp of camps) {
    // Delete camp images
    if (camp.images.length > 0) {
      const ids = camp.images.map((img) => img.filename);
      await cloudinary.api.delete_resources(ids);
    }
    // Delete camp reviews
    await Review.deleteMany({ camp: camp._id });
  }
  await Camp.deleteMany({ user: user._id });

  // Delete all reviews by this user
  await Review.deleteMany({ user: user._id });

  await User.findByIdAndDelete(req.params.id);

  res.json({ message: "User and all associated data deleted successfully" });
}));

// -------------------------------------------
// GET ALL CAMPS (ADMIN VIEW)
// -------------------------------------------
router.get("/camps", wrapAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const camps = await Camp.find({})
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "name email username")
    .populate("review");

  const count = await Camp.countDocuments();

  res.json({
    total: count,
    page,
    pages: Math.ceil(count / limit),
    camps
  });
}));

// -------------------------------------------
// DELETE ANY CAMP (ADMIN)
// -------------------------------------------
router.delete("/camps/:id", wrapAsync(async (req, res) => {
  const camp = await Camp.findById(req.params.id);
  if (!camp) return res.status(404).json({ error: "Camp not found" });

  // Delete images
  if (camp.images.length > 0) {
    const ids = camp.images.map((img) => img.filename);
    await cloudinary.api.delete_resources(ids);
  }

  // Delete reviews
  if (camp.review.length > 0) {
    await Review.deleteMany({ _id: { $in: camp.review } });
  }

  await Camp.findByIdAndDelete(req.params.id);

  res.json({ message: "Camp deleted successfully by admin" });
}));

// -------------------------------------------
// GET ALL REVIEWS (ADMIN VIEW)
// -------------------------------------------
router.get("/reviews", wrapAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  const reviews = await Review.find({})
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "name email username")
    .populate("camp", "title");

  const count = await Review.countDocuments();

  res.json({
    total: count,
    page,
    pages: Math.ceil(count / limit),
    reviews
  });
}));

// -------------------------------------------
// DELETE ANY REVIEW (ADMIN)
// -------------------------------------------
router.delete("/reviews/:id", wrapAsync(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ error: "Review not found" });

  // Remove from camp's review array
  await Camp.findByIdAndUpdate(review.camp, { $pull: { review: review._id } });
  
  await Review.findByIdAndDelete(req.params.id);

  res.json({ message: "Review deleted successfully by admin" });
}));

// -------------------------------------------
// GET DASHBOARD STATS
// -------------------------------------------
router.get("/stats", wrapAsync(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalCamps = await Camp.countDocuments();
  const totalReviews = await Review.countDocuments();
  const verifiedUsers = await User.countDocuments({ verified: true });
  const adminUsers = await User.countDocuments({ role: "admin" });

  // Recent activity
  const recentUsers = await User.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .select("name email role createdAt");

  const recentCamps = await Camp.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("user", "name username");

  res.json({
    stats: {
      totalUsers,
      totalCamps,
      totalReviews,
      verifiedUsers,
      adminUsers
    },
    recentActivity: {
      users: recentUsers,
      camps: recentCamps
    }
  });
}));

export default router;
