const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    author: {
        type: String,
    },
    author_image: {
        type: String
    },
    receiver: {
        type: String,
    },
    receiver_image: {
        type: String
    },
    body: {
        type: String
    },
    count: {
        type: Number
    },
    love_count: {
        type: Number
    },
    love_people: {
        type: Array
    },
    com_count: {
        type: Number
    },
    retweet_edit_body: {
        type: String
    },
    retweet_edit_count: {
        type: Number
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Feeds', userSchema, 'feeds');