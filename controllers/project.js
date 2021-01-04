const Joi = require("joi");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const Project = require("../models/Project");
const Invitation = require("../models/Invitation");
const Material = require("../models/Material");

//// Create project ////
exports.createProject = asyncHandler(async (req, res, next) => {
  try {
    const address = JSON.parse(req.body.address);
    const implementation_steps1 = JSON.parse(req.body.implementation_steps);
    const body = req.body;
    body.address = address;
    body.implementation_steps = implementation_steps1;

    // body
    // file = req.file

    const picture = req.file;
    if (picture) {
      var uploaded_Picture = req.file.filename;
    } else {
      uploaded_Picture = "default.png";
    }

    //// Validation ////

    // validation for implementation steps schema //
    const skillSchema = Joi.object().keys({
      skillField: Joi.string(),
      skill: Joi.string(),
      speciality: Joi.string().max(20).allow(""),
    });

    const addressSchema = Joi.object().keys({
      city: Joi.string(),
      street: Joi.string(),
      zipCode: Joi.string(),
      latitude: Joi.string(),
      longitude: Joi.string(),
    });

    const implementationStepsSchema = Joi.object().keys({
      name: Joi.string().max(20),
      skills: skillSchema,
      status: Joi.string(),
      material: Joi.string(),
      materialName: Joi.string(),
      description: Joi.string().max(150),
      contributing_user: Joi.array().items(Joi.string()),
    });

    const schema = Joi.object().keys({
      title: Joi.string().min(5).max(100),
      type: Joi.string(),
      address: addressSchema,
      progress: Joi.string(),
      general_photo: Joi.string().max(255),
      general_description: Joi.string().max(3000),
      implementation_steps: Joi.array().items(implementationStepsSchema),
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
      general_photo,
      general_description,
      category,
      project_owner,
    } = req.body;

    // Check if the Material are in database or not, If Not then saving them in the database//
    var steps = implementation_steps1;
    let progress = "";
    const steps_Progress = [];
    var counts = {};
    if (steps) {
      await Promise.all(
        await steps.map(async (val) => {
          const requestedMaterial = val.materialName;

          if (requestedMaterial) {
            const result = await Material.find({ name: requestedMaterial });
            if (result.length == 0) {
              const newMaterial = new Material({
                name: requestedMaterial,
              });
              await newMaterial
                .save()
                .then(
                  console.log(material, "val.material"),
                  await val.material.push(newMaterial._id)
                );
            }
          }
        })
      );
      await steps.map(async (item) => {
        steps_Progress.push(item.status);
      });
      if (steps_Progress) {
        const size = steps_Progress.length;

        for (var i = 0; i < steps_Progress.length; i++) {
          var num = steps_Progress[i];
          counts[num] = counts[num] ? counts[num] + 1 : 1;
        }
        var completed_Steps = counts["completed"];
        let result = (completed_Steps / size) * 100 || 0;
        progress = result + "%";
      }
    }

    // If project has not assigned City //

    var city = req.body.address.city;
    if (!city) {
      city = req.user.city;
    }

    //// Saving Project in DataBase ////
    const project = await new Project({
      title: req.body.title,
      type: req.body.type,
      address: req.body.address,
      general_photo: uploaded_Picture,
      general_description: req.body.general_description,
      implementation_steps: steps,
      category: req.body.category,
      project_owner: req.user.id,
      progress: progress,
    });

    await project.save();

    //// Setting Project Owner Field to TRUE in the DataBase ////

    const user_id = req.user.id;
    const user = await User.findByIdAndUpdate(user_id, {
      isProjectOwner: true,
      $push: { projects: project._id },
    });

    res.status(200).json({ project: project });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//// EDIT PROJECT ////

exports.editProject = asyncHandler(async (req, res, next) => {
  try {
    const picture = req.file;
    if (picture) {
      var uploaded_Picture = req.file.filename;
    } else {
      uploaded_Picture = req.body.general_photo;
    }

    //// Validation ////

    // validation for implementation steps schema //
    const skillSchema = Joi.object().keys({
      skillField: Joi.string(),
      skill: Joi.string(),
      speciality: Joi.string().max(20).allow(""),
    });

    const schema = Joi.object().keys({
      title: Joi.string().min(5).max(100),
      type: Joi.string(),
      general_photo: Joi.string().max(255),
      general_description: Joi.string().max(3000),
      category: Joi.string(),
    });

    const results = schema.validate(req.body);
    if (results.error) {
      return res.status(400).send(results.error.details[0].message);
    }

    //// Updating and Saving Project In Database ////

    const project = await Project.findByIdAndUpdate(
      req.query.id,
      {
        title: req.body.title,
        type: req.body.type,
        general_photo: uploaded_Picture || "default.png",
        general_description: req.body.general_description,
        category: req.body.category,
      },
      { new: true }
    );
    res.status(200).json({ project: project });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//Edit Implementation Step
exports.editImplementationStep = asyncHandler(async (req, res, next) => {
  try {
    let projectID = req.query.id;
    let stepID = req.body.id;

    let progress = "";
    const steps_Progress = [];
    var counts = {};

    const project = await Project.findById(projectID);
    const steps = project.implementation_steps;

    let step = steps.find((item) => item.id === stepID);

    step = req.body.step;
    step._id = stepID;

    const updatedProject = await Project.findOneAndUpdate(
      {
        _id: projectID,
        implementation_steps: {
          $elemMatch: {
            _id: stepID,
          },
        },
      },
      { $set: { "implementation_steps.$": step } },
      { new: true }
    );

    const updatedSteps = updatedProject.implementation_steps;

    await updatedSteps.map(async (item) => {
      steps_Progress.push(item.status);
    });
    if (steps_Progress) {
      const size = steps_Progress.length;

      for (var i = 0; i < size; i++) {
        var num = steps_Progress[i];
        counts[num] = counts[num] ? counts[num] + 1 : 1;
      }
      var completed_Steps = counts["completed"];
      let result = (completed_Steps / size) * 100 || 0;
      progress = result + "%";
    }

    await Project.findByIdAndUpdate(projectID, {
      progress: progress,
    });

    res.status(200).json({
      message: "Step has been updated Successfully",
      project: updatedProject,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//Add Implementation Step
exports.addImplementationStep = asyncHandler(async (req, res, next) => {
  try {
    let projectID = req.query.id;
    const step = req.body.step;

    const project = await Project.findByIdAndUpdate(
      projectID,
      {
        $push: { implementation_steps: step },
      },
      { new: true }
    );
    res
      .status(200)
      .json({ message: "Step added successfully", project: project });
  } catch (err) {
    next(err);
  }
});

//// View PROJECT ////

exports.ViewProject = asyncHandler(async (req, res, next) => {
  try {
    const populateQuery = [
      {
        path: "category",
        select: ["name", "color"],
      },
      {
        path: "implementation_steps.skills.skillField",
        select: "skillField",
      },
      {
        path: "implementation_steps.material",
        select: "name",
      },
      {
        path: "implementation_steps.contributing_user",
      },
      {
        path: "project_owner",
      },
      {
        path: "comments.user",
        model: "User",
      },
    ];
    const project = await Project.findById(req.query.id).populate(
      populateQuery
    );
    res.status(200).json({ project: project });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//// LikedBy ////

exports.LikedBy = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const user_name = user.username;
    await Project.findByIdAndUpdate(req.query.id, {
      $push: { likedBy: req.user.id },
    });
    res.status(200).json({ user: user_name });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//// Total Likes of a Project ////
exports.totalLikes = asyncHandler(async (req, res, next) => {
  try {
    const projectID = req.query.id;

    const project = await Project.findById(projectID);
    const likesArray = project.likedBy;
    const totalLikes = likesArray.length;

    res
      .status(200)
      .json({ message: "Total number of Likes are :" + totalLikes });
  } catch (err) {
    res.status(400).json({ message: err.message });
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
    const project = await Project.findByIdAndUpdate(
      req.query.id,
      {
        $push: { comments: newComment },
      },
      { new: true }
    );
    res
      .status(200)
      .json({ name: userName, comment: comment, user: loggedUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//// Request to view a Project ////

exports.RequestToView = asyncHandler(async (req, res, next) => {
  try {
    const sender = req.user.id;
    const project = req.query.id;
    const targeted_project = await Project.findById(project);
    const receiver = targeted_project.project_owner;

    // check if user already sent invitation
    const userInvitations = await Invitation.find({
      $and: [
        { type: "viewProject" },
        { sender: req.user.id },
        { projectID: project },
      ],
    });
    if (userInvitations.length > 0) {
      res.status(400).json({
        message: "You have already sent request to view this project",
      });
    } else {
      const newInvitation = new Invitation({
        type: "viewProject",
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
        )
        .then(
          await User.findByIdAndUpdate(sender, {
            $push: { invitation: newInvitation.id },
          })
        )
        .then(
          await User.findByIdAndUpdate(receiver, {
            $push: {
              notifications: {
                title: "Request to View Project",
                description: "Someone Requested to view your Project",
              },
            },
          })
        );
      res.status(200).json({ Invitation: newInvitation });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Send Invite by collaborators  to collaborate
exports.InviteUser = asyncHandler(async (req, res, next) => {
  try {
    const senderID = req.user.id;
    const projectID = req.query.id;
    const receiver = req.body.receiver;
    const skill = req.body.skills;
    const stepID = req.body.stepID;

    const project = await Project.findById(projectID);
    const title = project.title;

    const sender = await User.findById(senderID);
    const sender_name = sender.username;

    // check if project owner already sent invitation to user
    const userInvitations = await Invitation.find({
      $and: [
        { type: "inviteCollaborator" },
        { sender: req.user.id },
        { projectID: project },
        { receiver: req.body.receiver },
      ],
    });
    if (userInvitations.length > 0) {
      res.status(400).json({
        message: "You have already invited this collaborator",
        Invitations: userInvitations,
      });
    } else {
      const newInvitation = new Invitation({
        type: "inviteCollaborator",
        sender: senderID,
        receiver: receiver,
        projectID: projectID,
        skillID: skill,
        stepID: stepID,
      });

      await newInvitation
        .save()
        .then(
          await User.findByIdAndUpdate(receiver, {
            $push: { invitation: newInvitation.id },
          })
        )
        .then(
          await User.findByIdAndUpdate(senderID, {
            $push: { invitation: newInvitation.id },
          })
        )
        .then(
          await User.findByIdAndUpdate(receiver, {
            $push: {
              notifications: {
                title: "You are Invited to Collaborate on " + title,
                description:
                  sender_name + " Invited you to collaborate on " + title,
              },
            },
          })
        );
      res.status(200).json({ Invitation: newInvitation });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Send Invite by collaborators  to collaborate
exports.sendInvitetoProjectOwner = asyncHandler(async (req, res, next) => {
  try {
    const senderID = req.user.id;
    const projectID = req.query.id;
    const stepID = req.body.stepID;

    const project = await Project.findById(projectID);
    const receiver = project.project_owner;
    const title = project.title;

    const sender = await User.findById(senderID);
    const sender_name = sender.username;

    // check if collaborator already sent invitation to project owner
    const userInvitations = await Invitation.find({
      $and: [
        { type: "inviteProjectOwner" },
        { sender: req.user.id },
        { projectID: project },
        { receiver: receiver },
        { stepID: stepID },
      ],
    });
    if (userInvitations.length > 0) {
      res.status(400).json({
        message:
          "You have already sent request to collaborate against this step",
        Invitations: userInvitations,
      });
    } else {
      const newInvitation = new Invitation({
        type: "inviteProjectOwner",
        sender: senderID,
        receiver: receiver,
        projectID: projectID,
        stepID: stepID,
      });

      await newInvitation
        .save()
        .then(
          await User.findByIdAndUpdate(receiver, {
            $push: { invitation: newInvitation.id },
          })
        )
        .then(
          await User.findByIdAndUpdate(senderID, {
            $push: { invitation: newInvitation.id },
          })
        )
        .then(
          await User.findByIdAndUpdate(receiver, {
            $push: {
              notifications: {
                title: "Someone has requested to collaborate on " + title,
                description: "Someone has requested to collaborate on " + title,
              },
            },
          })
        );
      res.status(200).json({ Invitation: newInvitation });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete Contributors from a single Step //
exports.deleteContributor = asyncHandler(async (req, res, next) => {
  try {
    const projectID = req.query.id;
    const step_Id = req.body.step_Id;
    const user = req.body.user_id;

    const result = await Project.findById(projectID);
    if (!result) {
      console.log(err);
    } else {
      const title = result.title;
      const projectOwnerID = result.project_owner;
      const projectOwner = await User.findById(projectOwnerID);
      const ownerName = projectOwner.username;
      const steps = result.implementation_steps;
      let stepIndex;
      steps.map((val, index) => {
        if (val._id.toString() === step_Id.toString()) {
          stepIndex = index;
        }
      });

      const index = steps[stepIndex].contributing_user.indexOf(user);
      if (index > -1) {
        steps[stepIndex].contributing_user.splice(index, 1);
      }
      result.implementation_steps = steps;
      const newResult = await result.save().then(
        await User.findByIdAndUpdate(user, {
          $push: {
            notifications: {
              title: "You have been removed from " + title,
              description: ownerName + " removed you from " + title,
            },
          },
        })
      );
    }
    res.status(200).send("Removed this user successfully");
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//// DElETE PROJECT ////

exports.deleteProject = asyncHandler(async (req, res, next) => {
  try {
    let contributingUsers = [];
    const projectID = req.query.id;
    const user = req.user.id;

    const project = await Project.findById(projectID);
    const projectOwner = project.project_owner;
    if (projectOwner == user) {
      const steps = project.implementation_steps;
      steps.map(function (val) {
        contributingUsers.push(val.contributing_user);
      });
    } else {
      res
        .status(403)
        .json({ message: "you are not authorized to delete this project" });
      return;
    }
    if (contributingUsers[0][0] !== undefined) {
      contributingUsers.map(async function (val) {
        val.map(async function (val1) {
          const user = await User.findByIdAndUpdate(val1, {
            $push: {
              notifications: {
                title: "Project Deletion by Project Owner",
                description: `Project Owner has requested to delete this Project, Do you want him to delete?`,
                projectID: projectID,
              },
            },
          });
        });
      });
      const project = await Project.findByIdAndUpdate(projectID, {
        deletionRequestTime: new Date(),
      });
      res.status(200).json({
        message: "Deletion Request sent to the Collaborators Successfully",
      });
      return;
    } else {
      const project = await Project.findByIdAndUpdate(projectID, {
        isDeleted: true,
      });
      res.status(200).json({ message: "Project Deleted Successfully" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Collaborator Decision to Delete Project //
exports.takeDecision = asyncHandler(async (req, res, next) => {
  try {
    let contributingUsers = [];
    let usersDecisions = [];
    const decision = req.body.decision;
    const projectID = req.query.id;
    const user = await User.findById(req.user._id);
    const notificationID = req.body.notificationID;

    if (decision == null || decision == undefined) {
      res.status(403).json({ message: "Please Specify your answer properly" });
      return;
    } else {
      const project = await Project.findById(projectID);
      if (project.isDeleted) {
        res.status(400).json({ message: "Already deleted" });
        return;
      }

      if (decision) {
        var updatedProject = await Project.findByIdAndUpdate(
          projectID,
          {
            $push: {
              contributingUsers_decision: {
                id: req.user._id,
                decision,
              },
            },
          },
          { new: true }
        ).then(() => {
          User.findByIdAndUpdate(req.user._id, {
            notifications: {
              $pull: {
                _id: notificationID,
              },
            },
          });
        });
        res.status(200).json({
          message: "Your Response Submitted, Thankyou!",
        });
      }
      if (decision == "No") {
        await User.findByIdAndUpdate(project.project_owner, {
          $push: {
            notifications: {
              title: "Project Deletion Cancelled",
              description: `Collaborator "${user.username}" has rejected ${project.title} deletion, You cannot delete this Project`,
              projectID: projectID,
            },
          },
        });
      }

      if (updatedProject.contributingUsers_decision) {
        const steps = updatedProject.implementation_steps;
        steps.map(function (val) {
          contributingUsers.push(val.contributing_user);
        });
        if (
          contributingUsers.length ==
          updatedProject.contributingUsers_decision.length
        ) {
          project.contributingUsers_decision.map((item) => {
            usersDecisions.push(item.decision);
          });

          const result = usersDecisions.includes("No");
          if (result) {
            await User.findByIdAndUpdate(project.project_owner, {
              $push: {
                notifications: {
                  title: "Project Deletion Cancelled",
                  description: `You cannot Delete this Project`,
                  projectID: projectID,
                },
              },
            });
          } else {
            await Project.findByIdAndUpdate(projectID, {
              isDeleted: true,
            });
          }
        }
      }
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Project Filters //

// By City Name //
exports.SearchByCity = asyncHandler(async (req, res, next) => {
  try {
    const city = req.body.city;
    const filteredArray = [];
    const project = await Project.find({
      isDeleted: false,
      "address.city": city,
    }).populate("category");
    project.map((item) => {
      const totalLikes = item.likedBy.length;
      filteredArray.push({ project: item, totalLikes: totalLikes });
    });

    if (project == "") {
      res.status(200).send("No project found with this City name");
    } else {
      res.status(200).json({ projects: filteredArray });
    }
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// By Skill Name //
exports.SearchBySkill = asyncHandler(async (req, res, next) => {
  try {
    const skill = req.body.skill;
    const filteredArray = [];

    const project = await Project.find({
      implementation_steps: {
        $elemMatch: {
          "skills.skillField": skill,
        },
      },
    }).populate("category");
    project.map((item) => {
      const totalLikes = item.likedBy.length;
      filteredArray.push({ project: item, totalLikes: totalLikes });
    });
    if (project == "") {
      res.status(200).send("No project found with this Skill Field name");
    } else {
      res.status(200).json({ projects: filteredArray });
    }
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// By Category Name //
exports.SearchByCategory = asyncHandler(async (req, res, next) => {
  try {
    const category = req.body.category;
    const project = await Project.find({
      category: category,
    }).populate("category");
    if (project == "") {
      res.status(200).send("No project found with this Category name");
    } else {
      res.status(200).json(project);
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Find Collaborators from a Specific Skill Field //

exports.SearchCollaboratorsBySkill = asyncHandler(async (req, res, next) => {
  try {
    const skill = req.body.skill;

    const users = await User.find({ "skills.skillField": { $eq: skill } });
    if (users == "") {
      res.status(200).send("No Users found with this Skill name");
    } else {
      res.status(200).json(users);
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Find Collaborators from a Specific Material //

exports.SearchCollaboratorsByMaterial = asyncHandler(async (req, res, next) => {
  try {
    const material = req.body.material;

    const users = await User.find({ material: { $in: material } }).populate(
      "material"
    );
    if (users == "") {
      res.status(200).send("No Users found with this Material name");
    } else {
      res.status(200).json({ users: users });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Find Collaborators from a Specific Category //

exports.SearchCollaboratorsByCategory = asyncHandler(async (req, res, next) => {
  try {
    const projectID = req.query.id;

    const project = await Project.findById(projectID);
    const projectCategory = project.category;
    const users = await User.find({ interests: { $in: projectCategory } });
    if (users == "") {
      res.status(200).send("No Users found with this type of Category");
    } else {
      res.status(200).json(users);
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//Project Progress //
exports.projectProgress = asyncHandler(async (req, res, next) => {
  try {
    const projectID = req.query.id;
    const steps_Progress = [];
    var counts = {};

    const project = await Project.findById(projectID);
    const steps = project.implementation_steps;
    if (steps) {
      steps.map((val) => {
        steps_Progress.push(val.status);
      });
      const size = steps_Progress.length;

      for (var i = 0; i < steps_Progress.length; i++) {
        var num = steps_Progress[i];
        counts[num] = counts[num] ? counts[num] + 1 : 1;
      }
      var completed_Steps = counts["completed"];
      let result = (completed_Steps / size) * 100 || 0;
      project.progress = result + "%";
      await project.save();
      res.status(200).json({ result: result + "%" });
    } else {
      project.progress = "0" + "%";
      await project.save();
      res.status(200).json({ result: "0" + "%" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Accept and Decline Invite by user //
exports.inviteCollaboratorDecision = asyncHandler(async (req, res, next) => {
  try {
    const decision = req.body.decision;
    const projectID = req.query.id;
    const stepID = req.body.step;
    const project = await Project.findById(projectID);
    const userID = req.user.id;
    const invitationID = req.body.invitation;
    const invitation = await Invitation.findById(invitationID);

    const receiver = await User.findById(invitation.receiver);
    if (decision == "Accepted") {
      await Project.findOneAndUpdate(
        {
          _id: projectID,
          implementation_steps: {
            $elemMatch: {
              _id: stepID,
            },
          },
        },
        {
          $push: {
            "implementation_steps.0.contributing_user": invitation.receiver,
          },
        },
        { new: true }
      )
        .then(async () => {
          await Invitation.findByIdAndDelete(invitationID).then(async () => {
            await User.findByIdAndUpdate(invitation.receiver, {
              $pull: { invitation: invitationID },
              $push: { projects: projectID },
            });
          });
        })
        .then(async () => {
          await User.findByIdAndUpdate(project.project_owner, {
            $push: {
              notifications: {
                title: "Invitation Accepted",
                description: `${receiver.username} has accepted invitation to collaborate on ${project.title}`,
              },
            },
          });
        });
      res.status(200).json({ message: "Invitation Accepted!" });
    } else if (decision == "Decline") {
      await Invitation.findByIdAndDelete(invitationID)
        .then(async () => {
          await User.findByIdAndUpdate(invitation.receiver, {
            $pull: { invitation: invitationID },
          });
        })
        .then(async () => {
          await User.findByIdAndUpdate(project.project_owner, {
            $push: {
              notifications: {
                title: "Invitation Declined",
                description: `${receiver.username} has declined your invitation to collaborate on ${project.title}`,
              },
            },
          });
        });
      res.status(200).json({ message: "Invitation Declined!" });
    }
  } catch (err) {
    next(err);
  }
});

// Accept and Decline Invite by Project Owner //
exports.inviteProjectOwnerDecision = asyncHandler(async (req, res, next) => {
  try {
    const decision = req.body.decision;
    const projectID = req.query.id;
    const stepID = req.body.step;
    const project = await Project.findById(projectID);
    const userID = req.user.id;
    const invitationID = req.body.invitation;
    const invitation = await Invitation.findById(invitationID);

    const receiver = await User.findById(invitation.receiver);
    const sender = await User.findById(invitation.sender);

    if (decision == "Accepted") {
      await Project.findOneAndUpdate(
        {
          _id: projectID,
          implementation_steps: {
            $elemMatch: {
              _id: stepID,
            },
          },
        },
        {
          $push: {
            "implementation_steps.$.contributing_user": sender,
          },
        },
        { new: true }
      )
        .then(async () => {
          await Invitation.findByIdAndDelete(invitationID).then(async () => {
            await User.findByIdAndUpdate(sender, {
              $pull: { invitation: invitationID },
              $push: { projects: projectID },
            });
          });
        })
        .then(async () => {
          await User.findByIdAndUpdate(sender, {
            $push: {
              notifications: {
                title: "Invitation Accepted",
                description: `${receiver.username} has accepted invitation to collaborate on ${project.title}`,
              },
            },
          });
        });
      res.status(200).json({ message: "Invitation Accepted!" });
    } else if (decision == "Decline") {
      await Invitation.findByIdAndDelete(invitationID)
        .then(async () => {
          await User.findByIdAndUpdate(sender, {
            $pull: { invitation: invitationID },
          });
        })
        .then(async () => {
          await User.findByIdAndUpdate(sender, {
            $push: {
              notifications: {
                title: "Invitation Declined",
                description: `${receiver.username} has declined your invitation to collaborate on ${project.title}`,
              },
            },
          });
        });
      res.status(200).json({ message: "Invitation Declined!" });
    }
  } catch (err) {
    next(err);
  }
});

// Accept and Decline request to view Project //
exports.requestToViewProjectDecision = asyncHandler(async (req, res, next) => {
  try {
    const decision = req.body.decision;
    const projectID = req.query.id;
    const invitationID = req.body.invitation;
    const project = await Project.findById(projectID);
    const requestedUserID = req.body.sender;

    if (decision == "Accept") {
      await Project.findByIdAndUpdate(projectID, {
        $push: {
          usersToView: requestedUserID,
        },
      })
        .then(async () => {
          await Invitation.findByIdAndDelete(invitationID);
        })
        .then(async () => {
          await User.findByIdAndUpdate(project.project_owner, {
            $pull: {
              invitation: invitationID,
            },
          });
        });
      res.status(200).json({ message: "Request Approved!" });
    } else if (decision == "Decline") {
      await User.findByIdAndUpdate(requestedUserID, {
        $push: {
          notifications: `Your request to view ${project.title} has been rejected by the project owner`,
        },
      })
        .then(async () => {
          await Invitation.findByIdAndDelete(invitationID);
        })
        .then(async () => {
          await User.findByIdAndUpdate(project.project_owner, {
            $pull: {
              invitation: invitationID,
            },
          });
        });
      res.status(200).json({ message: "Request Rejected!" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//Delete Comment
exports.deleteComment = asyncHandler(async (req, res, next) => {
  try {
    const commentId = req.body.commentId;
    const projectId = req.query.id;
    const project = await Project.findByIdAndUpdate(
      projectId,
      {
        $pull: { comments: { _id: commentId } },
      },
      { new: true }
    );
    res
      .status(200)
      .json({ message: "Comment Deleted successfully", project: project });
  } catch (err) {
    next(err);
  }
});
