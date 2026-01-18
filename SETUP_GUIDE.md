# Setup dan Testing Guide - Habit Tracker API

## Prerequisites
- Node.js (versi 14 atau lebih baru)
- MySQL Server
- Postman (untuk testing)

## Setup Instructions

### 1. Install Dependencies
```bash
cd menuju-uas
npm install
```

### 2. Setup Database
1. Buat database MySQL:
```sql
CREATE DATABASE habit_tracker;
```

2. Import schema:
```bash
mysql -u root -p habit_tracker < sql/schema.sql
```

Atau jalankan script SQL manual di MySQL Workbench/phpMyAdmin.

### 3. Konfigurasi Environment
Edit file `.env` sesuai konfigurasi database Anda:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=habit_tracker

# JWT Configuration  
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
```

### 4. Start Server
```bash
# Development mode (dengan nodemon)
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:3000`

## Testing dengan Postman

### Import Collection
1. Buka Postman
2. Click "Import" 
3. Pilih "Link" dan masukkan: `https://api.postman.com/collections/YOUR_COLLECTION_ID`

### Manual Testing Steps

#### 1. Test Health Check
```
GET http://localhost:3000/health
```

#### 2. Login/Register User
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
    "nim": "2021001",
    "name": "John Doe"
}
```

**Simpan token dari response untuk request selanjutnya!**

#### 3. Get Categories
```
GET http://localhost:3000/api/categories
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 4. Create Daily Habit
```
POST http://localhost:3000/api/habits
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
    "name": "Baca Buku",
    "description": "Membaca buku minimal 30 menit setiap hari",
    "category_id": 1,
    "frequency_type": "daily",
    "target_count": 1
}
```

#### 5. Create Weekly Habit
```
POST http://localhost:3000/api/habits
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
    "name": "Olahraga",
    "description": "Olahraga di gym",
    "category_id": 2,
    "frequency_type": "weekly",
    "active_days": [1, 3, 5],
    "target_count": 1
}
```

#### 6. Get All Habits
```
GET http://localhost:3000/api/habits
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 7. Get Today's Habits
```
GET http://localhost:3000/api/logs/today
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 8. Log Habit Completion
```
POST http://localhost:3000/api/logs
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
    "habit_id": 1,
    "date": "2024-01-15",
    "completed_count": 1,
    "is_completed": true,
    "notes": "Selesai baca 2 chapter"
}
```

#### 9. Get Habit Calendar
```
GET http://localhost:3000/api/logs/calendar?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 10. Get Habit Statistics
```
GET http://localhost:3000/api/habits/statistics
Authorization: Bearer YOUR_JWT_TOKEN
```

### Test Cases yang Harus Dicoba

#### Authentication Tests
- ✅ Login dengan NIM dan nama valid
- ✅ Login dengan NIM yang sudah ada (harus update nama jika berbeda)
- ❌ Login tanpa NIM
- ❌ Login dengan NIM kosong
- ❌ Request tanpa token
- ❌ Request dengan token invalid

#### Habit Management Tests
- ✅ Buat habit daily
- ✅ Buat habit weekly dengan active_days
- ❌ Buat habit tanpa nama
- ❌ Buat habit dengan category_id invalid
- ❌ Buat habit weekly tanpa active_days
- ✅ Update habit
- ✅ Delete habit
- ❌ Update habit milik user lain
- ❌ Delete habit milik user lain

#### Habit Logging Tests
- ✅ Log habit hari ini
- ✅ Log habit kemarin
- ✅ Log habit weekly pada hari aktif
- ❌ Log habit weekly pada hari non-aktif
- ❌ Log habit lebih dari 7 hari yang lalu
- ❌ Log habit untuk tanggal masa depan
- ✅ Update log yang sudah ada
- ✅ Delete log

#### Progress & Streak Tests
- ✅ Test streak calculation untuk consecutive days
- ✅ Test streak reset ketika terlewat hari
- ✅ Test longest streak tracking
- ✅ Test completion rate calculation

### Expected Responses

#### Success Response Format
```json
{
    "success": true,
    "message": "Operation successful",
    "data": { ... }
}
```

#### Paginated Response Format
```json
{
    "success": true,
    "message": "Data retrieved successfully", 
    "data": [ ... ],
    "pagination": {
        "currentPage": 1,
        "itemsPerPage": 10,
        "totalPages": 3,
        "totalCount": 25,
        "hasNextPage": true,
        "hasPrevPage": false
    }
}
```

#### Error Response Format
```json
{
    "success": false,
    "message": "Error description",
    "errors": [ ... ] // for validation errors
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check MySQL server is running
   - Verify credentials in `.env` file
   - Ensure database exists

2. **Token Expired/Invalid**
   - Login again to get new token
   - Check Authorization header format: `Bearer TOKEN`

3. **Validation Errors**
   - Check required fields in request body
   - Verify data types match API specification

4. **CORS Errors**
   - Server configured for localhost origins
   - Add your domain to CORS configuration if needed

5. **Rate Limit Exceeded**
   - Wait for rate limit window to reset
   - Default: 100 requests per 15 minutes

### Debugging Tips

1. Check server logs in terminal
2. Use Postman's console for request details
3. Verify JWT token is not expired
4. Test with simple requests first (health check, login)
5. Check MySQL query logs for database issues

## Development Tips

### Database Management
```bash
# Reset database (caution: deletes all data)
mysql -u root -p -e "DROP DATABASE habit_tracker; CREATE DATABASE habit_tracker;"
mysql -u root -p habit_tracker < sql/schema.sql
```

### Environment Modes
```bash
# Development with auto-restart
NODE_ENV=development npm run dev

# Production mode
NODE_ENV=production npm start
```

### Testing with Different Users
Create multiple users with different NIMs to test user isolation and authorization.