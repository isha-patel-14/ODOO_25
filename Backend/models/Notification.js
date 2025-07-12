const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['answer', 'mention', 'accepted_answer', 'vote']
  },
  content: {
    type: String,
    required: [true, 'Notification content is required'],
    maxlength: [500, 'Content cannot exceed 500 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  linkTo: {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    answer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer'
    }
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);