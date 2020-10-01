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
      res.status(200).send({
        users: docs,
      });
  });
});

// GET ALL PROJECTS //
exports.ProjectsList = asyncHandler(async (req, res, next) => {
  await Project.find(function (err, docs) {
    if (err) res.json(err);
    else
      res.status(200).send({
        projects: docs,
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
    res.status(200).send("Category added Successfully");
  }
});

// Create Skill //
exports.CreateSkill = asyncHandler(async (req, res, next) => {
  const { name } = req.body;

  //// Check If Skill exists with this name or not ////

  const result = await Skill.findOne({ tradeName: name });
  if (result) {
    res.status(400).send("Skill name already exists");
  } else {
    // Saving Skill in DataBase
    const skill = await Skill.create({
      tradeName: req.body.name,
    });
    res.status(200).send("Skill added Successfully");
  }
});

// Create Skill //
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
    res.status(200).send("Material added Successfully");
  }
});
