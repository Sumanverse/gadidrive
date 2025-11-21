const db = require('../utils/dbutils');
const path = require('path');
const fs = require('fs');

class Brand {
    static async createBrand(brandName, vehicleTypeId, imagePath = null, authorName) {
        const [author] = await db.execute('SELECT user_id FROM usertable WHERE name = ?', [authorName]);
        if (!author[0]) throw new Error('Author not found.');

        const [existing] = await db.execute(
            'SELECT brand_id FROM brands WHERE name = ? AND vehicle_type_id = ?',
            [brandName, vehicleTypeId]
        );
        if (existing.length > 0) throw new Error(`Brand "${brandName}" already exists!`);

        const [result] = await db.execute(
            'INSERT INTO brands (name, image_path, vehicle_type_id, author_id, created_at) VALUES (?, ?, ?, ?, NOW())',
            [brandName, imagePath, vehicleTypeId, author[0].user_id]
        );
        return result.insertId;
    }

    static async getAllBrands() {
        const [rows] = await db.execute(`
            SELECT b.brand_id, b.name, b.image_path, b.vehicle_type_id, 
                   v.vehicle_type_name, u.name AS author_name
            FROM brands b
            JOIN vehicletype v ON b.vehicle_type_id = v.vehicle_type_id
            JOIN usertable u ON b.author_id = u.user_id
            ORDER BY b.created_at DESC
        `);
        return rows;
    }

    // Get brands by vehicle type
    static async getBrandsByVehicleType(vehicleTypeId) {
        const [rows] = await db.execute(`
            SELECT b.brand_id, b.name, b.image_path, b.vehicle_type_id, 
                   v.vehicle_type_name, u.name AS author_name
            FROM brands b
            JOIN vehicletype v ON b.vehicle_type_id = v.vehicle_type_id
            JOIN usertable u ON b.author_id = u.user_id
            WHERE b.vehicle_type_id = ?
            ORDER BY b.name ASC
        `, [vehicleTypeId]);
        return rows;
    }

    static async getBrandById(id) {
        const [rows] = await db.execute(
            `SELECT b.*, v.vehicle_type_name, u.name AS author_name
             FROM brands b
             JOIN vehicletype v ON b.vehicle_type_id = v.vehicle_type_id
             JOIN usertable u ON b.author_id = u.user_id
             WHERE b.brand_id = ?`, [id]
        );
        return rows[0] || null;
    }

    static async updateBrand(id, brandName, vehicleTypeId, imagePath = null, authorName) {
        const [author] = await db.execute('SELECT user_id FROM usertable WHERE name = ?', [authorName]);
        if (!author[0]) throw new Error('Author not found.');

        const [existing] = await db.execute(
            'SELECT brand_id FROM brands WHERE name = ? AND vehicle_type_id = ? AND brand_id != ?',
            [brandName, vehicleTypeId, id]
        );
        if (existing.length > 0) throw new Error(`Brand "${brandName}" already exists!`);

        if (imagePath) {
            const [old] = await db.execute('SELECT image_path FROM brands WHERE brand_id = ?', [id]);
            if (old[0]?.image_path) {
                const filePath = path.join(__dirname, '../public', old[0].image_path);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            await db.execute(
                'UPDATE brands SET name = ?, image_path = ?, vehicle_type_id = ?, author_id = ?, created_at = NOW() WHERE brand_id = ?',
                [brandName, imagePath, vehicleTypeId, author[0].user_id, id]
            );
        } else {
            await db.execute(
                'UPDATE brands SET name = ?, vehicle_type_id = ?, author_id = ?, created_at = NOW() WHERE brand_id = ?',
                [brandName, vehicleTypeId, author[0].user_id, id]
            );
        }
    }

    static async deleteBrand(id) {
        const [brand] = await db.execute('SELECT image_path FROM brands WHERE brand_id = ?', [id]);
        if (brand[0]?.image_path) {
            const filePath = path.join(__dirname, '../public', brand[0].image_path);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await db.execute('DELETE FROM brands WHERE brand_id = ?', [id]);
    }


}

module.exports = Brand;