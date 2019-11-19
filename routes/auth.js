const router = require('express').Router();
const User = require('../model/User');
const Feeds = require('../model/Feeds');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {firstLoginValidation, registerValidation, loginValidation} = require('../validation');
const session = require('express-session');

var currentUserName = "admin"; // default [temporary]

router.use(session(
    {secret: 'ssshhhhh',
    saveUninitialized: true,
    resave: true,
    cookie: {secure: true}
    }));
router.use(bodyParser.urlencoded({extended: true}));

// var cart = [{postBody: req.body.myTextarea}];
var sess;

async function getAllPosts() {
    var allPosts = await Feeds.find({});
    return allPosts;
}

router.post('/idlogin', async (req, res) => {
    // console.log("Request body: ", req.body);

    // sess = req.session;
    // sess.body = req.body;
    console.log('Session initialized');


    const { error } = firstLoginValidation(req.body);
    console.log('Session Checking');
    if(error) return res.status(400).send(error.details[0].message);

    
    const user = await User.findOne({idcode: req.body.idcode});
    if(!user) return res.status(400).send('ID code not found!');

    currentUserName = user.name;

    //CREATE A TOKEN
    // const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
    // res.header('auth_token', token).send(token);

    // Get All posts
    var posts = await getAllPosts();
    res.render('../views/feeds_page.ejs',{posts:posts});

    console.log(posts);
    
    //console.log('reached feeds page', posts);
});

//POST for feeds page --> Post something
router.post('/feedPost', async (req, res) => {
    console.log("Button clicked from user", currentUserName);

    var receiverName = currentUserName;
    if(req.body.receiver != "") {
        const user = await User.findOne({idcode: req.body.receiver});
        if(!user) return res.status(400).send('Receiver not found!');
        receiverName = user.name;
    }

    // New Feed
    const newFeed = new Feeds({
        author: currentUserName,
        receiver: receiverName,
        body: req.body.body
    });
    try {
        await newFeed.save();
        //res.send({feeds: newFeed._id});

    }catch(err){
        res.status(400).send(err);
    }

    console.log('Session feeds');
    console.log(req.body.body);

    console.log('On feeds page');
    var posts = await getAllPosts();
    res.render('../views/feeds_page.ejs',{posts:posts});
});



router.post('/profile', async (req, res) => {
    //VALIDATE BEFORE CREATE

     sess = req.session;
    console.log('Session signup');
     sess.body = req.body;
    console.log("Request body : ",req.body);


    //const {error} = registerValidation(sess.body);
    //if(error) return res.status(400).send(error.details[0].message);

    //Check if user already in DB
    console.log('Find User');
    const emailExists = await User.findOne({id: sess.body['user-id']});
    if(emailExists) return res.status(400).send('Email already exists!');

    //HASH PASSWORD
    console.log('Hash Pass');
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(sess.body.password, salt);

    //CREATE A NEW USER
    const user = new User({
        idcode: req.body['user-id'],
        name: req.body['user-name'],
        email: req.body['user-email'],
        password: hashPassword,
        bio: req.body['user-bio-public']
    });
    try {
        const savedUser = await user.save();
        res.send({user: user._id});

    }catch(err){
        res.status(400).send(err);
    }
});

//LOGIN
router.post('/login', async (req, res) => {
    //VALIDATE BEFORE CREATE
    const {error} = loginValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message)

    //Check if email is correct
    const user = await User.findOne({email: req.body.email});
    if(!user) return res.status(400).send('Email not found!');

    //check if password is correct
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if(!validPass) return res.status(400).send('Invalid password')

    //CREATE A TOKEN
    const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
    res.header('auth_token', token).send(token);

    res.send('Logged in!');
});

router.get('/logout', function logout(req, res) {
    console.log('Logout clicked');
    res.redirect('/idlogin');
});

// router.post('/login');

module.exports = router;
