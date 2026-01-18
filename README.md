# 🎯 Habit Tracker API

A comprehensive RESTful API for habit tracking and personal productivity management, built with Node.js, Express, and MySQL. Perfect for building habit tracking applications with user authentication, habit management, and progress tracking features.

## ✨ Features

### 🔐 Authentication & Security
- Email-based registration and login with JWT tokens and bcrypt password hashing
- JWT Authentication with expiration
- Rate limiting for API protection
- Input validation and sanitization
- SQL injection protection
- XSS protection with security middleware
- CORS configuration

### 👤 User Management
- Profile management with comprehensive statistics
- User isolation (each user can only access their own data)
- Email-based user identification
- Secure password hashing with bcrypt

### 📝 Habit Management
- ✅ Full CRUD operations for habits
- ✅ Categories system (Academic, Health, Personal)
- ✅ Flexible frequency system:
  - **Daily habits**: Everyday habits
  - **Weekly habits**: Weekly habits with custom active days
- ✅ Target count per habit
- ✅ Active/inactive status management

### ✅ Habit Tracking & Logging
- Mark habits as completed per day
- Support for completion count and notes
- Today's habits view with completion status
- Active days validation for weekly habits
- Comprehensive logging with timestamps

### 🔥 Progress & Streak System
- **Current streak**: Consecutive completion days
- **Longest streak**: Personal best record
- Automatic streak calculation and updates
- Smart streak reset logic
- Completion rate analytics

### 📊 Statistics & Analytics
- User statistics (total habits, completion rates, etc.)
- Habit-specific performance metrics
- Progress tracking with percentages
- Date range filtering for detailed analytics
- Calendar views and habit statistics

### 📅 History & Calendar
- Habit calendar view dengan completion data
- Riwayat habit berdasarkan tanggal
- Daily completion summary
- Export-friendly data format

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+ recommended)
- MySQL (v5.7+ or v8.0+)
- npm or yarn

### 1. Clone and Install
```bash
git clone <repository-url>
cd habit-tracker-api
npm install
```

### 2. Setup Database
```bash
# Option 1: Use setup script (recommended)
node scripts/simple-setup.js

# Option 2: Manual setup
mysql -u root -p < sql/schema.sql
```

### 3. Configure Environment
Create `.env` file:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=habit_tracker
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
PORT=3000
```

### 4. Test Database Connection
```bash
node test-connection.js
```

### 5. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 6. Test the API
```bash
# Test server health
curl http://localhost:3000/health

# Run comprehensive tests
./quick-test.sh
```

Server will run at `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication
The API uses email-based authentication with JWT tokens:
1. Register with email and password
2. Login to receive JWT token
3. Include token in Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Core Endpoints

#### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register with email/password | ❌ |
| POST | `/api/auth/login` | Login with email/password | ❌ |
| GET | `/api/auth/profile` | Get user profile with stats | ✅ |

#### Categories
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/categories` | Get all habit categories | ✅ |

#### Habits
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/habits` | Create new habit | ✅ |
| GET | `/api/habits` | Get user habits (paginated) | ✅ |
| GET | `/api/habits/:id` | Get habit details | ✅ |
| PUT | `/api/habits/:id` | Update habit | ✅ |
| DELETE | `/api/habits/:id` | Delete habit | ✅ |
| GET | `/api/habits/statistics` | Get habit analytics | ✅ |

#### Habit Logs
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/logs` | Log habit completion | ✅ |
| GET | `/api/logs` | Get habit logs (filtered) | ✅ |
| GET | `/api/logs/calendar` | Get calendar view | ✅ |
| GET | `/api/logs/streaks` | Get streak information | ✅ |

### Example Usage

#### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Create Daily Habit
```bash
curl -X POST http://localhost:3000/api/habits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Morning Exercise",
    "description": "30 minutes workout",
    "category_id": 2,
    "frequency_type": "daily",
    "target_count": 1
  }'
```

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete reference.

## 🧪 Testing

### Automated Test Scripts
The project includes comprehensive shell scripts for testing:

```bash
# Quick functionality test
./quick-test.sh

# Complete CRUD operations test
./test-full-crud.sh

# Email authentication system test
./test-email-auth.sh

# Habit streaks functionality test
./test-streaks.sh

# Complete streaks test suite
./complete-streaks-test.sh

# Logs functionality test
./test-logs.sh
```

### Postman Collections
- Import `habit_tracker_postman_collection.json`
- Use `postman_environment.json` for environment setup
- Follow [POSTMAN_SETUP_GUIDE.md](POSTMAN_SETUP_GUIDE.md)
- Ready-to-use collection: [POSTMAN_READY_TO_USE.md](POSTMAN_READY_TO_USE.md)

### Test Coverage
- ✅ Email-based authentication flow
- ✅ User registration and login
- ✅ Habit CRUD operations
- ✅ Daily and weekly habit management
- ✅ Habit logging and completion tracking
- ✅ Streak calculation and statistics
- ✅ Progress analytics and reporting
- ✅ Input validation and error handling
- ✅ User authorization and data isolation
- ✅ Rate limiting and security features

## 🏗️ Architecture

### Project Structure
```
├── config/
│   └── database.js          # Database connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── categoryController.js # Category management
│   ├── habitController.js   # Habit CRUD operations
│   └── logController.js     # Habit logging & tracking
├── middleware/
│   ├── auth.js             # JWT authentication
│   ├── rateLimiter.js      # Rate limiting
│   └── validation.js       # Input validation
├── routes/
│   ├── authRoutes.js       # Auth endpoints
│   ├── categoryRoutes.js   # Category endpoints  
│   ├── habitRoutes.js      # Habit endpoints
│   └── logRoutes.js        # Logging endpoints
├── utils/
│   └── helpers.js          # Utility functions
├── sql/
│   └── schema.sql          # Database schema
└── server.js               # Main application
```

### Database Schema
- `users` - User accounts with email authentication
- `categories` - Habit categories (Academic, Health, Personal)
- `habits` - Habit definitions with frequency and targets
- `habit_logs` - Daily habit completion tracking
- `streaks` - Streak tracking and statistics

### Key Schema Features
- Email-based user authentication with password hashing
- JSON fields for flexible data (active_days for weekly habits)
- Foreign key constraints for data integrity
- Optimized indexes for query performance
- Database views for complex statistics
- Automatic timestamp management

### Security Features
- Rate limiting (100 req/15min untuk API umum)
- JWT dengan expiration (7 hari default)
- Input validation dengan express-validator
- SQL injection prevention dengan prepared statements
- XSS protection dengan input sanitization
- CORS configuration
- Helmet.js security headers

## 🔧 Configuration

### Environment Variables
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=habit_tracker
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Database Connection Pool
- Connection limit: 10
- Acquire timeout: 60s
- Auto-reconnect enabled

## 🚦 Error Handling

API menggunakan format response yang konsisten:

### Success Response
```json
{
    "success": true,
    "message": "Operation successful",
    "data": { ... }
}
```

### Error Response
```json
{
    "success": false,
    "message": "Error description",
    "errors": [ ... ]
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## 📋 Development

### Prerequisites
- Node.js 14+
- MySQL 5.7+ or 8.0+
- npm atau yarn

### Development Commands
```bash
# Install dependencies
npm install

# Start development server dengan auto-restart
npm run dev

# Start production server
npm start

# Test database connection
node -e "require('./config/database').testConnection()"
```

### Adding New Features
1. Update database schema di `sql/schema.sql`
2. Buat controller di `controllers/`
3. Tambahkan routes di `routes/`
4. Update validation di `middleware/validation.js`
5. Test dengan Postman
6. Update dokumentasi

## 🤝 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

## 📄 License

MIT License - lihat file LICENSE untuk detail.

## 📞 Support

Jika ada pertanyaan atau masalah:
1. Cek [SETUP_GUIDE.md](SETUP_GUIDE.md) untuk troubleshooting
2. Lihat [API_DOCUMENTATION.md](API_DOCUMENTATION.md) untuk referensi API
3. Test dengan Postman collection
4. Cek server logs untuk error details