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
module.exports = router;
