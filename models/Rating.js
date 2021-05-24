const mongoose = require("mongoose");

const Ratings = new mongoose.Schema(
  {
    rating: [
      {
        byUserId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        offerId: { type: mongoose.Schema.Types.ObjectId, ref: "offer" },
        strength: Number,
        note: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("rating", Ratings);
