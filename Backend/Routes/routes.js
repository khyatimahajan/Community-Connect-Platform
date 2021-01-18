const express = require("express");
const User = require("./../model/User");
const Feeds = require("./../model/Feeds");
const Comments = require("./../model/Comments");
const Notifications = require("./../model/Notifications");
const Group = require("./../model/Group");
const Logger = require("./../model/Logger");
const router = express.Router();
const validation = require("./../validation");
const bcrypt = require("bcryptjs");
const { urlify } = require('./../utils');

// Get all users
router.get("/users", async (req, res) => {
  const users = await User.find();
  res.send(users);
});

router.post("/login", async (req, res) => {
  const { error } = validation.loginValidation(req.body);
  if (error) {
    res.status(404).send({ status: "Bad Request" });
  } else {
    const { email, password } = req.body;
    const user = await User.findOne({
      EmailID: email,
    });

    if (!user) {
      res.status(403).send({ status: "Forbidden" });
    } else {
      const validPass = await bcrypt.compare(req.body.password, user.password);
      if (!validPass) {
        res.status(401).send({ status: "Unauthorized" });
      } else {
        var response = {
          group_id: user.group_id,
          isAdmin: user.isAdmin,
          id: user._id,
          name: user.name,
          user_id: user.user_id,
          EmailID: user.EmailID,
          username: user.username,
          bio: user.bio,
          profile_pic: user.profile_pic,
        };
        res.send(response);

        //Logger for user login time
        let log = new Logger({
          user: {
            id: user._id,
            username: user.username,
            name: user.name,
          },
          loggedInAt: {
            serverTime: new Date(),
            userTime: new Date().toLocaleString("en-US", {
              timeZone: req.body.timezone || "America/New_York",
            }),
          },
        });
        // Save it to DB
        log.save();
      }
    }
  }
});

router.get("/profile", async (req, res) => {
  let userId = req.headers.id;
  if (userId != null) {
    const user = await User.findById(userId);
    if (user) {
      let notificationCount = await Notifications.find({
        outconn_id: user._id,
        seen: false,
      }).countDocuments();

      var response = {
        group_id: user.group_id,
        isAdmin: user.isAdmin,
        id: user._id,
        name: user.name,
        user_id: user.user_id,
        EmailID: user.EmailID,
        username: user.username,
        bio: user.bio,
        notification_count: notificationCount || 0,
        profile_pic: user.profile_pic,
      };
      res.send(response);
    }
  } else {
    res.status(404).send({ status: "Bad Request" });
  }
});

router.post("/logout", async (req, res) => {
  let userId = req.headers.id;
  if (userId != null) {
    let log = await Logger.findOne({ "user.id": req.user._id }).sort([
      ["loggedInAt", -1],
    ]);

    if (log) {
      res.status(201).send("Logged Out");

      log.loggedOutAt.serverTime = new Date();
      log.loggedOutAt.userTime = new Date().toLocaleString("en-US", {
        timeZone: req.body.timezone || "America/New_York",
      });
      log.save();
    } else {
      res.status(400).send("Could not log");
    }
  } else {
    res.status(400).send({ status: "Bad Request" });
  }
});

router.get("/feeds", async (req, res) => {
  let userId = req.headers.id;
  if (userId != null) {
    const user = await User.findById(userId);
    if (user) {
      let group = user.group_id;
      let entireFeeds = await Feeds.find({
        "visible_to.groups": { $in: group },
      }).populate('parent_id');
    
      res.send(entireFeeds);
    }
  } else {
    res.status(404).send({ status: "Bad Request" });
  }
});

router.post("/feed", async (req, res) => {
    let user_mentions = [];
    let post_body_parts = req.body.body.split(' ');
    post_body_parts.forEach((part) => {
        if (part.startsWith('@')) {
            part = part.split('');
            part.shift();
            user_mentions.push(part.join('').trim());
        }
    });

    const user = await User.findById(req.body.userId);
    groupUsers = [];
    groups = user.group_id

    // Create new feed with type 'tweet'
    let feed = {
        user_id: user.user_id,
        body: urlify(req.body.body),
        created_at: Date.now(),
        liked_by: [],
        like_count: 0,
        retweet_count: 0,
        reply_count: 0,
        quote_count: 0,
        post_type: 'tweet',
        parent_id: null,
        conversation_id: null,
        mentions: [...new Set(user_mentions)],
        visible_to: { users: groupUsers, groups },
        image: user.profile_pic ? user.profile_pic : 'null',

        author: user.username,
        author_image: user.profile_pic,
        receiver: user.username,
        author_id: user._id,
        count: 0,
        love_count: 0,
        com_count: 0,
        love_people: [],
        retweet_edit_body: '',
        retweet_edit_count: 0,
        notification: '',
    };

    const newFeed = new Feeds(feed);
    try {
        // Save to DB
        let feed = await newFeed.save();
        feed.conversation_id = feed._id;
        // Update to feed
        await feed.save();
        res.status(201).send("Created New Feed")
    } catch (err) {
        let error = new Error('Something went wrong');
        res.status(400).send(error)
    }

});

router.post("/retweet", async (req, res) => {
    let user_mentions = [];
    let post_body_parts = req.body.body.split(' ');
    post_body_parts.forEach((part) => {
        if (part.startsWith('@')) {
            part = part.split('');
            part.shift();
            user_mentions.push(part.join('').trim());
        }
    });

    const user = await User.findById(req.body.userId);
    groupUsers = [];
    groups = user.group_id
    var parent_id = req.body.parent_id

    // Create new feed with type 'tweet'
    let feed = {
        user_id: user.user_id,
        body: urlify(req.body.body),
        created_at: Date.now(),
        liked_by: [],
        like_count: 0,
        retweet_count: 0,
        reply_count: 0,
        quote_count: 0,
        post_type: parent_id? 'retweet': 'tweet',
        parent_id: parent_id? parent_id : null,
        conversation_id: null,
        mentions: [...new Set(user_mentions)],
        visible_to: { users: groupUsers, groups },
        image: req.body.image ? req.body.image : 'null',

        author: user.username,
        author_image: user.profile_pic,
        receiver: user.username,
        author_id: user._id,
        count: 0,
        love_count: 0,
        com_count: 0,
        love_people: [],
        retweet_edit_body: '',
        retweet_edit_count: 0,
        notification: '',
    };

    const newFeed = new Feeds(feed);
    var oldFeed = await Feeds.findById(parent_id)
    try {
        // Save to DB
        let feed = await newFeed.save();
        feed.conversation_id = feed._id;

        oldFeed.retweet_count = oldFeed.retweet_count + 1
        // Update to feed
        await feed.save();
        await oldFeed.save();
        res.status(201).send("Created New Feed")
    } catch (err) {
        let error = new Error('Something went wrong');
        res.status(400).send(error)
    }

});
module.exports = router;
