const db = require('../utils/dbutils');

class VehicleType {
    static async createVehicleType(vehicleTypeName, vehicleImagePath) {
        const [result] = await db.execute(
            `INSERT INTO vehicletype (vehicle_type_name, vehicle_type_photo_path, published_date)
             VALUES (?, ?, CURDATE())`,
            [vehicleTypeName, vehicleImagePath]
        );
        return result.insertId;
    }

    static async getAllVehicleTypes() {
        const [rows] = await db.execute(`
            SELECT vehicle_type_id, vehicle_type_name, vehicle_type_photo_path, published_date
            FROM vehicletype
            ORDER BY published_date DESC
        `);
        return rows;
    }

    static async getVehicleTypeById(id) {
        const [rows] = await db.execute(
            `SELECT vehicle_type_id, vehicle_type_name, vehicle_type_photo_path, published_date
             FROM vehicletype WHERE vehicle_type_id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    static async updateVehicleType(id, vehicleTypeName, vehicleImagePath) {
        let queryParts = ['vehicle_type_name = ?'];
        let params = [vehicleTypeName];

        if (vehicleImagePath) {
            queryParts.push('vehicle_type_photo_path = ?');
            params.push(vehicleImagePath);
        }

        const query = `UPDATE vehicletype SET ${queryParts.join(', ')} WHERE vehicle_type_id = ?`;
        params.push(id);

        const [result] = await db.execute(query, params);
        if (result.affectedRows === 0) {
            throw new Error('No vehicle type found');
        }
    }

    static async deleteVehicleType(id) {
        await db.execute(`DELETE FROM vehicletype WHERE vehicle_type_id = ?`, [id]);
    }
}

module.exports = VehicleType;