const mysql = require('mysql2');
require('dotenv').config();

async function setupDatabase() {
    console.log('🔧 Setting up database...');

    // Koneksi dengan callback style untuk menghindari masalah prepared statement
    const connection = mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    return new Promise((resolve, reject) => {
        connection.connect((err) => {
            if (err) {
                console.error('❌ Connection failed:', err.message);
                reject(err);
                return;
            }

            const dbName = process.env.DB_NAME || 'habit_tracker';
            console.log(`📦 Creating database: ${dbName}`);

            // Buat database
            connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err) => {
                if (err) {
                    console.error('❌ Failed to create database:', err.message);
                    reject(err);
                    return;
                }

                // Gunakan database
                connection.query(`USE ${dbName}`, (err) => {
                    if (err) {
                        console.error('❌ Failed to use database:', err.message);
                        reject(err);
                        return;
                    }

                    console.log('📋 Creating tables...');

                    // Buat tabel satu per satu
                    const createTables = [
                        `CREATE TABLE IF NOT EXISTS users (
                            id INT PRIMARY KEY AUTO_INCREMENT,
                            name VARCHAR(100) NOT NULL,
                            email VARCHAR(150) UNIQUE NOT NULL,
                            password VARCHAR(255) NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        )`,
                        
                        `CREATE TABLE IF NOT EXISTS categories (
                            id INT PRIMARY KEY AUTO_INCREMENT,
                            name VARCHAR(50) NOT NULL UNIQUE,
                            description TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )`,
                        
                        `INSERT IGNORE INTO categories (name, description) VALUES
                        ('Akademik', 'Habit yang berkaitan dengan akademik dan pembelajaran'),
                        ('Kesehatan', 'Habit yang berkaitan dengan kesehatan fisik dan mental'),
                        ('Personal', 'Habit untuk pengembangan personal dan produktivitas')`,
                        
                        `CREATE TABLE IF NOT EXISTS habits (
                            id INT PRIMARY KEY AUTO_INCREMENT,
                            user_id INT NOT NULL,
                            category_id INT NOT NULL,
                            name VARCHAR(200) NOT NULL,
                            description TEXT,
                            frequency_type ENUM('daily', 'weekly') DEFAULT 'daily',
                            active_days JSON,
                            target_count INT DEFAULT 1,
                            is_active BOOLEAN DEFAULT TRUE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                            FOREIGN KEY (category_id) REFERENCES categories(id)
                        )`,
                        
                        `CREATE TABLE IF NOT EXISTS habit_logs (
                            id INT PRIMARY KEY AUTO_INCREMENT,
                            habit_id INT NOT NULL,
                            user_id INT NOT NULL,
                            date DATE NOT NULL,
                            completed_count INT DEFAULT 0,
                            is_completed BOOLEAN DEFAULT FALSE,
                            notes TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                            UNIQUE KEY unique_habit_date (habit_id, date)
                        )`,
                        
                        `CREATE TABLE IF NOT EXISTS streaks (
                            id INT PRIMARY KEY AUTO_INCREMENT,
                            habit_id INT NOT NULL,
                            user_id INT NOT NULL,
                            current_streak INT DEFAULT 0,
                            longest_streak INT DEFAULT 0,
                            last_completed_date DATE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                            UNIQUE KEY unique_habit_streak (habit_id, user_id)
                        )`
                    ];

                    let completed = 0;
                    createTables.forEach((query, index) => {
                        connection.query(query, (err) => {
                            if (err) {
                                console.log(`⚠️ Warning for table ${index + 1}:`, err.message);
                            }
                            completed++;
                            
                            if (completed === createTables.length) {
                                // Tampilkan tabel yang berhasil dibuat
                                connection.query('SHOW TABLES', (err, results) => {
                                    if (!err) {
                                        console.log('✅ Database setup completed!');
                                        console.log('📋 Tables:', results.map(r => Object.values(r)[0]));
                                    }
                                    connection.end();
                                    resolve();
                                });
                            }
                        });
                    });
                });
            });
        });
    });
}

// Jalankan setup jika file dipanggil langsung
if (require.main === module) {
    setupDatabase().catch(console.error);
}

module.exports = { setupDatabase };