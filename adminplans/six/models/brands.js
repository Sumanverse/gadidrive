// models/brands.js
const db = require('../utils/dbutils');
const path = require('path');
const fs = require('fs');

class Brand {
    static async createBrand(brandName, vehicleTypeId, imagePath = null, authorName) {
        try {
            const [author] = await db.execute(
                `SELECT user_id FROM usertable WHERE name = ?`,
                [authorName]
            );
            if (!author[0]) {
                throw new Error('Author not found. Check usertable for ' + authorName);
            }
            const authorId = author[0].user_id;

            const [existing] = await db.execute(
                `SELECT brand_id FROM brands WHERE name = ? AND vehicle_type_id = ?`,
                [brandName, vehicleTypeId]
            );
            if (existing.length > 0) {
                throw new Error(`Brand "${brandName}" already exists for this vehicle type!`);
            }

            const [result] = await db.execute(
                `INSERT INTO brands (name, image_path, vehicle_type_id, author_id, created_at)
                 VALUES (?, ?, ?, ?, NOW())`,
                [brandName, imagePath, vehicleTypeId, authorId]
            );
            console.log('Insert result:', result); // Debug insert
            return result.insertId;
        } catch (error) {
            console.error('Error creating brand:', error);
            throw error;
        }
    }

    static async getAllBrands() {
        try {
            const [rows] = await db.execute(`
                SELECT b.brand_id, b.name, b.image_path, b.vehicle_type_id, v.vechicle_type_name, b.author_id, u.name AS author_name, b.created_at
                FROM brands b
                JOIN vechicletype v ON b.vehicle_type_id = v.vechicle_type_id
                JOIN usertable u ON b.author_id = u.user_id
                ORDER BY b.created_at DESC
            `);
            console.log('Fetched all brands:', rows); // Debug
            return rows;
        } catch (error) {
            console.error('Error fetching all brands:', error);
            throw error;
        }
    }

    static async getBrandById(id) {
        try {
            const [rows] = await db.execute(
                `SELECT b.brand_id, b.name, b.image_path, b.vehicle_type_id, v.vechicle_type_name, b.author_id, u.name AS author_name, b.created_at
                 FROM brands b
                 JOIN vechicletype v ON b.vehicle_type_id = v.vechicle_type_id
                 JOIN usertable u ON b.author_id = u.user_id
                 WHERE b.brand_id = ?`,
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error fetching brand by ID:', error);
            throw error;
        }
    }

    static async updateBrand(id, brandName, vehicleTypeId, imagePath = null, authorName) {
        try {
            const [author] = await db.execute(
                `SELECT user_id FROM usertable WHERE name = ?`,
                [authorName]
            );
            if (!author[0]) {
                throw new Error('Author not found.');
            }
            const authorId = author[0].user_id;

            const [existing] = await db.execute(
                `SELECT brand_id FROM brands WHERE name = ? AND vehicle_type_id = ? AND brand_id != ?`,
                [brandName, vehicleTypeId, id]
            );
            if (existing.length > 0) {
                throw new Error(`Brand "${brandName}" already exists for this vehicle type!`);
            }

            if (imagePath) {
                const [oldBrand] = await db.execute(`SELECT image_path FROM brands WHERE brand_id = ?`, [id]);
                if (oldBrand[0]?.image_path) {
                    const filePath = path.join(__dirname, '../public', oldBrand[0].image_path);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }
                await db.execute(
                    `UPDATE brands SET name = ?, image_path = ?, vehicle_type_id = ?, author_id = ?, created_at = NOW() WHERE brand_id = ?`,
                    [brandName, imagePath, vehicleTypeId, authorId, id]
                );
            } else {
                await db.execute(
                    `UPDATE brands SET name = ?, vehicle_type_id = ?, author_id = ?, created_at = NOW() WHERE brand_id = ?`,
                    [brandName, vehicleTypeId, authorId, id]
                );
            }
        } catch (error) {
            console.error('Error updating brand:', error);
            throw error;
        }
    }

    static async deleteBrand(id) {
        try {
            const [brand] = await db.execute(`SELECT image_path FROM brands WHERE brand_id = ?`, [id]);
            if (brand[0]?.image_path) {
                const filePath = path.join(__dirname, '../public', brand[0].image_path);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            await db.execute(`DELETE FROM brands WHERE brand_id = ?`, [id]);
        } catch (error) {
            console.error('Error deleting brand:', error);
            throw error;
        }
    }
}

module.exports = Brand;