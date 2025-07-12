const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Notification = require('../models/Notification');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalQuestions = await Question.countDocuments({ isDeleted: false });
    const totalAnswers = await Answer.countDocuments({ isDeleted: false });
    const totalNotifications = await Notification.countDocuments();

    // Recent activity
    const recentQuestions = await Question.find({ isDeleted: false })
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentAnswers = await Answer.find({ isDeleted: false })
      .populate('author', 'username')
      .populate('question', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    // Top users by reputation
    const topUsers = await User.find()
      .sort({ reputation: -1 })
      .limit(10)
      .select('username reputation badges');

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalQuestions,
          totalAnswers,
          totalNotifications
        },
        recentActivity: {
          questions: recentQuestions,
          answers: recentAnswers
        },
        topUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const total = await User.countDocuments();

    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .select('-password');

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
      count: users.length,
      total,
      pagination,
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ban/Unban user
// @route   PUT /api/admin/users/:id/ban
// @access  Private/Admin
const toggleUserBan = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Can't ban admin users
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot ban admin users'
      });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete question (admin)
// @route   DELETE /api/admin/questions/:id
// @access  Private/Admin
const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Soft delete
    await Question.findByIdAndUpdate(req.params.id, { isDeleted: true });
    
    // Also soft delete all answers
    await Answer.updateMany(
      { question: req.params.id },
      { isDeleted: true }
    );

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete answer (admin)
// @route   DELETE /api/admin/answers/:id
// @access  Private/Admin
const deleteAnswer = async (req, res, next) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
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

// @desc    Get all questions (admin)
// @route   GET /api/admin/questions
// @access  Private/Admin
const getAllQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    let query = {};
    
    // Include deleted questions if specified
    if (req.query.includeDeleted !== 'true') {
      query.isDeleted = false;
    }

    const total = await Question.countDocuments(query);

    const questions = await Question.find(query)
      .populate('author', 'username reputation')
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

module.exports = {
  getDashboardStats,
  getAllUsers,
  toggleUserBan,
  deleteQuestion,
  deleteAnswer,
  getAllQuestions
};