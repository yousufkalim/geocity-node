const Joi = require("joi");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const Project = require("../models/Project");
const Category = require("../models/Category");
const Skill = require("../models/Skill");
const Material = require("../models/Material");

// GET ALL USERS //
exports.UsersList = asyncHandler(async (req, res, next) => {
  try {
    await User.find({ role: "user" }, function (err, docs) {
      if (err) res.json(err);
      else
        res.status(200).json({
          users: docs,
        });
    });
  } catch (err) {
    next(err);
  }
});

// EDIT USERS //
exports.EditUser = asyncHandler(async (req, res, next) => {
  try {
    const picture = req.file;
    if (picture) {
      var uploaded_Picture = req.file.filename;
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
      city: Joi.string(),
      zipCode: Joi.string(),
      latitude: Joi.string(),
      longitude: Joi.string(),
      profile_picture: Joi.string().max(255),
      profile_description: Joi.string().min(10).max(600),
      skills: services,
      material: Joi.array().min(1).items(Joi.string()),
    });

    const user = await User.findByIdAndUpdate(
      req.query.id,
      {
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        city: req.body.city,
        zipCode: req.body.zipCode,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        profile_description: req.body.profile_description,
        profile_picture: uploaded_Picture || "default.png",
        skills: req.body.skills,
        material: req.body.material,
      },
      { new: true }
    );
    res.status(200).json({ user: user });
  } catch (err) {
    next(err);
  }
});

// DELETE USERS //
exports.DeleteUser = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.query.id, {
      isDeleted: true,
    });
    res.status(200).send("Profile Deleted Successfully");
  } catch (err) {
    next(err);
  }
});

// GET ALL PROJECTS //
exports.ProjectsList = asyncHandler(async (req, res, next) => {
  try {
    const populateQuery = [
      {
        path: "project_owner",
      },
    ];
    const projects = await Project.find({ isDeleted: false }).populate(
      populateQuery
    );
    res.status(200).json({ projects: projects });
  } catch (err) {
    next(err);
  }
});

// EDIT PROJECTS //
exports.EditProject = asyncHandler(async (req, res, next) => {
  try {
    const picture = req.file;
    if (picture) {
      var uploaded_Picture = req.file.filename;
    }

    //// Validation ////

    const nestedSchema = Joi.object().keys({
      name: Joi.string().max(20),
      status: Joi.string(),
      skillField: Joi.string(),
      speciality: Joi.string().max(20),
      material: Joi.array().items(Joi.string()),
      contributing_user: Joi.array().items(Joi.string()),
    });

    let services = Joi.array().items(nestedSchema);

    const schema = Joi.object().keys({
      title: Joi.string().min(5).max(40),
      type: Joi.string(),
      progress: Joi.string(),
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

    const project = await Project.findByIdAndUpdate(
      req.query.id,
      {
        title: req.body.title,
        type: req.body.type,
        progress: req.body.progress,
        general_description: req.body.general_description,
        general_photo: uploaded_Picture || "default.png",
        implementation_steps: req.body.implementation_steps,
      },
      { new: true }
    );
    res.status(200).json({ project: project });
  } catch (err) {
    next(err);
  }
});

// DELETE PROJECTS //
exports.DeleteProject = asyncHandler(async (req, res, next) => {
  try {
    await Project.findByIdAndUpdate(req.query.id, {
      isDeleted: true,
    });
    res.status(200).send("Project Deleted Successfully");
  } catch (err) {
    next(err);
  }
});

// Get All Categories //
exports.getAllCategories = asyncHandler(async (req, res, next) => {
  try {
    await Category.find(function (err, docs) {
      if (err) res.json(err);
      else
        res.status(200).json({
          categories: docs,
        });
    });
  } catch (err) {
    next(err);
  }
});

// Create Project Category//
exports.CreateCategory = asyncHandler(async (req, res, next) => {
  try {
    const { name, color } = req.body;

    //// Check If Category exists with this name or not ////

    const result = await Category.findOne({ name: name });
    if (result) {
      res.status(400).send("Category name already exists");
    } else {
      // Saving Category in DataBase
      const category = await Category.create({
        name,
        color,
      });
      res.status(200).json({ category: category });
    }
  } catch (err) {
    next(err);
  }
});

// Edit Project Category //
exports.EditCategory = asyncHandler(async (req, res, next) => {
  try {
    const { name, color } = req.body;

    //// Check If Category exists with this name or not ////

    const result = await Category.findOne({ name: name });
    if (result) {
      res.status(400).send("Category name already exists");
    } else {
      const category = await Category.findByIdAndUpdate(
        req.query.id,
        {
          name: req.body.name,
          color: req.body.color,
        },
        { new: true }
      );
      res.status(200).json({ category: category });
    }
  } catch (err) {
    next(err);
  }
});

// Delete Project Category //
exports.DeleteCategory = asyncHandler(async (req, res, next) => {
  try {
    await Category.findByIdAndUpdate(req.query.id, {
      isDeleted: true,
    });
    res.status(200).send("Category Deleted Successfully");
  } catch (err) {
    next(err);
  }
});

// Get All Skills //
exports.getAllSkills = asyncHandler(async (req, res, next) => {
  try {
    await Skill.find({ isDeleted: false }, function (err, docs) {
      if (err) res.json(err);
      else
        res.status(200).json({
          skills: docs,
        });
    });
  } catch (err) {
    next(err);
  }
});

// Create SkillField //
exports.CreateSkillField = asyncHandler(async (req, res, next) => {
  try {
    const { skillField, skills } = req.body;

    //// Check If Skill exists with this name or not ////

    const result = await Skill.findOne({ skillField: skillField });
    if (result) {
      res.status(400).send("SkillField already exists");
    } else {
      // Saving Skill in DataBase
      const skill = await Skill.create({
        skillField: skillField,
        skill: skills,
      });
      res.status(200).json({ skillField: skillField, skills: skills });
    }
  } catch (err) {
    next(err);
  }
});

// Edit SkillField //
exports.EditSkillField = asyncHandler(async (req, res, next) => {
  try {
    const { skillField, skills } = req.body;

    const skillFieldID = req.query.id;
    //// Check If SkillField exists with this name or not ////
    if (skillField) {
      const result = await Skill.findOne({ skillField: skillField });
      if (result) {
        res.status(400).send("SkillField already exists");
        return;
      } else {
        const skill = await Skill.findByIdAndUpdate(
          req.query.id,
          {
            skillField: skillField,
          },
          { new: true }
        );
      }
    }
    if (skills == undefined) {
      res.status(200).json({ message: "SkillField Updated Successfully" });
      return;
    } else {
      const result = await Skill.find({ id: skillFieldID, skill: skills });
      if (result.length == 0) {
        await Skill.findByIdAndUpdate(skillFieldID, {
          skill: skills,
        });
        return res.status(200).json({ message: "Skill Updated successfully" });
      } else {
        res.status(400).json({ message: "Skill name Already Exists" });
      }
    }
  } catch (err) {
    next(err);
  }
});

// Delete SkillField //
exports.DeleteSkillField = asyncHandler(async (req, res, next) => {
  try {
    await Skill.findByIdAndUpdate(req.query.id, {
      isDeleted: true,
    });
    res.status(200).send("Skill Deleted Successfully");
  } catch (err) {
    next(err);
  }
});

// Create Skill //
exports.CreateSkill = asyncHandler(async (req, res, next) => {
  try {
    const skillFieldID = req.query.id;
    const skill = req.body.skill;

    const result = await Skill.findOne({
      $and: [{ _id: skillFieldID, skill: skill }],
    });
    if (result) {
      res.status(403).json({ message: "Skill Name already exists" });
    } else {
      await Skill.findByIdAndUpdate(skillFieldID, {
        $push: { skill: skill },
      });
      res
        .status(200)
        .json({ message: "Skill added in SkillField Successfully" });
    }
  } catch (err) {
    next(err);
  }
});

// Create Material //
exports.CreateMaterial = asyncHandler(async (req, res, next) => {
  try {
    const { name } = req.body;

    //// Check If Material exists with this name or not ////

    const result = await Material.findOne({ name: name });
    if (result) {
      res.status(400).send("Material name already exists");
    } else {
      // Saving Material in DataBase
      const material = await Material.create({
        name: req.body.name,
      });
      res.status(200).json({ material: material });
    }
  } catch (err) {
    next(err);
  }
});

// Get All Materials //
exports.getAllMaterials = asyncHandler(async (req, res, next) => {
  try {
    await Material.find({ isDeleted: false }, function (err, docs) {
      if (err) res.json(err);
      else
        res.status(200).json({
          materials: docs,
        });
    });
  } catch (err) {
    next(err);
  }
});

// Edit Material //
exports.EditMaterial = asyncHandler(async (req, res, next) => {
  try {
    const { name } = req.body;

    //// Check If Category exists with this name or not ////

    const result = await Material.findOne({ name: name });
    if (result) {
      res.status(400).send("Material name already exists");
    } else {
      const material = await Material.findByIdAndUpdate(
        req.query.id,
        {
          name: req.body.name,
        },
        { new: true }
      );
      res.status(200).json({ material: material });
    }
  } catch (err) {
    next(err);
  }
});

// Delete Skill //
exports.DeleteMaterial = asyncHandler(async (req, res, next) => {
  try {
    await Material.findByIdAndUpdate(req.query.id, {
      isDeleted: true,
    });
    res.status(200).send("Material Deleted Successfully");
  } catch (err) {
    next(err);
  }
});
