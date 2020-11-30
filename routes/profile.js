const express = require("express");
const multer = require("multer");
const router = express.Router();

// MULTER Configuaration //
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "views/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// Controller Functions //

const {
  editProfile,
  deleteProfile,
  comment,
  viewProfile,
  recommendUserSkill,
  ownedProjects,
  Interests,
} = require("../controllers/profile");

// middleware functions //

const {
  protect,
  authorize,
  dashboard,
  customer_dashboard,
} = require("../middlewares/auth");

// Models //
const User = require("../models/User");

// User Profile Routes //

// Edit Profile //
router.post("/editProfile", upload.single("profile_picture"), editProfile);

// DELETE PROFILE //
router.post("/delete-profile", protect, deleteProfile);

// View Profile //
router.get("/view-profile", protect, viewProfile);

//// Comments Route ////
router.post("/view-profile/comment", protect, comment);

// Projects list of User //
router.get("/myProjects", protect, ownedProjects);

// Projects list of User //
router.post("/Project-Interest", protect, Interests);

// Recommend User skill //

module.exports = router;
