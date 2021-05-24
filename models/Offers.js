const mongoose = require("mongoose");
const Offer = new mongoose.Schema(
  {
    start: {
      type: Number,
      minimum: 0,
      maximum: 23,
    },
    end: {
      type: Number,
      minimum: 0,
      maximum: 23,
    },
    date: Date,
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    vehicle: Array,
    volume: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "small",
    },
    requiredPerson: Number,
    price: Number,
    range: Number,
    status: {
      type: String,
      enum: ["pending", "active", "accepted", "completed", "closed", "deleted"],
      default: "pending",
    },
    deliveryMen: [
      {
        personId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        status: {
          type: String,
          enum: ["pending", "active", "started", "completed", "rejected"],
          default: "pending",
        },
        note: {
          company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
          },
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
          },
        },
      },
    ],
    desiredPersons: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
      },
    ],
    rating: Number,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("offer", Offer);
