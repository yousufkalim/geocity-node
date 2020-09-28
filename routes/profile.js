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

const { editProfile } = require("../controllers/profile");

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
router.post("/editProfile", upload.single("profile_picture"), editProfile);

module.exports = router;
