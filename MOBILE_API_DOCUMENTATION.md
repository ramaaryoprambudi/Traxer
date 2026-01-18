# 📱 Habit Tracker API Documentation for Mobile Apps

Complete API documentation for mobile app developers to integrate with the Habit Tracker backend.

## 🌐 Base Configuration

```javascript
const BASE_URL = "https://traxer-three.vercel.app"; // Production server URL
const FULL_API_URL = "https://traxer-three.vercel.app/api";
```

### 🔗 Quick Test

Test if the server is running:
```bash
curl https://traxer-three.vercel.app/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Habit Tracker API is running",
  "timestamp": "2026-01-18T10:30:00.000Z"
}
```

## � Quick Start Guide for Mobile Developers

### Step 1: Test API Connection
```bash
# Test server health
curl https://traxer-three.vercel.app/health

# Expected response:
# {"status":"OK","message":"Habit Tracker API is running"}
```

### Step 2: Test Authentication Flow
```bash
# 1. Register a test user
curl -X POST https://traxer-three.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# 2. Login and get token
curl -X POST https://traxer-three.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Copy the token from response and use it in next requests
```

### Step 3: Test Core Features
```bash
# Replace YOUR_TOKEN with actual token from login response
TOKEN="YOUR_TOKEN_HERE"

# Get categories
curl -H "Authorization: Bearer $TOKEN" \
  https://traxer-three.vercel.app/api/categories

# Create a habit
curl -X POST https://traxer-three.vercel.app/api/habits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Morning Exercise",
    "description": "30 minutes workout",
    "category_id": 2,
    "frequency_type": "daily",
    "target_count": 1
  }'

# Get today's habits
curl -H "Authorization: Bearer $TOKEN" \
  https://traxer-three.vercel.app/api/logs/today
```

### Step 4: Integration Checklist

✅ **Before Starting Development:**
- [ ] Test API endpoints with cURL or Postman
- [ ] Understand authentication flow (register → login → get token → use token)
- [ ] Review response formats and error codes
- [ ] Plan data models for your mobile app

✅ **Required Features to Implement:**
- [ ] User authentication (register/login/logout)
- [ ] Secure token storage (Keychain/Keystore/AsyncStorage)
- [ ] Habit CRUD operations
- [ ] Daily habit logging
- [ ] Today's habits dashboard
- [ ] Progress tracking and statistics

✅ **Recommended Features:**
- [ ] Offline data caching
- [ ] Push notifications for habit reminders
- [ ] Calendar view for habit history
- [ ] Streak motivation features
- [ ] Data synchronization handling

## �🔐 Authentication Flow

### 1. User Registration

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (201):**
```json
{
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
}
```

**Error Response (409 - Email already exists):**
```json
{
  "success": false,
  "message": "Email sudah terdaftar",
  "statusCode": 409
}
```

### 2. User Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2026-01-18T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get User Profile

**Endpoint:** `GET /api/auth/profile`
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2026-01-18T10:30:00.000Z",
    "total_habits": 5,
    "active_habits": 4,
    "total_logged_days": 23
  }
}
```

## 📂 Categories

### Get All Categories

**Endpoint:** `GET /api/categories`
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Akademik",
      "description": "Habit yang berkaitan dengan akademik dan pembelajaran",
      "created_at": "2026-01-18T10:30:00.000Z"
    },
    {
      "id": 2,
      "name": "Kesehatan",
      "description": "Habit yang berkaitan dengan kesehatan fisik dan mental",
      "created_at": "2026-01-18T10:30:00.000Z"
    },
    {
      "id": 3,
      "name": "Personal",
      "description": "Habit untuk pengembangan personal dan produktivitas",
      "created_at": "2026-01-18T10:30:00.000Z"
    }
  ]
}
```

## 📝 Habits Management

### 1. Create Habit

**Endpoint:** `POST /api/habits`
**Headers:** `Authorization: Bearer {token}`

**Daily Habit Request:**
```json
{
  "name": "Morning Exercise",
  "description": "30 minutes of exercise every morning",
  "category_id": 2,
  "frequency_type": "daily",
  "target_count": 1
}
```

**Weekly Habit Request:**
```json
{
  "name": "Study Session",
  "description": "2 hours of focused study",
  "category_id": 1,
  "frequency_type": "weekly",
  "active_days": [1, 2, 3, 4, 5],
  "target_count": 2
}
```

**Note:** `active_days` uses 1-7 format (1=Monday, 7=Sunday)

**Success Response (201):**
```json
{
  "success": true,
  "message": "Habit created successfully",
  "data": {
    "id": 1,
    "name": "Morning Exercise",
    "description": "30 minutes of exercise every morning",
    "frequency_type": "daily",
    "active_days": null,
    "target_count": 1,
    "is_active": true,
    "created_at": "2026-01-18T10:30:00.000Z",
    "updated_at": "2026-01-18T10:30:00.000Z",
    "category_name": "Kesehatan",
    "category_description": "Habit yang berkaitan dengan kesehatan fisik dan mental"
  }
}
```

### 2. Get User Habits

**Endpoint:** `GET /api/habits`
**Headers:** `Authorization: Bearer {token}`

**Query Parameters (Optional):**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `category_id`: Filter by category
- `frequency_type`: Filter by frequency (daily/weekly)
- `is_active`: Filter active habits (true/false)

**Example:** `GET /api/habits?page=1&limit=5&category_id=2&is_active=true`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Habits retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Morning Exercise",
      "description": "30 minutes of exercise every morning",
      "frequency_type": "daily",
      "active_days": null,
      "target_count": 1,
      "is_active": true,
      "created_at": "2026-01-18T10:30:00.000Z",
      "updated_at": "2026-01-18T10:30:00.000Z",
      "category_name": "Kesehatan",
      "completion_rate": 75.5,
      "current_streak": 5,
      "longest_streak": 12
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalCount": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 3. Get Single Habit

**Endpoint:** `GET /api/habits/{id}`
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Habit retrieved successfully",
  "data": {
    "id": 1,
    "name": "Morning Exercise",
    "description": "30 minutes of exercise every morning",
    "frequency_type": "daily",
    "active_days": null,
    "target_count": 1,
    "is_active": true,
    "created_at": "2026-01-18T10:30:00.000Z",
    "updated_at": "2026-01-18T10:30:00.000Z",
    "category_name": "Kesehatan",
    "category_description": "Habit yang berkaitan dengan kesehatan fisik dan mental",
    "completion_rate": 75.5,
    "current_streak": 5,
    "longest_streak": 12,
    "total_completions": 23,
    "this_week_completions": 4
  }
}
```

### 4. Update Habit

**Endpoint:** `PUT /api/habits/{id}`
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "name": "Updated Morning Exercise",
  "description": "45 minutes of intense exercise every morning",
  "category_id": 2,
  "frequency_type": "daily",
  "target_count": 1,
  "is_active": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Habit updated successfully",
  "data": {
    "id": 1,
    "name": "Updated Morning Exercise",
    "description": "45 minutes of intense exercise every morning",
    "frequency_type": "daily",
    "active_days": null,
    "target_count": 1,
    "is_active": true,
    "updated_at": "2026-01-18T11:30:00.000Z"
  }
}
```

### 5. Delete Habit

**Endpoint:** `DELETE /api/habits/{id}`
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Habit deleted successfully"
}
```

### 6. Get Habit Statistics

**Endpoint:** `GET /api/habits/statistics`
**Headers:** `Authorization: Bearer {token}`

**Query Parameters (Optional):**
- `period`: Time period (week/month/year)
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Habit statistics retrieved successfully",
  "data": {
    "overview": {
      "total_habits": 5,
      "active_habits": 4,
      "total_completions": 87,
      "overall_completion_rate": 78.5,
      "current_active_streaks": 3,
      "longest_streak_ever": 25
    },
    "category_breakdown": [
      {
        "category_name": "Kesehatan",
        "habit_count": 2,
        "completion_rate": 85.2,
        "total_completions": 45
      },
      {
        "category_name": "Akademik",
        "habit_count": 2,
        "completion_rate": 72.1,
        "total_completions": 32
      }
    ],
    "recent_performance": {
      "this_week": 6,
      "last_week": 8,
      "this_month": 23,
      "last_month": 28
    }
  }
}
```

## ✅ Habit Logging

### 1. Log Habit Completion

**Endpoint:** `POST /api/logs`
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "habit_id": 1,
  "date": "2026-01-18",
  "completed_count": 1,
  "is_completed": true,
  "notes": "Great workout session today!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Habit logged successfully",
  "data": {
    "id": 123,
    "habit_id": 1,
    "user_id": 1,
    "date": "2026-01-18",
    "completed_count": 1,
    "is_completed": true,
    "notes": "Great workout session today!",
    "created_at": "2026-01-18T12:30:00.000Z",
    "updated_at": "2026-01-18T12:30:00.000Z",
    "habit_name": "Morning Exercise",
    "target_count": 1
  }
}
```

### 2. Get Habit Logs

**Endpoint:** `GET /api/logs`
**Headers:** `Authorization: Bearer {token}`

**Query Parameters (Optional):**
- `habit_id`: Filter by specific habit
- `date`: Specific date (YYYY-MM-DD)
- `start_date`: Start date range
- `end_date`: End date range
- `page`: Page number
- `limit`: Items per page

**Example:** `GET /api/logs?habit_id=1&start_date=2026-01-01&end_date=2026-01-18`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Habit logs retrieved successfully",
  "data": [
    {
      "id": 123,
      "habit_id": 1,
      "habit_name": "Morning Exercise",
      "date": "2026-01-18",
      "completed_count": 1,
      "is_completed": true,
      "notes": "Great workout session today!",
      "target_count": 1,
      "created_at": "2026-01-18T12:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalCount": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 3. Get Today's Habits

**Endpoint:** `GET /api/logs/today`
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Today's habits retrieved successfully",
  "data": {
    "date": "2026-01-18",
    "habits": [
      {
        "habit_id": 1,
        "habit_name": "Morning Exercise",
        "category_name": "Kesehatan",
        "frequency_type": "daily",
        "target_count": 1,
        "completed_count": 1,
        "is_completed": true,
        "notes": "Great workout session today!",
        "is_active_today": true
      },
      {
        "habit_id": 2,
        "habit_name": "Read Books",
        "category_name": "Personal",
        "frequency_type": "daily",
        "target_count": 1,
        "completed_count": 0,
        "is_completed": false,
        "notes": null,
        "is_active_today": true
      }
    ],
    "summary": {
      "total_habits": 2,
      "completed_habits": 1,
      "completion_rate": 50.0,
      "remaining_habits": 1
    }
  }
}
```

### 4. Get Habit Calendar

**Endpoint:** `GET /api/logs/calendar`
**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `month`: Month (1-12)
- `year`: Year (YYYY)

**Example:** `GET /api/logs/calendar?month=1&year=2026`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Habit calendar retrieved successfully",
  "data": {
    "month": 1,
    "year": 2026,
    "calendar": [
      {
        "date": "2026-01-01",
        "total_habits": 3,
        "completed_habits": 2,
        "completion_rate": 66.7
      },
      {
        "date": "2026-01-02",
        "total_habits": 3,
        "completed_habits": 3,
        "completion_rate": 100.0
      }
    ],
    "monthly_summary": {
      "total_logged_days": 18,
      "average_completion_rate": 78.5,
      "best_day": {
        "date": "2026-01-15",
        "completion_rate": 100.0
      },
      "current_month_streak": 5
    }
  }
}
```

### 5. Get Streaks Information

**Endpoint:** `GET /api/logs/streaks`
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Streaks retrieved successfully",
  "data": [
    {
      "habit_id": 1,
      "habit_name": "Morning Exercise",
      "current_streak": 5,
      "longest_streak": 12,
      "last_completed_date": "2026-01-18",
      "is_active": true,
      "streak_status": "active"
    },
    {
      "habit_id": 2,
      "habit_name": "Read Books",
      "current_streak": 0,
      "longest_streak": 8,
      "last_completed_date": "2026-01-15",
      "is_active": true,
      "streak_status": "broken"
    }
  ]
}
```

## 🚨 Error Handling

### Common HTTP Status Codes

- **200**: Success
- **201**: Created successfully
- **400**: Bad Request (validation error)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (access denied)
- **404**: Not Found
- **409**: Conflict (duplicate data)
- **429**: Too Many Requests (rate limit)
- **500**: Internal Server Error

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400,
  "details": {
    "field": "email",
    "error": "Email format is invalid"
  }
}
```

### Validation Errors (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "details": [
    {
      "field": "name",
      "message": "Name is required"
    },
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

## 📱 Mobile Implementation Examples

### Android (Kotlin) Example

```kotlin
// API Service Interface
interface HabitTrackerApi {
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): ApiResponse<AuthResponse>
    
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): ApiResponse<AuthResponse>
    
    @GET("habits")
    suspend fun getHabits(
        @Header("Authorization") token: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 10
    ): ApiResponse<HabitsResponse>
    
    @POST("logs")
    suspend fun logHabit(
        @Header("Authorization") token: String,
        @Body request: LogHabitRequest
    ): ApiResponse<LogResponse>
}

// Usage Example
class HabitRepository {
    private val api = Retrofit.Builder()
        .baseUrl("https://traxer-three.vercel.app/api/")
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(HabitTrackerApi::class.java)
    
    suspend fun loginUser(email: String, password: String): AuthResponse {
        val request = LoginRequest(email, password)
        val response = api.login(request)
        
        if (response.success) {
            // Save token for future requests
            saveAuthToken(response.data.token)
            return response.data
        } else {
            throw Exception(response.message)
        }
    }
    
    // Helper function to add Bearer token
    private fun getAuthHeader(token: String) = "Bearer $token"
}

// Data Classes
data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String
)

data class ApiResponse<T>(
    val success: Boolean,
    val message: String,
    val data: T
)
```
```

### iOS (Swift) Example

```swift
// API Service
class HabitTrackerAPI {
    private let baseURL = "https://traxer-three.vercel.app/api"
    private var authToken: String?
    
    func login(email: String, password: String) async throws -> AuthResponse {
        let url = URL(string: "\(baseURL)/auth/login")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let loginData = LoginRequest(email: email, password: password)
        request.httpBody = try JSONEncoder().encode(loginData)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        if let httpResponse = response as? HTTPURLResponse,
           httpResponse.statusCode == 200 {
            let apiResponse = try JSONDecoder().decode(ApiResponse<AuthResponse>.self, from: data)
            if apiResponse.success {
                self.authToken = apiResponse.data.token
                // Store token in Keychain for persistence
                try storeTokenInKeychain(apiResponse.data.token)
                return apiResponse.data
            }
        }
        
        throw APIError.loginFailed
    }
    
    func getHabits(page: Int = 1, limit: Int = 10) async throws -> HabitsResponse {
        guard let token = authToken else { throw APIError.notAuthenticated }
        
        let url = URL(string: "\(baseURL)/habits?page=\(page)&limit=\(limit)")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(ApiResponse<HabitsResponse>.self, from: data)
        
        if response.success {
            return response.data
        } else {
            throw APIError.requestFailed(response.message)
        }
    }
    
    func logHabit(habitId: Int, date: String, isCompleted: Bool = true, notes: String = "") async throws -> LogResponse {
        guard let token = authToken else { throw APIError.notAuthenticated }
        
        let url = URL(string: "\(baseURL)/logs")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let logData = LogHabitRequest(habitId: habitId, date: date, isCompleted: isCompleted, notes: notes)
        request.httpBody = try JSONEncoder().encode(logData)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(ApiResponse<LogResponse>.self, from: data)
        
        return response.data
    }
    
    // Helper function to store token securely
    private func storeTokenInKeychain(_ token: String) throws {
        // Implementation for storing token in iOS Keychain
        // This is important for security in production apps
    }
}

// Data Models
struct LoginRequest: Codable {
    let email: String
    let password: String
}

struct LogHabitRequest: Codable {
    let habitId: Int
    let date: String
    let isCompleted: Bool
    let notes: String
    
    enum CodingKeys: String, CodingKey {
        case habitId = "habit_id"
        case date, notes
        case isCompleted = "is_completed"
    }
}

struct ApiResponse<T: Codable>: Codable {
    let success: Bool
    let message: String
    let data: T
}

enum APIError: Error {
    case notAuthenticated
    case loginFailed
    case requestFailed(String)
}
```
```

### React Native (JavaScript) Example

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Service
class HabitTrackerAPI {
  constructor() {
    this.baseURL = 'https://traxer-three.vercel.app/api';
    this.authToken = null;
  }

  // Initialize token from storage when app starts
  async initializeToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        this.authToken = token;
      }
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        this.authToken = data.data.token;
        // Store token in AsyncStorage for persistence
        await AsyncStorage.setItem('authToken', this.authToken);
        await AsyncStorage.setItem('userData', JSON.stringify(data.data.user));
        return data.data;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(name, email, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        this.authToken = data.data.token;
        await AsyncStorage.setItem('authToken', this.authToken);
        await AsyncStorage.setItem('userData', JSON.stringify(data.data.user));
        return data.data;
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async getHabits(page = 1, limit = 10, categoryId = null) {
    try {
      let url = `${this.baseURL}/habits?page=${page}&limit=${limit}`;
      if (categoryId) {
        url += `&category_id=${categoryId}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        return data;
      } else {
        throw new Error(data.message || 'Failed to fetch habits');
      }
    } catch (error) {
      console.error('Get habits error:', error);
      throw error;
    }
  }

  async createHabit(habitData) {
    try {
      const response = await fetch(`${this.baseURL}/habits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(habitData),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create habit');
      }
    } catch (error) {
      console.error('Create habit error:', error);
      throw error;
    }
  }

  async logHabit(habitId, date, isCompleted = true, notes = '') {
    try {
      const response = await fetch(`${this.baseURL}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          habit_id: habitId,
          date: date,
          is_completed: isCompleted,
          completed_count: isCompleted ? 1 : 0,
          notes: notes
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to log habit');
      }
    } catch (error) {
      console.error('Log habit error:', error);
      throw error;
    }
  }

  async getTodaysHabits() {
    try {
      const response = await fetch(`${this.baseURL}/logs/today`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch today\'s habits');
      }
    } catch (error) {
      console.error('Get today\'s habits error:', error);
      throw error;
    }
  }

  async getHabitStatistics() {
    try {
      const response = await fetch(`${this.baseURL}/habits/statistics`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Get statistics error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      this.authToken = null;
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Utility function to check if user is authenticated
  isAuthenticated() {
    return this.authToken !== null;
  }

  // Get current date in YYYY-MM-DD format
  getCurrentDate() {
    return new Date().toISOString().split('T')[0];
  }
}

// Usage Examples
const api = new HabitTrackerAPI();

// Initialize API when app starts
const initializeApp = async () => {
  await api.initializeToken();
  if (api.isAuthenticated()) {
    // User is already logged in
    console.log('User is authenticated');
  }
};

// Login user
const loginUser = async (email, password) => {
  try {
    const userData = await api.login(email, password);
    console.log('User logged in:', userData);
    return userData;
  } catch (error) {
    console.error('Login failed:', error.message);
    throw error;
  }
};

// Get habits with loading state
const fetchHabits = async (setLoading, setHabits, setError) => {
  try {
    setLoading(true);
    const response = await api.getHabits();
    setHabits(response.data);
    setError(null);
  } catch (error) {
    setError(error.message);
    console.error('Failed to fetch habits:', error.message);
  } finally {
    setLoading(false);
  }
};

// Create a daily habit
const createDailyHabit = async (name, description, categoryId) => {
  try {
    const habitData = {
      name,
      description,
      category_id: categoryId,
      frequency_type: 'daily',
      target_count: 1
    };
    
    const newHabit = await api.createHabit(habitData);
    console.log('Habit created:', newHabit);
    return newHabit;
  } catch (error) {
    console.error('Failed to create habit:', error.message);
    throw error;
  }
};

// Log habit completion for today
const markHabitComplete = async (habitId, notes = '') => {
  try {
    const today = api.getCurrentDate();
    const logResult = await api.logHabit(habitId, today, true, notes);
    console.log('Habit logged:', logResult);
    return logResult;
  } catch (error) {
    console.error('Failed to log habit:', error.message);
    throw error;
  }
};

export default HabitTrackerAPI;
```

## 🔧 Best Practices for Mobile Integration

### 1. Token Management
- Store JWT token securely (Keychain/Keystore)
- Implement automatic token refresh
- Handle token expiration gracefully

### 2. Network Handling
- Implement proper retry mechanisms
- Handle offline scenarios
- Show loading states during API calls

### 3. Data Synchronization
- Implement local caching for offline access
- Sync data when connection is restored
- Handle conflict resolution

### 4. Error Handling
- Display user-friendly error messages
- Log errors for debugging
- Implement fallback mechanisms

### 5. Performance Optimization
- Use pagination for large datasets
- Implement lazy loading
- Cache frequently accessed data

---

## 📞 Support & Testing

### 🌐 Server Information
- **Production URL**: `https://traxer-three.vercel.app`
- **API Base URL**: `https://traxer-three.vercel.app/api`
- **Health Check**: `https://traxer-three.vercel.app/health`

### 🧪 Testing Tools
- **Postman Collection**: Import `habit_tracker_postman_collection.json`
- **Environment File**: Use `postman_environment.json` 
- **Test Scripts**: Automated shell scripts available
- **cURL Examples**: Provided throughout this documentation

### 📱 Mobile Development Tips

#### Rate Limiting
- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: Check `X-RateLimit-*` headers in responses
- **Handling**: Implement exponential backoff for retry logic

#### Date Format
- **Format**: Always use `YYYY-MM-DD` for dates
- **Timezone**: Server uses UTC, handle timezone conversion in mobile app
- **Today's Date**: Use `new Date().toISOString().split('T')[0]` in JavaScript

#### Weekly Habits Active Days
- **Format**: Array of numbers [1, 2, 3, 4, 5, 6, 7]
- **Mapping**: 1=Monday, 2=Tuesday, ..., 7=Sunday
- **Example**: [1, 2, 3, 4, 5] = Monday to Friday

#### Error Handling Best Practices
```javascript
// Always check both HTTP status and API success flag
if (response.ok && data.success) {
  // Handle success
} else {
  // Handle API error
  console.error('API Error:', data.message);
}
```

#### Token Management
```javascript
// Check token expiration (JWT tokens expire in 7 days)
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};
```

### 🆘 Troubleshooting

#### Common Issues:

1. **401 Unauthorized**
   - Check if token is valid and not expired
   - Ensure `Bearer ` prefix in Authorization header
   - Verify user exists and is authenticated

2. **400 Bad Request**
   - Check required fields in request body
   - Validate date format (YYYY-MM-DD)
   - Ensure category_id exists

3. **404 Not Found**
   - Verify endpoint URL is correct
   - Check if habit/log ID exists and belongs to user

4. **429 Too Many Requests**
   - Implement rate limiting in your app
   - Add delays between requests
   - Cache data to reduce API calls

#### Debug Checklist:
- [ ] Server is accessible (test /health endpoint)
- [ ] API endpoint URL is correct
- [ ] Request headers include Content-Type and Authorization
- [ ] Request body JSON is properly formatted
- [ ] User is authenticated and token is valid
- [ ] Required fields are included in request

### 📧 Contact & Support
For technical issues:
1. Check error messages and status codes
2. Review this documentation
3. Test with cURL or Postman first
4. Check server logs if needed

Need help? Provide:
- Exact request URL and method
- Request headers and body
- Response status and body
- Mobile platform (iOS/Android/React Native)

**Happy coding! 🎉**
