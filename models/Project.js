const mongoose = require("mongoose");

const ImpStepSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  tradeName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Skill",
  },
  speciality: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ["completed", "ongoing", "nothing"],
    default: "ongoing",
    required: false,
  },
  material: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Material",
    required: false,
  },
  contributing_user: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

module.exports = mongoose.model("ImpSteps", ImpStepSchema);

/// Project Schema ///

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false,
  },

  type: {
    type: String,
    enum: ["Public", "Private"],
    default: "Public",
    required: false,
  },

  stage: {
    type: String,
    enum: ["completed", "ongoing", "nothing"],
    default: "ongoing",
    required: false,
  },

  general_photo: {
    type: String,
    required: false,
    default: "default.png",
  },

  general_description: {
    type: String,
    required: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  isDeleted: {
    type: Boolean,
    default: false,
    required: false,
  },

  project_owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  likedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  ],
  invitation: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Invitation",
    required: false,
  },
  implementation_steps: [ImpStepSchema],
});

module.exports = mongoose.model("Project", ProjectSchema);
