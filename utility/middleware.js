let Safar = require('../model/safar')
let Joi = require('joi')
let appError = require('./appError')
const Review = require('../model/review')
let {citiesSchema} = require('../schema')

module.exports.wrapAsync = (fn) => {
    return function (req, res, next) {
        fn(req, res, next).catch(e => next(e))
    }
}

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be logged in first')
        return res.redirect('/login')
    }
    next()
}

module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo
    }
    next()
}

module.exports.isAuthor = async (req, res, next) => {
    let { id } = req.params
    let city = await Safar.findById(id)
    if (!(city.Author.equals(req.user._id))) {
        req.flash('error', "You dont have permisson don't try to be smart")
        return res.redirect(`/city/${id}`)
    }
    next()
}

module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, rid } = req.params
    let r = await Review.findById(rid)
    if (!(r.author.equals(req.user._id))) {
        req.flash('error', "You dont have permisson don't try to be smart")
        return res.redirect(`/city/${id}`)
    }
    next()
}

module.exports.validate = (req, res, next) => {
    let { error } = citiesSchema.validate(req.body)
    if (error) {
        let msg = error.details.map(el => el.message).join(',')
        req.flash('error', `${msg}`)
        return res.redirect('/index')
    }
    else {
        next()
    }
}