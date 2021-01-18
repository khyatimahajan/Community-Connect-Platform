const express = require("express");
const _ = require("lodash");
const bodyParser = require("body-parser");
var cors = require("cors");
const { MongoClient } = require("mongodb");

const uri_fake =
  "mongodb+srv://<username>:<password>@<your-cluster-url>/test?retryWrites=true&w=majority";

const URI = "mongodb://localhost:27017/test";

const client = new MongoClient(URI);
// await client.connect();

var app = express();
app.use(bodyParser.json());
app.use(cors());
const port = 3000;

app.get("/server/status", (req, res) => {
  res.status(200).send("Server OK");
});

app.get("/server/test/db", async (req, res) => {
  try {
    await client.connect();
    await listDatabases(client);
    res.send("Successfull Connected");
  } catch (e) {
    console.error(e);
    res.send("Error!");
  } finally {
    client.close();
  }
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
});
