const express = require("express");
const User = require("./../model/User");
const Feeds = require('./../model/Feeds');
const Comments = require('./../model/Comments');
const Notifications = require('./../model/Notifications');
const Group = require('./../model/Group');
const Logger = require('./../model/Logger');
const router = express.Router();
const validation = require("./../validation");
const bcrypt = require('bcryptjs');


// Get all users
router.get("/users", async (req, res) => {
  const users = await User.find();
  res.send(users);
});

router.get("/login", async (req, res) => {
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

        currentUserData = {
            username: user.username,
            name: user.name,
            bio: user.bio,
            location: user.location,
            connection: user.connection,
            image_src: user.profile_pic,
            user_id: user.user_id,
        };

        res.send(currentUserData)
      }
    }
  }
});

module.exports = router;
