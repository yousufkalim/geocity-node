const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ProjectDecision = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  contributer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Decision", ProjectDecision);

// USERS SCHEMA
const UserSchema = new mongoose.Schema({
  
  status: {
    type: String,
    enum: ["active", "deactive"],
    default: "deactive",
  },
  username: {
    type: String,
    required: false,
  },
  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },

  facebook: {
    type: String,
    required: false,
  },
  instagram: {
    type: String,
    required: false,
  },
  youtube: {
    type: String,
    required: false,
  },

  email: {
    type: String,
    required: false,
  },
  city: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: false,
  },
  zipCode: {
    type: String,
    required: false,
  },
  latitude: {
    type: String,
    required: false,
  },
  longitude: {
    type: String,
    required: false,
  },
  profile_picture: {
    type: String,
    required: false,
    default: "default.png",
  },
  profile_description: {
    type: String,
    required: false,
  },
  phone: {
    type: Number,
    required: false,
  },
  isProjectOwner: {
    type: Boolean,
    required: false,
    default: false,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  password: {
    type: String,
    required: false,
    select: false,
  },
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },

      comment: {
        type: String,
        required: false,
      },

      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  notifications: [
    {
      title: String,
      description: String,
      statusNew: { type: Boolean, default: true },
      projectID: {
        type: String,
        required: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  availability: {
    type: String,
    required: false,
  },

  resetPasswordToken: String,
  restPasswordExpires: Date,
  verifyEmailToken: String,
  emailVerificationExpiresIn: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  material: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: false,
    },
  ],
  interests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: false,
    },
  ],
  invitation: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invitation",
      required: false,
    },
  ],
  projects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },
  ],
  skills: [
    {
      skillField: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
      },
      skill: {
        type: String,
        required: false,
      },
      specialization: {
        type: String,
        required: false,
      },
      score: {
        type: Number,
        required: false,
      },
      recommendedBy: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        required: false,
      },
    },
  ],
});

//Encrypt Password
UserSchema.pre("save", async function () {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

//sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

//Check user entered password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
module.exports = mongoose.model("User", UserSchema);
