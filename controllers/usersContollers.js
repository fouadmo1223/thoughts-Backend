const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const { createUserSchema, updateUserSchema } = require("../utils/schemas");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const {
  cloudinaryUploadImage,
  cloudinaryDeleteImage,
  cloudinaryDeleteManyImages,
} = require("../utils/cloudinary");
/** ------------------------------------------------------
 * @desc    Get All Users Profile
 * @route   /api/users
 * @access  Private (only admin)
 * @method  Get
 * 
 --------------------------------------------------------*/

const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Default to page 1 if not specified
  const limit = 10; // 10 items per page
  const skip = (page - 1) * limit; // Calculate how many items to skip

  const [users, total] = await Promise.all([
    User.find({ _id: { $ne: req.user.id } })
      .skip(skip)
      .limit(limit)
      .select("-password -__v"),
    User.countDocuments({ _id: { $ne: req.user.id } }), // Get total count of books
  ]);

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    users,
    currentPage: page,
    totalPages,
    total,
    message: "Users retrived successfully",
    success: true,
  });
});

/** ------------------------------------------------------
 * @desc    Get All Users Count
 * @route   /api/users/count
 * @access  Private (only admin)
 * @method  Get
 * 
 --------------------------------------------------------*/

const getUsersCount = asyncHandler(async (req, res) => {
  const total = await User.countDocuments(); // Get total count of books

  res.status(200).json({
    total,
    message: "Users retrived successfully",
    success: true,
  });
});

/** ------------------------------------------------------
 * @desc    Get  My Profile
 * @route   /api/user/profile
 * @access  Private ( user)
 * @method  Get
 * 
 --------------------------------------------------------*/

const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select("-password -__v")
    .populate("posts");
  if (user) {
    if (user.id === req.user.id) {
      res
        .status(200)
        .json({ user, message: "User retrived successfully", success: true });
    } else {
      res.status(403).json({ message: "Unauthorized", success: false });
    }
  } else {
    res.status(404).json({ message: "User not found", success: false });
  }
});

/** ------------------------------------------------------
 * @desc    Get  User Profile
 * @route   /api/user/profile/:id
 * @access  Public
 * @method  Get
 * 
 --------------------------------------------------------*/

const getUserProfileById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const user = await User.findById(req.params.id)
    .select("-password -__v")
    .populate({
      path: "posts",
      populate: [
        {
          path: "user", // the post's author
          select: "username profileImage",
        },
        {
          path: "comments",
          populate: {
            path: "user", // the comment's author
            select: "username profileImage",
          },
        },
      ],
    });
  if (user) {
    res
      .status(200)
      .json({ user, message: "User retrived successfully", success: true });
  } else {
    res.status(404).json({ message: "User not found", success: false });
  }
});

/** ------------------------------------------------------
 * @desc    Update  User Profile
 * @route   /api/user/profile/:id
 * @access  Private (Owner)
 * @method  Put
 * 
 --------------------------------------------------------*/

const updateUserProfile = asyncHandler(async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid request body" });
  }

  const { error, value } = updateUserSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const errors = {};
    error.details.forEach((err) => {
      errors[err.context.key] = err.message;
    });
    return res
      .status(400)
      .json({ message: "Invalid request body", success: false, errors });
  }

  // Hash password if it needs to be updated
  if (value.password) {
    const salt = await bcrypt.genSalt(10);
    value.password = await bcrypt.hash(value.password, salt);
  }

  let user = await User.findById(req.params.id);
  if (user) {
    user = await User.findByIdAndUpdate(req.user.id, value, {
      new: true,
    }).select("-password -__v");

    res
      .status(200)
      .json({ user, message: "User updated successfully", success: true });
  } else {
    res.status(404).json({ message: "User not found", success: false });
  }
});

/**
 * ------------------------------------------------------
 * @desc    Upload User Image
 * @route   /api/users/profile/image
 * @access  Private (Owner)
 * @method  POST
 * --------------------------------------------------------
 */
const uploadUserImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ message: "No file uploaded", success: false });
  }

  // ✅ Upload directly from memory (buffer)
  const result = await cloudinaryUploadImage(req.file.buffer);

  const user = await User.findById(req.user.id);
  if (!user) {
    return res
      .status(404)
      .json({ message: "User not found", success: false });
  }

  // ✅ Delete old Cloudinary image if exists
  if (user.profileImage?.publicId) {
    await cloudinaryDeleteImage(user.profileImage.publicId);
  }

  // ✅ Save new Cloudinary image
  user.profileImage = {
    url: result.secure_url,
    publicId: result.public_id,
  };
  await user.save();

  res.status(200).json({
    message: "Image uploaded successfully",
    success: true,
    profileImage: result.secure_url,
  });
});


/** ------------------------------------------------------
 * @desc    Delete  User Profile
 * @route   /api/users/profile/:id
 * @access  Private (Owner,admin)
 * @method  Delete
 * 
 --------------------------------------------------------*/

const deleteUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found", success: false });
  }

  // Delete user's profile image if uploaded to cloudinary
  if (user.profileImage?.publicId) {
    await cloudinaryDeleteImage(user.profileImage.publicId);
  }

  // Find posts created by the user
  const posts = await Post.find({ user: user._id });

  // Delete all images in those posts from cloudinary
  const publicIds = posts.map((post) => post.image?.publicId).filter(Boolean);
  if (publicIds.length > 0) {
    await cloudinaryDeleteManyImages(publicIds);
  }

  // Delete all comments on those posts
  const postIds = posts.map((post) => post._id);
  if (postIds.length > 0) {
    await Comment.deleteMany({ post: { $in: postIds } });
  }

  // Delete user's posts and comments
  await Post.deleteMany({ user: user._id });
  await Comment.deleteMany({ user: user._id });

  // Finally, delete the user
  await User.findByIdAndDelete(user._id);

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
    user,
  });
});

/** ------------------------------------------------------
 * @desc    Toggle  User block
 * @route   /api/user/block/:id
 * @access  Private (Owner)
 * @method  PUT
 * 
 --------------------------------------------------------*/
const toggleUserBlock = asyncHandler(async (req, res) => {
  let user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  if (user.id === req.user.id) {
    return res
      .status(400)
      .json({ success: false, message: "You can not block yourself" });
  }
  if (user.isBlocked) {
    user.isBlocked = false;
    user.save();
    return res
      .status(200)
      .json({ success: true, message: "User unblocked successfully" });
  } else {
    user.isBlocked = true;
    user.save();
    return res
      .status(200)
      .json({ success: true, message: "User blocked successfully" });
  }
});

const verifyUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (user.isAccountVerfied) {
    return res
      .status(400)
      .json({ success: false, message: "User is already verified" });
  }

  user.isAccountVerfied = true;
  await user.save();

  res.status(200).json({
    success: true,
    message: "User verified successfully",
  });
});

module.exports = {
  getAllUsers,
  getMyProfile,
  getUserProfileById,
  updateUserProfile,
  getUsersCount,
  uploadUserImage,
  deleteUserProfile,
  toggleUserBlock,
  verifyUser,
};
