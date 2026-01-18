const { pool } = require('../config/database');
const { responseFormatter, calculatePagination, dateUtils } = require('../utils/helpers');

// Helper function to safely parse JSON for active_days
const parseActiveDays = (activeDaysString) => {
    if (!activeDaysString || activeDaysString === 'null' || activeDaysString === 'undefined') {
        return null;
    }
    
    // If it's already an object/array, return as is
    if (typeof activeDaysString === 'object') {
        return activeDaysString;
    }
    
    try {
        return JSON.parse(activeDaysString);
    } catch (error) {
        console.error('Error parsing active_days:', activeDaysString, error.message);
        return null;
    }
};

// Helper function to safely stringify active_days for database storage
const stringifyActiveDays = (activeDays) => {
    return (activeDays && activeDays.length > 0) ? JSON.stringify(activeDays) : null;
};

const habitController = {
    // Create new habit
    createHabit: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const userId = req.user.id;
            const { 
                name, 
                description, 
                category_id, 
                frequency_type = 'daily', 
                active_days = null,
                target_count = 1 
            } = req.body;

            // Validate category exists
            const [categories] = await connection.execute(
                'SELECT id FROM categories WHERE id = ?',
                [category_id]
            );

            if (categories.length === 0) {
                await connection.rollback();
                return res.status(400).json(responseFormatter.error('Invalid category ID', null, 400));
            }

            // For weekly habits, validate active_days
            if (frequency_type === 'weekly' && (!active_days || active_days.length === 0)) {
                await connection.rollback();
                return res.status(400).json(responseFormatter.error('Active days are required for weekly habits', null, 400));
            }

            // Insert habit
            const activeDaysJson = stringifyActiveDays(active_days);
            const [result] = await connection.execute(`
                INSERT INTO habits (user_id, category_id, name, description, frequency_type, active_days, target_count) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [userId, category_id, name, description, frequency_type, activeDaysJson, target_count]);

            const habitId = result.insertId;

            // Initialize streak record
            await connection.execute(`
                INSERT INTO streaks (habit_id, user_id, current_streak, longest_streak) 
                VALUES (?, ?, 0, 0)
            `, [habitId, userId]);

            await connection.commit();

            // Get created habit with category info
            const [habits] = await pool.execute(`
                SELECT 
                    h.id,
                    h.name,
                    h.description,
                    h.frequency_type,
                    h.active_days,
                    h.target_count,
                    h.is_active,
                    h.created_at,
                    h.updated_at,
                    c.name as category_name,
                    c.description as category_description
                FROM habits h
                JOIN categories c ON h.category_id = c.id
                WHERE h.id = ?
            `, [habitId]);

            // Format active_days for weekly habits
            const habit = habits[0];
            habit.active_days = parseActiveDays(habit.active_days);

            res.status(201).json(responseFormatter.success(
                habit,
                'Habit created successfully'
            ));

        } catch (error) {
            await connection.rollback();
            console.error('Create habit error:', error.message);
            console.error('Error details:', error);
            res.status(500).json(responseFormatter.error('Failed to create habit'));
        } finally {
            connection.release();
        }
    },

    // Get user's habits
    getHabits: async (req, res) => {
        let connection;
        try {
            const userId = req.user.id;
            const { 
                page = 1, 
                limit = 10, 
                category_id, 
                is_active = 'true',
                frequency_type 
            } = req.query;

            // Get dedicated connection
            connection = await pool.getConnection();

            // Build query conditions
            let whereConditions = ['h.user_id = ?'];
            let queryParams = [userId];

            if (category_id) {
                whereConditions.push('h.category_id = ?');
                queryParams.push(category_id);
            }

            if (is_active !== 'all') {
                whereConditions.push('h.is_active = ?');
                queryParams.push(is_active === 'true' ? 1 : 0);
            }

            if (frequency_type) {
                whereConditions.push('h.frequency_type = ?');
                queryParams.push(frequency_type);
            }

            const whereClause = whereConditions.join(' AND ');

            // Get total count
            const [countResult] = await connection.execute(`
                SELECT COUNT(*) as total 
                FROM habits h 
                WHERE ${whereClause}
            `, queryParams);

            const totalCount = countResult[0].total;
            const pagination = calculatePagination(page, limit, totalCount);

            // Get habits with pagination - using string interpolation for LIMIT/OFFSET
            const [habits] = await connection.execute(`
                SELECT 
                    h.id,
                    h.name,
                    h.description,
                    h.frequency_type,
                    h.active_days,
                    h.target_count,
                    h.is_active,
                    h.created_at,
                    h.updated_at,
                    c.name as category_name,
                    c.description as category_description
                FROM habits h
                JOIN categories c ON h.category_id = c.id
                WHERE ${whereClause}
                ORDER BY h.created_at DESC
                LIMIT ${parseInt(pagination.itemsPerPage)} OFFSET ${parseInt(pagination.offset)}
            `, queryParams);

            // Format active_days for weekly habits
            const formattedHabits = habits.map(habit => ({
                ...habit,
                active_days: parseActiveDays(habit.active_days)
            }));

            res.status(200).json(responseFormatter.paginated(
                formattedHabits,
                pagination,
                'Habits retrieved successfully'
            ));

        } catch (error) {
            console.error('Get habits error:', error.message);
            console.error('Error details:', error);
            res.status(500).json(responseFormatter.error('Failed to get habits'));
        } finally {
            if (connection) connection.release();
        }
    },

    // Get habit by ID
    getHabitById: async (req, res) => {
        let connection;
        try {
            const habitId = req.params.id;
            const userId = req.user.id;

            connection = await pool.getConnection();

            const [habits] = await connection.execute(`
                SELECT 
                    h.id,
                    h.name,
                    h.description,
                    h.frequency_type,
                    h.active_days,
                    h.target_count,
                    h.is_active,
                    h.created_at,
                    h.updated_at,
                    c.name as category_name,
                    c.description as category_description,
                    COALESCE(s.current_streak, 0) as current_streak,
                    COALESCE(s.longest_streak, 0) as longest_streak,
                    s.last_completed_date,
                    COALESCE(COUNT(hl.id), 0) as total_logs,
                    COALESCE(COUNT(CASE WHEN hl.is_completed = TRUE THEN 1 END), 0) as completed_logs,
                    COALESCE(
                        ROUND(
                            COUNT(CASE WHEN hl.is_completed = TRUE THEN 1 END) * 100.0 / 
                            NULLIF(COUNT(hl.id), 0), 
                            2
                        ), 0
                    ) as completion_rate
                FROM habits h
                JOIN categories c ON h.category_id = c.id
                LEFT JOIN streaks s ON h.id = s.habit_id
                LEFT JOIN habit_logs hl ON h.id = hl.habit_id
                WHERE h.id = ? AND h.user_id = ?
                GROUP BY h.id, h.name, h.description, h.frequency_type, h.active_days, 
                         h.target_count, h.is_active, h.created_at, h.updated_at,
                         c.name, c.description, s.current_streak, s.longest_streak, s.last_completed_date
            `, [habitId, userId]);

            if (habits.length === 0) {
                return res.status(404).json(responseFormatter.error('Habit not found', null, 404));
            }

            // Format active_days for weekly habits
            const habit = habits[0];
            habit.active_days = parseActiveDays(habit.active_days);

            res.status(200).json(responseFormatter.success(
                habit,
                'Habit retrieved successfully'
            ));

        } catch (error) {
            console.error('Get habit by ID error:', error.message);
            console.error('Error details:', error);
            res.status(500).json(responseFormatter.error('Failed to get habit'));
        } finally {
            if (connection) connection.release();
        }
    },

    // Update habit
    updateHabit: async (req, res) => {
        let connection;
        try {
            const habitId = req.params.id;
            const userId = req.user.id;
            const { 
                name, 
                description, 
                category_id, 
                frequency_type, 
                active_days,
                target_count,
                is_active 
            } = req.body;

            connection = await pool.getConnection();

            // Check if habit exists and belongs to user
            const [existingHabits] = await connection.execute(
                'SELECT * FROM habits WHERE id = ? AND user_id = ?',
                [habitId, userId]
            );

            if (existingHabits.length === 0) {
                return res.status(404).json(responseFormatter.error('Habit not found', null, 404));
            }

            // Validate category if provided
            if (category_id) {
                const [categories] = await connection.execute(
                    'SELECT id FROM categories WHERE id = ?',
                    [category_id]
                );

                if (categories.length === 0) {
                    return res.status(400).json(responseFormatter.error('Invalid category ID', null, 400));
                }
            }

            // For weekly habits, validate active_days
            if (frequency_type === 'weekly' && (!active_days || active_days.length === 0)) {
                return res.status(400).json(responseFormatter.error('Active days are required for weekly habits', null, 400));
            }

            // Build update query dynamically
            const updateFields = [];
            const updateValues = [];

            if (name !== undefined) {
                updateFields.push('name = ?');
                updateValues.push(name);
            }

            if (description !== undefined) {
                updateFields.push('description = ?');
                updateValues.push(description);
            }

            if (category_id !== undefined) {
                updateFields.push('category_id = ?');
                updateValues.push(category_id);
            }

            if (frequency_type !== undefined) {
                updateFields.push('frequency_type = ?');
                updateValues.push(frequency_type);
            }

            if (active_days !== undefined) {
                updateFields.push('active_days = ?');
                updateValues.push(stringifyActiveDays(active_days));
            }

            if (target_count !== undefined) {
                updateFields.push('target_count = ?');
                updateValues.push(target_count);
            }

            if (is_active !== undefined) {
                updateFields.push('is_active = ?');
                updateValues.push(is_active);
            }

            // Only proceed if there are fields to update
            if (updateFields.length === 0) {
                return res.status(400).json(responseFormatter.error('No fields to update'));
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(habitId, userId);

            await connection.execute(`
                UPDATE habits 
                SET ${updateFields.join(', ')} 
                WHERE id = ? AND user_id = ?
            `, updateValues);

            // Get updated habit with category info
            const [updatedHabits] = await connection.execute(`
                SELECT 
                    h.id,
                    h.name,
                    h.description,
                    h.frequency_type,
                    h.active_days,
                    h.target_count,
                    h.is_active,
                    h.created_at,
                    h.updated_at,
                    c.name as category_name,
                    c.description as category_description
                FROM habits h
                JOIN categories c ON h.category_id = c.id
                WHERE h.id = ? AND h.user_id = ?
            `, [habitId, userId]);

            // Format active_days for weekly habits
            const habit = updatedHabits[0];
            habit.active_days = parseActiveDays(habit.active_days);

            res.status(200).json(responseFormatter.success(
                habit,
                'Habit updated successfully'
            ));

        } catch (error) {
            console.error('Update habit error:', error.message);
            console.error('Error details:', error);
            res.status(500).json(responseFormatter.error('Failed to update habit'));
        } finally {
            if (connection) connection.release();
        }
    },

    // Delete habit
    deleteHabit: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const habitId = req.params.id;
            const userId = req.user.id;

            // Check if habit exists and belongs to user
            const [existingHabits] = await connection.execute(
                'SELECT * FROM habits WHERE id = ? AND user_id = ?',
                [habitId, userId]
            );

            if (existingHabits.length === 0) {
                await connection.rollback();
                return res.status(404).json(responseFormatter.error('Habit not found', null, 404));
            }

            // Delete related records (cascade delete)
            await connection.execute('DELETE FROM streaks WHERE habit_id = ?', [habitId]);
            await connection.execute('DELETE FROM habit_logs WHERE habit_id = ?', [habitId]);
            await connection.execute('DELETE FROM habits WHERE id = ?', [habitId]);

            await connection.commit();

            res.status(200).json(responseFormatter.success(
                null,
                'Habit deleted successfully'
            ));

        } catch (error) {
            await connection.rollback();
            console.error('Delete habit error:', error);
            res.status(500).json(responseFormatter.error('Failed to delete habit'));
        } finally {
            connection.release();
        }
    },
    // Get habit streaks and analytics
    getHabitStreaks: async (req, res) => {
        let connection;
        try {
            const habitId = req.params.id;
            const userId = req.user.id;

            console.log(`[DEBUG] getHabitStreaks called with habitId: ${habitId}, userId: ${userId}`);

            connection = await pool.getConnection();

            // Get basic habit info with current streak data
            const [habitData] = await connection.execute(`
                SELECT 
                    h.id,
                    h.name,
                    h.description,
                    h.frequency_type,
                    h.target_count,
                    c.name as category_name,
                    COALESCE(s.current_streak, 0) as current_streak,
                    COALESCE(s.longest_streak, 0) as longest_streak,
                    s.last_completed_date
                FROM habits h
                JOIN categories c ON h.category_id = c.id
                LEFT JOIN streaks s ON h.id = s.habit_id
                WHERE h.id = ? AND h.user_id = ?
            `, [habitId, userId]);

            console.log(`[DEBUG] habitData query result:`, habitData.length, 'rows');
            console.log(`[DEBUG] habitData:`, habitData);

            if (habitData.length === 0) {
                console.log(`[DEBUG] Habit not found for habitId: ${habitId}, userId: ${userId}`);
                return res.status(404).json(responseFormatter.error('Habit not found', null, 404));
            }

            const habit = habitData[0];

            // Get streak history (last 30 days of logs to show streak pattern)
            const [streakHistory] = await connection.execute(`
                SELECT 
                    hl.date,
                    hl.is_completed,
                    hl.completed_count
                FROM habit_logs hl
                WHERE hl.habit_id = ? AND hl.user_id = ?
                AND hl.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                ORDER BY hl.date ASC
            `, [habitId, userId]);

            // Calculate streak analytics
            const [streakAnalytics] = await connection.execute(`
                SELECT 
                    COUNT(DISTINCT hl.date) as total_logged_days,
                    COUNT(CASE WHEN hl.is_completed = TRUE THEN 1 END) as completed_days,
                    ROUND(
                        COUNT(CASE WHEN hl.is_completed = TRUE THEN 1 END) * 100.0 / 
                        NULLIF(COUNT(DISTINCT hl.date), 0), 
                        2
                    ) as success_rate,
                    MIN(hl.date) as first_log_date,
                    MAX(hl.date) as last_log_date
                FROM habit_logs hl
                WHERE hl.habit_id = ? AND hl.user_id = ?
            `, [habitId, userId]);

            // Get recent streak breaks - simplified query
            const [streakBreaks] = await connection.execute(`
                SELECT 
                    hl.date
                FROM habit_logs hl
                WHERE hl.habit_id = ? AND hl.user_id = ?
                AND hl.date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
                AND hl.is_completed = FALSE
                ORDER BY hl.date DESC
                LIMIT 5
            `, [habitId, userId]);

            const result = {
                habit: {
                    id: habit.id,
                    name: habit.name,
                    description: habit.description,
                    frequency_type: habit.frequency_type,
                    target_count: habit.target_count,
                    category_name: habit.category_name
                },
                current_streak: habit.current_streak,
                longest_streak: habit.longest_streak,
                last_completed_date: habit.last_completed_date,
                analytics: streakAnalytics[0] || {
                    total_logged_days: 0,
                    completed_days: 0,
                    success_rate: 0,
                    first_log_date: null,
                    last_log_date: null
                },
                recent_streak_breaks: streakBreaks || [],
                streak_history: streakHistory || []
            };

            res.status(200).json(responseFormatter.success(
                result,
                'Habit streaks retrieved successfully'
            ));

        } catch (error) {
            console.error('Get habit streaks error:', error.message);
            console.error('Error details:', error);
            res.status(500).json(responseFormatter.error('Failed to get habit streaks'));
        } finally {
            if (connection) connection.release();
        }
    },
    // Get habit statistics
    getHabitStatistics: async (req, res) => {
        let connection;
        try {
            const userId = req.user.id;
            const { start_date, end_date } = req.query;

            connection = await pool.getConnection();

            let dateFilter = '';
            let dateParams = [];

            if (start_date && end_date) {
                dateFilter = 'AND hl.date BETWEEN ? AND ?';
                dateParams = [start_date, end_date];
            } else if (start_date) {
                dateFilter = 'AND hl.date >= ?';
                dateParams = [start_date];
            } else if (end_date) {
                dateFilter = 'AND hl.date <= ?';
                dateParams = [end_date];
            }

            const [stats] = await connection.execute(`
                SELECT 
                    COUNT(DISTINCT h.id) as total_habits,
                    COUNT(DISTINCT CASE WHEN h.is_active = TRUE THEN h.id END) as active_habits,
                    COUNT(DISTINCT hl.date) as total_logged_days,
                    COALESCE(COUNT(CASE WHEN hl.is_completed = TRUE THEN 1 END), 0) as total_completions,
                    COALESCE(
                        ROUND(
                            COUNT(CASE WHEN hl.is_completed = TRUE THEN 1 END) * 100.0 / 
                            NULLIF(COUNT(hl.id), 0), 
                            2
                        ), 0
                    ) as overall_completion_rate,
                    COALESCE(MAX(s.longest_streak), 0) as best_streak
                FROM habits h
                LEFT JOIN habit_logs hl ON h.id = hl.habit_id ${dateFilter}
                LEFT JOIN streaks s ON h.id = s.habit_id
                WHERE h.user_id = ?
            `, [...dateParams, userId]);

            res.status(200).json(responseFormatter.success(
                stats[0],
                'Statistics retrieved successfully'
            ));

        } catch (error) {
            console.error('Get habit statistics error:', error.message);
            console.error('Error details:', error);
            res.status(500).json(responseFormatter.error('Failed to get statistics'));
        } finally {
            if (connection) connection.release();
        }
    }
};

module.exports = habitController;