# 🚀 Ready-to-Use Postman Collection

## ✅ **Import & Test Langsung**

Collection ini sudah di-setup agar **langsung bisa digunakan** tanpa environment setup!

### 📋 **Cara Penggunaan:**

#### 1. **Import Collection**
- Buka Postman
- Klik **Import** 
- Pileh file `postman_collection.json`
- ✅ Collection ter-import dengan base_url = `http://localhost:3000`

#### 2. **Test Authentication**
🔵 **Step 1: Register User**
- Pilih request: `Authentication → Register`
- Klik **Send** (data sudah terisi otomatis)
- ✅ Status: `201 Created`
- 📋 **Copy token** dari console log

🔵 **Step 2: Login User**
- Pilih request: `Authentication → Login` 
- Klik **Send** (email/password sudah terisi)
- ✅ Status: `200 OK`
- 📋 **Copy token** dari console log

#### 3. **Test Protected Endpoints**
🔐 **Update Authorization Header:**
- Buka request apapun yang butuh auth
- Ganti `PUT_YOUR_TOKEN_HERE` dengan token dari step 1/2
- Klik **Send**

### 📊 **Default Test Data:**
```json
// Register/Login Data
{
    "name": "John Doe",
    "email": "john@university.ac.id", 
    "password": "password123",
    "nim": "2021001"
}
```

### 🎯 **Available Endpoints:**

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | ❌ | Register user baru |
| POST | `/api/auth/login` | ❌ | Login dengan email/password |
| GET | `/api/auth/profile` | ✅ | Get user profile |
| GET | `/api/categories` | ✅ | Get semua kategori |
| POST | `/api/habits` | ✅ | Buat habit baru |
| GET | `/api/habits` | ✅ | Get user habits |
| GET | `/api/habits/{id}` | ✅ | Get habit by ID |
| PUT | `/api/habits/{id}` | ✅ | Update habit |
| DELETE | `/api/habits/{id}` | ✅ | Delete habit |
| GET | `/api/habits/statistics` | ✅ | Get habit statistics |
| POST | `/api/logs` | ✅ | Log habit activity |
| GET | `/api/logs/today` | ✅ | Get today's logs |
| GET | `/api/logs` | ✅ | Get logs by date range |
| GET | `/api/logs/calendar` | ✅ | Get habit calendar |

### 💡 **Tips:**
1. ✅ **Server harus berjalan**: `npm run dev`
2. 🔑 **Token dari Console**: Lihat Postman Console untuk copy token
3. 📝 **Request Body**: Sudah terisi data test yang valid
4. 🌐 **URL Hardcoded**: `http://localhost:3000` (tidak perlu environment)

### 🔧 **No Setup Required:**
- ✅ Base URL otomatis: `{{base_url}}` = `http://localhost:3000`
- ✅ Data test sudah terisi
- ✅ Token helper di console log
- ✅ **Import → Send → Done!**

**Selamat testing!** 🎉