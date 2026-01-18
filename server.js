require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const { testConnection } = require('./config/database');
const { sanitizeInput } = require('./middleware/validation');

// Routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const habitRoutes = require('./routes/habitRoutes');
const logRoutes = require('./routes/logRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// CORS configuration
app.use(cors({
  origin: ['https://traxer-three.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
    try {
        const docPath = path.join(__dirname, 'MOBILE_API_DOCUMENTATION.md');
        
        if (!fs.existsSync(docPath)) {
            return res.status(404).json({
                success: false,
                message: 'Documentation not found'
            });
        }

        const documentation = fs.readFileSync(docPath, 'utf8');
        
        // Check if client wants HTML format for better readability
        const acceptHeader = req.headers.accept || '';
        
        if (acceptHeader.includes('text/html') || req.query.format === 'html') {
            // Convert markdown to simple HTML for better viewing
            const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Habit Tracker API Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        pre { background: #f8f9fa; padding: 15px; border-radius: 6px; overflow-x: auto; border-left: 4px solid #007acc; }
        code { background: #f1f3f4; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
        h1 { color: #1a1a1a; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
        h2 { color: #2c5aa0; margin-top: 30px; }
        h3 { color: #5a6b7d; }
        .endpoint { background: #e8f4fd; padding: 15px; border-radius: 6px; margin: 10px 0; border-left: 4px solid #1976d2; }
        .method-get { color: #28a745; font-weight: bold; }
        .method-post { color: #007bff; font-weight: bold; }
        .method-put { color: #fd7e14; font-weight: bold; }
        .method-delete { color: #dc3545; font-weight: bold; }
        .json { background: #f8f9fa; border: 1px solid #e9ecef; }
        ul li { margin: 5px 0; }
        .back-to-top { position: fixed; bottom: 20px; right: 20px; background: #007acc; color: white; padding: 10px 15px; border: none; border-radius: 50px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <pre style="white-space: pre-wrap; font-family: inherit; background: transparent; border: none; padding: 0;">${documentation.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>
    <button class="back-to-top" onclick="window.scrollTo(0,0)">↑ Top</button>
</body>
</html>`;
            
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(htmlContent);
        } else {
            // Return as plain text markdown
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Content-Disposition', 'inline');
            res.send(documentation);
        }
        
    } catch (error) {
        console.error('Error serving documentation:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading documentation',
            error: error.message
        });
    }
});

// API Documentation as JSON for Postman
app.get('/api/docs/postman', (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "📱 Habit Tracker API Documentation for Mobile Apps",
            data: {
                title: "Habit Tracker API Documentation for Mobile Apps",
                description: "Complete API documentation for mobile app developers to integrate with the Habit Tracker backend.",
                base_url: "https://traxer-three.vercel.app",
                api_url: "https://traxer-three.vercel.app/api",
                health_check: "https://traxer-three.vercel.app/health",
                authentication: {
                    type: "Bearer Token (JWT)",
                    header: "Authorization: Bearer {token}",
                    token_expires: "7 days"
                },
                endpoints: {
                    auth: {
                        register: {
                            method: "POST",
                            url: "/api/auth/register",
                            body: {
                                name: "John Doe",
                                email: "john@example.com", 
                                password: "password123"
                            }
                        },
                        login: {
                            method: "POST",
                            url: "/api/auth/login",
                            body: {
                                email: "john@example.com",
                                password: "password123"
                            }
                        },
                        profile: {
                            method: "GET",
                            url: "/api/auth/profile",
                            headers: ["Authorization: Bearer {token}"]
                        }
                    },
                    categories: {
                        get_all: {
                            method: "GET",
                            url: "/api/categories",
                            headers: ["Authorization: Bearer {token}"]
                        }
                    },
                    habits: {
                        create: {
                            method: "POST", 
                            url: "/api/habits",
                            headers: ["Authorization: Bearer {token}", "Content-Type: application/json"],
                            body: {
                                name: "Morning Exercise",
                                description: "30 minutes workout",
                                category_id: 2,
                                frequency_type: "daily",
                                target_count: 1
                            }
                        },
                        get_all: {
                            method: "GET",
                            url: "/api/habits",
                            headers: ["Authorization: Bearer {token}"],
                            query_params: ["page", "limit", "category_id", "frequency_type", "is_active"]
                        },
                        get_single: {
                            method: "GET",
                            url: "/api/habits/{id}",
                            headers: ["Authorization: Bearer {token}"]
                        },
                        update: {
                            method: "PUT",
                            url: "/api/habits/{id}",
                            headers: ["Authorization: Bearer {token}", "Content-Type: application/json"],
                            body: {
                                name: "Updated habit name",
                                description: "Updated description",
                                category_id: 2,
                                is_active: true
                            }
                        },
                        delete: {
                            method: "DELETE",
                            url: "/api/habits/{id}",
                            headers: ["Authorization: Bearer {token}"]
                        },
                        statistics: {
                            method: "GET",
                            url: "/api/habits/statistics", 
                            headers: ["Authorization: Bearer {token}"],
                            query_params: ["period", "start_date", "end_date"]
                        }
                    },
                    logs: {
                        create: {
                            method: "POST",
                            url: "/api/logs",
                            headers: ["Authorization: Bearer {token}", "Content-Type: application/json"],
                            body: {
                                habit_id: 1,
                                date: "2026-01-18", 
                                completed_count: 1,
                                is_completed: true,
                                notes: "Great workout!"
                            }
                        },
                        get_all: {
                            method: "GET",
                            url: "/api/logs",
                            headers: ["Authorization: Bearer {token}"],
                            query_params: ["habit_id", "date", "start_date", "end_date", "page", "limit"]
                        },
                        today: {
                            method: "GET", 
                            url: "/api/logs/today",
                            headers: ["Authorization: Bearer {token}"]
                        },
                        calendar: {
                            method: "GET",
                            url: "/api/logs/calendar",
                            headers: ["Authorization: Bearer {token}"],
                            query_params: ["month", "year"]
                        },
                        streaks: {
                            method: "GET",
                            url: "/api/logs/streaks",
                            headers: ["Authorization: Bearer {token}"]
                        }
                    }
                },
                mobile_examples: {
                    android: "Kotlin with Retrofit",
                    ios: "Swift with URLSession", 
                    react_native: "JavaScript with fetch"
                },
                testing_info: {
                    postman_collection: "habit_tracker_postman_collection.json",
                    health_check_url: "https://traxer-three.vercel.app/health",
                    test_user: {
                        email: "test@example.com",
                        password: "password123"
                    }
                },
                important_notes: {
                    date_format: "YYYY-MM-DD",
                    weekly_active_days: "Array [1-7] where 1=Monday, 7=Sunday",
                    rate_limit: "100 requests per 15 minutes",
                    token_expiry: "7 days"
                }
            }
        });
    } catch (error) {
        console.error('Error serving Postman documentation:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading documentation',
            error: error.message
        });
    }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/logs', logRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Habit Tracker API',
        version: '1.0.0',
        documentation: {
            mobile_docs: '/api/docs',
            mobile_docs_html: '/api/docs?format=html',
            postman_friendly: '/api/docs/postman'
        },
        endpoints: {
            auth: '/api/auth (register, login, profile)',
            categories: '/api/categories',
            habits: '/api/habits',
            logs: '/api/logs'
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            details: Object.values(error.errors).map(err => err.message)
        });
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    // MySQL errors
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'Duplicate entry',
            details: error.message
        });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            success: false,
            message: 'Referenced record does not exist'
        });
    }

    // Default error response
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// Start server
async function startServer() {
    try {
        // Test database connection
        await testConnection();
        
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 API URL: http://localhost:${PORT}`);
            console.log(`💖 Health Check: http://localhost:${PORT}/health`);
            console.log(`📚 Mobile API Docs: http://localhost:${PORT}/api/docs`);
            console.log('📋 API Endpoints:');
            console.log('   - POST   /api/auth/register');
            console.log('   - POST   /api/auth/login');
            console.log('   - GET    /api/auth/profile');
            console.log('   - GET    /api/categories');
            console.log('   - POST   /api/habits');
            console.log('   - GET    /api/habits');
            console.log('   - POST   /api/logs');
            console.log('   - GET    /api/logs/today');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
