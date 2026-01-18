# 📝 Authentication Endpoints

## Endpoint Register dan Login Terpisah

### 1. 🆕 Register User Baru
**Endpoint:** `POST /api/auth/register`

**Body:**
```json
{
    "nim": "2021001",
    "name": "John Doe"
}
```

**Response Success (201):**
```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": {
            "id": 1,
            "nim": "2021001", 
            "name": "John Doe",
            "created_at": "2026-01-13T00:00:00.000Z"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**Response Error (409) - User sudah ada:**
```json
{
    "success": false,
    "message": "User dengan NIM ini sudah terdaftar"
}
```

### 2. 🔑 Login User Existing
**Endpoint:** `POST /api/auth/login`

**Body:**
```json
{
    "nim": "2021001",
    "name": "John Doe"
}
```

**Response Success (200):**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": 1,
            "nim": "2021001", 
            "name": "John Doe",
            "created_at": "2026-01-13T00:00:00.000Z"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**Response Error (404) - User tidak ditemukan:**
```json
{
    "success": false,
    "message": "User tidak ditemukan. Silakan register terlebih dahulu"
}
```

## 💡 Perbedaan Register vs Login

- **Register**: Untuk user baru, akan error jika NIM sudah ada
- **Login**: Untuk user existing, akan error jika user tidak ditemukan
- **Token**: Kedua endpoint sama-sama mengembalikan JWT token untuk autentikasi