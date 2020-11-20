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
const Skill = require("../models/Skill");
const Material = require("../models/Material");
const { func } = require("joi");
const { findByIdAndUpdate } = require("../models/User");

//// Create project ////
exports.createProject = asyncHandler(async (req, res, next) => {
  const picture = req.file;
  if (picture) {
    var uploaded_Picture = req.file.filename;
  }

  //// Validation ////

  // validation for implementation steps schema //

  const nestedSchema = Joi.object().keys({
    name: Joi.string().max(20),
    status: Joi.string(),
    skillField: Joi.string(),
    speciality: Joi.string().max(20),
    material: Joi.array().items(Joi.string()),
    description : Joi.string().max(150),
    contributing_user: Joi.array().items(Joi.string()),
  });

  let services = Joi.array().items(nestedSchema);

  const schema = Joi.object().keys({
    title: Joi.string().min(5).max(100),
    type: Joi.string(),
    city: Joi.string(),
    address: Joi.string(),
    zipCode: Joi.string(),
    latitude: Joi.string(),
    longitude: Joi.string(),
    progress: Joi.string(),
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
    progress,
    general_photo,
    general_description,
    implementation_steps,
    category,
    project_owner,
  } = req.body;

     // Check if the Material are in database or not, If Not then saving them in the database//
     var steps = req.body.implementation_steps;
     if(steps){
      await Promise.all(await steps.map(async val=>{
        const requestedMaterial = val.materialName
       
       if(requestedMaterial){
        const result = await Material.find({name : requestedMaterial});
        if(result.length == 0){
          const newMaterial = new Material({
            name : requestedMaterial
          });
          await newMaterial.save().then(
            await val.material.push(newMaterial._id)
          )
         }
        
        }
       }))
     }
    

  // If project has not assigned City //

  var city = req.body.city;
  if(!city){
    city = req.user.city
  }

  //// Saving Project in DataBase ////

  const project = await new Project({
    title: req.body.title,
    type: req.body.type,
    city : city,
    address : req.body.address,
    zipCode : req.body.zipCode,
    latitude : req.body.latitude,
    longitude : req.body.longitude,
    progress: req.body.progress,
    general_photo: uploaded_Picture || "default.png",
    general_description: req.body.general_description,
    implementation_steps: req.body.implementation_steps,
    category: req.body.category,
    project_owner: req.user.id,
  });

   await project.save(function (err, project) {
    var newProjectId = project._id;
  });

  //// Setting Project Owner Field to TRUE in the DataBase ////

  const user_id = req.user.id;
  const user = await User.findByIdAndUpdate(user_id, {
    isProjectOwner: true,
    $push: { projects: project._id },
  });

  res.status(200).json({project : project})
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
    skillField: Joi.string(),
    speciality: Joi.string().max(20),
    material: Joi.array().items(Joi.string()),
    description : Joi.string().max(150),
    contributing_user: Joi.array().items(Joi.string()),
  });

  let services = Joi.array().items(nestedSchema);

  const schema = Joi.object().keys({
    title: Joi.string().min(5).max(100),
    type: Joi.string(),
    city: Joi.string(),
    address: Joi.string(),
    zipCode: Joi.string(),
    latitude: Joi.string(),
    longitude: Joi.string(),
    progress: Joi.string(),
    general_photo: Joi.string().max(255),
    general_description: Joi.string().max(3000),
    implementation_steps: services,
    category: Joi.string(),
  });

  const results = schema.validate(req.body);
  if (results.error) {
    return res.status(400).send(results.error.details[0].message);
  }

  var city = req.body.city;
  if(!city){
    city = req.user.city
  }

  //// Updating and Saving Project In Database ////

  const project = await Project.findByIdAndUpdate(req.query.id, {
    title: req.body.title,
    type: req.body.type,
    city : city,
    address : req.body.address,
    zipCode : req.body.zipCode,
    latitude : req.body.latitude,
    longitude : req.body.longitude,
    progress: req.body.progress,
    general_description: req.body.general_description,
    general_photo: uploaded_Picture || "default.png",
   implementation_steps: steps,
  },{new : true});
  res.status(200).json({project : project})
});

//// View PROJECT ////

exports.ViewProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.query.id, function (err, result) {
    if (err) {
      console.log(err);
    }
    res.status(200).json({project : result});
  });
});

//// LikedBy ////

exports.LikedBy = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const user_name = user.username;
  await Project.findByIdAndUpdate(req.query.id, {
    $push: { likedBy: req.user.id },
  });
  res.status(200).json({user : user_name})
});

//// Total Likes of a Project ////
exports.totalLikes = asyncHandler(async (req, res, next) => {
  const projectID = req.query.id;
  
  const project = await Project.findById(projectID);
  const likesArray = project.likedBy;
  const totalLikes = likesArray.length;

  res.status(200).json({message : "Total number of Likes are :"+totalLikes})
})

//// Comments ////

exports.comment = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const user_name = user.username;
  const comment = req.body.comment;
  const newComment = {
    user : user,
    comment : comment
  }
  await Project.findByIdAndUpdate(req.query.id, {
    $push: {comments : newComment}
  });
  res.status(200).json({user : user_name , comment : comment})
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
         $push : {notifications:{
          title : "Request to View Project",
          description: "Someone Requested to view your Project"
      }}
      })
    );
  res
    .status(200).json({Invitation : newInvitation})
});

//// Invite users to contribute ////

exports.InviteUser = asyncHandler(async (req, res, next) => {
  const senderID = req.user.id;
  const projectID = req.query.id;
  const receiver = req.body.receiver;
  const skill = req.body.skills;
  const stepID = req.body.step;

  const project = await Project.findById(projectID)
  const title = project.title;

  const sender = await User.findById(senderID);
  const sender_name = sender.username

  const newInvitation = new Invitation({
    sender: senderID,
    receiver: receiver,
    projectID: projectID,
    skillID: skill,
  });
  newInvitation.save().then(
    await User.findByIdAndUpdate(receiver, {
      $push: { invitation: newInvitation._id },
      $push : {notifications:{
        title : "You are Invited to Collaborate on " + title,
        description: sender_name + " Invited you to collaborate on " + title
    }}
    })
  );
  res.status(200).json({Invitation : newInvitation})
});

// Delete Contributors from a single Step //

exports.deleteContributor = asyncHandler(async (req, res, next) => {

  const projectID = req.query.id;
  const step_Id = req.body.step_Id;
  const user = req.body.user_id;

  const result = await Project.findById(projectID);
    if(!result){
      console.log(err);
    } else {
    const title = result.title;
    const projectOwnerID = result.project_owner;
    const projectOwner = await User.findById(projectOwnerID)
    const ownerName = projectOwner.username;
    const steps = result.implementation_steps;
    let stepIndex;
    steps.map((val,index) => {
     if( val._id.toString() === step_Id.toString()){
        stepIndex = index
      }
    })

      const index = steps[stepIndex].contributing_user.indexOf(user)
      if (index > -1) {
        steps[stepIndex].contributing_user.splice(index, 1);
      }
      result.implementation_steps= steps;
      const newResult = await result.save().then(
        await User.findByIdAndUpdate(user,{
          $push : {notifications:{
            title : "You have been removed from " + title,
            description: ownerName + " removed you from " + title
        }},
        })
      )
    }
  res.status(200).send("Removed this user successfully")
})

//// DElETE PROJECT ////

exports.deleteProject = asyncHandler(async (req, res, next) => {
  let contributingUsers = [];
  const projectID = req.query.id;
  const user = req.user.id;

  const project = await Project.findById(projectID);
  const projectOwner = project.project_owner;
  if(projectOwner == user){
    const steps = project.implementation_steps;
    steps.map(function(val){
      contributingUsers.push(
        val.contributing_user
      )
    })
  } else {
    res.status(403).json({message : "you are not authorized to delete this project"})
    return;
  }
    if(contributingUsers){
      contributingUsers.map(async function(val){
        val.map( async function(val1){
          const user = await User.findByIdAndUpdate(val1,{
            $push : {"notifications":{
              title : "Project Deletion by Project Owner",
              description: "Project Owner has requested to delete this Project"
          }}
        })
      })
               
    })
    const project = await Project.findByIdAndUpdate(projectID, {
      deletionRequestTime: new Date()
    })
    res.status(200).json({message : "Deletion Request sent to the Collaborators Successfully"})
    return;
  } else {
      const project = await Project.findByIdAndUpdate(projectID,{
        isDeleted : true
      })
    }
   
    res.status(200).json({message : "Project Deleted Successfully"})

})


// Collaborator Decision to Delete Project //
exports.takeDecision = asyncHandler(async (req, res, next) => {
  const decision = req.body.decision;
  const projectID = req.query.id;
  if(decision == null || decision == undefined || typeof decision !== "boolean"){
    res.status(403).json({message : "Please Specify your answer properly"})
    return;
  }else{
    const project = await Project.findById(projectID);
    if(project.isDeleted) {
      res.status(400).json({message:"Already deleted"})
      return;
    }
    
    // true = yes delete, false = no delete
    project.isDeleted = decision ? true : false;
    project.contributingUsers_decision.push({
      id: req.user._id,
      decision
    })
    await project.save().then(
      project.isDeleted ? 
      res.status(200).json({message : "Project Deleted Successfully"}) : 
      res.status(200).json({message : "Your Response Submitted- Project Cannot be Deleted"})
    )
    
  }

})


// Project Filters // 

// By City Name //
exports.SearchByCity = asyncHandler(async (req, res, next) => {
  const city = req.body.city;
 
  const project = await Project.find({city : city});
    if(project == ""){
      res.status(200).send("No project found with this City name")
    
    } else {
    res.status(200).json(project)  
    }
})

// By Skill Name //
exports.SearchBySkill = asyncHandler(async (req, res, next) => {
  const skill = req.body.skill;
 
  const project = await Project.find({
    "implementation_steps.skillField" : {$eq : skill}
  })
 
    res.status(200).json(project)
})

// By Category Name //
exports.SearchByCategory = asyncHandler(async (req, res, next) => {
  const category = req.body.category;
  const project = await Project.find({
    category : category
  })
  if(project == ""){
    res.status(200).send("No project found with this Category name")
  } else {
  res.status(200).json(project)  
  }
})

// Find Collaborators from a Specific Skill Field //

exports.SearchCollaboratorsBySkill = asyncHandler(async (req, res, next) => {
  
  const skill = req.body.skill;

  const users = await User.find({"skills.skillField" : {$eq : skill}})
  if(users == ""){
    res.status(200).send("No Users found with this Skill name")
  } else {
  res.status(200).json(users)  
  }
  
})

// Find Collaborators from a Specific Material //

exports.SearchCollaboratorsByMaterial = asyncHandler(async (req, res, next) => {
  
  const material = req.body.material;

  const users = await User.find({material : {$in : material}})
  if(users == ""){
    res.status(200).send("No Users found with this Material name")
  } else {
  res.status(200).json(users)  
  }
  
})

// Find Collaborators from a Specific Category //

exports.SearchCollaboratorsByCategory = asyncHandler(async (req, res, next) => {
  const projectID = req.query.id;

  const project = await Project.findById(projectID);
  const projectCategory = project.category;
  const users = await User.find({interests : {$in : projectCategory}})
  if(users == ""){
    res.status(200).send("No Users found with this type of Category")
  } else {
  res.status(200).json(users)  
  }
  
})

//Project Progress // 
exports.projectProgress = asyncHandler(async (req, res, next) => {
  const projectID = req.query.id;
  const steps_Progress = [];
  var counts = {};
  
  const project = await Project.findById(projectID);
  const steps = project.implementation_steps;
  if(steps){
    steps.map(val => {
      steps_Progress.push(val.status)
      })
      const size = steps_Progress.length;
    
      for (var i = 0; i < steps_Progress.length; i++) {
        var num = steps_Progress[i];
        counts[num] = counts[num] ? counts[num] + 1 : 1;
      }
      var completed_Steps = counts["completed"];
      let result = ((completed_Steps / size)*100) || 0;
       project.progress = result + "%";
       await project.save();
      res.status(200).json({result : result + "%"});
  } else {
    project.progress = "0" + "%";
    await project.save();
    res.status(200).json({result : "0" + "%"});
  }
  
})


