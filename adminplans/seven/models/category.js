// models/category.js
const db = require('../utils/dbutils');
const path = require('path');
const fs = require('fs');

class Category {
    static async createCategory(categoryName, vehicleTypeId, imagePath = null, authorName) {
        try {
            const [authorRows] = await db.execute(
                `SELECT user_id FROM usertable WHERE name = ? LIMIT 1`,
                [authorName]
            );

            if (!authorRows || authorRows.length === 0) {
                throw new Error('Author not found.');
            }
            const authorId = authorRows[0].user_id;

            const [result] = await db.execute(
                `INSERT INTO categories (name, image_path, vehicle_type_id, author_id, created_at)
                 VALUES (?, ?, ?, ?, NOW())`,
                [categoryName, imagePath, vehicleTypeId, authorId]
            );

            return result.insertId;
        } catch (error) {
            console.error('Error in createCategory:', error.message);
            throw error;
        }
    }

    static async getAllCategories() {
        try {
            const [rows] = await db.execute(`
                SELECT 
                    c.category_id,
                    c.name,
                    c.image_path,
                    c.vehicle_type_id,
                    v.vehicle_type_name,
                    u.name AS author_name
                FROM categories c
                JOIN vehicletype v ON c.vehicle_type_id = v.vehicle_type_id
                JOIN usertable u ON c.author_id = u.user_id
                ORDER BY c.created_at DESC
            `);
            return rows;
        } catch (error) {
            console.error('Error in getAllCategories:', error.message);
            throw error;
        }
    }

    static async getCategoryById(id) {
        const [rows] = await db.execute(
            `SELECT c.*, v.vehicle_type_name, u.name AS author_name
             FROM categories c
             JOIN vehicletype v ON c.vehicle_type_id = v.vehicle_type_id
             JOIN usertable u ON c.author_id = u.user_id
             WHERE c.category_id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    static async getCategoriesByVehicleType(vehicle_type_id) {
        const [rows] = await db.execute(
            `SELECT c.*, v.vehicle_type_name, u.name AS author_name
             FROM categories c
             JOIN vehicletype v ON c.vehicle_type_id = v.vehicle_type_id
             JOIN usertable u ON c.author_id = u.user_id
             WHERE c.vehicle_type_id = ?
             ORDER BY c.name ASC`,
            [vehicle_type_id]
        );
        return rows;
    }

    static async updateCategory(id, categoryName, vehicleTypeId, imagePath = null, authorName) {
        try {
            const [authorRows] = await db.execute(
                `SELECT user_id FROM usertable WHERE name = ? LIMIT 1`,
                [authorName]
            );
            if (!authorRows || authorRows.length === 0) throw new Error('Author not found.');
            const authorId = authorRows[0].user_id;

            let oldImagePath = null;
            if (imagePath) {
                const [oldRows] = await db.execute(`SELECT image_path FROM categories WHERE category_id = ?`, [id]);
                if (oldRows[0]?.image_path) oldImagePath = oldRows[0].image_path;
            }

            if (imagePath) {
                await db.execute(
                    `UPDATE categories SET name = ?, image_path = ?, vehicle_type_id = ?, author_id = ?, created_at = NOW() WHERE category_id = ?`,
                    [categoryName, imagePath, vehicleTypeId, authorId, id]
                );
            } else {
                await db.execute(
                    `UPDATE categories SET name = ?, vehicle_type_id = ?, author_id = ?, created_at = NOW() WHERE category_id = ?`,
                    [categoryName, vehicleTypeId, authorId, id]
                );
            }

            if (imagePath && oldImagePath) {
                const filePath = path.join(__dirname, '../public', oldImagePath);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Error in updateCategory:', error.message);
            throw error;
        }
    }

    static async deleteCategory(id) {
        try {
            const [rows] = await db.execute(`SELECT image_path FROM categories WHERE category_id = ?`, [id]);
            await db.execute(`DELETE FROM categories WHERE category_id = ?`, [id]);

            if (rows[0]?.image_path) {
                const filePath = path.join(__dirname, '../public', rows[0].image_path);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Error in deleteCategory:', error.message);
            throw error;
        }
    }
}

module.exports = Category;