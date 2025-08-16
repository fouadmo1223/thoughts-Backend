const asyncHandler = require("express-async-handler");
const Category = require("../models/Category");
const User = require("../models/User");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../utils/schemas");

// ------------------------------------------------------
// @desc    Create New Category
// @route   POST /api/categories
// @access  Private
// ------------------------------------------------------
const createCategory = asyncHandler(async (req, res) => {
  const { error, value } = createCategorySchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const errors = {};
    error.details.forEach((err) => {
      errors[err.context.key] = err.message;
    });
    return res
      .status(400)
      .json({ message: "Invalid input", success: false, errors });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found", success: false });
  }

  const categoryExists = await Category.findOne({ title: value.title });
  if (categoryExists) {
    return res
      .status(400)
      .json({ message: "Category title already exists", success: false });
  }

  const category = await Category.create({
    user: req.user.id,
    title: value.title,
  });

  res.status(201).json({
    message: "Category created successfully",
    success: true,
    category,
  });
});

// ------------------------------------------------------
// @desc    Get All Categories
// @route   GET /api/categories
// @access  Public
// ------------------------------------------------------
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().populate(
    "user",
    "username email image"
  );
  res.status(200).json({ success: true, categories });
});

// ------------------------------------------------------
// @desc    Get One Category by ID
// @route   GET /api/categories/:id
// @access  Public
// ------------------------------------------------------
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).populate(
    "user",
    "username email image"
  );
  if (!category) {
    return res
      .status(404)
      .json({ message: "Category not found", success: false });
  }
  res.status(200).json({ success: true, category });
});

// ------------------------------------------------------
// @desc    Update Category
// @route   PUT /api/categories/:id
// @access  Private
// ------------------------------------------------------
const updateCategory = asyncHandler(async (req, res) => {
  const { error, value } = updateCategorySchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const errors = {};
    error.details.forEach((err) => {
      errors[err.context.key] = err.message;
    });
    return res
      .status(400)
      .json({ message: "Invalid input", success: false, errors });
  }

  const category = await Category.findById(req.params.id);

  if (!category) {
    return res
      .status(404)
      .json({ message: "Category not found", success: false });
  }

  if (value.title) {
    const exists = await Category.findOne({ title: value.title });
    if (exists && exists._id.toString() !== req.params.id) {
      return res
        .status(400)
        .json({ message: "Title already in use", success: false });
    }
    category.title = value.title;
  }

  await category.save();
  res.status(200).json({
    message: "Category updated successfully",
    success: true,
    category,
  });
});

// ------------------------------------------------------
// @desc    Delete Category
// @route   DELETE /api/categories/:id
// @access  Private
// ------------------------------------------------------
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res
      .status(404)
      .json({ message: "Category not found", success: false });
  }

  await category.deleteOne();
  res
    .status(200)
    .json({ message: "Category deleted successfully", success: true });
});

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
