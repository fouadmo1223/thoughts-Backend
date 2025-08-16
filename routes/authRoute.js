const router = require("express").Router();

const {
  registerUserController,
  loginUserController,
  verifyUserController,
} = require("../controllers/authContoller");

router.post("/register", registerUserController);
router.post("/login", loginUserController);
router.get("/:userId/verfiy/:token", verifyUserController);

module.exports = router;
