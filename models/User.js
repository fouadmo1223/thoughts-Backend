const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: [2, "Username must be at least 2 characters"],
      maxlength: [200, "Username cannot exceed 200 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: [true, "Email is used before"],

      minlength: [3, "Email must be at least 3 characters"],
      maxlength: [100, "Email cannot exceed 100 characters"],
      validate: {
        validator: function (value) {
          // must have @ and ., and at least one word after the last dot
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: "Enter a valid E-Mail ",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
      minlength: [6, "Password must be at least 6 characters"],
      validate: {
        validator: function (value) {
          // at least one digit and one special character
          return /[0-9]/.test(value) && /[!@#$%^&*(),.?":{}|<>]/.test(value);
        },
        message:
          "Password must contain at least one number and one special character",
      },
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isAccountVerfied: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: Object,
      default: {
        url: "https://media.istockphoto.com/id/1433039224/photo/blue-user-3d-icon-person-profile-concept-isolated-on-white-background-with-social-member.jpg?s=612x612&w=0&k=20&c=nrJ6RZ8Ft4vHECnRjBGBK_9XJ7f_lsi3dJjj_uAlkT8=", // Replace with your actual default image URL
        publicId: null,
      },
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [300, "Bio cannot exceed 300 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false, // Exclude the __v field
    },
    toObject: { virtuals: true },
  }
);

// GET POst Belongs To User

UserSchema.virtual("posts", {
  ref: "Post",
  localField: "_id",
  foreignField: "user",
  justOne: false,
});

module.exports = mongoose.model("User", UserSchema);
