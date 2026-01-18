const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
// const { loginLimiter, apiLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/register', /* loginLimiter, */ validateRegister, authController.register);
router.post('/login', /* loginLimiter, */ validateLogin, authController.login);

// Protected routes
router.get('/profile', /* apiLimiter, */ authenticateToken, authController.getProfile);
router.put('/profile', /* apiLimiter, */ authenticateToken, authController.updateProfile);
router.get('/verify', /* apiLimiter, */ authenticateToken, authController.verifyToken);

module.exports = router;