const mysql = require('mysql2/promise');
require('dotenv').config();

// Konfigurasi database connection pool untuk performa yang lebih baik
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'habit_tracker',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test koneksi database
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('⚠️ Database does not exist, creating it...');
            await createDatabase();
            console.log('✅ Database created and connected successfully');
        } else {
            console.error('❌ Database connection failed:', error.message);
            process.exit(1);
        }
    }
};

// Fungsi untuk membuat database jika belum ada
const createDatabase = async () => {
    const tempPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        const connection = await tempPool.getConnection();
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'habit_tracker'}`);
        connection.release();
        tempPool.end();
    } catch (error) {
        console.error('❌ Failed to create database:', error.message);
        process.exit(1);
    }
};

module.exports = { pool, testConnection };