const mongoose = require('mongoose')

const ReviewSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true
    },

    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    supermarket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supermarket',
        required: true
    },

    courier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    supermarketRating: {
        type: Number,
        min: 1,
        max: 5
    },

    supermarketComment: {
        type: String,
        trim: true
    },

    courierRating: {
        type: Number,
        min: 1,
        max: 5
    },

    courierComment: {
        type: String,
        trim: true
    }

}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);