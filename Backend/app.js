const express = require("express");
const _ = require("lodash");
const bodyParser = require("body-parser");
var cors = require("cors");
const { mongoose } = require('./dbconfig/mongoose');
const User = require("../model/User");
const validation = require("./../validation");

var app = express();
app.use(bodyParser.json());
app.use(cors());
const port = 3000;

app.get("/server/status", (req, res) => {
  res.status(200).send("Server OK");
});

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.listen(port, () => {
  console.log(`Server started at Port No: ${port}`);
});

app.post("/login", async function (req, res) {
  console.log("postLogin in controllers/admin");
  const { email, password } = req.body;
  var validationResult = { error : false }
//   const validationResult = validation.loginValidation(req.body);
  if (validationResult.error) {
    res.status(401).send({ status: "Unauthorized" });
  } else {
    let user = await User.findOne({ EmailID: email });
    if (!user) {
      res.status(403).send({ status: "Forbidden" });
    } else {
      // compare password if equal or not
      let isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        res.send(user);
      } else {
        res.status(401).send({ status: "Unauthorized" });
      }
    }
  }
});
