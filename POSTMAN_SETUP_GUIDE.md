# 🚀 Panduan Import Postman Collection

## ❌ Masalah yang Diperbaiki
Error "getaddrinfo ENOTFOUND http" disebabkan oleh format URL yang salah di Postman Collection. Sekarang sudah diperbaiki!

## ✅ Langkah Import ke Postman

### 1. Import Collection
1. Buka Postman
2. Klik **Import** (tombol di kiri atas)
3. Pilih file `postman_collection.json`
4. Klik **Import**

### 2. Import Environment (Opsional tapi Disarankan)
1. Klik **Import** lagi
2. Pilih file `postman_environment.json` 
3. Klik **Import**
4. Di kanan atas, pilih environment **"Habit Tracker Environment"**

### 3. Manual Setup Environment (Alternatif)
Jika tidak import environment file:
1. Klik ⚙️ **Settings** di kanan atas
2. Klik **Add** untuk environment baru
3. Tambahkan variable:
   - `base_url` = `http://localhost:3000`
   - `jwt_token` = (kosong, akan auto-fill)

## 🧪 Testing Step by Step

### 1. Test Register
- **Collection:** Authentication → Register
- **Method:** POST
- **URL:** `{{base_url}}/api/auth/register`
- **Body:**
```json
{
    "nim": "2021001", 
    "name": "John Doe"
}
```
- **Expected:** Status 201, token auto-saved

### 2. Test Login  
- **Collection:** Authentication → Login
- **Method:** POST
- **URL:** `{{base_url}}/api/auth/login`
- **Body:** (sama dengan register)
- **Expected:** Status 200, token auto-saved

### 3. Test Protected Endpoint
- **Collection:** Authentication → Get Profile
- **Method:** GET
- **Headers:** Authorization auto-filled dengan JWT
- **Expected:** Status 200, user data

## 🔧 Troubleshooting

**Jika masih error:**
1. ✅ Pastikan server berjalan di `localhost:3000`
2. ✅ Pastikan environment dipilih
3. ✅ Pastikan variable `base_url` = `http://localhost:3000`
4. ✅ Test manual dengan URL langsung: `http://localhost:3000/health`

**Jika "No environment" di Postman:**
1. Import file `postman_environment.json`
2. Pilih environment di dropdown kanan atas

## 📋 File yang Tersedia
- ✅ `postman_collection.json` - Collection dengan format URL diperbaiki
- ✅ `postman_environment.json` - Environment variables
- ✅ `postman_collection_old.json` - Backup collection lama

**Sekarang Postman Collection siap digunakan tanpa error!** 🎉