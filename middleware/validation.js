const { body, param, query, validationResult } = require('express-validator');

// Middleware untuk handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
};

// Validasi untuk register
const validateRegister = [
    body('name')
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name must contain only letters and spaces'),
    
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    
    handleValidationErrors
];

// Validasi untuk login
const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    
    handleValidationErrors
];

// Validasi untuk membuat/update habit
const validateHabit = [
    body('name')
        .notEmpty()
        .withMessage('Habit name is required')
        .isLength({ min: 3, max: 200 })
        .withMessage('Habit name must be between 3 and 200 characters')
        .trim()
        .escape(),
    
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters')
        .trim()
        .escape(),
    
    body('category_id')
        .notEmpty()
        .withMessage('Category is required')
        .isInt({ min: 1 })
        .withMessage('Category ID must be a positive integer'),
    
    body('frequency_type')
        .optional()
        .isIn(['daily', 'weekly'])
        .withMessage('Frequency type must be either daily or weekly'),
    
    body('active_days')
        .optional()
        .custom((value) => {
            if (value && !Array.isArray(value)) {
                throw new Error('Active days must be an array');
            }
            if (value && value.some(day => !Number.isInteger(day) || day < 1 || day > 7)) {
                throw new Error('Active days must contain integers between 1 and 7');
            }
            return true;
        }),
    
    body('target_count')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Target count must be between 1 and 10'),
    
    handleValidationErrors
];

// Validasi untuk update habit - semua field opsional
const validateHabitUpdate = [
    body('name')
        .optional()
        .isLength({ min: 3, max: 200 })
        .withMessage('Habit name must be between 3 and 200 characters')
        .trim()
        .escape(),
    
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters')
        .trim()
        .escape(),
    
    body('category_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Category ID must be a positive integer'),
    
    body('frequency_type')
        .optional()
        .isIn(['daily', 'weekly'])
        .withMessage('Frequency type must be either daily or weekly'),
    
    body('active_days')
        .optional()
        .custom((value) => {
            if (value && !Array.isArray(value)) {
                throw new Error('Active days must be an array');
            }
            if (value && value.some(day => !Number.isInteger(day) || day < 1 || day > 7)) {
                throw new Error('Active days must contain integers between 1 and 7');
            }
            return true;
        }),
    
    body('target_count')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Target count must be between 1 and 10'),
    
    body('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean'),
    
    handleValidationErrors
];

// Validasi untuk habit log
const validateHabitLog = [
    body('habit_id')
        .notEmpty()
        .withMessage('Habit ID is required')
        .isInt({ min: 1 })
        .withMessage('Habit ID must be a positive integer'),
    
    body('date')
        .notEmpty()
        .withMessage('Date is required')
        .isISO8601()
        .withMessage('Date must be in valid ISO format (YYYY-MM-DD)')
        .custom((value) => {
            const today = new Date();
            const logDate = new Date(value);
            const daysDifference = (today - logDate) / (1000 * 60 * 60 * 24);
            
            if (daysDifference > 7) {
                throw new Error('Cannot log habits older than 7 days');
            }
            if (daysDifference < -1) {
                throw new Error('Cannot log habits for future dates beyond tomorrow');
            }
            return true;
        }),
    
    body('completed_count')
        .optional()
        .isInt({ min: 0, max: 10 })
        .withMessage('Completed count must be between 0 and 10'),
    
    body('is_completed')
        .optional()
        .isBoolean()
        .withMessage('is_completed must be a boolean value'),
    
    body('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Notes must not exceed 500 characters')
        .trim()
        .escape(),
    
    handleValidationErrors
];

// Validasi untuk parameter ID
const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID must be a positive integer'),
    handleValidationErrors
];

// Validasi untuk query date range
const validateDateRange = [
    query('start_date')
        .optional()
        .isISO8601()
        .withMessage('Start date must be in valid ISO format (YYYY-MM-DD)'),
    
    query('end_date')
        .optional()
        .isISO8601()
        .withMessage('End date must be in valid ISO format (YYYY-MM-DD)')
        .custom((value, { req }) => {
            if (value && req.query.start_date) {
                const startDate = new Date(req.query.start_date);
                const endDate = new Date(value);
                if (endDate < startDate) {
                    throw new Error('End date must be after start date');
                }
                
                const daysDifference = (endDate - startDate) / (1000 * 60 * 60 * 24);
                if (daysDifference > 365) {
                    throw new Error('Date range cannot exceed 365 days');
                }
            }
            return true;
        }),
    
    handleValidationErrors
];

// Sanitasi input untuk mencegah XSS
const sanitizeInput = (req, res, next) => {
    // Sanitasi semua string inputs
    const sanitize = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                // Remove potentially dangerous characters
                obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                obj[key] = obj[key].replace(/javascript:/gi, '');
                obj[key] = obj[key].replace(/on\w+\s*=/gi, '');
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]);
            }
        }
    };
    
    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);
    
    next();
};

module.exports = {
    validateRegister,
    validateLogin,
    validateHabit,
    validateHabitUpdate,
    validateHabitLog,
    validateId,
    validateDateRange,
    sanitizeInput,
    handleValidationErrors
};