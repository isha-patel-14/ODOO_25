const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: [20, 'Tag name cannot exceed 20 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Tag description cannot exceed 200 characters']
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
tagSchema.index({ name: 1 });
tagSchema.index({ usageCount: -1 });

module.exports = mongoose.model('Tag', tagSchema);