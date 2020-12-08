const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const dotenv = require("dotenv").config();
const passport = require("passport");
const MongoStore = require("connect-mongo")(session);
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
var cors = require("cors");
const app = express();
require("./jobs/agenda");

//// Body Parser Middleware ////

app.use(bodyParser.json());
app.use(cors());
<<<<<<< HEAD

=======
>>>>>>> 0f67acd3ad05bdc1ef56663580c97bda1f0620c3
app.use(bodyParser.urlencoded({ extended: true }));

//// Cookie Parser ////

app.use(cookieParser());

//// PUBLIC Folrders Configuartion ////

app.use("/assets", express.static("assets"));
app.use("/views", express.static("views"));

//// Sessions Middleware ////

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);

//// DataBase Connection ////

mongoose
  .connect("mongodb://localhost:27017/CP", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Database has connected successfully");
  })
  .catch((err) => {
    console.log(err);
  });

//// Routes ////
const auth = require("./routes/auth");
const profile = require("./routes/profile");
const project = require("./routes/project");
const admin = require("./routes/admin");

//// Mount Routers ////

app.use("/api/v1/auth", auth);
app.use("/api/v1/profile", profile);
app.use("/api/v1/project", project);
app.use("/api/v1/admin", admin);

<<<<<<< HEAD
//// Setting Port for Server ////

const PORT = 3000 || process.env.PORT;
=======
//// Error Handler
app.use((error, req, res, next) => {
  console.log("Main Error =>", error);
  const message = error.message;
  const status = error.status || 500;
  res.status(status).json({ message: message, error: error });
});

//// Setting Port for Server ////
const PORT = 5000 || process.env.PORT;
>>>>>>> 0f67acd3ad05bdc1ef56663580c97bda1f0620c3
app.listen(PORT, () => {
  console.log(`Server listening to port ${PORT}`);
});
