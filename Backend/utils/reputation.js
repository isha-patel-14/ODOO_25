const User = require('../models/User');

const updateReputation = async (userId, action) => {
  try {
    const reputationChanges = {
      'answer_upvote': 10,
      'answer_downvote': -2,
      'question_upvote': 5,
      'question_downvote': -2,
      'answer_accepted': 15,
      'accept_answer': 2
    };

    const change = reputationChanges[action] || 0;
    
    if (change !== 0) {
      await User.findByIdAndUpdate(
        userId,
        { $inc: { reputation: change } },
        { new: true }
      );
    }
  } catch (error) {
    console.error('Error updating reputation:', error);
  }
};

const awardBadge = async (userId, badgeName) => {
  try {
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { badges: badgeName } },
      { new: true }
    );
  } catch (error) {
    console.error('Error awarding badge:', error);
  }
};

module.exports = {
  updateReputation,
  awardBadge
};