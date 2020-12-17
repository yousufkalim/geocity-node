const mongoose = require("mongoose");

const InvitationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["viewProject", "inviteCollaborator", "inviteProjectOwner"],
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  projectID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: false,
  },
  skillID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Skill",
    required: false,
  },
  stepID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ImpSteps",
    required: false,
  },

  status: {
    type: String,
    enum: ["accepted", "rejected", "pending"],
    default: "pending",
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Invitation", InvitationSchema);
