const mongoose = require("mongoose");

const SkillSchema = new mongoose.Schema({
  tradename: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("Skill", SkillSchema);
