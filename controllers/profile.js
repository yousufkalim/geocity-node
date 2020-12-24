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
        path: "projects",
        populate: {
          path: "implementation_steps.contributing_user",
          model: "User",
        },
      },
      {
        path: "material",
        select: "name",
      },
      {
        path: "comments.user",
      },
      {
        path: "interests",
      },
      {
        path: "invitation",
        populate: [
          {
            path: "sender",
            model: "User",
          },
          {
            path: "receiver",
            model: "User",
          },
          {
            path: "skillID",
            model: "Skill",
          },
          {
            path: "projectID",
            model: "Project",
          },
        ],
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
  try {
    const skills1 = JSON.parse(req.body.skills);
    const material1 = JSON.parse(req.body.material);

    const body = req.body;
    body.skills = skills1;
    body.material = material1;

    const picture = req.file;
    if (picture) {
      var uploaded_Picture = req.file.filename;
    } else {
      uploaded_Picture = req.body.profile_picture;
    }

    const nestedSchema = Joi.object().keys({
      skillField: Joi.string().required(),
      skill: Joi.string().required(),
      specialization: Joi.string().max(20),
      score: Joi.string()
        .max(5)
        .pattern(/^[0-5]+$/)
        .required(),
    });

    let services = Joi.array().max(3).items(nestedSchema);

    const schema = Joi.object().keys({
      username: Joi.string().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      facebook: Joi.string().uri().allow(""),
      instagram: Joi.string().uri().allow(""),
      youtube: Joi.string().uri().allow(""),
      availability: Joi.string(),
      city: Joi.string().max(20),
      zipCode: Joi.string(),
      latitude: Joi.string(),
      longitude: Joi.string(),
      profile_picture: Joi.string().max(255),
      profile_description: Joi.string().max(600),
      phone: Joi.string()
        .max(10)
        .pattern(/^[0-9]+$/),
      skills: Joi.array().max(3).items(nestedSchema),
      material: Joi.array().max(50).min(1).items(Joi.string()),
    });

    const results = schema.validate(body);
    if (results.error) {
      return res.status(400).send(results.error.details[0].message);
    }

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
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        facebook: req.body.facebook,
        instagram: req.body.instagram,
        youtube: req.body.youtube,
        availability: req.body.availability,
        city: req.body.city,
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
    res
      .status(200)
      .json({ message: "Profile Updated successfully", user: user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete profile
exports.deleteProfile = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.query.id, {
      isDeleted: true,
    });
    res.status(200).json({ user: user });
  } catch (err) {
    next(err);
  }
});

//// Comments ////

exports.comment = asyncHandler(async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
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
          if (project.project_owner == userId) {
            owned_projects.push({ project: project, Likes: totalLikes });
          } else {
            contributing_projects.push({ project, Likes: totalLikes });
          }
        })
      );
      res.status(200).json({
        ownedProjects: owned_projects,
        contributingProjects: contributing_projects,
      });
    } else {
      if (user.projects.length > 0) {
        await Promise.all(
          user.projects.map(async (item) => {
            const project = await Project.findById(item);
            contributing_projects.push({
              project: project,
              likes: project.likedBy.length,
            });
          })
        );
        res.status(200).json({
          ownedProjects: owned_projects,
          contributingProjects: contributing_projects,
        });
      } else {
        return res.status(200).json({ message: "You have no projects yet" });
      }
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Indicating what type of Projects User is interested In //
exports.Interests = asyncHandler(async (req, res, next) => {
  try {
    const userID = req.user.id;
    const interest = req.body.interest;

    const user = await User.findById(userID);
    const interests = user.interests;

    if (interests.length > 0) {
      interests.map(async (val) => {
        if (interest == val) {
          res.status(400).json({
            message: "You have already added this Category to your Interest",
          });
        }
      });
    } else {
      await User.findByIdAndUpdate(userID, {
        $push: { interests: interest },
      });
      res.status(200).json({ message: "Interest added successfully" });
    }
  } catch (err) {
    next(err);
  }
});

// recommend user skills //
exports.recommendUserSkill = asyncHandler(async (req, res, next) => {
  try {
    const loggedInUser = await User.findById(req.user.id);
    const skillField = req.body.skillField;

    const user = await User.findById(req.query.id);
    let skills = user.skills;
    let requestedSkill = skills.find((item) => item.skillField == skillField);
    requestedSkill.recommendedBy.push(req.user.id);

    await User.findByIdAndUpdate(
      req.query.id,
      {
        $set: { skills: skills },
      },
      { new: true }
    );
    res.status(200).json({ recommendedBy: loggedInUser, recommendedTo: user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
