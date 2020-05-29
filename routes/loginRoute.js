const router = require('express').Router();

const verify = require('./verifyToken');
const User = require('../model/User');
const mongoose = require('mongoose');

router.get('/', (req, res) => {
    res.render('../views/login.ejs', {
        message: null,
        form: req.flash('form'),
        pageTitle: "Login",
        input: {}
    })
});

module.exports = router;