const router = require('express').Router();
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../model/User');
const Feeds = require('../model/Feeds');
const Comments = require('../model/Comments');
const Notifications = require('../model/Notifications');
const Group = require('./../model/Group');

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

async function getAllPosts(userID) {

    var allPosts = []
    var feedNotifications = [];

    var user_conn = await getAllConnectionInformation()
    for (var i = 0; i < user_conn.length; i++) {
        var temp_post = await Feeds.find({
            author: user_conn[i].username,
            
        })
        allPosts.push.apply(allPosts, temp_post)
    }

    let feedN = await Feeds.find({ 'for': { $in: [userID] } });

    console.log("THat post");
    console.log(feedN)

    var temp_post = await Feeds.find({
        author: currentUserData.username
    })
    allPosts.push.apply(allPosts, temp_post)


   

    var noti = await Notifications.find({})
    for (var i = 0; i < noti.length; i++) {
        if (user_conn.includes(noti[i].inconn_id) && !user_conn.includes(noti[i].outconn_id) && currentUserID!=noti[i].outconn_id) {
            currentFeed = await Feeds.findById(noti.post_id)
            currentFeed.timestamp = noti.timestamp
            currentFeed.notification = noti.status
            console.log(currentFeed)
            allPosts.push.apply(allPosts, currentFeed)
        }
    }


    allPosts.sort(function (a, b) {
        return b["timestamp"] - a["timestamp"]
    });

    for (var curPost = 0; curPost < allPosts.length; curPost++) {
        var feedComments = await (allPosts[curPost]["_id"]);
        allPosts[curPost].comments = feedComments;
    }

    //allPosts = allPosts.concat(feedN);

    console.log("ALL POST");
    console.log(allPosts)

    return allPosts;
}

async function getAllConnectionInformation() {
    const user = await User.findOne({
        _id: currentUserID
    });

    user_dict = []
    connection_list = user.connection.name
    for (var i = 0; i < connection_list.length; i++) {
        var user_conn = await User.findOne({
            _id: connection_list[i]
        });
        user_dict.push(user_conn)

    }
    return user_dict
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
    sess = req.session;
    sess.body = req.body;

    const { error } = firstLoginValidation(req.body);
    
    if (error) {
        req.flash('message', error.details[0].message)
        req.flash('form', req.body)
        res.redirect('/');
    }

    const user = await User.findOne({
        username: req.body.idcode
    });

    if(user) {
        currentUserID = user._id;
        req.session.user = user;
        req.session.isLoggedIn = true;
        const salt = user.salt;
        currentUserName = user.username;

        currentUserData = {
            username: user.username,
            name: user.name,
            bio: user.bio,
            location: user.location,
            connection: user.connection,
            image_src: user.image_src
        };

        var map = new Map(); // only because unsued variables are part of humanity!
        var connection_list = await getAllConnectionInformation();

        var posts = await getAllPosts(user._id);
        userPosts = [currentUserData].concat(posts);

        res.render('../views/feeds_page', {
            posts: userPosts,
            connections: connection_list,
            map: map,
            user1: user,
            user: user,
            suggestions: JSON.stringify(connection_list),
        });
    } else {
        req.flash('message', "Invalid credentials")
        req.flash('form', req.body)
        res.redirect('/');
    }

    // var users_connected = ['Khyati_10']
    // for (var emp = 0; emp < users_connected.length; emp++) {
    //     var emp_full = users_connected[emp]
    //     // console.log(emp_full)
    //     const to_add_connection = await User.findOne({
    //         username: emp_full
    //     });
    //     var new_connection = ['5e95e282cffa7a7e93e88a5c']
    //     var already_connection = to_add_connection.connection.name
    //     var added_question = false
    //     for (var k = 0; k < new_connection.length; k++) {
    //         var i = new_connection[k]
    //         if (i != to_add_connection._id) {
    //             var exists = already_connection.includes(i)
    //             if (!exists) {
    //                 already_connection.push(i)
    //                 added_question = true
    //             }
    //         }
    //     }
    //     if (added_question) {
    //         User.findOneAndUpdate({
    //             _id: to_add_connection._id
    //         }, {
    //             $set: {
    //                 connection: {
    //                     name: already_connection
    //                 }
    //             }
    //         }, {
    //             new: true
    //         }, (err, doc) => {
    //             if (err) {
    //                 console.log("Something wrong when updating data!");
    //             }

    //             console.log(doc);
    //         });
    //     }
    // }


    //console.logle.log('Session initialized');

    //console.logle.log(user,"klkl");

    // const pass1=await bcrypt.hash(req.body.pass, salt);
    //  if(!user) return res.status(400).send('ID code not found!');
    //  //console.logle.log(pass1);
    //  //console.logle.log(user.password);
    // if(user.password.toString() === pass1.toString())

    //console.logle.log("hghg", currentUserData);
   
    ////console.logle.log(map);

    //console.logle.log(map.has('5e2b3564e2b3124f1bbd9f4e'));
    //CREATE A TOKEN
    // const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
    // res.header('auth_token', token).send(token);

    // Get All posts
  
    //console.logle.log("hjhjhj",userPosts);


    // else{
    // return res.status(400).send('userid/password  not correct!');	

    // }

});

router.post('/feedPost', async (req, res) => {


    let {
        feedId
    } = req.query;

    /*let currentFeed = await Feeds.findById(feedId);
    const user = await User.findOne({
        username: currentFeed.author
    });

    console.log(user);

    let userGroups = await Group.find({ 'members': req.user._id, 'members': { $nin: [user._id] } });

    userGroups = userGroups[0].members.filter(member =>{
        return JSON.stringify(member) != JSON.stringify(req.user._id);
    });

    console.log(userGroups);

    var itemsProcessed = 0;

    userGroups.forEach( async (member, index, array) =>{

        console.log(JSON.stringify(member) +"  $$$$  "+ JSON.stringify(user._id))
        if(JSON.stringify(member) == JSON.stringify(user._id)) { 
            itemsProcessed++;
            if(itemsProcessed === array.length) {
                callback();
            }
            return true; 
        }

        let newFeed = new Feeds({ ...currentFeed._doc, _id:mongoose.Types.ObjectId()});
        newFeed.for.push(member);
        await newFeed.save();

        itemsProcessed++;
        if(itemsProcessed === array.length) {
            callback();
        }
    });
    
 
    function callback() {
        console.log("ALLL DONE")
    }*/
    

    if (feedId) {


        if (req.body.comment) {

            currentFeed = await Feeds.findById(feedId);
            currentFeed.com_count++;
            await currentFeed.save();

            const user = await User.findOne({
                feedId: currentFeed.author
            });


            const newComment = new Comments({
                feedId: feedId,
                author: currentUserName,
                body: req.body.comment,
                count: 0,
                love_count: 0,
                love_people: [],
                author_img_src: user.image_src,
                retweet_edit_body: "",
                retweet_edit_count: 0
            });
            
            var status = currentUserName + " commented on "+user.username+"'s post."

            const notify = new Notifications({
                inconn_id: currentUserID,
                outconn_id: user._id,
                post_id: feedId,
                comment: true,
                like: false,
                status:status
            })
            await notify.save();

            try {
                console.log("Comment: ", feedId, " ", req.body.comment);
                
                await newComment.save();
            } catch (err) {
                res.status(400).send(err);
            }
        }

        if (req.body.retweet_edit_body_comm) {
            console.log("This is Sparta", req.body.retweet_edit_id_comm)
            comment_grp = await Comments.findById(req.body.retweet_edit_id_comm);
            comment_grp.retweet_edit_count++;
            var author_user = comment_grp.author;
            var author_image_src = comment_grp.author_img_src;
            await comment_grp.save();

            var receiverName = currentUserName;
            var find_image_src = await User.findById(currentUserID);
            var receiver_image_src = find_image_src.image_src;

           
            const newFeed = new Feeds({
                author: receiverName,
                author_image: receiver_image_src,
                receiver: author_user,
                receiver_image: author_image_src,
                body: req.body.body,
                count: 0,
                com_count: 0,
                love_count: 0,
                love_people: [],
                retweet_edit_count: 0,
                retweet_edit_body: req.body.retweet_edit_body_comm,
                notification:""
            });

            try {
                await newFeed.save();
            } catch (err) {
                res.status(400).send(err);
            }
        }

        if (req.body.retweet_edit_body) {
            console.log("This is India", req.body.retweet_edit_id)

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

            
            const newFeed = new Feeds({
                author: currentUserName,
                author_image: author_image_src,
                receiver: receiverName,
                receiver_image: receiver_image_src,
                body: req.body.body,
                count: 0,
                com_count: 0,
                love_count: 0,
                love_people: [],
                retweet_edit_body: "",
                retweet_edit_count: 0,
                retweet_edit_body: req.body.retweet_edit_body,
                notification:""
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
                notification:""
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
                retweet_edit_count: 0,
                notification:""
            });

            await newFeed.save();
        }


        if (req.body.love) {
            currentFeed = await Feeds.findById(feedId);
            const user = await User.findOne({
                username: currentFeed.author
            });

            if (!currentFeed.love_people.includes(currentUserID)) {
                currentFeed.love_count++;
                currentFeed.love_people.push(currentUserID),
                    await currentFeed.save();
            }

            var status = currentUserName + " liked "+user.username+"'s post."

            const notify = new Notifications({
                inconn_id: currentUserID,
                outconn_id: user._id,
                post_id: feedId,
                comment: false,
                like: true,
                status:status
            })
            await notify.save();
        }

        if (req.body.love_com) {
            console.log("This is America", req.body.love_com);

            currentFeed = await Comments.findById(req.body.love_com);

            if (!currentFeed.love_people.includes(currentUserID)) {
                currentFeed.love_count++;
                currentFeed.love_people.push(currentUserID),
                    await currentFeed.save();
            }

            const user = await User.findOne({
                username: currentFeed.author
            });

            var status = currentUserName + " liked "+user.username+"'s comment."

            const notify = new Notifications({
                inconn_id: currentUserID,
                outconn_id: user._id,
                post_id: feedId,
                comment: true,
                like: true,
                status:status
            })
            await notify.save();
        }

    } else {
        
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
            retweet_edit_count: 0,
            notification:""
        });

        try {
            await newFeed.save();
        } catch (err) {
            res.status(400).send(err);
        }
    }

    var posts = await getAllPosts();

    var connection_list = await getAllConnectionInformation()
   
    userPosts = [currentUserData].concat(posts);
    
    res.render('../views/feeds_page', {
        posts: userPosts,
        connections: connection_list,
        user: req.session.user,
        suggestions: JSON.stringify(connection_list),
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
    req.session.destroy();
    res.redirect('/');
    
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