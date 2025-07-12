const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Auth validations
const validateSignup = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Question validations
const validateQuestion = [
  body('title')
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters')
    .trim(),
  
  body('description')
    .isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters long')
    .trim(),
  
  body('tags')
    .isArray({ min: 1, max: 5 })
    .withMessage('Must provide between 1 and 5 tags')
    .custom((tags) => {
      if (tags.some(tag => typeof tag !== 'string' || tag.length > 20)) {
        throw new Error('Each tag must be a string with maximum 20 characters');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Answer validations
const validateAnswer = [
  body('content')
    .isLength({ min: 10 })
    .withMessage('Answer must be at least 10 characters long')
    .trim(),
  
  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} ID`),
  
  handleValidationErrors
];

// Query validations
const validateQuestionQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'votes', 'answers'])
    .withMessage('Sort must be one of: newest, oldest, votes, answers'),
  
  query('tag')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Tag filter cannot exceed 20 characters'),
  
  handleValidationErrors
];

module.exports = {
  validateSignup,
  validateLogin,
  validateQuestion,
  validateAnswer,
  validateObjectId,
  validateQuestionQuery,
  handleValidationErrors
};