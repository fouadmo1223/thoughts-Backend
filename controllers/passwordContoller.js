const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validatePassword, vaidateEmail } = require("../utils/schemas");
const VerficationToken = require("../models/VerficationToken");
const crypto = require("crypto");
const { sendEmail } = require("../utils/sendEmail");
const mongoose = require("mongoose");

/** ------------------------------------------------------
 * @desc    Send reset pass link
 * @route   /api/password/link
 * @access  Public
 * @method  POST
 * 
 --------------------------------------------------------*/

const sendPasswordLink = asyncHandler(async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid request body" });
  }

  const { error, value } = vaidateEmail.validate(req.body, {
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

  const user = await User.findOne({ email: value.email });
  if (!user) {
    return res.status(404).json({
      message: "User not found",
      success: false,
    });
  }

  let token = await VerficationToken.findOne({ userId: user._id });
  if (!token) {
    token = await VerficationToken.create({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    });
  } else {
    token.token = crypto.randomBytes(32).toString("hex");
    await token.save();
  }

  const resetLink = `${process.env.CLIENT_URL}/new-password/${user._id}/${token.token}`;

  const message = `<h1>Hello ${user.username},</h1>
                   <p>Click the link below to reset your password:</p>
                   <a href="${resetLink}">Reset Password</a>`;

  try {
    await sendEmail(user.email, "Password Reset Link", message);
    return res.status(200).json({
      message: "Password reset link sent successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to send email",
      success: false,
      error: error.message,
    });
  }
});

/** ------------------------------------------------------
 * @desc    Check if reset token is valid
 * @route   GET /api/password/check/:userId/:token
 * @access  Public
 --------------------------------------------------------*/
const checkResetToken = asyncHandler(async (req, res) => {
  const { userId, token } = req.params;

  // Validate ObjectId format
  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID format",
    });
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Check if token exists
  const verificationToken = await VerficationToken.findOne({ userId, token });
  if (!verificationToken) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Token is valid",
  });
});

/** ------------------------------------------------------
 * @desc    Reset user password
 * @route   POST /api/password/reset/:userId/:token
 * @access  Public
 --------------------------------------------------------*/
const resetPassword = asyncHandler(async (req, res) => {
  const { userId, token } = req.params;

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      success: false,
      message: "Invalid request body",
    });
  }

  // Validate password using Joi schema
  const { error, value } = validatePassword.validate(req.body, {
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

  // Check ObjectId format
  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID format",
    });
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Check token
  const verificationToken = await VerficationToken.findOne({ userId, token });
  if (!verificationToken) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  // Hash and update password
  const hashedPassword = await bcrypt.hash(value.password, 10);
  user.password = hashedPassword;
  await user.save();

  // Delete token after use
  await VerficationToken.deleteOne({ _id: verificationToken._id });

  return res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});

module.exports = {
  sendPasswordLink,
  resetPassword,
  checkResetToken,
};
