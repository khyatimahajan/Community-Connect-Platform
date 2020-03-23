const mongoose = require('mongoose');

const userSchema = new mongoose.Schema ({
    feedId: {
        type: String,
    },
    author: {
        type: String,
    },
    author_img_src:{
        type: String,
    },
    body: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    count: {
        type: Number
    },
    love_count: {
        type: Number
    },
    love_people: {
        type: Array
    }
});

module.exports = mongoose.model('Comments', userSchema,'comments');
