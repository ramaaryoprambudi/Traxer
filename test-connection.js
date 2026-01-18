const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    try {
        console.log('Testing connection with config:');
        console.log({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'habit_tracker'
        });

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'habit_tracker'
        });

        console.log('✅ Connection successful');

        const [rows] = await connection.execute('SELECT * FROM users LIMIT 1');
        console.log('✅ Query successful, users table exists');
        console.log('Users count:', rows.length);

        await connection.end();
        console.log('✅ Connection closed');

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Error code:', error.code);
    }
}

testConnection();