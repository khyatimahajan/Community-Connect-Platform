const mongoose = require('mongoose');

const userSchema = new mongoose.Schema ({
    author: {
        type: String,
    },
    receiver: {
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

module.exports = mongoose.model('Feeds', userSchema,'feeds');
