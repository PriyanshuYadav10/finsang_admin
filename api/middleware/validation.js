const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Admin authentication validation rules
const validateAdminSignup = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  handleValidationErrors
];

const validateAdminSignin = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// User validation rules
const validateUser = [
  body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('profile_image_url').optional().isURL().withMessage('Valid URL required for profile image'),
  handleValidationErrors
];

// Product validation rules
const validateProduct = [
  body('type').notEmpty().withMessage('Product type is required'),
  body('card_name').isLength({ min: 2 }).withMessage('Card name must be at least 2 characters'),
  body('youtube_url').optional().custom((value) => {
    if (value && value.trim() !== '') {
      if (!value.match(/^https?:\/\/.+/)) {
        throw new Error('Valid URL required for YouTube URL');
      }
    }
    return true;
  }),
  body('bank_name').optional().custom((value) => {
    if (value && value.trim() !== '') {
      if (value.length < 2) {
        throw new Error('Bank name must be at least 2 characters');
      }
    }
    return true;
  }),
  body('benefits').optional().isArray().withMessage('Benefits must be an array'),
  body('payout').optional().isObject().withMessage('Payout must be an object'),
  body('terms').optional().isArray().withMessage('Terms must be an array'),
  body('card_benefits').optional().isArray().withMessage('Card benefits must be an array'),
  body('application_process_url').optional().custom((value) => {
    if (value && value.trim() !== '') {
      if (!value.match(/^https?:\/\/.+/)) {
        throw new Error('Valid URL required for application process URL');
      }
    }
    return true;
  }),
  body('eligibility').optional().isObject().withMessage('Eligibility must be an object'),
  body('faqs').optional().isArray().withMessage('FAQs must be an array'),
  body('joining_fees').optional().custom((value) => {
    if (value && value.trim() !== '') {
      if (value.length < 1) {
        throw new Error('Joining fees must not be empty');
      }
    }
    return true;
  }),
  body('renewal_fees').optional().custom((value) => {
    if (value && value.trim() !== '') {
      if (value.length < 1) {
        throw new Error('Renewal fees must not be empty');
      }
    }
    return true;
  }),
  body('payout_str').optional().custom((value) => {
    if (value && value.trim() !== '') {
      if (value.length < 1) {
        throw new Error('Payout string must not be empty');
      }
    }
    return true;
  }),
  body('Image_url').optional().custom((value) => {
    if (value && value.trim() !== '') {
      if (!value.match(/^https?:\/\/.+/)) {
        throw new Error('Valid URL required for image');
      }
    }
    return true;
  }),
  body('popular_product').optional().isBoolean().withMessage('Popular product must be a boolean'),
  handleValidationErrors
];

// Training category validation rules
const validateTrainingCategory = [
  body('name').isLength({ min: 2 }).withMessage('Category name must be at least 2 characters'),
  body('description').optional().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('banner_url').optional().isURL().withMessage('Valid URL required for banner'),
  handleValidationErrors
];

// Training video validation rules
const validateTrainingVideo = [
  body('title').isLength({ min: 2 }).withMessage('Title must be at least 2 characters'),
  body('description').optional().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('youtube_url').isURL().withMessage('Valid URL required for video'),
  body('category_id').isUUID().withMessage('Valid category ID required'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('thumbnail_url').optional().isURL().withMessage('Valid URL required for thumbnail'),
  handleValidationErrors
];

// Grow category validation rules
const validateGrowCategory = [
  body('name').isLength({ min: 2 }).withMessage('Category name must be at least 2 characters'),
  body('description').optional().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('image_url').optional().isURL().withMessage('Valid URL required for image'),
  handleValidationErrors
];

// Grow poster validation rules
const validateGrowPoster = [
  body('title').isLength({ min: 2 }).withMessage('Title must be at least 2 characters'),
  body('description').optional().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('image_url').optional().isURL().withMessage('Valid URL required for image'),
  body('category_id').isInt({ min: 1 }).withMessage('Valid category ID required'),
  body('content').optional().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  handleValidationErrors
];

// ID validation rules - handle both UUID and integer IDs
const validateId = [
  param('id').custom((value) => {
    // Check if it's a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // Check if it's a positive integer
    const intRegex = /^\d+$/;
    
    if (!uuidRegex.test(value) && !intRegex.test(value)) {
      throw new Error('Valid UUID or integer ID required');
    }
    return true;
  }),
  handleValidationErrors
];

// UUID validation rules
const validateUUID = [
  param('id').isUUID().withMessage('Valid UUID required'),
  handleValidationErrors
];

// UUID validation for categoryId parameter
const validateCategoryId = [
  param('categoryId').isUUID().withMessage('Valid category ID required'),
  handleValidationErrors
];

// Integer validation for categoryId parameter
const validateIntegerCategoryId = [
  param('categoryId').isInt({ min: 1 }).withMessage('Valid category ID required'),
  handleValidationErrors
];

// Integer ID validation rules
const validateIntegerId = [
  param('id').isInt({ min: 1 }).withMessage('Valid integer ID required'),
  handleValidationErrors
];

// Pagination validation rules
const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateAdminSignup,
  validateAdminSignin,
  validateUser,
  validateProduct,
  validateTrainingCategory,
  validateTrainingVideo,
  validateGrowCategory,
  validateGrowPoster,
  validateId,
  validateUUID,
  validateCategoryId,
  validateIntegerCategoryId,
  validateIntegerId,
  validatePagination
}; 