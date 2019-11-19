const router = require('express').Router();
const verify = require('./verifyToken');
const User = require('../model/User');
const mongoose = require('mongoose');

router.get('/', (req, res) => {
    console.log('Login page');
    res.render('../views/login.ejs')
});

module.exports = router;