const express = require("express");
const User = require("./../model/User");
const Feeds = require("./../model/Feeds");
const Comments = require("./../model/Comments");
const Notifications = require("./../model/Notifications");
const Group = require("./../model/Group");
const ConVis = require("./../model/ConversationVisibility");
const Logger = require("./../model/Logger");
const router = express.Router();
const validation = require("./../validation");
const bcrypt = require("bcryptjs");
const { urlify } = require("./../utils");
const upload = require('./../middleware/file-uploads');

// TODO! limit visibility by groups for everything - only check for /feed/:feed_id

router.get("/server/status", function (req, res) {
    res.status(200).send("Get Server OK");
});

router.get("/notifications", async (req, res) => {
    const userId = req.header("userId");
    const user = await User.findById(userId);
    if (user) {
      try {
        const notifs = await Notifications.find({"outgoing_to": user._id, "incoming_from": { $ne: user._id }}, null, {sort: { "timestamp" : "descending" , "seen": "descending" }});
  
        let notifdto = [];

        notifs.forEach(notification => {
          notifdto.push({
            'post_id': notification.post_id,
            'status': notification.status,
            'seen': notification.seen,
            'timestamp': notification.timestamp
          })
        });
  
        res.status(200).send(notifdto)
      } catch(err) {
        res.status(500).send({status: "Internal server error"})
      }
    } else {
      res.status(404).send({status: "No such user exists"})
    }
});

router.get("/profile", async (req, res) => {
  let userId = req.headers.id;
  if (userId != null) {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).send({ status: "No matching user exists" });
    } else {
      let notificationCount = await Notifications.find({
        outconn_id: user._id,
        seen: false,
        inconn_id: { $ne: user._id }
      }).countDocuments();

      var response = {
        id: user._id,
        user_handle: user.user_handle,
        bio: user.bio,
        notification_count: notificationCount || 0,
        profile_pic: user.profile_pic,
        group_names: user.group_names
      };
      res.status(200).send(response);
    }
  }
});

router.get("/feeds", async (req, res) => {
  let userId = req.headers.id;
  if (userId != null) {
    const user = await User.findById(userId);
    if (user) {
      let group = user.group_names;
      // let allUsers = await User.find({}, 'id user_handle profile_pic');
      var entireFeeds = await Feeds.find({"post_type": { $ne: "reply" }}, null, { sort: { "created_at" : "descending" }}).limit(30)
      .populate({ 
              path: "parent_id",
              populate: {
                  path: "user_id",
                  model: "User",
              }})
      // TODO! make feed visible only if user belongs to groups .populate("conversation_id", null, {"visible_to": {$in: group}})
      .populate("user_id", '_id profile_pic user_handle').populate("replies");

      let feeddto = [];
      entireFeeds.forEach(feed => {
          feeddto.push({
              id: feed._id,
              author: feed.user_id,
              body: feed.body,
              created_at: feed.created_at,
              like_count: feed.like_count,
              reply_count: feed.reply_count,
              repost_count: feed.repost_count,
              quote_count: feed.quote_count,
              has_liked: feed.liked_by.includes(user._id)? true : false,
              has_reposted: feed.reposted_by.includes(user._id)? true : false,
              replies: feed.replies,
              image: feed.image,
              parent_post: feed.parent_id ? {
                      _id: feed.parent_id._id,
                      author: feed.parent_id.user_id,
                      body: feed.parent_id.body,
                      image: feed.parent_id.image,
                      created_at: feed.parent_id.created_at,
                  } : null,
              is_repost: feed.post_type == 'repost'? true : false,
          })
      });
      res.status(200).send(feeddto);
    }
  } else {
    res.status(400).send({ status: "No user ID was received for getting feeds" });
  }
});

router.get("/connections", async (req, res) => {
  const userId = req.header("userId");
  if (userId != null) {
    const user = await User.findById(userId);
    if (user) {
      let groups = user.group_names;
      const users = await User.find({
        group_names: { $in: groups },
      }, '_id user_handle profile_pic');
      res.send(users);
    }
  } else {
    res.status(400).send({ status: "No userid provided to make request" });
  }
});

router.get("/user/:username", async (req, res) => {
    let user_handle = req.params.user_handle;

    if (username != null) {
      const user = await User.findOne({
          "user_handle" : user_handle
      }, '_id user_handle profile_pic');
      if (user) {
        let filters = '_id user_id body created_at liked_by reposted_by  like_count repost_count reply_count quote_count post_type image parent_id conversation_id image';
        let entireFeeds = await Feeds.find({
          "user_id": { $eq: user._id },
          "post_type": { $ne: "reply" },
        }, filters, { sort: { "created_at" : "descending" }}).populate({ 
              path: "parent_id",
              populate: {
                  path: "user_id",
                  model: User,
              }}, '_id user_id body image created_at', filters).populate("user_id", '_id user_handle profile_pic');

        var modifiedFeeds = [];
        entireFeeds.forEach(feed => {
          modifiedFeeds.push({
            author: feed.user_id,
            body: feed.body,
            created_at: feed.created_at,
            like_count: feed.like_count,
            reply_count: feed.reply_count,
            quote_count: feed.quote_count,
            repost_count: feed.repost_count,
            has_liked: feed.has_liked,
            has_reposted: feed.has_reposted,
            replies: feed.replies,
            image: feed.image,
            parent_post: {
                _id: feed.parent_id._id,
                author: feed.parent_id.user_id,
                body: feed.parent_id.body,
                image: feed.parent_id.image,
                created_at: feed.parent_id.created_at
            },
            is_repost: feed.is_repost,
          });
        });
        res.send(modifiedFeeds);
      } else {
        res.status(404).send({ status: "User not found" })
      }
    } else {
      res.status(400).send({ status: "No username provided" });
    }
});

router.get("/feeds/:feed_id", async (req, res) => {
  let feed_id = req.params.feed_id;
  const user = await User.findById(req.header("userId"));

  if (feed_id != null) {
    if (user) {
      let groups = user.group_names;
      // let allUsers = await User.find({}, 'user_id username profile_pic');
      let filters = '_id user_id body created_at liked_by reposted_by  like_count repost_count reply_count quote_count post_type image parent_id conversation_id image replies';
      var entireFeeds = await Feeds.findOne({
        "_id": feed_id,
      }, null, { sort: { "created_at" : "ascending" }}).populate({ 
              path: "parent_id",
              populate: {
                  path: "user_id",
                  model: User,
              }}, '_id user_id body image created_at', filters).populate({ 
              path: "replies",
              populate: {
                  path: "user_id",
                  model: User,
              }}, '_id user_id body image created_at', filters);

      var modifiedFeeds = [];
        entireFeeds.forEach(feed => {
          modifiedFeeds.push({
            author: feed.user_id,
            body: feed.body,
            created_at: feed.created_at,
            like_count: feed.like_count,
            reply_count: feed.reply_count,
            quote_count: feed.quote_count,
            repost_count: feed.repost_count,
            has_liked: feed.has_liked,
            has_reposted: feed.has_reposted,
            replies: feed.replies,
            image: feed.image,
            parent_post: {
                _id: feed.parent_id._id,
                author: feed.parent_id.user_id,
                body: feed.parent_id.body,
                image: feed.parent_id.image,
                created_at: feed.parent_id.created_at
            },
            is_repost: feed.is_repost,
          });
        });
      res.status(200).send(modifiedFeeds);
    }
  } else {
    res.status(400).send({ status: "No feed ID provided" });
  }
});

router.get("/signup", async (req, res) => {
  let user_code = req.header("user_code");
  const user = await User.findOne({"user_code": user_code});
  if (!user) {
    res.status(404).send({ status: "Could not find any user matching that userid" });
  } else {
    if (user.password && user.profile_pic) {
      res.status(403).send({ status: "Access code has already been redeemed"});
    } else {
      res.status(200).send(user);
    };
  };
});



module.exports = router;