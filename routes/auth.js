const express = require("express");
const multer = require("multer");

// MULTER Configuaration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "views/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

//Controller Functions

const { register, login, logout, SkillList, MaterialList } = require("../controllers/auth");
const router = express.Router();

//middleware functions

const {
  protect,
  authorize,
  dashboard,
  customer_dashboard,
} = require("../middlewares/auth");

//Models
const User = require("../models/User");

//Register USER routes
router.get("/skillList",SkillList);
router.get("/materialList", MaterialList);

router.get("/register", async function (req, res) {});
router.post("/register", upload.single("profile_picture"), register);

//LOGIN Route

router.post("/login", login);

//LOGOUT Route
router.post("/logout", logout);

module.exports = router;
