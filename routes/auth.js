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
const Logger = require('./../model/Logger');
const utils = require('./../utils');

const {
    firstLoginValidation,
    registerValidation,
    loginValidation
} = require('../validation');
const session = require('express-session');
const { func } = require('@hapi/joi');

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
let newComment = null;

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

    let entireFeeds = await Feeds.find({ 'visible_to.users': { $in: [userID] } })
    //.populate('visible_to.userId')
    //.populate('author_id', 'name username email')

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
        return b["created_at"] - a["created_at"]
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

    console.log(req.file, req.body)

    let {
        feedId
    } = req.query;

    let currentFeed;
    var userPosts = [];
    var nPosts = [];



    currentUserName = req.user.username;
    currentUserID = req.user._id;

    currentUserData = {
        username: req.user.username,
        name: req.user.name,
        bio: req.user.bio,
        location: req.user.location,
        connection: req.user.connection,
        image_src: req.user.profile_pic,
        user_id: req.user.user_id
    };

    if (feedId) {
        //COMMENT/REPLY ON POST
        if (req.body.comment) {

            currentFeed = await Feeds.findById(feedId);
            req.session.newCommentFeed = feedId;
            //currentFeed.created_at = +new Date();
            currentFeed.com_count++;
            currentFeed.reply_count++;
            await currentFeed.save();

            const user = await User.findOne({
                user_id: currentFeed.user_id
            });

            // const newComment = new Comments({
            //     feedId: feedId,
            //     author: currentUserName,
            //     author_id: req.user,
            //     body: req.body.comment,
            //     count: 0,
            //     love_count: 0,
            //     love_people: [],
            //     author_img_src: req.user ? req.user.profile_pic : "",
            //     retweet_edit_body: "",
            //     retweet_edit_count: 0
            // });

            const newFeed = new Feeds({
                user_id: currentUserData.user_id,
                body: req.body.comment,
                created_at: +new Date(),
                liked_by: [],
                like_count: 0,
                retweet_count: 0,
                reply_count: 0,
                quote_count: 0,
                post_type: "reply",
                parent_id: feedId,
                conversation_id: currentFeed.conversation_id,
                mentions: [],
                visible_to: { users: [] }
            });

            var status = currentUserName + " commented on " + user.username + "'s post."

            const notify = new Notifications({
                inconn_id: currentUserID,
                outconn_id: user._id,
                post_id: feedId,
                activity: "comment",
                seen: false,
                status: status
            })
            await notify.save();

            try {
                await newFeed.save();
            } catch (err) {
                let error = new Error("Something went wrong");
                next(error);
            }
        }

        // RETWEET COMMENT WITH TEXT
        if (req.body.retweet_edit_body_comm) {
            currentFeed = await Feeds.findById(req.body.retweet_edit_id_comm);
            currentFeed.quote_count++;
            var author_user = currentFeed.author;
            var author_image_src = currentFeed.author_img_src;
            await currentFeed.save();

            var receiverName = currentUserName;
            var find_image_src = await User.findById(currentUserID);
            var receiver_image_src = find_image_src.profile_pic;

            let recieverUser;

            /*const user = await User.findOne({
                username: author_user
            });
            if (!user) return res.status(400).send('Receiver not found!');
            recieverUser = user;*/

            const newFeed = new Feeds({

                user_id: req.user.user_id,
                body: req.body.retweet_edit_body_comm,
                created_at: Date.now(),
                liked_by: currentFeed.liked_by,
                like_count: currentFeed.like_count,
                retweet_count: currentFeed.retweet_count,
                reply_count: currentFeed.reply_count,
                quote_count: currentFeed.quote_count,
                post_type: "quote",
                parent_id: currentFeed._id,
                conversation_id: currentFeed.conversation_id,
                mentions: currentFeed.mentions,
                visible_to: currentFeed.visible_to,

                author: receiverName,
                author_image: receiver_image_src,
                author_id: req.user,
                receiver: author_user,
                receiver_id: recieverUser,
                receiver_image: author_image_src,
                // body: req.body.body,
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
                let error = new Error("Something went wrong");
                next(error);
            }
        }



        //RETWEET WITH TEXT
        if (req.body.retweet_edit_body) {
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
            currentFeed.quote_count++;
            currentFeed.retweet_edit_count++;

            try {
                await currentFeed.save();
            } catch (err) {
                let error = new Error("Something went wrong");
                next(error);
            }


            const newFeed = new Feeds({
                user_id: req.user.user_id,
                body: req.body.retweet_edit_body,
                created_at: Date.now(),
                liked_by: currentFeed.liked_by,
                like_count: currentFeed.like_count,
                retweet_count: currentFeed.retweet_count,
                reply_count: currentFeed.reply_count,
                quote_count: currentFeed.quote_count,
                post_type: "quote",
                parent_id: currentFeed._id,
                conversation_id: currentFeed.conversation_id,
                mentions: currentFeed.mentions,
                visible_to: currentFeed.visible_to,

                author: currentUserName,
                author_image: author_image_src,
                receiver: receiverName,
                receiver_image: receiver_image_src,
                //body: req.body.body,
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
                let error = new Error("Something went wrong");
                next(error);
            }
        }

        //COMMENT RETWEET 
        if (req.body.retweet_com) {

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

            currentFeed = await Feeds.findById(req.body.post_id);
            currentFeed.retweet_count++;
            await currentFeed.save();

            const newFeed = new Feeds({
                user_id: req.user.user_id,
                body: req.body.body,
                created_at: Date.now(),
                liked_by: currentFeed.liked_by,
                like_count: currentFeed.like_count,
                retweet_count: currentFeed.retweet_count,
                reply_count: currentFeed.reply_count,
                quote_count: currentFeed.quote_count,
                post_type: "retweet",
                parent_id: currentFeed._id,
                conversation_id: currentFeed.conversation_id,
                mentions: currentFeed.mentions,
                visible_to: currentFeed.visible_to,


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
                let error = new Error("Something went wrong");
                next(error);
            }
        }

        //RETWEET POST
        if (req.body.retweet) {

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

            currentFeed = await Feeds.findById(feedId);
            currentFeed.retweet_count++;
            currentFeed.count++;
            await currentFeed.save();

            const user = await User.findOne({
                user_id: currentFeed.user_id
            });

            if (currentFeed.parent_id) {
                currentFeed = await Feeds.findById(currentFeed.parent_id);
            }

            const newFeed = new Feeds({
                user_id: req.user.user_id,
                body: req.body.body,
                created_at: Date.now(),
                liked_by: currentFeed.liked_by,
                like_count: currentFeed.like_count,
                retweet_count: currentFeed.retweet_count,
                reply_count: currentFeed.reply_count,
                quote_count: currentFeed.quote_count,
                post_type: "retweet",
                parent_id: currentFeed._id,
                conversation_id: currentFeed.conversation_id,
                mentions: currentFeed.mentions,
                visible_to: currentFeed.visible_to,


                author: currentUserName,
                author_image: author_image_src,
                receiver: receiverName,
                receiver_id: recieverUser,
                receiver_image: receiver_image_src,
                count: 0,
                author_id: req.user,
                com_count: 0,
                love_people: [],
                retweet_edit_body: "",
                retweet_edit_count: 0,
                notification: ""
            });


            var status = currentUserName + " retweeted " + user.username + "'s post."

            const notify = new Notifications({
                inconn_id: currentUserID,
                outconn_id: user._id,
                post_id: feedId,
                activity: "retweet",
                seen: false,
                status: status
            })

            try {
                await newFeed.save();
                await notify.save();
            } catch (err) {
                let error = new Error("Something went wrong");
                next(error);
            }
        }


        //LIKE POST
        if (req.body.love) {
            currentFeed = await Feeds.findById(feedId);
            const user = await User.findOne({
                user_id: currentFeed.user_id
            });

            if (!currentFeed.liked_by.includes(currentUserID)) {
                currentFeed.like_count++;
                currentFeed.liked_by.push(currentUserData.username);
                await currentFeed.save();
            }

            var status = currentUserName + " liked " + user.username + "'s post."

            const notify = new Notifications({
                inconn_id: currentUserID,
                outconn_id: user._id,
                post_id: feedId,
                activity: "like",
                seen: false,
                status: status
            })
            try {
                await notify.save();
            } catch (err) {
                let error = new Error("Something went wrong");
                next(error);
            }

        }

        //LIKE COMMENT ON POST
        if (req.body.love_com) {

            currentFeed = await Comments.findById(req.body.love_com);

            if (!currentFeed.love_people.includes(currentUserID)) {
                currentFeed.love_count++;
                currentFeed.love_people.push(currentUserID);
                await currentFeed.save();
            }

            const user = await User.findOne({
                user_id: currentFeed.user_id
            });

            var status = currentUserName + " liked " + user.username + "'s comment."

            const notify = new Notifications({
                inconn_id: currentUserID,
                outconn_id: user._id,
                post_id: feedId,
                activity: "like",
                seen: false,
                status: status
            })
            try {
                await notify.save();
            } catch (err) {
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

        //GET USER MENTIONS FROM POST BODY
        let user_mentions = []
        let post_body_parts = req.body.body.split(" ");
        post_body_parts.forEach(part => {
            if (part.startsWith("@")) {
                part = part.split("");
                part.shift();
                user_mentions.push(part.join("").trim());
            }
        });

        req.user.getUserGroupMembers(currentUserID, async (groupUsers, groups) => {
            groupUsers = groupUsers.map(user => user.user_id);

            const newFeed = new Feeds({
                user_id: currentUserData.user_id,
                body: req.body.body,
                created_at: Date.now(),
                liked_by: [],
                like_count: 0,
                retweet_count: 0,
                reply_count: 0,
                quote_count: 0,
                post_type: "tweet",
                parent_id: null,
                conversation_id: null,
                mentions: [...new Set(user_mentions)],
                visible_to: { users: groupUsers, groups },
                image: req.file ? req.file.path.replace(/\\/g, "/") : "null",


                author: currentUserName,
                author_image: author_image_src,
                receiver: receiverName,
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
                let feed = await newFeed.save();

                feed.getUserMentions(req.body.body);

                feed.conversation_id = feed._id;
                await feed.save();
            } catch (err) {
                let error = new Error("Something went wrong");
                next(error);
            }
        });
    }

    var posts = await getAllPosts(req.user._id);
    var connection_list = await getAllConnectionInformation()
    userPosts = [currentUserData].concat(posts);

    let userGroups = [];
    let user;

    if (feedId && (req.body.comment || req.body.love)) {
        currentFeed = await Feeds.findById(feedId);
        user = await User.findOne({
            user_id: currentFeed.user_id
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
                let found = currentFeed.visible_to.users.includes(currentUser._id.toString());
                let currentUserGroups = currentUser.group_id;
                let otherGroups = [];
                let groupProccessed = 0;
                currentUserGroups.forEach(async (grp, index, array) => {
                    let g = await Group.findOne({ group_id: grp })
                    otherGroups.push(g.group_name);
                    groupProccessed++;
                    if (groupProccessed == array.length) {
                        groupDOne();
                    }
                });

                notificationUsers = currentFeed.visible_to.users.concat(notificationUsers.map(user => user.user_id));

                //check if user is from different group
                let isFromSame = utils.isHavingSameItems(req.user.group_id, user.group_id);

                async function groupDOne() {
                    otherGroups = otherGroups.concat(currentFeed.visible_to.groups)

                    if (!found && (JSON.stringify(currentUser._id) != JSON.stringify(user._id))) {
                        let activity = '';
                        if (req.body.comment) activity = 'comment'; else if (req.body.retweet) activity = 'retweet'; else activity = 'love';
                        currentFeed.visible_to.users = [...new Set(notificationUsers)];
                        currentFeed.visible_to.groups = [...new Set(otherGroups)];
                        if (isFromSame) {
                            currentFeed.visible_to.userId = req.user._id;
                            currentFeed.visible_to.userActivity = activity;
                            currentFeed.timestamp = req.body.comment ? Date.now() : currentFeed.timestamp;
                        }
                        await currentFeed.save();
                    }
                    addComments();
                }
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
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(sess.body.password, salt);

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
        let error = new Error("Something went wrong");
        next(error);
    }
});

router.post('/login', async (req, res) => {
    const {
        error
    } = loginValidation(req.body);

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

    //Logger for user login time
    let log = await Logger.findOne({ 'user.id': user._id });
    if (log) {
        log.loggedInAt = new Date();
        log.loggedOutAt = null;
        log.save();

    } else {
        let log = new Logger({
            user: {
                id: user._id,
                username: user.username,
                name: user.name
            },
            loggedInAt: new Date()
        });
        log.save();
    }

    currentUserID = user._id;
    req.session.user = user;
    req.session.isLoggedIn = true;
    req.session.notificationViewed = false;
    const salt = user.salt;
    currentUserName = user.username;

    currentUserData = {
        username: user.username,
        name: user.name,
        bio: user.bio,
        location: user.location,
        connection: user.connection,
        image_src: user.profile_pic,
        user_id: user.user_id
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
        res.redirect('users/home');
    }
});

router.get('/logout', async (req, res, next) => {
    //Logger for user logout time
    let log = await Logger.findOne({ 'user.id': req.user._id });
    if (log) {
        log.loggedOutAt = new Date();
        log.save();
    }

    req.session.destroy((err) => {
        res.redirect('/')
    })
})

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