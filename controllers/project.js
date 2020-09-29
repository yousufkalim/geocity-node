const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const Project = require("../models/Project");

//// Create project ////
exports.createProject = asyncHandler(async (req, res, next) => {
  const picture = req.file;
  if (picture) {
    var uploaded_Picture = req.file.filename;
  }

  // Validation

  const nestedSchema = Joi.object().keys({
    name: Joi.string().max(20),
    status: Joi.string(),
    tradeName: Joi.string(),
    speciality: Joi.string().max(20),
    material: Joi.array().items(Joi.string()),
    contributing_user: Joi.array().items(Joi.string()),
  });

  let services = Joi.array().items(nestedSchema);

  const schema = Joi.object().keys({
    title: Joi.string().min(5).max(20),
    type: Joi.string(),
    stage: Joi.string(),
    general_photo: Joi.string().max(255),
    general_description: Joi.string().max(3000),
    implementation_steps: services,
    category: Joi.string(),
    project_owner: Joi.string(),
  });

  const results = schema.validate(req.body);
  if (results.error) {
    return res.status(400).send(results.error.details[0].message);
  }

  const {
    title,
    type,
    stage,
    general_photo,
    general_description,
    implementation_steps,
    category,
    project_owner,
  } = req.body;

  // Saving Project in DataBase
  const project = await Project.create({
    title,
    type,
    stage,
    general_photo: uploaded_Picture || "default.png",
    general_description,
    implementation_steps,
    category,
    project_owner: req.user.id,
  });

  // Setting Project Owner Field to TRUE in the DataBase

  const user_id = req.user.id;
  const user = await User.findByIdAndUpdate(user_id, {
    isProjectOwner: true,
  });

  res.status(200).send("Project Created Successfully");
});

//// EDIT PROJECT ////

exports.editProject = asyncHandler(async (req, res, next) => {
  const picture = req.file;
  if (picture) {
    var uploaded_Picture = req.file.filename;
  }

  // Validation

  const nestedSchema = Joi.object().keys({
    name: Joi.string().max(20),
    status: Joi.string(),
    tradeName: Joi.string(),
    speciality: Joi.string().max(20),
    material: Joi.array().items(Joi.string()),
    contributing_user: Joi.array().items(Joi.string()),
  });

  let services = Joi.array().items(nestedSchema);

  const schema = Joi.object().keys({
    title: Joi.string().min(5).max(40),
    type: Joi.string(),
    stage: Joi.string(),
    general_photo: Joi.string().max(255),
    general_description: Joi.string().max(600),
    implementation_steps: services,
    category: Joi.string(),
  });

  const results = schema.validate(req.body);
  if (results.error) {
    return res.status(400).send(results.error.details[0].message);
  }

  // Updating Implementation Steps Array //

  await Project.findByIdAndUpdate(req.query.id, {
    title: req.body.title,
    type: req.body.type,
    stage: req.body.stage,
    general_description: req.body.general_description,
    general_photo: uploaded_Picture || "default.png",
    $push: { implementation_steps: req.body.implementation_steps },
  });
  res.status(200).send("Project Updated Successfully");
});
