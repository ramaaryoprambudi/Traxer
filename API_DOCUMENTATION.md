# Habit Tracker API Documentation

## Overview
API habit tracker untuk aplikasi mobile dengan fitur manajemen habit, tracking progress, dan sistem streak.

## Base URL
```
http://localhost:3000
```

## Authentication
Menggunakan JWT Bearer Token. Setelah login, tambahkan header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## API Endpoints

### 1. Authentication

#### POST /api/auth/login
Login atau register user baru.

**Request Body:**
```json
{
    "nim": "2021001",
    "name": "John Doe"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": 1,
            "nim": "2021001", 
            "name": "John Doe",
            "created_at": "2024-01-15T10:00:00.000Z"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

#### GET /api/auth/profile
Mendapatkan profile user dengan statistik.

**Headers:** `Authorization: Bearer TOKEN`

**Response:**
```json
{
    "success": true,
    "message": "Profile retrieved successfully",
    "data": {
        "id": 1,
        "nim": "2021001",
        "name": "John Doe",
        "created_at": "2024-01-15T10:00:00.000Z",
        "total_habits": 5,
        "active_habits": 4,
        "total_logged_days": 15
    }
}
```

### 2. Categories

#### GET /api/categories
Mendapatkan semua kategori habit.

**Headers:** `Authorization: Bearer TOKEN`

**Response:**
```json
{
    "success": true,
    "message": "Categories retrieved successfully",
    "data": [
        {
            "id": 1,
            "name": "Akademik",
            "description": "Habit yang berkaitan dengan akademik dan pembelajaran",
            "habit_count": 3,
            "created_at": "2024-01-15T10:00:00.000Z"
        }
    ]
}
```

### 3. Habits

#### POST /api/habits
Membuat habit baru.

**Headers:** `Authorization: Bearer TOKEN`

**Request Body:**
```json
{
    "name": "Baca Buku",
    "description": "Membaca buku minimal 30 menit setiap hari",
    "category_id": 1,
    "frequency_type": "daily",
    "target_count": 1
}
```

**Request Body (Weekly Habit):**
```json
{
    "name": "Olahraga",
    "description": "Olahraga di gym",
    "category_id": 2,
    "frequency_type": "weekly",
    "active_days": [1, 3, 5],
    "target_count": 1
}
```

#### GET /api/habits
Mendapatkan daftar habit user.

**Headers:** `Authorization: Bearer TOKEN`

**Query Parameters:**
- `page` (optional): Halaman (default: 1)
- `limit` (optional): Jumlah per halaman (default: 10)
- `category_id` (optional): Filter berdasarkan kategori
- `is_active` (optional): true/false/all (default: true)
- `frequency_type` (optional): daily/weekly

#### GET /api/habits/:id
Mendapatkan detail habit berdasarkan ID.

#### PUT /api/habits/:id
Update habit.

**Request Body:** (sama seperti POST, field optional)
```json
{
    "name": "Baca Buku Update",
    "is_active": false
}
```

#### DELETE /api/habits/:id
Menghapus habit dan semua data terkait.

#### GET /api/habits/statistics
Mendapatkan statistik habit user.

**Query Parameters:**
- `start_date` (optional): YYYY-MM-DD
- `end_date` (optional): YYYY-MM-DD

### 4. Habit Logs (Checklist)

#### POST /api/logs
Menandai habit sebagai selesai.

**Headers:** `Authorization: Bearer TOKEN`

**Request Body:**
```json
{
    "habit_id": 1,
    "date": "2024-01-15",
    "completed_count": 1,
    "is_completed": true,
    "notes": "Selesai baca 2 chapter"
}
```

#### GET /api/logs
Mendapatkan riwayat log habit.

**Query Parameters:**
- `habit_id` (optional): Filter berdasarkan habit
- `date` (optional): Tanggal tertentu (YYYY-MM-DD)
- `start_date` & `end_date` (optional): Range tanggal
- `page` & `limit` (optional): Pagination

#### GET /api/logs/today
Mendapatkan habit hari ini dengan status completion.

**Response:**
```json
{
    "success": true,
    "message": "Today's habits retrieved successfully",
    "data": {
        "date": "2024-01-15",
        "summary": {
            "total_habits": 3,
            "completed_habits": 2,
            "pending_habits": 1,
            "completion_rate": 67
        },
        "habits": [
            {
                "id": 1,
                "name": "Baca Buku",
                "category_name": "Akademik",
                "is_completed": true,
                "current_streak": 5,
                "completed_count": 1,
                "target_count": 1
            }
        ]
    }
}
```

#### GET /api/logs/calendar
Mendapatkan kalender aktivitas habit.

**Query Parameters:**
- `start_date` & `end_date` (optional): Range tanggal
- `habit_id` (optional): Filter berdasarkan habit tertentu

#### DELETE /api/logs/:id
Menghapus log habit.

## Error Responses

### 400 Bad Request
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        {
            "field": "name",
            "message": "Habit name is required",
            "value": ""
        }
    ]
}
```

### 401 Unauthorized
```json
{
    "success": false,
    "message": "Access token required"
}
```

### 404 Not Found
```json
{
    "success": false,
    "message": "Habit not found"
}
```

### 429 Too Many Requests
```json
{
    "success": false,
    "message": "Too many requests, please try again later."
}
```

## Security Features

1. **Rate Limiting**: Membatasi jumlah request per IP
2. **Input Validation**: Validasi semua input menggunakan express-validator
3. **SQL Injection Prevention**: Menggunakan parameterized queries
4. **XSS Protection**: Input sanitization
5. **CORS Configuration**: Konfigurasi domain yang diizinkan
6. **Helmet Security**: Security headers
7. **JWT Authentication**: Token-based authentication

## Data Types

### Frequency Types
- `daily`: Habit harian
- `weekly`: Habit mingguan dengan hari aktif tertentu

### Active Days (untuk weekly habits)
Array integer 1-7:
- 1 = Senin
- 2 = Selasa 
- 3 = Rabu
- 4 = Kamis
- 5 = Jumat
- 6 = Sabtu
- 7 = Minggu

### Categories
1. Akademik
2. Kesehatan  
3. Personal