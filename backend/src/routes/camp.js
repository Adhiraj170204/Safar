import { Router } from "express";
const router = Router();

import Camp from "../models/camp.js";
import Review from "../models/review.js";
import User from "../models/user.js";

import { protect } from "../utility/auth.js";

import {
  wrapAsync,
  createCampSchema,
  updateCampSchema,
  validate,
  validateImages,
} from "../utility/middleware.js";

import { upload } from "../config/multer.js";   // FIXED
import cloudinary from "../config/cloudinary.js";  // FIXED
import { cloudinaryUpload } from "../utility/cloudinaryUpload.js";
import { geocodeLocation } from "../utility/geocode.js";


// -------------------------------------------
// GET ALL CAMPS WITH PAGINATION, SEARCH & FILTER
// -------------------------------------------
router.get("/index", wrapAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const tags = req.query.tags ? req.query.tags.split(",") : [];
  const minCost = req.query.minCost ? parseFloat(req.query.minCost) : 0;
  const maxCost = req.query.maxCost ? parseFloat(req.query.maxCost) : Infinity;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

  // Build query
  const query = {};

  // Search by title or location
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  // Filter by tags
  if (tags.length > 0) {
    query.tags = { $in: tags };
  }

  // Filter by cost range
  if (minCost > 0 || maxCost < Infinity) {
    query.cost = { $gte: minCost, $lte: maxCost };
  }

  const camps = await Camp.find(query)
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "name username")
    .populate({
      path: "review",
      populate: { path: "user", select: "name username" }
    });

  const count = await Camp.countDocuments(query);

  res.json({
    total: count,
    page,
    pages: Math.ceil(count / limit),
    camps
  });
}));


// -------------------------------------------
// EDIT FETCH ROUTE – MUST COME BEFORE /:id
// -------------------------------------------
router.get("/:id/edit", wrapAsync(async (req, res) => {
  const camp = await Camp.findById(req.params.id);

  if (!camp) return res.status(404).json({ error: "Camp not found" });

  res.json(camp);
}));


// -------------------------------------------
// GET SINGLE CAMP
// -------------------------------------------
router.get("/:id", wrapAsync(async (req, res) => {
  const camp = await Camp.findById(req.params.id)
    .populate({
      path: "review",
      populate: "user",
    })
    .populate("user");

  if (!camp) return res.status(404).json({ error: "Camp not found" });

  res.json(camp);
}));


// -------------------------------------------
// CREATE NEW CAMP
// -------------------------------------------
router.post(
  "/new",
  protect,
  upload.array("images", 5),
  validateImages({
    required: true,
    maxCount: 5,
    maxSizeMB: 3,
  }),
  validate(createCampSchema),
  wrapAsync(async (req, res) => {
    const uploadedImages = [];

    for (const file of req.files) {
      const result = await cloudinaryUpload(file.buffer, "camps");
      uploadedImages.push({
        url: result.secure_url,
        filename: result.public_id,
      });
    }

    // Parse tags from comma-separated string (FormData) into array
    if (req.body.tags && typeof req.body.tags === "string") {
      req.body.tags = req.body.tags.split(",").map(t => t.trim()).filter(Boolean);
    }

    const campData = { ...req.body, images: uploadedImages, user: req.user._id };
    if (req.body.longitude && req.body.latitude) {
      const lng = parseFloat(req.body.longitude);
      const lat = parseFloat(req.body.latitude);
      if (!isNaN(lng) && !isNaN(lat)) {
        campData.geometry = { type: "Point", coordinates: [lng, lat] };
      }
    } else if (campData.location) {
      const geometry = await geocodeLocation(campData.location);
      if (geometry) campData.geometry = geometry;
    }
    const camp = new Camp(campData);
    await camp.save();

    // Add camp to user's createdCamps array
    await User.findByIdAndUpdate(req.user._id, { $push: { createdCamps: camp._id } });

    res.status(201).json(camp);
  })
);


// -------------------------------------------
// DELETE CAMP
// -------------------------------------------
router.delete("/:id", protect, wrapAsync(async (req, res) => {
  const camp = await Camp.findById(req.params.id);
  if (!camp) return res.status(404).json({ error: "Camp not found" });

  // Check ownership or admin
  if (req.user.role !== "admin" && camp.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: "Not authorized to delete this camp" });
  }

  // Delete images
  if (camp.images.length > 0) {
    const ids = camp.images.map((img) => img.filename);
    await cloudinary.api.delete_resources(ids); // batch delete
  }

  // Delete reviews
  if (camp.review.length > 0) {
    await Review.deleteMany({ _id: { $in: camp.review } });
  }

  // Remove camp from user's createdCamps array
  await User.findByIdAndUpdate(camp.user, { $pull: { createdCamps: camp._id } });

  await Camp.findByIdAndDelete(req.params.id);

  res.json({ message: "Camp deleted successfully" });
}));


// -------------------------------------------
// UPDATE CAMP (Edit)
// -------------------------------------------
router.put(
  "/:id",
  protect,
  upload.array("images", 5),
  validateImages({
    required: false,
    maxCount: 5,
    maxSizeMB: 3,
  }),
  validate(updateCampSchema),
  wrapAsync(async (req, res) => {
    let { imagesToDelete = [] } = req.body;

    // Convert comma-separated string to array
    if (typeof imagesToDelete === "string") {
      imagesToDelete = imagesToDelete.split(",");
    }

    const camp = await Camp.findById(req.params.id);
    if (!camp) return res.status(404).json({ error: "Camp not found" });

    // Check ownership or admin
    if (req.user.role !== "admin" && camp.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to edit this camp" });
    }

    // Delete old images
    if (imagesToDelete.length > 0) {
      await cloudinary.api.delete_resources(imagesToDelete);
      camp.images = camp.images.filter((img) => !imagesToDelete.includes(img.filename));
    }

    // Upload new images
    if (req.files?.length > 0) {
      for (const file of req.files) {
        const result = await cloudinaryUpload(file.buffer, "camps");
        camp.images.push({
          url: result.secure_url,
          filename: result.public_id,
        });
      }
    }

    // Parse tags if it's a comma-separated string
    if (req.body.tags && typeof req.body.tags === "string") {
      req.body.tags = req.body.tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    // Construct geometry from longitude/latitude if provided, else geocode from location
    if (req.body.longitude && req.body.latitude) {
      const lng = parseFloat(req.body.longitude);
      const lat = parseFloat(req.body.latitude);
      if (!isNaN(lng) && !isNaN(lat)) {
        req.body.geometry = { type: "Point", coordinates: [lng, lat] };
      }
      delete req.body.longitude;
      delete req.body.latitude;
    } else if (req.body.location) {
      const geometry = await geocodeLocation(req.body.location);
      if (geometry) req.body.geometry = geometry;
    }

    // Update fields
    camp.set(req.body);

    await camp.save();
    res.json(camp);
  })
);

export default router;
