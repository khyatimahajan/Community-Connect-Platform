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
const { urlify } = require("./../utils");

// Get all users
router.get("/users", async (req, res) => {
  const users = await User.find();
  res.send(users);
});

router.post("/login", async (req, res) => {
  const { error } = validation.loginValidation(req.body);
  if (error) {
    res.status(400).send({ status: "Bad Request" });
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
  let filters = '_id parent_id user_id body created_at like_count retweet_count reply_count quote_count post_type image liked_by';
  if (userId != null) {
    const user = await User.findById(userId);
    if (user) {
      let group = user.group_id;
      let allUsers = await User.find({}, 'user_id username profile_pic');
      var entireFeeds = await Feeds.find({
        "visible_to.groups": { $in: group },
        "post_type": { $ne: "reply" },
      }, filters).populate("parent_id", filters);

      var response = [];
      entireFeeds.forEach(f => {
        response.push({
          "tweet" : f, "author_profile_pic": null, "author_name": null, "is_liked": false,
        })
      })

      // need to update in future release, should convert user_id to actual _id in mdb
      var feed;
      for (feed of response) {
        for (tempuser of allUsers) {
          if (feed.tweet.user_id === tempuser.user_id) {
            feed["author_profile_pic"] = tempuser.profile_pic;
            feed["author_name"] = tempuser.username;
            if (feed.tweet.liked_by.includes(user.user_id)) {
              feed["is_liked"] = true;
            }
          }
        }
      }

      // var parent;
      // var this_feed_id;
      // let feedMap = {}              // maps _ids to parent_ids for all posts
      // let nextLevelIDs = [];        // saves all _ids of posts which have parents
      // let feedChains = {};
      // for (feed of entireFeeds) {
      //   feedMap[feed._id] = feed.parent_id;
      // }
      // for (feed of entireFeeds) {
      //   nextLevelIDs.push(feed._id);
      //   if (feed.post_type != "reply") {
      //     feedChains[feed._id] = {};
      //   }
      // }

      // for (this_feed_id of nextLevelIDs) {
      //   let chain = [this_feed_id];
      //   this_feed_id_parents_exists = feedMap[this_feed_id];
      //   while (this_feed_id_parents_exists) {
      //     chain.splice(0, 0, this_feed_id_parents_exists);
      //     this_feed_id_parents_exists = feedMap[this_feed_id_parents_exists];
      //   }
      //   feedChains[chain[0]] = chain;
      // }

      // 1. 'feeds' -> find main main feeds - done
      // 2. 'comments' -> find all comments - done
      // 3. for each comment .. iterrate through feeds and find parent
      //      if parent is found remove the comment from the list and attach it to parent
      //      if parent is NOT found then iterate through comments and find parent and attach it
      //      if it is a ROGUE comment .. just let it be allahuakhbar

      // return feeds at the end

      res.send(response);
    }
  } else {
    res.status(400).send({ status: "Bad Request" });
  }
});

router.post("/feed", async (req, res) => {
  let user_mentions = [];
  let post_body_parts = req.body.body.split(" ");
  post_body_parts.forEach((part) => {
    if (part.startsWith("@")) {
      part = part.split("");
      part.shift();
      user_mentions.push(part.join("").trim());
    }
  });

  const user = await User.findById(req.body.userId);
  groupUsers = [];
  groups = user.group_id;

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
    post_type: "tweet",
    parent_id: null,
    conversation_id: null,
    mentions: [...new Set(user_mentions)],
    visible_to: { users: groupUsers, groups },
    image: req.body.image ? req.body.image : null,

    author: user.username,
    author_image: user.profile_pic,
    receiver: user.username,
    author_id: user._id,
    count: 0,
    love_count: 0,
    com_count: 0,
    love_people: [],
    retweet_edit_body: "",
    retweet_edit_count: 0,
    notification: "",
  };

  const newFeed = new Feeds(feed);
  try {
    // Save to DB
    let feed = await newFeed.save();
    feed.conversation_id = feed._id;
    // Update to feed
    await feed.save();
    res.status(201).send("Created New Feed");
  } catch (err) {
    let error = new Error("Something went wrong");
    res.status(400).send(error);
  }
});

router.post("/repost", async (req, res) => {
  let user_mentions = [];
  const body_parts = req.body.body? req.body.body : ""
  let post_body_parts = body_parts.split(" ");
  post_body_parts.forEach((part) => {
    if (part.startsWith("@")) {
      part = part.split("");
      part.shift();
      user_mentions.push(part.join("").trim());
    }
  });

  const user = await User.findById(req.body.userId);
  groupUsers = [];
  groups = user.group_id;
  var parent_id = req.body.parent_id;

  // Create new feed with type 'tweet'
  let feed = {
    user_id: user.user_id,
    body: req.body.body? urlify(req.body.body) : null,
    created_at: Date.now(),
    liked_by: [],
    like_count: 0,
    retweet_count: 0,
    reply_count: 0,
    quote_count: 0,
    post_type: parent_id && req.body.body ? "quote" : parent_id? "retweet" : "tweet",
    parent_id: parent_id ? parent_id : null,
    conversation_id: null,
    mentions: [...new Set(user_mentions)],
    visible_to: { users: groupUsers, groups },
    image: req.body.image ? req.body.image : null,

    author: user.username,
    author_image: user.profile_pic,
    receiver: user.username,
    author_id: user._id,
    count: 0,
    love_count: 0,
    com_count: 0,
    love_people: [],
    retweet_edit_body: "",
    retweet_edit_count: 0,
    notification: "",
  };

  const newFeed = new Feeds(feed);
  var oldFeed = await Feeds.findById(parent_id);
  try {
    // Save to DB
    let feed = await newFeed.save();
    feed.conversation_id = oldFeed.conversation_id;
    if (req.body.body) {
        oldFeed.quote_count = oldFeed.quote_count + 1;
    } else {
        oldFeed.retweet_count = oldFeed.retweet_count + 1;
    }
    // Update to feed
    await feed.save();
    await oldFeed.save();
    res.status(201).send("Created New Retweet");
  } catch (err) {
    let error = new Error("Something went wrong");
    res.status(400).send(error);
  }
});

router.put("/like", async (req, res) => {
  const user = await User.findById(req.body.userId);
  const feed = await Feeds.findById(req.body.feedId);

  var username = user.username;
  var liked_by = feed.liked_by;
  try {
    if (liked_by.indexOf(username) >= 0) {
      feed.like_count = feed.like_count - 1;
      var index = liked_by.indexOf(username);
      feed.liked_by.splice(index, 1);
    } else {
      feed.like_count = feed.like_count + 1;
      feed.liked_by.push(username);
    }

    await feed.save();
    res.status(200).send("Liked Feed");
  } catch (err) {
    let error = new Error("Something went wrong");
    res.status(400).send(error);
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

  const user = await User.findById(req.body.userId);
  groupUsers = [];
  groups = user.group_id;
  var parent_id = req.body.parent_id;

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
    post_type: parent_id ? "reply" : "tweet",
    parent_id: parent_id ? parent_id : null,
    conversation_id: null,
    mentions: [...new Set(user_mentions)],
    visible_to: { users: groupUsers, groups },
    image: req.body.image ? req.body.image : null,

    author: user.username,
    author_image: user.profile_pic,
    receiver: user.username,
    author_id: user._id,
    count: 0,
    love_count: 0,
    com_count: 0,
    love_people: [],
    retweet_edit_body: "",
    retweet_edit_count: 0,
    notification: "",
  };

  const newFeed = new Feeds(feed);
  var oldFeed = await Feeds.findById(parent_id);
  try {
    // Save to DB
    let feed = await newFeed.save();
    feed.conversation_id = oldFeed.conversation_id;
    oldFeed.comments.push(feed._id);
    oldFeed.reply_count = oldFeed.reply_count + 1;
    // Update to feed
    await feed.save();
    await oldFeed.save();
    res.status(201).send("Created New Comment");
  } catch (err) {
    let error = new Error("Something went wrong");
    res.status(400).send(error);
  }
});

router.get("/connections", async (req, res) => {
  const userId = req.header("userId");
  if (userId != null) {
    const user = await User.findById(userId);
    let filters = '_id username profile_pic';
    if (user) {
      let group = user.group_id;

      const users = await User.find({
        group_id: { $in: group },
      }, filters);

      res.send(users);
    }
  } else {
    res.status(400).send({ status: "Bad Request" });
  }
});

router.put("/change-password", async (req, res) => {
  const userId = req.header("userId");
  const { currentPassword, newPassword, cnewPassword } = req.body;
  const validationResult = validation.resetPassword(req.body);

  if (validationResult.error) {
    res.status(400).send({ status: "Bad Request" });
  } else {
    try {
      const user = await User.findById(userId);
      // check if current password entered is correct
      let isMatch = await bcrypt.compare(currentPassword, user.password);
      if (isMatch) {
        let salt = await bcrypt.genSalt(10);
        // generate new hashed password
        const hashPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashPassword;
        // save changes to db
        await user.save();
        res.status(200).send({ status: "Password Changed Successfully" });
      } else {
        res.status(400).send({ status: "Old Password is Wrong" });
      }
    } catch (err) {
      console.log(err);
      res.status(500).send({ status: "Internal Error" });
    }
  }
});

router.get("/user/:username", async (req, res) => {
    let username = req.params.username;
    if (username != null) {
      const user = await User.findOne({
          "username" : username
      });
      if (user) {
        let group = user.group_id;
        let entireFeeds = await Feeds.find({
          "visible_to.groups": { $in: group },
        }).populate("parent_id").populate("comments");
  
        res.send(entireFeeds);
      } else {
        res.status(404).send({ status: "User Not Found" })
      }
    } else {
      res.status(400).send({ status: "Bad Request" });
    }
  });

router.get("/feeds/:feed_id", async (req, res) => {
  let feed_id = req.params.feed_id;
  const user = await User.findById(req.header("userId"));

  if (feed_id != null) {
    if (user) {
      let group = user.group_id;
      let allUsers = await User.find({}, 'user_id username profile_pic');
      let filters = '_id parent_id user_id body created_at like_count retweet_count reply_count quote_count post_type image';
      var entireFeeds = await Feeds.findOne({
        "_id": feed_id,
        "visible_to.groups": { $in: group }
      }, filters).populate("parent_id", filters);

      var entireCommentsForFeed = await Feeds.find({
        "parent_id": feed_id,
        "visible_to.groups": { $in: group }
      }, filters);

      var response = [];
      
      response.push({
          "feed" : entireFeeds, "profile_pic": null, "username": null
      });
      
      entireCommentsForFeed.forEach(f => {
        response.push({
          "children" : f, "profile_pic": null, "username": null
        })
      })

      // need to update in future release, should convert user_id to actual _id in mdb
      var feed;
      for (feed of response) {
        for (tempuser of allUsers) {
          if (feed.feed && feed.feed.user_id === tempuser.user_id) {
            feed.profile_pic = tempuser.profile_pic;
            feed.username = tempuser.username;
          }
          if (feed.children && feed.children.user_id === tempuser.user_id) {
            feed.profile_pic = tempuser.profile_pic;
            feed.username = tempuser.username;
          }
        }
      }

      res.send(response);
    }
  } else {
    res.status(400).send({ status: "Bad Request" });
  }
});

module.exports = router;
