const mongoose = require("mongoose");

const SkillSchema = new mongoose.Schema({
  tradeName: {
    type: String,
    required: false,
  },
  isDeleted: {
    type: Boolean,
    required: false,
    default: false,
  },
});

module.exports = mongoose.model("Skill", SkillSchema);
