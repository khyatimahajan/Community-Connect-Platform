const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user_id: {
        type: String,
    },
    username: {
        type: String,
        min: 4,
        //unique: true
    },
    password: {
        type: String,
        min: 6
    },
    name: {
        type: String,
        min: 4
    },
    bio: {
        type: String,
        max: 1024
    },
    location: {
        type: String,
        min: 2,
        max: 255,
    },
    EmailID: {
        type: String,
        min: 6,
        max: 255
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    profile_pic: {
        type: String
    },
    group_id: [
        {
            type: String
        }
    ],
    connection: {
        name: Array
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('user', userSchema);
