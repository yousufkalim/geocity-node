const express = require("express");
const multer = require("multer");
const router = express.Router();

// ADMIN CONTROLLER //
const {
  UsersList,
  EditUser,
  DeleteUser,
  ProjectsList,
  EditProject,
  DeleteProject,
  CreateCategory,
  EditCategory,
  DeleteCategory,
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

//// GET ALL USERS ROJUTE ////
router.get("/userslist", protect, UsersList);
// EDIT USERS ROJUTE //
router.post("/edit-user", protect, EditUser);
// DELETE USERS ROJUTE //
router.post("/delete-user", protect, DeleteUser);

//// GET ALL PROJECTS ROJUTE ////
router.get("/projectslist", protect, ProjectsList);
// EDIT PROJECTS ROJUTE //
router.post("/edit-project", protect, EditProject);
// DELETE PROJECTS ROJUTE //
router.post("/delete-project", protect, DeleteProject);

//// Create Project Category Route ////
router.post("/create-category", protect, CreateCategory);
// EDIT PROJECTS CATEGORY ROJUTE //
router.post("/edit-category", protect, EditCategory);
// DELETE PROJECTS CATEGORY ROJUTE //
router.post("/delete-category", protect, DeleteCategory);

// Create Skills Route //
router.post("/create-skill", protect, CreateSkill);

// Create Materials Route //
router.post("/create-material", protect, CreateMaterial);

module.exports = router;
