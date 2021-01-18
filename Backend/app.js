const express = require("express");
const _ = require("lodash");
const bodyParser = require("body-parser");
var cors = require("cors");
const User = require("../model/User");
const validation = require("./../validation");
const uri = "mongodb://localhost:27017/test";
const mongoose = require('mongoose')
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

app.post("/login", function (req, res) {
  console.log("postLogin in controllers/admin");
  const { email, password } = req.body;
  var validationResult = { error: false };
  //   const validationResult = validation.loginValidation(req.body);
  if (validationResult.error) {
    res.status(401).send({ status: "Unauthorized" });
  } else {
    User.findOne({ EmailID: email }).then(
      (model) => {
        if (!model) {
          res.status(403).send({ status: "Forbidden" });
        } else {
          // compare password if equal or not
          let isMatch = bcrypt.compare(password, user.password);
          if (isMatch) {
            res.send(user);
          } else {
            res.status(401).send({ status: "Unauthorized" });
          }
        }
      },
      (error) => {
        res.status(500).send("Internal Server Error");
      }
    );
  }
});

app.get("/server/test", async (req, res) => {
    User.findOne({EmailID : 'aaa@email.com'}).then(model => {
        console.log("WE COME HERE >>> \n\n\n HURRAY \n\n\n")
        res.send(model)
    }, error => {
        console.log("WE COME HERE >>> \n\n\n FUCK \n\n\n")
        res.send(error)
    });
});