require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const { testConnection } = require('./config/database');
const { sanitizeInput } = require('./middleware/validation');

// Routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const habitRoutes = require('./routes/habitRoutes');
const logRoutes = require('./routes/logRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: '📱 Habit Tracker API',
            version: '1.0.0',
            description: 'Complete API documentation for mobile app developers to integrate with the Habit Tracker backend.',
            contact: {
                name: 'Habit Tracker API Support',
                email: 'support@habittracker.com'
            },
            servers: [
                {
                    url: 'https://traxer-three.vercel.app',
                    description: 'Production server'
                },
                {
                    url: 'http://localhost:3000',
                    description: 'Development server'
                }
            ]
        },
        servers: [
            {
                url: 'https://traxer-three.vercel.app',
                description: 'Production server'
            },
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', example: 'john@example.com' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                Category: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Health' },
                        description: { type: 'string', example: 'Health related habits' },
                        icon: { type: 'string', example: '💪' },
                        color: { type: 'string', example: '#4CAF50' }
                    }
                },
                Habit: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Morning Exercise' },
                        description: { type: 'string', example: '30 minutes workout' },
                        category_id: { type: 'integer', example: 2 },
                        frequency_type: { type: 'string', enum: ['daily', 'weekly', 'custom'], example: 'daily' },
                        target_count: { type: 'integer', example: 1 },
                        weekly_active_days: { type: 'array', items: { type: 'integer' }, example: [1, 2, 3, 4, 5] },
                        is_active: { type: 'boolean', example: true },
                        user_id: { type: 'integer', example: 1 },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                Log: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        habit_id: { type: 'integer', example: 1 },
                        date: { type: 'string', format: 'date', example: '2026-01-18' },
                        completed_count: { type: 'integer', example: 1 },
                        is_completed: { type: 'boolean', example: true },
                        notes: { type: 'string', example: 'Great workout!' },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Error message' },
                        details: { type: 'string', example: 'Detailed error information' }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Operation successful' },
                        data: { type: 'object' }
                    }
                }
            }
        },
        security: [
            {
                BearerAuth: []
            }
        ]
    },
    apis: ['./server.js', './routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Security middleware - Minimal untuk Swagger UI compatibility
app.use((req, res, next) => {
    // Disable security headers for api-docs routes
    if (req.path.startsWith('/api-docs')) {
        res.removeHeader('Content-Security-Policy');
        res.removeHeader('X-Content-Type-Options');
        res.removeHeader('Cross-Origin-Resource-Policy');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }
    next();
});

// Apply helmet after the swagger bypass
app.use('/api-docs', (req, res, next) => {
    // Skip helmet for swagger routes
    next();
}, swaggerUi.serve);

// For non-swagger routes, apply security
app.use((req, res, next) => {
    if (!req.path.startsWith('/api-docs')) {
        helmet({
            contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            } : false
        })(req, res, next);
    } else {
        next();
    }
});

// CORS configuration - Permissive untuk Swagger UI
app.use(cors({
  origin: true, // Allow semua origin untuk development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 200
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
/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health Check
 *     summary: Check API health status
 *     description: Returns the current status of the API server
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: production
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// Swagger UI dengan route yang lebih sederhana
app.use('/api-docs', 
    (req, res, next) => {
        // Disable SEMUA security headers untuk swagger
        res.removeHeader('Content-Security-Policy');
        res.removeHeader('X-Content-Type-Options');
        res.removeHeader('X-Frame-Options');
        res.removeHeader('X-DNS-Prefetch-Control');
        res.removeHeader('X-Download-Options');
        res.removeHeader('X-Permitted-Cross-Domain-Policies');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        next();
    },
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocs, {
        customSiteTitle: "📱 Habit Tracker API Documentation"
    })
);

// Simple API docs sebagai fallback
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
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px; margin-bottom: 30px; }
            .section { background: white; padding: 30px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .endpoint { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #007acc; border-radius: 4px; }
            .method { display: inline-block; padding: 4px 8px; color: white; font-weight: bold; border-radius: 3px; font-size: 12px; }
            .method-get { background: #28a745; }
            .method-post { background: #007bff; }
            .method-put { background: #fd7e14; }
            .method-delete { background: #dc3545; }
            .url { font-family: monospace; font-weight: bold; margin-left: 10px; }
            code { background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
            pre { background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 5px; overflow-x: auto; }
            .btn { display: inline-block; padding: 12px 24px; background: #007acc; color: white; text-decoration: none; border-radius: 6px; margin: 10px 10px 10px 0; transition: background 0.3s; }
            .btn:hover { background: #005a99; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📱 Habit Tracker API</h1>
                <p>Complete REST API for habit tracking mobile applications</p>
                <div style="margin-top: 20px;">
                    <a href="/api-docs" class="btn">🔗 Try Swagger UI</a>
                    <a href="/health" class="btn">💖 Health Check</a>
                </div>
            </div>

            <div class="section">
                <h2>🔑 Authentication</h2>
                <p>All API requests (except auth endpoints) require JWT token in Authorization header:</p>
                <pre>Authorization: Bearer {your_jwt_token}</pre>
                
                <div class="endpoint">
                    <span class="method method-post">POST</span>
                    <span class="url">/api/auth/register</span>
                    <p>Register new user. Returns JWT token.</p>
                    <pre>{"name": "John Doe", "email": "test@example.com", "password": "password123"}</pre>
                </div>

                <div class="endpoint">
                    <span class="method method-post">POST</span>
                    <span class="url">/api/auth/login</span>
                    <p>Login user. Returns JWT token.</p>
                    <pre>{"email": "test@example.com", "password": "password123"}</pre>
                </div>

                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/auth/profile</span>
                    <p>Get current user profile (requires auth)</p>
                </div>

                <div class="endpoint">
                    <span class="method method-put">PUT</span>
                    <span class="url">/api/auth/profile</span>
                    <p>Update user profile (requires auth)</p>
                    <pre>{"name": "Updated Name"}</pre>
                </div>
            </div>

            <div class="section">
                <h2>📂 Categories</h2>
                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/categories</span>
                    <p>Get all habit categories (requires auth)</p>
                </div>
            </div>

            <div class="section">
                <h2>📝 Habits</h2>
                <div class="endpoint">
                    <span class="method method-post">POST</span>
                    <span class="url">/api/habits</span>
                    <p>Create new habit (requires auth)</p>
                    <pre>{"name": "Morning Exercise", "description": "30min workout", "category_id": 2, "frequency_type": "daily", "target_count": 1}</pre>
                </div>

                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/habits</span>
                    <p>Get user habits with filters (requires auth)</p>
                    <p>Query params: <code>page</code>, <code>limit</code>, <code>category_id</code>, <code>frequency_type</code>, <code>is_active</code></p>
                </div>

                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/habits/:id</span>
                    <p>Get specific habit (requires auth)</p>
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

                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/habits/statistics</span>
                    <p>Get habit statistics (requires auth)</p>
                </div>
            </div>

            <div class="section">
                <h2>✅ Logs</h2>
                <div class="endpoint">
                    <span class="method method-post">POST</span>
                    <span class="url">/api/logs</span>
                    <p>Log habit completion (requires auth)</p>
                    <pre>{"habit_id": 1, "date": "2026-01-18", "completed": true, "notes": "Great workout!"}</pre>
                </div>

                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/logs</span>
                    <p>Get habit logs (requires auth)</p>
                    <p>Query params: <code>start_date</code>, <code>end_date</code>, <code>habit_id</code></p>
                </div>

                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/logs/today</span>
                    <p>Get today's habit status (requires auth)</p>
                </div>

                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/logs/calendar</span>
                    <p>Get calendar view of habits (requires auth)</p>
                </div>
            </div>

            <div class="section">
                <h2>🔗 Base URLs</h2>
                <ul>
                    <li><strong>Production:</strong> <code>https://traxer-three.vercel.app</code></li>
                    <li><strong>Health Check:</strong> <code>GET /health</code></li>
                </ul>
            </div>

            <div class="section">
                <h2>📱 Response Format</h2>
                <p>All responses follow this structure:</p>
                <pre>{
  "success": true,
  "message": "Operation successful", 
  "data": { ... }
}</pre>
                <p><strong>Error responses:</strong></p>
                <pre>{
  "success": false,
  "message": "Error description",
  "details": "Additional error info"
}</pre>
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
// Root endpoint - Redirect ke landing page
app.get('/', (req, res) => {
    // Jika request dari browser, redirect ke landing page
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.redirect('/swagger-auto-auth');
    }
    
    // Jika API request, return JSON
    res.status(200).json({
        success: true,
        message: 'Habit Tracker API',
        version: '1.0.0',
        documentation: '/api-docs',
        landing: '/swagger-auto-auth',
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
