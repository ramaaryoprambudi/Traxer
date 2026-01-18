const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware untuk validasi JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Cek apakah user masih ada di database
        const [users] = await pool.execute(
            'SELECT id, name, email FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Attach user data ke request
        req.user = {
            id: users[0].id,
            name: users[0].name,
            nim: users[0].nim
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                success: false,
                message: 'Invalid token'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(403).json({
                success: false,
                message: 'Token expired'
            });
        } else {
            console.error('Auth middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authentication error'
            });
        }
    }
};

// Middleware untuk validasi apakah user adalah pemilik resource
const authorizeOwner = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const resourceId = req.params.id;
        
        // Cek berdasarkan route yang diakses
        let query;
        let params;

        if (req.baseUrl.includes('/habits')) {
            query = 'SELECT user_id FROM habits WHERE id = ?';
            params = [resourceId];
        } else if (req.baseUrl.includes('/logs')) {
            query = 'SELECT user_id FROM habit_logs WHERE id = ?';
            params = [resourceId];
        } else {
            // Default: cek apakah resource memiliki user_id yang sesuai
            return next();
        }

        const [results] = await pool.execute(query, params);
        
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        if (results[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: You can only access your own resources'
            });
        }

        next();
    } catch (error) {
        console.error('Authorization error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authorization error'
        });
    }
};

module.exports = {
    authenticateToken,
    authorizeOwner
};