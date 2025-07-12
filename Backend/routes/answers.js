const express = require('express');
const {
  createAnswer,
  updateAnswer,
  deleteAnswer,
  voteAnswer,
  acceptAnswer
} = require('../controllers/answerController');
const {
  validateAnswer,
  validateObjectId
} = require('../middleware/validation');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, validateAnswer, createAnswer);

router.route('/:id')
  .put(validateObjectId('id'), protect, validateAnswer, updateAnswer)
  .delete(validateObjectId('id'), protect, deleteAnswer);

router.post('/:id/vote', validateObjectId('id'), protect, voteAnswer);
router.post('/:id/accept', validateObjectId('id'), protect, acceptAnswer);

module.exports = router;