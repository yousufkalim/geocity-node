const mongoose = require("mongoose");

const SkillSchema = new mongoose.Schema({
  skillField: {
    type: String,
    required: false,
  },
  skill : [{
    
      type : String,
      required : false
  }],
  isDeleted: {
    type: Boolean,
    required: false,
    default: false,
  },
});

module.exports = mongoose.model("Skill", SkillSchema);
