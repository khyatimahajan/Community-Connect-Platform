const moment = require('moment');
const bcrypt = require('bcryptjs');

const User = require('../model/User');
const Feeds = require('../model/Feeds');
const Notifications = require('../model/Notifications');

const validation = require('../validation');

var currentUserID;

async function getAllPosts() {
    var allPosts = []
    var user_conn = await getAllConnectionInformation()
    for (var i = 0; i < user_conn.length; i++) {
        var temp_post = await Feeds.find({
            author: user_conn[i].username
        })
        allPosts.push.apply(allPosts, temp_post)
    }

    var temp_post = await Feeds.find({
        author: currentUserData.username
    })
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

    allPosts.sort(function (a, b) {
        return b["timestamp"] - a["timestamp"]
    });

    for (var curPost = 0; curPost < allPosts.length; curPost++) {
        var feedComments = await (allPosts[curPost]["_id"]);
        allPosts[curPost].comments = feedComments;
    }

    return allPosts;
}

async function getAllConnectionInformation() {
    const user = await User.findOne({
        _id: currentUserID
    });

    user_dict = []
    connection_list = user.connection.name;

    for (var i = 0; i < connection_list.length; i++) {
        var user_conn = await User.findOne({
            _id: connection_list[i]
        });
        user_dict.push(user_conn)

    }
    return user_dict
}

module.exports.getProfile = (req, res) => {
    let user = req.user;
    let data = [];
    data = req.flash('form');
    if (!user) {
        return res.redirect('/');
    }
    res.render('../views/user-profile.ejs', { 
        user: user,
        pageTitle: "User Profile",
        message: req.flash('message'),
        profileMessage: req.flash('profileMessage'),
        form: data,
        pform : req.flash('pform')
    })
}

module.exports.updateProfile = async (req, res) => {
    const { name, username, email, location, bio } = req.body;

    const validationResult = validation.updateProfile(req.body);
    console.log(validationResult)

    if(validationResult.error) {
        req.flash('profileMessage', validationResult.error.details[0].message)
        req.flash('pform', req.body)
        return res.redirect('profile')
    }

    req.user.name = name;
    req.user.location = location;
    req.user.bio = bio;

    let response  = await req.user.save()

    req.flash('profileMessage', 'Profile updated successfully')
    return res.redirect('/users/profile');
}


module.exports.getNotifications = (req, res) => {
    let user = req.user;
    if (!user) {
        return res.redirect('/');
    }

    Notifications.find({ 
        outconn_id: user._id
    })
    .populate('inconn_id')
    .then(notifications =>{

        console.log("Notificaitons");
        console.log(notifications)

        res.render('../views/notifications.ejs', {
            user: req.user,
            notifications: notifications,
            pageTitle: "Notifications",
            moment
        });
    }).catch(err=>{
        console.log(err);
    })
}

module.exports.getFeeds = async (req, res) => {
    let user = req.user;

    if (!user) return res.redirect('/');
    currentUserData = {
        username: user.username,
        name: user.name,
        bio: user.bio,
        location: user.location,
        connection: user.connection,
        image_src: user.image_src
    };
    currentUserID = user._id;

    var posts = await getAllPosts();
    userPosts = [currentUserData].concat(posts);

    var map = new Map();
    var connection_list = await getAllConnectionInformation();

    console.log("Connections");
    console.log(connection_list)

    res.render('../views/feeds_page', {
        user: user,
        posts: userPosts,
        connections: connection_list,
        suggestions: JSON.stringify(connection_list),
        map: map,
        user1: user,
    });
}

module.exports.resetPassword = async (req, res, next) => {
    const { currentPassword, newPassword, cnewPassword } = req.body;

    const validationResult = validation.resetPassword(req.body);

    if(validationResult.error) {
        req.flash('message', validationResult.error.details[0].message)
        req.flash('form', req.body)
        return res.redirect('profile')
    }

    try {
        let isMatch = await bcrypt.compare(currentPassword, req.user.password);
        console.log(isMatch)
        if(isMatch) {
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
    } catch(err) {
        console.log(err)
        req.flash('form', req.body)
        req.flash('message', 'Something has went wrong')
        res.redirect('profile')
    }
    
}
