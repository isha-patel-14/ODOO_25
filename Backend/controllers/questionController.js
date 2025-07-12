const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Tag = require('../models/Tag');
const { updateReputation } = require('../utils/reputation');

// @desc    Get all questions
// @route   GET /api/questions
// @access  Public
const getQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = { isDeleted: false };
    
    // Filter by tag
    if (req.query.tag) {
      query.tags = { $in: [req.query.tag.toLowerCase()] };
    }

    // Search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Sort options
    let sort = {};
    switch (req.query.sort) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'votes':
        sort = { votes: -1 };
        break;
      case 'answers':
        sort = { answers: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const total = await Question.countDocuments(query);
    
    const questions = await Question.find(query)
      .populate('author', 'username reputation badges avatar')
      .populate('acceptedAnswer')
      .populate({
        path: 'answerCount'
      })
      .sort(sort)
      .skip(startIndex)
      .limit(limit)
      .lean();

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

// @desc    Get single question
// @route   GET /api/questions/:id
// @access  Public
const getQuestion = async (req, res, next) => {
  try {
    // Increment view count
    await Question.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } }
    );

    const question = await Question.findOne({
      _id: req.params.id,
      isDeleted: false
    })
      .populate('author', 'username reputation badges avatar')
      .populate('acceptedAnswer')
      .populate({
        path: 'answers',
        match: { isDeleted: false },
        populate: {
          path: 'author',
          select: 'username reputation badges avatar'
        },
        options: { sort: { isAccepted: -1, createdAt: 1 } }
      });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        question
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new question
// @route   POST /api/questions
// @access  Private
const createQuestion = async (req, res, next) => {
  try {
    req.body.author = req.user.id;
    
    const question = await Question.create(req.body);

    // Update or create tags
    for (const tagName of req.body.tags) {
      await Tag.findOneAndUpdate(
        { name: tagName.toLowerCase() },
        { 
          $inc: { usageCount: 1 },
          $setOnInsert: { name: tagName.toLowerCase() }
        },
        { upsert: true, new: true }
      );
    }

    const populatedQuestion = await Question.findById(question._id)
      .populate('author', 'username reputation badges avatar');

    res.status(201).json({
      success: true,
      data: {
        question: populatedQuestion
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private
const updateQuestion = async (req, res, next) => {
  try {
    let question = await Question.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Make sure user is question owner or admin
    if (question.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this question'
      });
    }

    const fieldsToUpdate = {};
    if (req.body.title) fieldsToUpdate.title = req.body.title;
    if (req.body.description) fieldsToUpdate.description = req.body.description;
    if (req.body.tags) fieldsToUpdate.tags = req.body.tags;

    question = await Question.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    ).populate('author', 'username reputation badges avatar');

    res.status(200).json({
      success: true,
      data: {
        question
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private
const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Make sure user is question owner or admin
    if (question.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this question'
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

// @desc    Get popular tags
// @route   GET /api/questions/tags
// @access  Public
const getPopularTags = async (req, res, next) => {
  try {
    const tags = await Tag.find()
      .sort({ usageCount: -1 })
      .limit(20)
      .select('name usageCount');

    res.status(200).json({
      success: true,
      data: {
        tags
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getPopularTags
};