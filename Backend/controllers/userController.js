const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user stats
    const questionCount = await Question.countDocuments({
      author: req.params.id,
      isDeleted: false
    });

    const answerCount = await Answer.countDocuments({
      author: req.params.id,
      isDeleted: false
    });

    const acceptedAnswerCount = await Answer.countDocuments({
      author: req.params.id,
      isAccepted: true,
      isDeleted: false
    });

    // Get recent questions
    const recentQuestions = await Question.find({
      author: req.params.id,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title createdAt tags');

    // Get recent answers
    const recentAnswers = await Answer.find({
      author: req.params.id,
      isDeleted: false
    })
      .populate('question', 'title')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('content createdAt isAccepted');

    res.status(200).json({
      success: true,
      data: {
        user,
        stats: {
          questionCount,
          answerCount,
          acceptedAnswerCount
        },
        recentActivity: {
          questions: recentQuestions,
          answers: recentAnswers
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user questions
// @route   GET /api/users/:id/questions
// @access  Public
const getUserQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await Question.countDocuments({
      author: req.params.id,
      isDeleted: false
    });

    const questions = await Question.find({
      author: req.params.id,
      isDeleted: false
    })
      .populate('author', 'username reputation badges avatar')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const pagination = {};
    
    if (startIndex + limit < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: questions.length,
      total,
      pagination,
      data: {
        questions
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user answers
// @route   GET /api/users/:id/answers
// @access  Public
const getUserAnswers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await Answer.countDocuments({
      author: req.params.id,
      isDeleted: false
    });

    const answers = await Answer.find({
      author: req.params.id,
      isDeleted: false
    })
      .populate('author', 'username reputation badges avatar')
      .populate('question', 'title')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const pagination = {};
    
    if (startIndex + limit < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: answers.length,
      total,
      pagination,
      data: {
        answers
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  getUserQuestions,
  getUserAnswers
};