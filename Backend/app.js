const express = require("express");
const dotenv = require('dotenv');
dotenv.config();
require('dotenv').config({ path: 'final-env-file.env' });

const _ = require("lodash");
const bodyParser = require("body-parser");
var cors = require("cors");
const uri = "mongodb://localhost:27017/test";
const mongoose = require("mongoose");
const port = 3000;
const routes = require("./Routes/routes");
const getRoutes = require("./Routes/get");

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    const app = express();
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(cors());

    app.use("/api/get", getRoutes);
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
