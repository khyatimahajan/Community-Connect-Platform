const mongoose = require('mongoose');

const userSchema = new mongoose.Schema ({
    idcode: {
        type: String,
        required: true,
        min: 6
    },
    name: {
        type: String,
        // required: true,
        min: 6,
        max: 255
    },
    email: {
        type: String,
        // required: true,
        min: 6,
        max: 255
    },
    password: {
        type: String,
        // required: true,
        max: 1024,
        min: 6
    },
    bio: {
        type: String,
        max: 1024
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema,'user');
