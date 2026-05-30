import { Schema as _Schema, model } from 'mongoose';

const Schema = _Schema;

const reviewSchema = new Schema({
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: {
        type: String,
    },
    camp: {
        type: Schema.Types.ObjectId,
        ref: 'Camp'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

const Review = model('Review', reviewSchema);

export default Review;