const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const Material = require("../models/Material");

//REGISTER USER API

exports.register = asyncHandler(async (req, res, next) => {
  const picture = req.file;
  if (picture) {
    var uploaded_Picture = req.file.filename;
  }

  // Validation

  const nestedSchema = Joi.object().keys({
    tradename: Joi.string().max(20),
    specialization: Joi.string().max(20),
    score: Joi.number().max(5),
  });

  let services = Joi.array().max(3).items(nestedSchema);

  const schema = Joi.object().keys({
    username: Joi.string().min(5).max(20),
    email: Joi.string().max(40).email(),
    city: Joi.string().max(20),
    password: Joi.string().min(6).max(255),
    availability: Joi.string().min(6).max(255),
    confirm_password: Joi.string().min(6).max(255),
    profile_picture: Joi.string().max(255),
    profile_description: Joi.string().max(600),
    skills: services,
    material: Joi.array().items(Joi.string()),
  });

  const results = schema.validate(req.body);
  if (results.error) {
    return res.status(400).send(results.error.details[0].message);
  }

  const {
    username,
    email,
    city,
    password,
    availability,
    confirm_password,
    profile_picture,
    profile_description,
    skills,
    material,
  } = req.body;
  //// Check If Password and Confirm Password are same or not ////
  if (password !== confirm_password) {
    res.status(403).send("Password and Confirm Password are not same");
  }

  //// Check If user exist with this Email or not ////

  const result = await User.findOne({ email: email });
  if (result) {
    res.status(404).send("User already registered with this Email Address");
  } else {
    // Saving User in DataBase
    const user = await User.create({
      username,
      email,
      city,
      password,
      availability,
      profile_picture: uploaded_Picture || "default.png",
      profile_description,
      skills,
      material,
    });
    res.status(200).json({user : user});
  }
});

//Login User
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const schema = Joi.object().keys({
    email: Joi.string().max(40).required().email(),
    password: Joi.string().min(6).max(255).required(),
  });

  const results = schema.validate(req.body);
  if (results.error) {
    return res.status(400).send(results.error.details[0].message);
  }

  //validating email and password
  if (!email || !password) {
    return res.status(400).send("please provide email and password");
  }

  //check for user
  const user = await User.findOne({ email: email }).select("+password");
  if (!user) {
    return res.status(400).send("You are not registered please signup");
  }

  // Check if password matches

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(400).send("Password is Invalid");
  }

  sendTokenResponse(user, 200, res);
});

//Get token from Model create cookie and send response

const sendTokenResponse = (user, statusCode, res) => {
  //create token

  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }
  if (user) {
    res
      .status(statusCode)
      .cookie("token", token, options)
      .json({token : token});
  } else {
    res.send("Something went wrong");
  }
};

// USER Logout
exports.logout = asyncHandler(async (req, res, next) => {
  req.session.destroy(() => {
    req.logOut();
    res.clearCookie("token");
    res.status(200).send("Logged out successfully");
  });
});
