const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(), // ✅ use memory storage
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new Error("Only Images format allowed!"), false);
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  },
});

module.exports = upload;
