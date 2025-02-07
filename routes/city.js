let express = require('express')
let router = express.Router()
let Safar = require('../model/safar')
let Review = require('../model/review')
const Joi = require('joi');
let { isLoggedIn, isAuthor, wrapAsync, validate } = require('../utility/middleware')
const multer = require('multer')
let { storage, cloudinary } = require('../cloudinary')
const upload = multer({ storage })
const mbxStyles = require('@mapbox/mapbox-sdk/services/geocoding');
const geoCoder = mbxStyles({ accessToken: process.env.Mapbox_Token });
const {citiesSchema} = require('../schema.js')

let jschema = citiesSchema

router.get('/new', isLoggedIn, (req, res) => {
    res.render('new')
})

router.get('/:id', wrapAsync(async (req, res, next) => {
    let { id } = req.params
    let found = await Safar.findById(id).populate({
        path: 'Review',
        populate: 'author'
    }).populate('Author')
    if (!found) {
        req.flash('error', 'City not found')
        return res.redirect('/index')
    }
    res.render('details', { found })
}))

router.post('/new', isLoggedIn, upload.array('image'), validate, wrapAsync(async (req, res, next) => {
    let { error } = jschema.validate(req.body.city)
    if (error) {
        let msg = error.details.map(el => el.message).join(',')
        req.flash('error', `${msg}`)
        return res.redirect('/index')
    }
    let { Title, City, State, Cost, Description } = req.body
    let Location = `${City}, ${State}`
    let n = new Safar({
        Title,
        Location,
        Cost,
        Description,
    })
    let geoData = await geoCoder.forwardGeocode({
        query: Location,
        limit: 1
    }).send()
    n.geometry = geoData.body.features[0].geometry
    n.Author = req.user._id
    if (!!req.files) {
        n.Images = {
            url: `https://res.cloudinary.com/${process.env.Cloud_Name}/image/upload/v1738273884/samples/balloons.jpg`,
            filename: 'cld-sample-5'
        }
    }
    else {
        n.Images = req.files.map(f => ({ url: f.path, filename: f.filename }))
    }

    await n.save()
    req.flash('success', 'Successfully created')
    res.redirect(`/city/${n._id}`)
}))

router.delete('/:id', isLoggedIn, isAuthor, wrapAsync(async (req, res) => {
    let { id } = req.params
    let city = await Safar.findById(id)
    for (const i of city.Review) {
        await Review.findByIdAndDelete(i._id)
    }
    for (const img of city.Images) {
        await cloudinary.uploader.destroy(img.filename)
    }
    await Safar.findByIdAndDelete(id)
    req.flash('success', 'successfully deleted')
    res.redirect('/index')
}))

router.get('/:id/edit', isLoggedIn, isAuthor, wrapAsync(async (req, res, next) => {
    let { id } = req.params
    let found = await Safar.findById(id)
    res.render('edit', { found })
}))

router.put('/:id', isLoggedIn, isAuthor, upload.array('image'), wrapAsync(async (req, res, next) => {
    let { id } = req.params
    let { error } = jschema.validate(req.body.city)
    if (error) {
        let msg = error.details.map(el => el.message).join(',')
        req.flash('error', `${msg}`)
        return res.redirect(`/city/${id}/edit`)
    }
    let n = await Safar.findByIdAndUpdate(id, req.body, { runValidators: true })
    let img = req.files.map(f => ({ url: f.path, filename: f.filename }))
    n.Images.push(...img)
    if (req.body.deleteImages) {
        await n.updateOne({ $pull: { Images: { filename: { $in: req.body.deleteImages } } } })
        for (const filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename)
        }
    }
    await n.save()
    req.flash('success', 'Successfully updated')
    res.redirect(`/city/${id}`)
}))

module.exports = router