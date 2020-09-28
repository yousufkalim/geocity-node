const mongoose = require("mongoose");

const InvitationSchema = new mongoose.Schema({
  requesterID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  receiverID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  projectID: {
    requesterID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
  },
  skillID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Skill",
  },

  status: {
    enum: ["accepted", "rejected", "pending"],
    default: "pending",
    required: false,
  },
});

module.exports = mongoose.model("Invitation", InvitationSchema);
