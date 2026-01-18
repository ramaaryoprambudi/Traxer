require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const { testConnection } = require('./config/database');
const { sanitizeInput } = require('./middleware/validation');

// Routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const habitRoutes = require('./routes/habitRoutes');
const logRoutes = require('./routes/logRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware - Standard helmet setup
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    } : false
}));

// CORS configuration
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

// API Documentation - Simple HTML version
app.get('/api-docs', (req, res) => {
    res.redirect('/docs');
});

// Simple HTML docs sebagai backup jika Swagger gagal
app.get('/docs', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>📱 Habit Tracker API</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; background: #f8f9fa; }
            .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px; margin-bottom: 30px; }
            .section { background: white; padding: 25px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .endpoint { background: #f8f9fa; padding: 12px; margin: 8px 0; border-left: 4px solid #007acc; border-radius: 4px; }
            .method { display: inline-block; padding: 3px 6px; color: white; font-weight: bold; border-radius: 3px; font-size: 11px; min-width: 50px; text-align: center; }
            .method-get { background: #28a745; }
            .method-post { background: #007bff; }
            .method-put { background: #fd7e14; }
            .method-delete { background: #dc3545; }
            .url { font-family: 'Monaco', 'Menlo', monospace; font-weight: bold; margin-left: 10px; }
            code { background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-family: 'Monaco', 'Menlo', monospace; }
            pre { background: #2d3748; color: #e2e8f0; padding: 12px; border-radius: 5px; overflow-x: auto; font-size: 13px; }
            .btn { display: inline-block; padding: 10px 20px; background: #007acc; color: white; text-decoration: none; border-radius: 6px; margin: 8px 8px 8px 0; transition: background 0.3s; }
            .btn:hover { background: #005a99; }
            .status { padding: 4px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; }
            .status-ok { background: #d4edda; color: #155724; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📱 Habit Tracker API</h1>
                <p>Complete REST API Documentation</p>
                <div style="margin-top: 20px;">
                    <a href="/health" class="btn">💖 Health Check</a>
                    <a href="/docs" class="btn">📚 Documentation</a>
                </div>
                <div style="margin-top: 10px;">
                    <span class="status status-ok">Production: https://traxer-three.vercel.app</span>
                </div>
            </div>

            <div class="section">
                <h2>🔑 Authentication</h2>
                <p><strong>All endpoints (except auth) require JWT token:</strong></p>
                <pre>Authorization: Bearer {your_jwt_token}</pre>
                
                <div class="endpoint">
                    <span class="method method-post">POST</span>
                    <span class="url">/api/auth/register</span>
                    <p>Register new user - Returns JWT token</p>
                    <pre>{"name": "John Doe", "email": "test@example.com", "password": "password123"}</pre>
                </div>

                <div class="endpoint">
                    <span class="method method-post">POST</span>
                    <span class="url">/api/auth/login</span>
                    <p>Login existing user - Returns JWT token</p>
                    <pre>{"email": "test@example.com", "password": "password123"}</pre>
                </div>

                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/auth/profile</span>
                    <p>Get current user profile (requires auth)</p>
                </div>
            </div>

            <div class="section">
                <h2>📝 Habits Management</h2>
                <div class="endpoint">
                    <span class="method method-post">POST</span>
                    <span class="url">/api/habits</span>
                    <p>Create new habit (requires auth)</p>
                    <pre>{"name": "Morning Exercise", "description": "30min workout", "category_id": 2, "frequency_type": "daily"}</pre>
                </div>

                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/habits</span>
                    <p>Get user habits with pagination (requires auth)</p>
                    <p>Query params: <code>page=1</code>, <code>limit=10</code>, <code>category_id=2</code></p>
                </div>

                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/habits/:id</span>
                    <p>Get specific habit by ID (requires auth)</p>
                </div>

                <div class="endpoint">
                    <span class="method method-put">PUT</span>
                    <span class="url">/api/habits/:id</span>
                    <p>Update habit (requires auth)</p>
                </div>

                <div class="endpoint">
                    <span class="method method-delete">DELETE</span>
                    <span class="url">/api/habits/:id</span>
                    <p>Delete habit (requires auth)</p>
                </div>
            </div>

            <div class="section">
                <h2>✅ Habit Logs</h2>
                <div class="endpoint">
                    <span class="method method-post">POST</span>
                    <span class="url">/api/logs</span>
                    <p>Log habit completion (requires auth)</p>
                    <pre>{"habit_id": 1, "date": "2026-01-18", "completed": true, "notes": "Great workout!"}</pre>
                </div>

                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/logs/today</span>
                    <p>Get today's habit completion status (requires auth)</p>
                </div>

                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/logs</span>
                    <p>Get habit logs with date range (requires auth)</p>
                    <p>Query params: <code>start_date=2026-01-01</code>, <code>end_date=2026-01-31</code></p>
                </div>
            </div>

            <div class="section">
                <h2>📂 Categories</h2>
                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/categories</span>
                    <p>Get all available habit categories (requires auth)</p>
                </div>
            </div>

            <div class="section">
                <h2>📱 Response Format</h2>
                <p><strong>Success Response:</strong></p>
                <pre>{"success": true, "message": "Operation successful", "data": {...}}</pre>
                <p><strong>Error Response:</strong></p>
                <pre>{"success": false, "message": "Error description", "details": "..."}</pre>
            </div>
        </div>
    </body>
    </html>
    `);
});



// API routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/logs', logRoutes);

// Root endpoint
// Root endpoint - Redirect ke simple docs
app.get('/', (req, res) => {
    // Jika request dari browser, redirect ke simple docs
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.redirect('/docs');
    }
    
    // Jika API request, return JSON
    res.status(200).json({
        success: true,
        message: 'Habit Tracker API',
        version: '1.0.0',
        documentation: '/docs',
        health: '/health',
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
            console.log(`📚 Swagger Documentation: http://localhost:${PORT}/api-docs`);
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
