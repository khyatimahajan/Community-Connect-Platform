const moment = require('moment');
const bcrypt = require('bcryptjs');
const bonsole = require('bonsole');

const User = require('../model/User');
const Feeds = require('../model/Feeds');
const Notifications = require('../model/Notifications');
const Comments = require('../model/Comments');
const validation = require('../validation');
const utils = require('./../utils');

var currentUserID;

async function getAllPosts(userID) {

    return new Promise(async (res, rej) => {

        var allPosts = []
        var feedNotifications = [];
        var user_conn = await getAllConnectionInformation()

        for (var i = 0; i < user_conn.length; i++) {
            var temp_post = await Feeds.find({
                user_id: user_conn[i].user_id,
                //post_type: { $ne: "reply" }
            }).populate('parent_id');

            allPosts.push.apply(allPosts, temp_post)
        }

        let user = await User.findById(userID);

        let entireFeeds = await Feeds.find({ 'visible_to.users': { $in: [user.user_id] } })
            .populate('parent_id')
            .populate('visible_to.userId')
            .populate('author_id', 'name username email')

        var temp_post = await Feeds.find({
            user_id: currentUserData.user_id,
            //post_type: { $ne: "reply" }
        }).populate('parent_id');

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

        for (var curPost = 0; curPost < allPosts.length; curPost++) {
            var feedComments = await (allPosts[curPost]["_id"]);
            allPosts[curPost].comments = feedComments;
        }

        allPosts = allPosts.concat(entireFeeds);

        allPosts = removeDups(allPosts, "_id");

        allPosts.sort(function (a, b) {
            return b["created_at"] - a["created_at"]
        });

        let postsProcessed = 0;
        let processedPosts = [];


        allPosts.forEach(async (post, index, array) => {
            let postUser = await User.findOne({ user_id: post.user_id });
            postsProcessed++;
            processedPosts.push({ ...post._doc, user_id: postUser });
            if (postsProcessed == array.length) {
                callback();
            }
        });

        function callback() {
            res(removeDuplicates(processedPosts));
        }

        if (allPosts.length == 0) {
            res(removeDuplicates(processedPosts));
        }

    });

    function removeDuplicates(arr) {
        const uniqueArray = arr.filter((thing, index) => {
            const _thing = JSON.stringify(thing);
            return index === arr.findIndex(obj => {
                return JSON.stringify(obj) === _thing;
            });
        });
        return uniqueArray;
    }
}

function removeDups(originalArray, prop) {
    var newArray = [];
    var lookupObject = {};

    for (var i in originalArray) {
        lookupObject[originalArray[i][prop]] = originalArray[i];
    }

    for (i in lookupObject) {
        newArray.push(lookupObject[i]);
    }
    return newArray;
}

function getAllConnectionInformation() {
    function removeDuplicates(arr) {
        const uniqueArray = arr.filter((thing, index) => {
            const _thing = JSON.stringify(thing);
            return index === arr.findIndex(obj => {
                return JSON.stringify(obj) === _thing;
            });
        });
        return uniqueArray;
    }

    return new Promise(async (res, rej) => {
        let allConnections = [];
        let itemsProcessed = 0;
        const user = await User.findById(currentUserID);
        let group_ids = user.group_id;

        group_ids.forEach(async (group_id, index, array) => {
            let group_users = await User.find({ "group_id": { $in: [group_id] } }).exec();
            group_users = group_users.filter(u => JSON.stringify(u._id) != JSON.stringify(user._id));
            allConnections.push(...group_users);
            itemsProcessed++;
            if (itemsProcessed == array.length) {
                callback();
            }
        });

        function callback() {
            allConnections = removeDuplicates(allConnections);
            res(allConnections);
        }
    });
}

module.exports.getProfile = async (req, res) => {
    let user = req.user;
    let data = [];

    let notificationCount = await Notifications.find({
        outconn_id: user._id,
        seen: false
    }).countDocuments();

    data = req.flash('form');
    if (!user) {
        return res.redirect('/');
    }
    res.render('../views/user-profile.ejs', {
        user: user,
        pageTitle: "Profile",
        message: req.flash('message'),
        profileMessage: req.flash('profileMessage'),
        form: data,
        notificationCount,
        notificationViewed: req.session.notificationViewed,
        pform: req.flash('pform'),
        path: "users/profile"
    })
}

module.exports.updateProfile = async (req, res) => {
    const { name, username, email, location, bio } = req.body;
    const validationResult = validation.updateProfile(req.body);

    if (validationResult.error) {
        req.flash('profileMessage', validationResult.error.details[0].message)
        req.flash('pform', req.body)
        return res.redirect('profile')
    }

    try {
        req.user.name = name;
        req.user.location = location;
        req.user.bio = bio;

        let response = await req.user.save()

        req.flash('profileMessage', 'Profile updated successfully')
        return res.redirect('/users/profile');

    } catch (err) {
        console.log(err)
        let error = new Error("Something went wrong");
        next(error);
    }
}

module.exports.getNotifications = async (req, res) => {
    req.session.notificationViewed = true;

    let user = req.user;

    try {
        let notifications = await Notifications.find({
            outconn_id: user._id
        }).populate('inconn_id').sort({ timestamp: -1 });

        //Update Notification to seen
        notifications.forEach(notification => {
            notification.seen = true;
            notification.save();
        });

        return res.render('../views/notifications.ejs', {
            user: req.user,
            notifications: notifications,
            pageTitle: "Notifications",
            moment,
            notificationCount: notifications.length,
            notificationViewed: req.session.notificationViewed,
            path: "users/notifications"
        });

    } catch (err) {
        console.log(err);
        let error = new Error("Something went wrong");
        next(error);
    }
}

module.exports.getFeeds = async (req, res, next, path = null) => {
    let user = req.user;
    if (!user) return res.redirect('/');

    try {
        currentUserData = {
            username: user.username,
            name: user.name,
            bio: user.bio,
            location: user.location,
            connection: user.connection,
            image_src: user.profile_pic,
            user_id: user.user_id
        };
        currentUserID = user._id;

        //Notification Count
        let notificationCount = await Notifications.find({
            outconn_id: user._id,
            seen: false
        }).countDocuments();

        var posts = await getAllPosts(user._id);



        // posts = removeDups(posts, "_id");



        userPosts = [currentUserData].concat(posts);

        var map = new Map();
        var connection_list = await getAllConnectionInformation();

        var itemsProcessed = 0;
        let nPosts = [];
        let replys = [];



        userPosts = userPosts.map(async (post, index, array) => {
            if (post._id) {
                /*let commentUser = await User.findOne({ user_id: post.user_id.user_id });

                Feeds.find({
                    parent_id: post._id,
                    post_type: "reply"
                }).populate('author_id').exec().then(comments => {
                    nPosts.push({
                        ...post, comments: comments.map(comment => {
                            return { ...comment._doc, user_id: commentUser._doc }
                        })
                    })

                    itemsProcessed++;
                    if (itemsProcessed === array.length) {
                        callback();
                    }
                })*/

                /* if (post.post_type != "reply") {
                     nPosts.push({ ...post, comments: [] })
                     itemsProcessed++;
                     if (itemsProcessed === array.length) {
                         callback();
                     }
                 } else if (post.parent_id && post.parent_id.reply_count > 0) {
                     replys.push({ ...post, comments: [] });
                     itemsProcessed++;
                     if (itemsProcessed === array.length) {
                         callback();
                     }
                 } else {
                     replys.push({ ...post, comments: [] });
                     itemsProcessed++;
                     if (itemsProcessed === array.length) {
                         callback();
                     }
                 }*/



                if (post.post_type == "reply") {

                    replys.push({ ...post, comments: [] });
                    itemsProcessed++;
                    if (itemsProcessed === array.length) {
                        callback();
                    }

                } else if (post.post_type == "retweet") {

                    console.log()

                    let rp = await Feeds.find({ parent_id: post.parent_id, post_type: "reply" }).populate('parent_id').sort({ created_at: 'desc' });


                    rp.forEach((r, index) => {
                        let p_parent_id = { ...rp[index].parent_id._doc, _id: post._id };
                        let p = { ...rp[index]._doc, parent_id: p_parent_id, user_id: post.user_id }

                        replys.push({ ...p, comments: [] })
                    })


                    nPosts.push({ ...post, comments: [] })
                    itemsProcessed++;
                    if (itemsProcessed === array.length) {
                        callback();
                    }

                } else {
                    nPosts.push({ ...post, comments: [] })
                    itemsProcessed++;
                    if (itemsProcessed === array.length) {
                        callback();
                    }
                }


            } else {
                nPosts.push({ ...post, comments: [] })
                itemsProcessed++;
                if (itemsProcessed === array.length) {
                    callback();
                }
            }
        });


        function deepCopyFunction(inObject) {
            let outObject, value, key

            if (typeof inObject !== "object" || inObject === null) {
                return inObject
            }

            outObject = Array.isArray(inObject) ? [] : {}

            for (key in inObject) {
                value = inObject[key]
                outObject[key] = deepCopyFunction(value)
            }

            return outObject
        }

        // nPosts = userPosts;

        // callback();

        function callback() {




            replys.forEach(reply => {
                let post = nPosts.filter(post => {
                    return JSON.stringify(post._id) == JSON.stringify(reply.parent_id._id)
                })
                post = post[0];
                if (post) {
                    let index = nPosts.findIndex(p => p == post);
                    // let cmts;
                    // if (post.hasOwnProperty("comments") && post.comments) {
                    //     cmts = post.comments;
                    // } else {
                    //     cmts = [];
                    // }
                    nPosts[index] = { ...post, comments: post.comments.concat(reply) }
                }

            });

            //nPosts = [currentUserData].concat(nPosts);

            let finalPostProcessed = 0;

            let uPosts = [];

            nPosts.forEach(async (post, index, array) => {
                if (post.parent_id) {

                    let p = await Feeds.findById(post.parent_id);
                    let user = await User.findOne({ user_id: p.user_id })



                    /* old let user = await User.findOne({ user_id: post.parent_id.user_id, isAdmin: "false" }) */
                    if (user) {

                        // old uPosts.push({ ...post, parent_id: { ...post.parent_id._doc, user_id: user } });
                        uPosts.push({ ...post, parent_id: { ...p._doc, user_id: user } });

                    }

                    finalPostProcessed++;
                    if (finalPostProcessed == array.length) {
                        renderScreen(uPosts);
                    }

                } else {
                    uPosts.push({ ...post });
                    finalPostProcessed++;
                    if (finalPostProcessed == array.length) {
                        renderScreen(uPosts);
                    }
                }
            });
        }



        function renderScreen(uPosts) {
            uPosts = uPosts.map(p => {
                return { ...p, 'post_order': p.created_at }
            })

            // bonsole("OLD ORDER");
            // bonsole(uPosts);

            console.log("ACTIVITY POST");
            console.log(req.session.activityPost);

            if (req.session.activityPost) {
                let index = uPosts.findIndex(p => JSON.stringify(p._id) == JSON.stringify(req.session.activityPost))
                console.log("INDEX", index);
                if (index >= 0)
                    uPosts[index].post_order = Date.now();
            }

            uPosts.sort(function (a, b) {
                return b["post_order"] - a["post_order"]
            });

            // bonsole("NEW ORDER");
            // bonsole(uPosts);

            /*if (req.session.newCommentFeed) {
                let index = uPosts.findIndex(i => i._id == req.session.newCommentFeed);
                arraymove(uPosts, index, 1);
            }*/

            // let first = uPosts[0];
            // uPosts = uPosts.filter(post => {
            //     return post.comments.length > 0;
            // });
            // uPosts.unshift(first);



            // if (req.session.newPostMade)
            //     global.nsp.emit('new-post', uPosts[1]);

            // req.session.newPostMade = false;



            res.render('../views/feeds_page', {
                user: user,
                posts: uPosts,
                connections: connection_list,
                suggestions: JSON.stringify(connection_list),
                map: map,
                user1: user,
                notificationCount,
                notificationViewed: req.session.notificationViewed,
                moment,
                path: path ? path : "users/feeds",
                pageTitle: "Feeds"
            });
        }

    } catch (err) {
        console.log(err);
        let error = new Error("Something went wrong");
        next(error);
    }


    function arraymove(arr, fromIndex, toIndex) {
        var element = arr[fromIndex];
        arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, element);
    }
}

module.exports.getHome = (req, res, next) => {
    this.getFeeds(req, res, next, "users/home");
}

module.exports.resetPassword = async (req, res, next) => {
    const { currentPassword, newPassword, cnewPassword } = req.body;
    const validationResult = validation.resetPassword(req.body);

    if (validationResult.error) {
        req.flash('message', validationResult.error.details[0].message)
        req.flash('form', req.body)
        return res.redirect('profile')
    }

    try {
        let isMatch = await bcrypt.compare(currentPassword, req.user.password);
        if (isMatch) {
            let salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(newPassword, salt);
            req.user.password = hashPassword;
            let result = await req.user.save();
            req.flash('message', 'Password changed successfully')
            res.redirect('profile')

        } else {
            req.flash('form', req.body)
            req.flash('message', 'Old password is wrong')
            res.redirect('profile')
        }
    } catch (err) {
        console.log(err)
        req.flash('form', req.body)
        req.flash('message', 'Something has went wrong')
        res.redirect('profile')
    }
}