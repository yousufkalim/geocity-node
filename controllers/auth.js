const Joi = require("joi");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const Project = require("../models/Project");
const Material = require("../models/Material");
const Skill = require("../models/Skill");
const Category = require("../models/Category");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const async = require("async");

//REGISTER USER API

exports.register = asyncHandler(async (req, res, next) => {
  try {
    const skills1 = JSON.parse(req.body.skills);
    const interests1 = JSON.parse(req.body.interests);

    const material1 = JSON.parse(req.body.material);

    const body = req.body;
    body.skills = skills1;
    body.interests = interests1;

    body.material = material1;

    var uploaded_Picture = "";
    if (req.file) {
      var uploaded_Picture = req.file.filename;
    }

    // Validation
    const nestedSchema = Joi.object().keys({
      skillField: Joi.string().required(),
      skill: Joi.string().required(),
      specialization: Joi.string().allow(""),
      score: Joi.string()
        .max(5)
        .pattern(/^[0-5]+$/)
        .required(),
    });

    const schema = Joi.object().keys({
      username: Joi.string().optional().allow(""),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      facebook: Joi.string().uri().allow(""),
      instagram: Joi.string().uri().allow(""),
      youtube: Joi.string().uri().allow(""),
      email: Joi.string().max(255).email(),
      city: Joi.string(),
      zipCode: Joi.string(),
      latitude: Joi.string(),
      longitude: Joi.string(),
      password: Joi.string().min(6).max(255),
      availability: Joi.string(),
      confirm_password: Joi.string().min(6).max(255),
      profile_picture: Joi.string().max(255).optional().allow(""),
      profile_description: Joi.string().min(10).max(600),
      phone: Joi.string()
        .max(10)
        .pattern(/^[0-9]+$/)
        .required(),
      skills: Joi.array().max(3).items(nestedSchema),
      interests: Joi.array().optional().allow(""),

      material: Joi.array().max(50).min(1).items(Joi.string()),
    });

    const results = schema.validate(body);
    if (results.error) {
      return res
        .status(400)
        .send({ message: results.error.details[0].message });
    }

    const {
      username,
      firstName,
      lastName,
      facebook,
      instagram,
      youtube,
      email,
      city,
      zipCode,
      latitude,
      longitude,
      password,
      availability,
      confirm_password,
      profile_picture,
      profile_description,
      phone,
      skills,
      interests,
      material,
      notifications,
    } = req.body;

    // other material
    
    // Check if the skills are in database or not, If Not then saving them in the database//
    if (skills) {
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
    }

    //// Check If Password and Confirm Password are same or not ////
    if (password !== confirm_password) {
      res
        .status(403)
        .send({ message: "Password and Confirm Password are not same" });
    }

    //// Check If user exist with this Email or not ////

    const result = await User.findOne({ email: email });
    if (result) {
      res
        .status(404)
        .send({ message: "User already registered with this Email Address" });
    } else {
      // Saving User in DataBase
      const user = await User.create({
        username,
        firstName,
        lastName,
        facebook,
        instagram,
        youtube,
        email,
        city,
        zipCode,
        latitude,
        longitude,
        password,
        availability,
        profile_picture: uploaded_Picture || "default.png",
        profile_description,
        phone,
        skills,
        interests,
        material,
        notifications,
      });
      res.status(200).json({ user: user });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Email Verfication for new Registrations //
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  try {
    async.waterfall(
      [
        function (done) {
          crypto.randomBytes(20, function (err, buf) {
            var token = buf.toString("hex");
            done(err, token);
          });
        },
        function (token, done) {
          const email = req.body.email;
          User.findOne(
            {
              email: email,
            },
            function (err, user) {
              if (!user) {
                return res.status(403).send({
                  message: "No account with that email address exists",
                });
              }
              User.findOneAndUpdate(
                { email: email },
                {
                  $set: {
                    verifyEmailToken: token,
                    emailVerificationExpiresIn: Date.now() + 36000000,
                  },
                },
                { new: true },
                function (err) {
                  done(err, token, user);
                }
              );
            }
          );
        },
        function (token, user, done) {
          let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            tls: {
              rejectUnauthorized: false,
            },
            auth: {
              user: process.env.MailingId,
              pass: process.env.MailingPassword,
            },
          });
          var mailOptions = {
            to: user.email,
            from: process.env.MailingId,
            subject: "Verfication Email Request for Geocity",
            text:
              "You are receiving this because you (or someone else) have requested to register your account on WINA.\n\n" +
              "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
              "http://" +
              `${process.env.verifyEmail}` +
              "/verifyEmail/" +
              token +
              "\n\n" +
              "If you did not request this, please ignore this email.\n",
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              return res.status(400).json({ message: error.message });
            }
            res
              .status(200)
              .json({ message: "Verification Email has been sent" });
          });
        },
      ],
      function (err) {
        if (err) return next(err);
        res.status(200).send("Verfication Email has been sent Successfully");
      }
    );
  } catch (error) {
    res.status(400).send({ message: error.message });

    next(error);
  }
});

exports.verifyEmailProcess = asyncHandler(async (req, res, next) => {
  try {
    async.waterfall(
      [
        function (done) {
          User.findOne(
            {
              verifyEmailToken: req.params.token,
              emailVerificationExpiresIn: {
                $gt: Date.now(),
              },
            },
            async function (err, user) {
              if (!user) {
                return res.status(403).json({
                  message: " token is invalid or has expired",
                });
              } else {
                var user = await User.findOneAndUpdate(
                  {
                    verifyEmailToken: req.params.token,
                  },
                  {
                    $set: {
                      status: "active",
                    },
                  }
                );

                let transporter = nodemailer.createTransport({
                  host: "smtp.gmail.com",
                  port: 587,
                  secure: false,
                  tls: {
                    rejectUnauthorized: false,
                  },
                  auth: {
                    user: process.env.MailingId,
                    pass: process.env.MailingPassword,
                  },
                });
                var mailOptions = {
                  to: user.email,
                  from: process.env.MailingId,
                  subject: "Success Message",
                  text:
                    "Hello,\n\n" +
                    "You have successfully verified " +
                    user.email +
                    " \n",
                };
                transporter.sendMail(mailOptions, (error, info) => {
                  if (error) {
                    return res.status(400).json({ message: error.message });
                  }
                  res.status(200).json({
                    message: "Success! You have successfully registed on WINA",
                  });
                  done(err);
                });
              }
            }
          );
        },
      ],
      function (err) {
        console.log(err, "err");
        res.status(400).json({
          message: err.message,
        });
      }
    );
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
    next(error);
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
  const result = await User.findOne({ email: email, status: "active" }).select(
    "+password"
  );

  if (!result) {
    return res
      .status(400)
      .send({ message: "You haven't verify your email address yet" });
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
    res.status(statusCode).cookie("token", token, options).json({
      token: token,
      user: user,
    });
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

// GET ALL PROJECTS //
exports.ProjectsList = asyncHandler(async (req, res, next) => {
  let projectsArray = [];
  const projects = await Project.find({ isDeleted: false }).populate(
    "category"
  );
  if (projects) {
    projects.map((item) => {
      const likes = item.likedBy.length;
      projectsArray.push({ project: item, totalLikes: likes });
    });
    res.status(200).json({ projects: projectsArray });
  } else {
    res.status(200).json({ projects: "No projects yet" });
  }
});

// get All Categories
exports.CategoryList = asyncHandler(async (req, res, next) => {
  await Category.find({ isDeleted: false }, function (err, docs) {
    if (err) res.json(err);
    else
      res.status(200).json({
        category: docs,
      });
  });
});

// get All skills search by user
exports.getSkillList = asyncHandler(async (req, res, next) => {
  const { q } = req.query;
  let search = q.toLowerCase();
  let skills = await Skill.find({
    $and: [
      { skillField: { $regex: search, $options: "$i" } },
      { isDeleted: false },
    ],
  });
  res.status(200).send(skills);
});
// get All materials search by user
exports.getMaterialList = asyncHandler(async (req, res, next) => {
  const { q } = req.query;
  let search = q.toLowerCase();
  let materials = await Material.find({
    $and: [
      { name: { $regex: search, $options: "$i" } },
      { isDeleted: false },
    ],
  });
  res.status(200).send(materials);
});
// get All SKILLS
exports.SkillList = asyncHandler(async (req, res, next) => {
  await Skill.find({ isDeleted: false }, function (err, docs) {
    if (err) res.json(err);
    else
      res.status(200).json({
        skills: docs,
      });
  });
});

// Get All Materials //
exports.MaterialList = asyncHandler(async (req, res, next) => {
  await Material.find({ isDeleted: false }, function (err, docs) {
    if (err) res.json(err);
    else
      res.status(200).json({
        materials: docs,
      });
  });
});

// create Material
// Create Material //
exports.CreateMaterial = asyncHandler(async (req, res, next) => {
  try {
    const { name } = req.body;
    const result = await Material.findOne({ name: name });
    if (result) {
      res.status(400).send({message:"Material name already exists"});
    } else {
      // Saving Material in DataBase
      const material = await Material.create({
        name: req.body.name,
      });
      res.status(200).json({ material: material._id });
    }
  } catch (err) {
    res.status(200).json({ message: err.message});

    next(err);
  }
});