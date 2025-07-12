const express = require('express');
const { uploadImage, deleteImage } = require('../controllers/uploadController');
const { upload } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All upload routes require authentication

router.post('/image', upload.single('image'), uploadImage);
router.delete('/image/:publicId', deleteImage);

module.exports = router;