const express = require("express");
const _ = require("lodash");
const app = express.Router();
// var { auth } = require("./../middleware/auth");

app.get("/server/status", function (req, res) {
  res.status(200).send("User Server OK");
});

module.export = app;
