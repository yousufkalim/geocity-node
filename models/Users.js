const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Users = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    dob: Date,
    password: String,
    address: {
      street: {
        type: String,
      },
      // [long, lat]
      location: [{ type: Number }],
      zip: {
        type: String,
      },
      complement: {
        type: String,
      },
      city: {
        type: String,
      },
    },
    phone: Number,
    SIRET: Number,
    proofs: {
      KBIS: {
        type: String,
      },
      identity: {
        type: String,
      },
      profile: {
        type: String,
      },
      diploma: {
        type: String,
      },
      training: {
        type: String,
      },
      insurance: {
        type: String,
      },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "step1",
        "verified",
        "deleted",
        "active",
        "email",
        "rejected",
        "blocked",
      ],
      default: "pending",
    },
    prevStatus: {
      type: String,
      enum: [
        "pending",
        "step1",
        "verified",
        "deleted",
        "active",
        "email",
        "rejected",
        "blocked",
      ],
      default: "pending",
    },
    note: [
      {
        reason: String,
        description: String,
      },
    ],
    role: {
      enum: ["company", "user", "admin"],
      default: "user",
      type: String,
    },
    delivery: {
      vehicle: {
        vehicleType: {
          type: String,
          enum: [
            "Bike",
            "Electric bike",
            "Scooter",
            "Car",
            "Truck",
            "Large volume permit",
          ],
        },
        licence: String,
        purchaseProof: String,
      },
      transportType: { type: String, enum: ["small", "medium", "large"] },
      range: Number,
      perHour: Number,
      invitations: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "offer",
        },
      ],
    },
    company: {
      companyName: {
        type: String,
      },
      workForce: {
        type: Number,
      },
      perMonth: {
        type: Number,
      },
      openingTime: {
        type: Number,
      },
    },
    rating: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "rating",
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    timeslots: [
      {
        day: Number,
        slots: [
          {
            from: Number,
            to: Number,
          },
        ],
      },
    ],
    totalEaring: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

Users.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

Users.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
module.exports = mongoose.model("user", Users);
