const { pool } = require('../config/database');
const { responseFormatter, calculatePagination, dateUtils } = require('../utils/helpers');

const logController = {
    // Create or update habit log
    logHabit: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const userId = req.user.id;
            const { habit_id, date, completed_count = 1, is_completed = true, notes = '' } = req.body;

            // Validate habit belongs to user
            const [habits] = await connection.execute(`
                SELECT h.*, s.current_streak, s.longest_streak, s.last_completed_date
                FROM habits h
                LEFT JOIN streaks s ON h.id = s.habit_id
                WHERE h.id = ? AND h.user_id = ? AND h.is_active = TRUE
            `, [habit_id, userId]);

            if (habits.length === 0) {
                await connection.rollback();
                return res.status(404).json(responseFormatter.error('Habit not found or inactive', null, 404));
            }

            const habit = habits[0];

            // Check if it's a valid day for weekly habits
            if (habit.frequency_type === 'weekly' && habit.active_days) {
                const dayOfWeek = dateUtils.getDayOfWeek(date);
                const activeDays = JSON.parse(habit.active_days);
                
                if (!activeDays.includes(dayOfWeek)) {
                    await connection.rollback();
                    return res.status(400).json(responseFormatter.error('This habit is not active on this day', null, 400));
                }
            }

            // Insert or update habit log
            await connection.execute(`
                INSERT INTO habit_logs (habit_id, user_id, date, completed_count, is_completed, notes)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                completed_count = VALUES(completed_count),
                is_completed = VALUES(is_completed),
                notes = VALUES(notes),
                updated_at = CURRENT_TIMESTAMP
            `, [habit_id, userId, date, completed_count, is_completed, notes]);

            // Update streak if habit is marked as completed
            if (is_completed) {
                await updateStreak(connection, habit_id, userId, date, habit.last_completed_date, habit.current_streak, habit.longest_streak);
            }

            await connection.commit();

            // Get updated log
            const [logs] = await pool.execute(`
                SELECT 
                    hl.*,
                    h.name as habit_name,
                    h.target_count
                FROM habit_logs hl
                JOIN habits h ON hl.habit_id = h.id
                WHERE hl.habit_id = ? AND hl.user_id = ? AND hl.date = ?
            `, [habit_id, userId, date]);

            res.status(200).json(responseFormatter.success(
                logs[0],
                'Habit logged successfully'
            ));

        } catch (error) {
            await connection.rollback();
            console.error('Log habit error:', error);
            res.status(500).json(responseFormatter.error('Failed to log habit'));
        } finally {
            connection.release();
        }
    },

    // Get habit logs
    getHabitLogs: async (req, res) => {
        try {
            const userId = req.user.id;
            const { 
                habit_id, 
                date, 
                start_date, 
                end_date, 
                page = 1, 
                limit = 20 
            } = req.query;

            // Build query conditions
            let whereConditions = ['hl.user_id = ?'];
            let queryParams = [userId];

            if (habit_id) {
                whereConditions.push('hl.habit_id = ?');
                queryParams.push(habit_id);
            }

            if (date) {
                whereConditions.push('hl.date = ?');
                queryParams.push(date);
            } else if (start_date || end_date) {
                if (start_date && end_date) {
                    whereConditions.push('hl.date BETWEEN ? AND ?');
                    queryParams.push(start_date, end_date);
                } else if (start_date) {
                    whereConditions.push('hl.date >= ?');
                    queryParams.push(start_date);
                } else if (end_date) {
                    whereConditions.push('hl.date <= ?');
                    queryParams.push(end_date);
                }
            }

            const whereClause = whereConditions.join(' AND ');

            // Get total count
            const [countResult] = await pool.execute(`
                SELECT COUNT(*) as total 
                FROM habit_logs hl 
                WHERE ${whereClause}
            `, queryParams);

            const totalCount = countResult[0].total;
            const pagination = calculatePagination(page, limit, totalCount);

            // Get logs with pagination
            const [logs] = await pool.execute(`
                SELECT 
                    hl.*,
                    h.name as habit_name,
                    h.target_count,
                    c.name as category_name
                FROM habit_logs hl
                JOIN habits h ON hl.habit_id = h.id
                JOIN categories c ON h.category_id = c.id
                WHERE ${whereClause}
                ORDER BY hl.date DESC, hl.created_at DESC
                LIMIT ${parseInt(pagination.itemsPerPage)} OFFSET ${parseInt(pagination.offset)}
            `, queryParams);

            res.status(200).json(responseFormatter.paginated(
                logs,
                pagination,
                'Habit logs retrieved successfully'
            ));

        } catch (error) {
            console.error('Get habit logs error:', error);
            res.status(500).json(responseFormatter.error('Failed to get habit logs'));
        }
    },

    // Get today's habits with completion status
    getTodaysHabits: async (req, res) => {
        try {
            const userId = req.user.id;
            const today = dateUtils.getCurrentDate();
            const todayDayOfWeek = dateUtils.getDayOfWeek(today);

            const [habits] = await pool.execute(`
                SELECT 
                    h.id,
                    h.name,
                    h.description,
                    h.category_id,
                    c.name as category_name,
                    h.frequency_type,
                    h.active_days,
                    h.target_count,
                    COALESCE(hl.completed_count, 0) as completed_count,
                    COALESCE(hl.is_completed, FALSE) as is_completed,
                    hl.notes,
                    s.current_streak
                FROM habits h
                JOIN categories c ON h.category_id = c.id
                LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.date = ?
                LEFT JOIN streaks s ON h.id = s.habit_id
                WHERE h.user_id = ? 
                AND h.is_active = TRUE
                AND (
                    h.frequency_type = 'daily' 
                    OR (h.frequency_type = 'weekly' AND JSON_CONTAINS(h.active_days, CAST(? AS JSON)))
                )
                ORDER BY c.name, h.name
            `, [today, userId, todayDayOfWeek]);

            const summary = {
                total_habits: habits.length,
                completed_habits: habits.filter(h => h.is_completed).length,
                pending_habits: habits.filter(h => !h.is_completed).length,
                completion_rate: habits.length > 0 
                    ? Math.round((habits.filter(h => h.is_completed).length / habits.length) * 100)
                    : 0
            };

            res.status(200).json(responseFormatter.success(
                {
                    date: today,
                    summary,
                    habits
                },
                "Today's habits retrieved successfully"
            ));

        } catch (error) {
            console.error("Get today's habits error:", error);
            res.status(500).json(responseFormatter.error("Failed to get today's habits"));
        }
    },

    // Get habit calendar/history
    getHabitCalendar: async (req, res) => {
        try {
            const userId = req.user.id;
            const { start_date, end_date, habit_id } = req.query;

            let whereConditions = ['hl.user_id = ?'];
            let queryParams = [userId];

            if (habit_id) {
                whereConditions.push('hl.habit_id = ?');
                queryParams.push(habit_id);
            }

            if (start_date && end_date) {
                whereConditions.push('hl.date BETWEEN ? AND ?');
                queryParams.push(start_date, end_date);
            } else {
                // Default to last 30 days
                const dateRange = dateUtils.getDateRange(30);
                whereConditions.push('hl.date BETWEEN ? AND ?');
                queryParams.push(dateRange.start, dateRange.end);
            }

            const whereClause = whereConditions.join(' AND ');

            const [calendarData] = await pool.execute(`
                SELECT 
                    hl.date,
                    COUNT(hl.id) as total_habits,
                    COUNT(CASE WHEN hl.is_completed = TRUE THEN 1 END) as completed_habits,
                    ROUND(
                        COUNT(CASE WHEN hl.is_completed = TRUE THEN 1 END) * 100.0 / 
                        COUNT(hl.id), 2
                    ) as completion_rate,
                    GROUP_CONCAT(
                        CONCAT(h.name, ':', hl.is_completed)
                        ORDER BY h.name
                    ) as habit_details
                FROM habit_logs hl
                JOIN habits h ON hl.habit_id = h.id
                WHERE ${whereClause}
                GROUP BY hl.date
                ORDER BY hl.date ASC
            `, queryParams);

            res.status(200).json(responseFormatter.success(
                calendarData,
                'Habit calendar retrieved successfully'
            ));

        } catch (error) {
            console.error('Get habit calendar error:', error);
            res.status(500).json(responseFormatter.error('Failed to get habit calendar'));
        }
    },

    // Delete habit log
    deleteHabitLog: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const logId = req.params.id;
            const userId = req.user.id;

            // Check if log exists and belongs to user
            const [logs] = await connection.execute(`
                SELECT hl.*, h.id as habit_id
                FROM habit_logs hl
                JOIN habits h ON hl.habit_id = h.id
                WHERE hl.id = ? AND hl.user_id = ?
            `, [logId, userId]);

            if (logs.length === 0) {
                await connection.rollback();
                return res.status(404).json(responseFormatter.error('Habit log not found', null, 404));
            }

            const log = logs[0];

            // Delete the log
            await connection.execute('DELETE FROM habit_logs WHERE id = ?', [logId]);

            // Recalculate streak for this habit
            await recalculateStreak(connection, log.habit_id, userId);

            await connection.commit();

            res.status(200).json(responseFormatter.success(
                null,
                'Habit log deleted successfully'
            ));

        } catch (error) {
            await connection.rollback();
            console.error('Delete habit log error:', error);
            res.status(500).json(responseFormatter.error('Failed to delete habit log'));
        } finally {
            connection.release();
        }
    }
};

// Helper function to update streak
async function updateStreak(connection, habitId, userId, currentDate, lastCompletedDate, currentStreak, longestStreak) {
    const today = new Date(currentDate);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let newCurrentStreak = 1;

    if (lastCompletedDate) {
        const lastDate = new Date(lastCompletedDate);
        const daysDifference = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

        if (daysDifference === 1) {
            // Consecutive day
            newCurrentStreak = currentStreak + 1;
        } else if (daysDifference === 0) {
            // Same day, don't reset streak
            newCurrentStreak = currentStreak;
        }
        // else: gap in days, streak resets to 1
    }

    const newLongestStreak = Math.max(newCurrentStreak, longestStreak);

    await connection.execute(`
        UPDATE streaks 
        SET current_streak = ?, longest_streak = ?, last_completed_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE habit_id = ? AND user_id = ?
    `, [newCurrentStreak, newLongestStreak, currentDate, habitId, userId]);
}

// Helper function to recalculate streak
async function recalculateStreak(connection, habitId, userId) {
    // Get all completed logs for this habit, ordered by date
    const [logs] = await connection.execute(`
        SELECT date FROM habit_logs 
        WHERE habit_id = ? AND user_id = ? AND is_completed = TRUE
        ORDER BY date DESC
    `, [habitId, userId]);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;
    let lastCompletedDate = null;

    if (logs.length > 0) {
        lastCompletedDate = logs[0].date;
        
        for (let i = 0; i < logs.length; i++) {
            const logDate = new Date(logs[i].date);
            
            if (i === 0) {
                tempStreak = 1;
                if (i === 0) currentStreak = 1; // First is always current
            } else {
                const daysDiff = Math.floor((lastDate - logDate) / (1000 * 60 * 60 * 24));
                
                if (daysDiff === 1) {
                    tempStreak++;
                    if (i < logs.length - 1) currentStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                    if (i === 1) currentStreak = 1; // Reset current if gap at beginning
                }
            }
            
            lastDate = logDate;
        }
        
        longestStreak = Math.max(longestStreak, tempStreak);
    }

    await connection.execute(`
        UPDATE streaks 
        SET current_streak = ?, longest_streak = ?, last_completed_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE habit_id = ? AND user_id = ?
    `, [currentStreak, longestStreak, lastCompletedDate, habitId, userId]);
}

module.exports = logController;