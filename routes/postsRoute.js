const { valid } = require("joi");
const {
  createNewPost,
  getAllPosts,
  getPostById,
  getPostsCount,
  deletePostById,
  updatePostById,
  toggleLike,
} = require("../controllers/postsContoller");
const upload = require("../middlewares/photoUpload");
const { verifyToken, verifyTokenAndAdmin } = require("../middlewares/verify");
const validateObjectId = require("../middlewares/ValidateObjectId");

const router = require("express").Router();

router
  .route("/")
  .post(verifyToken, upload.single("image"), createNewPost)
  .get(getAllPosts);

router
  .route("/:id")
  .get(validateObjectId, getPostById)
  .put(validateObjectId, verifyToken, upload.single("image"), updatePostById)
  .delete(validateObjectId, verifyToken, deletePostById);

router.put("/like/:id", validateObjectId, verifyToken, toggleLike);
router.get("/posts-count", getPostsCount);

module.exports = router;
