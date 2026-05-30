
// WrapAsync
export function wrapAsync(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(e => next(e))
    }
}
//

// Zod middleware
import { ZodError } from "zod";

export const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next(); // validation passed
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    message: "Validation error",
                    errors: error.errors.map((err) => ({
                        path: err.path.join("."),
                        message: err.message,
                    })),
                });
            }

            next(error);
        }
    };
};

// Zod Schema

import { z } from "zod";

// Valid tags enum matching DB schema
const validTags = [
    // Nature / Terrain
    "mountain", "forest", "jungle", "desert", "river", "lake", "beach", "island",
    "snow", "waterfall", "valley", "cliff", "hill", "canyon",
    // Camping Types
    "tent", "rv", "campervan", "cabin", "glamping", "treehouse", "eco-stay",
    "wild-camping", "backpacking",
    // Activities
    "hiking", "trekking", "fishing", "kayaking", "rafting", "rock-climbing",
    "biking", "stargazing", "bird-watching", "cycling", "bonfire", "snorkeling", "skiing",
    // Amenities
    "wifi", "parking", "breakfast", "pet-friendly", "toilet", "shower", "electricity",
    "drinking-water", "bbq", "restaurant", "swimming-pool",
    // Trip Type
    "family", "solo", "couple", "luxury", "budget", "group", "adventure", "chill", "romantic",
    // Safety / Environment
    "safe", "eco-friendly", "private", "crowd-free",
    // Seasonal
    "summer", "winter", "monsoon",
    // Special Features
    "sunset-view", "sunrise-view", "lake-view", "mountain-view", "beach-access",
    "off-road", "remote"
];

export const createCampSchema = z.object({
    body: z.object({
        title: z.string().min(3),
        description: z.string().min(10),
        cost: z.coerce.number().min(0),
        location: z.string(),
        tags: z.union([
            z.array(z.enum(validTags)),
            z.string().transform(str => {
                const tags = str.split(',').map(s => s.trim());
                // Validate each tag
                tags.forEach(tag => {
                    if (!validTags.includes(tag)) {
                        throw new Error(`Invalid tag: ${tag}`);
                    }
                });
                return tags;
            })
        ]).optional(),
        geometry: z.object({
            type: z.literal("Point"),
            coordinates: z.array(z.number()).length(2)
        }).optional(),
    }),
});

export const updateCampSchema = z.object({
    body: z.object({
        title: z.string().min(3).optional(),
        description: z.string().min(10).optional(),
        cost: z.coerce.number().min(0).optional(),
        location: z.string().optional(),
        tags: z.union([
            z.array(z.enum(validTags)),
            z.string().transform(str => {
                const tags = str.split(',').map(s => s.trim());
                // Validate each tag
                tags.forEach(tag => {
                    if (!validTags.includes(tag)) {
                        throw new Error(`Invalid tag: ${tag}`);
                    }
                });
                return tags;
            })
        ]).optional(),
        geometry: z.object({
            type: z.literal("Point"),
            coordinates: z.array(z.number()).length(2)
        }).optional(),
    }),
});


//ZOD Multer Image validation

export const validateImages = ({
    field = "images",
    required = true,
    maxCount = 5,
    allowedTypes = ["image/jpeg", "image/png", "image/webp"],
    maxSizeMB = 3
}) => {
    return (req, res, next) => {
        const files = Array.isArray(req.files) ? req.files : req.files?.[field];

        // Required check
        if (required && (!files || files.length === 0)) {
            return res.status(400).json({
                success: false,
                message: `At least one image is required.`,
            });
        }

        // If not required and no upload → allow
        if (!required && (!files || files.length === 0)) {
            return next();
        }

        // Max count
        if (files.length > maxCount) {
            return res.status(400).json({
                success: false,
                message: `You can upload a maximum of ${maxCount} images.`,
            });
        }

        // Validate each file
        for (let file of files) {
            // Type check
            if (!allowedTypes.includes(file.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid file type: ${file.originalname}. Allowed types: ${allowedTypes.join(", ")}`,
                });
            }

            // Size check
            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > maxSizeMB) {
                return res.status(400).json({
                    success: false,
                    message: `${file.originalname} exceeds the size limit of ${maxSizeMB}MB.`,
                });
            }
        }

        next();
    };
};

// Review Validation Schemas
export const createReviewSchema = z.object({
    body: z.object({
        rating: z.coerce.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
        review: z.string().optional(),
    }),
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid camp ID"),
    }),
});

export const updateReviewSchema = z.object({
    body: z.object({
        rating: z.coerce.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5").optional(),
        review: z.string().optional(),
    }),
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid camp ID"),
        rid: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid review ID"),
    }),
});

// Middleware to check if camp exists
import Camp from '../models/camp.js';
import Review from '../models/review.js';

export const checkCampExists = wrapAsync(async (req, res, next) => {
    const camp = await Camp.findById(req.params.id);
    if (!camp) {
        return res.status(404).json({ error: 'Camp not found' });
    }
    req.camp = camp;
    next();
});

// Middleware to check if review exists
export const checkReviewExists = wrapAsync(async (req, res, next) => {
    const review = await Review.findById(req.params.rid);
    if (!review) {
        return res.status(404).json({ error: 'Review not found' });
    }
    req.review = review;
    next();
});

// Middleware to check review ownership
export const checkReviewOwnership = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    if (req.user.role === 'admin') {
        return next();
    }
    if (req.review.user && req.review.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to modify this review' });
    }
    next();
};
