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
  takeDecision,
  ViewProject,
  LikedBy,
  comment,
  RequestToView,
  InviteUser,
  deleteContributor,
  SearchByCity,
  SearchBySkill,
  SearchByCategory
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

//// DELETE Project ////
router.post("/take-decision", protect, takeDecision);

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

//// Search Project by City Name ////
router.get("/search/city", protect, SearchByCity);

//// Search Project by Skill Name ////
router.get("/search/skill", protect, SearchBySkill);

//// Search Project by Category Name ////
router.get("/search/category", protect, SearchByCategory);

module.exports = router;
