const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const { authenticateToken, authorizeOwner } = require('../middleware/auth');
const { validateHabit, validateHabitUpdate, validateId, validateDateRange } = require('../middleware/validation');
// const { apiLimiter, writeLimiter } = require('../middleware/rateLimiter');

// All habit routes require authentication
router.use(authenticateToken);

// Create new habit
router.post('/', /* writeLimiter, */ validateHabit, habitController.createHabit);

// Get all user's habits
router.get('/', /* apiLimiter, */ habitController.getHabits);

// Get habit statistics
router.get('/statistics', /* apiLimiter, */ validateDateRange, habitController.getHabitStatistics);

// Get habit by ID
router.get('/:id', /* apiLimiter, */ validateId, habitController.getHabitById);

// Get habit streaks and analytics
router.get('/:id/streaks', /* apiLimiter, */ validateId, habitController.getHabitStreaks);

// Update habit
router.put('/:id', /* writeLimiter, */ validateId, validateHabitUpdate, habitController.updateHabit);

// Delete habit
router.delete('/:id', /* writeLimiter, */ validateId, habitController.deleteHabit);

module.exports = router;