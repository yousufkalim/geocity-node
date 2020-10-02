const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");

// Edit profile
exports.editProfile = asyncHandler(async (req, res, next) => {
  const picture = req.file;
  if (picture) {
    var uploaded_Picture = req.file.filename;
  }

  const nestedSchema = Joi.object().keys({
    tradename: Joi.string().max(20),
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

  await User.findByIdAndUpdate(req.query.id, {
    username: req.body.username,
    city: req.body.city,
    profile_description: req.body.profile_description,
    profile_picture: uploaded_Picture || "default.png",
    skills: req.body.skills,
    $push: { material: req.body.material },
  });
  res.status(200).send("Profile Updated Successfully");
});

// Delete profile
exports.deleteProfile = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.query.id, {
    isDeleted: true,
  });
  res.status(200).send("Profile Deleted Successfully");
});
