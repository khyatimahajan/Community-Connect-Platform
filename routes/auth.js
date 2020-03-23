const router = require('express').Router();
const User = require('../model/User');
const Feeds = require('../model/Feeds');
const Comments = require('../model/Comments');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
    firstLoginValidation,
    registerValidation,
    loginValidation
} = require('../validation');
const session = require('express-session');

var currentUserName = "admin"; // default [temporary]
var currentUserData;
var currentUserID;

router.use(session({
    secret: 'ssshhhhh',
    saveUninitialized: true,
    resave: true,
    cookie: {
        secure: true
    }
}));
router.use(bodyParser.urlencoded({
    extended: true
}));

// var cart = [{postBody: req.body.myTextarea}];
var sess;

router.post('/', async (req, res) => {

})

async function getAllPosts() {
    var allPosts = await Feeds.find({});
    allPosts.sort(function (a, b) {
        return b["timestamp"] - a["timestamp"]
    });

    console.log("Getting Comments");
    for (var curPost = 0; curPost < allPosts.length; curPost++) {
        var feedComments = await getAllComments(allPosts[curPost]["_id"]);
        allPosts[curPost].comments = feedComments;
    }

    return allPosts;
}

async function getAllComments(feedId) {
    var allComments = await Comments.find({
        feedId: feedId
    });
    allComments.sort(function (a, b) {
        return b["timestamp"] - a["timestamp"]
    });

    // console.log("allcoments", allComments)

    return allComments;
}

router.post('/idlogin', async (req, res) => {
    console.log("Request body: ", req.body);

    sess = req.session;
    sess.body = req.body;


    //console.logle.log('Session initialized');


    const {
        error
    } = firstLoginValidation(req.body);
    //console.logle.log('Session Checking');
    if (error) return res.status(400).send(error.details[0].message);




    const user = await User.findOne({
        username: req.body.idcode
    });

    currentUserID = user._id;

    const salt = user.salt;
    //console.logle.log(user,"klkl");

    // const pass1=await bcrypt.hash(req.body.pass, salt);
    //  if(!user) return res.status(400).send('ID code not found!');
    //  //console.logle.log(pass1);
    //  //console.logle.log(user.password);
    // if(user.password.toString() === pass1.toString())


    currentUserName = user.username;

    //console.logle.log(user.connection + ' ..........................................')

    currentUserData = {
        username: user.username,
        name: user.name,
        bio: user.bio,
        location: user.location,
        connection: user.connection,
        image_src: user.image_src
    };


    //console.logle.log("hghg", currentUserData);
    var map = new Map(); // only because unsued variables are part of humanity!

    ////console.logle.log(map);

    //console.logle.log(map.has('5e2b3564e2b3124f1bbd9f4e'));
    //CREATE A TOKEN
    // const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
    // res.header('auth_token', token).send(token);

    // Get All posts
    var posts = await getAllPosts();
    userPosts = [currentUserData].concat(posts);
    //console.logle.log("hjhjhj",userPosts);


    res.render('../views/feeds_page', {
        posts: userPosts,
        map: map,
        user1: user
    });



    // else{
    // return res.status(400).send('userid/password  not correct!');	

    // }


});

router.post('/feedPost', async (req, res) => {
    //console.logle.log("Button clicked from user", currentUserName);
    //console.logle.log(req.query,"uiuiui");


    let {
        feedId
    } = req.query;

    if (feedId) {


        if (req.body.comment) {

            currentFeed = await Feeds.findById(feedId);
            currentFeed.com_count++;
            await currentFeed.save();

            const user = await User.findOne({
                username: currentUserName
            });


            const newComment = new Comments({
                feedId: feedId,
                author: currentUserName,
                body: req.body.comment,
                count: 0,
                love_count: 0,
                love_people: [],
                author_img_src: user.image_src
            });
            try {
                console.log("Comment: ", feedId, " ", req.body.comment);
                // console.log(newComment);
                await newComment.save();
            } catch (err) {
                res.status(400).send(err);
            }
        }

        if (req.body.love_com) {
            console.log("This is America", req.body.love_com);

            currentFeed = await Comments.findById(req.body.love_com);

            if (!currentFeed.love_people.includes(currentUserID)) {
                currentFeed.love_count++;
                currentFeed.love_people.push(currentUserID),
                    await currentFeed.save();
            }
        }

        if (req.body.retweet_edit_body) {
            console.log("This is Sparta", req.body.retweet_edit_id)

            var receiverName = currentUserName;

            var find_image_src = await User.findById(currentUserID);
            var author_image_src = find_image_src.image_src;
            var receiver_image_src = author_image_src;

            if (req.body.receiver != "") {
                const user = await User.findOne({
                    username: req.body.receiver
                });
                if (!user) return res.status(400).send('Receiver not found!');
                receiverName = user.username;
                receiver_image_src = user.image_src;
            }

            currentFeed = await Feeds.findById(req.body.retweet_edit_id);
            currentFeed.retweet_edit_count++;
            await currentFeed.save();

            //console.logle.log("lplplp");
            const newFeed = new Feeds({
                author: currentUserName,
                author_image: author_image_src,
                receiver: receiverName,
                receiver_image: receiver_image_src,
                body: req.body.body,
                count: 0,
                com_count: 0,
                love_count:0,
                love_people: [],
                retweet_edit_body: "",
                retweet_edit_count: 0,
                retweet_edit_body: req.body.retweet_edit_body
            });

            try {
                await newFeed.save();
            } catch (err) {
                res.status(400).send(err);
            }



        }

        if (req.body.retweet_com) {
            console.log("This is America", req.body.retweet_com, currentUserID);

            var find_image_src = await User.findById(currentUserID);
            var author_image_src = find_image_src.image_src;
            var receiver_image_src = author_image_src;

            const user = await User.findOne({
                username: req.body.retweet_com
            });
            receiverName = user.username;
            receiver_image_src = user.image_src;


            currentFeed = await Comments.findById(req.body.post_id);
            currentFeed.count++;
            await currentFeed.save();

            const newFeed = new Feeds({
                author: currentUserName,
                author_image: author_image_src,
                receiver: receiverName,
                receiver_image: receiver_image_src,
                body: req.body.body,
                count: 0,
                love_count: 0,
                com_count: 0,
                love_people: [],
                retweet_edit_body: "",
                retweet_edit_count: 0,

            });

            await newFeed.save();

        }

        if (req.body.retweet) {
            console.log("retweet clicked");
            var receiverName = currentUserName;

            var find_image_src = await User.findById(currentUserID);
            var author_image_src = find_image_src.image_src;
            var receiver_image_src = author_image_src;



            if (req.body.receiver != "") {
                const user = await User.findOne({
                    username: req.body.receiver
                });
                if (!user) return res.status(400).send('Receiver not found!');
                receiverName = user.username;
                receiver_image_src = user.image_src;
            }

            currentFeed = await Feeds.findById(feedId);
            currentFeed.count++;
            await currentFeed.save();

            const newFeed = new Feeds({
                author: currentUserName,
                author_image: author_image_src,
                receiver: receiverName,
                receiver_image: receiver_image_src,
                body: req.body.body,
                count: 0,
                com_count: 0,
                love_people: [],
                retweet_edit_body: "",
                retweet_edit_count: 0
            });

            await newFeed.save();
        }


        if (req.body.love) {
            currentFeed = await Feeds.findById(feedId);

            if (!currentFeed.love_people.includes(currentUserID)) {
                currentFeed.love_count++;
                currentFeed.love_people.push(currentUserID),
                    await currentFeed.save();
            }



            //console.logle.log("love clicked");
        }
    } else {
        //console.logle.log("newton");
        var receiverName = currentUserName;
        if (req.body.receiver != "") {
            const user = await User.findOne({
                username: req.body.receiver
            });
            console.log(user, "ijiji");
            if (!user) return res.status(400).send('Receiver not found!');
            receiverName = user.name;
        }

        var find_image_src = await User.findById(currentUserID);
        var author_image_src = find_image_src.image_src;

        //console.logle.log("lplplp");
        const newFeed = new Feeds({
            author: currentUserName,
            author_image: author_image_src,
            receiver: receiverName,
            body: req.body.body,
            count: 0,
            love_count: 0,
            com_count: 0,
            love_people: [],
            retweet_edit_body: "",
            retweet_edit_count: 0
        });

        try {
            await newFeed.save();
        } catch (err) {
            res.status(400).send(err);
        }
    }

    //console.logle.log('On feeds page');
    var posts = await getAllPosts();
    //console.logle.log(posts,"oiooioi")

    userPosts = [currentUserData].concat(posts);
    //console.logle.log("yyy",userPosts);
    res.render('../views/feeds_page', {
        posts: userPosts
    });
});

router.post('/profile', async (req, res) => {
    //VALIDATE BEFORE CREATE

    sess = req.session;
    console.log('Session signup');
    sess.body = req.body;
    console.log("Request body : ", req.body);


    //const {error} = registerValidation(sess.body);
    //if(error) return res.status(400).send(error.details[0].message);

    //Check if user already in DB
    console.log('Find User');
    const emailExists = await User.findOne({
        username: sess.body['username']
    });
    if (emailExists) return res.status(400).send('Email already exists! Please signup with different Email address');

    //HASH PASSWORD
    console.log('Hash Pass');
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(sess.body.password, salt);
    console.log("iiii", req.body);

    //CREATE A NEW USER
    const user = new User({
        name: req.body['name'],
        username: req.body['username'],
        email: req.body['email'],
        location: req.body['location'],
        password: hashPassword,
        bio: req.body['bio'],
        image_src: req.body.image_src
    });
    try {
        const savedUser = await user.save();
        console.log("yyyy", savedUser);

        res.render('../views/login_succ');
        //res.send({user: user._id});

    } catch (err) {

        res.status(400).send(err);
    }
});



router.post('/retweet', async (req, res) => {


    }

)

//LOGIN
router.post('/login', async (req, res) => {
    //VALIDATE BEFORE CREATE
    const {
        error
    } = loginValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message)

    //Check if email is correct
    const user = await User.findOne({
        email: req.body.email
    });
    if (!user) return res.status(400).send('Email not found!');

    //check if password is correct
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).send('Invalid password')

    //CREATE A TOKEN
    const token = jwt.sign({
        _id: user._id
    }, process.env.TOKEN_SECRET);
    res.header('auth_token', token).send(token);

    res.send('Logged in!');
});

router.get('/logout', function logout(req, res) {
    //console.logle.log('Logout clicked');
    res.redirect('/idlogin');
});
router.post('/profile', async (req, res) => {
    //VALIDATE BEFORE CREATE

    sess = req.session;
    //console.logle.log('Session signup');
    sess.body = req.body;
    //console.logle.log("Request body : ",req.body);


    //const {error} = registerValidation(sess.body);
    //if(error) return res.status(400).send(error.details[0].message);

    //Check if user already in DB
    //console.logle.log('Find User');
    const emailExists = await User.findOne({
        username: sess.body['username']
    });
    if (emailExists) return res.status(400).send('Email already exists!');

    //HASH PASSWORD
    //console.logle.log('Hash Pass');


    const salt = await bcrypt.genSalt(10);

    const hashPassword = await bcrypt.hash(sess.body.password, salt);

    //CREATE A NEW USER
    const user = new User({
        name: req.body['name'],
        username: req.body['username'],
        email: req.body['email'],
        salt: salt,
        password: hashPassword,
        bio: req.body['bio']
    });
    try {
        const savedUser = await user.save();
        res.send({
            user: user._id
        });

    } catch (err) {
        res.status(400).send(err);
    }
});



// router.post('/login');

module.exports = router;