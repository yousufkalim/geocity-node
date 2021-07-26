const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
const async = require("async");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
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
    // console.log(req.body);
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
      specialization: Joi.string().allow(""),
      score: Joi.string()
        .max(5)
        .pattern(/^[0-5]+$/)
        .required(),
    });

    let services = Joi.array().max(3).items(nestedSchema);

    const schema = Joi.object().keys({
      firstName: Joi.string().max(20),
      lastName: Joi.string().max(20),
      facebook: Joi.string().uri().allow(""),
      instagram: Joi.string().uri().allow(""),
      youtube: Joi.string().uri().allow(""),
      availability: Joi.string(),
      city: Joi.string().max(20),
      zipCode: Joi.string(),
      latitude: Joi.string(),
      longitude: Joi.string(),
      profile_picture: Joi.string().max(255),
      profile_description: Joi.string().min(10).max(600),
      phone: Joi.string()
        .min(10)
        .max(10)
        .pattern(/^[0-9]+$/),
      skills: Joi.array().min(1).max(5).items(nestedSchema),
      material: Joi.array().min(1).max(50).items(Joi.string()),
    });

    const results = schema.validate(body);
    if (results.error) {
      return res
        .status(400)
        .send({ message: results.error.details[0].message });
    } else {
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
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//Forget Password//
exports.requestForgetPassword = asyncHandler(async (req, res, next) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email: email });
    if (!user) {
      res.status(400).json({ message: "NO user found with this email" });
    } else {
      const buf = await crypto.randomBytes(20);
      var token = buf.toString("hex");
      const restPasswordExpires = Date.now() + 36000000;
      var updatedUser = await User.findOneAndUpdate(
        { email: email },
        {
          resetPasswordToken: token,
          restPasswordExpires: restPasswordExpires,
        },
        { new: true }
      );
      var smtpTransport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MailingId,
          pass: process.env.MailingPassword,
        },
      });
      var mailOptions = {
        to: email,
        from: process.env.MailingId,
        subject: "Password Reset",
        text:
          "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
          "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
          "http://" +
          "geocity.io" +
          "/reset/" +
          token +
          "\n\n" +
          "If you did not request this, please ignore this email and your password will remain unchanged.\n",
      };

      const info = await smtpTransport
        .sendMail(mailOptions)
        .then((res) => {
          console.log("mail res", res);
        })
        .catch((err) => console.log("mail er", err));
      res.status(200).json({ message: "Email has been sent successfully" });
    }
  } catch (err) {
    next(err);
  }
});
//Forget Password update//
exports.forgetPassword = asyncHandler(async (req, res, next) => {
  try {
    // console.log(req.body);
    const user = await User.findOne({
      resetPasswordToken: req.query.passwordToken,
      restPasswordExpires: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      res.status(400).json({
        message: "Password reset token is invalid or has expired.",
      });
    }
    if (req.body.password === req.body.confirm) {
      const salt = await bcrypt.genSalt(10);
      const updatedPassword = await bcrypt.hash(req.body.password, salt);

      var updatedUser = await User.findOneAndUpdate(
        {
          resetPasswordToken: req.query.passwordToken,
        },
        {
          password: updatedPassword,
          $unset: { resetPasswordToken: 1, restPasswordExpires: 1 },
        },
        { new: true }
      );
    } else {
      res.status(400).json({ message: "Passwords donot match" });
    }

    var smtpTransport = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.MailingId,
        pass: process.env.MailingPassword,
      },
    });
    var mailOptions = {
      to: user.email,
      from: process.env.MailingId,
      subject: "Your password has been changed",
      text:
        "Hello,\n\n" +
        "This is a confirmation that the password for your account " +
        user.email +
        " has just been changed.\n",
    };
    smtpTransport.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(400).json({ message: error.message });
      }
    });
    res
      .status(200)
      .json({ message: "Password updated successfully", user: updatedUser });
  } catch (err) {
    next(err);
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
  // console.log(req.query.id, req.body.comment);
  try {
    const loggedUser = await User.findById(req.user.id);
    const firstName = loggedUser.firstName;
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
    res.status(200).json({ user: firstName, comment: comment, user: user });
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

// Unrecommend User Skil //
exports.unrecommendUserSkill = asyncHandler(async (req, res, next) => {
  try {
    const loggedInUser = req.user.id;
    const skillId = req.body.skillId;

    const user = await User.findOneAndUpdate(
      {
        _id: req.query.id,
        skills: {
          $elemMatch: {
            _id: skillId,
          },
        },
      },
      {
        $pull: {
          "skills.$.recommendedBy": loggedInUser,
        },
      },
      { new: true }
    );
    res.status(200).json({ message: "Successfully Removed" });
  } catch (err) {
    next(err);
  }
});

//Delete Comment
exports.deleteComment = asyncHandler(async (req, res, next) => {
  try {
    const commentId = req.body.commentId;
    const userId = req.query.id;
    // console.log(userId, commentId);

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { comments: { _id: commentId } },
      },
      { new: true }
    );
    res
      .status(200)
      .json({ message: "Comment Deleted successfully", User: user });
  } catch (err) {
    next(err);
  }
});

// Get all Notifications //
exports.getAllNotifications = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.query.id;
    const user = await User.findById(userId);
    const notifications = user.notifications.filter(
      (not) => not.statusNew == true
    );
    res.status(200).json({ message: "Success!", notifications: notifications });
  } catch (err) {
    next(err);
  }
});
// update user notification
exports.updateNotifications = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.query.id;
    const loggedInUser = req.user;
    // console.log(loggedInUser, "loggedIn");

    const notifications = loggedInUser.notifications;
    const tempNotify = notifications.find((not) => not._id == userId);
    await User.findByIdAndUpdate(
      loggedInUser,
      {
        $set: {
          notifications: {
            statusNew: false,
            title: req.body.title,
            description: req.body.description,
          },
        },
      },
      { new: true }
    );
    res.status(200).json({ message: "Success!", notifications: tempNotify });
  } catch (err) {
    next(err);
  }
});

// add interests by user

exports.AddInterest = asyncHandler(async (req, res, next) => {
  try {
    const interest = req.body.interest;
    const user = await User.findById(req.query.id);

    await User.findByIdAndUpdate(req.query.id, {
      $push: { interests: interest },
    });
    res.status(200).json({ user: user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete Interests

exports.DeleteInterest = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.query.id);
    const interest = req.body.interest;

    await User.findByIdAndUpdate(req.query.id, {
      $pull: { interests: interest },
    });
    res
      .status(200)
      .json({ user: user, message: "Interest deleted Successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
exports.getAllInterest = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.query.id;
    const user = await User.findById(userId);
    const interests = user.interests;
    const interest = await User.find({
      interests: interests,
    }).populate("interests");
    res.status(200).json({ message: "Success!", interests: interest });
  } catch (err) {
    next(err);
  }
});
