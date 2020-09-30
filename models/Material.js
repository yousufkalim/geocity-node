const mongoose = require("mongoose");

const MaterialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  isDeleted: {
    type: Boolean,
    required: false,
    default: false,
  },
});

module.exports = mongoose.model("Material", MaterialSchema);
