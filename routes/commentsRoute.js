const router = require("express").Router();
const Comment = require("../models/Comment");
const {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndAuthorization,
} = require("../middlewares/verify");
const {
  createNewComment,
  deleteComment,
  updateComment,
} = require("../controllers/commentsController");
const { getAllComments } = require("../controllers/commentsController");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
const validateObjectId = require("../middlewares/ValidateObjectId");
dayjs.extend(relativeTime);

router
  .route("/")
  .post(verifyToken, createNewComment)
  .get(verifyToken, getAllComments);

router
  .route("/:id")
  .put(validateObjectId, verifyToken, updateComment)
  .delete(validateObjectId, verifyToken, deleteComment);

module.exports = router;
