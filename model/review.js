const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: {
        type: String,
        required: true
    },
    city: {
        type: Schema.Types.ObjectId,
        ref: 'Safar'
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;