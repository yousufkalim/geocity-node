const express = require("express");
const multer = require("multer");
const router = express.Router();

//// MULTER Configuaration ////

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "views/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

//// Controller Functions ////

const { createProject, editProject } = require("../controllers/project");

//// middleware functions ////

const {
  protect,
  authorize,
  dashboard,
  customer_dashboard,
} = require("../middlewares/auth");

//// Models ////

const User = require("../models/User");

//// Create Project ////

router.post(
  "/CreateProject",
  protect,
  upload.single("profile_picture"),
  createProject
);

//// EDIT Project ////

router.post(
  "/editProject",
  protect,
  upload.single("profile_picture"),
  editProject
);

module.exports = router;
