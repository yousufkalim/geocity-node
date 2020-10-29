const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const Project = require("../models/Project");


//// View PROFILE ////

exports.viewProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.query.id, function (err, result) {
    if (err) {
      console.log(err);
    }
    res.status(200).json({user : result});
  });
});

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
    material: Joi.array().max(50).items(Joi.string()),
  });

  const user = await User.findByIdAndUpdate(req.query.id, {
    username: req.body.username,
    city: Joi.string(),
    address: Joi.string(),
    zipCode: Joi.string(),
    latitude: Joi.string(),
    longitude: Joi.string(),
    profile_description: req.body.profile_description,
    profile_picture: uploaded_Picture || "default.png",
    skills: req.body.skills,
    $push: { material: req.body.material },
  });
  res.status(200).json({user : user})
});

// Delete profile
exports.deleteProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.query.id, {
    isDeleted: true,
  });
  res.status(200).json({user : user})
});

//// Comments ////

exports.comment = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const user_name = user.username;
  const comment = req.body.comment;
  const newComment = {
    user : user,
    comment : comment
  }
  await User.findByIdAndUpdate(req.query.id, {
    $push: {comments : newComment}
  });
  res.status(200).json({user : user_name , comment : comment})
});

// Get List of projects where User is Project Owner //
exports.ownedProjects = asyncHandler(async (req, res, next) => {
  let owned_projects = [];
  let contributing_projects = [];
  const userId = req.user.id;
  const user = await User.findById(userId);
  if(user.isProjectOwner == true){
    await Promise.all(user.projects.map(async function(val){
      const project = await Project.findById(val);
      
      if(project.project_owner == userId){
        owned_projects.push(val)
      }else{
        contributing_projects.push(val)
      }
    }))
  }else{
    contributing_projects.push(user.projects)
  }

  res.status(200).json({ownedProjects : owned_projects, contributingProjects : contributing_projects})
})
