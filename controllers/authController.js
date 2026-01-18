const { pool } = require('../config/database');
const { generateToken, responseFormatter } = require('../utils/helpers');
const bcrypt = require('bcryptjs');

const authController = {
    // Register user baru
    register: async (req, res) => {
        try {
            const { name, email, password } = req.body;

            // Validasi input
            if (!name || !email || !password) {
                return res.status(400).json(responseFormatter.error('Semua field harus diisi', null, 400));
            }

            if (password.length < 6) {
                return res.status(400).json(responseFormatter.error('Password minimal 6 karakter', null, 400));
            }

            // Cek apakah email sudah ada
            const [existingUsers] = await pool.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            if (existingUsers.length > 0) {
                return res.status(409).json(responseFormatter.error('Email sudah terdaftar', null, 409));
            }

            // Hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Buat user baru
            const [result] = await pool.execute(
                'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                [name, email, hashedPassword]
            );

            const user = {
                id: result.insertId,
                name,
                email,
                created_at: new Date(),
                updated_at: new Date()
            };

            // Generate JWT token
            const token = generateToken(user.id, user.email, user.name);

            res.status(201).json(responseFormatter.success({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    created_at: user.created_at
                },
                token
            }, 'User registered successfully'));

        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json(responseFormatter.error('Registration failed'));
        }
    },

    // Login user dengan email dan password
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Validasi input
            if (!email || !password) {
                return res.status(400).json(responseFormatter.error('Email dan password harus diisi', null, 400));
            }

            // Cek apakah user ada berdasarkan email
            const [existingUsers] = await pool.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            if (existingUsers.length === 0) {
                return res.status(401).json(responseFormatter.error('Email atau password salah', null, 401));
            }

            const user = existingUsers[0];

            // Verifikasi password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json(responseFormatter.error('Email atau password salah', null, 401));
            }

            // Generate JWT token
            const token = generateToken(user.id, user.email, user.name);

            res.status(200).json(responseFormatter.success({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    created_at: user.created_at
                },
                token
            }, 'Login successful'));

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json(responseFormatter.error('Login failed'));
        }
    },

    // Get user profile
    getProfile: async (req, res) => {
        try {
            const userId = req.user.id;

            const [users] = await pool.execute(`
                SELECT 
                    u.id, 
                    u.email, 
                    u.name, 
                    u.created_at,
                    COUNT(DISTINCT h.id) as total_habits,
                    COUNT(DISTINCT CASE WHEN h.is_active = TRUE THEN h.id END) as active_habits,
                    COUNT(DISTINCT hl.date) as total_logged_days
                FROM users u
                LEFT JOIN habits h ON u.id = h.user_id
                LEFT JOIN habit_logs hl ON u.id = hl.user_id
                WHERE u.id = ?
                GROUP BY u.id, u.email, u.name, u.created_at
            `, [userId]);

            if (users.length === 0) {
                return res.status(404).json(responseFormatter.error('User not found', null, 404));
            }

            res.status(200).json(responseFormatter.success(users[0], 'Profile retrieved successfully'));

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json(responseFormatter.error('Failed to get profile'));
        }
    },

    // Update user profile
    updateProfile: async (req, res) => {
        try {
            const userId = req.user.id;
            const { name } = req.body;

            // Validate input
            if (!name || name.trim().length < 2) {
                return res.status(400).json(responseFormatter.error('Name must be at least 2 characters', null, 400));
            }

            await pool.execute(
                'UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [name.trim(), userId]
            );

            res.status(200).json(responseFormatter.success(
                { name: name.trim() }, 
                'Profile updated successfully'
            ));

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json(responseFormatter.error('Failed to update profile'));
        }
    },

    // Verify token (untuk testing)
    verifyToken: async (req, res) => {
        try {
            res.status(200).json(responseFormatter.success({
                user: req.user,
                message: 'Token is valid'
            }, 'Token verification successful'));
        } catch (error) {
            console.error('Token verification error:', error);
            res.status(500).json(responseFormatter.error('Token verification failed'));
        }
    }
};

module.exports = authController;