const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../images"));
  },
  filename: function (req, file, cb) {
    if (file) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  },
});

// photo upload middleware
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb({ message: "Only Images format allowed!", success: false });
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 2, // 5MB
  },
});

module.exports = upload;
