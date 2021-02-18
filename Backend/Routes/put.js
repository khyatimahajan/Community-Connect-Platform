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

router.put("/like", async (req, res) => {
  const user = await User.findById(req.body.userId);
  const feed = await Feeds.findById(req.body.feedId);
  const visibility = await ConVis.findOne({conversation_id: feed.conversation_id});

  let union = [...new Set([...user.group_names, ...visibility.visible_to])];
  try {
    visibility.visible_to = union;
    visibility.save();
  } catch (err) {
    console.log("could not update post visibility for", feed._id)
  }

  var islikepost = false;
  try {
    if (feed.liked_by.indexOf(user._id) >= 0) {
      feed.like_count = feed.like_count - 1;
      var index = feed.liked_by.indexOf(user._id);
      feed.liked_by.splice(index, 1);
    } else {
      feed.like_count = feed.like_count + 1;
      islikepost = true;
      feed.liked_by.push(user._id);
    }
    await feed.save();
    res.status(200).send({status: "Post liked successfully!"});
  } catch (err) {
    res.status(400).send({ status: "Could not like post" });
  }
  if (islikepost) {
    try {
      // create notification for receiver
      // let oldUser = await User.findbyId(feed.user_id);
      // TODO: check activity type when pulling notifs everywhere
      let notifexists = await Notifications.findOne({"incoming_from": user._id, "outgoing_to": feed.user_id, "post_id": feed._id, "seen": false, "activity_type": "like"});
      if (!notifexists) {
        let str_fromuser = user.user_handle;
        let notif = new Notifications({
          incoming_from: user._id,
          outgoing_to: feed.user_id,
          post_id: feed._id,
          seen: false,
          activity_type: "like",
          timestamp: Date.now()
        });
        // save to DB
        notif.save();
      }
    } catch(err) {
      console.log("Could not save notification for like to DB for", feed._id);
    }
  }
});

router.put("/comment", async (req, res) => {
  let user_mentions = [];
  let post_body_parts = req.body.body.split(" ");
  post_body_parts.forEach((part) => {
    if (part.startsWith("@")) {
      part = part.split("");
      part.shift();
      user_mentions.push(part.join("").trim());
    }
  });

  var parent_id = req.body.parent_id;
  let feed = {
    user_id: req.body.userId,
    body: urlify(req.body.body),
    created_at: Date.now(),
    liked_by: [],
    reposted_by: [],
    like_count: 0,
    repost_count: 0,
    reply_count: 0,
    quote_count: 0,
    post_type: parent_id ? "reply" : "post",
    parent_id: parent_id ? parent_id : null,
    conversation_id: null,
    mentions: [...new Set(user_mentions)],
    image: req.body.image ? req.body.image : null,
  };
  const newFeed = new Feeds(feed);
  var oldFeed = await Feeds.findById(parent_id);
  try {
    // Save to DB
    let feed = await newFeed.save();
    feed.conversation_id = oldFeed.conversation_id;
    oldFeed.replies.push(feed._id);
    oldFeed.reply_count = oldFeed.reply_count + 1;
    let parent_id = oldFeed._id;
    const visibility = await ConVis.findOne({conversation_id: oldFeed.conversation_id});
    const user = await User.findById(req.body.userId);
    let union = [...new Set([...user.group_names, ...visibility.visible_to])];
    try {
      visibility.visible_to = union;
      visibility.save();
    } catch (err) {
      console.log("could not update post visibility for", feed._id)
    }
    // Update to feed
    try {
      // create notification for receiver
      let notif = new Notifications({
        incoming_from: user._id,
        outgoing_to: oldFeed.user_id,
        post_id: parent_id, 
        activity_type: "reply",
        timestamp: Date.now(),
        seen: false
      });
      // save to DB
      notif.save();
    } catch(err) {
      console.log("Could not save notification for comment to DB for", oldFeed._id);
    };
    await feed.save();
    await oldFeed.save();
    res.status(201).send({status: "Created new comment successfully!"});
  } catch (err) {
    res.status(400).send({status: "Could not post comment"});
  };
});

router.put("/mark-one-notif-as-read", async(req, res) => {
  const user = await User.findById(req.header("userId"));
  const notif = await Notifications.findById(req.header("notifId"));

  if (user) {
    try {
      notif.seen = true;
      await notif.save();
      res.status(200).send({status: "Notification marked read successfully!"});
    } catch(err) {
      res.status(500).send({status: "Internal server error - could not mark as read"});
    }
  } else {
    res.status(404).send({status: "No such user exists"})
  }
});

router.put("/mark-all-notifs-as-read", async(req, res) => {
  const user = await User.findById(req.header("userId"));
  const notifications = await Notifications.find({"outgoing_to": user._id, "seen": false});

  if (user) {
    try {
      notifications.forEach(notif => {
        notif.seen = true;
        notif.save();
      });
      res.status(200).send({status: "All notifications marked read successfully!"});
    } catch(err) {
      res.status(500).send({status: "Internal server error - could not mark all as read"});
    }
  } else {
    res.status(404).send({status: "No such user exists"})
  }
});

router.put("/change-password", async (req, res) => {
  const userId = req.header("userId");
  const { currentPassword, newPassword, cnewPassword } = req.body;
  const validationResult = validation.resetPassword(req.body);

  if (validationResult.error) {
    res.status(400).send({ status: "New passwords do not match" });
  } else {
    try {
      const user = await User.findById(userId);
      // check if current password entered is correct
      let isMatch = await bcrypt.compare(currentPassword, user.password);
      if (isMatch) {
        if (newPassword.length < 6) {
          res.status(400).send({status: "Password is too short - use 6 or more characters"})
        } else {
          let salt = await bcrypt.genSalt(10);
          // generate new hashed password
          const hashPassword = await bcrypt.hash(newPassword, salt);
          user.password = hashPassword;
          // save changes to db
          await user.save();
          res.status(200).send({ status: "Password changed successfully!" });
        }
      } else {
        res.status(400).send({ status: "Old password is wrong" });
      }
    } catch (err) {
      console.log(err);
      res.status(500).send({ status: "Internal error - please reload page" });
    }
  }
});

router.put("/moderate-post", async(req, res) => {
  const feed = await Feeds.findById(req.body.feedId);
  const user = req.body.userId;

  if (feed) {
    try {
      feed.body = '[deleted]';
      feed.image = null;

      const notif = new Notifications({
        incoming_from: 'research team',
        outgoing_to: user,
        post_id: feed._id,
        activity_type: 'moderation notice',
        seen: false,
        timestamp: Date.now()
      });

      feed.save();
      notif.save();
      res.status(200).send({status: "Moderated feed successfully."});
    } catch(err) {
      res.status(500).send({status: "Internal server error - could not moderate feed"});
    }
  } else {
    res.status(404).send({status: "No such feed exists"})
  }
});

module.exports = router;