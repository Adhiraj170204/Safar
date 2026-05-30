import { Schema, model } from 'mongoose'

let imageSchema = new Schema({
    url: String,
    filename: String
})

imageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200')
})
imageSchema.virtual('cardImage').get(function () {
    return this.url.replace('/upload', '/upload/ar_16:9,c_crop')
})

let campSchema = new Schema({
    title: {
        type: String
    },
    cost: {
        type: Number,
        min: 0
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
    ,
    description: String,

    location: String,

    images: [imageSchema],

    review: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],

    tags: {
        type: [String],
        enum: [// Nature / Terrain
            "mountain",
            "forest",
            "jungle",
            "desert",
            "river",
            "lake",
            "beach",
            "island",
            "snow",
            "waterfall",
            "valley",
            "cliff",
            "hill",
            "canyon",

            // Camping Types
            "tent",
            "rv",
            "campervan",
            "cabin",
            "glamping",
            "treehouse",
            "eco-stay",
            "wild-camping",
            "backpacking",

            // Activities
            "hiking",
            "trekking",
            "fishing",
            "kayaking",
            "rafting",
            "rock-climbing",
            "biking",
            "stargazing",
            "bird-watching",
            "cycling",
            "bonfire",
            "snorkeling",
            "skiing",

            // Amenities
            "wifi",
            "parking",
            "breakfast",
            "pet-friendly",
            "toilet",
            "shower",
            "electricity",
            "drinking-water",
            "bbq",
            "restaurant",
            "swimming-pool",

            // Trip Type
            "family",
            "solo",
            "couple",
            "luxury",
            "budget",
            "group",
            "adventure",
            "chill",
            "romantic",

            // Safety / Environment
            "safe",
            "eco-friendly",
            "private",
            "crowd-free",

            // Seasonal
            "summer",
            "winter",
            "monsoon",

            // Special Features
            "sunset-view",
            "sunrise-view",
            "lake-view",
            "mountain-view",
            "beach-access",
            "off-road",
            "remote",],
    },

    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: false
        },
        coordinates: {
            type: [Number],
            required: false
        }
    }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } })

// Virtual for average rating
campSchema.virtual('averageRating').get(function () {
    if (!this.review || this.review.length === 0) return 0;
    // If reviews are populated
    if (this.review[0] && typeof this.review[0] === 'object' && this.review[0].rating) {
        const sum = this.review.reduce((acc, review) => acc + review.rating, 0);
        return (sum / this.review.length).toFixed(1);
    }
    return 0;
});

// Virtual for review count
campSchema.virtual('reviewCount').get(function () {
    return this.review ? this.review.length : 0;
});

// campSchema.virtual('properties.popup').get(function () {
//     return `<strong><a href=/city/${this._id}>${this.Title}</a></strong><p>${this.Location}</p>`
// })

let camp = model('Camp', campSchema)

export default camp