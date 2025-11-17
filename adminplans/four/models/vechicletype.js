const db = require('../utils/dbutils');
const path = require('path');
const fs = require('fs');

class VehicleType {
    // CREATE Vehicle Type
    static async createVehicleType(vehicleTypeName, vehicle_type_photo_path) {
        // Check if vehicle type already exists
        const [existing] = await db.execute(
            `SELECT vechicle_type_id FROM vechicletype WHERE vechicle_type_name = ?`,
            [vehicleTypeName]
        );
        
        if (existing.length > 0) {
            throw new Error(`Vehicle type "${vehicleTypeName}" already exists!`);
        }
        
        const [result] = await db.execute(
            `INSERT INTO vechicletype (vechicle_type_name, vechicle_type_photo_path, published_date)
             VALUES (?, ?, CURDATE())`,
            [vehicleTypeName, vehicle_type_photo_path]
        );
        return result.insertId;
    }

    // GET ALL Vehicle Types
    static async getAllVehicleTypes() {
        const [rows] = await db.execute(`
            SELECT vechicle_type_id, vechicle_type_name, vechicle_type_photo_path, published_date
            FROM vechicletype 
            ORDER BY published_date DESC
        `);
        return rows;
    }

    // GET Vehicle Type by ID
    static async getVehicleTypeById(id) {
        const [rows] = await db.execute(
            `SELECT * FROM vechicletype WHERE vechicle_type_id = ?`,
            [id]
        );
        return rows[0];
    }

    // UPDATE Vehicle Type
    static async updateVehicleType(id, vehicleTypeName, vehicle_type_photo_path = null) {
        if (vehicle_type_photo_path) {
            await db.execute(
                `UPDATE vechicletype SET vechicle_type_name=?, vechicle_type_photo_path=?, published_date=CURDATE() WHERE vechicle_type_id=?`,
                [vehicleTypeName, vehicle_type_photo_path, id]
            );
        } else {
            await db.execute(
                `UPDATE vechicletype SET vechicle_type_name=?, published_date=CURDATE() WHERE vechicle_type_id=?`,
                [vehicleTypeName, id]
            );
        }
    }

    // DELETE Vehicle Type
    static async deleteVehicleType(id) {
        const [vehicle] = await db.execute(`SELECT vechicle_type_photo_path FROM vechicletype WHERE vechicle_type_id = ?`, [id]);
        if (vehicle[0]?.vechicle_type_photo_path) {
            const filePath = path.join(__dirname, '../public/uploads/vehicle-types', path.basename(vehicle[0].vechicle_type_photo_path));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await db.execute(`DELETE FROM vechicletype WHERE vechicle_type_id = ?`, [id]);
    }
}

module.exports = VehicleType;