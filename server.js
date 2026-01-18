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

// Enhanced API Documentation untuk Mobile Developers
app.get('/docs', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>📱 Habit Tracker API - Mobile Developer Guide</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; background: #f8f9fa; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px; margin-bottom: 30px; }
            .nav { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .nav a { display: inline-block; padding: 8px 16px; background: #e9ecef; color: #495057; text-decoration: none; border-radius: 4px; margin: 4px; transition: all 0.3s; }
            .nav a:hover, .nav a.active { background: #007acc; color: white; }
            .section { background: white; padding: 30px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .endpoint { background: #f8f9fa; padding: 20px; margin: 15px 0; border-left: 4px solid #007acc; border-radius: 4px; }
            .method { display: inline-block; padding: 4px 8px; color: white; font-weight: bold; border-radius: 3px; font-size: 12px; min-width: 60px; text-align: center; }
            .method-get { background: #28a745; }
            .method-post { background: #007bff; }
            .method-put { background: #fd7e14; }
            .method-delete { background: #dc3545; }
            .url { font-family: 'Monaco', 'Menlo', monospace; font-weight: bold; margin-left: 10px; font-size: 14px; }
            .description { margin: 10px 0; color: #495057; }
            code { background: #e9ecef; padding: 3px 6px; border-radius: 3px; font-family: 'Monaco', 'Menlo', monospace; font-size: 13px; }
            pre { background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 13px; margin: 10px 0; }
            .btn { display: inline-block; padding: 12px 20px; background: #007acc; color: white; text-decoration: none; border-radius: 6px; margin: 8px 8px 8px 0; transition: background 0.3s; font-weight: 500; }
            .btn:hover { background: #005a99; }
            .btn-success { background: #28a745; }
            .btn-success:hover { background: #218838; }
            .status { padding: 4px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; }
            .status-ok { background: #d4edda; color: #155724; }
            .status-error { background: #f8d7da; color: #721c24; }
            .auth-flow { background: linear-gradient(45deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 8px; margin: 15px 0; }
            .response-example { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; margin: 10px 0; }
            .response-success { border-left: 4px solid #28a745; }
            .response-error { border-left: 4px solid #dc3545; }
            .params-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            .params-table th, .params-table td { border: 1px solid #dee2e6; padding: 8px 12px; text-align: left; }
            .params-table th { background: #f8f9fa; font-weight: 600; }
            .required { color: #dc3545; font-weight: bold; }
            .optional { color: #6c757d; }
            .step { background: white; border: 2px solid #e9ecef; border-radius: 6px; padding: 15px; margin: 10px 0; position: relative; }
            .step-number { position: absolute; top: -12px; left: 15px; background: #007acc; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📱 Habit Tracker API</h1>
                <p><strong>Complete Mobile Developer Integration Guide</strong></p>
                <div style="margin-top: 20px;">
                    <a href="/health" class="btn btn-success">💖 API Status</a>
                    <span class="status status-ok">Production: https://traxer-three.vercel.app</span>
                </div>
            </div>

            <div class="nav">
                <a href="#quick-start" class="active">🚀 Quick Start</a>
                <a href="#authentication">🔑 Authentication</a>
                <a href="#habits">📝 Habits</a>
                <a href="#logs">✅ Logs</a>
                <a href="#categories">📂 Categories</a>
                <a href="#errors">⚠️ Error Handling</a>
            </div>

            <div id="quick-start" class="section">
                <h2>🚀 Quick Start untuk Mobile Apps</h2>
                <div class="auth-flow">
                    <h3>📋 Integration Steps:</h3>
                    <div class="step">
                        <div class="step-number">1</div>
                        <strong>Base URL:</strong> <code>https://traxer-three.vercel.app</code>
                    </div>
                    <div class="step">
                        <div class="step-number">2</div>
                        <strong>Register User:</strong> POST <code>/api/auth/register</code> → Get JWT Token
                    </div>
                    <div class="step">
                        <div class="step-number">3</div>
                        <strong>Login User:</strong> POST <code>/api/auth/login</code> → Get JWT Token  
                    </div>
                    <div class="step">
                        <div class="step-number">4</div>
                        <strong>Set Auth Header:</strong> <code>Authorization: Bearer {token}</code>
                    </div>
                    <div class="step">
                        <div class="step-number">5</div>
                        <strong>Use Protected Endpoints:</strong> Habits, Logs, Categories, Profile
                    </div>
                </div>
            </div>

            <div id="authentication" class="section">
                <h2>🔑 Authentication</h2>
                <p><strong>⚡ All endpoints (except auth) require JWT token in header:</strong></p>
                <pre>Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</pre>
                
                <div class="endpoint">
                    <span class="method method-post">POST</span>
                    <span class="url">/api/auth/register</span>
                    <div class="description">Register new user account</div>
                    
                    <h4>📋 Request Body:</h4>
                    <table class="params-table">
                        <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
                        <tr><td>name</td><td>string</td><td class="required">✓</td><td>User full name (min 2 chars)</td></tr>
                        <tr><td>email</td><td>string</td><td class="required">✓</td><td>Valid email address</td></tr>
                        <tr><td>password</td><td>string</td><td class="required">✓</td><td>Password (min 6 chars)</td></tr>
                    </table>

                    <h4>📤 Request Example:</h4>
                    <pre>{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "password123"
}</pre>

                    <h4>📥 Success Response (201):</h4>
                    <div class="response-example response-success">
                        <pre>{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2026-01-18T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}</pre>
                    </div>
                </div>

                <div class="endpoint">
                    <span class="method method-post">POST</span>
                    <span class="url">/api/auth/login</span>
                    <div class="description">Login existing user</div>
                    
                    <h4>📋 Request Body:</h4>
                    <table class="params-table">
                        <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
                        <tr><td>email</td><td>string</td><td class="required">✓</td><td>Registered email</td></tr>
                        <tr><td>password</td><td>string</td><td class="required">✓</td><td>User password</td></tr>
                    </table>

                    <h4>📤 Request Example:</h4>
                    <pre>{
  "email": "john@example.com",
  "password": "password123"
}</pre>

                    <h4>📥 Success Response (200):</h4>
                    <div class="response-example response-success">
                        <pre>{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe", 
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}</pre>
                    </div>
                </div>

                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/auth/profile</span>
                    <div class="description">Get current user profile (requires auth)</div>
                    
                    <h4>📥 Success Response (200):</h4>
                    <div class="response-example response-success">
                        <pre>{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2026-01-18T10:30:00.000Z",
    "updated_at": "2026-01-18T10:30:00.000Z"
  }
}</pre>
                    </div>
                </div>
            </div>

            <div id="habits" class="section">
                <h2>📝 Habit Management</h2>
                <p><strong>🔒 All habit endpoints require authentication</strong></p>

                <div class="endpoint">
                    <span class="method method-post">POST</span>
                    <span class="url">/api/habits</span>
                    <div class="description">Create new habit</div>
                    
                    <h4>📋 Request Body:</h4>
                    <table class="params-table">
                        <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
                        <tr><td>name</td><td>string</td><td class="required">✓</td><td>Habit name</td></tr>
                        <tr><td>category_id</td><td>integer</td><td class="required">✓</td><td>Category ID (1-6)</td></tr>
                        <tr><td>description</td><td>string</td><td class="optional">○</td><td>Habit description</td></tr>
                        <tr><td>frequency_type</td><td>string</td><td class="optional">○</td><td>"daily", "weekly", "custom"</td></tr>
                        <tr><td>target_count</td><td>integer</td><td class="optional">○</td><td>Target per day (default: 1)</td></tr>
                        <tr><td>weekly_active_days</td><td>array</td><td class="optional">○</td><td>[1,2,3,4,5] for Mon-Fri</td></tr>
                    </table>

                    <h4>📤 Request Example:</h4>
                    <pre>{
  "name": "Morning Exercise",
  "description": "30 minutes workout",
  "category_id": 2,
  "frequency_type": "daily",
  "target_count": 1
}</pre>

                    <h4>📥 Success Response (201):</h4>
                    <div class="response-example response-success">
                        <pre>{
  "success": true,
  "message": "Habit created successfully", 
  "data": {
    "id": 1,
    "name": "Morning Exercise",
    "description": "30 minutes workout",
    "category_id": 2,
    "frequency_type": "daily",
    "target_count": 1,
    "is_active": true,
    "user_id": 1,
    "created_at": "2026-01-18T10:30:00.000Z"
  }
}</pre>
                    </div>
                </div>

                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/habits</span>
                    <div class="description">Get user habits with pagination and filters</div>
                    
                    <h4>📋 Query Parameters:</h4>
                    <table class="params-table">
                        <tr><th>Param</th><th>Type</th><th>Default</th><th>Description</th></tr>
                        <tr><td>page</td><td>integer</td><td>1</td><td>Page number</td></tr>
                        <tr><td>limit</td><td>integer</td><td>10</td><td>Items per page (max 50)</td></tr>
                        <tr><td>category_id</td><td>integer</td><td>-</td><td>Filter by category</td></tr>
                        <tr><td>is_active</td><td>boolean</td><td>-</td><td>Filter active habits</td></tr>
                        <tr><td>frequency_type</td><td>string</td><td>-</td><td>Filter by frequency</td></tr>
                    </table>

                    <h4>📤 Request Example:</h4>
                    <pre>GET /api/habits?page=1&limit=10&category_id=2&is_active=true</pre>

                    <h4>📥 Success Response (200):</h4>
                    <div class="response-example response-success">
                        <pre>{
  "success": true,
  "message": "Habits retrieved successfully",
  "data": {
    "habits": [
      {
        "id": 1,
        "name": "Morning Exercise",
        "description": "30 minutes workout", 
        "category_id": 2,
        "category_name": "Health",
        "frequency_type": "daily",
        "target_count": 1,
        "is_active": true,
        "created_at": "2026-01-18T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 10,
      "total": 1,
      "total_pages": 1
    }
  }
}</pre>
                    </div>
                </div>

                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/habits/:id</span>
                    <div class="description">Get specific habit details</div>
                    
                    <h4>📤 Request Example:</h4>
                    <pre>GET /api/habits/1</pre>
                </div>

                <div class="endpoint">
                    <span class="method method-put">PUT</span>
                    <span class="url">/api/habits/:id</span>
                    <div class="description">Update existing habit</div>
                    
                    <h4>📤 Request Example:</h4>
                    <pre>{
  "name": "Evening Exercise",
  "description": "45 minutes workout",
  "target_count": 2
}</pre>
                </div>

                <div class="endpoint">
                    <span class="method method-delete">DELETE</span>
                    <span class="url">/api/habits/:id</span>
                    <div class="description">Delete habit (soft delete)</div>
                </div>
            </div>

            <div id="logs" class="section">
                <h2>✅ Habit Logging</h2>
                <p><strong>🔒 All log endpoints require authentication</strong></p>

                <div class="endpoint">
                    <span class="method method-post">POST</span>
                    <span class="url">/api/logs</span>
                    <div class="description">Log habit completion</div>
                    
                    <h4>📋 Request Body:</h4>
                    <table class="params-table">
                        <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
                        <tr><td>habit_id</td><td>integer</td><td class="required">✓</td><td>Habit ID</td></tr>
                        <tr><td>date</td><td>string</td><td class="required">✓</td><td>Date (YYYY-MM-DD)</td></tr>
                        <tr><td>completed</td><td>boolean</td><td class="required">✓</td><td>Completion status</td></tr>
                        <tr><td>notes</td><td>string</td><td class="optional">○</td><td>Optional notes</td></tr>
                    </table>

                    <h4>📤 Request Example:</h4>
                    <pre>{
  "habit_id": 1,
  "date": "2026-01-18", 
  "completed": true,
  "notes": "Great 30min workout!"
}</pre>
                </div>

                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/logs/today</span>
                    <div class="description">Get today's habit completion status</div>
                    
                    <h4>📥 Success Response (200):</h4>
                    <div class="response-example response-success">
                        <pre>{
  "success": true,
  "message": "Today's logs retrieved successfully",
  "data": [
    {
      "habit_id": 1,
      "habit_name": "Morning Exercise",
      "is_completed": true,
      "completed_count": 1,
      "target_count": 1,
      "completion_percentage": 100,
      "notes": "Great workout!"
    }
  ]
}</pre>
                    </div>
                </div>

                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/logs</span>
                    <div class="description">Get habit logs with date range</div>
                    
                    <h4>📋 Query Parameters:</h4>
                    <table class="params-table">
                        <tr><th>Param</th><th>Type</th><th>Required</th><th>Description</th></tr>
                        <tr><td>start_date</td><td>string</td><td class="optional">○</td><td>Start date (YYYY-MM-DD)</td></tr>
                        <tr><td>end_date</td><td>string</td><td class="optional">○</td><td>End date (YYYY-MM-DD)</td></tr>
                        <tr><td>habit_id</td><td>integer</td><td class="optional">○</td><td>Filter by habit</td></tr>
                    </table>
                </div>
            </div>

            <div id="categories" class="section">
                <h2>📂 Categories</h2>
                <div class="endpoint">
                    <span class="method method-get">GET</span>
                    <span class="url">/api/categories</span>
                    <div class="description">Get all habit categories (requires auth)</div>
                    
                    <h4>📥 Success Response (200):</h4>
                    <div class="response-example response-success">
                        <pre>{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Exercise",
      "description": "Physical activities and workouts",
      "icon": "💪",
      "color": "#FF6B6B"
    },
    {
      "id": 2, 
      "name": "Health",
      "description": "Health and wellness habits",
      "icon": "❤️",
      "color": "#4ECDC4"
    }
  ]
}</pre>
                    </div>
                </div>
            </div>

            <div id="errors" class="section">
                <h2>⚠️ Error Handling</h2>
                <p><strong>All error responses follow this format:</strong></p>
                
                <div class="response-example response-error">
                    <pre>{
  "success": false,
  "message": "Error description",
  "details": "Additional error information"
}</pre>
                </div>

                <h3>📋 HTTP Status Codes:</h3>
                <table class="params-table">
                    <tr><th>Code</th><th>Status</th><th>Description</th></tr>
                    <tr><td>200</td><td>OK</td><td>Request successful</td></tr>
                    <tr><td>201</td><td>Created</td><td>Resource created successfully</td></tr>
                    <tr><td>400</td><td>Bad Request</td><td>Invalid request data</td></tr>
                    <tr><td>401</td><td>Unauthorized</td><td>Missing or invalid JWT token</td></tr>
                    <tr><td>403</td><td>Forbidden</td><td>Access denied</td></tr>
                    <tr><td>404</td><td>Not Found</td><td>Resource not found</td></tr>
                    <tr><td>409</td><td>Conflict</td><td>Duplicate entry (email exists)</td></tr>
                    <tr><td>422</td><td>Unprocessable Entity</td><td>Validation failed</td></tr>
                    <tr><td>500</td><td>Internal Server Error</td><td>Server error</td></tr>
                </table>

                <h3>🔑 Common Authentication Errors:</h3>
                <div class="response-example response-error">
                    <strong>401 - Missing Token:</strong>
                    <pre>{ "success": false, "message": "Access denied. No token provided." }</pre>
                </div>

                <div class="response-example response-error">
                    <strong>401 - Invalid Token:</strong>
                    <pre>{ "success": false, "message": "Invalid token" }</pre>
                </div>

                <div class="response-example response-error">
                    <strong>409 - Email Exists:</strong>
                    <pre>{ "success": false, "message": "Email already registered" }</pre>
                </div>
            </div>

            <div class="section">
                <h2>💡 Mobile Integration Tips</h2>
                <div class="auth-flow">
                    <h3>🔧 Best Practices:</h3>
                    <ul style="margin: 15px 0; padding-left: 20px;">
                        <li><strong>Token Storage:</strong> Store JWT securely (Keychain/SharedPreferences)</li>
                        <li><strong>Token Expiry:</strong> Handle 401 responses → redirect to login</li>
                        <li><strong>Network Errors:</strong> Implement retry logic with exponential backoff</li>
                        <li><strong>Offline Support:</strong> Cache data locally, sync when online</li>
                        <li><strong>Loading States:</strong> Show loading indicators for better UX</li>
                        <li><strong>Error Messages:</strong> Display user-friendly error messages</li>
                    </ul>
                </div>
            </div>
        </div>

        <script>
            // Smooth scrolling for navigation links
            document.querySelectorAll('.nav a').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                        
                        // Update active nav
                        document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
                        this.classList.add('active');
                    }
                });
            });
        </script>
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
