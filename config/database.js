const mysql = require('mysql2/promise');
require('dotenv').config();

const url = process.env.DATABASE_URL;

// paksa terima self-signed cert
const pool = mysql.createPool(url + '&rejectUnauthorized=false');

module.exports = { pool };
