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

router.get("/server/status", function (req, res) {
    res.status(200).send("Get Server OK");
});

router.get("/notifications", async (req, res) => {
    const userId = req.header("userId");
    const user = await User.findById(userId);
    if (user) {
      try {
        const notifs = await Notifications.find({"outconn_id": user._id, "inconn_id": { $ne: user._id }}, null, {sort: { "timestamp" : "descending" , "seen": "descending" }});
  
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


module.exports = router;