const mongoose = require('mongoose');
const router = require('express').Router();
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const moment = require('moment');

const User = require('../model/User');
const Feeds = require('../model/Feeds');
const Comments = require('../model/Comments');
const Notifications = require('../model/Notifications');
const Group = require('./../model/Group');
const authController = require('./../controllers/auth');

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

async function getAllPosts(userID) {

    var allPosts = []
    var feedNotifications = [];

    var user_conn = await getAllConnectionInformation()
    for (var i = 0; i < user_conn.length; i++) {
        var temp_post = await Feeds.find({
            author: user_conn[i].username,
        }).populate('author_id', 'name username email').populate('receiver_id')

        allPosts.push.apply(allPosts, temp_post)
    }

    let entireFeeds = await Feeds.find({ 'feedNotification.users': { $in: [userID] } })
        .populate('feedNotification.userId')
        .populate('author_id', 'name username email')

    var temp_post = await Feeds.find({
        author: currentUserData.username
    }).populate('receiver_id').populate('author_id', 'name username email')

    allPosts.push.apply(allPosts, temp_post)

    var noti = await Notifications.find({})
    for (var i = 0; i < noti.length; i++) {
        if (user_conn.includes(noti[i].inconn_id) && !user_conn.includes(noti[i].outconn_id) && currentUserID != noti[i].outconn_id) {
            currentFeed = await Feeds.findById(noti.post_id)
            currentFeed.timestamp = noti.timestamp
            currentFeed.notification = noti.status
            console.log(currentFeed)
            allPosts.push.apply(allPosts, currentFeed)
        }
    }

    /*allPosts.sort(function (a, b) {
        return b["timestamp"] - a["timestamp"]
    });*/

    for (var curPost = 0; curPost < allPosts.length; curPost++) {
        var feedComments = await (allPosts[curPost]["_id"]);
        allPosts[curPost].comments = feedComments;
    }

    /*if (entireFeeds.length > 0) {
        allPosts = allPosts.concat(entireFeeds);
        allPosts = allPosts.filter(post => {
            if (post.feedNotification.users.length > 0) {
                return post.feedNotification.users.find(p => JSON.stringify(p) == JSON.stringify(userID)) ? true : false
            } else {
                return true;
            }
        })

    } else {
        allPosts = allPosts.filter(post => {
            return post.feedNotification.users.find(p => JSON.stringify(p) != JSON.stringify(userID)) ? false : true;
        })
    }*/
    allPosts = allPosts.concat(entireFeeds);

    allPosts.sort(function (a, b) {
        return b["timestamp"] - a["timestamp"]
    });

    return allPosts;
}

async function getAllConnectionInformation() {
    const user = await User.findOne({
        _id: currentUserID
    });

    user_dict = []
    /*connection_list = user.connection.name
    for (var i = 0; i < connection_list.length; i++) {
        var user_conn = await User.findOne({
            _id: connection_list[i],
        });
        user_dict.push(user_conn)

    }*/
    return user_dict
}

async function getAllComments(feedId) {
    var allComments = await Comments.find({
        feedId: feedId
    });
    allComments.sort(function (a, b) {
        return b["timestamp"] - a["timestamp"]
    });

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

    if (user) {
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

        var itemsProcessed = 0;

        let nPosts = [];

        userPosts = userPosts.map((post, index, array) => {
            if (post._id) {
                Comments.find({
                    feedId: post._id
                }).populate('author_id').exec().then(comments => {
                    nPosts.push({ ...post._doc, comments })
                    itemsProcessed++;
                    if (itemsProcessed === array.length) {
                        callback();
                    }
                })
            } else {
                nPosts.push({ ...post, comments: [] })
                itemsProcessed++;
                if (itemsProcessed === array.length) {
                    callback();
                }
            }
        });

        function callback() {

            nPosts.sort(function (a, b) {
                return b["timestamp"] - a["timestamp"]
            });

            console.log("ALL POSTS FIRST POST");
            console.log(nPosts[1])

            res.render('../views/feeds_page', {
                posts: nPosts,
                connections: connection_list,
                map: map,
                user1: user,
                user: user,
                suggestions: JSON.stringify(connection_list),
                moment
            });
        }

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

router.post('/feedPost', async (req, res, next) => {

    let {
        feedId
    } = req.query;

    let currentFeed;
    var userPosts = [];
    var nPosts = [];

    if (feedId) {
        //COMMENT/REPLY ON POST
        if (req.body.comment) {

            currentFeed = await Feeds.findById(feedId);
            currentFeed.timestamp = +new Date();
            currentFeed.com_count++;
            await currentFeed.save();

            const user = await User.findOne({
                username: currentFeed.author
            });

            const newComment = new Comments({
                feedId: feedId,
                author: currentUserName,
                author_id: req.user,
                body: req.body.comment,
                count: 0,
                love_count: 0,
                love_people: [],
                author_img_src: req.user ? req.user.profile_pic : "",
                retweet_edit_body: "",
                retweet_edit_count: 0
            });

            var status = currentUserName + " commented on " + user.username + "'s post."

            const notify = new Notifications({
                inconn_id: currentUserID,
                outconn_id: user._id,
                post_id: feedId,
                comment: true,
                like: false,
                status: status
            })
            await notify.save();

            try {
                await newComment.save();
            } catch (err) {
                console.log(err);
                let error = new Error("Something went wrong");
                next(error);
            }
        }

        // RETWEET COMMENT WITH TEXT
        if (req.body.retweet_edit_body_comm) {
            console.log("This is Sparta", req.body.retweet_edit_id_comm)
            comment_grp = await Comments.findById(req.body.retweet_edit_id_comm);
            comment_grp.retweet_edit_count++;
            var author_user = comment_grp.author;
            var author_image_src = comment_grp.author_img_src;
            await comment_grp.save();

            var receiverName = currentUserName;
            var find_image_src = await User.findById(currentUserID);
            var receiver_image_src = find_image_src.profile_pic;

            let recieverUser;

            const user = await User.findOne({
                username: author_user
            });
            if (!user) return res.status(400).send('Receiver not found!');
            recieverUser = user;

            const newFeed = new Feeds({
                author: receiverName,
                author_image: receiver_image_src,
                author_id: req.user,
                receiver: author_user,
                receiver_id: recieverUser,
                receiver_image: author_image_src,
                body: req.body.body,
                count: 0,
                com_count: 0,
                love_count: 0,
                love_people: [],
                retweet_edit_count: 0,
                retweet_edit_body: req.body.retweet_edit_body_comm,
                notification: ""
            });

            try {
                await newFeed.save();
            } catch (err) {
                console.log(err);
                let error = new Error("Something went wrong");
                next(error);
            }
        }

        //RETWEET WITH TEXT
        if (req.body.retweet_edit_body) {
            console.log("This is India", req.body.retweet_edit_id)

            var receiverName = currentUserName;

            var find_image_src = await User.findById(currentUserID);
            var author_image_src = find_image_src.profile_pic;
            var receiver_image_src = author_image_src;

            let recieverUser;

            if (req.body.receiver != "") {
                const user = await User.findOne({
                    username: req.body.receiver
                });
                if (!user) return res.status(400).send('Receiver not found!');
                receiverName = user.username;
                receiver_image_src = user.profile_pic;
                recieverUser = user;
            }

            currentFeed = await Feeds.findById(req.body.retweet_edit_id);
            currentFeed.retweet_edit_count++;

            try {
                await currentFeed.save();
            } catch (err) {
                console.log(err);
                let error = new Error("Something went wrong");
                next(error);
            }


            const newFeed = new Feeds({
                author: currentUserName,
                author_image: author_image_src,
                receiver: receiverName,
                receiver_image: receiver_image_src,
                body: req.body.body,
                author_id: req.user,
                receiver_id: recieverUser,
                count: 0,
                com_count: 0,
                love_count: 0,
                love_people: [],
                retweet_edit_body: "",
                retweet_edit_count: 0,
                retweet_edit_body: req.body.retweet_edit_body,
                notification: ""
            });

            try {
                await newFeed.save();
            } catch (err) {
                console.log(err);
                let error = new Error("Something went wrong");
                next(error);
            }
        }

        //COMMENT RETWEET
        if (req.body.retweet_com) {
            console.log("This is America", req.body.retweet_com, currentUserID);

            var find_image_src = await User.findById(currentUserID);
            var author_image_src = find_image_src.profile_pic;
            var receiver_image_src = author_image_src;

            let recieverUser;

            const user = await User.findOne({
                username: req.body.retweet_com
            });
            receiverName = user.username;
            receiver_image_src = user.profile_pic;
            recieverUser = user;

            currentFeed = await Comments.findById(req.body.post_id);
            currentFeed.count++;
            await currentFeed.save();

            const newFeed = new Feeds({
                author: currentUserName,
                author_image: author_image_src,
                author_id: req.user,
                receiver: receiverName,
                receiver_image: receiver_image_src,
                receiver_id: recieverUser,
                body: req.body.body,
                count: 0,
                love_count: 0,
                com_count: 0,
                love_people: [],
                retweet_edit_body: "",
                retweet_edit_count: 0,
                notification: ""
            });

            try {
                await newFeed.save();
            } catch (err) {
                console.log(err);
                let error = new Error("Something went wrong");
                next(error);
            }
        }

        //RETWEET POST
        if (req.body.retweet) {

            console.log("retweet clicked");

            console.log(req.body)

            var receiverName = currentUserName;

            var find_image_src = await User.findById(currentUserID);
            var author_image_src = find_image_src.profile_pic;
            var receiver_image_src = author_image_src;

            let recieverUser;

            if (req.body.receiver != "") {
                const user = await User.findOne({
                    username: req.body.receiver
                });
                if (!user) return res.status(400).send('Receiver not found!');

                console.log("RECEIVER");
                console.log(user);

                receiverName = user.username;
                receiver_image_src = user.profile_pic;
                recieverUser = user;
            }

            currentFeed = await Feeds.findById(feedId);
            currentFeed.count++;
            await currentFeed.save();

            const newFeed = new Feeds({
                author: currentUserName,
                author_image: author_image_src,
                receiver: receiverName,
                receiver_id: recieverUser,
                receiver_image: receiver_image_src,
                body: req.body.body,
                count: 0,
                author_id: req.user,
                com_count: 0,
                love_people: [],
                retweet_edit_body: "",
                retweet_edit_count: 0,
                notification: ""
            });


            try {
                await newFeed.save();
            } catch (err) {
                console.log(err);
                let error = new Error("Something went wrong");
                next(error);
            }
        }


        //LIKE POST
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

            var status = currentUserName + " liked " + user.username + "'s post."

            const notify = new Notifications({
                inconn_id: currentUserID,
                outconn_id: user._id,
                post_id: feedId,
                comment: false,
                like: true,
                status: status
            })
            try {
                await notify.save();
            } catch (err) {
                console.log(err);
                let error = new Error("Something went wrong");
                next(error);
            }

        }

        //LIKE COMMENT ON POST
        if (req.body.love_com) {
            console.log("This is America", req.body.love_com);

            currentFeed = await Comments.findById(req.body.love_com);

            if (!currentFeed.love_people.includes(currentUserID)) {
                currentFeed.love_count++;
                currentFeed.love_people.push(currentUserID);
                await currentFeed.save();
            }

            const user = await User.findOne({
                username: currentFeed.author
            });

            var status = currentUserName + " liked " + user.username + "'s comment."

            const notify = new Notifications({
                inconn_id: currentUserID,
                outconn_id: user._id,
                post_id: feedId,
                comment: true,
                like: true,
                status: status
            })
            try {
                await notify.save();
            } catch (err) {
                console.log(err);
                let error = new Error("Something went wrong");
                next(error);
            }

        }

    } else {

        var receiverName = currentUserName;
        if (req.body.receiver != "") {
            const user = await User.findOne({
                username: req.body.receiver
            });
            if (!user) return res.status(400).send('Receiver not found!');
            receiverName = user.name;
        }

        var find_image_src = await User.findById(currentUserID);
        var author_image_src = find_image_src.profile_pic;

        const newFeed = new Feeds({
            author: currentUserName,
            author_image: author_image_src,
            receiver: receiverName,
            body: req.body.body,
            author_id: req.user,
            count: 0,
            love_count: 0,
            com_count: 0,
            love_people: [],
            retweet_edit_body: "",
            retweet_edit_count: 0,
            notification: ""
        });

        try {
            await newFeed.save();
        } catch (err) {
            console.log(err);
            let error = new Error("Something went wrong");
            next(error);
        }
    }

    var posts = await getAllPosts(req.user._id);
    var connection_list = await getAllConnectionInformation()
    userPosts = [currentUserData].concat(posts);

    let userGroups = [];
    let user;

    if (feedId && (req.body.comment || req.body.love)) {
        currentFeed = await Feeds.findById(feedId);
        user = await User.findOne({
            username: currentFeed.author
        });
        let u = await User.findById(currentUserID);
        userGroups = u.group_id;
    }

    if (userGroups.length > 0) {

        var feedNotificationProcessed = 0;
        let notificationUsers = [];

        userGroups.forEach(async (userGroup, index, array) => {
            let group = await Group.findOne({ group_id: userGroup });
            let group_users = await User.find({ "group_id": { $in: [group.group_id] }, user_id: { $ne: user.user_id } }).exec();

            group_users = group_users.filter(member => {
                return JSON.stringify(member._id) != JSON.stringify(req.user._id);
            });

            group_users.forEach(async (member) => {

                if (JSON.stringify(member) == JSON.stringify(user._id)) {
                    feedNotificationProcessed++;
                    if (feedNotificationProcessed === array.length) {
                        addComments();
                    }
                    return true;
                }


                notificationUsers.push(member);
            });

            feedNotificationProcessed++;
            if (feedNotificationProcessed === array.length) {

                let currentUser = await User.findById(currentUserID);

                let found = currentFeed.feedNotification.users.includes(currentUser._id.toString());

                if (!found) {

                    let activity = '';
                    if (req.body.comment) activity = 'comment'; else if (req.body.retweet) activity = 'retweet'; else activity = 'love';
                    currentFeed.feedNotification.users = notificationUsers;
                    currentFeed.feedNotification.userId = req.user._id;
                    currentFeed.feedNotification.userActivity = activity;
                    currentFeed.timestamp = req.body.comment ? Date.now() : currentFeed.timestamp;
                    await currentFeed.save();
                }

                addComments();
            }

        });



        /********************** */
        /*userGroups.forEach((userGroup, index, array) => {
            let group = userGroups[index].members.filter(member => {
                return JSON.stringify(member) != JSON.stringify(req.user._id);
            });
            group.forEach(async (member, index) => {
                if (JSON.stringify(member) == JSON.stringify(user._id)) {
                    feedNotificationProcessed++;
                    if (feedNotificationProcessed === array.length) {
                        addComments();
                    }
                    return true;
                }

                let activity = '';
                if (req.body.comment) activity = 'comment'; else if (req.body.retweet) activity = 'retweet'; else activity = 'love';

                currentFeed.feedNotification.users.push(member);
                currentFeed.feedNotification.userId = req.user._id;
                currentFeed.feedNotification.userActivity = activity;
                currentFeed.timestamp = req.body.comment ? Date.now() : currentFeed.timestamp;
                await currentFeed.save();
            });

            feedNotificationProcessed++;
            if (feedNotificationProcessed === array.length) {
                addComments();
            }
        });*/

    } else {
        addComments()
    }

    function addComments() {

        var commentItemProcessed = 0;

        userPosts = userPosts.map((post, index, array) => {
            if (post._id) {
                Comments.find({
                    feedId: post._id
                }).populate('author_id').exec().then(comments => {
                    nPosts.push({ ...post._doc, comments })
                    commentItemProcessed++;
                    console.log(commentItemProcessed + "   " + array.length)
                    if (commentItemProcessed === array.length) {
                        callback();
                    }
                })
            } else {
                nPosts.push({ ...post, comments: [] })
                commentItemProcessed++;
                if (commentItemProcessed === array.length) {
                    callback();
                }
            }
        });
    }

    function removeDuplicates(arr) {
        const uniqueArray = arr.filter((thing, index) => {
            const _thing = JSON.stringify(thing);
            return index === arr.findIndex(obj => {
                return JSON.stringify(obj) === _thing;
            });
        });
        return uniqueArray;
    }

    function callback() {
        nPosts.sort(function (a, b) {
            return b["timestamp"] - a["timestamp"]
        });
        res.redirect('users/feeds');
    }




    /*if (feedId && (req.body.comment || req.body.love)) {
        currentFeed = await Feeds.findById(feedId);
        user = await User.findOne({
            username: currentFeed.author
        });
        userGroups = await Group.find({ 'members': req.user._id, 'members': { $nin: [user._id] } });
    }

    if (userGroups.length > 0) {

        var feedNotificationProcessed = 0;

        userGroups.forEach((userGroup, index, array) => {
            let group = userGroups[index].members.filter(member => {
                return JSON.stringify(member) != JSON.stringify(req.user._id);
            });
            group.forEach(async (member, index) => {
                if (JSON.stringify(member) == JSON.stringify(user._id)) {
                    feedNotificationProcessed++;
                    if (feedNotificationProcessed === array.length) {
                        addComments();
                    }
                    return true;
                }

                let activity = '';
                if (req.body.comment) activity = 'comment'; else if (req.body.retweet) activity = 'retweet'; else activity = 'love';

                currentFeed.feedNotification.users.push(member);
                currentFeed.feedNotification.userId = req.user._id;
                currentFeed.feedNotification.userActivity = activity;
                currentFeed.timestamp = req.body.comment ? Date.now() : currentFeed.timestamp;
                await currentFeed.save();
            });

            feedNotificationProcessed++;
            if (feedNotificationProcessed === array.length) {
                addComments();
            }
        });

    } else {
        addComments()
    }

    function addComments() {
        var commentItemProcessed = 0;

        userPosts = userPosts.map((post, index, array) => {
            if (post._id) {
                Comments.find({
                    feedId: post._id
                }).populate('author_id').exec().then(comments => {
                    nPosts.push({ ...post._doc, comments })
                    commentItemProcessed++;
                    console.log(commentItemProcessed + "   " + array.length)
                    if (commentItemProcessed === array.length) {
                        callback();
                    }
                })
            } else {
                nPosts.push({ ...post, comments: [] })
                commentItemProcessed++;
                if (commentItemProcessed === array.length) {
                    callback();
                }
            }
        });
    }

    function callback() {
        nPosts.sort(function (a, b) {
            return b["timestamp"] - a["timestamp"]
        });
        res.redirect('users/feeds');
    }*/
});


router.post('/profile', async (req, res, next) => {
    //VALIDATE BEFORE CREATE

    sess = req.session;
    sess.body = req.body;

    //const {error} = registerValidation(sess.body);
    //if(error) return res.status(400).send(error.details[0].message);

    //Check if user already in DB

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
        res.render('../views/login_succ');
    } catch (err) {
        console.log(err);
        let error = new Error("Something went wrong");
        next(error);
    }
});

router.post('/login', async (req, res) => {
    const {
        error
    } = loginValidation(req.body);

    console.log("Validation")
    console.log(error)

    if (error) {
        return res.status(422)
            .render('./../views/login.ejs', {
                pageTitle: "Login",
                message: error.details[0].message,
                input: { email: req.body.email }
            });
    }

    const user = await User.findOne({
        EmailID: req.body.email
    });
    if (!user) {
        return res.status(403)
            .render('./../views/login.ejs', {
                pageTitle: "Login",
                message: "Invalid email address or password",
                input: { email: req.body.email }
            });
    }

    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) {
        return res.status(403)
            .render('./../views/login.ejs', {
                pageTitle: "Login",
                message: "Invalid email address or password",
                input: { email: req.body.email }
            });
    }

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
        image_src: user.profile_pic
    };

    var map = new Map(); // only because unsued variables are part of humanity!
    var connection_list = []; //await getAllConnectionInformation();

    var posts = await getAllPosts(user._id);
    userPosts = [currentUserData].concat(posts);

    var itemsProcessed = 0;

    let nPosts = [];

    userPosts = userPosts.map((post, index, array) => {
        if (post._id) {
            Comments.find({
                feedId: post._id
            }).populate('author_id').exec().then(comments => {
                nPosts.push({ ...post._doc, comments })
                itemsProcessed++;
                if (itemsProcessed === array.length) {
                    callback();
                }
            })
        } else {
            nPosts.push({ ...post, comments: [] })
            itemsProcessed++;
            if (itemsProcessed === array.length) {
                callback();
            }
        }
    });

    function callback() {

        nPosts.sort(function (a, b) {
            return b["timestamp"] - a["timestamp"]
        });
        // res.render('../views/feeds_page', {
        //     posts: nPosts,
        //     connections: connection_list,
        //     map: map,
        //     user1: user,
        //     user: user,
        //     suggestions: JSON.stringify(connection_list),
        //     moment
        // });
        res.redirect('users/feeds');
    }
});


router.get('/logout', function logout(req, res) {
    req.session.destroy((err) => {
        res.redirect('/')
    })
});


router.post('/profile', async (req, res, next) => {
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
        console.log(err);
        let error = new Error("Something went wrong");
        next(error);
    }
});

router.get('/', authController.getLogin);

router.get('/signup', authController.getSignupStepOne);

router.get('/signup-finish', authController.getSignupStepTwo);

router.post('/sign-up', authController.getCheckUser);

router.post('/create-user', authController.postCreateUser);

module.exports = router;