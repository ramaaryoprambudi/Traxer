const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    console.log('🔧 Setting up database...');

    // Koneksi tanpa database spesifik untuk membuat database
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    try {
        // Buat database terlebih dahulu
        const dbName = process.env.DB_NAME || 'habit_tracker';
        console.log(`📦 Creating database: ${dbName}`);
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        await connection.execute(`USE ${dbName}`);

        // Baca file schema
        const schemaPath = path.join(__dirname, '../sql/schema.sql');
        let schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Hapus baris CREATE DATABASE dan USE karena sudah dilakukan di atas
        schema = schema.replace(/CREATE DATABASE IF NOT EXISTS habit_tracker;\s*\n/, '');
        schema = schema.replace(/USE habit_tracker;\s*\n/, '');

        console.log('📄 Executing schema.sql...');
        
        // Split SQL statements dan jalankan satu per satu untuk menghindari masalah syntax
        const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.execute(statement.trim() + ';');
                } catch (error) {
                    // Skip error untuk statement yang mungkin sudah ada (seperti INSERT yang duplicate)
                    if (!error.message.includes('Duplicate entry')) {
                        console.log(`⚠️ Warning: ${error.message}`);
                    }
                }
            }
        }
        
        console.log('✅ Database setup completed successfully!');
        
        // Cek apakah tabel sudah dibuat
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('📋 Tables created:', tables.map(t => Object.values(t)[0]));
        
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

// Jalankan setup jika file dipanggil langsung
if (require.main === module) {
    setupDatabase();
}

module.exports = { setupDatabase };