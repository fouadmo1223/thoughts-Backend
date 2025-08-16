const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  title: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    minlength: [1, "title must be at least 1 character"],
    maxlength: [100, "title cannot exceed 500 characters"],
  },
});

module.exports = mongoose.model("Category", categorySchema);
