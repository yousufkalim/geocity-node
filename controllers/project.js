const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const Project = require("../models/Project");
const Invitation = require("../models/Invitation");

//// Create project ////
exports.createProject = asyncHandler(async (req, res, next) => {
  const picture = req.file;
  if (picture) {
    var uploaded_Picture = req.file.filename;
  }

  //// Validation ////

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

  //// Saving Project in DataBase ////

  const project = await new Project({
    title: req.body.title,
    type: req.body.type,
    stage: req.body.stage,
    general_photo: uploaded_Picture || "default.png",
    general_description: req.body.general_description,
    implementation_steps: req.body.implementation_steps,
    category: req.body.category,
    project_owner: req.user.id,
  });

  project.save(function (err, project) {
    var newProjectId = project._id;
  });
  //// Setting Project Owner Field to TRUE in the DataBase ////

  const user_id = req.user.id;
  const user = await User.findByIdAndUpdate(user_id, {
    isProjectOwner: true,
    $push: { projects: project._id },
  });

  res.status(200).send("Project Created Successfully");
});

//// EDIT PROJECT ////

exports.editProject = asyncHandler(async (req, res, next) => {
  const picture = req.file;
  if (picture) {
    var uploaded_Picture = req.file.filename;
  }

  //// Validation ////

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

  //// Updating Implementation Steps Array ////

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

//// DElETE PROJECT ////

exports.deleteProject = asyncHandler(async (req, res, next) => {
  await Project.findByIdAndUpdate(req.query.id, {
    isDeleted: true,
  });
  res.status(200).send("Profile Deleted Successfully");
});

//// View PROJECT ////

exports.ViewProject = asyncHandler(async (req, res, next) => {
  await Project.findById(req.query.id, function (err, result) {
    if (err) {
      console.log(err);
    }
    res.status(200).send(result);
  });
});

//// View PROJECT ////

exports.LikedBy = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const user_name = user.username;
  await Project.findByIdAndUpdate(req.query.id, {
    $push: { likedBy: req.user.id },
  });
  res.status(200).send(user_name + " Liked the Project");
});

//// Request to view a Project ////

exports.RequestToView = asyncHandler(async (req, res, next) => {
  const sender = req.user.id;
  const project = req.query.id;
  const targeted_project = await Project.findById(project);
  const receiver = targeted_project.project_owner;
  const newInvitation = new Invitation({
    sender: sender,
    receiver: receiver,
    projectID: project,
  });
  newInvitation
    .save()
    .then(
      await Project.findByIdAndUpdate(req.query.id, {
        $push: { invitation: newInvitation._id },
      })
    )
    .then(
      await User.findByIdAndUpdate(receiver, {
        $push: { invitation: newInvitation._id },
      })
    );
  res
    .status(200)
    .send("Request to see this project has been submitted successfully");
});

//// Invite users to contribute ////

exports.InviteUser = asyncHandler(async (req, res, next) => {
  const sender = req.user.id;
  const project = req.query.id;
  const receiver = req.body.receiver;
  const skill = req.body.skills;

  const newInvitation = new Invitation({
    sender: sender,
    receiver: receiver,
    projectID: project,
    skillID: skill,
  });
  newInvitation.save().then(
    await User.findByIdAndUpdate(receiver, {
      $push: { invitation: newInvitation._id },
    })
  );
  res.status(200).send(newInvitation);
});
