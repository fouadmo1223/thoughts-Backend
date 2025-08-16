const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

// Middleware to verify token
const verifyToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // contains id, username, email, isAdmin
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
});

// Middleware to verify token and user authorization (owner or admin)
const verifyTokenAndAuthorization = [
  verifyToken,
  asyncHandler(async (req, res, next) => {
    if (req.user.id === req.params.id || req.user.isAdmin) {
      if (req.user.isBlocked) {
        return res.status(403).json({ message: "User is blocked" });
      }
      next();
    } else {
      return res.status(403).json({ message: "Unauthorized" });
    }
  }),
];

// Middleware to verify token and user authorization (owner or admin)
const verifyTokenAndAdmin = [
  verifyToken,
  asyncHandler(async (req, res, next) => {
    if (req.user.isAdmin) {
      if (req.user.isBlocked) {
        return res.status(403).json({ message: "User is blocked" });
      }
      next();
    } else {
      return res.status(403).json({ message: "Unauthorized" });
    }
  }),
];

// Middleware to verify token and user authorization (owner )
// Middleware to verify token and user authorization (owner or admin)
const verifyTokenOwner = [
  verifyToken,
  asyncHandler(async (req, res, next) => {
    if (req.user.id === req.params.id) {
      if (req.user.isBlocked) {
        return res.status(403).json({ message: "User is blocked" });
      }
      next();
    } else {
      return res.status(403).json({ message: "Unauthorized" });
    }
  }),
];
module.exports = {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
  verifyTokenOwner,
};
