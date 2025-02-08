let express = require('express')
let router = express.Router({ mergeParams: true })
let {wrapAsync, isLoggedIn, isReviewAuthor } = require('../utility/middleware')
let Safar = require('../model/safar')
let Review = require('../model/review')
const { reviewSchema } = require('../schema.js')

router.post('/', isLoggedIn, wrapAsync(async (req, res, next) => {
    let { id } = req.params
    let { error } = reviewSchema.validate(req.body)
    if (error) {
        let msg = error.details.map(el => el.message).join(',')
        req.flash('error', msg)
        return res.redirect(`/city/${id}`)
    }

    let r = new Review(req.body)
    r.author = req.user._id
    let city = await Safar.findById(id)
    city.Review.push(r)
    r.city = city._id
    await r.save()
    await city.save()
    req.flash('success', 'review added')
    res.redirect(`/city/${id}`)
}))

router.delete('/:rid', isLoggedIn, isReviewAuthor, wrapAsync(async (req, res, next) => {
    let { id, rid } = req.params
    await Safar.findByIdAndUpdate(id, { $pull: { Review: rid } })
    await Review.findByIdAndDelete(rid)
    req.flash('success', 'review deleted')
    res.redirect(`/city/${id}`)
}))

module.exports = router