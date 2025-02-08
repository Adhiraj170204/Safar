const { required } = require('joi')
const mongoose = require('mongoose')

let imageSchema = new mongoose.Schema({
    url: String,
    filename: String
})
imageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200')
})
imageSchema.virtual('cardImage').get(function () {
    return this.url.replace('/upload', '/upload/ar_16:9,c_crop')
})

let safarSchema = new mongoose.Schema({
    Title: {
        type: String
    },
    Cost: {
        type: Number,
        min: 0
    },
    Author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
    ,
    Description: String,

    Location: String,

    Images: [imageSchema],

    Review: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],

    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }
}, { toJSON: {virtuals: true} })

safarSchema.virtual('properties.popup').get(function () {
    return `<strong><a href=/city/${this._id}>${this.Title}</a></strong><p>${this.Location}</p>`
})

let Safar = mongoose.model('Safar', safarSchema)

module.exports = Safar