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

const fileFilter = (req,file,cb) =>{
  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png' ){
    cb(null,true)
  }else{
    cb(null,false)
  }
  
}

const upload = multer({ storage: storage, fileFilter : fileFilter });

//// Controller Functions ////

const {
  createProject,
  editProject,
  projectProgress,
  deleteProject,
  takeDecision,
  ViewProject,
  LikedBy,
  totalLikes,
  comment,
  RequestToView,
  InviteUser,
  deleteContributor,
  SearchByCity,
  SearchBySkill,
  SearchByCategory,
  SearchCollaboratorsBySkill,
  SearchCollaboratorsByMaterial,
  SearchCollaboratorsByCategory
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
  upload.single("general_photo"),
  createProject
);

//// EDIT Project ////

router.post(
  "/editProject",
  protect,
  upload.single("general_photo"),
  editProject
);

//// Calculate Progress Project ////
router.post("/project-progress", protect, projectProgress);

//// DELETE Project ////
router.post("/delete-project", protect, deleteProject);

//// Collaborators Decisions to Delete Project ////
router.post("/take-decision", protect, takeDecision);

//// View Single Project  ////
router.get("/view-project", protect, ViewProject);

//// LikedBy Route ////
router.post("/view-project/likedBy", protect, LikedBy);

//// Total number of Likes Route ////
router.get("/totalLikes", protect, totalLikes);

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

//// Search Collaborators with Skill Name ////
router.get("/SearchCollaboratorsBySkill", protect, SearchCollaboratorsBySkill);

//// Search Collaborators with Material Name ////
router.get("/SearchCollaboratorsByMaterial", protect, SearchCollaboratorsByMaterial);

//// Search Collaborators with Category Name ////
router.get("/SearchCollaboratorsByCategory", protect, SearchCollaboratorsByCategory);

module.exports = router;
