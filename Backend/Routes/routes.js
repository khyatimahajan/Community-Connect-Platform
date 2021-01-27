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
const upload = require('./../middleware/file-uploads');

// Get all users
router.get("/users", async (req, res) => {
  const users = await User.find();
  if (users) {
    res.send(users);
  } else {
    res.status(500).send({status: "Internal server error - no users found"});
  }
});

router.post("/login", async (req, res) => {
  const { error } = validation.loginValidation(req.body);
  if (error) {
    res.status(400).send({ status: "Email and/or password empty" });
  } else {
    const { email, password } = req.body;
    const user = await User.findOne({
      EmailID: email,
    });

    if (!user) {
      res.status(403).send({ status: "Could not find user matching entered email" });
    } else {
      const validPass = await bcrypt.compare(req.body.password, user.password);
      if (!validPass) {
        res.status(401).send({ status: "Wrong password entered" });
      } else {
        let notifs = await Notifications.find({"outconn_id": user._id, "seen": false, "inconn_id": { $ne: user._id } });
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
          notifications: notifs.length,
        };
        res.status(200).send(response);

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
    if (!user) {
      res.status(404).send({ status: "No matching user exists" });
    } else {
      let notificationCount = await Notifications.find({
        outconn_id: user._id,
        seen: false,
        inconn_id: { $ne: user._id }
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
      res.status(200).send(response);
    }
  }
});

router.post("/logout", async (req, res) => {
  let userId = req.headers.id;
  if (userId != null) {
    let log = await Logger.findOne({ "user.id": req.user._id }).sort([
      ["loggedInAt", -1],
    ]);

    if (log) {
      res.status(201).send("Logged out");

      log.loggedOutAt.serverTime = new Date();
      log.loggedOutAt.userTime = new Date().toLocaleString("en-US", {
        timeZone: req.body.timezone || "America/New_York",
      });
      log.save();
    } else {
      res.status(400).send({status: "Could not log logout"});
    }
  } else {
    res.status(400).send({ status: "No user ID was received for logging out" });
  }
});

router.get("/feeds", async (req, res) => {
  let userId = req.headers.id;
  let filters = '_id parent_id user_id body created_at like_count retweet_count reply_count quote_count post_type image liked_by conversation_id';
  if (userId != null) {
    const user = await User.findById(userId);
    if (user) {
      let group = user.group_id;
      let allUsers = await User.find({}, 'user_id username profile_pic');
      var entireFeeds = await Feeds.find({
        "visible_to.groups": { $in: group },
        "post_type": { $ne: "reply" },
      }, filters, { sort: { "created_at" : "descending" }}).limit(30).populate("parent_id", filters);

      var response = [];
      entireFeeds.forEach(f => {
        response.push({
          "tweet" : f, "author_profile_pic": null, "author_name": null, "is_liked": false, "is_retweeted": false, "parent_info": null
        });
      })

      // need to update in future release, should convert user_id to actual _id in mdb
      // also figure out how to mark a retweeted post's parent as retweeted in feed
      var feed;
      for (feed of response) {
        for (tempuser of allUsers) {
          if (feed.tweet.user_id === tempuser.user_id) {
            feed["author_profile_pic"] = tempuser.profile_pic;
            feed["author_name"] = tempuser.username;
            if (feed.tweet.liked_by.includes(user.username)) {
              feed["is_liked"] = true;
            }
          }
          if (feed.tweet.parent_id && feed.tweet.parent_id.user_id === tempuser.user_id) {
            feed["parent_info"] = {"parent_profile_pic": tempuser.profile_pic, "parent_name": tempuser.username};
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

      res.status(200).send(response);
    }
  } else {
    res.status(400).send({ status: "No user ID was received for getting feeds" });
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
    res.status(201).send({status: "Created new post successfully!"});
  } catch (err) {
    res.status(400).send({status:"Could not save post to DB"});
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

  // Create new feed
  let feed = {
    user_id: user.user_id,
    body: req.body.body? urlify(req.body.body) : null,
    created_at: Date.now(),
    liked_by: [],
    like_count: 0,
    retweet_count: 0,
    reply_count: 0,
    quote_count: 0,
    post_type: parent_id && req.body.body ? "quote" : parent_id? "retweet" : "error",
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

  if (feed.post_type === "error") {
    res.status(400).send({status: "Invalid post request"});
  } else {
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

      let visibleTo = oldFeed.visible_to;
      var g;
      for (g of groups) {
        if (!visibleTo.groups.includes(g)) {
          visibleTo.groups.push(g);
        }
      }
      oldFeed.visible_to = visibleTo;
      feed.visible_to = visibleTo;

      // Update to feed
      await feed.save();
      await oldFeed.save();
      if (feed.post_type === "retweet") {
        res.status(201).send({status: "Created new repost successfully!"});
      }
      else if (feed.post_type === "quote") {
       res.status(201).send({status: "Created new quote successfully!"}); 
      }
    } catch (err) {
      // let error = new Error({"Something went wrong"});
      if (feed.post_type === "retweet") {
        res.status(400).send({status: "Could not save repost to DB"});
      } else if (feed.post_type === "quote") {
        res.status(400).send({status: "Could not save quote to DB"});
      }
    }
    try {
        // create notification for receiver
        let oldUser = await User.findOne({"user_id": oldFeed.user_id});
        let str_fromuser = user.username;
        let str_action = "";
        if (feed.post_type === "retweet") {
          str_action = "reposted";
        } else if (feed.post_type === "quote") {
          str_action = "quoted";
        }
        let notif = new Notifications({
          inconn_id: user._id,
          outconn_id: oldUser._id,
          post_id: parent_id,
          seen: false,
          activity: feed.post_type,
          status: str_fromuser.concat(" ", str_action, " your post.")
        });
        // save to DB
        notif.save();
      } catch(err) {
        if (feed.post_type === "retweet") {
          console.log("Could not save notification for repost to DB for", oldFeed._id);
        } else if (feed.post_type === "quote") {
          console.log("Could not save notification for quote to DB", oldFeed._id);
        }
      }
  }
});

router.put("/like", async (req, res) => {
  const user = await User.findById(req.body.userId);
  const feed = await Feeds.findById(req.body.feedId);

  let groups = user.group_id;
  let visibleTo = feed.visible_to;
  var g;
  for (g of groups) {
    if (!visibleTo.groups.includes(g)) {
      visibleTo.groups.push(g);
    }
  }
  feed.visible_to = visibleTo;

  var username = user.username;
  var liked_by = feed.liked_by;
  var islikepost = false;
  try {
    if (liked_by.indexOf(username) >= 0) {
      feed.like_count = feed.like_count - 1;
      var index = liked_by.indexOf(username);
      feed.liked_by.splice(index, 1);
    } else {
      feed.like_count = feed.like_count + 1;
      islikepost = true;
      feed.liked_by.push(username);
    }

    await feed.save();
    res.status(200).send({status: "Post liked successfully!"});
  } catch (err) {
    res.status(400).send({ status: "Could not like post" });
  }
  if (islikepost) {
    try {
      // create notification for receiver
      let oldUser = await User.findOne({"user_id": feed.user_id});
      let notifexists = await Notifications.findOne({"inconn_id": user._id, "outconn_id": oldUser._id, "post_id": feed._id, "seen": false});
      if (!notifexists) {
        let str_fromuser = user.username;
        let notif = new Notifications({
          inconn_id: user._id,
          outconn_id: oldUser._id,
          post_id: feed._id,
          seen: false,
          activity: "like",
          status: str_fromuser.concat(" liked your post.")
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

    let visibleTo = oldFeed.visible_to;
    var g;
    for (g of groups) {
      if (!visibleTo.groups.includes(g)) {
        visibleTo.groups.push(g);
      }
    }
    oldFeed.visible_to = visibleTo;
    feed.visible_to = visibleTo;

    // Update to feed
    await feed.save();
    await oldFeed.save();
    res.status(201).send({status: "Created new comment successfully!"});
  } catch (err) {
    res.status(400).send({status: "Could not post comment"});
  }

  try {
    // create notification for receiver
    let oldUser = await User.findOne({"user_id": oldFeed.user_id});
    let str_fromuser = user.username;
    let notif = {
      inconn_id: user._id,
      outconn_id: oldUser._id,
      post_id: oldFeed._id, 
      seen: false,
      activity: "comment",
      status: str_fromuser.concat(" commented on your post.")
    };
    // save to DB
    let notifObj = new Notifications(notif);
    notifObj.save();
  } catch(err) {
    console.log("Could not save notification for comment to DB for", oldFeed._id);
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
    res.status(400).send({ status: "No userid provided to make request" });
  }
});

router.get("/get-notifications", async (req, res) => {
  const userId = req.header("userId");
  const user = await User.findById(userId);
  if (user) {
    try {
      const notifs = await Notifications.find({"outconn_id": user._id, "inconn_id": { $ne: user._id }}, null, {sort: { "timestamp" : "descending" , "seen": "descending" }});

      // let response = {};
      // if (notifs) {
      //   response["number_of_notifs"] = notifs.length;
      //   response["notifications"] = notifs;
      // } else {
      //   response["number_of_notifs"] = 0;
      //   response["notifications"] = [];
      // }
      res.status(200).send(notifs)
    } catch(err) {
      res.status(500).send({status: "Internal server error"})
    }
  } else {
    res.status(404).send({status: "No such user exists"})
  }
});

router.put("/mark-notif-as-read", async(req, res) => {
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

router.get("/user/:username", async (req, res) => {
    let username = req.params.username;

    if (username != null) {
      const user = await User.findOne({
          "username" : username
      }, '_id user_id username name bio EmailID profile_pic');
      if (user) {
        let filters = '_id parent_id user_id body created_at like_count retweet_count reply_count quote_count post_type image liked_by conversation_id';
        let entireFeeds = await Feeds.find({
          "user_id": { $eq: user.user_id },
          "post_type": { $ne: "reply" },
        }, filters, { sort: { "created_at" : "descending" }}).populate("parent_id", filters);

        var modifiedFeeds = [];
        entireFeeds.forEach(f => {
          modifiedFeeds.push({
            "tweet" : f, "author_profile_pic": null, "author_name": null, "is_liked": false, "is_retweeted": false, "parent_info": null
          });
        })

        // need to update in future release, should convert user_id to actual _id in mdb
        // also figure out how to mark a retweeted post's parent as retweeted in feed
        var feed;
        var tempuser;
        let allUsers = await User.find({}, 'user_id username profile_pic');
        for (feed of modifiedFeeds) {
          feed["author_profile_pic"] = user.profile_pic;
          feed["author_name"] = user.username;
          if (feed.tweet.liked_by.includes(user.username)) {
            feed["is_liked"] = true;
          }
          for (tempuser of allUsers) {
            if (feed.tweet.parent_id && feed.tweet.parent_id.user_id === tempuser.user_id) {
              feed["parent_info"] = {"parent_profile_pic": tempuser.profile_pic, "parent_name": tempuser.username};
            }
          }
        }

        var response = {
          'user': user,
          'feeds': modifiedFeeds
        }
        res.send(response);

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
      let group = user.group_id;
      let allUsers = await User.find({}, 'user_id username profile_pic');
      let filters = '_id parent_id user_id body created_at like_count retweet_count reply_count quote_count post_type image liked_by conversation_id';
      var entireFeeds = await Feeds.findOne({
        "_id": feed_id,
        "visible_to.groups": { $in: group }
      }, filters, { sort: { "created_at" : "ascending" }}).populate("parent_id", filters);

      var entireCommentsForFeed = await Feeds.find({
        "parent_id": feed_id,
        // "visible_to.groups": { $in: group }
      }, filters).populate("parent_id", filters);

      var response = [];
      
      response.push({
          "feed" : entireFeeds, "author_profile_pic": null, "author_username": null, "is_liked": false, "is_retweeted": false, "parent_info": null
      });
      
      entireCommentsForFeed.forEach(f => {
        response.push({
          "children" : f, "author_profile_pic": null, "author_username": null, "is_liked": false, "is_retweeted": false, "parent_info": null
        })
      })

      // need to update in future release, should convert user_id to actual _id in mdb
      // also figure out how to mark a retweeted post's parent as retweeted in feed
      var feed;
      for (feed of response) {
        for (tempuser of allUsers) {
          if (feed.feed && feed.feed.user_id === tempuser.user_id) {
            feed["author_profile_pic"] = tempuser.profile_pic;
            feed["author_username"] = tempuser.username;
            if (feed.feed.liked_by.includes(user.username)) {
              feed["is_liked"] = true;
            }
          }
          if (feed.feed && feed.feed.parent_id && feed.feed.parent_id.user_id === tempuser.user_id) {
            feed["parent_info"] = {"parent_profile_pic": tempuser.profile_pic, "parent_name": tempuser.username};
          }
          if (feed.children && feed.children.user_id === tempuser.user_id) {
            feed["author_profile_pic"] = tempuser.profile_pic;
            feed["author_username"] = tempuser.username;
            if (feed.children.liked_by.includes(user.username)) {
              feed["is_liked"] = true;
            }
          }
          if (feed.children && feed.children.parent_id && feed.children.parent_id.user_id === tempuser.user_id) {
            feed["parent_info"] = {"parent_profile_pic": tempuser.profile_pic, "parent_name": tempuser.username};
          }
        }
      }

      res.status(200).send(response);
    }
  } else {
    res.status(400).send({ status: "No feed ID provided" });
  }
});

router.get("/signup", async (req, res) => {
  let filters = 'name username EmailID bio location password profile_pic';
  let user_id = req.header("user_id");
  const user = await User.findOne({user_id}, filters);
  if (!user) {
    res.status(404).send({ status: "Could not find any user matching that userid" });
  } else {
    if (user.password && user.profile_pic) {
      res.status(403).send({ status: "Access code has already been redeemed"});
    } else {
      res.status(200).send(user);
    }
  }
});

router.post("/create-user", async (req, res) => {
  const { error } = validation.registerValidation(req.body);
  if (error) {
    res.status(400).send({ status: "Did not receive all required user info" });
  } else {
    const { image_src, name, email, username, location, bio, password, password_conf, id } = req.body;
    const user = await User.findOne({
      EmailID: email,
      username: username,
    });
    if (!user) {
      res.status(404).send({ status: "User not found" });
    } else {
      let salt = await bcrypt.genSalt(10);
      // generate new hashed password
      const hashPassword = await bcrypt.hash(password, salt);
      user.bio = bio;
      if (image_src != "no-update") {
        user.profile_pic = image_src;
      }
      user.location = location;
      user.password = hashPassword;
      user.isAdmin = false;
      user.username = username ? username : user.username;
      user.save();
      res.status(201).send({status: "New user credentials created!"});
    }
  }
});

/* Where image is the name of the property sent from angular via the Form Data and the 1 is the max number of files to upload*/
router.post('/v1/upload', upload.array('image', 1), (req, res) => {
  /* This will be th 8e response sent from the backend to the frontend */
  res.send({ image: req.files[0].location });
 });

module.exports = router;
