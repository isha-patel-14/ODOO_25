const express = require('express');
const {
  getDashboardStats,
  getAllUsers,
  toggleUserBan,
  deleteQuestion,
  deleteAnswer,
  getAllQuestions
} = require('../controllers/adminController');
const { validateObjectId } = require('../middleware/validation');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All admin routes require authentication
router.use(authorize('admin')); // All admin routes require admin role

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/questions', getAllQuestions);

router.put('/users/:id/ban', validateObjectId('id'), toggleUserBan);
router.delete('/questions/:id', validateObjectId('id'), deleteQuestion);
router.delete('/answers/:id', validateObjectId('id'), deleteAnswer);

module.exports = router;