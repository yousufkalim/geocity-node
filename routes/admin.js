const express = require("express");
const multer = require("multer");
const router = express.Router();

// ADMIN CONTROLLER //
const {
  UsersList,
  ProjectsList,
  CreateCategory,
  CreateSkill,
  CreateMaterial,
} = require("../controllers/admin");

// Middleware Functions //
const {
  protect,
  authorize,
  dashboard,
  customer_dashboard,
} = require("../middlewares/auth");

// GET ALL USERS ROJUTE //
router.get("/userslist", protect, UsersList);

// GET ALL PROJECTS ROJUTE //
router.get("/projectslist", protect, ProjectsList);

// Create Project Category Route //
router.post("/create-category", protect, CreateCategory);

// Create Skills Route //
router.post("/create-skill", protect, CreateSkill);

// Create Skills Route //
router.post("/create-material", protect, CreateMaterial);

module.exports = router;
