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

// Security middleware - Conditional CSP for production
if (process.env.NODE_ENV === 'production') {
    app.use(helmet({
        contentSecurityPolicy: false, // Disable CSP for Swagger UI to work
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }));
} else {
    app.use(helmet({
        contentSecurityPolicy: false, // Disable CSP in development
        hsts: false
    }));
}

// CORS configuration
app.use(cors({
  origin: ['https://traxer-three.vercel.app', 'http://localhost:3000', 'http://localhost:3001', 'https://traxer-three.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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

// Swagger UI
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerDocs, {
    customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin-bottom: 30px }
        .swagger-ui .scheme-container { background: #fafafa; padding: 20px; border-radius: 5px }
        .swagger-ui .btn.authorize { background-color: #49cc90; border-color: #49cc90 }
        .swagger-ui .btn.authorize:hover { background-color: #3ea173; border-color: #3ea173 }
        .swagger-ui .response-col_status { width: 10% }
        .swagger-ui .response-col_description { width: 90% }
        .auto-auth-info { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
            font-weight: 500;
        }
        .auto-auth-info .success { color: #4CAF50; font-weight: bold; }
        .auto-auth-info .error { color: #f44336; font-weight: bold; }
    `,
    customSiteTitle: "📱 Habit Tracker API Documentation",
    customfavIcon: "/favicon.ico",
    swaggerOptions: {
        persistAuthorization: true,
        tryItOutEnabled: true,
        filter: true,
        displayRequestDuration: true,
        deepLinking: true,
        displayOperationId: false,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        defaultModelRendering: 'example',
        docExpansion: 'list',
        operationsSorter: 'alpha',
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        onComplete: function() {
            console.log('🚀 Swagger UI loaded successfully!');
        }
    }
}));

// Auto-authentication script endpoint
app.get('/api-docs/auto-auth.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
        // Auto-authentication for Swagger UI
        console.log('🤖 Auto-auth script loaded');
        
        // Wait for page to be ready
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 DOM loaded, initializing auto-auth');
            initAutoAuth();
        });
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAutoAuth);
        } else {
            initAutoAuth();
        }
        
        function initAutoAuth() {
            // Add banner
            setTimeout(function() {
                try {
                    const banner = document.createElement('div');
                    banner.innerHTML = '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; margin: 20px; text-align: center; font-weight: 500;"><div>🤖 <strong>Auto-Authentication Enabled!</strong></div><div style="margin-top: 8px; font-size: 14px;">Register atau Login akan otomatis set token</div></div>';
                    
                    const info = document.querySelector('.information-container') || document.querySelector('.swagger-ui');
                    if (info) {
                        info.appendChild(banner);
                    }
                } catch(e) {
                    console.log('Banner creation failed:', e);
                }
            }, 2000);
            
            // Monitor XHR for auth responses
            const originalXHR = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.send = function(data) {
                const xhr = this;
                xhr.addEventListener('load', function() {
                    try {
                        if (xhr.responseURL && (xhr.responseURL.includes('/auth/register') || xhr.responseURL.includes('/auth/login'))) {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                const response = JSON.parse(xhr.responseText);
                                if (response.success && response.data && response.data.token) {
                                    console.log('🎯 Token detected, auto-setting...');
                                    setTimeout(() => setAuth(response.data.token), 1000);
                                }
                            }
                        }
                    } catch(e) {
                        console.log('XHR processing error:', e);
                    }
                });
                return originalXHR.call(this, data);
            };
            
            function setAuth(token) {
                try {
                    if (window.ui && window.ui.authActions) {
                        window.ui.authActions.authorize({
                            BearerAuth: { value: token }
                        });
                        console.log('✅ Auto-auth successful!');
                        
                        // Update button
                        setTimeout(() => {
                            const btn = document.querySelector('.btn.authorize');
                            if (btn) {
                                btn.textContent = '🔓 Authorized';
                                btn.style.backgroundColor = '#4CAF50';
                            }
                        }, 500);
                    }
                } catch(e) {
                    console.error('❌ Auto-auth failed:', e);
                }
            }
        }
    `);
});



// API routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/logs', logRoutes);

// Root endpoint
/**
 * @swagger
 * /:
 *   get:
 *     tags:
 *       - General
 *     summary: API information
 *     description: Get basic information about the Habit Tracker API
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Habit Tracker API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 documentation:
 *                   type: string
 *                   example: /api-docs
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     auth:
 *                       type: string
 *                       example: /api/auth (register, login, profile)
 *                     categories:
 *                       type: string
 *                       example: /api/categories
 *                     habits:
 *                       type: string
 *                       example: /api/habits
 *                     logs:
 *                       type: string
 *                       example: /api/logs
 */
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Habit Tracker API',
        version: '1.0.0',
        documentation: '/api-docs',
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
