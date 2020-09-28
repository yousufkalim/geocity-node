const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const Project = require("../models/Project");

// Create project
exports.createProject = asyncHandler(async (req, res, next) => {
  const picture = req.file;
  if (picture) {
    var uploaded_Picture = req.file.filename;
  }

  // Validation

  const nestedSchema = Joi.object().keys({
    name: Joi.string().max(20),
    status: Joi.string(),
    tradename: Joi.string().max(20),
    speciality: Joi.string().max(20),
    contributing_user: Joi.array().items(Joi.string()),
  });

  let services = Joi.array().items(nestedSchema);

  const schema = Joi.object().keys({
    name: Joi.string().min(5).max(20),
    type: Joi.string(),
    general_photo: Joi.string().max(255),
    general_description: Joi.string().max(600),
    implementation_steps: services,
    category: Joi.string(),
    project_owner: Joi.string(),
  });

  const results = schema.validate(req.body);
  if (results.error) {
    return res.status(400).send(results.error.details[0].message);
  }

  const {
    name,
    type,
    general_photo,
    general_description,
    implementation_steps,
    category,
    project_owner,
  } = req.body;

  // Saving Project in DataBase
  const user = await Project.create({
    name,
    type,
    general_photo: uploaded_Picture || "default.png",
    general_description,
    implementation_steps,
    category,
    project_owner,
  });
  res.status(200).send("Project Created Successfully");
});
