const router = require('express').Router();
const verify = require('./verifyToken');
const User = require('../model/User');
const mongoose = require('mongoose');

router.get('/', (req, res) => {
    console.log('Profile page reached');
    res.render('../views/profile.ejs')
});

module.exports = router;