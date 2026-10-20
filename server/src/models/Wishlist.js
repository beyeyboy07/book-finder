import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
    googleBookId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    authors: {
        type: [String],
        default: []
    },
    thumbnail: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        default: null
    },
    infoLink: {
        type: String,
        default: ''
    },
}, {
    timestamps: true
});

export default mongoose.model('Wishlist', wishlistSchema);