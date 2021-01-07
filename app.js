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
const nodemailer = require("nodemailer");
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

//// Error Handler
app.use((error, req, res, next) => {
  console.log("Main Error =>", error);
  const message = error.message;
  const status = error.status || 500;
  res.status(status).json({ message: message, error: error });
});

//// Setting Port for Server ////
const PORT = 3000 || process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server listening to port ${PORT}`);
});

const notifcationService = require("./services/notifications");

io.on("connection", (socket) => {
  console.log("Connected");
  // logInfo.info(
  //   "Connection Established ",
  //   socket.id,
  //   " accepted at ",
  //   new Date().toJSON()
  // );
  exports.socket = { socket, io };
  var useris = socket.handshake.query.userConnectionId;
  socket.join(useris);
  //Leave the room if the user closes the socket
  socket.on("disconnect", () => {
    socket.leave(useris);
  });

  // for dynamic notifications
  var recieverId = socket.handshake.query.recieverId;
  socket.on(`sendNotification`, (data) => {
    // logic to save notifications in our db

    notifcationService
      .addNotifcation({
        user: data.id,
        title: data.title,
        message: data.message,
      })
      .then((message) => {
        console.log(message);
        socket.broadcast.emit(`recieveNotification${data.id}`, {
          title: data.title,
          message: data.message,
        });
      })
      .catch((e) => console.log(e));
  });
});
