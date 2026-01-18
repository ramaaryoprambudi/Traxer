const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticateToken } = require('../middleware/auth');
const { validateHabitLog, validateId, validateDateRange } = require('../middleware/validation');
// const { apiLimiter, writeLimiter } = require('../middleware/rateLimiter');

// All log routes require authentication
router.use(authenticateToken);

// Create or update habit log
router.post('/', /* writeLimiter, */ validateHabitLog, logController.logHabit);

// Get habit logs
router.get('/', /* apiLimiter, */ validateDateRange, logController.getHabitLogs);

// Get today's habits
router.get('/today', /* apiLimiter, */ logController.getTodaysHabits);

// Get habit calendar
router.get('/calendar', /* apiLimiter, */ validateDateRange, logController.getHabitCalendar);

// Delete habit log
router.delete('/:id', /* writeLimiter, */ validateId, logController.deleteHabitLog);

module.exports = router;