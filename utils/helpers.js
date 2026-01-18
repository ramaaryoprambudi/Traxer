const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId, email, name) => {
    return jwt.sign(
        { 
            userId, 
            email, 
            name 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Format response yang konsisten
const responseFormatter = {
    success: (data, message = 'Success') => {
        return {
            success: true,
            message,
            data
        };
    },
    
    error: (message, details = null, statusCode = 500) => {
        const response = {
            success: false,
            message,
            statusCode
        };
        
        if (details) {
            response.details = details;
        }
        
        return response;
    },
    
    paginated: (data, pagination, message = 'Success') => {
        return {
            success: true,
            message,
            data,
            pagination
        };
    }
};

// Calculate pagination
const calculatePagination = (page = 1, limit = 10, totalCount) => {
    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(limit);
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const offset = (currentPage - 1) * itemsPerPage;
    
    return {
        currentPage,
        itemsPerPage,
        totalPages,
        totalCount,
        offset,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
    };
};

// Date utilities
const dateUtils = {
    getCurrentDate: () => {
        return new Date().toISOString().split('T')[0];
    },
    
    getDateRange: (days = 7) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    },
    
    getDayOfWeek: (date) => {
        const d = new Date(date);
        return d.getDay() === 0 ? 7 : d.getDay(); // Senin = 1, Minggu = 7
    },
    
    isValidDate: (dateString) => {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }
};

module.exports = {
    generateToken,
    responseFormatter,
    calculatePagination,
    dateUtils
};