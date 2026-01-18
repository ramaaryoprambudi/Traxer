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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
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
    customfavIcon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzQ5Y2M5MCIvPgo8cGF0aCBkPSJNOCAxNmw0IDQgOC04IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIuNSIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4K",
    swaggerOptions: {
        persistAuthorization: true,
        tryItOutEnabled: true,
        filter: true,
        displayRequestDuration: true
    },
    customJs: `
        // Auto-authentication handler
        window.addEventListener('DOMContentLoaded', function() {
            // Add info banner
            setTimeout(function() {
                const infoDiv = document.createElement('div');
                infoDiv.className = 'auto-auth-info';
                infoDiv.innerHTML = \`
                    <div>🤖 <strong>Auto-Authentication Enabled!</strong></div>
                    <div style="margin-top: 8px; font-size: 14px;">Register atau Login akan otomatis mengatur token authentication</div>
                \`;
                
                const infoSection = document.querySelector('.information-container');
                if (infoSection) {
                    infoSection.appendChild(infoDiv);
                }
            }, 1000);

            // Function to auto-authorize with token
            function autoAuthorize(token) {
                try {
                    // Get Swagger UI instance
                    const ui = window.ui;
                    if (ui && ui.authActions) {
                        // Set authorization
                        ui.authActions.authorize({
                            BearerAuth: {
                                name: "BearerAuth",
                                schema: {
                                    type: "http",
                                    scheme: "bearer",
                                    bearerFormat: "JWT"
                                },
                                value: token
                            }
                        });
                        
                        // Show success message
                        showAuthMessage('✅ Token berhasil diset otomatis!', 'success');
                        
                        // Update authorize button text
                        setTimeout(() => {
                            const authBtn = document.querySelector('.btn.authorize');
                            if (authBtn) {
                                authBtn.innerHTML = '🔓 Authorized';
                                authBtn.style.backgroundColor = '#4CAF50';
                            }
                        }, 500);
                        
                        console.log('🤖 Auto-authorization successful with token:', token.substring(0, 20) + '...');
                    }
                } catch (error) {
                    console.error('❌ Auto-authorization failed:', error);
                    showAuthMessage('❌ Gagal set token otomatis', 'error');
                }
            }

            // Function to show auth message
            function showAuthMessage(message, type) {
                const banner = document.querySelector('.auto-auth-info');
                if (banner) {
                    const statusDiv = document.createElement('div');
                    statusDiv.className = type;
                    statusDiv.style.marginTop = '10px';
                    statusDiv.innerHTML = message;
                    banner.appendChild(statusDiv);
                    
                    // Remove message after 5 seconds
                    setTimeout(() => {
                        statusDiv.remove();
                    }, 5000);
                }
            }

            // Intercept XHR responses for auth endpoints
            const originalXHROpen = XMLHttpRequest.prototype.open;
            const originalXHRSend = XMLHttpRequest.prototype.send;
            
            XMLHttpRequest.prototype.open = function(method, url, ...args) {
                this._method = method;
                this._url = url;
                return originalXHROpen.call(this, method, url, ...args);
            };
            
            XMLHttpRequest.prototype.send = function(data) {
                const xhr = this;
                
                // Add response handler
                xhr.addEventListener('load', function() {
                    try {
                        // Check if this is a register or login request
                        if (xhr._url && (xhr._url.includes('/auth/register') || xhr._url.includes('/auth/login'))) {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                const response = JSON.parse(xhr.responseText);
                                
                                // Check if response has token
                                if (response.success && response.data && response.data.token) {
                                    const token = response.data.token;
                                    console.log('🎯 Detected auth response, auto-setting token...');
                                    
                                    // Auto-authorize after a short delay
                                    setTimeout(() => {
                                        autoAuthorize(token);
                                    }, 500);
                                }
                            }
                        }
                    } catch (error) {
                        console.log('Response processing error:', error);
                    }
                });
                
                return originalXHRSend.call(this, data);
            };

            // Intercept fetch requests as backup
            const originalFetch = window.fetch;
            window.fetch = function(url, options = {}) {
                return originalFetch(url, options).then(response => {
                    // Check if this is an auth endpoint response
                    if (response.ok && (url.includes('/auth/register') || url.includes('/auth/login'))) {
                        response.clone().json().then(data => {
                            if (data.success && data.data && data.data.token) {
                                const token = data.data.token;
                                console.log('🎯 Detected fetch auth response, auto-setting token...');
                                
                                setTimeout(() => {
                                    autoAuthorize(token);
                                }, 500);
                            }
                        }).catch(() => {
                            // Ignore parsing errors
                        });
                    }
                    return response;
                });
            };

            // Wait for Swagger UI to be fully loaded
            let checkSwaggerUI = setInterval(function() {
                if (window.ui && window.ui.authActions) {
                    clearInterval(checkSwaggerUI);
                    console.log('🚀 Swagger UI loaded, auto-auth ready!');
                    
                    // Add click handlers to Try It Out buttons for auth endpoints
                    setTimeout(function() {
                        const tryItButtons = document.querySelectorAll('.try-out__btn');
                        tryItButtons.forEach(btn => {
                            btn.addEventListener('click', function() {
                                // Check if this is an auth endpoint
                                const operationDiv = btn.closest('.opblock');
                                if (operationDiv) {
                                    const pathSpan = operationDiv.querySelector('.opblock-summary-path span');
                                    if (pathSpan && (pathSpan.textContent.includes('/auth/register') || pathSpan.textContent.includes('/auth/login'))) {
                                        console.log('🎯 Auth endpoint Try It Out clicked');
                                    }
                                }
                            });
                        });
                    }, 2000);
                }
            }, 100);
        });
    `
}));



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
