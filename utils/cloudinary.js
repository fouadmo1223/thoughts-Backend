const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// cloudinary Upload image

const cloudinaryUploadImage = async (fileToUpload) => {
  try {
    const result = await cloudinary.uploader.upload(fileToUpload, {
      resource_type: "auto",
    });
    return result;
  } catch (err) {
    console.log(err);
    throw new Error("Image upload failed");
  }
};
// cloudinary Delete image

const cloudinaryDeleteImage = async (imagePublicId) => {
  try {
    const result = await cloudinary.uploader.destroy(imagePublicId);
    return result;
  } catch (err) {
    console.log(err);
  }
};

// cloudinary Delete Many images

const cloudinaryDeleteManyImages = async (PublicIds) => {
  try {
    const result = await cloudinary.v2.api.delete_resources(PublicIds);
    return result;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  cloudinaryUploadImage,
  cloudinaryDeleteImage,
  cloudinaryDeleteManyImages,
};
