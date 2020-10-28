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

const {
  createProject,
  editProject,
  deleteProject,
  ViewProject,
  LikedBy,
  comment,
  RequestToView,
  InviteUser,
  deleteContributor
} = require("../controllers/project");

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

//// DELETE Project ////
router.post("/delete-project", protect, deleteProject);

//// View Single Project  ////
router.get("/view-project", protect, ViewProject);

//// LikedBy Route ////
router.post("/view-project/likedBy", protect, LikedBy);

//// Comments Route ////
router.post("/view-project/comment", protect, comment);

//// Request to view a Project  ////
router.post("/view-project/send-request", protect, RequestToView);

//// Invite users to contribute  ////
router.post("/view-project/send-invite", protect, InviteUser);

//// Delete users to contribute against a single step ////
router.post("/view-project/delete-contributing-user", protect, deleteContributor);

module.exports = router;
