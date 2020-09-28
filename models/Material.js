const mongoose = require("mongoose");

const MaterialSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  material: [
    {
      type: String,
      required: false,
    },
  ],
  isDeleted: {
    type: Boolean,
    required: false,
    default: false,
  },
});

module.exports = mongoose.model("Material", MaterialSchema);
