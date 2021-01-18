const express = require("express");
const _ = require("lodash");
const bodyParser = require("body-parser");
var cors = require("cors");
const { MongoClient } = require("mongodb");
const mongoose = require('mongoose');
const User = require("../model/User");

const URI = "mongodb://localhost:27017";

// await client.connect();

var app = express();
app.use(bodyParser.json());
app.use(cors());
const port = 3000;

app.get("/server/status", (req, res) => {
  res.status(200).send("Server OK");
});

app.get("/server/test/db", async (req, res) => {

});

async function listDatabases(client) {
  databasesList = await client.db().admin().listDatabases();

  console.log("Databases:");
  databasesList.databases.forEach((db) => console.log(` - ${db.name}`));
}

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
  mongoose
  .connect(URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
  })
  .then(async () => {
      console.log('Connected to DB');
      /* New admin creation */
      let isAdminExist = await User.findOne({ isAdmin: true });
      if (!isAdminExist) {
          const hashPassword = await bcrypt.hash('bla123456', saltRounds);
          new User({
              EmailID: 'admin@gmail.com',
              password: hashPassword,
              isAdmin: true,
              name: 'admin',
              user_id: 'admin',
              group_id: ["Admin"],
              username: 'admin',
              bio: 'Hello admin',
          })
              .save()
              .then(() => {
                  console.log('Admin Created');
              })
              .catch((err) => console.log(err));
      } else {
          console.log('Admin found: ', isAdminExist);
      }
  })
  .catch((err) => {
      console.log(err);
  });
});
