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

// Security middleware - Skip untuk /api-docs routes  
app.use((req, res, next) => {
    if (req.path.startsWith('/api-docs')) {
        // Skip semua security untuk swagger
        return next();
    }
    
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

// Swagger UI - Fixed untuk production deployment
app.use('/api-docs', 
    (req, res, next) => {
        // Bypass semua security checks untuk swagger resources
        res.removeHeader('Content-Security-Policy');
        res.removeHeader('X-Content-Type-Options');
        res.removeHeader('X-Frame-Options');
        next();
    },
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocs, {
        customSiteTitle: "📱 Habit Tracker API Documentation"
    })
);

// Simplified auto-auth endpoint
app.get('/swagger-auto-auth', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>📱 Habit Tracker API</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .banner { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
            .btn { display: inline-block; padding: 12px 24px; background: #49cc90; color: white; text-decoration: none; border-radius: 6px; margin: 10px; }
            .btn:hover { background: #3ea173; }
            .section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 6px; }
            code { background: #e9ecef; padding: 2px 6px; border-radius: 3px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="banner">
                <h1>📱 Habit Tracker API</h1>
                <p>Complete API documentation for mobile developers</p>
            </div>
            
            <div class="section">
                <h2>🚀 API Documentation</h2>
                <p>Access interactive API documentation:</p>
                <a href="/api-docs" class="btn">📚 Open Swagger UI</a>
                <a href="/health" class="btn">💖 Health Check</a>
            </div>
            
            <div class="section">
                <h2>🔗 Endpoints</h2>
                <ul>
                    <li><strong>Authentication:</strong> <code>/api/auth</code></li>
                    <li><strong>Categories:</strong> <code>/api/categories</code></li>
                    <li><strong>Habits:</strong> <code>/api/habits</code></li>
                    <li><strong>Logs:</strong> <code>/api/logs</code></li>
                </ul>
            </div>
            
            <div class="section">
                <h2>🔑 Authentication Flow</h2>
                <ol>
                    <li>Register: <code>POST /api/auth/register</code></li>
                    <li>Login: <code>POST /api/auth/login</code></li>
                    <li>Use token in Authorization header: <code>Bearer {token}</code></li>
                </ol>
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
