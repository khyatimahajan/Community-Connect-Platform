const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        // required: true,
        min: 6
    },
    username: {
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
    // location: {
    //     type: String,
    //     max: 255

    // },
    location: {
        type: String,
        min: 2,
        max: 255,

    },
    date: {
        type: Date,
        default: Date.now
    },
    connection: {
        name: Array
    },
    image_src:{
        type: String
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('user', userSchema);