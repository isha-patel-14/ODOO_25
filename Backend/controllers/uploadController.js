const { cloudinary } = require('../config/cloudinary');

// @desc    Upload image
// @route   POST /api/upload/image
// @access  Private
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        url: req.file.path,
        publicId: req.file.filename
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete image
// @route   DELETE /api/upload/image/:publicId
// @access  Private
const deleteImage = async (req, res, next) => {
  try {
    const { publicId } = req.params;

    await cloudinary.uploader.destroy(publicId);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadImage,
  deleteImage
};