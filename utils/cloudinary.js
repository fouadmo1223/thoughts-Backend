const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Upload Buffer instead of file path
const cloudinaryUploadImage = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// Delete single image
const cloudinaryDeleteImage = async (imagePublicId) => {
  try {
    return await cloudinary.uploader.destroy(imagePublicId);
  } catch (err) {
    console.log(err);
  }
};

// Delete many
const cloudinaryDeleteManyImages = async (PublicIds) => {
  try {
    return await cloudinary.api.delete_resources(PublicIds);
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  cloudinaryUploadImage,
  cloudinaryDeleteImage,
  cloudinaryDeleteManyImages,
};
