const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const dotenv = require("dotenv").config();
const passport = require("passport");
const MongoStore = require("connect-mongo")(session);
const cookieParser = require("cookie-parser");
const socketio = require("socket.io");
const http = require("http");
const bcrypt = require("bcryptjs");
const async = require("async");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
var cors = require("cors");
const app = express();
const server = http.createServer(app);
require("./jobs/agenda");

//// Body Parser Middleware ////

app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

//// Cookie Parser ////

app.use(cookieParser());

//// PUBLIC Folrders Configuartion ////

app.use("/assets", express.static("assets"));
app.use("/views", express.static("views"));

// socket io connection
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

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
  .connect(
    "mongodb://REDACTED:REDACTED@cluster0.es81r.mongodb.net/geocity",
    {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
    }
  )
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

//// Error Handler
app.use((error, req, res, next) => {
  // console.log("Main Error =>", error);
  const message = error.message;
  const status = error.status || 500;
  res.status(status).json({ message: message, error: error });
});

//// Setting Port for Server ////
const PORT = 1190;
server.listen(PORT, () => {
  console.log(`Server listening to port ${PORT}`);
});

const notificationService = require("./services/notifications");
// console.log(io,"io on connnection")
io.on("connection", (socket) => {
  console.log("Connected");
  // logInfo.info(
  //   "Connection Established ",
  //   socket.id,
  //   " accepted at ",
  //   new Date().toJSON()
  // );
  var useris = socket.handshake.query.userConnectionId;
  socket.join(useris);
  exports.socket = socket;
  exports.io = io;

  //Leave the room if the user closes the socket
  socket.on("disconnect", () => {
    console.log("discconented");
    socket.leave(useris);
  });
  // for dynamic notifications
  var recieverId = socket.handshake.query.recieverId;
  socket.on(`sendNotification`, (data) => {
    // logic to save notifications in our db
    notificationService
      .addNotifcation({
        id: data.id,
        projectID: data.projectID,
        title: data.title,
        description: data.description,
      })
      .then((message) => {
        // console.log(message);
        socket.broadcast.emit(`recieveNotification${data.id}`, {
          title: data.title,
          description: data.description,
        });
      })
      .catch((e) => console.log(e));
  });
});
