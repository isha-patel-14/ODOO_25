const express = require('express');
const {
  signup,
  login,
  getMe,
  updateProfile
} = require('../controllers/authController');
const {
  validateSignup,
  validateLogin
} = require('../middleware/validation');
const { protect, guestViewOnly } = require('../middleware/auth');

const router = express.Router();


router.post('/signup', signup); // allow guest signup without validation
router.post('/login', login); // allow guest login without validation
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);


// Protect profile routes, but allow guests to only view
router.get('/me', protect, guestViewOnly, getMe);
router.put('/profile', protect, guestViewOnly, updateProfile);

module.exports = router; 