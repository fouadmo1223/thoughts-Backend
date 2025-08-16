const mongoose = require("mongoose");

const validateObjectId = async (req, res, next) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({
        message: "Invalid ID",
        success: false,
        errors: { id: "Invalid ID" },
      });
  }
  next();
};

module.exports = validateObjectId;
