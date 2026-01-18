const { pool } = require('../config/database');
const { responseFormatter } = require('../utils/helpers');

const categoryController = {
    // Get all categories
    getCategories: async (req, res) => {
        try {
            const [categories] = await pool.execute(`
                SELECT 
                    c.*,
                    COUNT(h.id) as habit_count
                FROM categories c
                LEFT JOIN habits h ON c.id = h.category_id AND h.is_active = TRUE
                GROUP BY c.id, c.name, c.description, c.created_at
                ORDER BY c.name ASC
            `);

            res.status(200).json(responseFormatter.success(
                categories,
                'Categories retrieved successfully'
            ));

        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json(responseFormatter.error('Failed to get categories'));
        }
    },

    // Get category by ID with habits
    getCategoryById: async (req, res) => {
        try {
            const categoryId = req.params.id;

            const [categories] = await pool.execute(`
                SELECT 
                    c.*,
                    COUNT(h.id) as habit_count,
                    COUNT(CASE WHEN h.is_active = TRUE THEN h.id END) as active_habit_count
                FROM categories c
                LEFT JOIN habits h ON c.id = h.category_id
                WHERE c.id = ?
                GROUP BY c.id, c.name, c.description, c.created_at
            `, [categoryId]);

            if (categories.length === 0) {
                return res.status(404).json(responseFormatter.error('Category not found', null, 404));
            }

            res.status(200).json(responseFormatter.success(
                categories[0],
                'Category retrieved successfully'
            ));

        } catch (error) {
            console.error('Get category by ID error:', error);
            res.status(500).json(responseFormatter.error('Failed to get category'));
        }
    },

    // Create new category
    createCategory: async (req, res) => {
        try {
            const { name, description } = req.body;

            // Validate required fields
            if (!name || name.trim().length === 0) {
                return res.status(400).json(responseFormatter.error('Category name is required'));
            }

            // Check if category already exists
            const [existingCategories] = await pool.execute(
                'SELECT id FROM categories WHERE name = ?',
                [name.trim()]
            );

            if (existingCategories.length > 0) {
                return res.status(409).json(responseFormatter.error('Category name already exists'));
            }

            // Create category
            const [result] = await pool.execute(
                'INSERT INTO categories (name, description) VALUES (?, ?)',
                [name.trim(), description ? description.trim() : null]
            );

            // Get the created category
            const [newCategory] = await pool.execute(
                'SELECT * FROM categories WHERE id = ?',
                [result.insertId]
            );

            res.status(201).json(responseFormatter.success(
                newCategory[0],
                'Category created successfully'
            ));

        } catch (error) {
            console.error('Create category error:', error);
            res.status(500).json(responseFormatter.error('Failed to create category'));
        }
    },

    // Update category
    updateCategory: async (req, res) => {
        try {
            const categoryId = req.params.id;
            const { name, description } = req.body;

            // Validate required fields
            if (!name || name.trim().length === 0) {
                return res.status(400).json(responseFormatter.error('Category name is required'));
            }

            // Check if category exists
            const [existingCategories] = await pool.execute(
                'SELECT id FROM categories WHERE id = ?',
                [categoryId]
            );

            if (existingCategories.length === 0) {
                return res.status(404).json(responseFormatter.error('Category not found'));
            }

            // Check if another category with same name exists (excluding current category)
            const [duplicateCategories] = await pool.execute(
                'SELECT id FROM categories WHERE name = ? AND id != ?',
                [name.trim(), categoryId]
            );

            if (duplicateCategories.length > 0) {
                return res.status(409).json(responseFormatter.error('Category name already exists'));
            }

            // Update category
            await pool.execute(
                'UPDATE categories SET name = ?, description = ? WHERE id = ?',
                [name.trim(), description ? description.trim() : null, categoryId]
            );

            // Get the updated category
            const [updatedCategory] = await pool.execute(
                'SELECT * FROM categories WHERE id = ?',
                [categoryId]
            );

            res.status(200).json(responseFormatter.success(
                updatedCategory[0],
                'Category updated successfully'
            ));

        } catch (error) {
            console.error('Update category error:', error);
            res.status(500).json(responseFormatter.error('Failed to update category'));
        }
    },

    // Delete category
    deleteCategory: async (req, res) => {
        try {
            const categoryId = req.params.id;

            // Check if category exists
            const [existingCategories] = await pool.execute(
                'SELECT id FROM categories WHERE id = ?',
                [categoryId]
            );

            if (existingCategories.length === 0) {
                return res.status(404).json(responseFormatter.error('Category not found'));
            }

            // Check if category has active habits
            const [activeHabits] = await pool.execute(
                'SELECT COUNT(*) as count FROM habits WHERE category_id = ? AND is_active = TRUE',
                [categoryId]
            );

            if (activeHabits[0].count > 0) {
                return res.status(400).json(responseFormatter.error(
                    'Cannot delete category with active habits. Please delete or deactivate all habits first.'
                ));
            }

            // Delete category
            await pool.execute('DELETE FROM categories WHERE id = ?', [categoryId]);

            res.status(200).json(responseFormatter.success(
                null,
                'Category deleted successfully'
            ));

        } catch (error) {
            console.error('Delete category error:', error);
            res.status(500).json(responseFormatter.error('Failed to delete category'));
        }
    }
};

module.exports = categoryController;