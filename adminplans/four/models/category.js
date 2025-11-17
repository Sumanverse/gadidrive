const db = require('../utils/dbutils');
const path = require('path');
const fs = require('fs');

class Category {
    // CREATE Category
    static async createCategory(categoryName, vehicleTypeId, imagePath = null, authorName) {
        try {
            // Map authorName to author_id (assuming author_id is user_id from usertable)
            const [author] = await db.execute(
                `SELECT user_id FROM usertable WHERE name = ?`,
                [authorName]
            );
            if (!author[0]) {
                throw new Error('Author not found.');
            }
            const authorId = author[0].user_id;

            const [result] = await db.execute(
                `INSERT INTO categories (name, image_path, vehicle_type_id, author_id, created_at)
                 VALUES (?, ?, ?, ?, NOW())`,
                [categoryName, imagePath, vehicleTypeId, authorId]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating category:', error);
            throw error; // Re-throw to be handled by controller
        }
    }

    // GET ALL Categories
    static async getAllCategories() {
        const [rows] = await db.execute(`
            SELECT c.category_id, c.name, c.image_path, c.vehicle_type_id, v.vechicle_type_name, c.author_id, u.name AS author_name, c.created_at
            FROM categories c
            JOIN vechicletype v ON c.vehicle_type_id = v.vechicle_type_id
            JOIN usertable u ON c.author_id = u.user_id
            ORDER BY c.created_at DESC
        `);
        return rows;
    }

    // GET Category by ID
    static async getCategoryById(id) {
        const [rows] = await db.execute(
            `SELECT c.category_id, c.name, c.image_path, c.vehicle_type_id, v.vechicle_type_name, c.author_id, u.name AS author_name, c.created_at
             FROM categories c
             JOIN vechicletype v ON c.vehicle_type_id = v.vechicle_type_id
             JOIN usertable u ON c.author_id = u.user_id
             WHERE c.category_id = ?`,
            [id]
        );
        return rows[0];
    }

    // GET Categories by Vehicle Type
    static async getCategoriesByVehicleType(vehicle_type_id) {
        const [rows] = await db.execute(
            `SELECT c.category_id, c.name, c.image_path, c.vehicle_type_id, v.vechicle_type_name, c.author_id, u.name AS author_name, c.created_at
             FROM categories c
             JOIN vechicletype v ON c.vehicle_type_id = v.vechicle_type_id
             JOIN usertable u ON c.author_id = u.user_id
             WHERE c.vehicle_type_id = ?`,
            [vehicle_type_id]
        );
        return rows;
    }

    // UPDATE Category
    static async updateCategory(id, categoryName, vehicleTypeId, imagePath = null, authorName) {
        try {
            const [author] = await db.execute(
                `SELECT user_id FROM usertable WHERE name = ?`,
                [authorName]
            );
            if (!author[0]) {
                throw new Error('Author not found.');
            }
            const authorId = author[0].user_id;

            if (imagePath) {
                const [oldCategory] = await db.execute(`SELECT image_path FROM categories WHERE category_id = ?`, [id]);
                if (oldCategory[0]?.image_path) {
                    const filePath = path.join(__dirname, '../public/uploads/categories', path.basename(oldCategory[0].image_path));
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }
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
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    }

    // DELETE Category
    static async deleteCategory(id) {
        try {
            const [category] = await db.execute(`SELECT image_path FROM categories WHERE category_id = ?`, [id]);
            if (category[0]?.image_path) {
                const filePath = path.join(__dirname, '../public/uploads/categories', path.basename(category[0].image_path));
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            await db.execute(`DELETE FROM categories WHERE category_id = ?`, [id]);
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    }
}

module.exports = Category;