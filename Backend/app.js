const express = require("express");
const _ = require("lodash");
const bodyParser = require("body-parser");
var cors = require("cors");
const User = require("../model/User");
const validation = require("./../validation");
const uri = "mongodb://localhost:27017/test";
const mongoose = require("mongoose");
const port = 3000;
const routes = require("./Routes/routes");

mongoose
  .connect("mongodb://localhost:27017/test", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    const app = express();
    app.use(bodyParser.json());
    app.use(cors());

    app.use("/api", routes);
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
  });
