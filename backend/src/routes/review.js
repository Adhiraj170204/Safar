import { Router } from 'express'
const router = Router({ mergeParams: true })
import Review from '../models/review.js'
import Camp from '../models/camp.js'
import { protect } from '../utility/auth.js'
import {
    wrapAsync,
    validate,
    createReviewSchema,
    updateReviewSchema,
    checkCampExists,
    checkReviewExists,
    checkReviewOwnership
} from '../utility/middleware.js'

// Get all reviews for a camp
router.get('/', checkCampExists, wrapAsync(async (req, res) => {
    const camp = await Camp.findById(req.params.id).populate({
        path: 'review',
        populate: { path: 'user', select: 'name username profileImage' }
    })
    res.json(camp.review)
}))

// Create a new review
router.post(
    '/',
    protect,
    validate(createReviewSchema),
    checkCampExists,
    wrapAsync(async (req, res) => {
        const { rating, review } = req.body

        const newReview = new Review({
            rating,
            review,
            camp: req.camp._id,
            user: req.user._id
        })

        await newReview.save()

        req.camp.review.push(newReview._id)
        await req.camp.save()

        res.status(201).json(newReview)
    })
)

// Update a review
router.put(
    '/:rid',
    protect,
    validate(updateReviewSchema),
    checkReviewExists,
    checkReviewOwnership,
    wrapAsync(async (req, res) => {
        const { rating, review } = req.body

        const updatedReview = await Review.findByIdAndUpdate(
            req.params.rid,
            { rating, review },
            { new: true, runValidators: true }
        )

        res.json(updatedReview)
    })
)

// Delete a review
router.delete(
    '/:rid',
    protect,
    checkReviewExists,
    checkReviewOwnership,
    wrapAsync(async (req, res) => {
        await Camp.findByIdAndUpdate(req.params.id, { $pull: { review: req.params.rid } })
        await Review.findByIdAndDelete(req.params.rid)

        res.json({ message: 'Review deleted successfully' })
    })
)

export default router
