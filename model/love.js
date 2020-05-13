const mongoose = require('mongoose');

const loveSchema = new mongoose.Schema ({
    username: {
        type: String,
    },
    receiver: {
        type: String,
    },
    post_id: {
        type: String,
    },
    count: {
        type: Number
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Love', loveSchema);
