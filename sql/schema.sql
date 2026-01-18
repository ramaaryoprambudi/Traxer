-- Habit Tracker Database Schema
-- Buat database jika belum ada
CREATE DATABASE IF NOT EXISTS habit_tracker;
USE habit_tracker;

-- Tabel Users untuk menyimpan data user
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Categories untuk kategori habit
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert kategori default
INSERT INTO categories (name, description) VALUES
('Akademik', 'Habit yang berkaitan dengan akademik dan pembelajaran'),
('Kesehatan', 'Habit yang berkaitan dengan kesehatan fisik dan mental'),
('Personal', 'Habit untuk pengembangan personal dan produktivitas');

-- Tabel Habits untuk menyimpan data habit
CREATE TABLE habits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    frequency_type ENUM('daily', 'weekly') DEFAULT 'daily',
    active_days JSON, -- Array hari aktif untuk weekly: [1,2,3,4,5] (1=Senin, 7=Minggu)
    target_count INT DEFAULT 1, -- Target per hari/minggu
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Tabel Habit Logs untuk tracking habit yang sudah dilakukan
CREATE TABLE habit_logs (
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
);

-- Tabel Streaks untuk menyimpan informasi streak
CREATE TABLE streaks (
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
);

-- Indexes untuk performa query yang lebih baik
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_category_id ON habits(category_id);
CREATE INDEX idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_user_id ON habit_logs(user_id);
CREATE INDEX idx_habit_logs_date ON habit_logs(date);
CREATE INDEX idx_streaks_habit_id ON streaks(habit_id);
CREATE INDEX idx_streaks_user_id ON streaks(user_id);

-- View untuk mendapatkan statistik habit
CREATE VIEW habit_statistics AS
SELECT 
    h.id as habit_id,
    h.user_id,
    h.name as habit_name,
    h.category_id,
    c.name as category_name,
    COUNT(hl.id) as total_logs,
    COUNT(CASE WHEN hl.is_completed = TRUE THEN 1 END) as completed_days,
    ROUND(
        (COUNT(CASE WHEN hl.is_completed = TRUE THEN 1 END) * 100.0 / 
        NULLIF(COUNT(hl.id), 0)), 2
    ) as completion_percentage,
    s.current_streak,
    s.longest_streak,
    h.created_at as habit_created_at
FROM habits h
LEFT JOIN habit_logs hl ON h.id = hl.habit_id
LEFT JOIN categories c ON h.category_id = c.id
LEFT JOIN streaks s ON h.id = s.habit_id
WHERE h.is_active = TRUE
GROUP BY h.id, h.user_id, h.name, h.category_id, c.name, s.current_streak, s.longest_streak, h.created_at;

-- View untuk kalender aktivitas
CREATE VIEW habit_calendar AS
SELECT 
    hl.user_id,
    hl.date,
    COUNT(hl.id) as total_habits,
    COUNT(CASE WHEN hl.is_completed = TRUE THEN 1 END) as completed_habits,
    ROUND(
        (COUNT(CASE WHEN hl.is_completed = TRUE THEN 1 END) * 100.0 / 
        NULLIF(COUNT(hl.id), 0)), 2
    ) as daily_completion_rate
FROM habit_logs hl
GROUP BY hl.user_id, hl.date
ORDER BY hl.date DESC;