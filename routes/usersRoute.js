const router = require("express").Router();

const {
  getAllUsers,
  getMyProfile,
  getUserProfileById,
  updateUserProfile,
  getUsersCount,
  uploadUserImage,
  deleteUserProfile,
  toggleUserBlock,
  verifyUser,
} = require("../controllers/usersContollers");
const upload = require("../middlewares/photoUpload");
const validateObjectId = require("../middlewares/ValidateObjectId");
const {
  verifyTokenAndAdmin,
  verifyTokenAndAuthorization,
  verifyTokenOwner,
  verifyToken,
} = require("../middlewares/verify");

router.get("/", verifyTokenAndAdmin, getAllUsers);
router.get("/count", verifyTokenAndAdmin, getUsersCount);
router.get("/profile", verifyToken, getMyProfile);
router.get("/profile/:id", validateObjectId, getUserProfileById);
router.delete(
  "/profile/:id",
  validateObjectId,
  verifyTokenAndAuthorization,
  deleteUserProfile
);
router.put(
  "/profile/:id",
  validateObjectId,
  verifyTokenAndAuthorization,
  updateUserProfile
);
router.put(
  "/block/:id",
  validateObjectId,
  verifyTokenAndAdmin,
  toggleUserBlock
);
router.post(
  "/profile/image",
  verifyToken,
  upload.single("image"),
  uploadUserImage
);
router.put("/verify/:id", verifyTokenAndAdmin, verifyUser);

module.exports = router;
