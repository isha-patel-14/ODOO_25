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
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;