const express = require("express");

const { verifyToken, verifyTokenAndAdmin } = require("../middlewares/verify");
const validateObjectId = require("../middlewares/ValidateObjectId");
const {
  getCategoryById,
  updateCategory,
  deleteCategory,
  createCategory,
  getAllCategories,
} = require("../controllers/categoriesController");

const router = express.Router();

// @route   POST /api/categories
// @desc    Create new category / Get all categories
// @access  Private (POST), Public (GET)
router
  .route("/")
  .post(verifyTokenAndAdmin, createCategory)
  .get(getAllCategories);

// @route   GET/PUT/DELETE /api/categories/:id
// @desc    Get one / Update / Delete category
// @access  GET: Public, PUT & DELETE: Private
router
  .route("/:id")
  .get(validateObjectId, getCategoryById)
  .put(validateObjectId, verifyTokenAndAdmin, updateCategory)
  .delete(validateObjectId, verifyTokenAndAdmin, deleteCategory);

module.exports = router;
