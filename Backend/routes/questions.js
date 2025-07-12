const express = require('express');
const {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getPopularTags
} = require('../controllers/questionController');
const {
  validateQuestion,
  validateObjectId,
  validateQuestionQuery
} = require('../middleware/validation');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(validateQuestionQuery, optionalAuth, getQuestions)
  .post(protect, validateQuestion, createQuestion);

router.get('/tags', getPopularTags);

router.route('/:id')
  .get(validateObjectId('id'), optionalAuth, getQuestion)
  .put(validateObjectId('id'), protect, validateQuestion, updateQuestion)
  .delete(validateObjectId('id'), protect, deleteQuestion);

module.exports = router;