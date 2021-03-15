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
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

aws.config.update({
secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
accessKeyId: process.env.AWS_ACCESS_KEY_ID,
region: process.env.AWS_REGION,
});

var s3 = new aws.S3( { params: {Bucket: process.env.AWS_BUCKET_NAME} } )
//  TODO! check logtimes model

router.post("/login", async (req, res) => {
  const { error } = validation.loginValidation(req.body);
  if (error) {
    res.status(400).send({ status: "Email and/or password empty" });
  } else {
    const { email_id, password } = req.body;
    const user = await User.findOne({
      email_id: email_id,
    });
    if (!user) {
      res.status(403).send({ status: "Could not find user matching entered email" });
    } else {
        if (!user.profile_pic) {
          res.status(401).send({status: "Please create your credentials first"});
        } else {
        const validPass = await bcrypt.compare(req.body.password, user.password);
        if (!validPass) {
          res.status(401).send({ status: "Wrong password entered" });
        } else {
          let notificationCount = await Notifications.find({"outgoing_to": user._id, "seen": false, "incoming_from": { $ne: user._id } }).countDocuments();
          var response = {
            id: user._id,
            user_handle: user.user_handle,
            bio: user.bio,
            notification_count: notificationCount || 0,
            profile_pic: user.profile_pic,
            group_names: user.group_names
          };
          res.status(200).send(response);

          //Logger for user login time
          let log = new Logger({
            user_id: user._id,
            logged_in_at: {
              server_time: new Date(),
              user_time: new Date().toLocaleString("en-US", {
                time_zone: req.body.timezone || "America/New_York",
              }),
            },
          });
          // Save it to DB
          log.save();
        }
      }
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
      log.logged_out_at.server_time = new Date();
      log.logged_out_at.user_time = new Date().toLocaleString("en-US", {
        time_zone: req.body.timezone || "America/New_York",
      });
      log.save();
    } else {
      res.status(400).send({status: "Could not log logout"});
    }
  } else {
    res.status(400).send({ status: "No user ID was received for logging out" });
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
  user_mentions = [...new Set(user_mentions)];

  // add support for notifs based on mentions

  const user = await User.findById(req.body.userId);
  groups = user.group_names;

  // Create new feed with type 'tweet'
  let feed = {
    user_id: user._id,
    body: urlify(req.body.body),
    created_at: Date.now(),
    liked_by: [],
    reposted_by: [],
    like_count: 0,
    repost_count: 0,
    reply_count: 0,
    quote_count: 0,
    post_type: "post",
    parent_id: null,
    conversation_id: null,
    mentions: user_mentions,
    image: req.body.image ? req.body.image : null,
  };

  const newFeed = new Feeds(feed);
  try {
    // Save to DB, set conversation_id based on _id, then resave feed
    let feed = await newFeed.save();
    feed.conversation_id = feed._id;
    // set conversation visibility
    const con_vis = new ConVis({
      conversation_id: feed.conversation_id,
      visible_to: [...new Set(user.group_names)],
      initial_visible_to: [...new Set(user.group_names)]
    });
    let new_con_vis = await con_vis.save();
    feed.conversation_visibility_id = new_con_vis._id;
    await feed.save();
    try {
      // notifications for mentions
      var mention;
      for (mention of user_mentions) {
        let mentioned_user = await User.findOne({user_handle: mention});
        let notif = new Notifications({
        incoming_from: user._id,
        outgoing_to: mentioned_user._id,
        post_id: feed._id, 
        activity_type: "mention",
        timestamp: Date.now(),
        seen: false
        });
        // save to DB
        notif.save();
      }
    } catch (err) {
      console.log("Could not save notification for mentions to DB for", feed._id);
    }
    // send status
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
  user_mentions = [...new Set(user_mentions)];

  // TODO! add notif for user mention

  const user = await User.findById(req.body.userId);
  groups = user.group_names;
  var parent_id = req.body.parent_id;

  // Create new feed
  let feed = {
    user_id: user._id,
    body: req.body.body? urlify(req.body.body) : null,
    created_at: Date.now(),
    liked_by: [],
    reposted_by: [],
    like_count: 0,
    repost_count: 0,
    reply_count: 0,
    quote_count: 0,
    post_type: parent_id && req.body.body ? "quote" : parent_id? "repost" : "error",
    parent_id: parent_id ? parent_id : null,
    conversation_id: null,
    mentions: user_mentions,
    replies: [],
    image: req.body.image ? req.body.image : null,
  };

  if (feed.post_type === "error") {
    res.status(400).send({status: "Invalid post request"});
  } else {
    const newFeed = new Feeds(feed);
    var oldFeed = await Feeds.findById(parent_id);
    try {
      // Save to DB
      // let feed = await newFeed.save();
      newFeed.conversation_id = oldFeed.conversation_id;
      if (req.body.body) {
          oldFeed.quote_count = oldFeed.quote_count + 1;
      } else {
          oldFeed.repost_count = oldFeed.repost_count + 1;
          if (!oldFeed.reposted_by.includes(user._id)) {
            oldFeed.reposted_by.push(user._id);
          }
      }
      const visibility = await ConVis.findOne({conversation_id: oldFeed.conversation_id});
      visibility.visible_to = [...new Set([...user.group_names, ...visibility.visible_to])];
      let new_visibility = await visibility.save();
      newFeed.conversation_visibility_id = new_visibility._id;
      await newFeed.save();
      await oldFeed.save();
      if (newFeed.post_type === "repost") {
        res.status(201).send({status: "Created new repost successfully!"});
      }
      else if (newFeed.post_type === "quote") {
       res.status(201).send({status: "Created new quote successfully!"}); 
      }
    } catch (err) {
      // let error = new Error({"Something went wrong"});
      if (newFeed.post_type === "repost") {
        res.status(400).send({status: "Could not save repost to DB"});
      } else if (newFeed.post_type === "quote") {
        res.status(400).send({status: "Could not save quote to DB"});
      }
    }
    try {
        // create notification for receiver
        let notif = new Notifications({
          incoming_from: user._id,
          outgoing_to: oldFeed.user_id,
          post_id: newFeed._id,
          activity_type: newFeed.post_type,
          timestamp: Date.now(),
          seen: false,
        });
        // save to DB
        notif.save();

        // notifications for mentions
        var mention;
        for (mention of user_mentions) {
          let mentioned_user = await User.findOne({user_handle: mention});
          let notif = new Notifications({
          incoming_from: user._id,
          outgoing_to: mentioned_user._id,
          post_id: newFeed._id, 
          activity_type: "mention",
          timestamp: Date.now(),
          seen: false
          });
          // save to DB
          notif.save();
        };
      } catch(err) {
        if (newFeed.post_type === "repost") {
          console.log("Could not save notification for repost to DB for", oldFeed._id);
        } else if (newFeed.post_type === "quote") {
          console.log("Could not save notification for quote to DB", oldFeed._id);
        }
      }
  }
});

router.post("/create-user", async (req, res) => {
  const { error } = validation.registerValidation(req.body);
  if (error) {
    res.status(400).send({ status: "Did not receive all required user info" });
  } else {
    const { image_src, name, email_id, user_handle, bio, password, password_conf } = req.body;
    const user = await User.findOne({
      email_id: email_id,
      user_handle: user_handle,
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
      user.password = hashPassword;
      user.isAdmin = false;
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

 /* Where image is the name of the property sent from angular via the Form Data and the 1 is the max number of files to upload*/
router.post('/v1/upload/profile', async (req, res) => {
  /* This will be th 8e response sent from the backend to the frontend */

  buf = Buffer.from(req.body.image.replace(/^data:image\/\w+;base64,/, ""),'base64')
  var data = {
    Key: req.body.userId, 
    Body: buf,
    ContentEncoding: 'base64',
    ContentType: 'image/jpeg'
  };
  
  s3.putObject(data, function(err, data){
      if (err) { 
        console.log(err);
        res.status(500).send('Error uploading data: ', data); 
      } else {
        res.send({ image: req.files[0].location });
      }
  });
 });


module.exports = router;