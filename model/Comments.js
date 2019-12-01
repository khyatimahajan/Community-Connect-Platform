const mongoose = require('mongoose');

const userSchema = new mongoose.Schema ({
    feedId: {
        type: String,
    },
    author: {
        type: String,
    },
    body: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Comments', userSchema,'comments');
