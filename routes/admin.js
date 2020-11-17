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
  getAllCategories,
  CreateCategory,
  EditCategory,
  DeleteCategory,
  getAllSkills,
  CreateSkill,
  EditSkill,
  DeleteSkill,
  getAllMaterials,
  CreateMaterial,
  EditMaterial,
  DeleteMaterial,
} = require("../controllers/admin");

// Middleware Functions //
const {
  protect,
  authorize,
  dashboard,
  customer_dashboard,
} = require("../middlewares/auth");

//// GET ALL USERS ////
router.get("/userslist", protect, UsersList);
// EDIT USERS //
router.post("/edit-user", protect, EditUser);
// DELETE USERS //
router.post("/delete-user", protect, DeleteUser);

//// GET ALL PROJECTS ////
router.get("/projectslist", protect, ProjectsList);
// EDIT PROJECTS //
router.post("/edit-project", protect, EditProject);
// DELETE PROJECTS //
router.post("/delete-project", protect, DeleteProject);

//// GET ALL PROJECTS ////
router.get("/categoryList", protect, getAllCategories);
//// Create Project Category ////
router.post("/create-category", protect, CreateCategory);
// EDIT PROJECTS CATEGORY //
router.post("/edit-category", protect, EditCategory);
// DELETE PROJECTS CATEGORY //
router.post("/delete-category", protect, DeleteCategory);

//// GET ALL Skills ////
router.get("/skillList", protect, getAllSkills);
// Create Skills Route //
router.post("/create-skill", protect, CreateSkill);
// EDIT PROJECTS CATEGORY //
router.post("/edit-skill", protect, EditSkill);
// DELETE PROJECTS CATEGORY //
router.post("/delete-skill", protect, DeleteSkill);

//// GET ALL Materials ////
router.get("/materialList", protect, getAllMaterials);
// Create Materials Route //
router.post("/create-material", protect, CreateMaterial);
// EDIT PROJECTS CATEGORY //
router.post("/edit-material", protect, EditMaterial);
// DELETE PROJECTS CATEGORY //
router.post("/delete-material", protect, DeleteMaterial);

module.exports = router;
