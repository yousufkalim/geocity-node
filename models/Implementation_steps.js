const mongoose = require("mongoose");

const ImpStepSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  tradeName: {
    type: String,
    required: false,
  },
  speciality: {
    type: String,
    required: false,
  },
  status: {
    enum: ["completed", "ongoing", "nothing"],
    default: "ongoing",
    required: false,
  },
  contributing_user: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

module.exports = mongoose.model("Project", ImpStepSchema);
