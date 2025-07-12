const express = require('express');
const {
  getUserProfile,
  getUserQuestions, 
  getUserAnswers
} = require('../controllers/userController');
const { validateObjectId } = require('../middleware/validation');

const router = express.Router();

router.get('/:id', validateObjectId('id'), getUserProfile);
router.get('/:id/questions', validateObjectId('id'), getUserQuestions);
router.get('/:id/answers', validateObjectId('id'), getUserAnswers);

module.exports = router;