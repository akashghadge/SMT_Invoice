"use strict";
// initial set up of server
const express = require("express");
const app = express();
const port = process.env.PORT || 8080;

// must needed packages
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");

// middlewares
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// getting db connection
require("./DB/conn");
const verify = require("./verify");

// api routers
const User = require("./routes/User.route");
const Code = require("./routes/Code.route");

// routes setting
app.use("/api/user", User);
app.use("/api/code", verify, Code);

// for production use
app.use(express.static("client"));
const path = require("path");

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "admin-dashboard.html"));
});

app.listen(port, () => {
  console.log("Server is listening on port ", port);
});
