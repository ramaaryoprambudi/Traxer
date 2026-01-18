const rateLimit = require('express-rate-limit');

// Rate limiting middleware
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100, message) => {
    return rateLimit({
        windowMs,
        max,
        message: message || {
            error: 'Too many requests',
            message: `Too many requests from this IP, please try again later.`
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};

// Rate limit untuk login (lebih ketat)
const loginLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // maksimal 5 percobaan login per 15 menit
    {
        error: 'Too many login attempts',
        message: 'Too many login attempts, please try again in 15 minutes.'
    }
);

// Rate limit untuk API umum
const apiLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // maksimal 100 request per 15 menit
    {
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later.'
    }
);

// Rate limit untuk operasi write (POST, PUT, DELETE)
const writeLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    50, // maksimal 50 write operations per 15 menit
    {
        error: 'Write operation limit exceeded',
        message: 'Too many write operations, please try again later.'
    }
);

module.exports = {
    loginLimiter,
    apiLimiter,
    writeLimiter
};