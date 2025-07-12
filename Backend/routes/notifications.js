const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification
} = require('../controllers/notificationController');
const { validateObjectId } = require('../middleware/validation');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All notification routes require authentication

router.route('/')
  .get(getNotifications);

router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllAsRead);

router.route('/:id')
  .delete(validateObjectId('id'), deleteNotification);

router.put('/:id/read', validateObjectId('id'), markAsRead);

module.exports = router;