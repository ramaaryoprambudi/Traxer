const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');
// const { apiLimiter } = require('../middleware/rateLimiter');

// All category routes require authentication
router.use(authenticateToken);

// Get all categories
router.get('/', /* apiLimiter, */ categoryController.getCategories);

// Get category by ID
router.get('/:id', /* apiLimiter, */ validateId, categoryController.getCategoryById);

// Create new category
router.post('/', /* apiLimiter, */ categoryController.createCategory);

// Update category
router.put('/:id', /* apiLimiter, */ validateId, categoryController.updateCategory);

// Delete category
router.delete('/:id', /* apiLimiter, */ validateId, categoryController.deleteCategory);

module.exports = router;