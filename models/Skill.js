const mongoose = require("mongoose");

const SkillSchema = new mongoose.Schema({
  tradeName: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("Skill", SkillSchema);
