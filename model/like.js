const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema ({
    username: {
        type: String,
    },
    receiver: {
        type: String,
    },
    post_id: {
        type: String,
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Likes', likeSchema,'likes');
