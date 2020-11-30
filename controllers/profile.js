const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const Project = require("../models/Project");
const Skill = require("../models/Skill");
const Category = require("../models/Category");

//// View PROFILE ////

exports.viewProfile = asyncHandler(async (req, res, next) => {
  try {
    const populateQuery = [
      {
        path: "projects",
        populate: {
          path: "category",
          select: ["name", "color"],
        },
      },
      {
        path: "skills.skillField",
        select: "skillField",
      },
      {
        path: "material",
        select: "name",
      },
      {
        path: "comments.user",
      },
    ];
    const user = await User.findById(req.query.id).populate(populateQuery);
    res.status(200).json({ user: user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Edit profile
exports.editProfile = asyncHandler(async (req, res, next) => {
  const picture = req.file;
  if (picture) {
    var uploaded_Picture = req.file.filename;
  }

  const nestedSchema = Joi.object().keys({
    skillField: Joi.string().max(30),
    specialization: Joi.string().max(20),
    score: Joi.number().max(20),
  });
  let services = Joi.array().max(3).items(nestedSchema);

  const schema = Joi.object().keys({
    username: Joi.string().min(5).max(20),
    city: Joi.string().max(20),
    profile_picture: Joi.string().max(255),
    profile_description: Joi.string().max(600),
    phone: Joi.string()
      .max(10)
      .pattern(/^[0-9]+$/),
    skills: services,
    material: Joi.array().max(50).items(Joi.string()),
  });
  // Check if the skills are in database or not, If Not then saving them in the database//
  const skills = req.body.skills;
  skills.map(async (val) => {
    let result = false;
    var requestedSkill = val.skill;
    var savedSkillField = await Skill.findById(val.skillField);
    savedSkillField.skill.map(async (val1) => {
      if (requestedSkill == val1) {
        result = true;
      }
    });

    if (result == false) {
      await Skill.findByIdAndUpdate(val.skillField, {
        $push: { skill: requestedSkill },
      });
    }
  });

  const user = await User.findByIdAndUpdate(
    req.query.id,
    {
      username: req.body.username,
      city: req.body.city,
      address: req.body.address,
      zipCode: req.body.zipCode,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      profile_description: req.body.profile_description,
      phone: req.body.phone,
      profile_picture: uploaded_Picture || "default.png",
      skills: req.body.skills,
      material: req.body.material,
    },
    { new: true }
  );
  res.status(200).json({ user: user });
});

// Delete profile
exports.deleteProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.query.id, {
    isDeleted: true,
  });
  res.status(200).json({ user: user });
});

//// Comments ////

exports.comment = asyncHandler(async (req, res, next) => {
  const loggedUser = await User.findById(req.user.id);
  const userName = loggedUser.username;
  const comment = req.body.comment;
  const newComment = {
    user: loggedUser.id,
    comment: comment,
  };
  const user = await User.findByIdAndUpdate(
    req.query.id,
    {
      $push: { comments: newComment },
    },
    { new: true }
  );
  res.status(200).json({ user: userName, comment: comment, user: user });
});

// Get List of projects where User is Project Owner //
exports.ownedProjects = asyncHandler(async (req, res, next) => {
  try {
    let owned_projects = [];
    let contributing_projects = [];
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (user.isProjectOwner == true) {
      await Promise.all(
        user.projects.map(async function (val) {
          const project = await Project.findById(val).populate("category");
          const totalLikes = project.likedBy.length;
          console.log(totalLikes);
          if (project.project_owner == userId) {
            owned_projects.push({ project: project, Likes: totalLikes });
          } else {
            contributing_projects.push({ project });
          }
        })
      );
    } else {
      if (user.projects.length > 0) {
        user.projects.map(async (item) => {
          const project = await Project.findById(item);
          contributing_projects.push({ project });
        });
      } else {
        return res.status(200).json({ message: "You have no projects yet" });
      }
    }
    res.status(200).json({
      ownedProjects: owned_projects,
      contributingProjects: contributing_projects,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Indicating what type of Projects User is interested In //
exports.Interests = asyncHandler(async (req, res, next) => {
  const userID = req.user.id;
  const interest = req.body.interest;

  const user = await User.findById(userID);
  const interests = user.interests;
  if (interests == "") {
    await User.findByIdAndUpdate(userID, {
      $push: { interests: interest },
    });
    res.status(200).json({ message: "Interest added successfully" });
    return;
  }
  interests.map(async (val) => {
    if (interest == val) {
      res.status(400).json({
        message: "You have already added this Category to your Interest",
      });
      return;
    } else {
      await User.findByIdAndUpdate(userID, {
        $push: { interests: interest },
      });
      res.status(200).json({ message: "Interest added successfully" });
      return;
    }
  });
});
