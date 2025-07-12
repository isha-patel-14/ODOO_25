const Answer = require('../models/Answer');
const Question = require('../models/Question');
const { updateReputation } = require('../utils/reputation');
const { notifyAnswerReceived, notifyAnswerAccepted } = require('../utils/notifications');

// @desc    Create new answer
// @route   POST /api/answers
// @access  Private
const createAnswer = async (req, res, next) => {
  try {
    const { content, questionId } = req.body;

    // Check if question exists
    const question = await Question.findOne({
      _id: questionId,
      isDeleted: false
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Create answer
    const answer = await Answer.create({
      content,
      author: req.user.id,
      question: questionId
    });

    // Add answer to question
    await Question.findByIdAndUpdate(
      questionId,
      { $push: { answers: answer._id } }
    );

    // Populate answer data
    const populatedAnswer = await Answer.findById(answer._id)
      .populate('author', 'username reputation badges avatar');

    // Send notification to question author
    await notifyAnswerReceived(
      question.author,
      req.user.id,
      questionId,
      answer._id
    );

    res.status(201).json({
      success: true,
      data: {
        answer: populatedAnswer
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update answer
// @route   PUT /api/answers/:id
// @access  Private
const updateAnswer = async (req, res, next) => {
  try {
    let answer = await Answer.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Make sure user is answer owner or admin
    if (answer.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this answer'
      });
    }

    answer = await Answer.findByIdAndUpdate(
      req.params.id,
      { content: req.body.content },
      {
        new: true,
        runValidators: true
      }
    ).populate('author', 'username reputation badges avatar');

    res.status(200).json({
      success: true,
      data: {
        answer
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete answer
// @route   DELETE /api/answers/:id
// @access  Private
const deleteAnswer = async (req, res, next) => {
  try {
    const answer = await Answer.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Make sure user is answer owner or admin
    if (answer.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this answer'
      });
    }

    // Soft delete
    await Answer.findByIdAndUpdate(req.params.id, { isDeleted: true });

    // Remove from question answers array
    await Question.findByIdAndUpdate(
      answer.question,
      { $pull: { answers: req.params.id } }
    );

    // If this was the accepted answer, remove it
    await Question.findOneAndUpdate(
      { acceptedAnswer: req.params.id },
      { $unset: { acceptedAnswer: 1 } }
    );

    res.status(200).json({
      success: true,
      message: 'Answer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vote on answer
// @route   POST /api/answers/:id/vote
// @access  Private
const voteAnswer = async (req, res, next) => {
  try {
    const { voteType } = req.body; // 'upvote' or 'downvote'
    const answerId = req.params.id;
    const userId = req.user.id;

    const answer = await Answer.findOne({
      _id: answerId,
      isDeleted: false
    });

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Can't vote on own answer
    if (answer.author.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot vote on your own answer'
      });
    }

    // Check if user has already voted
    const existingVote = answer.hasUserVoted(userId);

    if (existingVote === voteType) {
      return res.status(400).json({
        success: false,
        message: `You have already ${voteType}d this answer`
      });
    }

    // Remove existing vote if different type
    if (existingVote) {
      if (existingVote === 'upvote') {
        answer.votes.upvotes = answer.votes.upvotes.filter(
          vote => vote.user.toString() !== userId
        );
        await updateReputation(answer.author, 'answer_upvote_remove');
      } else {
        answer.votes.downvotes = answer.votes.downvotes.filter(
          vote => vote.user.toString() !== userId
        );
        await updateReputation(answer.author, 'answer_downvote_remove');
      }
    }

    // Add new vote
    if (voteType === 'upvote') {
      answer.votes.upvotes.push({ user: userId });
      await updateReputation(answer.author, 'answer_upvote');
    } else if (voteType === 'downvote') {
      answer.votes.downvotes.push({ user: userId });
      await updateReputation(answer.author, 'answer_downvote');
    }

    await answer.save();

    const populatedAnswer = await Answer.findById(answerId)
      .populate('author', 'username reputation badges avatar');

    res.status(200).json({
      success: true,
      data: {
        answer: populatedAnswer
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept answer
// @route   POST /api/answers/:id/accept
// @access  Private
const acceptAnswer = async (req, res, next) => {
  try {
    const answerId = req.params.id;

    const answer = await Answer.findOne({
      _id: answerId,
      isDeleted: false
    }).populate('question');

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    const question = await Question.findOne({
      _id: answer.question._id,
      isDeleted: false
    });

    // Only question author can accept answers
    if (question.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the question author can accept answers'
      });
    }

    // Remove previous accepted answer if exists
    if (question.acceptedAnswer) {
      await Answer.findByIdAndUpdate(
        question.acceptedAnswer,
        { isAccepted: false }
      );
    }

    // Set new accepted answer
    answer.isAccepted = true;
    await answer.save();

    await Question.findByIdAndUpdate(
      question._id,
      { acceptedAnswer: answerId }
    );

    // Update reputation
    await updateReputation(answer.author, 'answer_accepted');
    await updateReputation(req.user.id, 'accept_answer');

    // Send notification
    await notifyAnswerAccepted(
      answer.author,
      req.user.id,
      question._id,
      answerId
    );

    const populatedAnswer = await Answer.findById(answerId)
      .populate('author', 'username reputation badges avatar');

    res.status(200).json({
      success: true,
      data: {
        answer: populatedAnswer
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAnswer,
  updateAnswer,
  deleteAnswer,
  voteAnswer,
  acceptAnswer
};