const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    image: {
      type: Object,
      default: {
        url: "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg", // Replace with actual default if needed
        publicId: null,
      },
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "description is required"],
      trim: true,
      maxlength: [500, "description cannot exceed 500 characters"],
      minlength: [5, "description must be at least 10 characters"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Post must be associated with a user"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [100, "Category cannot exceed 100 characters"],
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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

PostSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "post",
  justOne: false,
});

module.exports = mongoose.model("Post", PostSchema);
