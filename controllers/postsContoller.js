const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const { createPostSchema, updatePostSchema } = require("../utils/schemas");
const {
  cloudinaryUploadImage,
  cloudinaryDeleteImage,
} = require("../utils/cloudinary");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);

/** ------------------------------------------------------
 * @desc    Create New Post
 * @route   /api/posts
 * @access  Private (only authoriazions)
 * @method  Post
 * 
 --------------------------------------------------------*/

const createNewPost = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ message: "No file uploaded", success: false });
  }

  const { error, value } = createPostSchema.validate(req.body, {
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

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found", success: false });
  }

  // ✅ Upload from buffer
  const result = await cloudinaryUploadImage(req.file.buffer);

  const post = await Post.create({
    title: value.title,
    description: value.description,
    image: {
      url: result.secure_url,
      publicId: result.public_id,
    },
    user: req.user.id,
    category: value.category,
  });

  res
    .status(200)
    .json({ message: "Post created successfully", success: true, post });
});

/**
 * ------------------------------------------------------
 * @desc    Get All Posts with Pagination and Human Time
 * @route   GET /api/posts
 * @access  Public
 * @query   ?page=1&limit=10
 * @returns posts with user data and relative timestamps
 * ------------------------------------------------------
 */

const getAllPosts = asyncHandler(async (req, res) => {
  // Get page and limit from query params, default to page 1 and 10 items per page
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // Calculate how many documents to skip
  const skip = (page - 1) * limit;

  const category = req.query.category;

  // Build query object (optional category)
  const query = {};
  if (category) {
    query.category = new RegExp(`^${category}$`, "i"); // case-insensitive exact match
  }

  // Count total number of posts in the collection
  const totalPosts = await Post.countDocuments(query);

  // Fetch posts with pagination, newest first, and populate user info
  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("user", "username email profileImage") // Populate only selected fields from User
    .lean(); // Make it faster by returning plain JS objects

  // Format posts with human-readable createdAt and updatedAt
  const formattedPosts = posts.map((post) => ({
    ...post,
    createdAtHuman: dayjs(post.createdAt).fromNow(),
    updatedAtHuman: dayjs(post.updatedAt).fromNow(),
  }));

  // Send response with pagination info and formatted posts
  res.status(200).json({
    success: true,
    page,
    totalPages: Math.ceil(totalPosts / limit),
    totalPosts,
    posts: formattedPosts,
    message: "Posts fetched successfully",
  });
});

/**
 * ------------------------------------------------------
 * @desc    GetPost
 * @route   GET /api/posts/:id
 * @access  Public
 *
 * ------------------------------------------------------
 */
const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate("user", "username email profileImage") // populate post author
    .populate({
      path: "comments", // assuming the field is called `comments` in the Post model
      populate: {
        path: "user",
        select: "username email image", // populate user inside each comment
      },
    })
    .populate("likes", "username email image")
    .lean(); // convert to plain JS object for better performance

  if (!post) {
    return res.status(404).json({ success: false, message: "Post not found" });
  }

  // Add human-readable timestamps
  post.createdAtHuman = dayjs(post.createdAt).fromNow();
  post.updatedAtHuman = dayjs(post.updatedAt).fromNow();

  res.status(200).json({
    success: true,
    post,
    message: "Post fetched successfully",
  });
});

/**
 * ------------------------------------------------------
 * @desc    Delete Post
 * @route   Delete /api/posts/:id
 * @access  Public
 *
 * ------------------------------------------------------
 */
const deletePostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ success: false, message: "Post not found" });
  }

  // Check if user is authorized (owner or admin)
  if (req.user.id !== post.user.toString() && !req.user.isAdmin) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // Delete the post
  const deletedPost = await Post.findByIdAndDelete(req.params.id);

  // Delete image from Cloudinary if it exists
  if (deletedPost?.image?.publicId) {
    try {
      await cloudinaryDeleteImage(deletedPost.image.publicId);
    } catch (error) {
      console.error("Cloudinary delete error:", error.message);
      // Not returning error here to still proceed with successful delete
    }
  }
  await Comment.deleteMany({ post: post._id });
  res.status(200).json({
    success: true,
    post: deletedPost,
    message: "Post deleted successfully",
  });
});

const getPostsCount = asyncHandler(async (req, res) => {
  const count = await Post.countDocuments();

  res.status(200).json({
    success: true,
    count,
    message: "Total post count fetched successfully",
  });
});

/**
 * ------------------------------------------------------
 * @desc    Update Post by ID
 * @route   PUT /api/posts/:id
 * @access  Private (owner or admin)
 * @method  PUT
 * ------------------------------------------------------
 */
const updatePostById = asyncHandler(async (req, res) => {
  // Find post
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, message: "Post not found" });
  }

  // Authorization: owner or admin
  if (req.user.id !== post.user.toString() && !req.user.isAdmin) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  let value = {};
  if (
    req.body &&
    typeof req.body === "object" &&
    Object.keys(req.body).length > 0
  ) {
    const { error, value: validated } = updatePostSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = {};
      error.details.forEach((err) => {
        errors[err.context.key] = err.message;
      });
      return res.status(400).json({
        message: "Validation failed",
        success: false,
        errors,
      });
    }

    value = validated;
  }

  // ✅ If new image uploaded, replace the old one
  if (req.file) {
    // Upload buffer directly to Cloudinary
    const result = await cloudinaryUploadImage(req.file.buffer);

    // Delete old image from Cloudinary if exists
    if (post.image?.publicId) {
      await cloudinaryDeleteImage(post.image.publicId);
    }

    post.image = {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  // ✅ Update only provided fields
  if (value.title !== undefined) post.title = value.title;
  if (value.description !== undefined) post.description = value.description;
  if (value.category !== undefined) post.category = value.category;

  const updatedPost = await post.save();

  res.status(200).json({
    success: true,
    message: "Post updated successfully",
    post: updatedPost,
  });
});


/** ------------------------------------------------------
 * @desc    Toggle Like
 * @route   /api/posts/like/:id
 * @access  Private (only authorizations)
 * @method  Put
 * 
 --------------------------------------------------------*/

const toggleLike = asyncHandler(async (req, res) => {
  let post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, message: "Post not found" });
  }

  // Check if user already liked the post
  const userIndex = post.likes.indexOf(req.user.id);
  if (userIndex > -1) {
    // User has already liked the post, remove like
    post.likes.splice(userIndex, 1);
  } else {
    // User has not liked the post, add like
    post.likes.push(req.user.id);
  }

  const updatedPost = await post.save();

  res.status(200).json({
    success: true,
    message: "Post like toggled successfully",
    post: updatedPost,
  });
});

module.exports = {
  createNewPost,
  getAllPosts,
  getPostById,
  getPostsCount,
  deletePostById,
  updatePostById,
  toggleLike,
};
