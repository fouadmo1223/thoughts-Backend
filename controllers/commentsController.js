const asyncHandler = require("express-async-handler");
const Comment = require("../models/Comment");
const {
  createCommentSchema,
  updateCommentSchema,
} = require("../utils/schemas");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);

/** ------------------------------------------------------
 * @desc    Create New Comment
 * @route   /api/comments
 * @access  Private (only authorizations)
 * @method  Post
 * 
 --------------------------------------------------------*/

const createNewComment = asyncHandler(async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid request body" });
  }

  const { error, value } = createCommentSchema.validate(req.body, {
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

  const { text, post } = value;
  let comment = await Comment.create({
    text,
    post: post,
    user: req.user.id,
  });

  // Populate the user info from the User model
  comment = await comment.populate("user", "username email image");
  res.status(201).json({
    message: "Comment created successfully",
    success: true,
    comment,
  });
});

/**
 * ------------------------------------------------------
 * @desc    Get All Comments with Pagination and Human Time
 * @route   GET /api/comments
 * @access  Public
 * @query   ?page=1&limit=10
 * @returns comments with user data and relative timestamps
 * ------------------------------------------------------
 */
const getAllComments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Optional filter: post ID (to get comments for a specific post)
  const postId = req.query.post;
  const query = {};
  if (postId) {
    query.post = postId;
  }

  const totalComments = await Comment.countDocuments(query);

  const comments = await Comment.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("user", "username email image") // Populate user fields
    .populate("post", "_id title") // Optional: populate post info
    .lean();

  const formattedComments = comments.map((comment) => ({
    ...comment,
    createdAtHuman: dayjs(comment.createdAt).fromNow(),
    updatedAtHuman: dayjs(comment.updatedAt).fromNow(),
  }));

  res.status(200).json({
    success: true,
    page,
    totalPages: Math.ceil(totalComments / limit),
    totalComments,
    comments: formattedComments,
    message: "Comments fetched successfully",
  });
});

/**
 * ------------------------------------------------------
 * @desc    DElete Comment
 * @route   DELETE /api/comments/:id
 * @access  Private (only authorizations)
 * @method  Delete
 * ------------------------------------------------------
 */
const deleteComment = asyncHandler(async (req, res) => {
  const { id: commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return res.status(404).json({
      success: false,
      message: "Comment not found",
    });
  }

  // Ensure the user is either the comment owner or an admin
  const isOwner = comment.user.toString() === req.user.id;
  const isAdmin = req.user.isAdmin === true;

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: You do not have permission to delete this comment.",
    });
  }

  await comment.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Comment deleted successfully",
  });
});

/** ------------------------------------------------------
 * @desc    Update Comment
 * @route   PUT /api/comments/:id
 * @access  Private (only owner or admin)
 * ------------------------------------------------------*/

const updateComment = asyncHandler(async (req, res) => {
  const commentId = req.params.id;

  // Validate the body
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      success: false,
      message: "Invalid request body",
    });
  }

  // Validate using the same schema (if re-using the create schema)
  const { error, value } = updateCommentSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const errors = {};
    error.details.forEach((err) => {
      errors[err.context.key] = err.message;
    });
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return res.status(404).json({
      success: false,
      message: "Comment not found",
    });
  }

  // Only the comment owner or an admin can update
  const isOwner = comment.user.toString() === req.user.id;
  const isAdmin = req.user.isAdmin === true;

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: You cannot update this comment",
    });
  }

  // Update comment fields
  comment.text = value.text || comment.text;

  await comment.save();

  // Populate updated comment with user info
  const updatedComment = await comment.populate("user", "username email image");

  return res.status(200).json({
    success: true,
    message: "Comment updated successfully",
    comment: updatedComment,
  });
});

module.exports = {
  createNewComment,
  getAllComments,
  deleteComment,
  updateComment,
};
