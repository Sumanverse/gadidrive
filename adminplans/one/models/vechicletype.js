const { connectDB } = require('../utils/dbutils');

class VehicleType {
    static async create(vehicleData) {
        const connection = await connectDB();
        try {
            const [result] = await connection.execute(
                `INSERT INTO vechicletype (vechicle_type_name, vechicle_type_photo_path, published_date)
                VALUES (?, ?, ?)`,
                [
                    vehicleData.vehicleTypeName,
                    vehicleData.vehicle_type_photo_path || null,
                    new Date()
                ]
            );
            return result.insertId;
        } finally {
            await connection.end();
        }
    }

    static async findAll() {
        const connection = await connectDB();
        try {
            const [rows] = await connection.execute(`SELECT * FROM vechicletype`);
            return rows;
        } finally {
            await connection.end();
        }
    }
}

module.exports = VehicleType;