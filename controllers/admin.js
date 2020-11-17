const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const Project = require("../models/Project");
const Category = require("../models/Category");
const Skill = require("../models/Skill");
const Material = require("../models/Material");

// GET ALL USERS //
exports.UsersList = asyncHandler(async (req, res, next) => {
  await User.find({ role: "user" }, function (err, docs) {
    if (err) res.json(err);
    else
      res.status(200).json({
        users: docs,
      });
  });
});

// EDIT USERS //
exports.EditUser = asyncHandler(async (req, res, next) => {
  const picture = req.file;
  if (picture) {
    var uploaded_Picture = req.file.filename;
  }

  const nestedSchema = Joi.object().keys({
    skillField: Joi.string().max(20),
    specialization: Joi.string().max(20),
    score: Joi.number().max(20),
  });
  let services = Joi.array().max(3).items(nestedSchema);

  const schema = Joi.object().keys({
    username: Joi.string().min(5).max(20),
    city: Joi.string().max(20),
    profile_picture: Joi.string().max(255),
    profile_description: Joi.string().max(600),
    skills: services,
    material: Joi.array().items(Joi.string()),
  });

  const user = await User.findByIdAndUpdate(req.query.id, {
    username: req.body.username,
    city: req.body.city,
    profile_description: req.body.profile_description,
    profile_picture: uploaded_Picture || "default.png",
    skills: req.body.skills,
    $push: { material: req.body.material },
  });
  res.status(200).json({user : user})
});

// DELETE USERS //
exports.DeleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.query.id, {
    isDeleted: true,
  });
  res.status(200).send("Profile Deleted Successfully");
});

// GET ALL PROJECTS //
exports.ProjectsList = asyncHandler(async (req, res, next) => {
  await Project.find({isDeleted : false},function (err, docs) {
    if (err) res.json(err);
    else
      res.status(200).json({
        projects: docs,
      });
  });
});

// EDIT PROJECTS //
exports.EditProject = asyncHandler(async (req, res, next) => {
  const picture = req.file;
  if (picture) {
    var uploaded_Picture = req.file.filename;
  }

  //// Validation ////

  const nestedSchema = Joi.object().keys({
    name: Joi.string().max(20),
    status: Joi.string(),
    skillField: Joi.string(),
    speciality: Joi.string().max(20),
    material: Joi.array().items(Joi.string()),
    contributing_user: Joi.array().items(Joi.string()),
  });

  let services = Joi.array().items(nestedSchema);

  const schema = Joi.object().keys({
    title: Joi.string().min(5).max(40),
    type: Joi.string(),
    progress: Joi.string(),
    general_photo: Joi.string().max(255),
    general_description: Joi.string().max(600),
    implementation_steps: services,
    category: Joi.string(),
  });

  const results = schema.validate(req.body);
  if (results.error) {
    return res.status(400).send(results.error.details[0].message);
  }

  //// Updating Implementation Steps Array ////

  const project = await Project.findByIdAndUpdate(req.query.id, {
    title: req.body.title,
    type: req.body.type,
    progress: req.body.progress,
    general_description: req.body.general_description,
    general_photo: uploaded_Picture || "default.png",
    $push: { implementation_steps: req.body.implementation_steps },
  });
  res.status(200).json({project : project})
});

// DELETE PROJECTS //
exports.DeleteProject = asyncHandler(async (req, res, next) => {
  await Project.findByIdAndUpdate(req.query.id, {
    isDeleted: true,
  });
  res.status(200).send("Project Deleted Successfully");
});

// Get All Categories //
exports.getAllCategories = asyncHandler(async (req, res, next) => {
  await Category.find(function (err, docs) {
    if (err) res.json(err);
    else
      res.status(200).json({
        categories: docs,
      });
  });
});

// Create Project Category//
exports.CreateCategory = asyncHandler(async (req, res, next) => {
  const { name, color } = req.body;

  //// Check If Category exists with this name or not ////

  const result = await Category.findOne({ name: name });
  if (result) {
    res.status(400).send("Category name already exists");
  } else {
    // Saving Category in DataBase
    const category = await Category.create({
      name,
      color,
    });
    res.status(200).json({category : category})
  }
});

// Edit Project Category //
exports.EditCategory = asyncHandler(async (req, res, next) => {
  const { name, color } = req.body;

  //// Check If Category exists with this name or not ////

  const result = await Category.findOne({ name: name });
  if (result) {
    res.status(400).send("Category name already exists");
  } else {
    const category = await Category.findByIdAndUpdate(req.query.id, {
      name: req.body.name,
      color: req.body.color,
    });
    res.status(200).json({category : category})
  }
});

// Delete Project Category //
exports.DeleteCategory = asyncHandler(async (req, res, next) => {
  await Category.findByIdAndUpdate(req.query.id, {
    isDeleted: true,
  });
  res.status(200).send("Category Deleted Successfully");
});

// Get All Skills //
exports.getAllSkills = asyncHandler(async (req, res, next) => {
  await Skill.find({isDeleted : false},function (err, docs) {
    if (err) res.json(err);
    else
      res.status(200).json({
        skills: docs,
      });
  });
});

// Create Skill //
exports.CreateSkill = asyncHandler(async (req, res, next) => {
  const { name } = req.body;

  //// Check If Skill exists with this name or not ////

  const result = await Skill.findOne({ skillField: name });
  if (result) {
    res.status(400).send("Skill name already exists");
  } else {
    // Saving Skill in DataBase
    const skill = await Skill.create({
      skillField: req.body.name,
    });
    res.status(200).json({skill : skill});
  }
});

// Edit Skill //
exports.EditSkill = asyncHandler(async (req, res, next) => {
  const { name } = req.body;

  //// Check If Category exists with this name or not ////

  const result = await Skill.findOne({ skillField: name });
  if (result) {
    res.status(400).send("Skill name already exists");
  } else {
   const skill = await Skill.findByIdAndUpdate(req.query.id, {
      skillField: req.body.name,
    });
    res.status(200).json({skill : skill})
  }
});

// Delete Skill //
exports.DeleteSkill = asyncHandler(async (req, res, next) => {
  await Skill.findByIdAndUpdate(req.query.id, {
    isDeleted: true,
  });
  res.status(200).send("Skill Deleted Successfully");
});

// Create Material //
exports.CreateMaterial = asyncHandler(async (req, res, next) => {
  const { name } = req.body;

  //// Check If Material exists with this name or not ////

  const result = await Material.findOne({ name: name });
  if (result) {
    res.status(400).send("Material name already exists");
  } else {
    // Saving Material in DataBase
    const material = await Material.create({
      name: req.body.name,
    });
    res.status(200).json({material : material})
  }
});

// Get All Materials //
exports.getAllMaterials = asyncHandler(async (req, res, next) => {
  await Material.find({isDeleted : false},function (err, docs) {
    if (err) res.json(err);
    else
      res.status(200).json({
        materials: docs,
      });
  });
});

// Edit Material //
exports.EditMaterial = asyncHandler(async (req, res, next) => {
  const { name } = req.body;

  //// Check If Category exists with this name or not ////

  const result = await Material.findOne({ name: name });
  if (result) {
    res.status(400).send("Material name already exists");
  } else {
    const material = await Material.findByIdAndUpdate(req.query.id, {
      name: req.body.name,
    });
    res.status(200).json({material : material})
  }
});

// Delete Skill //
exports.DeleteMaterial = asyncHandler(async (req, res, next) => {
  await Material.findByIdAndUpdate(req.query.id, {
    isDeleted: true,
  });
  res.status(200).send("Material Deleted Successfully");
});
