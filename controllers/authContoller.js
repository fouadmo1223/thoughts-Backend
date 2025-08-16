const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createUserSchema, loginUserSchema } = require("../utils/schemas");
const VerficationToken = require("../models/VerficationToken");
const crypto = require("crypto");
const { sendEmail } = require("../utils/sendEmail");

const mongoose = require("mongoose");
/** ------------------------------------------------------
 * @desc    Register new user
 * @route   /api/auth/register
 * @access  Public
 * @method  POST
 * 
 --------------------------------------------------------*/

const registerUserController = asyncHandler(async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid request body" });
  }

  const { error, value } = createUserSchema.validate(req.body, {
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

  const findUser = await User.findOne({ email: value.email });
  if (findUser) {
    return res
      .status(400)
      .json({ message: "Email is used before", success: false });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(value.password, salt);
  let user = await User.create({
    username: value.username,
    email: value.email,
    password: hashedPassword,
  });
  user = user.toObject();

  // Remove sensitive or unwanted fields
  delete user.password;
  delete user.__v;
  delete user.createdAt;
  delete user.updatedAt;

  const verficationToken = new VerficationToken({
    userId: user._id,
    token: crypto.randomBytes(32).toString("hex"),
  });
  await verficationToken.save();

  let link = `${process.env.CLIENT_URL}/verfiy-email/${verficationToken.userId}/verfiy/${verficationToken.token}`;

  let html = `
<div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border-radius: 10px; background-color: #f9f9f9; color: #333;">
  <h2 style="color: #4a90e2; text-align: center;">Verify Your Email ✉️</h2>
  <p style="font-size: 16px;">Hey there,</p>
  <p style="font-size: 16px;">Thanks for joining <strong>My Blog</strong>! To start exploring posts and sharing your thoughts, please confirm your email by clicking the button below:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${link}" style="background-color: #4a90e2; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
      ✅ Verify My Email
    </a>
  </div>
  
  <p style="font-size: 14px; color: #555;">If the button doesn’t work, copy and paste this link into your browser:</p>
  <p style="word-break: break-all; font-size: 14px;"><a href="${link}" style="color: #4a90e2;">${link}</a></p>
  
  <p style="margin-top: 30px; font-size: 14px; color: #777;">If you didn’t sign up for My Blog, you can safely ignore this message.</p>
  
  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
  <p style="font-size: 12px; color: #aaa; text-align: center;">&copy; ${new Date().getFullYear()} My Blog. All rights reserved.</p>
</div>
`;

  await sendEmail(user.email, "Verify Your Email", html);

  res.status(201).json({
    message: "We Sent you an Email , please check your inbox",
    success: true,
    user,
  });
});

/** ------------------------------------------------------
 * @desc    Login  user
 * @route   /api/auth/login
 * @access  Public
 * @method  POST
 * 
 --------------------------------------------------------*/

const loginUserController = asyncHandler(async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid request body" });
  }
  const { error, value } = loginUserSchema.validate(req.body, {
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

  let user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res
      .status(400)
      .json({ message: "Invalid email or password", success: false });
  }

  const isMatch = await bcrypt.compare(req.body.password, user.password);
  if (!isMatch) {
    return res
      .status(400)
      .json({ message: "Invalid email or password", success: false });
  }

  if (user.isBlocked) {
    return res.status(400).json({ message: "You Are Blocked " });
  }
  if (!user.isAccountVerfied) {
    return res
      .status(400)
      .json({ message: "Please verify your email first", success: false });
  }

  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  user = user.toObject();
  user.token = token;
  // Remove sensitive or unwanted fields
  delete user.password;
  delete user.__v;
  delete user.createdAt;
  delete user.updatedAt;
  res
    .status(200)
    .json({ message: "User logged in successfully", success: true, user });
});

/** ------------------------------------------------------
 * @desc    Verify user email
 * @route   /api/auth/:userId/verfiy/:token
 * @access  Public
 * @method  GET
 --------------------------------------------------------*/

const verifyUserController = asyncHandler(async (req, res) => {
  const { userId, token } = req.params;

  // 1️⃣ Validate params
  if (!userId || !token) {
    return res.status(400).json({
      success: false,
      message: "Invalid verification link: Missing parameters",
    });
  }

  // 2️⃣ Check ObjectId format
  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID format",
    });
  }

  // 3️⃣ Find user
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // 4️⃣ Already verified?
  if (user.isAccountVerfied) {
    return res.status(400).json({
      success: false,
      message: "Email is already verified",
    });
  }

  // 5️⃣ Find token
  const verificationToken = await VerficationToken.findOne({
    userId: user._id,
    token: token.trim(),
  });
  if (!verificationToken) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired verification link",
    });
  }

  // 6️⃣ Mark as verified
  user.isAccountVerfied = true; // ← match your schema’s actual field name
  await user.save();

  // 7️⃣ Remove token
  await VerficationToken.deleteOne({ _id: verificationToken._id });

  res.status(200).json({
    success: true,
    message: "✅ Email verified successfully. You can now log in.",
  });
});

module.exports = {
  registerUserController,
  loginUserController,
  verifyUserController,
};
