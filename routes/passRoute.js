const express = require("express");
const {
  sendPasswordLink,
  checkResetToken,
  resetPassword,
} = require("../controllers/passwordContoller");

const router = express.Router();

// Send password reset link
router.post("/link", sendPasswordLink);

// Check if reset token is valid
router.get("/check/:userId/:token", checkResetToken);

// Reset password
router.post("/reset/:userId/:token", resetPassword);

module.exports = router;
